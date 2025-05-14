'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Rocket, Sparkles, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*                                    DATA                                    */
/* -------------------------------------------------------------------------- */

const HERO_FEATURES = [
  { icon: Sparkles, label: 'AI-Validated Skills' },
  { icon: ShieldCheck, label: 'On-Ledger Proofs' },
  { icon: Rocket, label: 'Zero Crypto Setup' },
] as const

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export default function HeroSection() {
  return (
    <section
      id='hero'
      className='relative isolate overflow-hidden bg-gradient-to-br from-[#0b0f19] via-[#141b2d] to-[#0b0f19] pb-32 pt-15'
    >
      {/* Radial backdrop */}
      <div
        aria-hidden
        className='absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_30%,rgba(0,255,190,0.12)_0%,transparent_60%)]'
      />

      <div className='mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:items-center'>
        {/* ── Copy block ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className='text-center lg:text-left'
        >
          <h1 className='bg-gradient-to-r from-white to-neutral-300 bg-clip-text text-balance text-5xl font-extrabold leading-tight text-transparent sm:text-6xl'>
            Proof-First Hiring<br />
            for Every Team
          </h1>

          <p className='mt-6 max-w-xl text-lg/relaxed text-white/90'>
            Viskify transforms résumés into tamper-evident credentials on the cheqd network so you
            can verify <em>what</em> talent did instead of guessing.
          </p>

          {/* Feature pills */}
          <ul className='mt-8 flex flex-wrap justify-center gap-3 lg:justify-start'>
            {HERO_FEATURES.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className='flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur'
              >
                <Icon className='h-4 w-4 shrink-0 text-amber-300' />
                {label}
              </li>
            ))}
          </ul>

          {/* CTAs */}
          <div className='mt-10 flex flex-wrap justify-center gap-4 lg:justify-start'>
            <GradientButton href='/sign-up'>Launch Workspace</GradientButton>
            <GradientButton href='/#demo' tone='outline'>
              Watch Demo
            </GradientButton>
          </div>
        </motion.div>

        {/* ── Screenshot mockup ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          className='relative mx-auto w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-1 backdrop-blur'
        >
          <div className='bg-background relative overflow-hidden rounded-[inherit]'>
            <Image
              src='/images/dashboard-screenshot.png'
              alt='Viskify dashboard screenshot'
              width={1024}
              height={768}
              priority
              className='h-auto w-full rounded-[inherit] object-cover'
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*                            GRADIENT BUTTON                                 */
/* -------------------------------------------------------------------------- */

type GradientButtonProps = Omit<
  React.ComponentPropsWithoutRef<typeof Button>,
  'variant' | 'asChild'
> & { href: string; tone?: 'solid' | 'outline' }

function GradientButton({
  href,
  children,
  tone = 'solid',
  className,
  ...props
}: GradientButtonProps) {
  const solid = tone === 'solid'
  return (
    <Button
      asChild
      size='lg'
      className={cn(
        'relative isolate overflow-hidden rounded-full px-8 py-3 font-semibold shadow-xl transition-transform duration-200 focus-visible:outline-none',
        solid
          ? 'bg-primary text-primary-foreground hover:-translate-y-0.5 hover:shadow-2xl'
          : 'ring-border bg-white/10 text-white/90 ring-1 backdrop-blur hover:bg-white/20 hover:text-white',
        className,
      )}
      {...props}
    >
      <Link href={href}>
        <span className='relative z-10 flex items-center gap-2'>{children}</span>
        {solid && (
          <span
            aria-hidden='true'
            className='bg-viskify-gradient absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100'
          />
        )}
      </Link>
    </Button>
  )
}