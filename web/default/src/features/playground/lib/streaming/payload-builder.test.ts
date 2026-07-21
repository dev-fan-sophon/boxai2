/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { describe, expect, it } from 'vitest'

import { DEFAULT_CONFIG, DEFAULT_PARAMETER_ENABLED } from '../../constants'
import type { Message } from '../../types'
import { buildChatCompletionPayload } from './payload-builder'

function userMessage(content: string, key = content): Message {
  return {
    key,
    from: 'user',
    versions: [{ id: `${key}-v`, content }],
    status: 'complete',
  }
}

function assistantMessage(content: string, key = content): Message {
  return {
    key,
    from: 'assistant',
    versions: [{ id: `${key}-v`, content }],
    status: 'complete',
  }
}

describe('buildChatCompletionPayload', () => {
  it('omits whitespace-only system prompts', () => {
    const payload = buildChatCompletionPayload(
      [userMessage('hello')],
      DEFAULT_CONFIG,
      DEFAULT_PARAMETER_ENABLED,
      { systemPrompt: '   \n\t  ' }
    )
    expect(payload.messages).toEqual([{ role: 'user', content: 'hello' }])
  })

  it('prepends a trimmed system prompt before history', () => {
    const payload = buildChatCompletionPayload(
      [userMessage('hello'), assistantMessage('hi')],
      DEFAULT_CONFIG,
      DEFAULT_PARAMETER_ENABLED,
      { systemPrompt: '  You are helpful.  ', carryHistory: true }
    )
    expect(payload.messages[0]).toEqual({
      role: 'system',
      content: 'You are helpful.',
    })
    expect(payload.messages.slice(1)).toEqual([
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi' },
    ])
  })

  it('keeps only the last user turn when carryHistory is false', () => {
    const payload = buildChatCompletionPayload(
      [
        userMessage('first', 'u1'),
        assistantMessage('reply', 'a1'),
        userMessage('second', 'u2'),
      ],
      DEFAULT_CONFIG,
      DEFAULT_PARAMETER_ENABLED,
      { carryHistory: false, systemPrompt: 'persona' }
    )
    expect(payload.messages).toEqual([
      { role: 'system', content: 'persona' },
      { role: 'user', content: 'second' },
    ])
  })

  it('returns only system when history is empty and system is set', () => {
    const payload = buildChatCompletionPayload(
      [],
      DEFAULT_CONFIG,
      DEFAULT_PARAMETER_ENABLED,
      { systemPrompt: 'solo', carryHistory: false }
    )
    expect(payload.messages).toEqual([{ role: 'system', content: 'solo' }])
  })

  it('returns empty messages when history is empty and no system prompt', () => {
    const payload = buildChatCompletionPayload(
      [],
      DEFAULT_CONFIG,
      DEFAULT_PARAMETER_ENABLED,
      { carryHistory: false }
    )
    expect(payload.messages).toEqual([])
  })

  it('clamps oversized system prompts before send', () => {
    const huge = 'x'.repeat(12_000)
    const payload = buildChatCompletionPayload(
      [userMessage('hi')],
      DEFAULT_CONFIG,
      DEFAULT_PARAMETER_ENABLED,
      { systemPrompt: huge }
    )
    expect(payload.messages[0]?.role).toBe('system')
    expect(String(payload.messages[0]?.content).length).toBe(8000)
  })
})
