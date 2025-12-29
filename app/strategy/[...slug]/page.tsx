import { notFound } from "next/navigation";
import { getContent, getAllSlugs, getContentCollection } from "@/lib/content";
import {
  ContentArticle,
  ContentNavigation,
  TableOfContents,
} from "@/components/content";
import { ContentLayout } from "@/components/layouts";

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
    </ContentLayout>
  );
}
