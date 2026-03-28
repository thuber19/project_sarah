import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
}

const changeStyles: Record<string, { bg: string; text: string }> = {
  positive: { bg: 'bg-stat-positive-bg', text: 'text-green-700' },
  negative: { bg: 'bg-stat-negative-bg', text: 'text-red-700' },
  neutral: { bg: 'bg-stat-neutral-bg', text: 'text-blue-700' },
}

export function StatCard({ label, value, change, changeType = 'neutral' }: StatCardProps) {
  const colors = changeStyles[changeType]

  return (
    <div className="flex flex-col gap-3 rounded-[--radius-card] border border-border bg-card p-5">
      <span className="text-[13px] font-medium text-muted-foreground">{label}</span>
      <div className="flex items-end justify-between">
        <span className="text-[28px] font-bold text-foreground">{value}</span>
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
