import { Trophy } from "lucide-react";
import { ContentLayout } from "@/components/layouts";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function WinsPage() {
  return (
    <ContentLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Wins</h1>
        <p className="text-muted-foreground">Celebrate team achievements and victories</p>
      </div>

      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Trophy className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>No wins recorded yet</EmptyTitle>
          <EmptyDescription>
            Start celebrating your team&apos;s achievements here
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </ContentLayout>
  );
}

