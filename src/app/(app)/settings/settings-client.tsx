'use client'

import { useState, useTransition } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  updateProfileAction,
  updateIcpAction,
  type SettingsIcpData,
} from '@/app/actions/settings.actions'
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
] as const

interface SettingsClientProps {
  profile: BusinessProfile | null
  icp: IcpProfile | null
  email: string
}

export function SettingsClient({ profile, icp, email }: SettingsClientProps) {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Profile fields
  const [companyName, setCompanyName] = useState(profile?.company_name ?? '')
  const [industry, setIndustry] = useState(profile?.industry ?? '')
  const [description, setDescription] = useState(profile?.description ?? '')
  const [targetMarket, setTargetMarket] = useState(profile?.target_market ?? '')
  const [websiteUrl, setWebsiteUrl] = useState(profile?.website_url ?? '')

  // ICP display data
  const icpFields = [
    { label: 'Branchen', tags: icp?.industries ?? [] },
    { label: 'Größe', tags: icp?.company_sizes ?? [] },
    { label: 'Region', tags: icp?.regions ?? [] },
    { label: 'Technologien', tags: icp?.tech_stack ?? [] },
    { label: 'Titel', tags: icp?.job_titles ?? [] },
    { label: 'Seniority', tags: icp?.seniority_levels ?? [] },
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
        const icpData: SettingsIcpData = {
          industries: icp.industries ?? [],
          company_sizes: icp.company_sizes ?? [],
          regions: icp.regions ?? [],
          job_titles: icp.job_titles ?? [],
          seniority_levels: icp.seniority_levels ?? [],
          tech_stack: icp.tech_stack ?? [],
        }
        const icpResult = await updateIcpAction(icpData)
        if (icpResult.error) {
          setMessage({ type: 'error', text: icpResult.error })
          return
        }
      }

      setMessage({ type: 'success', text: 'Einstellungen gespeichert' })
    })
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="flex h-16 items-center justify-between border-b border-border bg-white px-8">
        <span className="text-base font-semibold text-foreground">Einstellungen</span>
        <div className="flex items-center gap-3">
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
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-8">
        <Tabs defaultValue="profil">
          <TabsList variant="line" className="w-full justify-start border-b border-border">
            <TabsTrigger value="profil">Profil</TabsTrigger>
            <TabsTrigger value="icp">ICP-Konfiguration</TabsTrigger>
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

          <TabsContent value="icp">
            <PlaceholderContent />
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
