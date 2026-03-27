type Grade = "HOT" | "QUALIFIED" | "ENGAGED" | "POTENTIAL" | "POOR_FIT";

interface GradeData {
  grade: Grade;
  label: string;
  count: number;
  percent: number;
  textColor: string;
  barColor: string;
}

const mockData: GradeData[] = [
  {
    grade: "HOT",
    label: "HOT",
    count: 12,
    percent: 9,
    textColor: "text-score-hot",
    barColor: "bg-score-hot",
  },
  {
    grade: "QUALIFIED",
    label: "QUALIFIED",
    count: 31,
    percent: 24,
    textColor: "text-score-qualified",
    barColor: "bg-score-qualified",
  },
  {
    grade: "ENGAGED",
    label: "ENGAGED",
    count: 28,
    percent: 22,
    textColor: "text-score-engaged",
    barColor: "bg-score-engaged",
  },
  {
    grade: "POTENTIAL",
    label: "POTENTIAL",
    count: 38,
    percent: 30,
    textColor: "text-score-potential",
    barColor: "bg-score-potential",
  },
  {
    grade: "POOR_FIT",
    label: "POOR FIT",
    count: 18,
    percent: 14,
    textColor: "text-score-poor-fit",
    barColor: "bg-score-poor-fit",
  },
];

export function ScoreDistribution() {
  return (
    <div className="flex w-[340px] flex-col rounded-[--radius-card] border border-border bg-white">
      {/* Header */}
      <div className="border-b border-border px-5 py-4">
        <span className="text-[15px] font-semibold text-foreground">
          Lead Score Verteilung
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col justify-center gap-3 px-5 py-5">
        {mockData.map((item) => (
          <div key={item.grade} className="flex items-center gap-2.5">
            {/* Grade label */}
            <span
              className={`w-[80px] shrink-0 text-xs font-semibold ${item.textColor}`}
            >
              {item.label}
            </span>

            {/* Bar container */}
            <div className="h-3 flex-1 rounded-full bg-secondary">
              <div
                className={`h-full rounded-full ${item.barColor}`}
                style={{ width: `${item.percent}%` }}
              />
            </div>

            {/* Count */}
            <span className="w-16 text-right text-xs text-muted-foreground">
              {item.count} Leads
            </span>

            {/* Percent */}
            <span className="w-8 text-right text-xs text-muted-foreground">
              {item.percent}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
