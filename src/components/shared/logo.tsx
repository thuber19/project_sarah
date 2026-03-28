import Image from 'next/image'

type LogoSize = 'sm' | 'md' | 'lg' | 'xl'

const sizeConfig: Record<LogoSize, { icon: number; text: string }> = {
  sm: { icon: 20, text: 'text-lg' },
  md: { icon: 24, text: 'text-xl' },
  lg: { icon: 28, text: 'text-2xl' },
  xl: { icon: 36, text: 'text-3xl' },
}

interface LogoProps {
  size?: LogoSize
  showText?: boolean
  textClassName?: string
  className?: string
}

export function Logo({
  size = 'md',
  showText = true,
  textClassName = 'font-bold text-foreground',
  className,
}: LogoProps) {
  const { icon, text } = sizeConfig[size]

  return (
    <div className={`flex items-center gap-0.5 ${className ?? ''}`}>
      <Image
        src="/logo.png"
        alt="Sarah Logo"
        width={icon}
        height={icon}
        className="shrink-0"
        priority
      />
      {showText && <span className={`${text} ${textClassName}`}>arah</span>}
    </div>
  )
}
