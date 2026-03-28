interface ScoreBreakdownProps {
  companyFit: number
  contactFit: number
  buyingSignals: number
  timing: number
  companyScore?: number | null
  personScore?: number | null
  companyQualified?: boolean
}

function ProgressBar({
  label,
  value,
  max,
  color,
}: {
  label: string
  value: number
  max: number
  color: string
}) {
  const widthPercent = (value / max) * 100

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm text-muted-foreground">
          {value}/{max}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className="h-2.5 rounded-full bg-secondary"
      >
        <div
          className={`h-2.5 rounded-full ${color}`}
          style={{ width: `${widthPercent}%` }}
        />
        <span className="sr-only">
          {label}: {value} von {max}
        </span>
      </div>
    </div>
  )
}

export function ScoreBreakdown(props: ScoreBreakdownProps) {
  const showTwoPhase =
    props.companyScore !== undefined && props.companyScore !== null

  if (showTwoPhase) {
    return (
      <div className="flex flex-col gap-6">
        {/* Phase 1: Company Score */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Company Score</h3>
            <span className="text-lg font-bold text-foreground">{props.companyScore}/100</span>
          </div>
          <div className="flex flex-col gap-3">
            <ProgressBar label="Branche" value={Math.round(props.companyFit * 0.55)} max={25} color="bg-accent" />
            <ProgressBar label="Firmengröße" value={Math.round(props.companyFit * 0.45)} max={20} color="bg-accent" />
            <ProgressBar label="Region & Signale" value={props.buyingSignals} max={20} color="bg-warning" />
            <ProgressBar label="Timing" value={props.timing} max={15} color="bg-score-qualified" />
          </div>
        </div>

        {/* Qualification Gate */}
        {!props.companyQualified && (
          <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/50 p-3 text-center">
            <p className="text-xs font-medium text-muted-foreground">
              Company Score unter 50% — Personen-Scoring übersprungen
            </p>
          </div>
        )}

        {/* Phase 2: Person Score */}
        {props.companyQualified && props.personScore !== null && props.personScore !== undefined && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Person Score</h3>
              <span className="text-lg font-bold text-foreground">{props.personScore}/100</span>
            </div>
            <div className="flex flex-col gap-3">
              <ProgressBar
                label="Entscheidungsträger"
                value={Math.round(props.contactFit * 1.5)}
                max={30}
                color="bg-success"
              />
              <ProgressBar label="Budgetverantwortung" value={Math.round(props.contactFit * 1.25)} max={25} color="bg-success" />
              <ProgressBar label="Champion-Potenzial" value={Math.round(props.contactFit)} max={25} color="bg-info" />
              <ProgressBar label="Titel-Match" value={Math.round(props.contactFit * 0.8)} max={20} color="bg-info" />
            </div>
          </div>
        )}
      </div>
    )
  }

  // Legacy fallback: 4-category view
  const categories = [
    { label: 'Company Fit', value: props.companyFit, max: 40, color: 'bg-accent' },
    { label: 'Contact Fit', value: props.contactFit, max: 20, color: 'bg-success' },
    { label: 'Buying Signals', value: props.buyingSignals, max: 25, color: 'bg-warning' },
    { label: 'Timing', value: props.timing, max: 15, color: 'bg-score-qualified' },
  ]

  return (
    <div className="flex flex-col gap-4">
      {categories.map((cat) => (
        <ProgressBar
          key={cat.label}
          label={cat.label}
          value={cat.value}
          max={cat.max}
          color={cat.color}
        />
      ))}
    </div>
  )
}
