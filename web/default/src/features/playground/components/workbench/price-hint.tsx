/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import {
  buildPriceHint,
  type PriceHint,
} from '../../lib/workbench/price-hint'
import type { PricingModel } from '@/features/pricing/types'

type PriceHintBadgeProps = {
  model?: PricingModel
  group: string
  groupRatio?: number
  className?: string
}

export function PriceHintBadge(props: PriceHintBadgeProps) {
  const { t } = useTranslation()
  const hint = buildPriceHint(props.model, props.group, props.groupRatio)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-300 ring-1 ring-amber-400/20',
        props.className
      )}
      title={formatHintTitle(hint, t)}
    >
      <Zap className='size-3 fill-current' aria-hidden='true' />
      <span>{formatHintLabel(hint, t)}</span>
    </span>
  )
}

function formatHintLabel(
  hint: PriceHint,
  t: (key: string) => string
): string {
  if (hint.kind === 'per_request' && hint.amountLabel) {
    return `${hint.amountLabel}/${t('run')}`
  }
  if (hint.amountLabel && hint.kind === 'token') {
    return `${t(hint.labelKey)} ${hint.amountLabel}`
  }
  if (hint.amountLabel && hint.kind === 'group') {
    return `${t(hint.labelKey)} ${hint.amountLabel}`
  }
  return t(hint.labelKey)
}

function formatHintTitle(
  hint: PriceHint,
  t: (key: string) => string
): string {
  if (hint.kind === 'per_request') {
    return t('Estimated per-request price from catalog (group-adjusted)')
  }
  return t('Billed by tokens or group ratio from catalog')
}
