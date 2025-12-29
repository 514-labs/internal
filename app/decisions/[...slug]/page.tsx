import { notFound } from "next/navigation";
import { getContent, getAllSlugs, getContentCollection } from "@/lib/content";
import {
  ContentArticle,
  ContentNavigation,
  TableOfContents,
} from "@/components/content";
import { ContentLayout } from "@/components/layouts";

interface DecisionArticlePageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  const slugs = await getAllSlugs("decisions");
  return slugs.map((slug) => ({
    slug: slug.split("/"),
  }));
}

export async function generateMetadata({ params }: DecisionArticlePageProps) {
  const { slug } = await params;
  const slugPath = slug.join("/");
  const item = await getContent("decisions", slugPath);

  if (!item) {
    return {
      title: "Not Found | Decisions",
    };
  }

  return {
    title: `${item.frontmatter.title} | Decisions`,
    description: item.frontmatter.description,
  };
}

export default async function DecisionArticlePage({
  params,
}: DecisionArticlePageProps) {
  const { slug } = await params;
  const slugPath = slug.join("/");
  const item = await getContent("decisions", slugPath);

  if (!item) {
    notFound();
  }

  const collection = await getContentCollection("decisions");

  return (
    <ContentLayout
      navigation={
        <ContentNavigation
          navigation={collection.navigation}
          basePath="/decisions"
          currentSlug={slugPath}
        />
      }
      tableOfContents={
        <TableOfContents entries={item.toc} metadata={item.frontmatter} />
      }
    >
      <ContentArticle
        item={item}
        backPath="/decisions"
        backLabel="Back to Decisions"
      />
    </ContentLayout>
  );
}
