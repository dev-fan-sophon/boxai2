/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { AlertCircle, ImageIcon, Music2, Video } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Shimmer } from '@/components/ai-elements/shimmer'
import { Button } from '@/components/ui/button'
import { MOTION_TRANSITION } from '@/lib/motion'
import { cn } from '@/lib/utils'

import type { StudioModality } from '../../types'

type GenerationProgressProps = {
  modality: Exclude<StudioModality, 'chat'>
  /** Number of image placeholders while generating */
  imageCount?: number
  /** Soft progress 0–100 when the backend reports none (video indeterminate) */
  percent?: number | null
  /** Optional secondary status line (e.g. video task id) */
  detail?: string
  className?: string
}

const STATUS_KEYS: Record<Exclude<StudioModality, 'chat'>, string[]> = {
  image: [
    'Composing the scene…',
    'Painting details…',
    'Refining lighting…',
    'Almost ready…',
  ],
  video: [
    'Storyboarding frames…',
    'Rendering motion…',
    'Encoding video…',
    'Finishing touches…',
  ],
  audio: [
    'Preparing voice…',
    'Synthesizing speech…',
    'Balancing tone…',
    'Almost ready…',
  ],
}

/**
 * Full-bleed generation state: shimmering placeholders, rotating status copy,
 * and a soft progress bar. Respects reduced-motion preferences.
 */
export function GenerationProgress(props: GenerationProgressProps) {
  const { t } = useTranslation()
  const shouldReduce = useReducedMotion()
  const statuses = STATUS_KEYS[props.modality]
  const [statusIndex, setStatusIndex] = useState(0)

  useEffect(() => {
    if (shouldReduce) return
    const id = window.setInterval(() => {
      setStatusIndex((i) => (i + 1) % statuses.length)
    }, 2800)
    return () => window.clearInterval(id)
  }, [shouldReduce, statuses.length])

  const count = Math.min(Math.max(props.imageCount ?? 1, 1), 4)
  const hasHardPercent =
    typeof props.percent === 'number' &&
    Number.isFinite(props.percent) &&
    props.percent > 0
  const softPercent = hasHardPercent
    ? Math.min(100, Math.max(0, props.percent as number))
    : null

  return (
    <div
      className={cn(
        'animate-in fade-in-0 slide-in-from-bottom-2 flex w-full flex-col gap-5 duration-300',
        props.className
      )}
      role='status'
      aria-live='polite'
    >
      {props.modality === 'image' && (
        <div
          className={cn(
            'grid w-full gap-3',
            count === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
          )}
        >
          {(['slot-a', 'slot-b', 'slot-c', 'slot-d'] as const)
            .slice(0, count)
            .map((id, i) => (
              <ImagePlaceholder
                key={id}
                delay={shouldReduce ? 0 : i * 0.08}
                reduceMotion={Boolean(shouldReduce)}
              />
            ))}
        </div>
      )}

      {props.modality === 'video' && (
        <VideoPlaceholder reduceMotion={Boolean(shouldReduce)} />
      )}

      {props.modality === 'audio' && (
        <AudioPlaceholder reduceMotion={Boolean(shouldReduce)} />
      )}

      <div className='mx-auto flex w-full max-w-md flex-col items-center gap-3 px-2 text-center'>
        <div className='flex items-center gap-2'>
          <span
            className={cn(
              'bg-primary/15 text-primary inline-flex size-8 items-center justify-center rounded-full',
              !shouldReduce && 'animate-pulse'
            )}
            aria-hidden='true'
          >
            <ModalityGlyph modality={props.modality} />
          </span>
          <AnimatePresence mode='wait' initial={false}>
            <motion.div
              key={statusIndex}
              initial={shouldReduce ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduce ? undefined : { opacity: 0, y: -4 }}
              transition={MOTION_TRANSITION.fast}
            >
              <Shimmer className='text-sm font-medium' duration={2.4}>
                {t(statuses[statusIndex] ?? statuses[0])}
              </Shimmer>
            </motion.div>
          </AnimatePresence>
        </div>

        {props.detail && (
          <p className='text-muted-foreground max-w-full truncate font-mono text-[11px]'>
            {props.detail}
          </p>
        )}

        <div className='bg-muted relative h-1.5 w-full overflow-hidden rounded-full'>
          {softPercent !== null ? (
            <motion.div
              className='bg-primary absolute inset-y-0 left-0 rounded-full'
              initial={false}
              animate={{ width: `${softPercent}%` }}
              transition={MOTION_TRANSITION.default}
            />
          ) : (
            <div
              className={cn(
                'from-primary/10 via-primary to-primary/10 absolute inset-y-0 w-1/3 rounded-full bg-gradient-to-r',
                !shouldReduce && 'generation-indeterminate'
              )}
            />
          )}
        </div>

        {softPercent !== null && (
          <p className='text-muted-foreground text-xs tabular-nums'>
            {Math.round(softPercent)}%
          </p>
        )}
      </div>
    </div>
  )
}

