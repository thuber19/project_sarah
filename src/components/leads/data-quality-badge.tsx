'use client'

import { cn } from '@/lib/utils'

interface DataQualityBadgeProps {
  score: number
  className?: string
}

function getQualityLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Vollständig', color: 'bg-status-success-bg text-status-success-text' }
  if (score >= 60) return { label: 'Gut', color: 'bg-status-info-bg text-status-info-text' }
  if (score >= 40) return { label: 'Ausbaufähig', color: 'bg-status-warning-bg text-status-warning-text' }
  return { label: 'Lückenhaft', color: 'bg-status-error-bg text-status-error-text' }
}

export function DataQualityBadge({ score, className }: DataQualityBadgeProps) {
  const { label, color } = getQualityLabel(score)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        color,
        className,
      )}
    >
      <svg
        className="h-3 w-3"
        viewBox="0 0 12 12"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path
          d={describeArc(6, 6, 4, 0, (score / 100) * 360)}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      {label} ({score}%)
    </span>
  )
}

function describeArc(
  x: number,
  y: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  const clampedEnd = Math.min(endAngle, 359.99)
  const start = polarToCartesian(x, y, radius, clampedEnd)
  const end = polarToCartesian(x, y, radius, startAngle)
  const largeArcFlag = clampedEnd - startAngle <= 180 ? '0' : '1'
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`
}

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  }
}
