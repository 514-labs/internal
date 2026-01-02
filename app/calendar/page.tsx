"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { Calendar as CalendarIcon, Plug } from "lucide-react";
import { ContentLayout } from "@/components/layouts";
import { EventCalendar, CalendarEventType } from "@/components/calendar";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { useAuth, useOrganizationList } from "@clerk/nextjs";
import Link from "next/link";

interface CalendarStatus {
  connected: boolean;
  message?: string;
}

interface CalendarEventsResponse {
  events: Array<{
    id: string;
    title: string;
    description?: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    color: string;
    isRepeating: boolean;
    isAllDay?: boolean;
    htmlLink?: string;
    calendarName?: string;
  }>;
  count: number;
  error?: string;
  message?: string;
}

export default function CalendarPage() {
  const { userId } = useAuth();
  const { userMemberships } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });

  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEventType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const currentFetchRef = useRef<AbortController | null>(null);

  const isAdmin =
    userMemberships?.data?.some(
      (membership) => membership.role === "org:admin"
    ) ?? false;

  // Check Google Calendar connection status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        setStatusLoading(true);
        const response = await fetch("/api/integrations/google-calendar/status");
        if (response.ok) {
          const data = await response.json();
          setStatus(data);
        } else {
          setStatus({ connected: false });
        }
      } catch (error) {
        console.error("Error checking calendar status:", error);
        setStatus({ connected: false });
      } finally {
        setStatusLoading(false);
      }
    };

    if (userId) {
      checkStatus();
    }
  }, [userId]);

  // Fetch events when date range changes
  const handleDateRangeChange = useCallback(
    async (startDate: Date, endDate: Date) => {
      if (!status?.connected) return;

      // Cancel any ongoing fetch
      if (currentFetchRef.current) {
        currentFetchRef.current.abort();
      }

      // Create new abort controller
      const abortController = new AbortController();
      currentFetchRef.current = abortController;

      try {
        setIsLoading(true);

        const params = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });

        const response = await fetch(`/api/calendar/events?${params}`, {
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }

        const data: CalendarEventsResponse = await response.json();

        // Only update if this is still the current fetch
        if (currentFetchRef.current === abortController) {
          // Transform API response to CalendarEventType
          const transformedEvents: CalendarEventType[] = data.events.map(
            (event) => ({
              ...event,
              startDate: new Date(event.startDate),
              endDate: new Date(event.endDate),
            })
          );

          setEvents(transformedEvents);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Error fetching events:", error);
      } finally {
        if (currentFetchRef.current === abortController) {
          setIsLoading(false);
          currentFetchRef.current = null;
        }
      }
    },
    [status?.connected]
  );

  // Show loading state
  if (statusLoading) {
    return (
      <ContentLayout fullWidth>
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            Company-wide events and schedules
          </p>
        </div>
        <div className="flex items-center justify-center h-[600px] border rounded-lg bg-muted/20">
          <div className="animate-pulse text-muted-foreground">
            Loading calendar...
          </div>
        </div>
      </ContentLayout>
    );
  }

  // Show connection prompt if not connected
  if (!status?.connected) {
    return (
      <ContentLayout fullWidth>
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            Company-wide events and schedules
          </p>
        </div>

        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarIcon className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>Google Calendar not connected</EmptyTitle>
            <EmptyDescription>
              {isAdmin
                ? "Connect your company Google Calendar to display events here."
                : "Ask an administrator to connect the company Google Calendar."}
            </EmptyDescription>
          </EmptyHeader>
          {isAdmin && (
            <EmptyContent>
              <Link href="/admin/integrations">
                <Button>
                  <Plug className="mr-2 h-4 w-4" />
                  Connect Google Calendar
                </Button>
              </Link>
            </EmptyContent>
          )}
        </Empty>
      </ContentLayout>
    );
  }

  // Show calendar
  return (
    <ContentLayout fullWidth>
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground">
          Company-wide events and schedules
        </p>
      </div>

      <EventCalendar
        events={events}
        isLoading={isLoading}
        onDateRangeChange={handleDateRangeChange}
        config={{
          defaultView: "month",
          use24HourFormatByDefault: false,
          monthView: {
            showOnlyCurrentMonth: false,
            viewType: "basic",
          },
        }}
      />
    </ContentLayout>
  );
}

