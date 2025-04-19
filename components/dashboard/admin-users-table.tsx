'use client'

import React, {
  useTransition,
  useState,
  useActionState,
  startTransition,
} from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Trash2, Loader2, Pencil } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { DataTable, type Column, type BulkAction } from '@/components/ui/data-table'
import {
  deleteUserAction,
  updateUserAction,
} from '@/app/(dashboard)/admin/users/actions'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormStatus } from '@/components/ui/form-status'

export interface RowType {
  id: number
  name: string | null
  email: string
  role: string
  createdAt: Date
}

/* -------------------------------------------------------------------------- */
/*                                   Utils                                    */
/* -------------------------------------------------------------------------- */

function formatDateTime(d: Date) {
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

const ROLES = ['candidate', 'recruiter', 'issuer', 'admin'] as const

/* -------------------------------------------------------------------------- */
/*                              Edit User Dialog                              */
/* -------------------------------------------------------------------------- */

function EditUserDialog({
  row,
  open,
  onOpenChange,
}: {
  row: RowType
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const router = useRouter()

  type ActionState = { error?: string; success?: string }
  const [state, action, pending] = useActionState<ActionState, FormData>(updateUserAction, {
    error: '',
    success: '',
  })

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    fd.append('userId', row.id.toString())
    startTransition(() => action(fd))
  }

  React.useEffect(() => {
    if (state.success) {
      onOpenChange(false)
      router.refresh()
    }
  }, [state.success, onOpenChange, router])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Modify the user’s details, then save your changes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <Label htmlFor='name'>Name (optional)</Label>
            <Input id='name' name='name' defaultValue={row.name ?? ''} />
          </div>
          <div>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              name='email'
              type='email'
              defaultValue={row.email}
              required
            />
          </div>
          <div>
            <Label htmlFor='role'>Role</Label>
            <select
              id='role'
              name='role'
              defaultValue={row.role}
              className='h-10 w-full rounded-md border px-2 capitalize'
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <FormStatus state={state} />

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
      </DialogContent>
    </Dialog>
  )
}

/* -------------------------------------------------------------------------- */
/*                             Row Actions Menu                               */
/* -------------------------------------------------------------------------- */

function RowActions({ row }: { row: RowType }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  /* Control both dropdown and dialog open states */
  const [menuOpen, setMenuOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  function destroy() {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('userId', row.id.toString())
      await deleteUserAction({}, fd)
      router.refresh()
    })
  }

  /* Ensure menu closes before dialog opens to avoid aria-hidden focus clash */
  function openEditDialog() {
    setMenuOpen(false)
    /* wait one tick for menu to unmount */
    setTimeout(() => setEditOpen(true), 0)
  }

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
            <Pencil className='mr-2 h-4 w-4' />
            Edit
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={destroy}
            disabled={isPending}
            className='text-rose-600 dark:text-rose-400 font-semibold hover:bg-rose-500/10 focus:bg-rose-500/10'
          >
            <Trash2 className='mr-2 h-4 w-4' />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog outside the dropdown hierarchy */}
      <EditUserDialog row={row} open={editOpen} onOpenChange={setEditOpen} />
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 Columns                                    */
/* -------------------------------------------------------------------------- */

const columns: Column<RowType>[] = [
  {
    key: 'email',
    header: 'Email',
    sortable: true,
    render: (v) => <>{v as string}</>,
  },
  {
    key: 'role',
    header: 'Role',
    sortable: true,
    className: 'capitalize',
    render: (v) => <>{v as string}</>,
  },
  {
    key: 'createdAt',
    header: 'Joined',
    sortable: true,
    render: (v) => <>{formatDateTime(v as Date)}</>,
  },
  {
    key: 'id',
    header: '',
    enableHiding: false,
    sortable: false,
    render: (_v, row) => <RowActions row={row} />,
  },
]

/* -------------------------------------------------------------------------- */
/*                                 Bulk                                       */
/* -------------------------------------------------------------------------- */

function buildBulkActions(router: ReturnType<typeof useRouter>): BulkAction<RowType>[] {
  const [isPending, startTransition] = useTransition()

  return [
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      onClick: (selected) =>
        startTransition(async () => {
          await Promise.all(
            selected.map(async (u) => {
              const fd = new FormData()
              fd.append('userId', u.id.toString())
              await deleteUserAction({}, fd)
            }),
          )
          router.refresh()
        }),
    },
  ]
}

/* -------------------------------------------------------------------------- */
/*                                 View                                       */
/* -------------------------------------------------------------------------- */

export default function AdminUsersTable({ rows }: { rows: RowType[] }) {
  const router = useRouter()
  const bulkActions = buildBulkActions(router)

  return (
    <DataTable columns={columns} rows={rows} filterKey='email' bulkActions={bulkActions} />
  )
}