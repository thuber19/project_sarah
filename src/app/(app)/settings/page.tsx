"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ICP_FIELDS = [
  { label: "Branchen", tags: ["SaaS", "FinTech", "E-Commerce"] },
  { label: "Gr\u00f6\u00dfe", tags: ["10-50 MA", "50-250 MA"] },
  { label: "Region", tags: ["\u00d6sterreich", "Deutschland", "Schweiz"] },
  { label: "Technologien", tags: ["React", "Node.js", "AWS"] },
] as const;

const INTEGRATIONS = [
  {
    name: "Apollo.io",
    description: "Lead-Recherche & Kontaktdaten",
    iconLetter: "A",
    iconBg: "bg-blue-600",
    connected: true,
  },
] as const;

function TagPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-accent-light px-2 py-1 text-xs font-medium text-accent">
      {children}
    </span>
  );
}

function PlaceholderContent() {
  return (
    <p className="py-8 text-center text-sm text-muted-foreground">
      Demn&auml;chst verf&uuml;gbar
    </p>
  );
}

export default function SettingsPage() {
  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Top bar */}
      <div className="flex h-16 items-center justify-between border-b border-border bg-white px-8">
        <span className="text-base font-semibold text-foreground">
          Einstellungen
        </span>
        <button
          type="button"
          className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          Speichern
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-8">
        <Tabs defaultValue="profil">
          <TabsList
            variant="line"
            className="w-full justify-start border-b border-border"
          >
            <TabsTrigger value="profil">Profil</TabsTrigger>
            <TabsTrigger value="icp">ICP-Konfiguration</TabsTrigger>
            <TabsTrigger value="integrationen">Integrationen</TabsTrigger>
            <TabsTrigger value="benachrichtigungen">
              Benachrichtigungen
            </TabsTrigger>
            <TabsTrigger value="abrechnung">Abrechnung</TabsTrigger>
          </TabsList>

          {/* Profil Tab */}
          <TabsContent value="profil">
            <div className="flex flex-col gap-8 pt-6">
              {/* Profil-Informationen */}
              <section>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-foreground">
                    Profil-Informationen
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    Alle &Auml;nderungen werden sofort beim Speichern
                    &uuml;bernommen
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="vorname">Vorname</Label>
                    <Input id="vorname" defaultValue="Thomas" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="nachname">Nachname</Label>
                    <Input id="nachname" defaultValue="Huber" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="email">Email-Adresse</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue="thomas@techventures.at"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="unternehmen">Unternehmen</Label>
                    <Input id="unternehmen" defaultValue="TechVentures GmbH" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="rolle">Rolle</Label>
                    <Input id="rolle" defaultValue="Gesch&auml;ftsf&uuml;hrer" />
                  </div>
                </div>
              </section>

              {/* ICP-Konfiguration (Vorschlag) */}
              <section>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      ICP-Konfiguration (Vorschlag)
                    </h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Basierend auf der Analyse deiner Website.
                      &Auml;nderungen gelten f&uuml;r k&uuml;nftige Suchen.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-sm font-medium text-accent transition-colors hover:text-accent/80"
                  >
                    Bearbeiten
                  </button>
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  {ICP_FIELDS.map((field) => (
                    <div
                      key={field.label}
                      className="flex items-center"
                    >
                      <span className="w-[120px] text-sm font-medium text-muted-foreground">
                        {field.label}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {field.tags.map((tag) => (
                          <TagPill key={tag}>{tag}</TagPill>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Verbundene Integrationen */}
              <section>
                <h2 className="text-base font-semibold text-foreground">
                  Verbundene Integrationen
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Verkn&uuml;pfe deine API-Verbindungen und Datenquellen
                </p>

                {INTEGRATIONS.map((integration) => (
                  <div
                    key={integration.name}
                    className="mt-4 flex items-center gap-4 rounded-lg border border-border p-4"
                  >
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${integration.iconBg}`}
                    >
                      <span className="text-sm font-bold text-white">
                        {integration.iconLetter}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">
                        {integration.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {integration.description}
                      </span>
                    </div>
                    {integration.connected && (
                      <span className="ml-auto rounded-lg bg-accent px-4 py-1.5 text-xs font-medium text-white">
                        Verbunden
                      </span>
                    )}
                  </div>
                ))}
              </section>
            </div>
          </TabsContent>

          {/* Placeholder tabs */}
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
  );
}
