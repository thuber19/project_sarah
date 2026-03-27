<div align="center">

# 🤖 Project Sarah

**AI-gesteuerter B2B Sales Agent für den DACH-Markt**

Findet, qualifiziert und bewertet Leads autonom — mit transparentem Scoring und klaren Handlungsempfehlungen.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Claude](https://img.shields.io/badge/AI-Anthropic%20Claude-D4A574?logo=anthropic&logoColor=white)](https://anthropic.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

---

## Überblick

Project Sarah automatisiert den gesamten B2B Sales-Zyklus für KMUs, EPUs und Startups im DACH-Raum. Ein AI Agent übernimmt die zeitaufwändige Recherche, Qualifizierung und Priorisierung von Leads — damit du dich auf das Verkaufen konzentrieren kannst.

### So funktioniert's

1. **Website analysieren** — AI extrahiert dein Business-Profil aus deiner Website
2. **ICP definieren** — Ideal Customer Profile festlegen (vorausgefüllt durch AI)
3. **Leads finden** — Agent sucht autonom via Apollo.io + Google Places
4. **Qualifizieren & Scoren** — Hybrides Scoring (Regel-Engine + AI) mit transparenter Begründung
5. **Empfehlungen** — Klare Handlungsempfehlungen pro Lead (Sofort kontaktieren / Nurture / Skip)

## Tech Stack

| Komponente | Technologie |
| --- | --- |
| **Frontend** | Next.js 16 (App Router, RSC) |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **Auth** | Supabase Auth (Magic Link) |
| **Datenbank** | Supabase PostgreSQL + RLS |
| **AI** | Vercel AI SDK v6 + Anthropic Claude |
| **Hosting** | Vercel |
| **Lead-Daten** | Apollo.io API |
| **Lokale Leads** | Google Places API |
| **Web-Scraping** | Cheerio (serverseitig) |
| **Sprache** | TypeScript (strict mode) |
| **Package Manager** | pnpm |

## Getting Started

### Voraussetzungen

- [Node.js](https://nodejs.org/) 22+
- [pnpm](https://pnpm.io/) 10+
- [Supabase](https://supabase.com/) Account + Projekt
- API Keys: [Anthropic](https://console.anthropic.com/), [Apollo.io](https://www.apollo.io/), [Google Places](https://developers.google.com/maps/documentation/places/web-service)

### Installation

```bash
# Repo klonen
git clone https://github.com/thuber19/project_sarah.git
cd project_sarah

# Dependencies installieren
pnpm install

# Environment konfigurieren
cp .env.local.example .env.local
```

### Environment-Variablen

Trage folgende Keys in `.env.local` ein:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
ANTHROPIC_API_KEY=

# Lead Sources
APOLLO_API_KEY=
GOOGLE_PLACES_API_KEY=
```

### Starten

```bash
pnpm dev
```

Die App läuft dann unter [http://localhost:3000](http://localhost:3000).

## Projektstruktur

```
src/
├── app/                        # Next.js App Router
│   ├── (marketing)/            # Landing Page (public)
│   ├── (auth)/                 # Login + Auth Callback
│   └── (app)/                  # Geschützte Bereiche
│       ├── onboarding/         # 4-Schritt Onboarding
│       └── dashboard/          # Lead-Dashboard
├── lib/
│   ├── supabase/               # DB Client + Auth + Middleware
│   ├── apollo/                 # Apollo.io API Client
│   ├── google-places/          # Google Places Client
│   ├── ai/                     # AI-Logik (Website-Analyse, Scoring, Query-Optimierung)
│   ├── scoring/                # Deterministische Regel-Engine
│   └── pipeline/               # Lead Discovery Orchestrierung
├── components/
│   ├── ui/                     # shadcn/ui Components
│   ├── onboarding/             # Onboarding Steps
│   ├── dashboard/              # Dashboard Components
│   └── landing/                # Landing Page Components
└── types/                      # TypeScript Types
```

## Lead-Scoring-Modell

Hybrides Scoring (0–100) mit 4 Dimensionen:

| Dimension | Max Punkte | Faktoren |
| --- | ---: | --- |
| **Company Fit** | 40 | Firmengröße, Branche, Revenue, Geo (DACH), Business Model |
| **Contact Fit** | 20 | Seniority, Funktion, Buying Committee |
| **Buying Signals** | 25 | Funding, Hiring, Tech-Migration, News, Competitor Tools |
| **Timing** | 15 | Contact Activity, Company Updates, Budget-Saison |

### Score-Grades

| Score | Grade | Empfohlene Aktion |
| ---: | --- | --- |
| 90–100 | 🔥 **HOT** | Sofort kontaktieren (< 48h) |
| 75–89 | ✅ **QUALIFIED** | Sales-ready, hohe Priorität |
| 60–74 | 💬 **ENGAGED** | Nurture Track |
| 40–59 | 👀 **POTENTIAL** | Beobachten & Recherchieren |
| 0–39 | ❌ **POOR FIT** | Archivieren |

## Scripts

```bash
pnpm dev          # Development Server starten
pnpm build        # Production Build erstellen
pnpm start        # Production Server starten
pnpm lint         # ESLint ausführen
pnpm type-check   # TypeScript prüfen
```

## Team

Gebaut beim **Vienna Overnight AI Agent Hackathon** (BitGN, 27.–28. März 2026):

| Name | Rolle |
| --- | --- |
| Sarah K. | Product & Strategy |
| Sarah T. | AI & Backend |
| Tobias H. | Full Stack |
| Bernhard G. | Full Stack |

## Lizenz

Dieses Projekt steht unter der [MIT-Lizenz](LICENSE).
