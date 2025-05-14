import { asc, eq } from 'drizzle-orm'
import { Tag } from 'lucide-react'

import PageCard from '@/components/ui/page-card'
import { db } from '@/lib/db/drizzle'
import { planFeatures } from '@/lib/db/schema/pricing'

import UpdatePlanFeaturesForm from './update-plan-features-form'

export const revalidate = 0

/**
 * Admin → Subscription Plans page
 * Allows an admin to edit database-driven feature lists for each tier.
 * On-chain price management has been removed in favour of Stripe-based billing.
 */
export default async function AdminSubscriptionPlansPage() {
  /* -------------------------- Feature lists ----------------------------- */
  const [freeRows, baseRows, plusRows] = await Promise.all([
    db
      .select({ feature: planFeatures.feature })
      .from(planFeatures)
      .where(eq(planFeatures.planKey, 'free'))
      .orderBy(asc(planFeatures.sortOrder)),
    db
      .select({ feature: planFeatures.feature })
      .from(planFeatures)
      .where(eq(planFeatures.planKey, 'base'))
      .orderBy(asc(planFeatures.sortOrder)),
    db
      .select({ feature: planFeatures.feature })
      .from(planFeatures)
      .where(eq(planFeatures.planKey, 'plus'))
      .orderBy(asc(planFeatures.sortOrder)),
  ])

  const defaultFeatures = {
    free: freeRows.map((r) => r.feature),
    base: baseRows.map((r) => r.feature),
    plus: plusRows.map((r) => r.feature),
  }

  /* ------------------------------- View --------------------------------- */
  return (
    <PageCard
      icon={Tag}
      title='Subscription Plans'
      description='Update marketing features for every subscription tier.'
    >
      <UpdatePlanFeaturesForm defaultFeatures={defaultFeatures} />
    </PageCard>
  )
}
