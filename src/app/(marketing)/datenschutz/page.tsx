import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Datenschutzerklärung — Sarah AI',
}

export default function DatenschutzPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      {/* Beta disclaimer */}
      <div className="mb-8 rounded-lg border border-warning/30 bg-status-warning-bg px-4 py-3 text-sm text-status-warning-text">
        <strong>Beta-Hinweis:</strong> Sarah AI befindet sich in der Beta-Phase. Diese
        Datenschutzerklärung gilt für den Demo-Betrieb. Vor der Verarbeitung echter Produktivdaten
        ist eine rechtliche Prüfung erforderlich.
      </div>

      <h1 className="mb-2 text-3xl font-bold text-foreground">Datenschutzerklärung</h1>
      <p className="mb-8 text-sm text-muted-foreground">Stand: März 2026</p>

      <div className="space-y-8 text-sm text-foreground">
        <section>
          <h2 className="mb-3 text-base font-semibold">1. Verantwortlicher</h2>
          <p className="text-muted-foreground leading-relaxed">
            Verantwortlich für die Datenverarbeitung auf dieser Website ist das Sarah-AI-Projektteam
            (Sarah K., Sarah T., Tobias H., Bernhard G.), erreichbar unter{' '}
            <a href="mailto:hallo@sarah-ai.at" className="text-accent hover:underline">
              hallo@sarah-ai.at
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold">2. Welche Daten wir verarbeiten</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
            <li>
              <strong className="text-foreground">Kontodaten:</strong> E-Mail-Adresse (für
              Magic-Link-Login via Supabase Auth)
            </li>
            <li>
              <strong className="text-foreground">Unternehmensprofil:</strong> Website-URL, Branche,
              Wertversprechen (aus Onboarding)
            </li>
            <li>
              <strong className="text-foreground">ICP-Profil:</strong> Zielkunden-Parameter
              (Industrien, Unternehmensgrößen, Regionen)
            </li>
            <li>
              <strong className="text-foreground">Lead-Daten:</strong> Öffentlich zugängliche
              Geschäftskontakte (aus Apollo.io und Google Places)
            </li>
            <li>
              <strong className="text-foreground">Nutzungsdaten:</strong> Agent-Logs,
              Kampagnen-Status (für Dashboard-Anzeige)
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold">3. Rechtsgrundlagen (DSGVO)</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
            <li>Art. 6 Abs. 1 lit. b DSGVO — Vertragserfüllung (Betrieb des Dienstes)</li>
            <li>
              Art. 6 Abs. 1 lit. f DSGVO — Berechtigte Interessen (Sicherheit,
              Missbrauchsprävention)
            </li>
            <li>Art. 6 Abs. 1 lit. a DSGVO — Einwilligung (wo explizit eingeholt)</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold">4. Auftragsverarbeiter</h2>
          <div className="space-y-4 text-muted-foreground">
            <div className="rounded-lg border border-border p-4">
              <p className="font-medium text-foreground">Supabase Inc.</p>
              <p>Datenbankhosting und Authentifizierung · Serverstandort: EU (Frankfurt)</p>
              <p className="mt-1">
                <a
                  href="https://supabase.com/privacy"
                  className="text-accent hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  supabase.com/privacy
                </a>
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="font-medium text-foreground">Vercel Inc.</p>
              <p>Hosting und CDN · Hauptsitz: USA · EU-US Data Privacy Framework (DPF)</p>
              <p className="mt-1">
                <a
                  href="https://vercel.com/legal/privacy-policy"
                  className="text-accent hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  vercel.com/legal/privacy-policy
                </a>
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="font-medium text-foreground">Anthropic PBC</p>
              <p>
                KI-Analyse (Website-Analyse, Lead-Scoring) · Hauptsitz: USA · EU-US Data Privacy
                Framework (DPF)
              </p>
              <p className="mt-1">
                <a
                  href="https://www.anthropic.com/privacy"
                  className="text-accent hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  anthropic.com/privacy
                </a>
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="font-medium text-foreground">Apollo.io</p>
              <p>Lead-Datenquelle (B2B-Kontaktdaten) · Hauptsitz: USA · Standardvertragsklauseln</p>
              <p className="mt-1">
                <a
                  href="https://www.apollo.io/privacy-policy"
                  className="text-accent hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  apollo.io/privacy-policy
                </a>
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold">5. Aufbewahrungsfristen</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
            <li>Kontodaten: bis zur Löschung des Accounts</li>
            <li>Lead-Daten und Kampagnen: bis zur Löschung durch den Nutzer</li>
            <li>Agent-Logs: 90 Tage rollierend</li>
            <li>Authentifizierungs-Logs: 30 Tage (Sicherheitszwecke)</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold">6. Ihre Rechte (DSGVO Art. 15–22)</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
            <li>
              <strong className="text-foreground">Auskunft</strong> — Welche Daten wir über Sie
              gespeichert haben
            </li>
            <li>
              <strong className="text-foreground">Berichtigung</strong> — Korrektur unrichtiger
              Daten
            </li>
            <li>
              <strong className="text-foreground">Löschung</strong> — Löschung Ihrer Daten
              (&quot;Recht auf Vergessenwerden&quot;)
            </li>
            <li>
              <strong className="text-foreground">Einschränkung</strong> — Einschränkung der
              Verarbeitung
            </li>
            <li>
              <strong className="text-foreground">Datenübertragbarkeit</strong> — Export Ihrer Daten
              im maschinenlesbaren Format
            </li>
            <li>
              <strong className="text-foreground">Widerspruch</strong> — Widerspruch gegen die
              Verarbeitung
            </li>
          </ul>
          <p className="mt-3 text-muted-foreground">
            Zur Ausübung Ihrer Rechte wenden Sie sich an:{' '}
            <a href="mailto:hallo@sarah-ai.at" className="text-accent hover:underline">
              hallo@sarah-ai.at
            </a>
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold">7. Beschwerderecht</h2>
          <p className="text-muted-foreground leading-relaxed">
            Sie haben das Recht, bei der österreichischen Datenschutzbehörde (DSB) Beschwerde
            einzulegen:{' '}
            <a
              href="https://www.dsb.gv.at"
              className="text-accent hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              dsb.gv.at
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
