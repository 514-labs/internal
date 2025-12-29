import { ContentLayout } from "@/components/layouts";

export default function TeamsPage() {
  return (
    <ContentLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
        <p className="text-muted-foreground">Your organization&apos;s team structure</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-lg font-semibold">Engineering</h3>
          <p className="text-sm text-muted-foreground mt-2">12 members</p>
          <p className="text-sm mt-4">Building amazing products and features</p>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-lg font-semibold">Design</h3>
          <p className="text-sm text-muted-foreground mt-2">8 members</p>
          <p className="text-sm mt-4">Creating beautiful user experiences</p>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-lg font-semibold">Marketing</h3>
          <p className="text-sm text-muted-foreground mt-2">6 members</p>
          <p className="text-sm mt-4">Growing our brand and reach</p>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-lg font-semibold">Sales</h3>
          <p className="text-sm text-muted-foreground mt-2">10 members</p>
          <p className="text-sm mt-4">Driving revenue and partnerships</p>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-lg font-semibold">Support</h3>
          <p className="text-sm text-muted-foreground mt-2">15 members</p>
          <p className="text-sm mt-4">Helping customers succeed</p>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-lg font-semibold">Operations</h3>
          <p className="text-sm text-muted-foreground mt-2">5 members</p>
          <p className="text-sm mt-4">Keeping everything running smoothly</p>
        </div>
      </div>
    </ContentLayout>
  );
}
