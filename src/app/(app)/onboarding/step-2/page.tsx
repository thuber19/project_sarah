"use client";

import { CheckCircle } from "lucide-react";
import Link from "next/link";

const MOCK_PROFILE = {
  name: "TechVentures GmbH",
  industries: ["SaaS / Cloud Services"],
  size: "25-50 Mitarbeiter",
  location: "Wien, Österreich",
  technologies: ["React", "Node.js", "TypeScript"],
  description:
    "B2B SaaS-Plattform für Daten-Analyse und Business Intelligence mit Fokus auf mittelständische Unternehmen.",
  confidence: 84,
};

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-accent-light px-2 py-0.5 text-xs font-medium text-accent">
      {children}
    </span>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="w-[140px] shrink-0 text-sm font-medium text-foreground">
        {label}
      </span>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}

export default function OnboardingStep2() {
  return (
    <div className="flex w-full max-w-[700px] flex-col gap-6 rounded-xl border border-border bg-white p-8">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <CheckCircle className="text-success" size={24} />
        <h1 className="text-xl font-bold text-foreground">
          Dein Business-Profil
        </h1>
      </div>

      {/* Subtitle */}
      <p className="text-sm text-muted-foreground">
        Sarah hat deine Website analysiert. Überprüfe die Ergebnisse.
      </p>

      {/* Analysis grid */}
      <div className="flex flex-col gap-4">
        <FieldRow label="Unternehmensname">{MOCK_PROFILE.name}</FieldRow>

        <FieldRow label="Branche">
          <div className="flex flex-wrap gap-1.5">
            {MOCK_PROFILE.industries.map((industry) => (
              <Tag key={industry}>{industry}</Tag>
            ))}
          </div>
        </FieldRow>

        <FieldRow label="Größe">{MOCK_PROFILE.size}</FieldRow>

        <FieldRow label="Standort">{MOCK_PROFILE.location}</FieldRow>

        <FieldRow label="Technologien">
          <div className="flex flex-wrap gap-1.5">
            {MOCK_PROFILE.technologies.map((tech) => (
              <Tag key={tech}>{tech}</Tag>
            ))}
          </div>
        </FieldRow>

        <FieldRow label="Beschreibung">{MOCK_PROFILE.description}</FieldRow>
      </div>

      {/* Confidence */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">
          AI Confidence {MOCK_PROFILE.confidence}%
        </span>
        <div className="h-2 w-full rounded-full bg-secondary">
          <div
            className="h-2 rounded-full bg-success"
            style={{ width: `${MOCK_PROFILE.confidence}%` }}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-secondary" />

      {/* Button row */}
      <div className="flex justify-end gap-3">
        <Link
          href="/onboarding/step-1"
          className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-foreground"
        >
          Zurück
        </Link>
        <Link
          href="/onboarding/step-3"
          className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
        >
          Bestätigen &amp; Weiter
        </Link>
      </div>
    </div>
  );
}
