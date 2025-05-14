import { asc, eq } from 'drizzle-orm'
import { Tag } from 'lucide-react'

import PageCard from '@/components/ui/page-card'
import { db } from '@/lib/db/drizzle'
import { planFeatures } from '@/lib/db/schema/pricing'
import { getStripePrices, getStripeProducts } from '@/lib/payments/stripe'

import UpdatePlanFeaturesForm from './update-plan-features-form'
import UpdatePlanPricingForm from './update-plan-pricing-form'

export const revalidate = 0

/**
 * Admin → Subscription Plans page
 * Allows editing of both marketing feature lists (DB-backed)
 * and Stripe-backed plan pricing for each tier.
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

  /* ------------------------------ Pricing ------------------------------- */
  const [prices, products] = await Promise.all([getStripePrices(), getStripeProducts()])

  const findPrice = (name: string) => {
    const prod = products.find((p) => p.name === name)
    const pr = prices.find((p) => p.productId === prod?.id)
    return (pr?.unitAmount ?? 0) / 100
  }

  const defaultPricing = {
    base: findPrice('Base'),
    plus: findPrice('Plus'),
  }

  /* ------------------------------- View --------------------------------- */
  return (
    <PageCard
      icon={Tag}
      title='Subscription Plans'
      description='Update pricing and feature lists for each subscription tier.'
    >
      <div className='space-y-12'>
        <UpdatePlanPricingForm defaultPricing={defaultPricing} />
        <UpdatePlanFeaturesForm defaultFeatures={defaultFeatures} />
      </div>
    </PageCard>
  )
}
