'use client'

import Link from 'next/link'
import { Pencil, Info } from 'lucide-react'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import EditCandidateModal from './edit-candidate-modal'
import { type Stage } from '@/lib/constants/recruiter'

export interface Candidate {
  /** Pipeline‑candidate row id (primary key) */
  id: number
  /** Original candidate id (for profile link) */
  candidateId: number
  name: string
  email: string
  stage: Stage
}

/**
 * Compact candidate card with edit and quick‑view actions.
 */
export default function CandidateCard({ candidate }: { candidate: Candidate }) {
  return (
    <Card className="relative">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="min-w-0">
          <CardTitle className="truncate text-sm font-medium">
            {candidate.name || candidate.email}
          </CardTitle>
          <p className="truncate text-xs text-muted-foreground">{candidate.email}</p>
        </div>

        {/* Edit modal trigger */}
        <EditCandidateModal
          pipelineCandidateId={candidate.id}
          currentStage={candidate.stage}
        >
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
        </EditCandidateModal>
      </CardHeader>

      {/* View details link */}
      <CardContent className="pt-0">
        <Button
          asChild
          variant="link"
          size="sm"
          className="h-6 px-0 text-xs text-primary"
        >
          <Link href={`/recruiter/talent/${candidate.candidateId}`} scroll={false}>
            <Info className="mr-1 h-3 w-3" />
            View&nbsp;Details
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}