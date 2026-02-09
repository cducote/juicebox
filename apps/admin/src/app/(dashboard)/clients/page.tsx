import { db } from "@juicebox/db";
import { Card, CardContent, CardHeader, CardTitle } from "@juicebox/ui/components/card";
import { formatCents } from "@/components/payment-progress";

export default async function ClientsPage() {
  let clients: Awaited<ReturnType<typeof fetchClients>> = [];

  try {
    clients = await fetchClients();
  } catch {
    // DB not connected
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Clients</h1>

      {clients.length === 0 ? (
        <p className="text-text-muted">
          No clients yet. Clients are synced from Clerk when they sign up.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => {
            const totalOwed = client.projects.reduce(
              (sum, p) => sum + (p.totalAmount - p.amountPaid),
              0,
            );
            const totalPaid = client.projects.reduce((sum, p) => sum + p.amountPaid, 0);

            return (
              <Card key={client.id}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {client.name || client.email}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-text-secondary">{client.email}</p>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Projects</span>
                    <span className="font-medium">{client.projects.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Total Paid</span>
                    <span className="font-medium text-emerald-600">
                      {formatCents(totalPaid)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Remaining</span>
                    <span className="font-medium">{formatCents(totalOwed)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

async function fetchClients() {
  return db.user.findMany({
    where: { role: "CUSTOMER" },
    include: {
      projects: {
        select: { totalAmount: true, amountPaid: true },
      },
    },
    orderBy: { name: "asc" },
  });
}
