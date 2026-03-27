'use client'

import { useState, useTransition } from 'react'
import {
  analyzeWebsiteAction,
  saveOnboardingAction,
  type ProfileData,
  type IcpData,
} from '@/app/actions/onboarding.actions'

type Step = 'url' | 'profile' | 'icp'

function TagInput({
  label,
  values,
  onChange,
}: {
  label: string
  values: string[]
  onChange: (values: string[]) => void
}) {
  const [input, setInput] = useState('')

  function add() {
    const trimmed = input.trim()
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed])
    }
    setInput('')
  }

  function remove(tag: string) {
    onChange(values.filter((v) => v !== tag))
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-zinc-700">{label}</label>
      <div className="flex flex-wrap gap-1.5 min-h-[40px] rounded-lg border border-zinc-300 bg-white px-2 py-1.5">
        {values.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              className="text-zinc-400 hover:text-zinc-700"
              aria-label={`${tag} entfernen`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              add()
            }
          }}
          placeholder="Eingabe + Enter"
          className="min-w-[120px] flex-1 bg-transparent text-sm text-zinc-900 placeholder-zinc-400 outline-none"
        />
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  multiline?: boolean
}) {
  const cls =
    'w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900'
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-zinc-700">{label}</label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={cls}
        />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
      )}
    </div>
  )
}

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('url')
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [profile, setProfile] = useState<ProfileData>({
    website_url: '',
    company_name: '',
    description: '',
    industry: '',
    product_summary: '',
    value_proposition: '',
    target_market: '',
    raw_scraped_content: '',
  })
  const [icp, setIcp] = useState<IcpData>({
    job_titles: [],
    seniority_levels: [],
    industries: [],
    company_sizes: [],
    regions: [],
  })

  function handleAnalyze(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const result = await analyzeWebsiteAction(url)
      if ('error' in result) {
        setError(result.error)
        return
      }
      setProfile(result.profile)
      setIcp(result.icp)
      setStep('profile')
    })
  }

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const result = await saveOnboardingAction(profile, icp)
      if (result && 'error' in result) {
        setError(result.error)
      }
    })
  }

  const stepLabels: Record<Step, string> = {
    url: '1. Website',
    profile: '2. Business-Profil',
    icp: '3. Zielkunden',
  }
  const steps: Step[] = ['url', 'profile', 'icp']

  return (
    <div className="min-h-full bg-zinc-50 px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Willkommen bei Project Sarah</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Richte deinen AI Sales Agent in 3 Schritten ein.
          </p>
        </div>

        {/* Steps */}
        <div className="flex gap-2">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                s === step
                  ? 'bg-zinc-900 text-white'
                  : steps.indexOf(step) > i
                    ? 'bg-zinc-200 text-zinc-600'
                    : 'bg-zinc-100 text-zinc-400'
              }`}
            >
              {stepLabels[s]}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Step 1: URL */}
        {step === 'url' && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 font-medium text-zinc-900">Deine Website</h2>
            <p className="mb-4 text-sm text-zinc-500">
              Gib deine Website-URL ein — AI analysiert dein Business automatisch.
            </p>
            <form onSubmit={handleAnalyze} className="space-y-4">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://deinefirma.at"
                required
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
              />
              <button
                type="submit"
                disabled={isPending || !url}
                className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? 'Analysiere Website…' : 'Website analysieren'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Profile */}
        {step === 'profile' && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
            <div>
              <h2 className="font-medium text-zinc-900">Business-Profil überprüfen</h2>
              <p className="text-sm text-zinc-500">AI hat dein Profil vorausgefüllt — bitte prüfen und anpassen.</p>
            </div>
            <Field
              label="Firmenname"
              value={profile.company_name}
              onChange={(v) => setProfile((p) => ({ ...p, company_name: v }))}
            />
            <Field
              label="Beschreibung"
              value={profile.description}
              onChange={(v) => setProfile((p) => ({ ...p, description: v }))}
              multiline
            />
            <Field
              label="Branche"
              value={profile.industry}
              onChange={(v) => setProfile((p) => ({ ...p, industry: v }))}
            />
            <Field
              label="Produkt / Dienstleistung"
              value={profile.product_summary}
              onChange={(v) => setProfile((p) => ({ ...p, product_summary: v }))}
              multiline
            />
            <Field
              label="Hauptnutzen für Kunden"
              value={profile.value_proposition}
              onChange={(v) => setProfile((p) => ({ ...p, value_proposition: v }))}
            />
            <Field
              label="Zielmarkt"
              value={profile.target_market}
              onChange={(v) => setProfile((p) => ({ ...p, target_market: v }))}
            />
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setStep('icp')}
                disabled={!profile.company_name}
                className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
              >
                Weiter zu Zielkunden →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: ICP */}
        {step === 'icp' && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
            <div>
              <h2 className="font-medium text-zinc-900">Ideal Customer Profile (ICP)</h2>
              <p className="text-sm text-zinc-500">
                AI hat Vorschläge gemacht — anpassen und bestätigen. Eingabe mit Enter bestätigen.
              </p>
            </div>
            <TagInput
              label="Job-Titel (Zielkunden)"
              values={icp.job_titles}
              onChange={(v) => setIcp((i) => ({ ...i, job_titles: v }))}
            />
            <TagInput
              label="Seniority-Level"
              values={icp.seniority_levels}
              onChange={(v) => setIcp((i) => ({ ...i, seniority_levels: v }))}
            />
            <TagInput
              label="Zielbranchen"
              values={icp.industries}
              onChange={(v) => setIcp((i) => ({ ...i, industries: v }))}
            />
            <TagInput
              label="Unternehmensgrößen"
              values={icp.company_sizes}
              onChange={(v) => setIcp((i) => ({ ...i, company_sizes: v }))}
            />
            <TagInput
              label="Regionen"
              values={icp.regions}
              onChange={(v) => setIcp((i) => ({ ...i, regions: v }))}
            />
            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep('profile')}
                className="rounded-lg border border-zinc-300 px-5 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                ← Zurück
              </button>
              <button
                onClick={handleSave}
                disabled={isPending}
                className="rounded-lg bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
              >
                {isPending ? 'Wird gespeichert…' : 'Agent starten →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
