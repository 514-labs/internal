import { DashboardLayout } from "@/components/layouts";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link2 } from "lucide-react";
import Link from "next/link";
import { getAllGoals } from "@/lib/goals";
import { GoalsSummary, GoalsCompactList } from "@/components/goals";

interface EmptyMetricCardProps {
  label: string;
  source: string;
}

function EmptyMetricCard({ label, source }: EmptyMetricCardProps) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium">{label}</h3>
          <Skeleton className="h-8 w-24 my-2" />
          <p className="text-xs text-muted-foreground">
            Missing source ({source})
          </p>
        </div>
        <Button variant="ghost" size="sm" asChild className="shrink-0 -mt-1 -mr-2">
          <Link href="/admin/integrations">
            <span className="sr-only">Connect {source}</span>
            <Link2 className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

interface EmptyStatCardProps {
  label: string;
  source: string;
}

function EmptyStatCard({ label, source }: EmptyStatCardProps) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <Skeleton className="h-4 w-8" />
      </div>
      <Skeleton className="w-full h-2 rounded-full" />
      <div className="flex items-center justify-between mt-1">
        <p className="text-xs text-muted-foreground">
          Missing source ({source})
        </p>
        <Button variant="link" size="sm" asChild className="h-auto p-0 text-xs">
          <Link href="/admin/integrations">
            Connect
          </Link>
        </Button>
      </div>
    </div>
  );
}

function EmptyActivityCard() {
  return (
    <div className="col-span-4 rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <Button variant="ghost" size="sm" asChild className="-mr-2">
          <Link href="/admin/integrations">
            <span className="sr-only">Connect Activity Feed</span>
            <Link2 className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="w-2 h-2 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-4">
        Missing source (Activity Feed)
      </p>
    </div>
  );
}

export default async function DashboardPage() {
  // Fetch goals for the dashboard widget
  const goals = await getAllGoals({ status: "active" });

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your organization&apos;s key metrics</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <EmptyMetricCard label="Total Revenue" source="QuickBooks" />
        <EmptyMetricCard label="Active Users" source="PostHog" />
        <EmptyMetricCard label="Active Teams" source="Rippling" />
        <EmptyMetricCard label="Project Completion" source="Linear" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
        <EmptyActivityCard />
        <div className="col-span-3 space-y-4">
          {/* Goals Summary Widget */}
          <GoalsSummary goals={goals} title="Goals Progress" />
          
          {/* Active Goals List */}
          {goals.length > 0 && (
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Active Goals</h3>
              <GoalsCompactList goals={goals} limit={4} />
            </div>
          )}
          
          {goals.length === 0 && (
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <EmptyStatCard label="Team Capacity" source="Rippling" />
                <EmptyStatCard label="Customer Satisfaction" source="Intercom" />
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
