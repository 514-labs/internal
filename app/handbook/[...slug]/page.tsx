import { notFound } from "next/navigation";
import { getContent, getAllSlugs, getContentCollection } from "@/lib/content";
import {
  ContentArticle,
  ContentNavigation,
  TableOfContents,
} from "@/components/content";
import { ContentLayout } from "@/components/layouts";

interface HandbookArticlePageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  const slugs = await getAllSlugs("handbook");
  return slugs.map((slug) => ({
    slug: slug.split("/"),
  }));
}

export async function generateMetadata({ params }: HandbookArticlePageProps) {
  const { slug } = await params;
  const slugPath = slug.join("/");
  const item = await getContent("handbook", slugPath);

  if (!item) {
    return {
      title: "Not Found | Handbook",
    };
  }

  return {
    title: `${item.frontmatter.title} | Handbook`,
    description: item.frontmatter.description,
  };
}

export default async function HandbookArticlePage({
  params,
}: HandbookArticlePageProps) {
  const { slug } = await params;
  const slugPath = slug.join("/");
  const item = await getContent("handbook", slugPath);

  if (!item) {
    notFound();
  }

  const collection = await getContentCollection("handbook");

  return (
    <ContentLayout
      navigation={
        <ContentNavigation
          navigation={collection.navigation}
          basePath="/handbook"
          currentSlug={slugPath}
        />
      }
      tableOfContents={
        <TableOfContents entries={item.toc} metadata={item.frontmatter} />
      }
    >
      <ContentArticle
        item={item}
        backPath="/handbook"
        backLabel="Back to Handbook"
      />
    </ContentLayout>
  );
}
