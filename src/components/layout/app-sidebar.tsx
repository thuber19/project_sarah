"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  LayoutDashboard,
  Users,
  Compass,
  Target,
  Activity,
  Settings,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Leads", href: "/leads", icon: Users },
  { label: "Discovery", href: "/discovery", icon: Compass },
  { label: "Scoring", href: "/scoring", icon: Target },
  { label: "Agent Logs", href: "/agent-logs", icon: Activity },
  { label: "Settings", href: "/settings", icon: Settings },
] as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col justify-between bg-sidebar px-4 py-6">
      {/* Top section: Logo + Navigation */}
      <div>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-3 pb-8">
          <Bot className="size-6 text-accent" aria-hidden="true" />
          <span className="text-lg font-bold text-white">Sarah</span>
        </div>

        {/* Navigation */}
        <nav aria-label="Main navigation">
          <ul className="flex flex-col gap-1" role="list">
            {navItems.map(({ label, href, icon: Icon }) => {
              const isActive =
                pathname === href || pathname.startsWith(`${href}/`);

              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-foreground"
                        : "text-sidebar-muted hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon className="size-5 shrink-0" aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Bottom section: User info */}
      <div className="flex items-center gap-3 rounded-lg px-2 py-3">
        <div
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent"
          aria-hidden="true"
        >
          <span className="text-xs font-semibold text-white">BG</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-white">
            Bernhard G.
          </p>
          <p className="truncate text-[11px] text-sidebar-muted">Admin</p>
        </div>
      </div>
    </aside>
  );
}
