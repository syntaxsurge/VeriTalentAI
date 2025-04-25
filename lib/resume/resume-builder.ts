import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from 'pdf-lib'
import { and, eq } from 'drizzle-orm'

import { db } from '@/lib/db/drizzle'
import { users } from '@/lib/db/schema/core'
import {
  candidates,
  candidateCredentials,
  CredentialStatus,
  CredentialCategory,
} from '@/lib/db/schema/viskify'
import { issuers } from '@/lib/db/schema/issuer'

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export interface ResumeData {
  name: string
  email: string
  bio?: string | null
  verifiedCredentials: { title: string; issuer: string | null }[]
  experiences: { title: string; company: string | null }[]
  projects: { title: string; link?: string | null }[]
}

/* -------------------------------------------------------------------------- */
/*                           U T I L I T Y   F N S                            */
/* -------------------------------------------------------------------------- */

/**
 * Simple word-wrap helper since pdf-lib fonts don’t include line-splitting
 * utilities; returns an array of lines that fit within maxWidth.
 */
function wrapText(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word
    const width = font.widthOfTextAtSize(next, fontSize)
    if (width <= maxWidth) {
      current = next
    } else {
      if (current) lines.push(current)
      current = word
    }
  })

  if (current) lines.push(current)
  return lines
}

/* -------------------------------------------------------------------------- */
/*                         R E S U M E   B U I L D E R                        */
/* -------------------------------------------------------------------------- */

export async function buildResumeData(
  candidateId: number,
): Promise<ResumeData | null> {
  /* Basic profile */
  const [profile] = await db
    .select({
      name: users.name,
      email: users.email,
      bio: candidates.bio,
    })
    .from(candidates)
    .innerJoin(users, eq(users.id, candidates.userId))
    .where(eq(candidates.id, candidateId))
    .limit(1)

  if (!profile) return null

  /* Verified credentials */
  const verified = await db
    .select({
      title: candidateCredentials.title,
      issuer: issuers.name,
      category: candidateCredentials.category,
      type: candidateCredentials.type,
      fileUrl: candidateCredentials.fileUrl,
    })
    .from(candidateCredentials)
    .leftJoin(issuers, eq(issuers.id, candidateCredentials.issuerId))
    .where(
      and(
        eq(candidateCredentials.candidateId, candidateId),
        eq(candidateCredentials.status, CredentialStatus.VERIFIED),
      ),
    )

  const experiences = verified
    .filter((c) => c.category === CredentialCategory.EXPERIENCE)
    .map((c) => ({ title: c.title, company: c.issuer }))

  const projects = verified
    .filter((c) => c.category === CredentialCategory.PROJECT)
    .map((c) => ({ title: c.title, link: c.fileUrl }))

  const data: ResumeData = {
    name: profile.name ?? 'Unnamed',
    email: profile.email,
    bio: profile.bio,
    verifiedCredentials: verified.map((c) => ({
      title: c.title,
      issuer: c.issuer,
    })),
    experiences,
    projects,
  }

  return data
}

/* -------------------------------------------------------------------------- */
/*                       P D F   G E N E R A T I O N                          */
/* -------------------------------------------------------------------------- */

export async function generateResumePdf(
  data: ResumeData,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  let page = pdf.addPage()
  const { width } = page.getSize()
  const margin = 50
  const fontSize = 12
  const titleFontSize = 18
  const contentWidth = width - margin * 2

  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold)

  let y = page.getSize().height - margin

  /* Header */
  page.drawText(data.name, {
    x: margin,
    y,
    size: titleFontSize,
    font: boldFont,
    color: rgb(0, 0, 0),
  })
  y -= titleFontSize + 4
  page.drawText(data.email, { x: margin, y, size: fontSize, font })

  y -= fontSize + 16

  /* Bio */
  if (data.bio) {
    const lines = wrapText(data.bio, font, fontSize, contentWidth)
    for (const ln of lines) {
      page.drawText(ln, { x: margin, y, size: fontSize, font })
      y -= fontSize + 2
      if (y < margin) {
        page = pdf.addPage()
        y = page.getSize().height - margin
      }
    }
    y -= 8
  }

  /* Sections */
  y = drawSection(
    pdf,
    page,
    'Experience',
    data.experiences.map((e) => `${e.title} – ${e.company ?? 'Unknown'}`),
    font,
    boldFont,
    fontSize,
    margin,
    y,
  ).y

  y = drawSection(
    pdf,
    page,
    'Projects',
    data.projects.map((p) => p.title),
    font,
    boldFont,
    fontSize,
    margin,
    y,
  ).y

  y = drawSection(
    pdf,
    page,
    'Verified Credentials',
    data.verifiedCredentials.map((c) =>
      c.issuer ? `${c.title} – ${c.issuer}` : c.title,
    ),
    font,
    boldFont,
    fontSize,
    margin,
    y,
  ).y

  return await pdf.save()
}

/* -------------------------------------------------------------------------- */
/*                              H E L P E R S                                 */
/* -------------------------------------------------------------------------- */

/**
 * Render a bulleted section and automatically add pages if required.
 * Returns the last page used and the current y-position.
 */
function drawSection(
  pdf: PDFDocument,
  page: PDFPage,
  heading: string,
  items: string[],
  font: PDFFont,
  boldFont: PDFFont,
  fontSize: number,
  margin: number,
  startY: number,
): { page: PDFPage; y: number } {
  let y = startY

  if (items.length === 0) {
    return { page, y }
  }

  page.drawText(heading.toUpperCase(), {
    x: margin,
    y,
    size: fontSize,
    font: boldFont,
  })
  y -= fontSize + 6

  items.forEach((text) => {
    page.drawText('• ' + text, { x: margin + 10, y, size: fontSize, font })
    y -= fontSize + 4
    if (y < margin) {
      page = pdf.addPage()
      y = page.getSize().height - margin
    }
  })

  return { page, y: y - 12 }
}