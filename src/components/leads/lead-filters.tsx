"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const FILTERS = ["Alle", "HOT", "QUALIFIED", "ENGAGED"] as const;

export function LeadFilters() {
  const [active, setActive] = useState<string>("Alle");

  return (
    <div className="flex gap-2">
      {FILTERS.map((filter) => (
        <button
          key={filter}
          type="button"
          onClick={() => setActive(filter)}
          className={cn(
            "cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
            active === filter
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          )}
        >
          {filter}
        </button>
      ))}
    </div>
  );
}
