import { db } from "@juicebox/db";
import { createProject } from "@/app/actions/projects";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@juicebox/ui/components/card";
import { Button } from "@juicebox/ui/components/button";
import { Input } from "@juicebox/ui/components/input";
import { Label } from "@juicebox/ui/components/label";

export default async function NewProjectPage() {
  let clients: Array<{ id: string; name: string | null; email: string }> = [];

  try {
    clients = await db.user.findMany({
      where: { role: "CUSTOMER" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });
  } catch {
    // DB not connected
  }

  async function handleCreate(formData: FormData) {
    "use server";
    const result = await createProject(formData);
    redirect(`/projects/${result.slug}`);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">New Project</h1>

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required placeholder="Client's awesome website" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-juice-500"
                placeholder="What are we building?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientId">Client</Label>
              <select
                id="clientId"
                name="clientId"
                className="flex h-9 w-full rounded-md border border-border bg-surface px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-juice-500"
              >
                <option value="">No client assigned</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dealType">Deal Type</Label>
              <select
                id="dealType"
                name="dealType"
                className="flex h-9 w-full rounded-md border border-border bg-surface px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-juice-500"
                defaultValue="INSTALLMENT"
              >
                <option value="INSTALLMENT">Installment Plan</option>
                <option value="EQUITY">Equity Deal</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalAmount">Total Amount (cents)</Label>
                <Input
                  id="totalAmount"
                  name="totalAmount"
                  type="number"
                  min="0"
                  placeholder="500000"
                />
                <p className="text-xs text-text-muted">e.g. 500000 = $5,000.00</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="termMonths">Term (months)</Label>
                <Input
                  id="termMonths"
                  name="termMonths"
                  type="number"
                  min="1"
                  max="120"
                  placeholder="12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gracePeriodMonths">Grace Period (months)</Label>
              <Input
                id="gracePeriodMonths"
                name="gracePeriodMonths"
                type="number"
                min="0"
                max="24"
                defaultValue="3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                name="notes"
                rows={2}
                className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-juice-500"
                placeholder="Internal notes..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="submit">Create Project</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
