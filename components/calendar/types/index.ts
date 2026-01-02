/**
 * Calendar component types
 * Adapted from react-nextjs-ts reference for read-only calendar
 */

export type CalendarViewType = "day" | "week" | "month" | "year" | "list";

export interface CalendarEventType {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  color: string;
  isRepeating: boolean;
  isAllDay?: boolean;
  htmlLink?: string;
  calendarName?: string;
}

export interface CalendarEventColorType {
  value: string;
  label: string;
  class: string;
}

export interface EventCalendarConfigType {
  defaultView?: CalendarViewType;
  use24HourFormatByDefault?: boolean;
  dayView?: {
    viewType?: "regular" | "resource";
    hideHoverLine?: boolean;
    hideTimeline?: boolean;
  };
  weekView?: {
    viewType?: "regular" | "resource";
    hideHoverLine?: boolean;
    hideTimeline?: boolean;
  };
  monthView?: {
    showOnlyCurrentMonth?: boolean;
    viewType?: "basic" | "detailed";
  };
  yearView?: Record<string, unknown>;
  localization?: EventCalendarTranslations;
}

export interface EventCalendarTranslations {
  // Locale information
  language: string;

  // Time and date
  today: string;
  thisWeek: string;
  thisMonth: string;
  thisYear: string;
  dayNames: string[];
  fullDayNames: string[];
  monthNames: string[];

  // Views
  viewBy: string;
  day: string;
  week: string;
  month: string;
  year: string;
  list: string;

  // Other UI elements
  search: string;
  searchEvents: string;
  noEvents: string;
  allDay: string;
  fullDayEvents: string;
  loadingEvents: string;
  filterByColor: string;
  filter: string;
  more: string;

  // Time format
  use24HourFormat: string;

  // Tooltips
  repeatingEvent: string;
  multiDayEvent: string;
  extendsOutOfRange: string;
  displayCalendar: string;
  displayList: string;

  // Event context
  dayXofY: string;
  starts: string;
  ends: string;
  untitledEvent: string;
}

export interface CalendarViewHeaderViewOption {
  value: CalendarViewType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Month interface for navigation
export interface Month {
  value: number;
  label: string;
}

// Categorized events for views
export interface CalendarViewCategorizedEvents {
  allDayEvents: CalendarEventType[];
  timedEvents: CalendarEventType[];
  multiDayEvents: CalendarEventType[];
}

// Multi-day event span info
export interface CalendarViewMultiDayEventType extends CalendarEventType {
  dayIndex: number;
  totalDays: number;
  isStart: boolean;
  isEnd: boolean;
}

