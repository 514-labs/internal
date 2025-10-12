/**
 * Mock PostHog Node.js client for testing
 */

export class PostHog {
  private events: Array<{
    event: string;
    distinctId: string;
    properties?: unknown;
  }> = [];

  constructor(public apiKey: string, public config?: { host?: string }) {}

  capture(event: {
    distinctId: string;
    event: string;
    properties?: unknown;
  }): void {
    this.events.push({
      event: event.event,
      distinctId: event.distinctId,
      properties: event.properties,
    });
  }

  async shutdown(): Promise<void> {
    // No-op for mock
  }

  // For testing: get captured events
  getEvents() {
    return this.events;
  }

  // For testing: clear events
  clearEvents() {
    this.events = [];
  }
}

// Mock fetch for HogQL queries
global.fetch = jest.fn((url: string, options?: any) => {
  const urlStr = typeof url === "string" ? url : url.toString();

  // Mock HogQL query responses
  if (urlStr.includes("/query/")) {
    return Promise.resolve({
      ok: true,
      json: async () => ({
        results: [
          ["$pageview", "2024-01-01T00:00:00Z", { page: "/home" }],
          ["signup_completed", "2024-01-01T00:01:00Z", { user: "test" }],
        ],
        columns: ["event", "timestamp", "properties"],
      }),
    } as Response);
  }

  // Mock events endpoint
  if (urlStr.includes("/events/")) {
    return Promise.resolve({
      ok: true,
      json: async () => ({
        results: [
          {
            event: "test_event",
            distinct_id: "test_user",
            timestamp: "2024-01-01T00:00:00Z",
            uuid: "test-uuid-123",
            properties: {},
          },
        ],
      }),
    } as Response);
  }

  return Promise.resolve({
    ok: false,
    status: 404,
    text: async () => "Not found",
  } as Response);
}) as jest.Mock;
