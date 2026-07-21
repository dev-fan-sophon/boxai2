/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { MessageSquare, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

import type { Message } from '../../types'

type ChatHistoryPanelProps = {
  messages: Message[]
  onClear: () => void
}

export function ChatHistoryPanel(props: ChatHistoryPanelProps) {
  const { t } = useTranslation()
  const userTurns = props.messages.filter((message) => message.from === 'user')

  return (
    <div className='flex h-full min-h-0 flex-col'>
      <div className='border-b border-white/[0.06] p-3'>
        <h2 className='text-sm font-semibold text-zinc-100'>
          {t('Chat history')}
        </h2>
        <p className='text-xs text-zinc-500'>
          {t('Conversation stored in this browser.')}
        </p>
      </div>
      <div className='min-h-0 flex-1 space-y-2 overflow-y-auto p-2'>
        {userTurns.length === 0 && (
          <p className='px-3 py-10 text-center text-sm text-zinc-500'>
            {t('No messages yet. Start a conversation from the workbench.')}
          </p>
        )}
        {userTurns.map((message) => {
          const content = message.versions[0]?.content ?? ''
          return (
            <article
              key={message.key}
              className='rounded-lg border border-white/[0.06] bg-white/[0.03] p-3'
            >
              <div className='mb-1 flex items-center gap-1.5 text-[11px] text-zinc-500'>
                <MessageSquare className='size-3' aria-hidden='true' />
                {t('You')}
              </div>
              <p className='line-clamp-4 text-sm text-zinc-200'>{content}</p>
            </article>
          )
        })}
      </div>
      <div className='border-t border-white/[0.06] p-2'>
        <Button
          variant='ghost'
          size='sm'
          className='w-full justify-start text-zinc-300 hover:bg-destructive/10 hover:text-red-300'
          disabled={props.messages.length === 0}
          onClick={props.onClear}
        >
          <Trash2 className='size-4' />
          {t('Clear chat history')}
        </Button>
      </div>
    </div>
  )
}
