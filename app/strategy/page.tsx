import { getContentCollection } from "@/lib/content";
import { ContentList, ContentNavigation } from "@/components/content";
import { ContentLayout } from "@/components/layouts";

export default async function StrategyPage() {
  const collection = await getContentCollection("strategy");

  return (
    <ContentLayout
      navigation={
        <ContentNavigation
          navigation={collection.navigation}
          basePath="/strategy"
        />
      }
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Strategy</h1>
        <p className="text-muted-foreground">
          Company strategy, vision, and roadmap
        </p>
      </div>

      <ContentList
        items={collection.items}
        basePath="/strategy"
        emptyMessage="No strategy documents yet. Add markdown files to content/strategy/"
      />
    </ContentLayout>
  );
}
