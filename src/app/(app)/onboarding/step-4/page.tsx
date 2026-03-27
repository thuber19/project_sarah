"use client";

import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function OnboardingStep4() {
  return (
    <div className="flex w-full max-w-[560px] flex-col items-center gap-7 rounded-xl border border-border bg-white p-12 pt-12 pb-10">
      {/* Success icon */}
      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-green-50">
        <CheckCircle className="text-success" size={36} />
      </div>

      {/* Heading */}
      <h1 className="text-center text-xl font-bold text-foreground">
        Alles bereit!
      </h1>

      {/* Subtitle */}
      <p className="text-center text-sm text-muted-foreground">
        Dein Account ist eingerichtet und Sarah ist bereit, Leads für dich zu
        finden.
      </p>

      {/* Summary box */}
      <div className="flex w-full flex-col gap-1.5 rounded-lg bg-muted p-4">
        <span className="text-sm text-foreground">
          Unternehmen: TechVentures GmbH
        </span>
        <span className="text-sm text-muted-foreground">
          ICP: SaaS, FinTech &middot; 10-250 MA &middot; DACH
        </span>
        <span className="text-sm text-muted-foreground">Min. Score: 60</span>
      </div>

      {/* CTA buttons */}
      <Link
        href="/dashboard"
        className="inline-flex w-full items-center justify-center rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
      >
        Zum Dashboard
      </Link>

      <Link
        href="/discovery"
        className="w-full rounded-lg border border-border py-2.5 text-center text-sm font-medium text-foreground"
      >
        Erste Discovery starten
      </Link>
    </div>
  );
}
