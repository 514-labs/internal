export default function CompanyPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Company</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">About Us</h3>
          <p className="text-sm text-muted-foreground">
            We are a forward-thinking company dedicated to building innovative
            solutions that empower businesses and individuals to achieve their
            goals.
          </p>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Mission</h3>
          <p className="text-sm text-muted-foreground">
            To create technology that makes a meaningful impact on how people
            work and collaborate.
          </p>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Company Stats</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Founded</span>
              <span className="text-sm font-medium">2020</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Employees</span>
              <span className="text-sm font-medium">56</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Locations</span>
              <span className="text-sm font-medium">3</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Values</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Innovation First</li>
            <li>• Customer Success</li>
            <li>• Team Collaboration</li>
            <li>• Continuous Learning</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
