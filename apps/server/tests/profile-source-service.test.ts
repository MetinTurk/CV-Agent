// Module: Verifies DOCX and URL extraction for profile collection sources.
import { expect, test } from "bun:test"

import { ProfileSourceService } from "../src/services/profile-source-service"

test("profile source service extracts visible text from URL HTML", async () => {
  const service = new ProfileSourceService(async () => {
    return new Response(
      "<html><head><style>.x{}</style></head><body><h1>Ayşe Yılmaz</h1><p>React ve TypeScript geliştiricisi.</p><script>ignore()</script></body></html>"
    )
  })

  const context = await service.extract({
    type: "url",
    url: "https://example.com/profile",
  })

  expect(context).toEqual({
    type: "url",
    label: "https://example.com/profile",
    content: "Ayşe Yılmaz React ve TypeScript geliştiricisi.",
  })
})

test("profile source service extracts text from DOCX documents", async () => {
  const file = new File(
    [
      createStoredDocxArchiveBuffer(
        "<w:document><w:body><w:p><w:r><w:t>Ayşe Yılmaz</w:t></w:r></w:p><w:p><w:r><w:t>İstanbul React TypeScript</w:t></w:r></w:p></w:body></w:document>"
      ),
    ],
    "profile.docx",
    {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }
  )
  const service = new ProfileSourceService()

  const context = await service.extract({
    type: "docx",
    file,
  })

  expect(context).toEqual({
    type: "docx",
    label: "profile.docx",
    content: "Ayşe Yılmaz İstanbul React TypeScript",
  })
})

test("profile source service rejects non-DOCX documents", async () => {
  const file = new File(["plain text"], "profile.txt", {
    type: "text/plain",
  })
  const service = new ProfileSourceService()

  await expect(
    service.extract({
      type: "docx",
      file,
    })
  ).rejects.toThrow("Yalnızca DOCX dosyası yüklenebilir.")
})

function createStoredDocxArchiveBuffer(documentXml: string): ArrayBuffer {
  const encoder = new TextEncoder()
  const fileName = encoder.encode("word/document.xml")
  const fileData = encoder.encode(documentXml)
  const localHeaderLength = 30 + fileName.length
  const centralDirectoryLength = 46 + fileName.length
  const archive = new Uint8Array(
    localHeaderLength + fileData.length + centralDirectoryLength + 22
  )
  const view = new DataView(archive.buffer)
  let offset = 0

  view.setUint32(offset, 0x04034b50, true)
  view.setUint16(offset + 4, 20, true)
  view.setUint16(offset + 8, 0, true)
  view.setUint32(offset + 18, fileData.length, true)
  view.setUint32(offset + 22, fileData.length, true)
  view.setUint16(offset + 26, fileName.length, true)
  archive.set(fileName, offset + 30)
  archive.set(fileData, localHeaderLength)
  offset = localHeaderLength + fileData.length
  const centralDirectoryOffset = offset

  view.setUint32(offset, 0x02014b50, true)
  view.setUint16(offset + 4, 20, true)
  view.setUint16(offset + 6, 20, true)
  view.setUint16(offset + 10, 0, true)
  view.setUint32(offset + 20, fileData.length, true)
  view.setUint32(offset + 24, fileData.length, true)
  view.setUint16(offset + 28, fileName.length, true)
  view.setUint32(offset + 42, 0, true)
  archive.set(fileName, offset + 46)
  offset += centralDirectoryLength

  view.setUint32(offset, 0x06054b50, true)
  view.setUint16(offset + 8, 1, true)
  view.setUint16(offset + 10, 1, true)
  view.setUint32(offset + 12, centralDirectoryLength, true)
  view.setUint32(offset + 16, centralDirectoryOffset, true)

  return archive.buffer.slice(
    archive.byteOffset,
    archive.byteOffset + archive.byteLength
  ) as ArrayBuffer
}
