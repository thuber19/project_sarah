'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AppTopbar } from '@/components/layout/app-topbar'
import { updateProfileAction, updateIcpAction } from '@/app/actions/settings.actions'
import { profileSchema, type SettingsIcpData } from '@/lib/validation/schemas'
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
  const [isPending, startTransition] = useTransition()
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

    startTransition(async () => {
      const profileResult = await updateProfileAction({
        company_name: companyName,
        industry: industry || undefined,
        description: description || undefined,
        target_market: targetMarket || undefined,
        website_url: websiteUrl || undefined,
      })

      if (!profileResult.success) {
        toast.error(profileResult.error.message)
        return
      }

      if (icp) {
        const icpData: SettingsIcpData = {
          industries: fromCommaStr(icpIndustries),
          company_sizes: fromCommaStr(icpSizes),
          regions: fromCommaStr(icpRegions),
          job_titles: fromCommaStr(icpJobTitles),
          seniority_levels: fromCommaStr(icpSeniority),
          additional_info: icpAdditionalInfo || undefined,
        }
        const icpResult = await updateIcpAction(icpData)
        if (!icpResult.success) {
          toast.error(icpResult.error.message)
          return
        }
      }

      toast.success('Einstellungen gespeichert')
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
