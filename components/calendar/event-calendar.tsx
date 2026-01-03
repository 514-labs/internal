"use client";

/**
 * EventCalendar Component
 *
 * A read-only calendar component for viewing events from Google Calendar.
 * Features multiple views (Day, Week, Month, Year, List), color filtering,
 * time format toggle, and responsive design.
 */

import React, { useState, useMemo, useEffect } from "react";
import { CalendarEventType, EventCalendarConfigType } from "./types";
import { useSwipeable } from "react-swipeable";
import { useCalendarNavigation } from "./hooks";
import CalendarHeader from "./calendar-header";
import CalendarView from "./calendar-view";
import { enUS } from "./locales/en";

export interface EventCalendarProps {
  config?: EventCalendarConfigType;
  events: CalendarEventType[];
  isLoading?: boolean;
  onDateRangeChange?: (
    startDate: Date,
    endDate: Date,
    signal?: AbortSignal
  ) => Promise<void>;
}

const defaultConfig: EventCalendarConfigType = {
  defaultView: "month",
  use24HourFormatByDefault: false,
  dayView: {
    viewType: "regular",
    hideHoverLine: false,
    hideTimeline: false,
  },
  weekView: {
    viewType: "regular",
    hideHoverLine: false,
    hideTimeline: false,
  },
  monthView: {
    showOnlyCurrentMonth: false,
    viewType: "basic",
  },
  yearView: {},
  localization: enUS,
};

const EventCalendar: React.FC<EventCalendarProps> = ({
  config,
  events,
  isLoading = false,
  onDateRangeChange,
}) => {
  // Merge default config with provided config
  const currentConfig: EventCalendarConfigType = {
    ...defaultConfig,
    ...config,
    localization: config?.localization || defaultConfig.localization,
  };

  // Navigation states & functions
  const navigation = useCalendarNavigation({
    config: {
      defaultView: currentConfig.defaultView || "month",
      use24HourFormatByDefault: currentConfig.use24HourFormatByDefault || false,
    },
    translations: currentConfig.localization!,
  });

  // Shared States between CalendarHeader & CalendarView
  const [isListView, setIsListView] = useState(false);

  // Extract unique calendar names from events
  const availableCalendars = useMemo(() => {
    const calendars = new Set<string>();
    events.forEach((event) => {
      if (event.calendarName) {
        calendars.add(event.calendarName);
      }
    });
    return Array.from(calendars).sort();
  }, [events]);

  // Track selected calendars (default to all)
  const [selectedCalendars, setSelectedCalendars] = useState<string[]>([]);

  // Update selected calendars when available calendars change
  useEffect(() => {
    setSelectedCalendars((prev) => {
      // If no calendars selected yet, select all available
      if (prev.length === 0 && availableCalendars.length > 0) {
        return availableCalendars;
      }
      // Keep only calendars that are still available
      const stillAvailable = prev.filter((c) => availableCalendars.includes(c));
      // If all were removed, select all available
      if (stillAvailable.length === 0 && availableCalendars.length > 0) {
        return availableCalendars;
      }
      return stillAvailable;
    });
  }, [availableCalendars]);

  // Filter events by calendar
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const calendarMatch = 
        !event.calendarName || // Events without calendar name always show
        selectedCalendars.length === 0 || // If no calendars selected, show all
        selectedCalendars.includes(event.calendarName);
      return calendarMatch;
    });
  }, [events, selectedCalendars]);

  // Swipe Effect for touch devices
  const handlers = useSwipeable({
    onSwipedLeft: () => navigation.handleNext(),
    onSwipedRight: () => navigation.handlePrevious(),
    preventScrollOnSwipe: false,
    trackMouse: false,
    delta: {
      left: 100,
      right: 100,
    },
    swipeDuration: 150,
    touchEventOptions: {
      passive: true,
    },
    trackTouch: true,
  });

  const sharedProps = {
    ...navigation,
    currentConfig,
    isListView,
  };

  return (
    <div {...handlers}>
      <CalendarHeader
        {...sharedProps}
        setIsListView={setIsListView}
        availableCalendars={availableCalendars}
        selectedCalendars={selectedCalendars}
        setSelectedCalendars={setSelectedCalendars}
      />
      <CalendarView
        {...sharedProps}
        is24HourFormat={navigation.use24HourFormat}
        filteredEvents={filteredEvents}
        onDateRangeChange={onDateRangeChange}
        isLoading={isLoading}
      />
    </div>
  );
};

export default EventCalendar;

