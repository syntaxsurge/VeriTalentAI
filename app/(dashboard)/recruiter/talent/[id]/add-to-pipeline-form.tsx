'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { ActionButton } from '@/components/ui/action-button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

import { addCandidateToPipelineAction } from '../../pipelines/actions'

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

interface Pipeline {
  id: number
  name: string
}

interface Props {
  candidateId: number
  pipelines: Pipeline[]
}

/* -------------------------------------------------------------------------- */
/*                                   View                                     */
/* -------------------------------------------------------------------------- */

export default function AddToPipelineForm({ candidateId, pipelines }: Props) {
  const router = useRouter()
  const [pipelineId, setPipelineId] = useState<string>(
    pipelines.length > 0 ? String(pipelines[0].id) : '',
  )

  async function handleAdd() {
    const fd = new FormData()
    fd.append('candidateId', String(candidateId))
    fd.append('pipelineId', pipelineId)
    const res = await addCandidateToPipelineAction({}, fd)
    if (res?.success) router.refresh()
    return res
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className='flex items-end gap-3'>
      {/* Pipeline selector */}
      <div className='flex flex-1 flex-col gap-2'>
        <Label htmlFor='pipelineId' className='text-sm font-medium'>
          Add to Pipeline
        </Label>

        <Select
          value={pipelineId}
          onValueChange={(val) => setPipelineId(val)}
          disabled={pipelines.length === 0}
        >
          <SelectTrigger id='pipelineId'>
            <SelectValue placeholder='Select pipeline' />
          </SelectTrigger>

          <SelectContent>
            {pipelines.map((p) => (
              <SelectItem key={p.id} value={String(p.id)}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Submit button */}
      <ActionButton
        onAction={handleAdd}
        pendingLabel='Adding…'
        disabled={!pipelineId || pipelines.length === 0}
      >
        Add
      </ActionButton>
    </form>
  )
}