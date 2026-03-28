import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Impressum — Sarah AI',
}

export default function ImpressumPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      {/* Beta disclaimer */}
      <div className="mb-8 rounded-lg border border-warning/30 bg-status-warning-bg px-4 py-3 text-sm text-status-warning-text">
        <strong>Beta-Hinweis:</strong> Sarah AI befindet sich in der Beta-Phase. Dieses Impressum
        gilt für den Demo-Betrieb im Rahmen des Vienna Overnight AI Hackathons.
      </div>

      <h1 className="mb-8 text-3xl font-bold text-foreground">Impressum</h1>

      <div className="space-y-8 text-sm text-foreground">
        <section>
          <h2 className="mb-3 text-base font-semibold">Angaben gemäß § 5 ECG</h2>
          <p className="text-muted-foreground leading-relaxed">
            Sarah AI
            <br />
            c/o Vienna Overnight AI Hackathon
            <br />
            1010 Wien, Österreich
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold">Kontakt</h2>
          <p className="text-muted-foreground leading-relaxed">
            E-Mail:{' '}
            <a href="mailto:hallo@sarah-ai.at" className="text-accent hover:underline">
              hallo@sarah-ai.at
            </a>
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold">Projektverantwortliche</h2>
          <p className="text-muted-foreground leading-relaxed">
            Sarah K. (Product) · Sarah T. (AI/Backend)
            <br />
            Tobias H. (Full Stack) · Bernhard G. (Full Stack)
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold">Haftungsausschluss</h2>
          <p className="text-muted-foreground leading-relaxed">
            Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte
            externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber
            verantwortlich. Alle Angaben auf dieser Website erfolgen ohne Gewähr.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-semibold">Urheberrecht</h2>
          <p className="text-muted-foreground leading-relaxed">
            Die durch die Betreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem
            österreichischen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede
            Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen
            Zustimmung des jeweiligen Autors.
          </p>
        </section>
      </div>
    </div>
  )
}
