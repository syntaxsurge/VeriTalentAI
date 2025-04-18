'use client'

import { use, useState } from 'react'
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Mail,
  ShieldCheck,
  Award,
  BookOpen,
  Key,
  Settings as Cog,
  Users as UsersIcon,
  Activity,
  Shield,
  Menu,
  Tag,
} from 'lucide-react'

import { SidebarNav, type SidebarNavItem } from '@/components/dashboard/sidebar-nav'
import { Button } from '@/components/ui/button'
import { useUser } from '@/lib/auth'

/* -------------------------------------------------------------------------- */
/*                               STATIC NAV ITEMS                             */
/* -------------------------------------------------------------------------- */

const MAIN_NAV: SidebarNavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/pricing', icon: Tag, label: 'Pricing' },
]

const SETTINGS_NAV: SidebarNavItem[] = [
  { href: '/settings/general', icon: Cog, label: 'General' },
  { href: '/settings/team', icon: UsersIcon, label: 'Team' },
  { href: '/settings/activity', icon: Activity, label: 'Activity' },
  { href: '/settings/security', icon: Shield, label: 'Security' },
]

/* -------------------------------------------------------------------------- */
/*                          ROLE‑SPECIFIC NAV HELPERS                         */
/* -------------------------------------------------------------------------- */

function roleNav(role?: string): SidebarNavItem[] {
  switch (role) {
    case 'candidate':
      return [
        { href: '/candidate/credentials', icon: BookOpen, label: 'Credentials' },
        { href: '/candidate/skill-check', icon: Award, label: 'Skill Quiz' },
        { href: '/candidate/verify', icon: ShieldCheck, label: 'Verify Credential' },
        { href: '/candidate/create-did', icon: Key, label: 'Create DID' },
      ]
    case 'recruiter':
      return [
        { href: '/recruiter/talent', icon: Users, label: 'Talent' },
        { href: '/recruiter/pipelines', icon: FolderKanban, label: 'Pipelines' },
      ]
    case 'issuer':
      return [
        { href: '/issuer/requests', icon: Mail, label: 'Requests' },
        { href: '/issuer/onboard', icon: ShieldCheck, label: 'Organisation' },
      ]
    case 'admin':
      return [
        { href: '/admin', icon: Shield, label: 'Dashboard' },
        { href: '/admin/users', icon: Users, label: 'Users' },
        { href: '/admin/credentials', icon: Award, label: 'Credentials' },
      ]
    default:
      return []
  }
}

function roleTitle(role?: string): string {
  switch (role) {
    case 'candidate':
      return 'Candidate Tools'
    case 'recruiter':
      return 'Recruiter Workspace'
    case 'issuer':
      return 'Issuer Console'
    case 'admin':
      return 'Admin'
    default:
      return ''
  }
}

/* -------------------------------------------------------------------------- */
/*                                  LAYOUT                                    */
/* -------------------------------------------------------------------------- */

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { userPromise } = useUser()
  const user = use(userPromise)

  const intrinsicNav = roleNav(user?.role)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  /* ----------------------------- Sidebar markup ---------------------------- */
  function SidebarContent() {
    return (
      <>
        <SidebarNav title='Main' items={MAIN_NAV} />

        {intrinsicNav.length > 0 && (
          <SidebarNav title={roleTitle(user?.role)} items={intrinsicNav} />
        )}

        <SidebarNav title='Settings' items={SETTINGS_NAV} />
      </>
    )
  }

  /* ------------------------------- Template ------------------------------- */
  return (
    <div className='mx-auto flex min-h-[calc(100dvh-64px)] w-full max-w-7xl'>
      {/* Desktop sidebar */}
      <aside className='border-border bg-sidebar sticky top-16 hidden h-[calc(100dvh-64px)] w-64 overflow-y-auto border-r lg:block'>
        <SidebarContent />
      </aside>

      {/* Mobile wrapper */}
      <div className='flex flex-1 flex-col'>
        <div className='border-border bg-background sticky top-16 z-20 flex items-center justify-between border-b p-4 lg:hidden'>
          <span className='font-medium capitalize'>{user?.role ?? 'Dashboard'}</span>
          <Button variant='ghost' size='icon' onClick={() => setSidebarOpen((p) => !p)}>
            <Menu className='h-6 w-6' />
            <span className='sr-only'>Toggle sidebar</span>
          </Button>
        </div>

        {sidebarOpen && (
          <aside className='border-border bg-sidebar fixed top-16 z-40 h-[calc(100dvh-64px)] w-64 overflow-y-auto border-r lg:hidden'>
            <SidebarContent />
          </aside>
        )}

        <main className='flex-1 overflow-y-auto p-4'>{children}</main>
      </div>
    </div>
  )
}