function ModalityGlyph(props: {
  modality: Exclude<StudioModality, 'chat'>
}) {
  if (props.modality === 'image') return <ImageIcon className='size-4' />
  if (props.modality === 'video') return <Video className='size-4' />
  return <Music2 className='size-4' />
}

function ImagePlaceholder(props: { delay: number; reduceMotion: boolean }) {
  return (
    <motion.div
      initial={props.reduceMotion ? false : { opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...MOTION_TRANSITION.default, delay: props.delay }}
      className='border-border/70 bg-muted/40 relative aspect-square overflow-hidden rounded-2xl border'
    >
      <div className='skeleton-shimmer absolute inset-0' />
      <div className='absolute inset-0 flex items-center justify-center'>
        <div className='bg-background/40 text-muted-foreground flex size-14 items-center justify-center rounded-full backdrop-blur-sm'>
          <ImageIcon className='size-6 opacity-70' aria-hidden='true' />
        </div>
      </div>
      {!props.reduceMotion && (
        <div className='from-primary/0 via-primary/10 to-primary/0 pointer-events-none absolute inset-0 bg-gradient-to-tr opacity-60' />
      )}
    </motion.div>
  )
}

function VideoPlaceholder(props: { reduceMotion: boolean }) {
  return (
    <div className='border-border/70 bg-muted/40 relative mx-auto aspect-video w-full max-w-3xl overflow-hidden rounded-2xl border'>
      <div className='skeleton-shimmer absolute inset-0' />
      <div className='absolute inset-0 flex flex-col items-center justify-center gap-3'>
        <div
          className={cn(
            'bg-background/50 text-muted-foreground flex size-16 items-center justify-center rounded-full backdrop-blur-sm',
            !props.reduceMotion && 'animate-pulse'
          )}
        >
          <Video className='size-7 opacity-80' aria-hidden='true' />
        </div>
        <div className='flex gap-1.5'>
          {(['d0', 'd1', 'd2'] as const).map((id, i) => (
            <span
              key={id}
              className={cn(
                'bg-muted-foreground/40 size-1.5 rounded-full',
                !props.reduceMotion && 'animate-bounce'
              )}
              style={
                props.reduceMotion
                  ? undefined
                  : { animationDelay: `${i * 120}ms` }
              }
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function AudioPlaceholder(props: { reduceMotion: boolean }) {
  const bars = [
    { id: 'b0', h: 0.35 },
    { id: 'b1', h: 0.7 },
    { id: 'b2', h: 0.5 },
    { id: 'b3', h: 0.9 },
    { id: 'b4', h: 0.45 },
    { id: 'b5', h: 0.75 },
    { id: 'b6', h: 0.4 },
    { id: 'b7', h: 0.85 },
    { id: 'b8', h: 0.55 },
    { id: 'b9', h: 0.65 },
  ]
  return (
    <div className='border-border/70 bg-muted/40 mx-auto flex w-full max-w-md flex-col items-center gap-5 rounded-2xl border px-6 py-8'>
      <div
        className={cn(
          'bg-primary/10 text-primary flex size-14 items-center justify-center rounded-full',
          !props.reduceMotion && 'animate-pulse'
        )}
      >
        <Music2 className='size-6' aria-hidden='true' />
      </div>
      <div className='flex h-12 items-end gap-1' aria-hidden='true'>
        {bars.map((bar, i) => (
          <span
            key={bar.id}
            className={cn(
              'bg-primary/70 w-1.5 rounded-full',
              !props.reduceMotion && 'generation-wave'
            )}
            style={{
              height: `${bar.h * 100}%`,
              animationDelay: props.reduceMotion ? undefined : `${i * 80}ms`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

type GenerationErrorProps = {
  message: string
  onRetry?: () => void
  retryDisabled?: boolean
}

export function GenerationErrorState(props: GenerationErrorProps) {
  const { t } = useTranslation()
  return (
    <div
      className='border-destructive/30 bg-destructive/5 animate-in fade-in-0 zoom-in-95 mx-auto w-full max-w-md rounded-2xl border px-6 py-10 text-center duration-200'
      role='alert'
    >
      <div className='bg-destructive/10 text-destructive mx-auto mb-3 flex size-11 items-center justify-center rounded-full'>
        <AlertCircle className='size-5' aria-hidden='true' />
      </div>
      <p className='text-foreground text-sm font-medium'>
        {t('Generation failed.')}
      </p>
      <p className='text-muted-foreground mt-1.5 text-xs text-pretty'>
        {props.message}
      </p>
      {props.onRetry && (
        <Button
          className='mt-4'
          size='sm'
          variant='outline'
          onClick={props.onRetry}
          disabled={props.retryDisabled}
        >
          {t('Try again')}
        </Button>
      )}
    </div>
  )
}
