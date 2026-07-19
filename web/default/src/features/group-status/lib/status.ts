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
import type { GroupModelStatus, GroupStatusGroup } from '../types'

export type StatusTone = 'healthy' | 'slow' | 'down' | 'observing'

export function normalizeStatus(status: GroupModelStatus): StatusTone {
  if (status === 'healthy' || status === 'slow' || status === 'down') {
    return status
  }
  return 'observing'
}

export function statusLabelKey(status: StatusTone): string {
  switch (status) {
    case 'healthy':
      return 'Healthy'
    case 'slow':
      return 'Slow'
    case 'down':
      return 'Down'
    default:
      return 'Observing'
  }
}

/** Heat cell: healthy / slow / down / empty */
export function seriesCellTone(
  successRate: number | null | undefined,
  requestCount: number
): StatusTone | 'empty' {
  if (!requestCount || successRate == null || !Number.isFinite(successRate)) {
    return 'empty'
  }
  if (successRate >= 90) return 'healthy'
  if (successRate >= 50) return 'slow'
  return 'down'
}

export function summarizeGroups(groups: GroupStatusGroup[]) {
  let healthy = 0
  let slow = 0
  let down = 0
  let observing = 0
  let totalModels = 0
  for (const g of groups) {
    for (const m of g.models) {
      totalModels++
      const tone = normalizeStatus(m.status)
      if (tone === 'healthy') healthy++
      else if (tone === 'slow') slow++
      else if (tone === 'down') down++
      else observing++
    }
  }
  return {
    groupCount: groups.length,
    healthy,
    slow,
    down,
    observing,
    totalModels,
  }
}

export function formatBucketRange(
  ts: number,
  bucketSeconds: number,
  locale?: string
): string {
  const start = new Date(ts * 1000)
  const end = new Date((ts + bucketSeconds) * 1000)
  const fmt = new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return `${fmt.format(start)} – ${fmt.format(end)}`
}
