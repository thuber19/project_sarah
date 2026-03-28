import { Bot } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  textClassName?: string
}

const sizes = {
  sm: { icon: 'size-5', text: 'text-base' },
  md: { icon: 'size-6', text: 'text-lg' },
  lg: { icon: 'size-8', text: 'text-2xl' },
}

export function Logo({ size = 'md', className, textClassName }: LogoProps) {
  const s = sizes[size]
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Bot className={cn(s.icon, 'text-accent')} aria-hidden="true" />
      <span className={cn(s.text, 'font-semibold tracking-tight', textClassName)}>Sarah</span>
    </div>
  )
}
