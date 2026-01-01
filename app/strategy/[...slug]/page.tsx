import { notFound } from "next/navigation";
import { getContent, getAllSlugs, getContentCollection } from "@/lib/content";
import {
  ContentArticle,
  ContentNavigation,
  TableOfContents,
} from "@/components/content";
import { ContentLayout } from "@/components/layouts";
import { getAllGoals } from "@/lib/goals";
import { StrategyGoals } from "@/components/goals";
import type { StrategicDomain } from "@/lib/goals";

interface StrategyArticlePageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  const slugs = await getAllSlugs("strategy");
  return slugs.map((slug) => ({
    slug: slug.split("/"),
  }));
}

export async function generateMetadata({ params }: StrategyArticlePageProps) {
  const { slug } = await params;
  const slugPath = slug.join("/");
  const item = await getContent("strategy", slugPath);

  if (!item) {
    return {
      title: "Not Found | Strategy",
    };
  }

  return {
    title: `${item.frontmatter.title} | Strategy`,
    description: item.frontmatter.description,
  };
}

/**
 * Map strategy paths to strategic domains for goal filtering
 */
function getStrategicDomain(slugPath: string): StrategicDomain | null {
  if (slugPath.startsWith("product-development")) {
    return "product-development";
  }
  if (slugPath.startsWith("customer-development")) {
    return "customer-development";
  }
  return null;
}

export default async function StrategyArticlePage({
  params,
}: StrategyArticlePageProps) {
  const { slug } = await params;
  const slugPath = slug.join("/");
  const item = await getContent("strategy", slugPath);

  if (!item) {
    notFound();
  }

  const collection = await getContentCollection("strategy");

  // Get the strategic domain based on the path
  const strategicDomain = getStrategicDomain(slugPath);

  // Fetch goals for this domain if applicable
  const goals = strategicDomain ? await getAllGoals({ strategicDomain }) : [];

  return (
    <ContentLayout
      navigation={
        <ContentNavigation
          navigation={collection.navigation}
          basePath="/strategy"
          currentSlug={slugPath}
        />
      }
      tableOfContents={
        <TableOfContents entries={item.toc} metadata={item.frontmatter} />
      }
    >
      <ContentArticle
        item={item}
        backPath="/strategy"
        backLabel="Back to Strategy"
      />

      {/* Show related goals for product-development and customer-development sections */}
      {strategicDomain && goals.length > 0 && (
        <StrategyGoals goals={goals} domain={strategicDomain} />
      )}
    </ContentLayout>
  );
}
