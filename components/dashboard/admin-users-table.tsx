'use client'

import { useTransition, useState, useActionState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  MoreHorizontal,
  Trash2,
  Loader2,
  Pencil,
} from 'lucide-react'

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
import { deleteUserAction, updateUserAction } from '@/app/(dashboard)/admin/users/actions'
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FormStatus } from '@/components/ui/form-status'
import React from 'react'

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
/*                             Row‑level actions                              */
/* -------------------------------------------------------------------------- */

function EditDialog({ row }: { row: RowType }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

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

  // close & refresh after successful update
  React.useEffect(() => {
    if (state.success) {
      setOpen(false)
      router.refresh()
    }
  }, [state.success, router])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={row.name ?? ''}
              placeholder="Full name"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={row.email}
              placeholder="user@example.com"
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              name="role"
              defaultValue={row.role}
              className="h-10 w-full rounded-md border px-2 capitalize"
            >
              {ROLES.map((r) => (
                <option key={r} value={r} className="capitalize">
                  {r}
                </option>
              ))}
            </select>
          </div>

          <FormStatus state={state} />

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

function RowActions({ row }: { row: RowType }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function destroy() {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('userId', row.id.toString())
      await deleteUserAction({}, fd)
      router.refresh()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-md p-1 shadow-lg">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>

        <EditDialog row={row} />

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={destroy}
          disabled={isPending}
          className="text-rose-600 dark:text-rose-400 font-semibold hover:bg-rose-500/10 focus:bg-rose-500/10"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/* -------------------------------------------------------------------------- */
/*                                 Columns                                    */
/* -------------------------------------------------------------------------- */

const columns: Column<RowType>[] = [
  {
    key: 'name',
    header: 'Name',
    sortable: true,
    render: (v, r) => v || r.email,
  },
  {
    key: 'email',
    header: 'Email',
    sortable: true,
    render: (v) => v as string,
  },
  {
    key: 'role',
    header: 'Role',
    sortable: true,
    className: 'capitalize',
    render: (v) => v as string,
  },
  {
    key: 'createdAt',
    header: 'Joined',
    sortable: true,
    render: (v) => formatDateTime(v as Date),
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
/*                                  View                                      */
/* -------------------------------------------------------------------------- */

export default function AdminUsersTable({ rows }: { rows: RowType[] }) {
  const router = useRouter()
  const bulkActions = buildBulkActions(router)

  return (
    <DataTable
      columns={columns}
      rows={rows}
      filterKey="email"
      bulkActions={bulkActions}
    />
  )
}