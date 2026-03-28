import { Search } from "lucide-react";
import { NotificationBell } from "@/components/layout/notification-dropdown";

interface AppTopbarProps {
  title: string;
}

export function AppTopbar({ title }: AppTopbarProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-white px-8">
      {/* Left: Page title */}
      <h1 className="text-base font-semibold text-foreground">{title}</h1>

      {/* Right: Search, notifications, avatar */}
      <div className="flex items-center gap-4">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Suchen..."
            className="h-9 w-64 rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Notification bell with dropdown */}
        <NotificationBell />

        {/* User avatar */}
        <div
          className="flex size-8 items-center justify-center rounded-full bg-accent text-xs font-medium text-white"
          aria-label="Benutzerprofil"
        >
          BG
        </div>
      </div>
    </header>
  );
}
