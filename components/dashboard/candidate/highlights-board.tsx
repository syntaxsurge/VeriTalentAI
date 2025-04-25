'use client'

import React, { useState, useTransition } from 'react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
/*                              Helper Utils                                  */
/* -------------------------------------------------------------------------- */

function reorder<T>(list: T[], start: number, end: number) {
  const next = [...list]
  const [moved] = next.splice(start, 1)
  next.splice(end, 0, moved)
  return next
}

/* -------------------------------------------------------------------------- */
/*                            Re-usable Card UI                               */
/* -------------------------------------------------------------------------- */

interface CredentialCardProps {
  cred: Credential
  showHandle?: boolean
  onAction?: () => void
  actionIcon?: React.ReactNode
  /* Drag-and-drop props injected by react-beautiful-dnd */
  dndProps?: {
    draggableProps?: any
    dragHandleProps?: any
    innerRef?: (el: HTMLElement | null) => void
  }
}

/**
 * Forward-ref wrapper so Draggable can attach its ref properly.
 */
const CredentialCard = React.forwardRef<HTMLDivElement, CredentialCardProps>(
  (
    { cred, showHandle = false, onAction, actionIcon, dndProps = {} }: CredentialCardProps,
    ref,
  ) => {
    const { draggableProps, dragHandleProps, innerRef } = dndProps
    return (
      <Card
        ref={(node) => {
          innerRef?.(node)
          if (typeof ref === 'function') ref(node)
          else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
        }}
        {...draggableProps}
        className='group flex items-center justify-between gap-3 rounded-xl border bg-background/90 shadow-sm transition hover:shadow-md'
      >
        <div
          className='flex min-w-0 flex-1 items-center gap-3 p-3'
          {...(showHandle ? dragHandleProps : {})}
        >
          {showHandle && (
            <GripVertical className='h-4 w-4 flex-shrink-0 cursor-grab text-muted-foreground group-hover:text-foreground' />
          )}
          <span className='truncate text-sm font-medium'>{cred.title}</span>
          <Badge
            variant='secondary'
            className='ml-auto flex-shrink-0 text-[10px] uppercase tracking-wide'
          >
            {cred.category.toLowerCase()}
          </Badge>
        </div>

        {onAction && (
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8'
            onClick={onAction}
            aria-label='action'
          >
            {actionIcon}
          </Button>
        )}
      </Card>
    )
  },
)
CredentialCard.displayName = 'CredentialCard'

/* -------------------------------------------------------------------------- */
/*                              Main Component                                */
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

  /* ----------------------------- Drag & Drop ----------------------------- */
  function onDragEnd(res: DropResult) {
    const { source, destination } = res
    if (!destination) return
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return

    const listMap: Record<string, Credential[]> = { exp, proj }
    const setListMap: Record<string, React.Dispatch<React.SetStateAction<Credential[]>>> = {
      exp: setExp,
      proj: setProj,
    }

    const sourceList = listMap[source.droppableId]
    const destList = listMap[destination.droppableId]

    /* move within same list */
    if (source.droppableId === destination.droppableId) {
      setListMap[source.droppableId](reorder(sourceList, source.index, destination.index))
    } else {
      /* transfer between lists (should not happen in current UI) */
      const [moved] = sourceList.splice(source.index, 1)
      destList.splice(destination.index, 0, moved)
      setExp([...listMap.exp])
      setProj([...listMap.proj])
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

  /* --------------------------- Persist action --------------------------- */
  function handleSave() {
    const fd = new FormData()
    fd.append('experience', exp.map((c) => c.id).join(','))
    fd.append('project', proj.map((c) => c.id).join(','))
    startTransition(async () => {
      const tid = toast.loading('Saving highlights…')
      const res = await saveHighlightsAction({}, fd)
      if (res?.error) toast.error(res.error, { id: tid })
      else toast.success('Highlights saved.', { id: tid })
    })
  }

  /* --------------------------- List Renderers --------------------------- */
  function SelectedColumn({
    id,
    title,
    icon: Icon,
    items,
  }: {
    id: 'exp' | 'proj'
    title: string
    icon: typeof Briefcase
    items: Credential[]
  }) {
    return (
      <Card className='space-y-3'>
        <CardHeader className='flex-row items-center gap-2 py-3'>
          <Icon className='h-5 w-5 text-primary' />
          <CardTitle className='text-sm font-semibold'>{title}</CardTitle>
          <span className='text-muted-foreground ml-auto text-xs'>{items.length}/5</span>
        </CardHeader>

        <CardContent className='space-y-2'>
          <Droppable droppableId={id}>
            {(prov) => (
              <div ref={prov.innerRef} {...prov.droppableProps} className='space-y-2'>
                {items.length === 0 ? (
                  <p className='text-muted-foreground text-xs'>
                    Drag credentials here or use&nbsp;
                    <span className='font-semibold'>Add</span> buttons below.
                  </p>
                ) : (
                  items.map((c, idx) => (
                    <Draggable key={c.id} draggableId={String(c.id)} index={idx}>
                      {(dragProv) => (
                        <CredentialCard
                          cred={c}
                          showHandle
                          onAction={() => removeCredential(c)}
                          actionIcon={<Trash2 className='h-4 w-4 text-rose-500' />}
                          dndProps={{
                            draggableProps: dragProv.draggableProps,
                            dragHandleProps: dragProv.dragHandleProps,
                            innerRef: dragProv.innerRef,
                          }}
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
  }

  /* ------------------------------- View ---------------------------------- */
  return (
    <div className='space-y-10'>
      {/* Selected highlights */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className='grid gap-6 md:grid-cols-2'>
          <SelectedColumn
            id='exp'
            title='Experience Highlights'
            icon={Briefcase}
            items={exp}
          />
          <SelectedColumn
            id='proj'
            title='Project Highlights'
            icon={BookOpen}
            items={proj}
          />
        </div>
      </DragDropContext>

      {/* Available credentials */}
      <section className='space-y-4'>
        <h3 className='text-sm font-semibold tracking-tight'>Available Credentials</h3>
        {avail.length === 0 ? (
          <p className='text-muted-foreground text-xs'>All credentials have been highlighted.</p>
        ) : (
          <div className='grid gap-2 sm:grid-cols-2'>
            {avail.map((c) => (
              <CredentialCard
                key={c.id}
                cred={c}
                onAction={() => addCredential(c)}
                actionIcon={<Plus className='h-4 w-4 text-primary' />}
              />
            ))}
          </div>
        )}
      </section>

      {/* Save button */}
      <div className='flex justify-end'>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
          Save&nbsp;Highlights
        </Button>
      </div>
    </div>
  )
}