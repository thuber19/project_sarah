import { cn } from "@/lib/utils";

type Grade = "HOT" | "QUALIFIED" | "ENGAGED" | "POTENTIAL" | "POOR_FIT";

const gradeStyles: Record<Grade, string> = {
  HOT: "bg-score-hot text-white",
  QUALIFIED: "bg-score-qualified text-white",
  ENGAGED: "bg-score-engaged text-white",
  POTENTIAL: "bg-score-potential text-white",
  POOR_FIT: "bg-score-poor-fit text-white",
};

interface ScoreBadgeProps {
  grade: Grade;
  className?: string;
}

export function ScoreBadge({ grade, className }: ScoreBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3.5 py-1 text-xs font-semibold",
        gradeStyles[grade],
        className,
      )}
    >
      {grade.replace("_", " ")}
    </span>
  );
}
