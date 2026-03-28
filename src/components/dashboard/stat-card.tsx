import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
}

const changeStyles: Record<string, { bg: string; text: string }> = {
  positive: { bg: 'bg-stat-positive-bg', text: 'text-stat-positive-text' },
  negative: { bg: 'bg-stat-negative-bg', text: 'text-stat-negative-text' },
  neutral: { bg: 'bg-stat-neutral-bg', text: 'text-stat-neutral-text' },
}

export function StatCard({ label, value, change, changeType = 'neutral' }: StatCardProps) {
  const colors = changeStyles[changeType]

  return (
    <div className="flex min-w-0 flex-col gap-3 overflow-hidden rounded-[--radius-card] border border-border bg-card p-5">
      <span className="truncate text-[13px] font-medium text-muted-foreground">{label}</span>
      <div className="flex min-w-0 items-end justify-between gap-2">
        <span className="truncate text-[28px] font-bold text-foreground">{value}</span>
        {change && (
          <span
            className={cn('rounded-xl px-2 py-0.5 text-xs font-medium', colors.bg, colors.text)}
          >
            {change}
          </span>
        )}
      </div>
    </div>
  )
}
