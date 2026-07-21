/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { useTranslation } from 'react-i18next'

import type { PricingModel } from '@/features/pricing/types'
import { cn } from '@/lib/utils'

import { ModelBrandIcon } from '../studio/model-brand-icon'

type ModelHeroProps = {
  model?: PricingModel
  modelName: string
  className?: string
  compact?: boolean
}

export function ModelHero(props: ModelHeroProps) {
  const { t } = useTranslation()
  const description =
    props.model?.description ||
    props.model?.vendor_description ||
    props.model?.usage_notes ||
    t('Select a model from the catalog to start creating.')

  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-2xl flex-col items-center px-4 text-center',
        props.compact ? 'gap-3 py-4' : 'gap-5 py-8 md:py-12',
        props.className
      )}
    >
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full bg-white/[0.03] ring-1 ring-white/10',
          props.compact ? 'size-16' : 'size-24 md:size-28',
          'shadow-[0_0_60px_-12px_rgba(0,202,224,0.35)]'
        )}
      >
        <ModelBrandIcon
          modelName={props.modelName || 'model'}
          icon={props.model?.icon}
          vendorIcon={props.model?.vendor_icon}
          size={props.compact ? 36 : 56}
        />
      </div>
      {!props.compact && (
        <p className='font-mono text-sm font-semibold text-zinc-200'>
          {props.modelName || t('Select a model')}
        </p>
      )}
      <div className='max-h-40 overflow-y-auto rounded-2xl border border-white/[0.08] bg-black/30 px-4 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'>
        <p className='text-sm leading-relaxed text-pretty text-zinc-400'>
          {description}
        </p>
      </div>
    </div>
  )
}
