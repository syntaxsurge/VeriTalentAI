import { MessageCircle } from 'lucide-react'

import PageCard from '@/components/ui/page-card'
import VeridaTelegramDashboard from '@/components/dashboard/candidate/verida-telegram-dashboard'
import { requireAuth } from '@/lib/auth/guards'
import { getVeridaToken } from '@/lib/db/queries/queries'

export const revalidate = 0

export default async function CandidateTelegramPage() {
  const user = await requireAuth(['candidate'])
  const tokenRow = await getVeridaToken(user.id)
  const veridaConnected = !!tokenRow

  return (
    <PageCard
      icon={MessageCircle}
      title='My Telegram Data'
      description='View your Telegram groups, messages, and keyword statistics stored in your Verida vault.'
    >
      <VeridaTelegramDashboard userId={user.id} veridaConnected={veridaConnected} />
    </PageCard>
  )
}
