'use client'

import React, { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Trash2, Loader2, Pencil } from 'lucide-react'
import { toast } from 'sonner'

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { DataTable, type Column, type BulkAction } from '@/components/ui/tables/data-table'

import {
  deleteUserAction,
} from '@/app/(dashboard)/admin/users/actions'
import EditUserForm from '@/app/(dashboard)/admin/users/edit-user-form'

export interface RowType {
  id: number
  name: string | null
  email: string
  role: string
  createdAt: Date
}

/* -------------------------------------------------------------------------- */
/*                                    Utils                                   */
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

/* -------------------------------------------------------------------------- */
/*                               Row Actions                                  */
/* -------------------------------------------------------------------------- */

function RowActions({ row }: { row: RowType }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  /* control dropdown & dialog */
  const [menuOpen, setMenuOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  function destroy() {
    startTransition(async () => {
      const fd = new FormData()
      fd.append('userId', row.id.toString())
      const res = await deleteUserAction({}, fd)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success(res?.success ?? 'User deleted.')
        router.refresh()
      }
    })
  }

  function openEditDialog() {
    setMenuOpen(false)
    /* defer to let dropdown unmount cleanly */
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
            <Pencil className='mr-2 h-4 w-4' /> Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={destroy}
            disabled={isPending}
            className='cursor-pointer font-semibold text-rose-600 hover:bg-rose-500/10 focus:bg-rose-500/10 dark:text-rose-400'
          >
            <Trash2 className='mr-2 h-4 w-4' /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog mounting separate from dropdown */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Modify the user’s details, then save your changes.</DialogDescription>
          </DialogHeader>

          <EditUserForm
            id={row.id}
            defaultName={row.name}
            defaultEmail={row.email}
            defaultRole={row.role}
            onDone={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*                                Columns                                     */
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
/*                             Bulk Actions                                   */
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
          toast.success('Selected users deleted.')
          router.refresh()
        }),
    },
  ]
}

/* -------------------------------------------------------------------------- */
/*                                   View                                     */
/* -------------------------------------------------------------------------- */

export default function AdminUsersTable({ rows }: { rows: RowType[] }) {
  const router = useRouter()
  const bulkActions = buildBulkActions(router)

  return (
    <DataTable columns={columns} rows={rows} filterKey='email' bulkActions={bulkActions} />
  )
}