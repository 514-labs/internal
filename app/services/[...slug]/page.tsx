import { notFound } from "next/navigation";
import { getContent, getAllSlugs, getContentCollection } from "@/lib/content";
import {
  ContentArticle,
  ContentNavigation,
  TableOfContents,
} from "@/components/content";
import { ContentLayout } from "@/components/layouts";

interface ServiceArticlePageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  const slugs = await getAllSlugs("services");
  return slugs.map((slug) => ({
    slug: slug.split("/"),
  }));
}

export async function generateMetadata({ params }: ServiceArticlePageProps) {
  const { slug } = await params;
  const slugPath = slug.join("/");
  const item = await getContent("services", slugPath);

  if (!item) {
    return {
      title: "Not Found | Services",
    };
  }

  return {
    title: `${item.frontmatter.title} | Services`,
    description: item.frontmatter.description,
  };
}

export default async function ServiceArticlePage({
  params,
}: ServiceArticlePageProps) {
  const { slug } = await params;
  const slugPath = slug.join("/");
  const item = await getContent("services", slugPath);

  if (!item) {
    notFound();
  }

  const collection = await getContentCollection("services");

  return (
    <ContentLayout
      navigation={
        <ContentNavigation
          navigation={collection.navigation}
          basePath="/services"
          currentSlug={slugPath}
        />
      }
      tableOfContents={
        <TableOfContents entries={item.toc} metadata={item.frontmatter} />
      }
    >
      <ContentArticle
        item={item}
        backPath="/services"
        backLabel="Back to Services"
      />
    </ContentLayout>
  );
}
