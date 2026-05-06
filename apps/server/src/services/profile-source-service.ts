// Module: Extracts profile collection text from supported external sources.
import { inflateRawSync } from "node:zlib"

import type { ProfileSourceContext } from "../schemas/profile-chat"

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

type UrlSourceInput = {
  type: "url"
  url: string
}

type DocxSourceInput = {
  type: "docx"
  file: File
}

export type ProfileSourceInput = UrlSourceInput | DocxSourceInput

const MAX_SOURCE_TEXT_LENGTH = 12_000
const DOCX_DOCUMENT_ENTRY = "word/document.xml"

export class ProfileSourceExtractionError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = "ProfileSourceExtractionError"
  }
}

export class ProfileSourceService {
  constructor(private readonly fetcher: FetchLike = fetch) {}

  async extract(input: ProfileSourceInput): Promise<ProfileSourceContext> {
    if (input.type === "url") {
      return await this.extractUrl(input.url)
    }

    return await this.extractDocx(input.file)
  }

  private async extractUrl(urlValue: string): Promise<ProfileSourceContext> {
    const url = parseHttpUrl(urlValue)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)

    try {
      const response = await this.fetcher(url.toString(), {
        headers: {
          Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
        },
        signal: controller.signal,
      })

      if (!response.ok) {
        throw new ProfileSourceExtractionError(
          "Web sitesi okunamadı. Linkin herkese açık ve erişilebilir olduğundan emin olun."
        )
      }

      const text = normalizeExtractedText(stripHtml(await response.text()))
      if (text === null) {
        throw new ProfileSourceExtractionError(
          "Web sitesinden profil bilgisi olarak kullanılabilecek metin çıkarılamadı."
        )
      }

      return {
        type: "url",
        label: url.toString(),
        content: limitSourceText(text),
      }
    } catch (error) {
      if (error instanceof ProfileSourceExtractionError) {
        throw error
      }

      throw new ProfileSourceExtractionError(
        "Web sitesi okunurken hata oluştu. Linki kontrol edip tekrar deneyin.",
        error instanceof Error ? { cause: error } : undefined
      )
    } finally {
      clearTimeout(timeout)
    }
  }

  private async extractDocx(file: File): Promise<ProfileSourceContext> {
    validateDocxFile(file)

    try {
      const archiveBytes = new Uint8Array(await file.arrayBuffer())
      const documentXml = extractZipEntryText(archiveBytes, DOCX_DOCUMENT_ENTRY)
      const text = normalizeExtractedText(extractWordDocumentText(documentXml))

      if (text === null) {
        throw new ProfileSourceExtractionError(
          "DOCX dosyasından profil bilgisi olarak kullanılabilecek metin çıkarılamadı."
        )
      }

      return {
        type: "docx",
        label: file.name,
        content: limitSourceText(text),
      }
    } catch (error) {
      if (error instanceof ProfileSourceExtractionError) {
        throw error
      }

      throw new ProfileSourceExtractionError(
        "DOCX dosyası okunamadı. Dosyanın geçerli bir Word dokümanı olduğundan emin olun.",
        error instanceof Error ? { cause: error } : undefined
      )
    }
  }
}

function parseHttpUrl(value: string): URL {
  try {
    const url = new URL(value)
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Unsupported protocol")
    }

    return url
  } catch {
    throw new ProfileSourceExtractionError(
      "Geçerli bir HTTP veya HTTPS linki girin."
    )
  }
}

function validateDocxFile(file: File): void {
  if (!file.name.toLocaleLowerCase("tr").endsWith(".docx")) {
    throw new ProfileSourceExtractionError(
      "Yalnızca DOCX dosyası yüklenebilir."
    )
  }

  if (file.size === 0) {
    throw new ProfileSourceExtractionError("DOCX dosyası boş görünüyor.")
  }
}

function stripHtml(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, " ")
      .replace(/<[^>]+>/gu, " ")
  )
}

function extractWordDocumentText(documentXml: string): string {
  const xmlWithParagraphs = documentXml
    .replace(/<\/w:p>/gu, "\n")
    .replace(/<w:tab\s*\/>/gu, "\t")
    .replace(/<w:br\s*\/>/gu, "\n")
  const textMatches = xmlWithParagraphs.matchAll(
    /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/gu
  )

  return Array.from(textMatches, (match) => decodeXmlEntities(match[1] ?? ""))
    .join(" ")
    .replace(/[ \t]+\n/gu, "\n")
}

