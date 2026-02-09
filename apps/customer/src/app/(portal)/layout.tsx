import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { NotificationBell } from "@/components/notification-bell";

// Force dynamic rendering — this layout requires auth
export const dynamic = "force-dynamic";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface-secondary">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold text-juice-600">
            Juicebox Studios
          </Link>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <UserButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
