import { Rss } from "lucide-react";
import { ContentLayout } from "@/components/layouts";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function FeedPage() {
  return (
    <ContentLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Feed</h1>
        <p className="text-muted-foreground">
          Recent updates and activity across the organization
        </p>
      </div>

      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Rss className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>Coming soon</EmptyTitle>
          <EmptyDescription>
            Feed will show recent updates from across the organization
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </ContentLayout>
  );
}
