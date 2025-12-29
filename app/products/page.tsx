import { getContentCollection } from "@/lib/content";
import { ContentList, ContentNavigation } from "@/components/content";
import { ContentLayout } from "@/components/layouts";

export default async function ProductsPage() {
  const collection = await getContentCollection("products");

  return (
    <ContentLayout
      navigation={
        <ContentNavigation
          navigation={collection.navigation}
          basePath="/products"
        />
      }
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Products</h1>
        <p className="text-muted-foreground">
          Product catalog and documentation
        </p>
      </div>

      <ContentList
        items={collection.items}
        basePath="/products"
        emptyMessage="No products documented yet. Add markdown files to content/products/"
      />
    </ContentLayout>
  );
}
