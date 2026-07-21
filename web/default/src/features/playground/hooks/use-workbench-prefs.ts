/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { useCallback, useEffect, useState } from 'react'

import {
  DEFAULT_WORKBENCH_PREFS,
  loadWorkbenchPrefs,
  MAX_MY_WORKS,
  MAX_PINNED_MODELS,
  MAX_RECENT_PROMPTS,
  normalizeChatTools,
  saveWorkbenchPrefs,
  type DuoCollabState,
  type InspirationWork,
  type RecentPrompt,
  type WorkbenchChatTools,
  type WorkbenchPrefs,
} from '../lib/workbench/workbench-prefs'
import type { StudioModality } from '../types'

export function useWorkbenchPrefs() {
  const [prefs, setPrefs] = useState<WorkbenchPrefs>(() => loadWorkbenchPrefs())

  useEffect(() => {
    saveWorkbenchPrefs(prefs)
  }, [prefs])

  const togglePin = useCallback((modelName: string) => {
    setPrefs((prev) => {
      const exists = prev.pinnedModels.includes(modelName)
      const pinnedModels = exists
        ? prev.pinnedModels.filter((name) => name !== modelName)
        : [modelName, ...prev.pinnedModels].slice(0, MAX_PINNED_MODELS)
      return { ...prev, pinnedModels }
    })
  }, [])

  const updateChatTools = useCallback(
    (patch: Partial<WorkbenchChatTools>) => {
      setPrefs((prev) => ({
        ...prev,
        chatTools: normalizeChatTools({ ...prev.chatTools, ...patch }),
      }))
    },
    []
  )

  const updateDuo = useCallback((patch: Partial<DuoCollabState>) => {
    setPrefs((prev) => ({
      ...prev,
      duo: { ...prev.duo, ...patch },
    }))
  }, [])

  const pushRecentPrompt = useCallback(
    (input: {
      prompt: string
      modality: StudioModality
      model: string
    }) => {
      const prompt = input.prompt.trim()
      if (!prompt) return
      const entry: RecentPrompt = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        prompt,
        modality: input.modality,
        model: input.model,
        createdAt: Date.now(),
      }
      setPrefs((prev) => ({
        ...prev,
        recentPrompts: [
          entry,
          ...prev.recentPrompts.filter((item) => item.prompt !== prompt),
        ].slice(0, MAX_RECENT_PROMPTS),
      }))
    },
    []
  )

  const saveWork = useCallback((work: Omit<InspirationWork, 'id' | 'createdAt'>) => {
    const entry: InspirationWork = {
      ...work,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: Date.now(),
    }
    setPrefs((prev) => ({
      ...prev,
      myWorks: [entry, ...prev.myWorks].slice(0, MAX_MY_WORKS),
    }))
  }, [])

  const removeWork = useCallback((id: string) => {
    setPrefs((prev) => ({
      ...prev,
      myWorks: prev.myWorks.filter((item) => item.id !== id),
    }))
  }, [])

  const resetPrefs = useCallback(() => {
    setPrefs(structuredClone(DEFAULT_WORKBENCH_PREFS))
  }, [])

  return {
    prefs,
    togglePin,
    updateChatTools,
    updateDuo,
    pushRecentPrompt,
    saveWork,
    removeWork,
    resetPrefs,
  }
}
