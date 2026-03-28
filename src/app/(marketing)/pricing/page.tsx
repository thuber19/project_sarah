import { Tag } from 'lucide-react'

import { PricingCard } from '@/components/marketing/pricing-card'

const plans = [
  {
    name: 'Starter',
    price: 'Kostenlos',
    description: 'Perfekt zum Ausprobieren',
    features: ['50 Leads/Monat', 'Website-Analyse', 'Basic Scoring', 'E-Mail Support'],
    ctaLabel: 'Kostenlos starten',
    ctaHref: '/login',
  },
  {
    name: 'Professional',
    price: '€49',
    priceSuffix: '/Monat',
    description: 'Für wachsende Vertriebsteams',
    features: [
      '500 Leads/Monat',
      'Erweiterte Website-Analyse',
      'KI-Scoring',
      'Lead-Discovery',
      'Priority Support',
      'API-Zugang',
    ],
    ctaLabel: 'Jetzt starten',
    ctaHref: '/login',
    highlighted: true,
    badge: 'Beliebteste',
  },
  {
    name: 'Enterprise',
    price: 'Auf Anfrage',
    description: 'Für große Teams mit individuellen Anforderungen',
    features: [
      'Unbegrenzte Leads',
      'Custom KI-Modelle',
      'Dedizierter Account Manager',
      'SSO & SAML',
      'Custom Integrationen',
      'SLA Garantie',
    ],
    ctaLabel: 'Kontakt aufnehmen',
    ctaHref: '/login',
  },
] as const

export default function PricingPage() {
  return (
    <>
      {/* Headline Section */}
      <section className="flex w-full flex-col items-center bg-white px-20 py-16 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-light px-3 py-1 text-xs font-medium text-accent">
          <Tag className="h-3.5 w-3.5" />
          Preise & Pakete
        </span>

        <h1 className="mt-4 text-4xl font-extrabold text-foreground">Wähle den passenden Plan</h1>

        <p className="mt-2 text-lg text-muted-foreground">
          Starte kostenlos und upgrade jederzeit. Keine versteckten Kosten.
        </p>
      </section>

      {/* Pricing Grid */}
      <section className="w-full bg-white px-20 py-12">
        <div className="grid grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PricingCard key={plan.name} {...plan} />
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="h-px w-full bg-border" />
    </>
  )
}
