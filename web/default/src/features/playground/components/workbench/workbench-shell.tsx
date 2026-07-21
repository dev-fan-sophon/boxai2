/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import {
  ChevronLeft,
  History,
  Library,
  Menu,
  Sparkles,
  WalletCards,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useMediaQuery } from '@/hooks/use-media-query'
import { cn } from '@/lib/utils'

import type { WorkbenchTab } from '../../lib/workbench/workbench-prefs'
import { WorkbenchRail } from './workbench-rail'

type WorkbenchShellProps = {
  tab: WorkbenchTab
  onTabChange: (tab: WorkbenchTab) => void
  balance?: string
  onWalletClick: () => void
  catalog: React.ReactNode
  agents: React.ReactNode
  inspiration: React.ReactNode
  history: React.ReactNode
  /** Compact top action for task list / history */
  historyTriggerLabel: string
  showHistoryTrigger?: boolean
  children: React.ReactNode
  className?: string
}

export function WorkbenchShell(props: WorkbenchShellProps) {
  const { t } = useTranslation()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [railOpen, setRailOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  useEffect(() => {
    if (isDesktop) setRailOpen(false)
  }, [isDesktop])

  const railBody = (
    <WorkbenchRail
      tab={props.tab}
      onTabChange={(tab) => {
        props.onTabChange(tab)
        if (!isDesktop) setRailOpen(false)
      }}
      balance={props.balance}
      onWalletClick={props.onWalletClick}
      catalog={props.catalog}
      agents={props.agents}
      inspiration={props.inspiration}
    />
  )

  return (
    <div
      className={cn(
        'playground-workbench relative flex size-full min-h-0 overflow-hidden',
        'bg-[#0F0F12] text-zinc-100',
        props.className
      )}
      data-playground-workbench=''
    >
      {/* Desktop fixed left rail */}
      {isDesktop ? (
        <aside className='flex w-[272px] shrink-0 flex-col border-r border-white/[0.08] bg-[#0C0C0F]'>
          {railBody}
        </aside>
      ) : null}

      <div className='flex min-w-0 flex-1 flex-col'>
        {/* Compact top strip — no redundant studio chrome */}
        <header className='flex h-12 shrink-0 items-center justify-between gap-2 border-b border-white/[0.06] px-2 sm:px-3'>
          <div className='flex min-w-0 items-center gap-1.5'>
            {!isDesktop && (
              <Button
                variant='ghost'
                size='icon'
                className='text-zinc-300 hover:bg-white/5 hover:text-white'
                onClick={() => setRailOpen(true)}
                aria-label={t('Open catalog')}
              >
                <Menu className='size-4' />
              </Button>
            )}
            <div className='flex min-w-0 items-center gap-2'>
              <span className='flex size-7 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300'>
                <Sparkles className='size-3.5' aria-hidden='true' />
              </span>
              <div className='min-w-0'>
                <p className='truncate text-sm font-semibold tracking-tight'>
                  Box AI
                </p>
                <p className='truncate text-[11px] text-zinc-500'>
                  {t('AI creation workbench')}
                </p>
              </div>
            </div>
          </div>

          <div className='flex shrink-0 items-center gap-1.5'>
            {props.showHistoryTrigger !== false && (
              <Button
                size='sm'
                className={cn(
                  'h-8 gap-1.5 rounded-full px-3 text-xs font-semibold shadow-sm',
                  'bg-amber-400 text-zinc-950 hover:bg-amber-300'
                )}
                onClick={() => setHistoryOpen(true)}
                aria-label={props.historyTriggerLabel}
              >
                <History className='size-3.5' aria-hidden='true' />
                <span className='hidden sm:inline'>
                  {props.historyTriggerLabel}
                </span>
              </Button>
            )}
            {props.balance && (
              <div className='hidden text-right sm:block'>
                <p className='text-[10px] text-zinc-500'>
                  {t('Available balance')}
                </p>
                <p className='text-xs font-medium tabular-nums text-zinc-200'>
                  {props.balance}
                </p>
              </div>
            )}
            <Button
              variant='outline'
              size='sm'
              className='h-8 border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10 hover:text-white'
              aria-label={t('Wallet')}
              onClick={props.onWalletClick}
            >
              <WalletCards className='size-3.5' />
              <span className='hidden sm:inline'>{t('Wallet')}</span>
            </Button>
          </div>
        </header>

        <main className='relative flex min-h-0 flex-1 flex-col overflow-hidden'>
          {props.children}
        </main>
      </div>

      {/* Mobile catalog sheet */}
      <Sheet open={railOpen} onOpenChange={setRailOpen}>
        <SheetContent
          side='left'
          className='w-[88%] border-white/10 bg-[#0C0C0F] p-0 text-zinc-100 sm:max-w-sm'
        >
          <SheetHeader className='sr-only'>
            <SheetTitle>{t('Model catalog')}</SheetTitle>
            <SheetDescription>
              {t('Choose a model for your next run.')}
            </SheetDescription>
          </SheetHeader>
          <div className='flex h-full flex-col'>{railOpen && railBody}</div>
        </SheetContent>
      </Sheet>

      {/* History / task list sheet */}
      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent className='w-[88%] border-white/10 bg-[#0C0C0F] p-0 text-zinc-100 sm:max-w-md'>
          <SheetHeader className='border-b border-white/[0.06] px-4 py-3 text-left'>
            <div className='flex items-center justify-between gap-2'>
              <SheetTitle className='text-zinc-100'>
                {props.historyTriggerLabel}
              </SheetTitle>
              <Button
                variant='ghost'
                size='icon'
                className='text-zinc-400 hover:bg-white/5 hover:text-white'
                onClick={() => setHistoryOpen(false)}
                aria-label={t('Close')}
              >
                <ChevronLeft className='size-4' />
              </Button>
            </div>
            <SheetDescription className='text-zinc-500'>
              {t('Review recent activity for this workbench session.')}
            </SheetDescription>
          </SheetHeader>
          <div className='h-[calc(100%-4.5rem)] min-h-0'>
            {historyOpen && props.history}
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile floating catalog affordance when sheet closed */}
      {!isDesktop && !railOpen && (
        <Button
          className='absolute bottom-24 left-3 z-20 size-11 rounded-full border border-white/10 bg-[#121218]/90 text-cyan-300 shadow-lg backdrop-blur hover:bg-[#1a1a22]'
          size='icon'
          onClick={() => setRailOpen(true)}
          aria-label={t('Open catalog')}
        >
          <Library className='size-4' />
        </Button>
      )}
    </div>
  )
}
