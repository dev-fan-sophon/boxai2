/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { Check, Download, Loader2 } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { MOTION_TRANSITION } from '@/lib/motion'
import { cn } from '@/lib/utils'

type GenerationImageCardProps = {
  url: string
  alt: string
  caption?: string
  filename: string
  downloading: boolean
  onDownload: () => void
  index?: number
}

export function GenerationImageCard(props: GenerationImageCardProps) {
  const { t } = useTranslation()
  const shouldReduce = useReducedMotion()
  const [loaded, setLoaded] = useState(false)
  const [justDownloaded, setJustDownloaded] = useState(false)

  useEffect(() => {
    if (!justDownloaded) return
    const id = window.setTimeout(() => setJustDownloaded(false), 1600)
    return () => window.clearTimeout(id)
  }, [justDownloaded])

  const handleDownload = () => {
    props.onDownload()
    setJustDownloaded(true)
  }

  const body = (
    <figure
      className={cn(
        'border-border/80 bg-muted/40 group relative overflow-hidden rounded-2xl border',
        'shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] transition-shadow duration-300',
        'hover:border-border hover:shadow-md'
      )}
    >
      <div className='bg-muted/60 relative aspect-square'>
        {!loaded && <div className='skeleton-shimmer absolute inset-0' />}
        <img
          src={props.url}
          alt={props.alt}
          className={cn(
            'absolute inset-0 size-full object-contain transition-opacity duration-500',
            loaded ? 'opacity-100' : 'opacity-0'
          )}
          referrerPolicy='no-referrer'
          loading='lazy'
          decoding='async'
          onLoad={() => setLoaded(true)}
        />
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 flex items-end justify-end gap-2 p-2.5',
            'bg-gradient-to-t from-black/55 via-black/20 to-transparent',
            'opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100'
          )}
        >
          <Button
            type='button'
            size='sm'
            variant='secondary'
            className='bg-background/90 text-foreground hover:bg-background h-8 shadow-sm backdrop-blur'
            disabled={props.downloading}
            onClick={handleDownload}
          >
            <DownloadActionIcon
              downloading={props.downloading}
              done={justDownloaded && !props.downloading}
            />
            {justDownloaded && !props.downloading
              ? t('Saved')
              : t('Download')}
          </Button>
        </div>
      </div>
      {props.caption && (
        <figcaption className='text-muted-foreground line-clamp-2 p-2.5 text-xs text-pretty'>
          {props.caption}
        </figcaption>
      )}
    </figure>
  )

  if (shouldReduce) return body

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        ...MOTION_TRANSITION.default,
        delay: (props.index ?? 0) * 0.06,
      }}
    >
      {body}
    </motion.div>
  )
}

function DownloadActionIcon(props: {
  downloading: boolean
  done: boolean
}) {
  if (props.downloading) {
    return <Loader2 className='size-3.5 animate-spin' />
  }
  if (props.done) {
    return <Check className='size-3.5 text-emerald-500' />
  }
  return <Download className='size-3.5' />
}

type GenerationMediaResultProps = {
  children: React.ReactNode
  className?: string
  actions?: React.ReactNode
}

/** Shared reveal wrapper for video / audio result panels. */
export function GenerationMediaResult(props: GenerationMediaResultProps) {
  const shouldReduce = useReducedMotion()
  const body = (
    <div className={cn('mx-auto w-full space-y-3', props.className)}>
      {props.children}
      {props.actions}
    </div>
  )
  if (shouldReduce) return body
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={MOTION_TRANSITION.default}
    >
      {body}
    </motion.div>
  )
}
