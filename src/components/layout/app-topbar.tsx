import { Bell } from "lucide-react";
import { GlobalSearch } from "@/components/layout/global-search";

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
        {/* Global search */}
        <GlobalSearch />

        {/* Notification bell */}
        <button
          type="button"
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Benachrichtigungen"
        >
          <Bell className="size-5" />
        </button>

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
