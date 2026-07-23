/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { useCallback, useEffect, useRef } from 'react'

import { usePlaygroundStore } from '@/stores/playground-store'

import {
  createConversation,
  getConversation,
  listConversations,
  putConversationMessages,
  updateConversation,
  type ServerMessage,
} from '../api'
import {
  getMessageContent,
  isChatSession,
  type ChatSession,
  type PlaygroundSession,
} from '../lib'
import type { Message } from '../types'

const SYNC_DEBOUNCE_MS = 1200

function toServerMessages(
  messages: Message[]
): Array<{ role: string; content: string; content_json?: string }> {
  return messages
    .filter((message) => message.from === 'user' || message.from === 'assistant')
    .filter((message) => message.status !== 'loading' && message.status !== 'streaming')
    .map((message) => ({
      role: message.from,
      content: getMessageContent(message),
    }))
}

function fromServerMessages(items: ServerMessage[]): Message[] {
  return items.map((item, index) => {
    let from: Message['from'] = 'user'
    if (item.role === 'assistant') from = 'assistant'
    else if (item.role === 'system') from = 'system'
    return {
      key: `srv-${item.id || index}`,
      from,
      versions: [{ id: `v-${item.id || index}`, content: item.content || '' }],
      status: 'complete' as const,
      createdAt: Date.now(),
    }
  })
}

/**
 * Best-effort cloud sync for chat sessions:
 * - Lazy-create a server conversation on first meaningful message
 * - Debounced PUT of finalized messages
 * - On login, merge remote conversation list into local sessions (no overwrite
 *   of richer local threads)
 */
export function useSessionCloudSync(isAuthenticated: boolean) {
  const sessions = usePlaygroundStore((state) => state.sessions)
  const updateActiveSession = usePlaygroundStore(
    (state) => state.updateActiveSession
  )
  const openSession = usePlaygroundStore((state) => state.openSession)
  const timerRef = useRef<number | null>(null)
  const inflightRef = useRef(false)
  const importedRef = useRef(false)

  const syncChatSession = useCallback(
    async (session: ChatSession) => {
      if (!isAuthenticated) return
      if (session.messages.length === 0) return
      const payload = toServerMessages(session.messages)
      if (payload.length === 0) return

      try {
        let serverId = session.serverId
        if (!serverId) {
          const created = await createConversation({
            title: session.title,
            model: session.model,
            group: session.group,
          })
          serverId = created.id
          // Bind server id onto the matching local session.
          const state = usePlaygroundStore.getState()
          const match = state.sessions.find((item) => item.id === session.id)
          if (match && isChatSession(match)) {
            usePlaygroundStore.setState({
              sessions: state.sessions.map((item) =>
                item.id === session.id
                  ? { ...match, serverId, isDraft: false }
                  : item
              ),
            })
          }
        } else {
          await updateConversation(serverId, {
            title: session.title,
            model: session.model,
            group: session.group,
          })
        }
        if (serverId) {
          await putConversationMessages(serverId, payload)
        }
      } catch {
        // Offline / API errors are non-fatal; local session remains source of truth.
      }
    },
    [isAuthenticated]
  )

  // Debounced push of the active chat session.
  useEffect(() => {
    if (!isAuthenticated) return
    const active = usePlaygroundStore.getState()
    const sessionId = active.activeSessionByModality.chat
    const session = active.sessions.find((item) => item.id === sessionId)
    if (!session || !isChatSession(session)) return
    if (session.messages.length === 0) return

    if (timerRef.current != null) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      void syncChatSession(session)
    }, SYNC_DEBOUNCE_MS)

    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current)
    }
  }, [isAuthenticated, sessions, syncChatSession])

  // One-shot pull of remote conversation list after login.
  useEffect(() => {
    if (!isAuthenticated || importedRef.current || inflightRef.current) return
    inflightRef.current = true
    void (async () => {
      try {
        const { items } = await listConversations({ page_size: 50 })
        if (!items.length) {
          importedRef.current = true
          return
        }
        const state = usePlaygroundStore.getState()
        const existingServerIds = new Set(
          state.sessions
            .filter(isChatSession)
            .map((session) => session.serverId)
            .filter((id): id is number => typeof id === 'number')
        )
        const additions: PlaygroundSession[] = []
        for (const item of items.slice(0, 30)) {
          if (existingServerIds.has(item.id)) continue
          // Fetch messages lazily only for a few recent ones.
          let messages: Message[] = []
          try {
            const detail = await getConversation(item.id)
            messages = fromServerMessages(detail.messages)
          } catch {
            messages = []
          }
          additions.push({
            id: `cloud_${item.id}`,
            serverId: item.id,
            modality: 'chat',
            title: item.title || 'Cloud chat',
            model: item.model || '',
            group: item.group || '',
            messages,
            isDraft: messages.length === 0,
            createdAt: (item.created_at || 0) * 1000 || Date.now(),
            updatedAt: (item.updated_at || 0) * 1000 || Date.now(),
          })
        }
        if (additions.length > 0) {
          usePlaygroundStore.setState({
            sessions: [...additions, ...state.sessions],
          })
        }
        importedRef.current = true
      } catch {
        // Ignore list failures; user can still work offline.
      } finally {
        inflightRef.current = false
      }
    })()
  }, [isAuthenticated, openSession, updateActiveSession])
}
