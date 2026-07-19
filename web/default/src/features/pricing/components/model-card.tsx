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
import { ChevronRight, Copy } from 'lucide-react'
import { memo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import { cn } from '@/lib/utils'

import { DEFAULT_TOKEN_UNIT } from '../constants'
import {
  getDynamicDisplayGroupRatio,
  getDynamicPricingSummary,
} from '../lib/dynamic-price'
import { parseTags } from '../lib/filters'
import { getGroupSavingsPercent, isTokenBasedModel } from '../lib/model-helpers'
import { formatPrice, formatRequestPrice } from '../lib/price'
import type { PricingModel, TokenUnit } from '../types'
import type { ModelPerfBadgeData } from './model-perf-badge'

export interface ModelCardProps {
  model: PricingModel
  onClick: () => void
  priceRate?: number
  usdExchangeRate?: number
  tokenUnit?: TokenUnit
  showRechargePrice?: boolean
  selectedGroup?: string
  perf?: ModelPerfBadgeData
}

function isRecentlyReleased(model: PricingModel): boolean {
  const raw = model.release_date
  if (!raw) return false
  const ts = Date.parse(raw)
  if (!Number.isFinite(ts)) return false
  const days = (Date.now() - ts) / (1000 * 60 * 60 * 24)
  return days >= 0 && days <= 30
}

/**
 * Apilio-style Model Hub card: name, capability tags, unit price, group, details.
 * All prices come from /api/pricing fields via formatPrice helpers — no mock rates.
 */
export const ModelCard = memo(function ModelCard(props: ModelCardProps) {
  const { t } = useTranslation()
  const { copyToClipboard } = useCopyToClipboard()
  const tokenUnit = props.tokenUnit ?? DEFAULT_TOKEN_UNIT
  const priceRate = props.priceRate ?? 1
  const usdExchangeRate = props.usdExchangeRate ?? 1
  const showRechargePrice = props.showRechargePrice ?? false
  const isTokenBased = isTokenBasedModel(props.model)
  const tokenUnitLabel = tokenUnit === 'K' ? t('/K tokens') : t('/M tokens')
  const tags = parseTags(props.model.tags).slice(0, 4)
  const groups = props.model.enable_groups || []
  const primaryGroup = groups[0]
  const isNew = isRecentlyReleased(props.model)
  const isDynamicPricing =
    props.model.billing_mode === 'tiered_expr' &&
    Boolean(props.model.billing_expr)
  const dynamicSummary = isDynamicPricing
    ? getDynamicPricingSummary(props.model, {
        tokenUnit,
        showRechargePrice,
        priceRate,
        usdExchangeRate,
        groupRatioMultiplier: getDynamicDisplayGroupRatio(
          props.model,
          props.selectedGroup
        ),
      })
    : null

  const savingsPercent = getGroupSavingsPercent(
    props.model,
    props.selectedGroup
  )

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation()
    copyToClipboard(props.model.model_name || '')
  }

  let priceLine: ReactNode
  if (dynamicSummary) {
    if (dynamicSummary.isSpecialExpression) {
      priceLine = (
        <span className='text-amber-700 dark:text-amber-300'>
          {t('Special billing expression')}
        </span>
      )
    } else if (dynamicSummary.primaryEntries[0]) {
      const entry = dynamicSummary.primaryEntries[0]
      priceLine = (
        <>
          <span className='text-foreground font-mono text-base font-semibold tabular-nums'>
            {entry.formatted}
          </span>
          <span className='text-muted-foreground text-xs'>
            {t(entry.shortLabel)}
          </span>
        </>
      )
    } else {
      priceLine = (
        <span className='text-muted-foreground text-sm'>
          {t('Dynamic Pricing')}
        </span>
      )
    }
  } else if (isTokenBased) {
    priceLine = (
      <>
        <span className='text-foreground font-mono text-base font-semibold tabular-nums'>
          {formatPrice(
            props.model,
            'input',
            tokenUnit,
            showRechargePrice,
            priceRate,
            usdExchangeRate,
            props.selectedGroup
          )}
        </span>
        <span className='text-muted-foreground text-xs'>{tokenUnitLabel}</span>
      </>
    )
  } else {
    priceLine = (
      <>
        <span className='text-foreground font-mono text-base font-semibold tabular-nums'>
          {formatRequestPrice(
            props.model,
            showRechargePrice,
            priceRate,
            usdExchangeRate,
            props.selectedGroup
          )}
        </span>
        <span className='text-muted-foreground text-xs'>/ {t('request')}</span>
      </>
    )
  }

  return (
    <button
      type='button'
      onClick={props.onClick}
      className={cn(
        'group bg-card hover:bg-muted/30 focus-visible:ring-ring relative flex w-full flex-col rounded-xl border p-3.5 text-left transition-colors sm:p-4',
        'focus-visible:ring-2 focus-visible:outline-none'
      )}
    >
      <div className='flex items-start justify-between gap-2'>
        <div className='min-w-0 flex-1'>
          <div className='flex min-w-0 flex-wrap items-center gap-1.5'>
            {isNew && (
              <span className='bg-primary/10 text-primary inline-flex shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase'>
                {t('NEW')}
              </span>
            )}
            <h3 className='text-foreground truncate font-mono text-sm leading-tight font-semibold sm:text-[15px]'>
              {props.model.model_name}
            </h3>
          </div>

          {tags.length > 0 && (
            <div className='mt-1.5 flex flex-wrap gap-1'>
              {tags.map((tag) => (
                <span
                  key={tag}
                  className='bg-muted text-muted-foreground rounded-md px-1.5 py-0.5 text-[11px]'
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <span
          role='button'
          tabIndex={0}
          onClick={handleCopy}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleCopy(e as unknown as React.MouseEvent)
            }
          }}
          className='text-muted-foreground hover:text-foreground hover:bg-muted inline-flex size-7 shrink-0 items-center justify-center rounded-md border opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100'
          title={t('Copy')}
          aria-label={t('Copy model name')}
        >
          <Copy className='size-3.5' />
        </span>
      </div>

      <div className='mt-3 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5'>
        {priceLine}
        {primaryGroup && (
          <span className='text-muted-foreground text-xs'>
            · {primaryGroup}
          </span>
        )}
        {savingsPercent != null && (
          <span className='inline-flex items-center rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300'>
            {t('{{percent}}% off', { percent: savingsPercent })}
          </span>
        )}
      </div>

      {props.perf && Number.isFinite(props.perf.success_rate) && (
        <p className='text-muted-foreground mt-1.5 font-mono text-[11px] tabular-nums'>
          {t('Availability')} {props.perf.success_rate.toFixed(2)}%
        </p>
      )}

      <div className='text-muted-foreground group-hover:text-foreground mt-3 flex items-center gap-0.5 text-xs font-medium transition-colors'>
        {t('View details')}
        <ChevronRight className='size-3.5' />
      </div>
    </button>
  )
})
