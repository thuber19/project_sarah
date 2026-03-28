'use client'

import { useRef, useState, useCallback } from 'react'
import { ArrowLeft, Upload, FileText, CheckCircle2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { AppTopbar } from '@/components/layout/app-topbar'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const PREVIEW_DATA = [
  {
    company: 'CloudMake GmbH',
    industry: 'SaaS',
    location: 'Wien, AT',
    employees: 45,
    website: 'cloudmake.at',
  },
  {
    company: 'SalesPro AG',
    industry: 'FinTech',
    location: 'Berlin, DE',
    employees: 120,
    website: 'salespro.de',
  },
  {
    company: 'AlpenTech Solutions',
    industry: 'Cloud',
    location: 'Zürich, CH',
    employees: 85,
    website: 'alpentech.ch',
  },
  {
    company: 'NordCloud Systems',
    industry: 'SaaS',
    location: 'Hamburg, DE',
    employees: 200,
    website: 'nordcloud.de',
  },
  {
    company: 'DevSecPay GmbH',
    industry: 'FinTech',
    location: 'München, DE',
    employees: 65,
    website: 'devsecpay.de',
  },
]

const FIELD_MAPPINGS = [
  { label: 'Firmenname', field: 'company_name' },
  { label: 'Branche', field: 'industry' },
  { label: 'Standort', field: 'location' },
  { label: 'Mitarbeiter', field: 'employee_count' },
  { label: 'Website', field: 'website' },
]

export default function LeadImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    // File handling would go here
  }, [])

  return (
    <div className="flex h-full flex-1 flex-col">
      <AppTopbar
        title="Leads importieren"
        actions={
          <Link
            href="/leads"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Zurück zur Lead-Liste"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        }
      />

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-5 lg:flex-row lg:gap-8 lg:px-8 lg:py-8">
        <div className="flex flex-1 flex-col gap-6">
          {/* Header */}
          <div>
            <h1 className="text-lg font-semibold text-foreground">CSV-Datei importieren</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Importiere deine bestehenden Leads aus einer CSV-Datei. Sarah bewertet sie
              automatisch.
            </p>
          </div>

          {/* Drop zone */}
          <div
            role="button"
            tabIndex={0}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                fileInputRef.current?.click()
              }
            }}
            className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-6 transition-colors lg:p-12 ${
              isDragOver ? 'border-accent bg-accent-light/60' : 'border-accent bg-accent-light/40'
            }`}
            aria-label="CSV-Datei hochladen"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              aria-hidden="true"
            />

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-light">
              <Upload className="h-6 w-6 text-accent" />
            </div>

            <span className="text-sm font-semibold text-foreground">CSV-Datei hierher ziehen</span>

            <span className="text-sm font-medium text-accent hover:underline">
              oder Datei auswählen
            </span>

            <span className="text-xs text-muted-foreground">
              Unterstützt: .csv, .xlsx · Max. 10 MB
            </span>
          </div>

          {/* File info card */}
          <div className="flex items-center gap-3 rounded-lg border border-border bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
              <FileText className="h-5 w-5 text-success" />
            </div>
            <div className="flex flex-1 flex-col">
              <span className="text-sm font-medium text-foreground">leads_export_2026.csv</span>
              <span className="text-xs text-muted-foreground">
                127 Zeilen &middot; 2.3 KB &middot; Hochgeladen vor 2 Min.
              </span>
            </div>
            <CheckCircle2 className="h-5 w-5 text-success" />
          </div>

          {/* Preview section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-foreground">
                Vorschau (erste 5 Zeilen)
              </span>
              <Badge className="bg-accent-light text-accent">127 Leads erkannt</Badge>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unternehmensname</TableHead>
                    <TableHead>Branche</TableHead>
                    <TableHead>Standort</TableHead>
                    <TableHead>Mitarbeiter</TableHead>
                    <TableHead>Website</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PREVIEW_DATA.map((row) => (
                    <TableRow key={row.company}>
                      <TableCell className="font-medium">{row.company}</TableCell>
                      <TableCell>{row.industry}</TableCell>
                      <TableCell>{row.location}</TableCell>
                      <TableCell>{row.employees}</TableCell>
                      <TableCell className="text-accent">{row.website}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col gap-6 lg:w-[320px]">
          {/* Field mapping card */}
          <div className="rounded-xl border border-border bg-white p-6">
            <h2 className="text-sm font-semibold text-foreground">Feld-Mapping</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Ordne deine CSV-Spalten den Sarah-Feldern zu.
            </p>

            <div className="mt-5 flex flex-col gap-3">
              {FIELD_MAPPINGS.map(({ label, field }) => (
                <div key={field} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{label}</span>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <code className="rounded-md bg-secondary px-2 py-0.5 font-mono text-xs text-muted-foreground">
                      {field}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Import settings card */}
          <div className="rounded-xl border border-border bg-white p-6">
            <h2 className="text-sm font-semibold text-foreground">Import-Einstellungen</h2>

            <div className="mt-5 flex flex-col gap-4">
              <label className="flex items-center justify-between">
                <span className="text-sm text-foreground">Auto-Scoring</span>
                <Switch defaultChecked />
              </label>

              <label className="flex items-center justify-between">
                <span className="text-sm text-foreground">Duplikate überspringen</span>
                <Switch defaultChecked />
              </label>

              <label className="flex items-center justify-between">
                <span className="text-sm text-foreground">Branchen-Enrichment</span>
                <Switch defaultChecked />
              </label>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <Button className="w-full gap-2 bg-accent text-white hover:bg-accent/90">
              <Upload className="h-4 w-4" />
              127 Leads importieren
            </Button>
            <Button variant="outline" className="w-full">
              Abbrechen
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
