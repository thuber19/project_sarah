'use client'

import { useState, useTransition } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  updateProfileAction,
  updateIcpAction,
  updateCommunicationStyleAction,
  type CommunicationStyleData,
} from '@/app/actions/settings.actions'
import { AppTopbar } from '@/components/layout/app-topbar'
import { IcpEditModal, type IcpFormData } from '@/components/settings/icp-edit-modal'
import type { BusinessProfile, IcpProfile } from '@/types/database'

function TagPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-accent-light px-2 py-1 text-xs font-medium text-accent">
      {children}
    </span>
  )
}

function PlaceholderContent() {
  return <p className="py-8 text-center text-sm text-muted-foreground">Demnächst verfügbar</p>
}

const INTEGRATIONS = [
  {
    name: 'Apollo.io',
    description: 'Lead-Recherche & Kontaktdaten',
    iconLetter: 'A',
    iconBg: 'bg-blue-600',
    connected: !!process.env.NEXT_PUBLIC_APOLLO_CONNECTED,
  },
  {
    name: 'HubSpot CRM',
    description: 'Lead-Export & Deal-Pipeline',
    iconLetter: 'H',
    iconBg: 'bg-orange-500',
    connected: !!process.env.NEXT_PUBLIC_HUBSPOT_CONNECTED,
  },
] as const

interface SettingsClientProps {
  profile: BusinessProfile | null
  icp: IcpProfile | null
  email: string
  communicationStyle: CommunicationStyleData | null
}

