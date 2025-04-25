'use client'

import { useState, useTransition } from 'react'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { saveHighlightsAction } from '@/app/(dashboard)/candidate/highlights/actions'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type Credential = {
  id: number
  title: string
  category: 'EXPERIENCE' | 'PROJECT'
}

interface Props {
  selectedExperience: Credential[]
  selectedProject: Credential[]
  /** Credentials not yet highlighted (can belong to either category) */
  available: Credential[]
}

/* -------------------------------------------------------------------------- */
/*                                Component                                   */
/* -------------------------------------------------------------------------- */

export default function HighlightsBoard({
  selectedExperience: initialExp,
  selectedProject: initialProj,
  available: initialAvail,
}: Props) {
  const [exp, setExp] = useState<Credential[]>(initialExp)
  const [proj, setProj] = useState<Credential[]>(initialProj)
  const [avail, setAvail] = useState<Credential[]>(initialAvail)
  const [isPending, startTransition] = useTransition()

  /* ----------------------------- DND handler ----------------------------- */
  function onDragEnd(res: DropResult) {
    const { source, destination, draggableId } = res
    if (!destination) return
    if (source.droppableId === destination.droppableId && source.index === destination.index) return

    function reorder(list: Credential[], start: number, end: number) {
      const next = [...list]
      const [moved] = next.splice(start, 1)
      next.splice(end, 0, moved)
      return next
    }

    if (source.droppableId === 'exp' && destination.droppableId === 'exp') {
      setExp((p) => reorder(p, source.index, destination.index))
    } else if (source.droppableId === 'proj' && destination.droppableId === 'proj') {
      setProj((p) => reorder(p, source.index, destination.index))
    }
  }

  /* --------------------------- Add / Remove ----------------------------- */
  function addCredential(c: Credential) {
    if (c.category === 'EXPERIENCE') {
      if (exp.length >= 5) return toast.error('Maximum 5 experience highlights')
      setExp((p) => [...p, c])
    } else {
      if (proj.length >= 5) return toast.error('Maximum 5 project highlights')
      setProj((p) => [...p, c])
    }
    setAvail((p) => p.filter((x) => x.id !== c.id))
  }

  function removeCredential(c: Credential) {
    if (c.category === 'EXPERIENCE') setExp((p) => p.filter((x) => x.id !== c.id))
    else setProj((p) => p.filter((x) => x.id !== c.id))
    setAvail((p) => [...p, c])
  }

  /* ---------------------------- Save action ----------------------------- */
  function handleSave() {
    const data = new FormData()
    data.append(
      'experience',
      exp
        .map((c) => c.id)
        .join(',')
        .toString(),
    )
    data.append(
      'project',
      proj
        .map((c) => c.id)
        .join(',')
        .toString(),
    )

    startTransition(async () => {
      const toastId = toast.loading('Saving highlights…')
      const res = await saveHighlightsAction({}, data)
      if (res?.error) toast.error(res.error, { id: toastId })
      else toast.success('Highlights saved.', { id: toastId })
    })
  }

  /* --------------------------- Render helpers --------------------------- */
  const List = ({
    id,
    items,
    title,
  }: {
    id: 'exp' | 'proj'
    items: Credential[]
    title: string
  }) => (
    <Droppable droppableId={id}>
      {(prov) => (
        <div
          ref={prov.innerRef}
          {...prov.droppableProps}
          className='space-y-2 rounded-lg border bg-muted/30 p-3'
        >
          <h3 className='mb-1 text-sm font-semibold'>{title}</h3>
          {items.map((c, idx) => (
            <Draggable key={c.id} draggableId={String(c.id)} index={idx}>
              {(dragProv) => (
                <Card
                  ref={dragProv.innerRef}
                  {...dragProv.draggableProps}
                  {...dragProv.dragHandleProps}
                  className='flex items-center justify-between p-3'
                >
                  <span className='truncate text-sm font-medium'>{c.title}</span>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-6 w-6'
                    onClick={() => removeCredential(c)}
                  >
                    <Trash2 className='h-4 w-4 text-rose-500' />
                  </Button>
                </Card>
              )}
            </Draggable>
          ))}
          {prov.placeholder}
          {items.length === 0 && (
            <p className='text-muted-foreground text-xs'>No highlights selected.</p>
          )}
        </div>
      )}
    </Droppable>
  )

  /* ------------------------------- View --------------------------------- */
  return (
    <div className='space-y-6'>
      {/* Top lists */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className='grid gap-6 md:grid-cols-2'>
          <List id='exp' items={exp} title='Experience (max 5)' />
          <List id='proj' items={proj} title='Projects (max 5)' />
        </div>
      </DragDropContext>

      {/* Available credentials */}
      <div className='space-y-2'>
        <h3 className='text-sm font-semibold'>Available Credentials</h3>
        {avail.length === 0 ? (
          <p className='text-muted-foreground text-xs'>No more credentials to add.</p>
        ) : (
          <div className='grid gap-2 md:grid-cols-2'>
            {avail.map((c) => (
              <Card key={c.id} className='flex items-center justify-between p-3'>
                <div className='flex items-center gap-2'>
                  <span className='truncate text-sm'>{c.title}</span>
                  <span className='rounded bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide'>
                    {c.category.toLowerCase()}
                  </span>
                </div>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-6 w-6'
                  onClick={() => addCredential(c)}
                  disabled={
                    (c.category === 'EXPERIENCE' && exp.length >= 5) ||
                    (c.category === 'PROJECT' && proj.length >= 5)
                  }
                >
                  <Plus className='h-4 w-4 text-primary' />
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Save button */}
      <Button onClick={handleSave} disabled={isPending}>
        {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
        Save Highlights
      </Button>
    </div>
  )
}