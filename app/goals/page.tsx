import { Suspense } from "react";
import { getAllGoals } from "@/lib/goals";
import { GoalsPageContent } from "./_components/goals-page-content";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Goals",
  description: "Track progress toward organizational objectives",
};

export default async function GoalsPage() {
  const goals = await getAllGoals();

  // Extract unique timeframes for filter dropdown
  const timeframes = [...new Set(goals.map((g) => g.frontmatter.timeframe))].sort();

  return (
    <Suspense fallback={<GoalsLoadingSkeleton />}>
      <GoalsPageContent goals={goals} timeframes={timeframes} />
    </Suspense>
  );
}

function GoalsLoadingSkeleton() {
  return (
    <div className="flex flex-1">
      {/* Sidebar skeleton */}
      <aside className="w-64 shrink-0 p-4 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 flex-1" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </aside>

      {/* Main content skeleton */}
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>

          <Skeleton className="h-[140px] rounded-lg" />

          <Skeleton className="h-10 w-[300px]" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[280px] rounded-lg" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
