"use client";

import { usePathname } from "next/navigation";
import { Bot } from "lucide-react";

const TOTAL_STEPS = 4;

function parseStep(pathname: string): number {
  const match = pathname.match(/\/onboarding\/step-(\d+)/);
  if (match) {
    const step = parseInt(match[1], 10);
    return step >= 1 && step <= TOTAL_STEPS ? step : 1;
  }
  return 1;
}

export default function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const currentStep = parseStep(pathname);

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-muted pb-8 pt-10">
      {/* Header */}
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-accent" />
          <span className="text-lg font-bold text-foreground">Sarah</span>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Schritt {currentStep} von {TOTAL_STEPS}
          </span>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => {
              const step = i + 1;
              const isActiveOrCompleted = step <= currentStep;

              return (
                <div
                  key={step}
                  className={`h-2 w-2 rounded-full ${
                    isActiveOrCompleted ? "bg-accent" : "bg-border"
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center">
        {children}
      </div>

      {/* Footer */}
      <p className="text-[13px] text-muted-foreground">
        DSGVO-konform &middot; Deine Daten sind sicher
      </p>
    </div>
  );
}
