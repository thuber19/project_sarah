"use client";

import { useState } from "react";
import { Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function OnboardingStep1() {
  const [url, setUrl] = useState("");

  return (
    <div className="flex w-full max-w-[560px] flex-col items-center gap-7 rounded-xl border border-border bg-white p-12 pt-12 pb-10">
      {/* Icon */}
      <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-accent-light">
        <Globe className="text-accent" size={32} />
      </div>

      {/* Heading */}
      <h1 className="text-center text-xl font-bold text-foreground">
        Lass uns dein Unternehmen kennenlernen
      </h1>

      {/* Subtitle */}
      <p className="text-center text-sm text-muted-foreground">
        Gib deine Website-URL ein und Sarah analysiert automatisch dein
        Business-Profil, deine Branche und ideale Zielkunden.
      </p>

      {/* Form */}
      <div className="flex w-full flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">
          Website URL
        </label>
        <Input
          placeholder="https://dein-unternehmen.at"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>

      {/* Submit */}
      <Link
        href="/onboarding/step-2"
        className="inline-flex w-full items-center justify-center rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground"
      >
        Website analysieren
      </Link>

      {/* Hint */}
      <p className="text-xs text-muted-foreground">
        Die Analyse dauert ca. 30 Sekunden
      </p>
    </div>
  );
}
