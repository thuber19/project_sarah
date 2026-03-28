import Link from "next/link";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface PricingCardProps {
  name: string;
  price: string;
  priceSuffix?: string;
  description: string;
  features: readonly string[];
  ctaLabel: string;
  ctaHref: string;
  highlighted?: boolean;
  badge?: string;
}

export function PricingCard({
  name,
  price,
  priceSuffix,
  description,
  features,
  ctaLabel,
  ctaHref,
  highlighted = false,
  badge,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col rounded-xl bg-white p-8",
        highlighted
          ? "border-2 border-accent"
          : "border border-border"
      )}
    >
      {badge && (
        <span className="absolute -top-3 left-8 rounded-xl bg-accent px-3 py-1 text-xs font-medium text-white">
          {badge}
        </span>
      )}

      <h3 className="text-lg font-bold italic text-foreground">{name}</h3>

      <div className="mt-2">
        <span className="text-3xl font-extrabold text-foreground">
          {price}
        </span>
        {priceSuffix && (
          <span className="text-base text-muted-foreground">
            {priceSuffix}
          </span>
        )}
      </div>

      <p className="mt-1 text-sm text-muted-foreground">{description}</p>

      <div className="my-6 h-px bg-border" />

      <ul className="flex flex-1 flex-col gap-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
            <Check className="h-4 w-4 shrink-0 text-accent" />
            {feature}
          </li>
        ))}
      </ul>

      <Link
        href={ctaHref}
        className={cn(
          "mt-8 inline-flex h-9 w-full items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors",
          highlighted
            ? "bg-accent text-white hover:bg-accent/90"
            : "border border-border bg-white text-foreground hover:bg-secondary"
        )}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
