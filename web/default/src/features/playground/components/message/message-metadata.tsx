/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import type { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import type { MessageAlignment } from '../../lib'
import type { Message } from '../../types'

type MessageMetadataProps = {
  alignment: MessageAlignment
  message: Message
}

function formatMessageTime(timestamp?: number): string | undefined {
  if (typeof timestamp !== 'number' || !Number.isFinite(timestamp)) {
    return undefined
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(timestamp))
}

function formatDuration(
  durationMs: number | undefined,
  t: TFunction
): string | undefined {
  if (typeof durationMs !== 'number' || !Number.isFinite(durationMs)) {
    return undefined
  }

  if (durationMs < 1000) {
    return t('{{value}}ms', { value: Math.max(1, Math.round(durationMs)) })
  }

  return t('{{value}}s', { value: (durationMs / 1000).toFixed(2) })
}

export function MessageMetadata(props: MessageMetadataProps) {
  const { t } = useTranslation()
  const messageTime = formatMessageTime(props.message.createdAt)
  const duration = formatDuration(props.message.durationMs, t)
  let modelLabel: string | undefined
  if (props.message.from === 'assistant') {
    if (props.message.model) {
      modelLabel = props.message.model
    } else if (
      props.message.status === 'complete' ||
      props.message.status === 'error'
    ) {
      modelLabel = t('Model not recorded')
    }
  }
  const modelChange =
    props.message.modelChangeFrom && props.message.modelChangeTo
      ? `${props.message.modelChangeFrom} → ${props.message.modelChangeTo}`
      : undefined

  if (!messageTime && !duration && !modelLabel && !modelChange) {
    return null
  }

  if (modelChange) {
    return (
      <div
        className={cn(
          'text-muted-foreground mt-1 flex min-h-4 items-center justify-center gap-1.5 text-[11px] leading-none'
        )}
      >
        <span className='bg-muted/70 text-muted-foreground inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] ring-1 ring-border/60'>
          {t('Switched model')}: {modelChange}
        </span>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'text-muted-foreground mt-1 flex min-h-4 flex-wrap items-center gap-1.5 text-[11px] leading-none',
        props.alignment === 'right' && 'justify-end'
      )}
    >
      {modelLabel && (
        <span className='font-mono text-[10px] opacity-80'>{modelLabel}</span>
      )}
      {modelLabel && (messageTime || duration) && (
        <span aria-hidden='true'>·</span>
      )}
      {messageTime && <time>{messageTime}</time>}
      {duration && (
        <>
          {(messageTime || modelLabel) && <span aria-hidden='true'>·</span>}
          <span>{t('Response time: {{duration}}', { duration })}</span>
        </>
      )}
    </div>
  )
}
