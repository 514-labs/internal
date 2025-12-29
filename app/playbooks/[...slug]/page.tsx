import { notFound } from "next/navigation";
import { getContent, getAllSlugs, getContentCollection } from "@/lib/content";
import {
  ContentArticle,
  ContentNavigation,
  TableOfContents,
} from "@/components/content";
import { ContentLayout } from "@/components/layouts";

interface PlaybookArticlePageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  const slugs = await getAllSlugs("playbooks");
  return slugs.map((slug) => ({
    slug: slug.split("/"),
  }));
}

export async function generateMetadata({ params }: PlaybookArticlePageProps) {
  const { slug } = await params;
  const slugPath = slug.join("/");
  const item = await getContent("playbooks", slugPath);

  if (!item) {
    return {
      title: "Not Found | Playbooks",
    };
  }

  return {
    title: `${item.frontmatter.title} | Playbooks`,
    description: item.frontmatter.description,
  };
}

export default async function PlaybookArticlePage({
  params,
}: PlaybookArticlePageProps) {
  const { slug } = await params;
  const slugPath = slug.join("/");
  const item = await getContent("playbooks", slugPath);

  if (!item) {
    notFound();
  }

  const collection = await getContentCollection("playbooks");

  return (
    <ContentLayout
      navigation={
        <ContentNavigation
          navigation={collection.navigation}
          basePath="/playbooks"
          currentSlug={slugPath}
        />
      }
      tableOfContents={
        <TableOfContents entries={item.toc} metadata={item.frontmatter} />
      }
    >
      <ContentArticle
        item={item}
        backPath="/playbooks"
        backLabel="Back to Playbooks"
      />
    </ContentLayout>
  );
}
