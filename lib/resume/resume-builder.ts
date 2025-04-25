import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

import { db } from '@/lib/db/drizzle'
import {
  users,
  candidates,
} from '@/lib/db/schema/core'
import {
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
/*                         R E S U M E   B U I L D E R                        */
/* -------------------------------------------------------------------------- */

export async function buildResumeData(candidateId: number): Promise<ResumeData | null> {
  /* Basic profile */
  const [profile] = await db
    .select({
      name: users.name,
      email: users.email,
      bio: candidates.bio,
    })
    .from(candidates)
    .innerJoin(users, users.id.eq(candidates.userId))
    .where(candidates.id.eq(candidateId))
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
    .leftJoin(issuers, issuers.id.eq(candidateCredentials.issuerId))
    .where(
      candidateCredentials.candidateId
        .eq(candidateId)
        .and(candidateCredentials.status.eq(CredentialStatus.VERIFIED)),
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

export async function generateResumePdf(data: ResumeData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage()
  const { width, height } = page.getSize()
  const margin = 50
  const fontSize = 12
  const titleFontSize = 18

  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold)

  let y = height - margin

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
    const lines = font.splitTextIntoLines(data.bio, 450, fontSize)
    lines.forEach((line) => {
      page.drawText(line, { x: margin, y, size: fontSize, font })
      y -= fontSize + 2
    })
    y -= 8
  }

  /* Experience */
  if (data.experiences.length) {
    y = drawSection(page, 'Experience', data.experiences.map((e) => `${e.title} – ${e.company ?? 'Unknown'}`), font, boldFont, fontSize, margin, y)
  }

  /* Projects */
  if (data.projects.length) {
    y = drawSection(page, 'Projects', data.projects.map((p) => p.title), font, boldFont, fontSize, margin, y)
  }

  /* Verified Credentials */
  if (data.verifiedCredentials.length) {
    y = drawSection(
      page,
      'Verified Credentials',
      data.verifiedCredentials.map((c) => `${c.title}${c.issuer ? ` – ${c.issuer}` : ''}`),
      font,
      boldFont,
      fontSize,
      margin,
      y,
    )
  }

  return await pdf.save()
}

/* Helper to render a bulleted section */
function drawSection(
  page: any,
  heading: string,
  items: string[],
  font: any,
  boldFont: any,
  fontSize: number,
  margin: number,
  startY: number,
) {
  let y = startY
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
      page.addPage()
      y = page.getHeight() - margin
    }
  })
  return y - 12
}