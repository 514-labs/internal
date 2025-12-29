import { FinancialsClient } from "./_components/financials-client";
import { DashboardLayout } from "@/components/layouts";

export default function FinancialsPage() {
  return (
    <DashboardLayout>
      <FinancialsClient />
    </DashboardLayout>
  );
}

