import { Citrus } from "lucide-react";
import { ContentLayout } from "@/components/layouts";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function LemonPrizesPage() {
  return (
    <ContentLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Lemon Prizes</h1>
        <p className="text-muted-foreground">When life gives you lemons, make it memorable</p>
      </div>

      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Citrus className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>No lemon prizes awarded yet</EmptyTitle>
          <EmptyDescription>
            Sometimes things don&apos;t go as planned — and that&apos;s okay
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </ContentLayout>
  );
}

