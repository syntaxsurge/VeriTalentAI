'use client'

import { Pencil } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import EditCandidateModal from './edit-candidate-modal'
import { type Stage } from '@/lib/constants/recruiter'

export interface Candidate {
  id: number
  name: string
  email: string
  stage: Stage
}

export default function CandidateCard({ candidate }: { candidate: Candidate }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="truncate text-sm">
            {candidate.name || candidate.email}
          </CardTitle>
          <p className="text-xs text-muted-foreground truncate">
            {candidate.email}
          </p>
        </div>
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
      <CardContent />
    </Card>
  )
}