import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  changeBgColor?: string;
}

const defaultChangeBg: Record<string, { bg: string; text: string }> = {
  positive: { bg: "#DCFCE7", text: "text-green-700" },
  negative: { bg: "#FEE2E2", text: "text-red-700" },
  neutral: { bg: "#DBEAFE", text: "text-blue-700" },
};

export function StatCard({
  label,
  value,
  change,
  changeType = "neutral",
  changeBgColor,
}: StatCardProps) {
  const colors = defaultChangeBg[changeType];

  return (
    <div className="flex flex-col gap-3 rounded-[--radius-card] border border-border bg-card p-5">
      <span className="text-[13px] font-medium text-muted-foreground">
        {label}
      </span>
      <div className="flex items-end justify-between">
        <span className="text-[28px] font-bold text-foreground">{value}</span>
        {change && (
          <span
            className={cn(
              "rounded-xl px-2 py-0.5 text-xs font-medium",
              colors.text,
            )}
            style={{ backgroundColor: changeBgColor ?? colors.bg }}
          >
            {change}
          </span>
        )}
      </div>
    </div>
  );
}
