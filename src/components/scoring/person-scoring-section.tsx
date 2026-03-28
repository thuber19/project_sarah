'use client'

import { useState, useTransition } from 'react'
import { Users, Loader2 } from 'lucide-react'
import { ContactPreferencesDialog } from './contact-preferences-dialog'
import { runPersonScoringAction, getContactPreferencesAction } from '@/app/actions/person-scoring.actions'
import { toast } from 'sonner'
import type { ContactPreferences } from '@/types/lead'

interface PersonScoringSectionProps {
  qualifiedCount: number
}

export function PersonScoringSection({ qualifiedCount }: PersonScoringSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [savedPrefs, setSavedPrefs] = useState<ContactPreferences | null>(null)
  const [prefsLoaded, setPrefsLoaded] = useState(false)

  function handleOpen() {
    if (!prefsLoaded) {
      // Load saved preferences before opening
      startTransition(async () => {
        const result = await getContactPreferencesAction()
        if (result.success && result.data) {
          setSavedPrefs(result.data)
        }
        setPrefsLoaded(true)
        setDialogOpen(true)
      })
    } else {
      setDialogOpen(true)
    }
  }

  function handleConfirm(prefs: ContactPreferences) {
    startTransition(async () => {
      const result = await runPersonScoringAction(prefs)
      if (result.success) {
        toast.success(`${result.data.scored} Ansprechpartner bewertet`)
        setDialogOpen(false)
        setSavedPrefs(prefs)
      } else {
        toast.error(result.error)
      }
    })
  }

  if (qualifiedCount === 0) return null

  return (
    <>
      <div className="flex flex-col gap-3 rounded-xl border border-accent/30 bg-accent-light p-4 lg:flex-row lg:items-center lg:justify-between lg:p-6">
        <div className="flex items-start gap-3">
          <Users className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Ansprechpartner bewerten
            </h2>
            <p className="text-sm text-muted-foreground">
              {qualifiedCount} qualifizierte{qualifiedCount === 1 ? ' Company' : ' Companies'} —
              finde die besten Ansprechpartner (Entscheider, Budget-Holder, Champions).
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleOpen}
          disabled={isPending}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
        >
          {isPending && !dialogOpen ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Users className="h-4 w-4" />
          )}
          Person-Scoring starten
        </button>
      </div>

      <ContactPreferencesDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialPreferences={savedPrefs}
        onConfirm={handleConfirm}
        isPending={isPending}
      />
    </>
  )
}
