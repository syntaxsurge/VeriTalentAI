'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { ActionButton } from '@/components/ui/action-button'

import { addCandidateToPipelineAction } from '../../pipelines/actions'

interface Pipeline {
  id: number
  name: string
}

interface Props {
  candidateId: number
  pipelines: Pipeline[]
}

/**
 * Displays pipeline selector and leverages ActionButton for add-to-pipeline flow.
 */
export default function AddToPipelineForm({ candidateId, pipelines }: Props) {
  const router = useRouter()
  const [pipelineId, setPipelineId] = useState<number>(pipelines[0]?.id ?? 0)

  async function handleAdd() {
    const fd = new FormData()
    fd.append('candidateId', String(candidateId))
    fd.append('pipelineId', String(pipelineId))
    const res = await addCandidateToPipelineAction({}, fd)
    if (res?.success) router.refresh()
    return res
  }

  return (
    <form onSubmit={(e) => e.preventDefault()} className='flex items-end gap-3'>
      <div className='flex flex-1 flex-col'>
        <label htmlFor='pipelineId' className='mb-1 text-sm font-medium'>
          Add to Pipeline
        </label>
        <select
          id='pipelineId'
          name='pipelineId'
          required
          value={pipelineId}
          onChange={(e) => setPipelineId(Number(e.target.value))}
          className='border-border h-10 rounded-md border px-2 text-sm'
        >
          {pipelines.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <ActionButton onAction={handleAdd} pendingLabel='Adding…'>
        Add
      </ActionButton>
    </form>
  )
}
