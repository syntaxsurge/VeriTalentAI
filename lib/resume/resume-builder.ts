import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from 'pdf-lib'
import { and, eq } from 'drizzle-orm'
import * as fs from 'fs/promises'
import * as path from 'path'

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
  credentials: {
    title: string
    issuer: string | null
    status: CredentialStatus
  }[]
  experiences: { title: string; company: string | null }[]
  projects: { title: string; link?: string | null }[]
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

  /* All credentials regardless of status */
  const creds = await db
    .select({
      title: candidateCredentials.title,
      issuer: issuers.name,
      category: candidateCredentials.category,
      status: candidateCredentials.status,
      fileUrl: candidateCredentials.fileUrl,
    })
    .from(candidateCredentials)
    .leftJoin(issuers, eq(issuers.id, candidateCredentials.issuerId))
    .where(eq(candidateCredentials.candidateId, candidateId))

  const experiences = creds
    .filter((c) => c.category === CredentialCategory.EXPERIENCE)
    .map((c) => ({ title: c.title, company: c.issuer }))

  const projects = creds
    .filter((c) => c.category === CredentialCategory.PROJECT)
    .map((c) => ({ title: c.title, link: c.fileUrl }))

  return {
    name: profile.name ?? 'Unnamed',
    email: profile.email,
    bio: profile.bio,
    credentials: creds.map((c) => ({
      title: c.title,
      issuer: c.issuer,
      status: c.status as CredentialStatus,
    })),
    experiences,
    projects,
  }
}

/* -------------------------------------------------------------------------- */
/*                       P D F   G E N E R A T I O N                          */
/* -------------------------------------------------------------------------- */

export async function generateResumePdf(
  data: ResumeData,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  let page = pdf.addPage()
  const { width, height } = page.getSize()
  const margin = 50
  const fontSize = 12
  const titleFontSize = 18
  const smallFontSize = 8
  const contentWidth = width - margin * 2

  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold)

  /* Attempt to embed logo (optional) */
  let logoImage
  try {
    const logoPath = path.join(process.cwd(), 'public', 'images', 'viskify-logo.png')
    const logoBytes = await fs.readFile(logoPath)
    logoImage = await pdf.embedPng(logoBytes)
  } catch {
    logoImage = undefined
  }

  let y = height - margin

  /* Header */
  page.drawText(data.name, {
    x: margin,
    y,
    size: titleFontSize,
    font: boldFont,
  })
  y -= titleFontSize + 4
  page.drawText(data.email, { x: margin, y, size: fontSize, font })
  y -= fontSize + 16

  /* Bio */
  if (data.bio) {
    ({ page, y } = drawParagraph(page, data.bio, font, fontSize, contentWidth, margin, y))
    y -= 8
  }

  /* Sections */
  ;({ page, y } = drawSection(
    pdf,
    page,
    'Experience',
    data.experiences.map((e) => `${e.title} – ${e.company ?? 'Unknown'}`),
    font,
    boldFont,
    fontSize,
    margin,
    y,
  ))

  ;({ page, y } = drawSection(
    pdf,
    page,
    'Projects',
    data.projects.map((p) => p.title),
    font,
    boldFont,
    fontSize,
    margin,
    y,
  ))

  const credentialsLines = data.credentials.map((c) => {
    const issuer = c.issuer ? ` – ${c.issuer}` : ''
    const status =
      c.status.charAt(0).toUpperCase() + c.status.slice(1).toLowerCase()
    return `${c.title}${issuer} (${status})`
  })
  ;({ page, y } = drawSection(
    pdf,
    page,
    'Credentials',
    credentialsLines,
    font,
    boldFont,
    fontSize,
    margin,
    y,
  ))

  /* Watermark / brand footer */
  const brandText = 'Generated with Viskify • viskify.com'
  const brandWidth = font.widthOfTextAtSize(brandText, smallFontSize)
  const brandX = width / 2 - brandWidth / 2

  pdf.getPages().forEach((p) => {
    const { height: ph } = p.getSize()
    p.drawText(brandText, {
      x: brandX,
      y: margin / 2,
      size: smallFontSize,
      font,
      color: rgb(0.55, 0.55, 0.55),
    })
    if (logoImage) {
      const scale = 20 / logoImage.height
      p.drawImage(logoImage, {
        x: margin,
        y: ph - margin / 2 - 10,
        width: logoImage.width * scale,
        height: logoImage.height * scale,
        opacity: 0.8,
      })
    }
  })

  return await pdf.save()
}

/* -------------------------------------------------------------------------- */
/*                              H E L P E R S                                 */
/* -------------------------------------------------------------------------- */

/**
 * Simple word-wrap helper since pdf-lib fonts don’t include line-splitting utilities.
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

/**
 * Render a paragraph with automatic line-wrapping, adding pages as needed.
 */
function drawParagraph(
  page: PDFPage,
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
  margin: number,
  startY: number,
): { page: PDFPage; y: number } {
  let y = startY
  const lines = wrapText(text, font, fontSize, maxWidth)
  lines.forEach((ln) => {
    page.drawText(ln, { x: margin, y, size: fontSize, font })
    y -= fontSize + 2
    if (y < margin) {
      page = page.doc.addPage()
      y = page.getSize().height - margin
    }
  })
  return { page, y }
}

/**
 * Render a bulleted section and automatically add pages if required.
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
      /* Repeat heading on continuation page */
      page.drawText(`${heading.toUpperCase()} (cont.)`, {
        x: margin,
        y,
        size: fontSize,
        font: boldFont,
      })
      y -= fontSize + 6
    }
  })

  return { page, y: y - 12 }
}