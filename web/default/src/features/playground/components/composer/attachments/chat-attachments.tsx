/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { FileText, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import type { ChatAttachment } from '../../../types'

export function ChatAttachmentStrip(props: {
  attachments: ChatAttachment[]
  onRemove: (index: number) => void
}) {
  const { t } = useTranslation()
  if (props.attachments.length === 0) return null

  return (
    <div className='no-scrollbar flex gap-2 overflow-x-auto px-3 pb-2 sm:flex-wrap sm:overflow-visible sm:px-5'>
      {props.attachments.map((attachment, index) => (
        <div key={attachment.id} className='relative shrink-0'>
          {attachment.type === 'image' ? (
            <img
              src={attachment.dataUrl}
              alt={t('Attachment {{index}}', { index: index + 1 })}
              className='border-border size-16 rounded-xl border object-cover sm:size-14 sm:rounded-lg'
            />
          ) : (
            <div className='border-border bg-muted flex h-16 max-w-[11rem] items-center gap-2 rounded-xl border px-3 sm:h-14 sm:max-w-40 sm:rounded-lg'>
              <FileText className='text-muted-foreground size-5 shrink-0' />
              <span className='truncate text-xs' title={attachment.name}>
                {attachment.name}
              </span>
            </div>
          )}
          <button
            type='button'
            aria-label={t('Remove attachment')}
            onClick={() => props.onRemove(index)}
            className='bg-background border-border absolute -top-1.5 -right-1.5 flex size-6 touch-manipulation items-center justify-center rounded-full border shadow-sm sm:size-auto sm:p-0.5'
          >
            <X className='size-3.5 sm:size-3' />
          </button>
        </div>
      ))}
    </div>
  )
}
