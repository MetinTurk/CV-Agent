// Module: Builds a Word (.docx) document from a TailoredCv and triggers a browser download.
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx"
import { saveAs } from "file-saver"

import type { TailoredCv } from "./cv-generation-api"

const SECTION_SPACING_BEFORE = 240
const SECTION_SPACING_AFTER = 120
const BULLET_SPACING_AFTER = 60

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: SECTION_SPACING_BEFORE, after: SECTION_SPACING_AFTER },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        bold: true,
        size: 22,
      }),
    ],
  })
}

function paragraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: BULLET_SPACING_AFTER },
    children: [new TextRun({ text, size: 22 })],
  })
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: BULLET_SPACING_AFTER },
    children: [new TextRun({ text, size: 22 })],
  })
}

function buildHeader(cv: TailoredCv): Paragraph[] {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: cv.full_name.length > 0 ? cv.full_name : "Adınız Soyadınız",
          bold: true,
          size: 36,
        }),
      ],
    }),
  ]

  if (cv.title.length > 0) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [new TextRun({ text: cv.title, size: 24 })],
      })
    )
  }

  if (cv.location !== null && cv.location.length > 0) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [
          new TextRun({ text: cv.location, italics: true, size: 20 }),
        ],
      })
    )
  }

  return paragraphs
}

function buildExperiences(cv: TailoredCv): Paragraph[] {
  if (cv.experiences.length === 0) {
    return []
  }

  const paragraphs: Paragraph[] = [sectionHeading("Deneyim")]

  for (const experience of cv.experiences) {
    const headingChildren: TextRun[] = [
      new TextRun({ text: experience.role, bold: true, size: 22 }),
    ]
    if (experience.company.length > 0) {
      headingChildren.push(
        new TextRun({ text: ` | ${experience.company}`, size: 22 })
      )
    }
    if (experience.period.length > 0) {
      headingChildren.push(
        new TextRun({
          text: `  —  ${experience.period}`,
          italics: true,
          size: 20,
        })
      )
    }

    paragraphs.push(
      new Paragraph({
        spacing: { before: 120, after: 60 },
        children: headingChildren,
      })
    )

    for (const line of experience.bullets) {
      paragraphs.push(bullet(line))
    }
  }

  return paragraphs
}

function buildProjects(cv: TailoredCv): Paragraph[] {
  if (cv.projects.length === 0) {
    return []
  }

  const paragraphs: Paragraph[] = [sectionHeading("Projeler")]

  for (const project of cv.projects) {
    const children: TextRun[] = [
      new TextRun({ text: project.name, bold: true, size: 22 }),
    ]
    if (project.description.length > 0) {
      children.push(
        new TextRun({ text: ` — ${project.description}`, size: 22 })
      )
    }
    paragraphs.push(
      new Paragraph({
        spacing: { after: BULLET_SPACING_AFTER },
        children,
      })
    )
  }

  return paragraphs
}

function buildEducations(cv: TailoredCv): Paragraph[] {
  if (cv.educations.length === 0) {
    return []
  }

  const paragraphs: Paragraph[] = [sectionHeading("Eğitim")]

  for (const education of cv.educations) {
    const children: TextRun[] = [
      new TextRun({ text: education.institution, bold: true, size: 22 }),
    ]
    if (education.degree.length > 0) {
      children.push(
        new TextRun({ text: ` — ${education.degree}`, size: 22 })
      )
    }
    if (education.period.length > 0) {
      children.push(
        new TextRun({
          text: `  (${education.period})`,
          italics: true,
          size: 20,
        })
      )
    }
    paragraphs.push(
      new Paragraph({
        spacing: { after: BULLET_SPACING_AFTER },
        children,
      })
    )
  }

  return paragraphs
}

function buildList(title: string, items: string[]): Paragraph[] {
  if (items.length === 0) {
    return []
  }
  return [sectionHeading(title), ...items.map((item) => bullet(item))]
}

function buildInline(title: string, items: string[]): Paragraph[] {
  if (items.length === 0) {
    return []
  }
  return [sectionHeading(title), paragraph(items.join(" • "))]
}

function buildSummary(cv: TailoredCv): Paragraph[] {
  if (cv.summary.length === 0) {
    return []
  }
  return [sectionHeading("Profesyonel Özet"), paragraph(cv.summary)]
}

function buildDocument(cv: TailoredCv): Document {
  const children: Paragraph[] = [
    ...buildHeader(cv),
    ...buildSummary(cv),
    ...buildInline("Öne Çıkan Yetkinlikler", cv.skills),
    ...buildExperiences(cv),
    ...buildProjects(cv),
    ...buildEducations(cv),
    ...buildList("Sertifikalar", cv.certifications),
    ...buildInline("Diller", cv.languages),
  ]

  return new Document({
    creator: "CV Agent",
    title: cv.full_name.length > 0 ? cv.full_name : "Tailored CV",
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children,
      },
    ],
  })
}

function buildFileName(cv: TailoredCv): string {
  const base = cv.full_name.length > 0 ? cv.full_name : "tailored-cv"
  const slug = base
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
  const safe = slug.length > 0 ? slug : "tailored-cv"
  return `${safe}.docx`
}

export async function downloadCvAsDocx(cv: TailoredCv): Promise<void> {
  const document = buildDocument(cv)
  const blob = await Packer.toBlob(document)
  saveAs(blob, buildFileName(cv))
}
