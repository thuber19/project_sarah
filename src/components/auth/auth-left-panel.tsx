export function AuthLeftPanel() {
  return (
    <div className="hidden w-1/2 bg-primary lg:flex">
      <div className="flex w-full flex-col justify-center gap-10 bg-[radial-gradient(ellipse_at_20%_80%,rgba(59,130,246,0.15),transparent_70%)] px-16 py-20">
        {/* Blue accent bar */}
        <div className="w-12 h-1 rounded-full bg-accent" />

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-primary-foreground">Sarah</h1>
          <p className="text-lg text-sidebar-muted">Dein AI Sales Agent f&uuml;r den DACH-Markt</p>
        </div>

        {/* Benefit items */}
        <div className="mt-8 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-success" />
            <span className="text-[15px] text-sidebar-muted">Automatische Lead-Discovery</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-success" />
            <span className="text-[15px] text-sidebar-muted">KI-gest&uuml;tztes Scoring</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-success" />
            <span className="text-[15px] text-sidebar-muted">DSGVO-konform</span>
          </div>
        </div>
      </div>
    </div>
  )
}
