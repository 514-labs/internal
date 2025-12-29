import { notFound } from "next/navigation";
import Link from "next/link";
import { ContentLayout } from "@/components/layouts";
import { getGoal, getAllGoalSlugs, hydrateGoal } from "@/lib/goals";
import { GoalDetailContent } from "./_components/goal-detail-content";
import { GoalSidebar } from "@/components/goals";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  const slugs = await getAllGoalSlugs();
  return slugs.map((slug) => ({
    slug: slug.split("/"),
  }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const goal = await getGoal(slug.join("/"));

  if (!goal) {
    return { title: "Goal Not Found" };
  }

  return {
    title: goal.frontmatter.title,
    description: goal.frontmatter.description,
  };
}

export default async function GoalDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const goal = await getGoal(slug.join("/"));

  if (!goal) {
    notFound();
  }

  // Hydrate the goal with live metric data
  // Note: In production, you'd pass the userId here for Mercury/Rippling metrics
  const hydratedGoal = await hydrateGoal(goal);

  const statusColors = {
    draft: "bg-muted text-muted-foreground",
    active: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    completed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    archived: "bg-muted text-muted-foreground",
  };

  const domainLabels: Record<string, string> = {
    "product-development": "Product Development",
    "customer-development": "Customer Development",
    "company": "Company",
    "plm": "Product-Led Marketing",
    "slg": "Sales-Led Growth",
    "awareness": "Awareness",
    "platform": "Platform",
  };

  const domainColors: Record<string, string> = {
    "product-development": "bg-purple-500/10 text-purple-600 border-purple-500/20",
    "customer-development": "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    "company": "bg-amber-500/10 text-amber-600 border-amber-500/20",
    "plm": "bg-green-500/10 text-green-600 border-green-500/20",
    "slg": "bg-blue-500/10 text-blue-600 border-blue-500/20",
    "awareness": "bg-pink-500/10 text-pink-600 border-pink-500/20",
    "platform": "bg-violet-500/10 text-violet-600 border-violet-500/20",
  };

  return (
    <ContentLayout
      tableOfContents={
        <GoalSidebar
          initiativeIds={hydratedGoal.frontmatter.initiatives}
          toc={hydratedGoal.toc}
          metadata={{
            team: hydratedGoal.frontmatter.team,
            owner: hydratedGoal.frontmatter.owner,
            timeframe: hydratedGoal.frontmatter.timeframe,
            status: hydratedGoal.frontmatter.status,
          }}
        />
      }
    >
      {/* Back link */}
      <Button variant="ghost" size="sm" asChild className="mb-6 -ml-2">
        <Link href="/goals" className="gap-1.5">
          <ChevronLeft className="h-4 w-4" />
          Back to Goals
        </Link>
      </Button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge
            variant="outline"
            className={statusColors[hydratedGoal.frontmatter.status]}
          >
            {hydratedGoal.frontmatter.status}
          </Badge>
          <Badge
            variant="outline"
            className={domainColors[hydratedGoal.frontmatter.strategicDomain]}
          >
            {domainLabels[hydratedGoal.frontmatter.strategicDomain]}
          </Badge>
          {hydratedGoal.hasLiveData && (
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
            >
              Live Data
            </Badge>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          {hydratedGoal.frontmatter.title}
        </h1>
        {hydratedGoal.frontmatter.description && (
          <p className="text-lg text-muted-foreground">
            {hydratedGoal.frontmatter.description}
          </p>
        )}
      </div>

      <GoalDetailContent
        keyResults={hydratedGoal.keyResults}
        progress={hydratedGoal.progress}
        initiativeIds={hydratedGoal.frontmatter.initiatives || []}
        htmlContent={hydratedGoal.html}
      />
    </ContentLayout>
  );
}
