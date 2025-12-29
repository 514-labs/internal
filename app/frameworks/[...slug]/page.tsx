import { notFound } from "next/navigation";
import { getContent, getAllSlugs, getContentCollection } from "@/lib/content";
import {
  ContentArticle,
  ContentNavigation,
  TableOfContents,
} from "@/components/content";
import { ContentLayout } from "@/components/layouts";

interface FrameworkArticlePageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  const slugs = await getAllSlugs("frameworks");
  return slugs.map((slug) => ({
    slug: slug.split("/"),
  }));
}

export async function generateMetadata({ params }: FrameworkArticlePageProps) {
  const { slug } = await params;
  const slugPath = slug.join("/");
  const item = await getContent("frameworks", slugPath);

  if (!item) {
    return {
      title: "Not Found | Frameworks",
    };
  }

  return {
    title: `${item.frontmatter.title} | Frameworks`,
    description: item.frontmatter.description,
  };
}

export default async function FrameworkArticlePage({
  params,
}: FrameworkArticlePageProps) {
  const { slug } = await params;
  const slugPath = slug.join("/");
  const item = await getContent("frameworks", slugPath);

  if (!item) {
    notFound();
  }

  const collection = await getContentCollection("frameworks");

  return (
    <ContentLayout
      navigation={
        <ContentNavigation
          navigation={collection.navigation}
          basePath="/frameworks"
          currentSlug={slugPath}
        />
      }
      tableOfContents={
        <TableOfContents entries={item.toc} metadata={item.frontmatter} />
      }
    >
      <ContentArticle
        item={item}
        backPath="/frameworks"
        backLabel="Back to Frameworks"
      />
    </ContentLayout>
  );
}
