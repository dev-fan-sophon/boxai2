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
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'
import { cn } from '@/lib/utils'

const TREND = [28, 36, 32, 48, 44, 58, 52, 70, 66, 78, 72, 88, 84, 96]

const TOP_MODELS = [
  { name: 'GPT-4o', share: 34.2 },
  { name: 'Claude 3.5', share: 21.6 },
  { name: 'Gemini 1.5 Pro', share: 16.8 },
  { name: 'Qwen 2.5', share: 14.2 },
]

export function UsageOverview() {
  const { t } = useTranslation()

  const metrics = [
    {
      label: t('Call Volume'),
      value: '12.45M',
      delta: '+18.6%',
      positive: true,
    },
    {
      label: t('Success rate'),
      value: '99.32%',
      delta: '+0.8%',
      positive: true,
    },
    {
      label: t('Avg latency'),
      value: '632ms',
      delta: '-12.4%',
      positive: true,
    },
    {
      label: t('Cost Savings'),
      value: '$24,680',
      delta: '+31.2%',
      positive: true,
    },
  ]

  return (
    <section
      aria-label={t('Usage Overview')}
      className='border-border/40 relative z-10 border-t px-6 py-24 md:py-32'
    >
      <div className='mx-auto max-w-6xl'>
        <AnimateInView className='mb-12 max-w-2xl'>
          <p className='text-muted-foreground mb-3 text-xs font-medium tracking-widest uppercase'>
            {t('Platform Capabilities')}
          </p>
          <h2 className='text-2xl font-bold tracking-tight md:text-3xl'>
            {t('All-in-one AI Aggregation Console')}
          </h2>
          <p className='text-muted-foreground mt-3 text-sm leading-relaxed md:text-base'>
            {t(
              'Unified API access, real-time usage monitoring, flexible model switching — one panel for all AI capabilities.'
            )}
          </p>
        </AnimateInView>

        <AnimateInView
          delay={80}
          className='border-border/50 bg-background/70 overflow-hidden rounded-2xl border shadow-[0_20px_50px_-30px_rgba(15,23,42,0.25)] backdrop-blur-sm'
        >
          <div className='border-border/40 flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 md:px-6'>
            <div>
              <h3 className='text-base font-semibold'>{t('Usage Overview')}</h3>
              <p className='text-muted-foreground text-xs'>
                {t('Last 30 days · All regions')}
              </p>
            </div>
            <div className='bg-muted/60 flex rounded-lg p-1 text-xs font-medium'>
              {[t('7 days'), t('30 days'), t('90 days')].map((label, i) => (
                <span
                  key={label}
                  className={cn(
                    'rounded-md px-3 py-1.5',
                    i === 1
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground'
                  )}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className='grid gap-4 p-5 md:grid-cols-4 md:p-6'>
            {metrics.map((m) => (
              <div
                key={m.label}
                className='border-border/40 bg-muted/20 rounded-xl border p-4'
              >
                <div className='text-muted-foreground flex items-center justify-between text-xs'>
                  <span>{m.label}</span>
                  <span
                    className={cn(
                      'font-medium',
                      m.positive
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    )}
                  >
                    {m.delta}
                  </span>
                </div>
                <div className='mt-2 text-2xl font-bold tracking-tight'>
                  {m.value}
                </div>
              </div>
            ))}
          </div>

          <div className='grid gap-4 px-5 pb-5 md:grid-cols-5 md:px-6 md:pb-6'>
            <div className='border-border/40 bg-muted/10 rounded-xl border p-4 md:col-span-3'>
              <div className='mb-4 flex items-center justify-between'>
                <h4 className='text-sm font-semibold'>
                  {t('Call Volume Trend')}
                </h4>
                <span className='text-muted-foreground text-xs'>
                  {t('Daily avg 415K · Peak 1.2M')}
                </span>
              </div>
              <div className='flex h-36 items-end gap-1.5'>
                {TREND.map((h, i) => (
                  <div
                    key={i}
                    className='from-blue-500/80 to-violet-500/60 w-full rounded-t-sm bg-gradient-to-t'
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>

            <div className='border-border/40 bg-muted/10 rounded-xl border p-4 md:col-span-2'>
              <div className='mb-4 flex items-center justify-between'>
                <h4 className='text-sm font-semibold'>{t('Top Models')}</h4>
                <span className='text-muted-foreground text-xs'>
                  {t('By call volume')}
                </span>
              </div>
              <div className='space-y-3'>
                {TOP_MODELS.map((model) => (
                  <div key={model.name}>
                    <div className='mb-1 flex items-center justify-between text-xs'>
                      <span className='font-medium'>{model.name}</span>
                      <span className='text-muted-foreground tabular-nums'>
                        {model.share}%
                      </span>
                    </div>
                    <div className='bg-muted h-1.5 overflow-hidden rounded-full'>
                      <div
                        className='h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500'
                        style={{ width: `${model.share}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AnimateInView>
      </div>
    </section>
  )
}
