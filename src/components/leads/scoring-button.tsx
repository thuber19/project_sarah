'use client'

import { useState } from 'react'
import { Crown, Sparkles, Zap } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

interface Props {
  userIndustry?: string | null
}

export function ScoringButton({ userIndustry }: Props) {
  const [showPremiumModal, setShowPremiumModal] = useState(false)

  const industryText = userIndustry
    ? `Perfekt für ${userIndustry}-Unternehmen im DACH-Markt`
    : 'Perfekt für Unternehmen im DACH-Markt'

  return (
    <>
      <button
        type="button"
        onClick={() => setShowPremiumModal(true)}
        className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
      >
        <Zap className="h-4 w-4" />
        Scoring starten
      </button>

      <Dialog open={showPremiumModal} onOpenChange={setShowPremiumModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <Crown className="h-6 w-6 text-amber-600" />
            </div>
            <DialogTitle className="text-center">
              Scoring ist ein Pro-Feature
            </DialogTitle>
            <DialogDescription className="text-center">
              Mit AI-gestütztem Lead Scoring erkennst du sofort, welche Leads das
              größte Potenzial haben.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-2">
            <div className="rounded-lg bg-accent-light px-4 py-3 text-center text-sm font-medium text-accent">
              {industryText}
            </div>

            <ul className="flex flex-col gap-2 text-sm text-foreground">
              {[
                'AI-basierte Lead-Bewertung mit 4 Scoring-Dimensionen',
                'Automatische Priorisierung nach Kaufbereitschaft',
                'Individuelle Scoring-Regeln für dein ICP',
                'Echtzeit-Updates bei neuen Signalen',
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => setShowPremiumModal(false)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Crown className="h-4 w-4" />
              Auf Pro upgraden
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
