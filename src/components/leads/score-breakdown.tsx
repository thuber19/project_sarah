interface ScoreBreakdownProps {
  companyFit: number;
  technologyMatch: number;
  growthSignal: number;
  marketRelevance: number;
}

const categories = [
  { key: "companyFit", label: "Company Fit", max: 40, color: "bg-accent" },
  {
    key: "technologyMatch",
    label: "Technology Match",
    max: 25,
    color: "bg-success",
  },
  {
    key: "growthSignal",
    label: "Growth Signal",
    max: 25,
    color: "bg-warning",
  },
  {
    key: "marketRelevance",
    label: "Market Relevance",
    max: 10,
    color: "bg-score-qualified",
  },
] as const;

export function ScoreBreakdown(props: ScoreBreakdownProps) {
  return (
    <div className="flex flex-col gap-4">
      {categories.map((cat) => {
        const value = props[cat.key as keyof ScoreBreakdownProps];
        const widthPercent = (value / cat.max) * 100;

        return (
          <div key={cat.key} className="flex flex-col gap-1.5">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-foreground">
                {cat.label}
              </span>
              <span className="text-sm text-muted-foreground">
                {value}/{cat.max}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-secondary">
              <div
                className={`h-2.5 rounded-full ${cat.color}`}
                style={{ width: `${widthPercent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
