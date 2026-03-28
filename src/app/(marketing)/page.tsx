import Link from 'next/link'
import { BarChart3, Globe, Search, Sparkles } from 'lucide-react'

const featureCards = [
  {
    icon: Globe,
    title: '1. Website analysieren',
    description:
      'Sarah analysiert eure Website mit KI und erstellt automatisch euer Business-Profil, eine Zielgruppe und eure USPs — vollautomatisch.',
  },
  {
    icon: Search,
    title: '2. Leads entdecken',
    description:
      'Automatische Lead-Discovery über Apollo und Google Maps — zugeschnitten für den DACH-Markt. Zielgenau.',
  },
  {
    icon: BarChart3,
    title: '3. Leads bewerten',
    description:
      'KI-basiertes Scoring von 0-100 bewertet jeden Lead nach Relevanz, Potenzial und Kaufbereitschaft.',
  },
] as const

const companyLogos = ['FINTEK', 'DATAWERK', 'ALPENTEC', 'NEROVA', 'CLOUDWERK', 'NEXTFLOW'] as const

const chartBarHeights = [
  'h-[60%]',
  'h-[75%]',
  'h-[45%]',
  'h-[90%]',
  'h-[65%]',
  'h-[80%]',
  'h-[50%]',
  'h-[95%]',
] as const

export default function MarketingPage() {
  return (
    <>
      <section className="w-full bg-white px-4 py-10 lg:px-20 lg:py-16">
        <div className="flex flex-col items-center gap-8 text-center lg:flex-row lg:items-center lg:gap-12 lg:text-left">
          <div className="flex flex-1 flex-col items-center gap-5 lg:items-start">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-accent-light px-3.5 py-1.5 text-xs font-semibold text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              KI-gestützter Vertrieb
            </span>

            <h1 className="text-3xl font-extrabold leading-[1.1] text-foreground sm:text-4xl lg:text-5xl">
              Dein AI Sales Agent
              <br />
              für den DACH-Markt
            </h1>

            <p className="text-base leading-relaxed text-muted-foreground lg:text-lg">
              Sarah findet automatisch die besten Leads für dein Unternehmen. KI-gestützte
              Website-Analyse, Lead-Discovery und intelligentes Scoring — alles in einem Tool.
            </p>

            <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
              <Link
                href="/login"
                className="rounded-lg bg-primary px-7 py-3.5 text-center text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                Jetzt starten — kostenlos
              </Link>
              <button
                type="button"
                className="rounded-lg border border-border px-7 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Demo ansehen
              </button>
            </div>
          </div>

          <div className="hidden flex-1 lg:block">
            <div className="overflow-hidden rounded-xl border bg-secondary">
              <div className="flex h-9 items-center gap-1.5 rounded-t-xl bg-primary px-3">
                <span className="h-2 w-2 rounded-full bg-destructive" />
                <span className="h-2 w-2 rounded-full bg-warning" />
                <span className="h-2 w-2 rounded-full bg-success" />
              </div>

              <div className="flex flex-col gap-3 p-4">
                <div className="flex gap-2">
                  <div className="flex-1 rounded-lg border bg-white p-3">
                    <p className="text-[10px] text-muted-foreground">Neue Leads</p>
                    <p className="text-lg font-bold text-foreground">1,247</p>
                  </div>
                  <div className="flex-1 rounded-lg border bg-white p-3">
                    <p className="text-[10px] text-muted-foreground">Score &Oslash;</p>
                    <p className="text-lg font-bold text-foreground">84.2</p>
                  </div>
                  <div className="flex-1 rounded-lg border bg-white p-3">
                    <p className="text-[10px] text-muted-foreground">Wachstum</p>
                    <p className="text-lg font-bold text-success">+34%</p>
                  </div>
                </div>

                <div className="flex h-[200px] items-end gap-1.5 rounded-lg border bg-white p-3">
                  {chartBarHeights.map((height, index) => (
                    <div
                      key={index}
                      className={`w-full rounded-t-sm ${height} ${
                        index % 2 === 0 ? 'bg-accent' : 'bg-accent/60'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-muted px-4 py-10 lg:p-20">
        <div className="mb-8 flex flex-col items-center gap-4 text-center lg:mb-12">
          <h2 className="text-2xl font-bold text-foreground lg:text-3xl">So funktioniert Sarah</h2>
          <p className="text-base text-muted-foreground">
            In drei einfachen Schritten zu qualifizierten Leads
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {featureCards.map((card) => (
            <div key={card.title} className="flex flex-col gap-4 rounded-xl border bg-white p-6 lg:p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-light">
                <card.icon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-base font-semibold text-foreground">{card.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{card.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex w-full flex-col items-center gap-6 bg-white px-4 py-10 text-center lg:px-20 lg:py-12">
        <p className="text-base font-medium text-muted-foreground">
          Vertraut von 200+ Unternehmen im DACH-Raum
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-12">
          {companyLogos.map((name) => (
            <span
              key={name}
              className="text-sm font-bold uppercase tracking-wider text-muted-foreground/40 lg:text-lg"
            >
              {name}
            </span>
          ))}
        </div>
      </section>
    </>
  )
}
