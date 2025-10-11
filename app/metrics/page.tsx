export default function MetricsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Metrics</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-sm font-medium">Total Revenue</h3>
          <p className="text-2xl font-bold">$45,231.89</p>
          <p className="text-xs text-muted-foreground">
            +20.1% from last month
          </p>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-sm font-medium">Active Users</h3>
          <p className="text-2xl font-bold">2,350</p>
          <p className="text-xs text-muted-foreground">
            +180.1% from last month
          </p>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-sm font-medium">Sales</h3>
          <p className="text-2xl font-bold">+12,234</p>
          <p className="text-xs text-muted-foreground">+19% from last month</p>
        </div>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-sm font-medium">Active Now</h3>
          <p className="text-2xl font-bold">+573</p>
          <p className="text-xs text-muted-foreground">+201 since last hour</p>
        </div>
      </div>
    </div>
  );
}
