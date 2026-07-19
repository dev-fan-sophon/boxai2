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
import { ExternalLink, MessageSquare } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { fetchActiveChatKey } from '@/features/chat/hooks/use-active-chat-key'
import { useChatPresets } from '@/features/chat/hooks/use-chat-presets'
import {
  chatLinkRequiresApiKey,
  resolveChatUrl,
} from '@/features/chat/lib/chat-links'

import type { PricingModel } from '../types'

/**
 * Apps tab: only real chat presets from /api/status (chats).
 * No mock app rankings or fabricated usage volumes.
 */
export function ModelDetailsApps(_props: { model: PricingModel }) {
  const { t } = useTranslation()
  const { chatPresets, serverAddress } = useChatPresets()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  if (chatPresets.length === 0) {
    return (
      <div className='rounded-xl border border-dashed px-4 py-10 text-center'>
        <MessageSquare className='text-muted-foreground mx-auto size-8 opacity-50' />
        <p className='text-foreground mt-3 text-sm font-medium'>
          {t('No app integrations configured')}
        </p>
        <p className='text-muted-foreground mx-auto mt-1 max-w-md text-xs'>
          {t(
            'When the administrator configures chat apps in system settings, they will appear here with your real API base URL and key placeholders.'
          )}
        </p>
      </div>
    )
  }

  const openPreset = async (preset: (typeof chatPresets)[number]) => {
    if (preset.type === 'web') {
      window.location.href = `/chat/${preset.id}`
      return
    }
    setLoadingId(preset.id)
    try {
      let apiKey: string | undefined
      if (chatLinkRequiresApiKey(preset.url)) {
        apiKey = await fetchActiveChatKey()
      }
      const resolved = resolveChatUrl({
        template: preset.url,
        apiKey,
        serverAddress,
      })
      if (!resolved) {
        toast.error(
          t(
            'Unable to prepare chat link. Please ensure you have an enabled API key.'
          )
        )
        return
      }
      window.open(resolved, '_blank', 'noopener,noreferrer')
    } catch {
      toast.error(
        t(
          'Unable to prepare chat link. Please ensure you have an enabled API key.'
        )
      )
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className='space-y-3'>
      <p className='text-muted-foreground text-xs'>
        {t(
          'Open a configured chat app with this site’s API base URL. Links use your real token when required.'
        )}
      </p>
      <ul className='grid gap-2 sm:grid-cols-2'>
        {chatPresets.map((preset) => (
          <li key={preset.id}>
            <Button
              type='button'
              variant='outline'
              className='h-auto w-full justify-start gap-2 px-3 py-2.5 text-left'
              disabled={loadingId === preset.id}
              onClick={() => {
                void openPreset(preset)
              }}
            >
              {preset.type === 'web' ? (
                <MessageSquare className='size-4 shrink-0' />
              ) : (
                <ExternalLink className='size-4 shrink-0' />
              )}
              <span className='min-w-0 flex-1 truncate text-sm font-medium'>
                {preset.name}
              </span>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
