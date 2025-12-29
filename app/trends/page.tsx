import { TrendingUp } from "lucide-react";
import { DashboardLayout } from "@/components/layouts";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export default function TrendsPage() {
  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Trends</h1>
        <p className="text-muted-foreground">
          Historical trends and forecasting
        </p>
      </div>

      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TrendingUp className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>Coming soon</EmptyTitle>
          <EmptyDescription>
            Historical trends and forecasting features are being developed
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </DashboardLayout>
  );
}

