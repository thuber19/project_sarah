import { Bell } from "lucide-react";

interface AppTopbarProps {
  title: string;
  actions?: React.ReactNode;
}

export function AppTopbar({ title, actions }: AppTopbarProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-white px-4 md:h-16 md:px-8">
      <h1 className="text-base font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-4">
        {actions}

        <button
          type="button"
          className="flex size-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Benachrichtigungen"
        >
          <Bell className="size-5" />
        </button>
      </div>
    </header>
  );
}
