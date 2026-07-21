/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { ImagePlus, QrCode, Trash2, Library } from 'lucide-react'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type MediaReference = {
  name: string
  dataUrl: string
  file?: File
}

type MediaReferenceSlotProps = {
  label: string
  value: MediaReference | null
  onChange: (value: MediaReference | null) => void
  accept?: string
  className?: string
  /** When false, file is kept in UI only (backend may not accept it yet). */
  attachable?: boolean
}

export function MediaReferenceSlot(props: MediaReferenceSlotProps) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const attachable = props.attachable !== false

  const handleFile = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error(t('Please choose an image file.'))
      return
    }
    if (file.size > 12 * 1024 * 1024) {
      toast.error(t('Image must be under 12MB.'))
      return
    }
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      const dataUrl = String(reader.result ?? '')
      if (!dataUrl) {
        toast.error(t('Could not read the selected image.'))
        return
      }
      props.onChange({ name: file.name, dataUrl, file })
      if (!attachable) {
        toast.info(t('Reference saved locally'), {
          description: t(
            'This model path may not send reference media yet. The file stays ready in the workbench.'
          ),
        })
      }
    })
    reader.addEventListener('error', () => {
      toast.error(t('Could not read the selected image.'))
    })
    reader.readAsDataURL(file)
  }

  return (
    <div className={cn('flex flex-col gap-1.5', props.className)}>
      <div className='flex items-center gap-1'>
        <button
          type='button'
          onClick={() => inputRef.current?.click()}
          className={cn(
            'group relative flex size-14 shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/15 bg-white/[0.03] transition-colors outline-none',
            'hover:border-cyan-400/40 hover:bg-cyan-500/5 focus-visible:ring-2 focus-visible:ring-cyan-400/50',
            props.value && 'border-solid border-white/20'
          )}
          aria-label={props.label}
        >
          {props.value ? (
            <img
              src={props.value.dataUrl}
              alt={props.value.name}
              className='size-full object-cover'
            />
          ) : (
            <>
              <ImagePlus
                className='size-4 text-zinc-500 group-hover:text-cyan-300'
                aria-hidden='true'
              />
              <span className='mt-0.5 max-w-[3.25rem] truncate text-[9px] text-zinc-500'>
                {props.label}
              </span>
            </>
          )}
        </button>
        <div className='flex flex-col gap-0.5'>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='size-7 text-zinc-500 hover:bg-white/5 hover:text-zinc-200'
            aria-label={t('Asset library')}
            onClick={() =>
              toast.info(t('Asset library'), {
                description: t(
                  'Asset library upload is coming soon. Use the file picker for now.'
                ),
              })
            }
          >
            <Library className='size-3.5' />
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='size-7 text-zinc-500 hover:bg-white/5 hover:text-zinc-200'
            aria-label={t('Scan to upload')}
            onClick={() =>
              toast.info(t('Scan to upload'), {
                description: t(
                  'QR upload is not available yet. Use the file picker on this device.'
                ),
              })
            }
          >
            <QrCode className='size-3.5' />
          </Button>
          {props.value && (
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='size-7 text-zinc-500 hover:bg-destructive/10 hover:text-red-300'
              aria-label={t('Remove reference')}
              onClick={() => props.onChange(null)}
            >
              <Trash2 className='size-3.5' />
            </Button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type='file'
        accept={props.accept ?? 'image/*'}
        className='sr-only'
        onChange={(event) => {
          handleFile(event.target.files?.[0])
          event.target.value = ''
        }}
      />
    </div>
  )
}
