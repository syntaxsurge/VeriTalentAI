'use client'

import React, { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Trash2, Loader2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

import { DataTable, type Column, type BulkAction } from '@/components/ui/tables/data-table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { removeTeamMember } from '@/app/(auth)/actions'
import { updateTeamMemberRoleAction } from '@/app/(dashboard)/settings/team/actions'

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface RowType {
  id: number
  name: string
  email: string
  role: string
  joinedAt: Date
}

interface MembersTableProps {
  rows: RowType[]
  isOwner: boolean
}

/* -------------------------------------------------------------------------- */
/*                             Edit member dialog                             */
/* -------------------------------------------------------------------------- */

const ROLES = ['member', 'owner'] as const

function EditMemberForm({
  row,
  onDone,
}: {
  row: RowType
  onDone: () => void
}) {
  const [role, setRole] = useState<RowType['role']>(row.role)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData()
      fd.append('memberId', row.id.toString())
      fd.append('role', role)
      const res = await updateTeamMemberRoleAction({}, fd)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(res?.success ?? 'Member updated.')
        onDone()
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={submit} className='space-y-4'>
      <div>
        <Label htmlFor='role'>Role</Label>
        <select
          id='role'
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className='h-10 w-full rounded-md border px-2 capitalize'
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <Button type='submit' className='w-full' disabled={pending}>
        {pending ? (
          <>
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            Saving…
          </>
        ) : (
          'Save Changes'
        )}
      </Button>
    </form>
  )
}

/* -------------------------------------------------------------------------- */
/*                               Row actions                                  */
/* -------------------------------------------------------------------------- */

function RowActions({ row, isOwner }: { row: RowType; isOwner: boolean }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  /* dropdown & dialog controlled state */
  const [menuOpen, setMenuOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  /* ------------ helpers ------------ */
  function openEditDialog() {
    /* Explicitly close the dropdown first, then open the dialog
       on the next event-loop tick to avoid the menu getting stuck
       in a permanently "open” controlled state. */
    setMenuOpen(false)
    setTimeout(() => setEditOpen(true), 0)
  }

  function destroy() {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('memberId', row.id.toString())
      const res = await removeTeamMember({}, fd)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(res?.success ?? 'Member removed.')
        router.refresh()
      }
    })
  }

  if (!isOwner) return null

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0' disabled={isPending}>
            {isPending ? (
              <Loader2 className='h-4 w-4 animate-spin' />
            ) : (
              <MoreHorizontal className='h-4 w-4' />
            )}
            <span className='sr-only'>Open menu</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align='end' className='rounded-md p-1 shadow-lg'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onSelect={openEditDialog} className='cursor-pointer'>
            <Pencil className='mr-2 h-4 w-4' /> Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={destroy}
            disabled={isPending}
            className='cursor-pointer font-semibold text-rose-600 hover:bg-rose-500/10 focus:bg-rose-500/10 dark:text-rose-400'
          >
            <Trash2 className='mr-2 h-4 w-4' /> Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>
              Modify the member’s role, then save your changes.
            </DialogDescription>
          </DialogHeader>
          <EditMemberForm row={row} onDone={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*                                Columns                                     */
/* -------------------------------------------------------------------------- */

function buildColumns(isOwner: boolean): Column<RowType>[] {
  const base: Column<RowType>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (v) => <span className='font-medium'>{v as string}</span>,
    },
    { key: 'email', header: 'Email', sortable: true, render: (v) => v as string },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      className: 'capitalize',
      render: (v) => v as string,
    },
    {
      key: 'joinedAt',
      header: 'Joined',
      sortable: true,
      render: (v) => formatDistanceToNow(v as Date, { addSuffix: true }),
    },
  ]

  if (isOwner) {
    base.push({
      key: 'id',
      header: '',
      enableHiding: false,
      sortable: false,
      render: (_v, row) => <RowActions row={row} isOwner={isOwner} />,
    })
  }
  return base
}

/* -------------------------------------------------------------------------- */
/*                               Bulk actions                                 */
/* -------------------------------------------------------------------------- */

function buildBulkActions(
  router: ReturnType<typeof useRouter>,
): BulkAction<RowType>[] {
  const [isPending, startTransition] = useTransition()

  return [
    {
      label: 'Remove',
      icon: Trash2,
      variant: 'destructive',
      onClick: (selected) =>
        startTransition(async () => {
          const toastId = toast.loading('Removing members…')
          await Promise.all(
            selected.map(async (m) => {
              const fd = new FormData()
              fd.append('memberId', m.id.toString())
              return removeTeamMember({}, fd)
            }),
          )
          toast.success('Selected members removed.', { id: toastId })
          router.refresh()
        }),
      isDisabled: () => isPending,
    },
  ]
}

/* -------------------------------------------------------------------------- */
/*                                   View                                     */
/* -------------------------------------------------------------------------- */

export default function MembersTable({ rows, isOwner }: MembersTableProps) {
  const router = useRouter()
  const columns = buildColumns(isOwner)
  const bulkActions = isOwner ? buildBulkActions(router) : []

  return (
    <DataTable
      columns={columns}
      rows={rows}
      filterKey='name'
      bulkActions={bulkActions}
    />
  )
}