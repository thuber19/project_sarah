"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

function TagPill({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-accent-light px-2 py-1 text-xs font-medium text-accent">
      {children}
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 inline-flex items-center justify-center rounded-sm hover:text-accent/70"
        aria-label={`${children} entfernen`}
      >
        <X size={12} />
      </button>
    </span>
  );
}

export default function OnboardingStep3() {
  const [industries, setIndustries] = useState(["SaaS", "FinTech", "E-Commerce"]);
  const [techStack, setTechStack] = useState(["React", "Node.js", "AWS"]);
  const [scoreThreshold, setScoreThreshold] = useState(60);

  const removeIndustry = (name: string) => {
    setIndustries((prev) => prev.filter((i) => i !== name));
  };

  const removeTech = (name: string) => {
    setTechStack((prev) => prev.filter((t) => t !== name));
  };

  return (
    <div className="flex w-full max-w-[700px] flex-col gap-7 rounded-xl border border-border bg-white p-9">
      {/* Heading */}
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-foreground">
          Definiere dein ideales Kundenprofil
        </h1>
        <p className="text-sm text-muted-foreground">
          Basierend auf der Analyse empfehlen wir folgende Kriterien. Passe sie
          an.
        </p>
      </div>

      {/* Form fields */}
      <div className="flex flex-col gap-5">
        {/* Zielbranchen */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Zielbranchen
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {industries.map((industry) => (
              <TagPill key={industry} onRemove={() => removeIndustry(industry)}>
                {industry}
              </TagPill>
            ))}
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              + hinzufügen
            </button>
          </div>
        </div>

        {/* Unternehmensgröße */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Unternehmensgröße
          </label>
          <Select defaultValue="10-100">
            <SelectTrigger className="w-full">
              <SelectValue placeholder="10-100 Mitarbeiter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1-10">1-10 Mitarbeiter</SelectItem>
              <SelectItem value="10-100">10-100 Mitarbeiter</SelectItem>
              <SelectItem value="100-250">100-250 Mitarbeiter</SelectItem>
              <SelectItem value="250-1000">250-1000 Mitarbeiter</SelectItem>
              <SelectItem value="1000+">1000+ Mitarbeiter</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Region */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">Region</label>
          <div className="flex flex-col gap-2.5">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox defaultChecked />
              Österreich
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox defaultChecked />
              Deutschland
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox />
              Schweiz
            </label>
          </div>
        </div>

        {/* Technologie-Stack */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">
            Technologie-Stack
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {techStack.map((tech) => (
              <TagPill key={tech} onRemove={() => removeTech(tech)}>
                {tech}
              </TagPill>
            ))}
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              + hinzufügen
            </button>
          </div>
        </div>

        {/* Min. Score Threshold */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              Min. Score Threshold
            </label>
            <span className="text-sm font-medium text-foreground">
              {scoreThreshold}
            </span>
          </div>
          <Slider
            min={0}
            max={100}
            defaultValue={[60]}
            onValueChange={(value) => {
              const val = Array.isArray(value) ? value[0] : value;
              setScoreThreshold(val);
            }}
          />
        </div>
      </div>

      {/* Button row */}
      <div className="flex justify-end gap-3">
        <Link
          href="/onboarding/step-2"
          className="rounded-lg border border-border px-5 py-2 text-sm font-medium text-foreground"
        >
          Zurück
        </Link>
        <Link
          href="/onboarding/step-4"
          className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
        >
          Weiter
        </Link>
      </div>
    </div>
  );
}
