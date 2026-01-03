import {
  isSameDay,
  isWithinInterval,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  differenceInDays,
} from "date-fns";
import {
  CalendarEventType,
  CalendarViewCategorizedEvents,
  CalendarViewMultiDayEventType,
} from "../types";

export const filterEventsByColors = (
  events: CalendarEventType[],
  selectedColors: string[]
) => {
  return events.filter((event) => selectedColors.includes(event.color));
};

export const getEventsForDay = (
  events: CalendarEventType[],
  date: Date
): CalendarEventType[] => {
  return events.filter((event) => {
    const eventStart = startOfDay(event.startDate);
    const eventEnd = endOfDay(event.endDate);

    return isWithinInterval(date, { start: eventStart, end: eventEnd });
  });
};

export const categorizeEvents = (
  events: CalendarEventType[],
  date: Date
): CalendarViewCategorizedEvents => {
  const dayEvents = getEventsForDay(events, date);

  const allDayEvents: CalendarEventType[] = [];
  const timedEvents: CalendarEventType[] = [];
  const multiDayEvents: CalendarEventType[] = [];

  dayEvents.forEach((event) => {
    const daysDiff = differenceInDays(event.endDate, event.startDate);

    if (daysDiff > 0) {
      multiDayEvents.push(event);
    } else if (event.isAllDay) {
      allDayEvents.push(event);
    } else {
      timedEvents.push(event);
    }
  });

  return { allDayEvents, timedEvents, multiDayEvents };
};

export const getMultiDayEventSpans = (
  events: CalendarEventType[],
  startDate: Date,
  endDate: Date
): CalendarViewMultiDayEventType[] => {
  const spans: CalendarViewMultiDayEventType[] = [];

  events.forEach((event) => {
    const eventStart = startOfDay(event.startDate);
    const eventEnd = startOfDay(event.endDate);
    const totalDays = differenceInDays(eventEnd, eventStart) + 1;

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    days.forEach((day, index) => {
      if (isWithinInterval(day, { start: eventStart, end: eventEnd })) {
        const dayIndex = differenceInDays(day, eventStart) + 1;
        spans.push({
          ...event,
          dayIndex,
          totalDays,
          isStart: isSameDay(day, eventStart),
          isEnd: isSameDay(day, eventEnd),
        });
      }
    });
  });

  return spans;
};

export const searchEvents = (
  events: CalendarEventType[],
  searchTerm: string
): CalendarEventType[] => {
  if (!searchTerm.trim()) {
    return events;
  }

  const term = searchTerm.toLowerCase();
  return events.filter(
    (event) =>
      event.title.toLowerCase().includes(term) ||
      event.description?.toLowerCase().includes(term)
  );
};


