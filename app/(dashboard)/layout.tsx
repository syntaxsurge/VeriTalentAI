'use client'

import { useEffect, useState } from 'react'
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

  const [user, setUser] = useState<any | null | undefined>(undefined)

  // Resolve the promise client‑side to avoid mismatched HTML on hydration
  useEffect(() => {
    let mounted = true
    userPromise.then((u) => {
      if (mounted) setUser(u)
    })
    return () => {
      mounted = false
    }
  }, [userPromise])

  // Until the promise resolves, fall back to no intrinsic nav (keeps markup identical)
  const intrinsicNav = roleNav(user?.role)

  /* ----------------------------- Sidebar markup ---------------------------- */
  function SidebarContent() {
    return (
      <>
        <SidebarNav title='Main' items={MAIN_NAV} />

        {intrinsicNav.length > 0 && (
          <SidebarNav title={roleTitle(user?.role)} items={intrinsicNav} />
        )}

        {user && <SidebarNav title='Settings' items={SETTINGS_NAV} />}
      </>
    )
  }

  /* ------------------------------- Template ------------------------------- */
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className='mx-auto flex min-h-[calc(100dvh-64px)] w-full max-w-7xl'>
      {/* Desktop sidebar */}
      <aside className='sticky top-16 hidden h-[calc(100dvh-64px)] w-64 overflow-y-auto border-r bg-background shadow-sm ring-1 ring-border/30 lg:block'>
        <SidebarContent />
      </aside>

      {/* Mobile wrapper */}
      <div className='flex flex-1 flex-col'>
        <div className='sticky top-16 z-20 flex items-center justify-between border-b bg-background p-4 lg:hidden'>
          <span className='font-medium capitalize'>{user?.role ?? 'Dashboard'}</span>
          <Button variant='ghost' size='icon' onClick={() => setSidebarOpen((p) => !p)}>
            <Menu className='h-6 w-6' />
            <span className='sr-only'>Toggle sidebar</span>
          </Button>
        </div>

        {sidebarOpen && (
          <aside className='fixed top-16 z-40 h-[calc(100dvh-64px)] w-64 overflow-y-auto border-r bg-background shadow-md ring-1 ring-border/30 lg:hidden'>
            <SidebarContent />
          </aside>
        )}

        <main className='flex-1 overflow-y-auto p-4'>{children}</main>
      </div>
    </div>
  )
}