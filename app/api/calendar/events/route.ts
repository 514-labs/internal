/**
 * Calendar Events API
 * Fetches events from Google Calendar for a given date range
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  fetchGoogleCalendarEvents,
  isGoogleCalendarConnected,
  GoogleCalendarEvent,
} from "@/lib/integrations/google-calendar";

// Google Calendar color ID to hex mapping
const GOOGLE_CALENDAR_COLORS: Record<string, string> = {
  "1": "#7986cb", // Lavender
  "2": "#33b679", // Sage
  "3": "#8e24aa", // Grape
  "4": "#e67c73", // Flamingo
  "5": "#f6bf26", // Banana
  "6": "#f4511e", // Tangerine
  "7": "#039be5", // Peacock
  "8": "#616161", // Graphite
  "9": "#3f51b5", // Blueberry
  "10": "#0b8043", // Basil
  "11": "#d50000", // Tomato
};

// Map to our calendar's color format
function mapGoogleColorToCalendarColor(colorId?: string): string {
  if (!colorId || !GOOGLE_CALENDAR_COLORS[colorId]) {
    return "blue"; // Default color
  }

  // Map Google colors to our event color values
  const colorMap: Record<string, string> = {
    "1": "blue", // Lavender -> blue
    "2": "green", // Sage -> green
    "3": "purple", // Grape -> purple
    "4": "pink", // Flamingo -> pink
    "5": "yellow", // Banana -> yellow
    "6": "orange", // Tangerine -> orange
    "7": "blue", // Peacock -> blue
    "8": "gray", // Graphite -> gray
    "9": "indigo", // Blueberry -> indigo
    "10": "green", // Basil -> green
    "11": "red", // Tomato -> red
  };

  return colorMap[colorId] || "blue";
}

// Transform Google Calendar event to our calendar event format
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  color: string;
  isRepeating: boolean;
  isAllDay: boolean;
  htmlLink?: string;
  calendarName?: string;
}

// Map calendar names to default colors (when event has no specific color)
function getCalendarDefaultColor(calendarName?: string): string {
  if (!calendarName) return "blue";
  
  const name = calendarName.toLowerCase();
  if (name.includes("work")) return "blue";
  if (name.includes("goal")) return "purple";
  if (name.includes("deadline")) return "red";
  if (name.includes("meeting")) return "green";
  
  return "blue";
}

function transformGoogleEvent(event: GoogleCalendarEvent): CalendarEvent {
  const isAllDay = !event.start.dateTime;

  let startDate: Date;
  let endDate: Date;

  if (isAllDay) {
    // All-day events use date format (YYYY-MM-DD)
    startDate = new Date(event.start.date + "T00:00:00");
    endDate = new Date(event.end.date + "T00:00:00");
    // All-day events in Google have end date exclusive, so subtract a day
    endDate.setDate(endDate.getDate() - 1);
  } else {
    startDate = new Date(event.start.dateTime!);
    endDate = new Date(event.end.dateTime!);
  }

  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  // Use event color if set, otherwise use calendar-based default color
  const color = event.colorId 
    ? mapGoogleColorToCalendarColor(event.colorId)
    : getCalendarDefaultColor(event.calendarName);

  return {
    id: event.id,
    title: event.summary || "(No title)",
    description: event.description,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    startTime: isAllDay ? "00:00" : formatTime(startDate),
    endTime: isAllDay ? "23:59" : formatTime(endDate),
    color,
    isRepeating: !!event.recurringEventId,
    isAllDay,
    htmlLink: event.htmlLink,
    calendarName: event.calendarName,
  };
}

export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if Google Calendar is connected
    const isConnected = await isGoogleCalendarConnected();

    if (!isConnected) {
      return NextResponse.json(
        {
          error: "Not connected",
          message: "Google Calendar is not connected. Please connect it in Admin > Integrations.",
        },
        { status: 400 }
      );
    }

    // Parse date range from query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    if (!startDateParam || !endDateParam) {
      return NextResponse.json(
        {
          error: "Missing parameters",
          message: "startDate and endDate query parameters are required",
        },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateParam);
    const endDate = new Date(endDateParam);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        {
          error: "Invalid dates",
          message: "startDate and endDate must be valid ISO date strings",
        },
        { status: 400 }
      );
    }

    // Fetch events from Google Calendar
    const googleEvents = await fetchGoogleCalendarEvents(startDate, endDate);

    // Transform events to our calendar format
    const events = googleEvents
      .filter((event) => event.status !== "cancelled")
      .map(transformGoogleEvent);

    return NextResponse.json({
      events,
      count: events.length,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error("Calendar events fetch error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch events",
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

