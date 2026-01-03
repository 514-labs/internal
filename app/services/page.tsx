import { redirect } from "next/navigation";
import { getContentCollection } from "@/lib/content";
import { ContentList, ContentNavigation } from "@/components/content";
import { ContentLayout } from "@/components/layouts";
import { experimentalFlag } from "@/flags";

export default async function ServicesPage() {
  const isExperimental = await experimentalFlag();

  if (!isExperimental) {
    redirect("/");
  }

  const collection = await getContentCollection("services");

  return (
    <ContentLayout
      navigation={
        <ContentNavigation
          navigation={collection.navigation}
          basePath="/services"
        />
      }
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Services</h1>
        <p className="text-muted-foreground">
          Service offerings and capabilities
        </p>
      </div>

      <ContentList
        items={collection.items}
        basePath="/services"
        emptyMessage="No services documented yet. Add markdown files to content/services/"
      />
    </ContentLayout>
  );
}
