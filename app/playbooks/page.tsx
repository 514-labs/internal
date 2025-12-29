import { getContentCollection } from "@/lib/content";
import { ContentList, ContentNavigation } from "@/components/content";
import { ContentLayout } from "@/components/layouts";

export default async function PlaybooksPage() {
  const collection = await getContentCollection("playbooks");

  return (
    <ContentLayout
      navigation={
        <ContentNavigation
          navigation={collection.navigation}
          basePath="/playbooks"
        />
      }
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Playbooks</h1>
        <p className="text-muted-foreground">
          Step-by-step guides for common workflows
        </p>
      </div>

      <ContentList
        items={collection.items}
        basePath="/playbooks"
        emptyMessage="No playbooks yet. Add markdown files to content/playbooks/"
      />
    </ContentLayout>
  );
}
