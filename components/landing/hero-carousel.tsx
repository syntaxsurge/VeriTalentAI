'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { Button } from '@/components/ui/button'

/* -------------------------------------------------------------------------- */
/*                                    DATA                                    */
/* -------------------------------------------------------------------------- */

const SLIDES = [
  {
    role: 'Candidate',
    src: '/images/candidate-dashboard.png',
    alt: 'Candidate dashboard screenshot',
  },
  {
    role: 'Recruiter',
    src: '/images/recruiter-dashboard.png',
    alt: 'Recruiter dashboard screenshot',
  },
  {
    role: 'Issuer',
    src: '/images/issuer-dashboard.png',
    alt: 'Issuer dashboard screenshot',
  },
] as const

/* -------------------------------------------------------------------------- */
/*                                 COMPONENT                                  */
/* -------------------------------------------------------------------------- */

/**
 * HeroCarousel shows one slide at a time with automatic cycling
 * and manual dot navigation; slides fade / scale for polished effect.
 */
export default function HeroCarousel() {
  const [index, setIndex] = useState(0)

  /* ------------------------ Auto-advance every 6 s ----------------------- */
  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 6000)
    return () => clearInterval(t)
  }, [])

  /* ---------------------------- Manual select ---------------------------- */
  const select = useCallback((i: number) => setIndex(i), [])

  /* ------------------------------- View ---------------------------------- */
  const slide = SLIDES[index]

  return (
    <div className='relative mx-auto w-full max-w-lg'>
      {/* Slide */}
      <AnimatePresence mode='wait'>
        <motion.div
          key={slide.role}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className='relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-1 backdrop-blur'
        >
          <div className='relative overflow-hidden rounded-[inherit]'>
            {/* Screenshot */}
            <Image
              src={slide.src}
              alt={slide.alt}
              width={1024}
              height={768}
              priority
              className='h-auto w-full rounded-[inherit] object-cover'
            />
            {/* Role label */}
            <span className='bg-background/70 absolute bottom-4 left-4 rounded-md px-3 py-1 text-sm font-semibold uppercase tracking-wide text-foreground backdrop-blur'>
              {slide.role}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
      <div className='mt-4 flex justify-center gap-2'>
        {SLIDES.map((_s, i) => (
          <Button
            key={i}
            onClick={() => select(i)}
            variant='ghost'
            size='icon'
            className='h-3 w-3 rounded-full p-0'
            aria-label={`Show ${_s.role} screenshot`}
          >
            <span
              className={`block h-2 w-2 rounded-full transition-colors ${
                i === index ? 'bg-primary' : 'bg-white/30 hover:bg-white/60'
              }`}
            />
          </Button>
        ))}
      </div>
    </div>
  )
}