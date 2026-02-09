import Link from "next/link";
import { db } from "@juicebox/db";
import { Button } from "@juicebox/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@juicebox/ui/components/card";
import { formatCents } from "@/components/payment-progress";
import { getExpenseSummary } from "@/app/actions/expenses";
import { Plus } from "lucide-react";

export default async function ExpensesPage() {
  let summary = { monthlyBurn: 0, totalThisMonth: 0, oneTimeThisMonth: 0 };
  let expenses: Awaited<ReturnType<typeof fetchExpenses>> = [];

  try {
    [summary, expenses] = await Promise.all([getExpenseSummary(), fetchExpenses()]);
  } catch {
    // DB not connected
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Expenses</h1>
        <Link href="/expenses/new">
          <Button>
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">Monthly Burn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCents(summary.monthlyBurn)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">
              Total This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCents(summary.totalThisMonth)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-secondary">
              One-Time This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCents(summary.oneTimeThisMonth)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Expense List */}
      {expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-12">
          <p className="text-text-secondary">No expenses tracked yet</p>
          <Link href="/expenses/new" className="mt-2">
            <Button variant="outline" size="sm">
              Add your first expense
            </Button>
          </Link>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-sm text-text-muted">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-border text-sm">
                    <td className="px-4 py-3">{expense.name}</td>
                    <td className="px-4 py-3 font-medium">{formatCents(expense.amount)}</td>
                    <td className="px-4 py-3 text-text-secondary">{expense.category ?? "—"}</td>
                    <td className="px-4 py-3 text-text-secondary">
                      {expense.project?.title ?? "General"}
                    </td>
                    <td className="px-4 py-3">
                      {expense.isRecurring ? (
                        <span className="text-xs font-medium text-blue-600">
                          {expense.recurringInterval}
                        </span>
                      ) : (
                        <span className="text-xs text-text-muted">One-time</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {expense.date.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

async function fetchExpenses() {
  return db.expense.findMany({
    include: { project: { select: { title: true, slug: true } } },
    orderBy: { date: "desc" },
  });
}
