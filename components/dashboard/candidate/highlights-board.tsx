'use client'

import { useState, useTransition } from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd'
import {
  GripVertical,
  Plus,
  Trash2,
  Loader2,
  Briefcase,
  BookOpen,
} from 'lucide-react'
import { toast } from 'sonner'

import { saveHighlightsAction } from '@/app/(dashboard)/candidate/highlights/actions'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
/*                       Utility – move within array                          */
/* -------------------------------------------------------------------------- */

function reorder<T>(list: T[], start: number, end: number) {
  const next = [...list]
  const [moved] = next.splice(start, 1)
  next.splice(end, 0, moved)
  return next
}

/* -------------------------------------------------------------------------- */
/*                               Component                                    */
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
    const { source, destination } = res
    if (!destination) return
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return

    if (source.droppableId === 'exp' && destination.droppableId === 'exp') {
      setExp((p) => reorder(p, source.index, destination.index))
    } else if (
      source.droppableId === 'proj' &&
      destination.droppableId === 'proj'
    ) {
      setProj((p) => reorder(p, source.index, destination.index))
    }
  }

  /* --------------------------- Add / Remove ----------------------------- */
  function addCredential(c: Credential) {
    if (c.category === 'EXPERIENCE') {
      if (exp.length >= 5)
        return toast.error('Maximum 5 experience highlights')
      setExp((p) => [...p, c])
    } else {
      if (proj.length >= 5) return toast.error('Maximum 5 project highlights')
      setProj((p) => [...p, c])
    }
    setAvail((p) => p.filter((x) => x.id !== c.id))
  }

  function removeCredential(c: Credential) {
    if (c.category === 'EXPERIENCE')
      setExp((p) => p.filter((x) => x.id !== c.id))
    else setProj((p) => p.filter((x) => x.id !== c.id))
    setAvail((p) => [...p, c])
  }

  /* ---------------------------- Save action ----------------------------- */
  function handleSave() {
    const fd = new FormData()
    fd.append(
      'experience',
      exp
        .map((c) => c.id)
        .join(',')
        .toString(),
    )
    fd.append(
      'project',
      proj
        .map((c) => c.id)
        .join(',')
        .toString(),
    )

    startTransition(async () => {
      const tid = toast.loading('Saving highlights…')
      const res = await saveHighlightsAction({}, fd)
      if (res?.error) toast.error(res.error, { id: tid })
      else toast.success('Highlights saved.', { id: tid })
    })
  }

  /* --------------------------- Render helpers --------------------------- */
  const CredentialCard = ({
    cred,
    dragProps,
    isDraggable,
    onRemove,
    showHandle = false,
  }: {
    cred: Credential
    dragProps?: any
    isDraggable?: boolean
    onRemove?: () => void
    showHandle?: boolean
  }) => (
    <Card
      className='flex items-center justify-between gap-3 rounded-lg border bg-background shadow-sm'
      {...dragProps}
    >
      <div className='flex min-w-0 flex-1 items-center gap-3 p-3'>
        {showHandle && (
          <GripVertical className='h-4 w-4 flex-shrink-0 cursor-grab text-muted-foreground' />
        )}
        <span className='truncate text-sm font-medium'>{cred.title}</span>
        <Badge
          variant='secondary'
          className='ml-auto flex-shrink-0 text-[10px] uppercase tracking-wide'
        >
          {cred.category.toLowerCase()}
        </Badge>
      </div>

      {onRemove && (
        <Button
          variant='ghost'
          size='icon'
          className='h-8 w-8'
          onClick={onRemove}
          aria-label='Remove'
        >
          <Trash2 className='h-4 w-4 text-rose-500' />
        </Button>
      )}
    </Card>
  )

  const SelectedList = ({
    id,
    items,
    title,
    icon: Icon,
  }: {
    id: 'exp' | 'proj'
    items: Credential[]
    title: string
    icon: typeof Briefcase
  }) => (
    <Card className='space-y-3'>
      <CardHeader className='flex-row items-center gap-2 py-3'>
        <Icon className='h-5 w-5 text-primary' />
        <CardTitle className='text-sm font-semibold'>{title}</CardTitle>
        <span className='text-muted-foreground ml-auto text-xs'>
          {items.length}/5
        </span>
      </CardHeader>

      <CardContent className='space-y-2'>
        <Droppable droppableId={id}>
          {(prov) => (
            <div
              ref={prov.innerRef}
              {...prov.droppableProps}
              className='space-y-2'
            >
              {items.length === 0 ? (
                <p className='text-muted-foreground text-xs'>
                  Drag credentials here or use&nbsp;
                  <span className='font-semibold'>Add</span> buttons below.
                </p>
              ) : (
                items.map((c, idx) => (
                  <Draggable
                    key={c.id}
                    draggableId={String(c.id)}
                    index={idx}
                  >
                    {(dragProv) => (
                      <CredentialCard
                        cred={c}
                        dragProps={{
                          ref: dragProv.innerRef,
                          ...dragProv.draggableProps,
                          ...dragProv.dragHandleProps,
                        }}
                        isDraggable
                        onRemove={() => removeCredential(c)}
                        showHandle
                      />
                    )}
                  </Draggable>
                ))
              )}
              {prov.placeholder}
            </div>
          )}
        </Droppable>
      </CardContent>
    </Card>
  )

  /* ------------------------------- View --------------------------------- */
  return (
    <div className='space-y-8'>
      {/* Selected */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className='grid gap-6 md:grid-cols-2'>
          <SelectedList
            id='exp'
            items={exp}
            title='Experience Highlights'
            icon={Briefcase}
          />
          <SelectedList
            id='proj'
            items={proj}
            title='Project Highlights'
            icon={BookOpen}
          />
        </div>
      </DragDropContext>

      {/* Available */}
      <section className='space-y-4'>
        <h3 className='text-sm font-semibold tracking-tight'>Available Credentials</h3>
        {avail.length === 0 ? (
          <p className='text-muted-foreground text-xs'>
            All credentials have been highlighted.
          </p>
        ) : (
          <div className='grid gap-2 sm:grid-cols-2'>
            {avail.map((c) => (
              <CredentialCard
                key={c.id}
                cred={c}
                onRemove={() => addCredential(c)}
              >
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8'
                  aria-label='Add'
                >
                  <Plus className='h-4 w-4 text-primary' />
                </Button>
              </CredentialCard>
            ))}
          </div>
        )}
      </section>

      {/* Save */}
      <div className='flex justify-end'>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
          Save&nbsp;Highlights
        </Button>
      </div>
    </div>
  )
}