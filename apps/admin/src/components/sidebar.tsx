"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@juicebox/ui/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Receipt,
  Bell,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Clients", href: "/clients", icon: Users },
  { label: "Expenses", href: "/expenses", icon: Receipt },
  { label: "Notifications", href: "/notifications", icon: Bell },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-surface">
      <div className="flex h-14 items-center border-b border-border px-6">
        <Link href="/" className="text-lg font-bold text-juice-600">
          Juicebox Studios
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-juice-50 text-juice-700"
                  : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
