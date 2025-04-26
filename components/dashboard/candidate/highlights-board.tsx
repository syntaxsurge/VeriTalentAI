'use client'

import { useState, useTransition } from 'react'
import { GripVertical, Loader2 } from 'lucide-react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd'
import { toast } from 'sonner'

import { saveHighlightsAction } from '@/app/(dashboard)/candidate/highlights/actions'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface Credential {
  id: number
  title: string
  category: 'EXPERIENCE' | 'PROJECT'
}

interface Props {
  selectedExperience: Credential[]
  selectedProject: Credential[]
  available: Credential[]
}

/* -------------------------------------------------------------------------- */
/*                         Utility - reorder helper                           */
/* -------------------------------------------------------------------------- */

function reorder<T>(list: T[], startIdx: number, endIdx: number) {
  const result = Array.from(list)
  const [removed] = result.splice(startIdx, 1)
  result.splice(endIdx, 0, removed)
  return result
}

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

export default function HighlightsBoard({
  selectedExperience,
  selectedProject,
  available,
}: Props) {
  const [exp, setExp] = useState<Credential[]>(selectedExperience)
  const [proj, setProj] = useState<Credential[]>(selectedProject)
  const [pool, setPool] = useState<Credential[]>(available)

  const [isPending, startTransition] = useTransition()

  /* ---------------------------------------------------------------------- */
  /*                        Drag-and-drop handlers                           */
  /* ---------------------------------------------------------------------- */
  function onDragEnd(result: DropResult) {
    const { source, destination } = result
    if (!destination) return
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return

    /* Helpers to get state & setter by droppableId */
    const get = (id: string) =>
      id === 'experience' ? exp : id === 'project' ? proj : pool
    const set = (id: string) =>
      id === 'experience'
        ? setExp
        : id === 'project'
        ? setProj
        : setPool

    const srcList = get(source.droppableId)
    const destList = get(destination.droppableId)

    if (source.droppableId === destination.droppableId) {
      /* Reordering within the same column */
      const reordered = reorder(srcList, source.index, destination.index)
      set(source.droppableId)(reordered)
    } else {
      /* Moving item between columns */
      const removedList = Array.from(srcList)
      const [moved] = removedList.splice(source.index, 1)
      const insertedList = Array.from(destList)
      insertedList.splice(destination.index, 0, moved)
      set(source.droppableId)(removedList)
      set(destination.droppableId)(insertedList)
    }
  }

  /* ---------------------------------------------------------------------- */
  /*                           Save to server                               */
  /* ---------------------------------------------------------------------- */
  function handleSave() {
    startTransition(async () => {
      const fd = new FormData()
      fd.append(
        'experience',
        exp
          .slice(0, 5)
          .map((c) => c.id)
          .join(','),
      )
      fd.append(
        'project',
        proj
          .slice(0, 5)
          .map((c) => c.id)
          .join(','),
      )
      const res = await saveHighlightsAction({}, fd)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(res?.success ?? 'Highlights saved.')
      }
    })
  }

  /* ---------------------------------------------------------------------- */
  /*                              Renderer                                  */
  /* ---------------------------------------------------------------------- */

  function renderColumn(
    id: 'experience' | 'project' | 'pool',
    title: string,
    items: Credential[],
    max = 5,
  ) {
    const isPool = id === 'pool'
    return (
      <div className='space-y-3'>
        <h3 className='flex items-center gap-2 text-sm font-semibold uppercase text-muted-foreground'>
          {title}
          {!isPool && (
            <Badge variant='secondary' className='px-1.5 py-0.5'>
              {items.length}/{max}
            </Badge>
          )}
        </h3>

        <Droppable droppableId={id}>
          {(prov, snapshot) => (
            <div
              ref={prov.innerRef}
              {...prov.droppableProps}
              className={`flex min-h-[120px] flex-col gap-2 rounded-lg border p-3 ${
                snapshot.isDraggingOver
                  ? 'bg-primary/10 ring-2 ring-primary'
                  : 'bg-muted/40'
              }`}
            >
              {items.length === 0 && (
                <p className='text-center text-xs text-muted-foreground'>
                  {isPool ? 'No more credentials.' : 'Drag items here.'}
                </p>
              )}

              {items.map((cred, idx) => (
                <Draggable
                  key={`${id}-${cred.id}`}
                  draggableId={`${id}-${cred.id}`}
                  index={idx}
                  isDragDisabled={!isPool && idx >= max}
                >
                  {(dragProv, dragSnap) => (
                    <Card
                      ref={dragProv.innerRef}
                      {...dragProv.draggableProps}
                      {...dragProv.dragHandleProps}
                      className={`flex items-center gap-3 rounded-md border bg-background px-3 py-2 shadow-sm ${
                        dragSnap.isDragging ? 'opacity-80' : ''
                      }`}
                    >
                      <GripVertical className='h-4 w-4 flex-shrink-0 text-muted-foreground' />
                      <span className='truncate text-sm font-medium'>
                        {cred.title}
                      </span>
                      {!isPool && idx >= max && (
                        <Badge
                          variant='destructive'
                          className='ml-auto h-4 text-[10px]'
                        >
                          Extra
                        </Badge>
                      )}
                    </Card>
                  )}
                </Draggable>
              ))}

              {prov.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className='grid gap-6 md:grid-cols-3'>
          {renderColumn('experience', 'Experience', exp)}
          {renderColumn('project', 'Projects', proj)}
          {renderColumn('pool', 'Available', pool, Infinity)}
        </div>
      </DragDropContext>

      <div className='flex justify-start'>
        <Button
          onClick={handleSave}
          disabled={isPending}
          className='w-full md:w-max'
        >
          {isPending ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Saving…
            </>
          ) : (
            'Save Highlights'
          )}
        </Button>
      </div>
    </div>
  )
}