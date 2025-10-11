export default function WorkPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Work</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Active Projects</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Website Redesign</p>
                <p className="text-xs text-muted-foreground">Due in 5 days</p>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                In Progress
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Mobile App Launch</p>
                <p className="text-xs text-muted-foreground">Due in 12 days</p>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                On Track
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">API Integration</p>
                <p className="text-xs text-muted-foreground">Due in 3 days</p>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                At Risk
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Today's Tasks</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm">Review pull requests</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm">Update documentation</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm">Team standup meeting</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm">Deploy to staging</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm">Code review session</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Upcoming Deadlines</h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">Q1 Planning</p>
              <p className="text-xs text-muted-foreground">Tomorrow, 2:00 PM</p>
            </div>
            <div>
              <p className="text-sm font-medium">Client Presentation</p>
              <p className="text-xs text-muted-foreground">Monday, 10:00 AM</p>
            </div>
            <div>
              <p className="text-sm font-medium">Sprint Review</p>
              <p className="text-xs text-muted-foreground">Friday, 3:00 PM</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-green-500"></div>
              <div>
                <p className="text-sm font-medium">Completed feature branch</p>
                <p className="text-xs text-muted-foreground">30 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
              <div>
                <p className="text-sm font-medium">Created new task</p>
                <p className="text-xs text-muted-foreground">1 hour ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 mt-2 rounded-full bg-purple-500"></div>
              <div>
                <p className="text-sm font-medium">Updated project timeline</p>
                <p className="text-xs text-muted-foreground">2 hours ago</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Team Capacity</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Engineering</span>
                <span>80%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: "80%" }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Design</span>
                <span>65%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: "65%" }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Product</span>
                <span>90%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: "90%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
