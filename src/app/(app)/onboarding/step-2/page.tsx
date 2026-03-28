'use client'

import { CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { useOnboarding } from '@/contexts/onboarding-context'

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-accent-light px-2 py-0.5 text-xs font-medium text-accent">
      {children}
    </span>
  )
}

function FieldRow({
  label,
  isEditing,
  value,
  onChange,
}: {
  label: string
  isEditing?: boolean
  value: string
  onChange?: (value: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5 md:flex-row md:items-start md:gap-4">
      <span className="text-sm font-medium text-foreground md:w-[140px] md:shrink-0">{label}</span>
      {isEditing ? (
        <Input
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="max-w-md"
        />
      ) : (
        <div className="text-sm text-foreground">{value}</div>
      )}
    </div>
  )
}

export default function OnboardingStep2() {
  const router = useRouter()
  const { profile, setProfile } = useOnboarding()

  if (!profile) {
    return (
      <div className="text-center text-muted-foreground">
        Bitte starten Sie mit Schritt 1
      </div>
    )
  }

  const handleUpdate = (field: keyof typeof profile, value: string) => {
    setProfile({
      ...profile,
      [field]: value,
    })
  }

  const handleNext = () => {
    router.push('/onboarding/step-3')
  }

  const handleBack = () => {
    router.push('/onboarding/step-1')
  }

  return (
    <div className="flex w-full max-w-[700px] flex-col gap-6 rounded-xl border border-border bg-white p-4 md:p-8">
      <div className="flex items-center gap-2.5">
        <CheckCircle className="text-success" size={24} />
        <h1 className="text-xl font-bold text-foreground">Dein Business-Profil</h1>
      </div>

      <p className="text-sm text-muted-foreground">
        Sarah hat deine Website analysiert. Überprüfe und bearbeite die Ergebnisse.
      </p>

      <div className="flex flex-col gap-4">
        <FieldRow
          label="Unternehmensname"
          isEditing
          value={profile.company_name}
          onChange={(value) => handleUpdate('company_name', value)}
        />

        <FieldRow
          label="Branche"
          isEditing
          value={profile.industry}
          onChange={(value) => handleUpdate('industry', value)}
        />

        <FieldRow
          label="Zielmarkt"
          isEditing
          value={profile.target_market}
          onChange={(value) => handleUpdate('target_market', value)}
        />

        <FieldRow
          label="Produkte/Services"
          isEditing
          value={profile.product_summary}
          onChange={(value) => handleUpdate('product_summary', value)}
        />

        <FieldRow
          label="Value Proposition"
          isEditing
          value={profile.value_proposition}
          onChange={(value) => handleUpdate('value_proposition', value)}
        />

        <FieldRow
          label="Beschreibung"
          isEditing
          value={profile.description}
          onChange={(value) => handleUpdate('description', value)}
        />
      </div>

      <div className="h-px w-full bg-secondary" />

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-foreground"
        >
          Zurück
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
        >
          Bestätigen &amp; Weiter
        </button>
      </div>
    </div>
  )
}
