import { db } from "@juicebox/db";
import { createExpense } from "@/app/actions/expenses";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@juicebox/ui/components/card";
import { Button } from "@juicebox/ui/components/button";
import { Input } from "@juicebox/ui/components/input";
import { Label } from "@juicebox/ui/components/label";

export default async function NewExpensePage() {
  let projects: Array<{ id: string; title: string }> = [];

  try {
    projects = await db.project.findMany({
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    });
  } catch {
    // DB not connected
  }

  async function handleCreate(formData: FormData) {
    "use server";
    await createExpense(formData);
    redirect("/expenses");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Add Expense</h1>

      <Card>
        <CardHeader>
          <CardTitle>Expense Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required placeholder="Figma subscription" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (cents)</Label>
                <Input id="amount" name="amount" type="number" min="1" required placeholder="1500" />
                <p className="text-xs text-text-muted">e.g. 1500 = $15.00</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="datetime-local"
                  required
                  defaultValue={new Date().toISOString().slice(0, 16)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                name="category"
                className="flex h-9 w-full rounded-md border border-border bg-surface px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-juice-500"
              >
                <option value="">Select category</option>
                <option value="Software">Software</option>
                <option value="Domain">Domain</option>
                <option value="Hosting">Hosting</option>
                <option value="Marketing">Marketing</option>
                <option value="Hardware">Hardware</option>
                <option value="Design">Design</option>
                <option value="Legal">Legal</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectId">Project (optional)</Label>
              <select
                id="projectId"
                name="projectId"
                className="flex h-9 w-full rounded-md border border-border bg-surface px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-juice-500"
              >
                <option value="">General business expense</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                rows={2}
                className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm shadow-sm placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-juice-500"
                placeholder="Optional details..."
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isRecurring" value="true" className="rounded" />
                Recurring expense
              </label>

              <select
                name="recurringInterval"
                className="flex h-8 rounded-md border border-border bg-surface px-2 text-sm"
              >
                <option value="">Interval</option>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly</option>
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="submit">Add Expense</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
