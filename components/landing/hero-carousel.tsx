'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ImageLightbox from '@/components/ui/images/image-lightbox'

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
 * HeroCarousel now shows a single slide with fade/scale animation,
 * offers clearly-labeled buttons for direct role navigation, and
 * opens an ImageLightbox when the screenshot is clicked.
 */
export default function HeroCarousel() {
  const [index, setIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  /* ------------------------ Auto-advance every 6 s ----------------------- */
  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 6000)
    return () => clearInterval(t)
  }, [])

  /* -------------------------- Navigation handlers ------------------------ */
  const select = useCallback((i: number) => setIndex(i), [])
  const handleNext = useCallback(() => setIndex((i) => (i + 1) % SLIDES.length), [])
  const handlePrev = useCallback(
    () => setIndex((i) => (i === 0 ? SLIDES.length - 1 : i - 1)),
    [],
  )

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
          <div
            className='relative cursor-zoom-in overflow-hidden rounded-[inherit]'
            onClick={() => setLightboxOpen(true)}
          >
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

      {/* Role buttons */}
      <div className='mt-6 flex flex-wrap items-center justify-center gap-3'>
        {/* Previous */}
        <Button
          variant='outline'
          size='icon'
          onClick={handlePrev}
          aria-label='Previous role'
          className='flex-shrink-0'
        >
          <ChevronLeft className='h-4 w-4' />
        </Button>

        {/* Role buttons */}
        {SLIDES.map((s, i) => (
          <Button
            key={s.role}
            size='sm'
            variant={i === index ? 'default' : 'outline'}
            onClick={() => select(i)}
            className='gap-1'
          >
            {s.role}
          </Button>
        ))}

        {/* Next */}
        <Button
          variant='outline'
          size='icon'
          onClick={handleNext}
          aria-label='Next role'
          className='flex-shrink-0'
        >
          <ChevronRight className='h-4 w-4' />
        </Button>
      </div>

      {/* Lightbox */}
      <ImageLightbox
        images={SLIDES.map((s) => s.src)}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        startIndex={index}
      />

      {/* Hide prev/next handlers from accessibility tree */}
      <button type='button' className='sr-only' onClick={handlePrev}>
        Previous slide
      </button>
      <button type='button' className='sr-only' onClick={handleNext}>
        Next slide
      </button>
    </div>
  )
}