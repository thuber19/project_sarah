'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Mail, Mic, Settings } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AppTopbar } from '@/components/layout/app-topbar'
import {
  updateProfileAction,
  updateIcpAction,
  saveCommunicationStyleAction,
} from '@/app/actions/settings.actions'
import { profileSchema, type SettingsIcpData, type CommunicationStyleData } from '@/lib/validation/schemas'
import { useServerAction } from '@/hooks/use-server-action'
import type { ApiResponse } from '@/lib/api-response'
import type { BusinessProfile, IcpProfile } from '@/types/database'

function PlaceholderContent() {
  return <p className="py-8 text-center text-sm text-muted-foreground">Demnächst verfügbar</p>
}

function toCommaStr(arr: string[] | null | undefined) {
  return arr?.join(', ') ?? ''
}

function fromCommaStr(str: string): string[] {
  return str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

interface SettingsClientProps {
  profile: BusinessProfile | null
  icp: IcpProfile | null
  email: string
}

export function SettingsClient({ profile, icp, email }: SettingsClientProps) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Profile fields
  const [companyName, setCompanyName] = useState(profile?.company_name ?? '')
  const [industry, setIndustry] = useState(profile?.industry ?? '')
  const [description, setDescription] = useState(profile?.description ?? '')
  const [targetMarket, setTargetMarket] = useState(profile?.target_market ?? '')
  const [websiteUrl, setWebsiteUrl] = useState(profile?.website_url ?? '')

  // ICP fields (comma-separated strings for easy editing)
  const [icpIndustries, setIcpIndustries] = useState(toCommaStr(icp?.industries))
  const [icpSizes, setIcpSizes] = useState(toCommaStr(icp?.company_sizes))
  const [icpRegions, setIcpRegions] = useState(toCommaStr(icp?.regions))
  const [icpJobTitles, setIcpJobTitles] = useState(toCommaStr(icp?.job_titles))
  const [icpSeniority, setIcpSeniority] = useState(toCommaStr(icp?.seniority_levels))
  const [icpAdditionalInfo, setIcpAdditionalInfo] = useState(icp?.additional_info ?? '')

  // Communication style fields (loaded from profile.communication_style JSON)
  const commStyle = (profile?.communication_style ?? {}) as CommunicationStyleData
  const [emailExample, setEmailExample] = useState(commStyle.email_example ?? '')
  const [emailSignature, setEmailSignature] = useState(commStyle.email_signature ?? '')
  const [writingStyle, setWritingStyle] = useState(commStyle.writing_style ?? '')
  const [salutationPref, setSalutationPref] = useState(commStyle.salutation_preference ?? 'sie')
  const [voiceExample, setVoiceExample] = useState(commStyle.voice_example ?? '')
  const [speakingStyle, setSpeakingStyle] = useState(commStyle.speaking_style ?? '')
  const [openingPhrase, setOpeningPhrase] = useState(commStyle.opening_phrase ?? '')
  const [callToAction, setCallToAction] = useState(commStyle.call_to_action ?? '')
  const [commAdditionalNotes, setCommAdditionalNotes] = useState(commStyle.additional_notes ?? '')

  // Combined save action: profile + optional ICP update
  const saveSettingsAction = useCallback(
    async (data: {
      profileData: Parameters<typeof updateProfileAction>[0]
      icpData: SettingsIcpData | null
    }): Promise<ApiResponse<null>> => {
      const profileResult = await updateProfileAction(data.profileData)
      if (!profileResult.success) return profileResult

      if (data.icpData) {
        const icpResult = await updateIcpAction(data.icpData)
        if (!icpResult.success) return icpResult
      }

      return profileResult
    },
    [],
  )

  const { execute: saveSettings, isPending: isSavingSettings } = useServerAction(
    saveSettingsAction,
    { successMessage: 'Einstellungen gespeichert' },
  )

  const { execute: saveCommStyle, isPending: isSavingCommStyle } = useServerAction(
    saveCommunicationStyleAction,
    { successMessage: 'Kommunikationsstil gespeichert' },
  )

  const isPending = isSavingSettings || isSavingCommStyle

  function handleSave() {
    setFieldErrors({})

    const validation = profileSchema.safeParse({
      company_name: companyName,
      industry: industry || undefined,
      description: description || undefined,
      target_market: targetMarket || undefined,
      website_url: websiteUrl || undefined,
    })
    if (!validation.success) {
      const errors: Record<string, string> = {}
      for (const issue of validation.error.issues) {
        const field = issue.path[0] as string
        errors[field] = issue.message
      }
      setFieldErrors(errors)
      toast.error(validation.error.issues[0]?.message ?? 'Ungültige Eingabe')
      return
    }

    saveSettings({
      profileData: {
        company_name: companyName,
        industry: industry || undefined,
        description: description || undefined,
        target_market: targetMarket || undefined,
        website_url: websiteUrl || undefined,
      },
      icpData: icp
        ? {
            industries: fromCommaStr(icpIndustries),
            company_sizes: fromCommaStr(icpSizes),
            regions: fromCommaStr(icpRegions),
            job_titles: fromCommaStr(icpJobTitles),
            seniority_levels: fromCommaStr(icpSeniority),
            additional_info: icpAdditionalInfo || undefined,
          }
        : null,
    })
  }

  function handleSaveCommStyle() {
    saveCommStyle({
      email_example: emailExample || undefined,
      email_signature: emailSignature || undefined,
      writing_style: writingStyle || undefined,
      salutation_preference: (salutationPref as 'du' | 'sie') || undefined,
      voice_example: voiceExample || undefined,
      speaking_style: speakingStyle || undefined,
      opening_phrase: openingPhrase || undefined,
      call_to_action: callToAction || undefined,
      additional_notes: commAdditionalNotes || undefined,
    })
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      <AppTopbar
        title="Einstellungen"
        actions={
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? 'Speichere...' : 'Speichern'}
          </button>
        }
      />

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-8">
        <Tabs defaultValue="profil">
          <TabsList variant="line" className="w-full justify-start border-b border-border">
            <TabsTrigger value="profil">Profil</TabsTrigger>
            <TabsTrigger value="icp">ICP-Konfiguration</TabsTrigger>
            <TabsTrigger value="kommunikation">Kommunikationsstil</TabsTrigger>
            <TabsTrigger value="integrationen">Integrationen</TabsTrigger>
            <TabsTrigger value="benachrichtigungen">Benachrichtigungen</TabsTrigger>
            <TabsTrigger value="abrechnung">Abrechnung</TabsTrigger>
          </TabsList>

          {/* Profil Tab */}
          <TabsContent value="profil">
            <div className="flex flex-col gap-8 pt-6">
              <section>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-foreground">Profil-Informationen</h2>
                  <span className="text-xs text-muted-foreground">
                    Alle Änderungen werden sofort beim Speichern übernommen
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="unternehmen">Unternehmen</Label>
                    <Input
                      id="unternehmen"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      aria-invalid={!!fieldErrors.company_name}
                      aria-describedby={fieldErrors.company_name ? 'unternehmen-error' : undefined}
                    />
                    {fieldErrors.company_name && (
                      <p id="unternehmen-error" role="alert" className="text-xs text-destructive">
                        {fieldErrors.company_name}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="branche">Branche</Label>
                    <Input
                      id="branche"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="email">Email-Adresse</Label>
                    <Input id="email" type="email" value={email} disabled className="bg-muted" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      aria-invalid={!!fieldErrors.website_url}
                      aria-describedby={fieldErrors.website_url ? 'website-error' : undefined}
                    />
                    {fieldErrors.website_url && (
                      <p id="website-error" role="alert" className="text-xs text-destructive">
                        {fieldErrors.website_url}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <Label htmlFor="zielmarkt">Zielmarkt</Label>
                    <Input
                      id="zielmarkt"
                      value={targetMarket}
                      onChange={(e) => setTargetMarket(e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <Label htmlFor="beschreibung">Beschreibung</Label>
                    <textarea
                      id="beschreibung"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      aria-invalid={!!fieldErrors.description}
                      aria-describedby={fieldErrors.description ? 'beschreibung-error' : undefined}
                      className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    {fieldErrors.description && (
                      <p id="beschreibung-error" role="alert" className="text-xs text-destructive">
                        {fieldErrors.description}
                      </p>
                    )}
                  </div>
                </div>
              </section>

            </div>
          </TabsContent>

          {/* ICP Tab */}
          <TabsContent value="icp">
            {icp ? (
              <div className="flex flex-col gap-6 pt-6">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    Ideal Customer Profile
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Mehrere Werte mit Komma trennen (z.&nbsp;B. &bdquo;SaaS, FinTech&ldquo;). Gilt
                    für alle zukünftigen Discovery-Suchen.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  {[
                    {
                      id: 'icp-industries',
                      label: 'Branchen',
                      value: icpIndustries,
                      onChange: setIcpIndustries,
                      placeholder: 'z. B. SaaS, FinTech, E-Commerce, Beratung',
                    },
                    {
                      id: 'icp-sizes',
                      label: 'Unternehmensgrößen',
                      value: icpSizes,
                      onChange: setIcpSizes,
                      placeholder: 'z. B. 11-50, 51-200, 201-500',
                    },
                    {
                      id: 'icp-regions',
                      label: 'Regionen',
                      value: icpRegions,
                      onChange: setIcpRegions,
                      placeholder: 'z. B. Österreich, Deutschland, Schweiz, DACH',
                    },
                    {
                      id: 'icp-job-titles',
                      label: 'Job-Titel',
                      value: icpJobTitles,
                      onChange: setIcpJobTitles,
                      placeholder: 'z. B. Geschäftsführer, Head of Sales, CTO',
                    },
                    {
                      id: 'icp-seniority',
                      label: 'Seniority-Level',
                      value: icpSeniority,
                      onChange: setIcpSeniority,
                      placeholder: 'z. B. c_suite, vp, director, manager',
                    },
                  ].map(({ id, label, value, onChange, placeholder }) => (
                    <div key={id} className="flex flex-col gap-1.5">
                      <Label htmlFor={id}>{label}</Label>
                      <Input
                        id={id}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="icp-additional-info">Zusätzliche Informationen</Label>
                  <textarea
                    id="icp-additional-info"
                    value={icpAdditionalInfo}
                    onChange={(e) => setIcpAdditionalInfo(e.target.value)}
                    placeholder="z. B. kein Franchise, mind. 2 Jahre am Markt, eigene Website vorhanden"
                    rows={3}
                    className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Klicke &bdquo;Speichern&ldquo; oben rechts, um die ICP-Konfiguration zu
                  übernehmen.
                </p>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Kein ICP-Profil gefunden. Schließe zuerst das Onboarding ab.
              </p>
            )}
          </TabsContent>

          {/* Kommunikationsstil Tab */}
          <TabsContent value="kommunikation">
            <div className="flex flex-col gap-8 pt-6">
              {/* E-Mail-Stil */}
              <section>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Mail className="size-5 text-accent" />
                  E-Mail-Stil
                </h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Definiere den Ton und Stil deiner automatisierten E-Mails.
                </p>

                <div className="mt-4 flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="comm-email-example">Beispiel-E-Mail</Label>
                    <Textarea
                      id="comm-email-example"
                      value={emailExample}
                      onChange={(e) => setEmailExample(e.target.value)}
                      rows={6}
                      placeholder="Hallo Herr Müller, ich bin auf Ihr Unternehmen gestoßen..."
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="comm-email-signature">E-Mail-Signatur</Label>
                    <Textarea
                      id="comm-email-signature"
                      value={emailSignature}
                      onChange={(e) => setEmailSignature(e.target.value)}
                      rows={3}
                      placeholder="Freundliche Grüße, [Name]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="comm-writing-style">Schreibstil</Label>
                      <Select
                        value={writingStyle}
                        onValueChange={(val) => setWritingStyle(val as string)}
                      >
                        <SelectTrigger id="comm-writing-style" className="w-full">
                          <SelectValue placeholder="Stil wählen..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="formell">Formell</SelectItem>
                          <SelectItem value="freundlich-professionell">
                            Freundlich-professionell
                          </SelectItem>
                          <SelectItem value="direkt-knapp">Direkt &amp; knapp</SelectItem>
                          <SelectItem value="locker">Locker</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <fieldset className="flex flex-col gap-1.5">
                      <legend className="text-sm font-medium">Anrede-Präferenz</legend>
                      <div className="mt-1 flex items-center gap-6">
                        <label
                          htmlFor="salutation-sie"
                          className="flex items-center gap-2 text-sm text-foreground"
                        >
                          <input
                            type="radio"
                            id="salutation-sie"
                            name="salutation"
                            value="sie"
                            checked={salutationPref === 'sie'}
                            onChange={() => setSalutationPref('sie')}
                            className="size-4 accent-accent"
                          />
                          Sie-Form
                        </label>
                        <label
                          htmlFor="salutation-du"
                          className="flex items-center gap-2 text-sm text-foreground"
                        >
                          <input
                            type="radio"
                            id="salutation-du"
                            name="salutation"
                            value="du"
                            checked={salutationPref === 'du'}
                            onChange={() => setSalutationPref('du')}
                            className="size-4 accent-accent"
                          />
                          Du-Form
                        </label>
                      </div>
                    </fieldset>
                  </div>
                </div>
              </section>

              {/* Voice-Message-Stil */}
              <section>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Mic className="size-5 text-accent" />
                  Voice-Message-Stil
                </h3>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Konfiguriere den Stil für automatische Sprachnachrichten.
                </p>

                <div className="mt-4 flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="comm-voice-example">Beispiel-Skript</Label>
                    <Textarea
                      id="comm-voice-example"
                      value={voiceExample}
                      onChange={(e) => setVoiceExample(e.target.value)}
                      rows={4}
                      placeholder="Guten Tag Herr Müller, mein Name ist... Ich rufe an, weil..."
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="comm-speaking-style">Sprechstil</Label>
                    <Select
                      value={speakingStyle}
                      onValueChange={(val) => setSpeakingStyle(val as string)}
                    >
                      <SelectTrigger id="comm-speaking-style" className="w-full">
                        <SelectValue placeholder="Stil wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ruhig-sachlich">Ruhig &amp; sachlich</SelectItem>
                        <SelectItem value="energetisch">Energetisch</SelectItem>
                        <SelectItem value="persoenlich-warm">
                          Persönlich &amp; warm
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="comm-opening-phrase">Typische Eröffnungsphrase</Label>
                      <Input
                        id="comm-opening-phrase"
                        value={openingPhrase}
                        onChange={(e) => setOpeningPhrase(e.target.value)}
                        placeholder="Guten Tag, mein Name ist..."
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="comm-cta">Typischer Call-to-Action</Label>
                      <Input
                        id="comm-cta"
                        value={callToAction}
                        onChange={(e) => setCallToAction(e.target.value)}
                        placeholder="Hätten Sie 15 Minuten..."
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Allgemein */}
              <section>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Settings className="size-5 text-accent" />
                  Allgemein
                </h3>

                <div className="mt-4 flex flex-col gap-1.5">
                  <Label htmlFor="comm-additional-notes">Zusätzliche Hinweise</Label>
                  <Textarea
                    id="comm-additional-notes"
                    value={commAdditionalNotes}
                    onChange={(e) => setCommAdditionalNotes(e.target.value)}
                    rows={4}
                    placeholder="z. B. Ich erwähne nie den Preis im ersten Kontakt, vermeide Fachjargon..."
                  />
                </div>
              </section>

              {/* Save button */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleSaveCommStyle}
                  disabled={isPending}
                  className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-50"
                >
                  {isPending ? 'Speichere...' : 'Speichern'}
                </button>
                <span className="text-xs text-muted-foreground">
                  Alle Felder sind optional — fülle aus, was für dich relevant ist.
                </span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="integrationen">
            <PlaceholderContent />
          </TabsContent>
          <TabsContent value="benachrichtigungen">
            <PlaceholderContent />
          </TabsContent>
          <TabsContent value="abrechnung">
            <PlaceholderContent />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
