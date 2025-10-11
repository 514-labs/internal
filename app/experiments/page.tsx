export default function ExperimentsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Experiments</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">A/B Test - Homepage</h3>
            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              Running
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Variant A</span>
              <span className="font-medium">52%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Variant B</span>
              <span className="font-medium">48%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sample Size</span>
              <span className="font-medium">1,247</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Confidence</span>
              <span className="font-medium text-green-600">95%</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Feature Flag - Dark Mode</h3>
            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              Active
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rollout</span>
              <span className="font-medium">75%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: "75%" }}
              ></div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Users Enabled</span>
              <span className="font-medium">1,823</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Error Rate</span>
              <span className="font-medium text-green-600">0.2%</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Multivariate - Checkout</h3>
            <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
              Analyzing
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Variants</span>
              <span className="font-medium">4</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Best Performer</span>
              <span className="font-medium">Variant C</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Improvement</span>
              <span className="font-medium text-green-600">+12.5%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium">14 days</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Results</h3>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium">Button Color Test</p>
                <p className="text-xs text-muted-foreground">
                  Completed 3 days ago
                </p>
              </div>
              <span className="text-sm font-medium text-green-600">
                +8.3% CTR
              </span>
            </div>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium">Onboarding Flow</p>
                <p className="text-xs text-muted-foreground">
                  Completed 1 week ago
                </p>
              </div>
              <span className="text-sm font-medium text-green-600">
                +15.2% completion
              </span>
            </div>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium">Email Subject Lines</p>
                <p className="text-xs text-muted-foreground">
                  Completed 2 weeks ago
                </p>
              </div>
              <span className="text-sm font-medium text-green-600">
                +22.1% open rate
              </span>
            </div>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium">Pricing Page Layout</p>
                <p className="text-xs text-muted-foreground">
                  Completed 3 weeks ago
                </p>
              </div>
              <span className="text-sm font-medium text-red-600">
                -2.4% conversions
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Experiment Pipeline</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">In Development</span>
                <span className="text-sm text-muted-foreground">3</span>
              </div>
              <div className="flex gap-1">
                <div className="h-2 w-1/3 bg-blue-500 rounded"></div>
                <div className="h-2 flex-1 bg-secondary rounded"></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Running</span>
                <span className="text-sm text-muted-foreground">5</span>
              </div>
              <div className="flex gap-1">
                <div className="h-2 w-5/12 bg-green-500 rounded"></div>
                <div className="h-2 flex-1 bg-secondary rounded"></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Analyzing</span>
                <span className="text-sm text-muted-foreground">2</span>
              </div>
              <div className="flex gap-1">
                <div className="h-2 w-1/6 bg-yellow-500 rounded"></div>
                <div className="h-2 flex-1 bg-secondary rounded"></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Completed</span>
                <span className="text-sm text-muted-foreground">12</span>
              </div>
              <div className="flex gap-1">
                <div className="h-2 w-full bg-gray-500 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Key Insights</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <p className="text-2xl font-bold">87%</p>
            <p className="text-sm text-muted-foreground">Success Rate</p>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold">+18.4%</p>
            <p className="text-sm text-muted-foreground">
              Avg. Performance Lift
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-2xl font-bold">22</p>
            <p className="text-sm text-muted-foreground">
              Experiments This Quarter
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