function extractZipEntryText(
  archiveBytes: Uint8Array,
  entryName: string
): string {
  const entry = findZipEntry(archiveBytes, entryName)
  if (entry === null) {
    throw new ProfileSourceExtractionError(
      "DOCX dosyasında ana belge metni bulunamadı."
    )
  }

  const data =
    entry.compressionMethod === 0
      ? entry.compressedBytes
      : inflateRawSync(entry.compressedBytes)

  return new TextDecoder().decode(data)
}

type ZipEntry = {
  compressionMethod: number
  compressedBytes: Uint8Array
}

function findZipEntry(
  archiveBytes: Uint8Array,
  entryName: string
): ZipEntry | null {
  const view = new DataView(
    archiveBytes.buffer,
    archiveBytes.byteOffset,
    archiveBytes.byteLength
  )
  const centralDirectoryOffset = findCentralDirectoryOffset(view)
  let offset = centralDirectoryOffset

  while (offset + 46 <= archiveBytes.byteLength) {
    if (view.getUint32(offset, true) !== 0x02014b50) {
      break
    }

    const compressionMethod = view.getUint16(offset + 10, true)
    const compressedSize = view.getUint32(offset + 20, true)
    const fileNameLength = view.getUint16(offset + 28, true)
    const extraLength = view.getUint16(offset + 30, true)
    const commentLength = view.getUint16(offset + 32, true)
    const localHeaderOffset = view.getUint32(offset + 42, true)
    const fileNameStart = offset + 46
    const fileNameEnd = fileNameStart + fileNameLength
    const fileName = new TextDecoder().decode(
      archiveBytes.subarray(fileNameStart, fileNameEnd)
    )

    if (fileName === entryName) {
      return readLocalZipEntry(
        archiveBytes,
        view,
        localHeaderOffset,
        compressionMethod,
        compressedSize
      )
    }

    offset = fileNameEnd + extraLength + commentLength
  }

  return null
}

function findCentralDirectoryOffset(view: DataView): number {
  for (let offset = view.byteLength - 22; offset >= 0; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      return view.getUint32(offset + 16, true)
    }
  }

  throw new ProfileSourceExtractionError("DOCX arşiv yapısı okunamadı.")
}

function readLocalZipEntry(
  archiveBytes: Uint8Array,
  view: DataView,
  localHeaderOffset: number,
  compressionMethod: number,
  compressedSize: number
): ZipEntry {
  if (view.getUint32(localHeaderOffset, true) !== 0x04034b50) {
    throw new ProfileSourceExtractionError(
      "DOCX dosyasında bozuk veri bulundu."
    )
  }

  if (compressionMethod !== 0 && compressionMethod !== 8) {
    throw new ProfileSourceExtractionError(
      "DOCX dosyasında desteklenmeyen sıkıştırma yöntemi kullanılmış."
    )
  }

  const fileNameLength = view.getUint16(localHeaderOffset + 26, true)
  const extraLength = view.getUint16(localHeaderOffset + 28, true)
  const dataStart = localHeaderOffset + 30 + fileNameLength + extraLength
  const dataEnd = dataStart + compressedSize

  return {
    compressionMethod,
    compressedBytes: archiveBytes.subarray(dataStart, dataEnd),
  }
}

function normalizeExtractedText(text: string): string | null {
  const normalizedText = text.replace(/\s+/gu, " ").trim()
  return normalizedText.length > 0 ? normalizedText : null
}

function limitSourceText(text: string): string {
  return text.length > MAX_SOURCE_TEXT_LENGTH
    ? text.slice(0, MAX_SOURCE_TEXT_LENGTH)
    : text
}

function decodeXmlEntities(value: string): string {
  return decodeHtmlEntities(value)
}

function decodeHtmlEntities(value: string): string {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  }

  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/giu, (entity, code) => {
    const normalizedCode = String(code).toLocaleLowerCase("en")
    if (normalizedCode.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(normalizedCode.slice(2), 16))
    }

    if (normalizedCode.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(normalizedCode.slice(1), 10))
    }

    return namedEntities[normalizedCode] ?? entity
  })
}
