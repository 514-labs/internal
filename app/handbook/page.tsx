import { getContentCollection } from "@/lib/content";
import { ContentList, ContentNavigation } from "@/components/content";
import { ContentLayout } from "@/components/layouts";

export default async function HandbookPage() {
  const collection = await getContentCollection("handbook");

  return (
    <ContentLayout
      navigation={
        <ContentNavigation
          navigation={collection.navigation}
          basePath="/handbook"
        />
      }
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Handbook</h1>
        <p className="text-muted-foreground">
          Company information, policies, and guidelines
        </p>
      </div>

      <ContentList
        items={collection.items}
        basePath="/handbook"
        emptyMessage="No handbook pages yet. Add markdown files to content/handbook/"
      />
    </ContentLayout>
  );
}
