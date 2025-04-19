import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/db/drizzle'
import { getUser } from '@/lib/db/queries'
import { users as usersTable } from '@/lib/db/schema/core'

import { deleteUserAction } from './actions'

export const revalidate = 0

export default async function AdminUsersPage() {
  const currentUser = await getUser()
  if (!currentUser) redirect('/sign-in')
  if (currentUser.role !== 'admin') redirect('/dashboard')

  const allUsers = await db.select().from(usersTable).orderBy(eq(usersTable.id, 1))

  /* Wrapper because deleteUserAction expects a single FormData */
  const deleteAction = async (fd: FormData): Promise<void> => {
    'use server'
    await deleteUserAction({}, fd)
  }

  return (
    <section className='space-y-6'>
      <h2 className='text-2xl font-semibold'>All Users</h2>

      <Card>
        <CardHeader>
          <CardTitle>User Accounts</CardTitle>
        </CardHeader>
        <CardContent className='overflow-x-auto'>
          <table className='w-full caption-bottom text-sm'>
            <thead className='[&_th]:text-muted-foreground border-b'>
              <tr>
                <th className='py-2 text-left'>ID</th>
                <th className='py-2 text-left'>Name / Email</th>
                <th className='py-2 text-left'>Role</th>
                <th className='py-2'></th>
              </tr>
            </thead>
            <tbody className='divide-y'>
              {allUsers.map((u) => (
                <tr key={u.id} className='hover:bg-muted/30'>
                  <td className='py-2 pr-4'>{u.id}</td>
                  <td className='py-2 pr-4'>
                    {u.name || u.email}
                    <div className='text-muted-foreground text-xs'>{u.email}</div>
                  </td>
                  <td className='capitalize py-2 pr-4'>{u.role}</td>
                  <td className='py-2'>
                    {u.id !== currentUser.id && (
                      <form action={deleteAction}>
                        <input type='hidden' name='userId' value={u.id} />
                        <Button variant='destructive' size='sm'>
                          Delete
                        </Button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </section>
  )
}