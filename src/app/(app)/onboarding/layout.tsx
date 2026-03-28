'use client'

import { usePathname } from 'next/navigation'
import { Logo } from '@/components/shared/logo'
import { OnboardingProvider } from '@/contexts/onboarding-context'

const TOTAL_STEPS = 4

function parseStep(pathname: string): number | null {
  const match = pathname.match(/\/onboarding\/step-(\d+)/)
  if (match) {
    const step = parseInt(match[1], 10)
    return step >= 1 && step <= TOTAL_STEPS ? step : 1
  }
  return null
}

export default function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const currentStep = parseStep(pathname)
  const isStepPage = currentStep !== null

  if (!isStepPage) {
    return <>{children}</>
  }

  return (
    <OnboardingProvider>
      <div className="flex min-h-screen flex-col items-center justify-between bg-muted px-4 pb-8 pt-10 lg:px-0">
        {/* Header */}
        <div className="flex flex-col items-center">
          <Logo size="sm" textClassName="font-bold text-foreground" />

          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Schritt {currentStep} von {TOTAL_STEPS}
            </span>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => {
                const step = i + 1
                const isActiveOrCompleted = step <= currentStep

                return (
                  <div
                    key={step}
                    className={`h-2 w-2 rounded-full ${
                      isActiveOrCompleted ? 'bg-accent' : 'bg-border'
                    }`}
                  />
                )
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          key={currentStep}
          className="flex w-full max-w-2xl flex-1 items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          {children}
        </div>

        {/* Footer */}
        <p className="text-[13px] text-muted-foreground">
          DSGVO-konform &middot; Deine Daten sind sicher
        </p>
      </div>
    </OnboardingProvider>
  )
}
