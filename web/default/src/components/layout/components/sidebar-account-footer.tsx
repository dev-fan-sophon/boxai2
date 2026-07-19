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
import { Link } from '@tanstack/react-router'
import { Wallet } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { getSelf } from '@/lib/api'
import { formatQuota } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

/**
 * Apilio-style console footer: user id/email, balance, and Top up CTA.
 * Refreshes from real GET /api/user/self — no mocked balance.
 */
export function SidebarAccountFooter() {
  const { t } = useTranslation()
  const { state } = useSidebar()
  const user = useAuthStore((s) => s.auth.user)
  const setUser = useAuthStore((s) => s.auth.setUser)
  const collapsed = state === 'collapsed'

  useEffect(() => {
    let cancelled = false
    void getSelf()
      .then((res) => {
        if (cancelled || !res.success || !res.data) return
        setUser(res.data as typeof user)
      })
      .catch(() => {
        /* keep existing session user */
      })
    return () => {
      cancelled = true
    }
  }, [setUser])

  if (!user) return null

  const display =
    user.display_name?.trim() ||
    user.email?.trim() ||
    user.username ||
    t('Account')
  const balance = formatQuota(user.quota ?? 0)

  return (
    <SidebarFooter className='border-t'>
      <SidebarMenu>
        <SidebarMenuItem>
          <div
            className={cn(
              'flex w-full flex-col gap-2 rounded-lg px-2 py-2',
              collapsed && 'items-center px-0'
            )}
          >
            {!collapsed && (
              <div className='min-w-0 px-0.5'>
                <p className='text-muted-foreground truncate text-[11px]'>
                  ID {user.id}
                </p>
                <p className='truncate text-xs font-medium' title={display}>
                  {display}
                </p>
              </div>
            )}

            <div
              className={cn(
                'bg-muted/40 flex items-center gap-2 rounded-md border px-2 py-1.5',
                collapsed && 'justify-center border-0 bg-transparent p-0'
              )}
            >
              <Wallet className='text-muted-foreground size-3.5 shrink-0' />
              {!collapsed && (
                <div className='min-w-0 flex-1'>
                  <p className='text-muted-foreground text-[10px] tracking-wide uppercase'>
                    {t('Account balance')}
                  </p>
                  <p className='truncate text-sm font-semibold tabular-nums'>
                    {balance}
                  </p>
                </div>
              )}
              {collapsed && (
                <span className='sr-only'>
                  {t('Account balance')}: {balance}
                </span>
              )}
            </div>

            {!collapsed && (
              <Button
                size='sm'
                className='h-8 w-full'
                render={<Link to='/wallet' />}
              >
                {t('Top up')}
              </Button>
            )}
            {collapsed && (
              <SidebarMenuButton
                tooltip={t('Top up')}
                render={<Link to='/wallet' />}
              >
                <Wallet />
                <span>{t('Top up')}</span>
              </SidebarMenuButton>
            )}
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  )
}
