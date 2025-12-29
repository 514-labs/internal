import { getContentCollection } from "@/lib/content";
import { ContentList, ContentNavigation } from "@/components/content";
import { ContentLayout } from "@/components/layouts";

export default async function FrameworksPage() {
  const collection = await getContentCollection("frameworks");

  return (
    <ContentLayout
      navigation={
        <ContentNavigation
          navigation={collection.navigation}
          basePath="/frameworks"
        />
      }
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Frameworks</h1>
        <p className="text-muted-foreground">
          Mental models, methodologies, and thinking tools
        </p>
      </div>

      <ContentList
        items={collection.items}
        basePath="/frameworks"
        emptyMessage="No frameworks documented yet. Add markdown files to content/frameworks/"
      />
    </ContentLayout>
  );
}
