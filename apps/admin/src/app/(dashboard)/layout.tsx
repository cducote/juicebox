import { UserButton } from "@clerk/nextjs";
import { Sidebar } from "@/components/sidebar";
import { NotificationBell } from "@/components/notification-bell";

// Force dynamic rendering — this layout requires auth
export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-end gap-3 border-b border-border px-6">
          <NotificationBell />
          <UserButton />
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
