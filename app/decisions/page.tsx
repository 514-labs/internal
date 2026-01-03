import { redirect } from "next/navigation";
import { getContentCollection } from "@/lib/content";
import { ContentList, ContentNavigation } from "@/components/content";
import { ContentLayout } from "@/components/layouts";
import { experimentalFlag } from "@/flags";

export default async function DecisionsPage() {
  const isExperimental = await experimentalFlag();

  if (!isExperimental) {
    redirect("/");
  }

  const collection = await getContentCollection("decisions");

  return (
    <ContentLayout
      navigation={
        <ContentNavigation
          navigation={collection.navigation}
          basePath="/decisions"
        />
      }
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Decisions</h1>
        <p className="text-muted-foreground">
          Decision logs and architectural decisions
        </p>
      </div>

      <ContentList
        items={collection.items}
        basePath="/decisions"
        emptyMessage="No decisions documented yet. Add markdown files to content/decisions/"
      />
    </ContentLayout>
  );
}