export function SettingsClient({ profile, icp, email, communicationStyle }: SettingsClientProps) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Profile fields
  const [companyName, setCompanyName] = useState(profile?.company_name ?? '')
  const [industry, setIndustry] = useState(profile?.industry ?? '')
  const [description, setDescription] = useState(profile?.description ?? '')
  const [targetMarket, setTargetMarket] = useState(profile?.target_market ?? '')
  const [websiteUrl, setWebsiteUrl] = useState(profile?.website_url ?? '')

  // Communication style fields
  const [exampleEmail, setExampleEmail] = useState(communicationStyle?.example_email ?? '')
  const [emailSignature, setEmailSignature] = useState(communicationStyle?.email_signature ?? '')
  const [writingStyle, setWritingStyle] = useState(communicationStyle?.writing_style ?? '')
  const [formality, setFormality] = useState<'du' | 'sie'>(communicationStyle?.formality ?? 'sie')
  const [exampleVoiceScript, setExampleVoiceScript] = useState(communicationStyle?.example_voice_script ?? '')
  const [speakingStyle, setSpeakingStyle] = useState(communicationStyle?.speaking_style ?? '')
  const [openingPhrase, setOpeningPhrase] = useState(communicationStyle?.opening_phrase ?? '')
  const [callToAction, setCallToAction] = useState(communicationStyle?.call_to_action ?? '')
  const [additionalNotes, setAdditionalNotes] = useState(communicationStyle?.additional_notes ?? '')

  // ICP state (mutable via modal)
  const [icpData, setIcpData] = useState<IcpFormData>({
    industries: icp?.industries ?? [],
    company_sizes: icp?.company_sizes ?? [],
    regions: icp?.regions ?? [],
    job_titles: icp?.job_titles ?? [],
    seniority_levels: icp?.seniority_levels ?? [],
    tech_stack: icp?.tech_stack ?? [],
  })
  const [icpModalOpen, setIcpModalOpen] = useState(false)

  // ICP display data
  const icpFields = [
    { label: 'Branchen', tags: icpData.industries },
    { label: 'Größe', tags: icpData.company_sizes },
    { label: 'Region', tags: icpData.regions },
    { label: 'Technologien', tags: icpData.tech_stack },
    { label: 'Titel', tags: icpData.job_titles },
    { label: 'Seniority', tags: icpData.seniority_levels },
  ].filter((f) => f.tags.length > 0)

  function handleSave() {
    setMessage(null)
    startTransition(async () => {
      const profileResult = await updateProfileAction({
        company_name: companyName,
        industry: industry || undefined,
        description: description || undefined,
        target_market: targetMarket || undefined,
        website_url: websiteUrl || undefined,
      })

      if (profileResult.error) {
        setMessage({ type: 'error', text: profileResult.error })
        return
      }

      if (icp) {
        const icpResult = await updateIcpAction(icpData)
        if (icpResult.error) {
          setMessage({ type: 'error', text: icpResult.error })
          return
        }
      }

      const commResult = await updateCommunicationStyleAction({
        example_email: exampleEmail || undefined,
        email_signature: emailSignature || undefined,
        writing_style: writingStyle || undefined,
        formality,
        example_voice_script: exampleVoiceScript || undefined,
        speaking_style: speakingStyle || undefined,
        opening_phrase: openingPhrase || undefined,
        call_to_action: callToAction || undefined,
        additional_notes: additionalNotes || undefined,
      })
      if (commResult.error) {
        setMessage({ type: 'error', text: commResult.error })
        return
      }

      setMessage({ type: 'success', text: 'Einstellungen gespeichert' })
    })
  }

  function handleIcpSave(data: IcpFormData) {
    setMessage(null)
    startTransition(async () => {
      const result = await updateIcpAction(data)
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
        return
      }
      setIcpData(data)
      setIcpModalOpen(false)
      setMessage({ type: 'success', text: 'ICP gespeichert' })
    })
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      <AppTopbar
        title="Einstellungen"
        actions={
          <>
            {message && (
              <span className={`text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {message.text}
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {isPending ? 'Speichere...' : 'Speichern'}
            </button>
          </>
        }
      />

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 md:p-8">
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

                <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="unternehmen">Unternehmen</Label>
                    <Input id="unternehmen" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="branche">Branche</Label>
                    <Input id="branche" value={industry} onChange={(e) => setIndustry(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="email">Email-Adresse</Label>
                    <Input id="email" type="email" value={email} disabled className="bg-muted" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
                  </div>
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <Label htmlFor="zielmarkt">Zielmarkt</Label>
                    <Input id="zielmarkt" value={targetMarket} onChange={(e) => setTargetMarket(e.target.value)} />
                  </div>
                  <div className="col-span-2 flex flex-col gap-1.5">
                    <Label htmlFor="beschreibung">Beschreibung</Label>
                    <textarea
                      id="beschreibung"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              </section>

              {/* ICP Summary */}
              {icpFields.length > 0 && (
                <section>
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-foreground">ICP-Konfiguration</h2>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Basierend auf der Analyse deiner Website. Änderungen gelten für künftige Suchen.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3">
                    {icpFields.map((field) => (
                      <div key={field.label} className="flex items-center">
                        <span className="w-[120px] text-sm font-medium text-muted-foreground">{field.label}</span>
                        <div className="flex flex-wrap gap-2">
                          {field.tags.map((tag) => (
                            <TagPill key={tag}>{tag}</TagPill>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Integrations */}
              <section>
                <h2 className="text-base font-semibold text-foreground">Verbundene Integrationen</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Verknüpfe deine API-Verbindungen und Datenquellen
                </p>

                {INTEGRATIONS.map((integration) => (
                  <div key={integration.name} className="mt-4 flex items-center gap-4 rounded-lg border border-border p-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${integration.iconBg}`}>
                      <span className="text-sm font-bold text-white">{integration.iconLetter}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">{integration.name}</span>
                      <span className="text-xs text-muted-foreground">{integration.description}</span>
                    </div>
                    <span className={`ml-auto rounded-lg px-4 py-1.5 text-xs font-medium ${integration.connected ? 'bg-accent text-white' : 'bg-muted text-muted-foreground'}`}>
                      {integration.connected ? 'Verbunden' : 'Nicht verbunden'}
                    </span>
                  </div>
                ))}
              </section>
            </div>
          </TabsContent>

          {/* Kommunikationsstil Tab */}
          <TabsContent value="kommunikation">
            <div className="flex flex-col gap-8 pt-6">
              {/* E-Mail-Stil */}
              <section>
                <h2 className="text-base font-semibold text-foreground">E-Mail-Stil</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Sarah passt generierte E-Mails an deinen persönlichen Schreibstil an.
                </p>

                <div className="mt-4 flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="example-email">Beispiel-E-Mail</Label>
                    <textarea
                      id="example-email"
                      value={exampleEmail}
                      onChange={(e) => setExampleEmail(e.target.value)}
                      rows={4}
                      placeholder={'Hallo Herr Müller,\nich bin auf Ihr Unternehmen gestoßen und finde Ihren Ansatz im Bereich... sehr interessant.\nHätten Sie Interesse an einem kurzen Austausch diese Woche?\nFreundliche Grüße, Tobias'}
                      className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <p className="text-xs text-muted-foreground">
                      Füge eine echte E-Mail ein, die du geschrieben hast — Sarah übernimmt Ton, Wortwahl und Grußformel.
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="email-signature">E-Mail-Signatur</Label>
                    <textarea
                      id="email-signature"
                      value={emailSignature}
                      onChange={(e) => setEmailSignature(e.target.value)}
                      rows={2}
                      placeholder="Mit freundlichen Grüßen&#10;Tobias Huber | Sarah AI"
                      className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor="writing-style">Schreibstil</Label>
                      <Input
                        id="writing-style"
                        value={writingStyle}
                        onChange={(e) => setWritingStyle(e.target.value)}
                        placeholder='z. B. „freundlich-professionell"'
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <Label>Anrede-Präferenz</Label>
                      <div className="flex gap-4 pt-2">
                        <label className="flex items-center gap-2 text-sm text-foreground">
                          <input
                            type="radio"
                            name="formality"
                            value="sie"
                            checked={formality === 'sie'}
                            onChange={() => setFormality('sie')}
                            className="accent-accent"
                          />
                          Sie-Form
                        </label>
                        <label className="flex items-center gap-2 text-sm text-foreground">
                          <input
                            type="radio"
                            name="formality"
                            value="du"
                            checked={formality === 'du'}
                            onChange={() => setFormality('du')}
                            className="accent-accent"
                          />
                          Du-Form
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Voice-Message-Stil */}
              <section>
                <h2 className="text-base font-semibold text-foreground">Voice-Message-Stil</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Definiere deinen Sprechstil für generierte Voice-Nachrichten.
                </p>

                <div className="mt-4 flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="example-voice">Beispiel-Skript</Label>
                    <textarea
                      id="example-voice"
                      value={exampleVoiceScript}
                      onChange={(e) => setExampleVoiceScript(e.target.value)}
                      rows={3}
                      placeholder="Guten Tag, mein Name ist Tobias Huber von Sarah AI — ich melde mich kurz wegen..."
                      className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="speaking-style">Sprechstil</Label>
                    <Input
                      id="speaking-style"
                      value={speakingStyle}
                      onChange={(e) => setSpeakingStyle(e.target.value)}
                      placeholder='z. B. „ruhig & sachlich"'
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="opening-phrase">Typische Eröffnungsphrase</Label>
                    <Input
                      id="opening-phrase"
                      value={openingPhrase}
                      onChange={(e) => setOpeningPhrase(e.target.value)}
                      placeholder='z. B. „Hallo, ich bin der Tobias von..."'
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="cta">Typischer Call-to-Action</Label>
                    <Input
                      id="cta"
                      value={callToAction}
                      onChange={(e) => setCallToAction(e.target.value)}
                      placeholder='z. B. „Hätten Sie 15 Minuten für ein kurzes Gespräch?"'
                    />
                  </div>
                </div>
              </section>

              {/* Allgemein */}
              <section>
                <h2 className="text-base font-semibold text-foreground">Allgemein</h2>
                <div className="mt-4 flex flex-col gap-1.5">
                  <Label htmlFor="additional-notes">Zusätzliche Hinweise</Label>
                  <textarea
                    id="additional-notes"
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    rows={3}
                    placeholder='z. B. „Ich erwähne nie den Preis im ersten Kontakt" oder „Ich stelle immer eine konkrete Frage am Ende"'
                    className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </section>
            </div>
          </TabsContent>

          <TabsContent value="icp">
            <div className="flex flex-col gap-6 pt-6">
              <section>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Ideal Customer Profile</h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Definiert, welche Leads für dich am relevantesten sind. Änderungen gelten für künftige Suchen.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIcpModalOpen(true)}
                    className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
                  >
                    ICP bearbeiten
                  </button>
                </div>

                {icpFields.length > 0 ? (
                  <div className="mt-6 flex flex-col gap-4">
                    {icpFields.map((field) => (
                      <div key={field.label} className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
                        <span className="text-sm font-medium text-muted-foreground sm:w-[120px] sm:shrink-0">{field.label}</span>
                        <div className="flex flex-wrap gap-2">
                          {field.tags.map((tag) => (
                            <TagPill key={tag}>{tag}</TagPill>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-lg border border-dashed border-border p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      Noch kein ICP konfiguriert. Klicke &quot;ICP bearbeiten&quot; um loszulegen.
                    </p>
                  </div>
                )}
              </section>
            </div>

            <IcpEditModal
              open={icpModalOpen}
              onOpenChange={setIcpModalOpen}
              initialData={icpData}
              onSave={handleIcpSave}
              isPending={isPending}
            />
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
