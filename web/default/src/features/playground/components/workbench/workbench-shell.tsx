/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.
*/
import { Library } from 'lucide-react'
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
  catalog: React.ReactNode
  agents: React.ReactNode
  inspiration: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function WorkbenchShell(props: WorkbenchShellProps) {
  const { t } = useTranslation()
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [railOpen, setRailOpen] = useState(false)

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
      {isDesktop ? (
        <aside className='flex w-[272px] shrink-0 flex-col border-r border-white/[0.08] bg-[#0C0C0F]'>
          {railBody}
        </aside>
      ) : null}

      <div className='flex min-w-0 flex-1 flex-col'>
        <main className='relative flex min-h-0 flex-1 flex-col overflow-hidden'>
          {props.children}
        </main>
      </div>

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
