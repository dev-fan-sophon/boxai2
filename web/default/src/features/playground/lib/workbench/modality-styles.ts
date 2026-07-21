/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import type { StudioModality } from '../../types'

export const MODALITY_COLORS: Record<
  StudioModality | 'tool',
  { tag: string; bg: string; text: string }
> = {
  chat: {
    tag: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-300',
  },
  image: {
    tag: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    bg: 'bg-purple-500/10',
    text: 'text-purple-300',
  },
  video: {
    tag: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    bg: 'bg-orange-500/10',
    text: 'text-orange-300',
  },
  audio: {
    tag: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-300',
  },
  tool: {
    tag: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    bg: 'bg-amber-500/10',
    text: 'text-amber-300',
  },
}

export function modalityLabelKey(modality: StudioModality): string {
  return modality[0].toUpperCase() + modality.slice(1)
}

/** Heuristic NEW badge when release_date is within ~60 days or name suggests a new flagship. */
export function isLikelyNewModel(model: {
  model_name: string
  release_date?: string
  tags?: string
}): boolean {
  const tags = (model.tags ?? '').toLowerCase()
  if (/\bnew\b|新品|最新/.test(tags)) return true
  if (model.release_date) {
    const ts = Date.parse(model.release_date)
    if (Number.isFinite(ts) && Date.now() - ts < 60 * 24 * 60 * 60 * 1000) {
      return true
    }
  }
  // light name heuristic for very recent-looking model codes
  return /-(latest|preview|exp)\b/i.test(model.model_name)
}
