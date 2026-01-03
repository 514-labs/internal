"use client";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format, isSameDay, isWithinInterval, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { EventCalendarConfigType, CalendarEventType } from "../types";
import { motion } from "framer-motion";
import { getEventColorClass } from "../constants/event-colors";
import { formatEventTime } from "../utils/format-time";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Repeat, Search, Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";

interface ListViewProps {
  currentDate: Date;
  currentConfig: EventCalendarConfigType;
  is24HourFormat: boolean;
  filteredEvents: CalendarEventType[];
  isLoading: boolean;
}

const ListView: React.FC<ListViewProps> = ({
  filteredEvents,
  currentDate,
  currentConfig,
  is24HourFormat,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get all events in the current month
  const monthEvents = filteredEvents.filter((event) => {
    return (
      isWithinInterval(event.startDate, { start: monthStart, end: monthEnd }) ||
      (event.endDate &&
        isWithinInterval(event.endDate, { start: monthStart, end: monthEnd })) ||
      (event.endDate &&
        event.startDate <= monthStart &&
        event.endDate >= monthEnd)
    );
  });

  // Filter by search term
  const searchedEvents = searchTerm
    ? monthEvents.filter(
        (event) =>
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : monthEvents;

  // Group events by day
  const eventsByDay = daysInMonth
    .map((day) => {
      const dayEvents = searchedEvents.filter((event) => {
        return (
          isSameDay(event.startDate, day) ||
          (event.endDate &&
            isWithinInterval(day, {
              start: event.startDate,
              end: event.endDate,
            }))
        );
      });
      return { day, events: dayEvents };
    })
    .filter((group) => group.events.length > 0);

  const today = new Date();

  return (
    <Card className="p-4">
      {/* Search input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={currentConfig.localization?.searchEvents || "Search events..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold">
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {searchedEvents.length} event{searchedEvents.length !== 1 ? "s" : ""}{" "}
          {searchTerm && `matching "${searchTerm}"`}
        </p>
      </div>

      <ScrollArea className="h-[500px]">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        ) : eventsByDay.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <CalendarIcon className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">
              {currentConfig.localization?.noEvents || "No events"}
            </p>
            <p className="text-sm">
              {searchTerm
                ? `No events match "${searchTerm}"`
                : "No events scheduled for this month"}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {eventsByDay.map(({ day, events }, groupIndex) => {
              const isToday = isSameDay(day, today);

              return (
                <motion.div
                  key={day.toString()}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIndex * 0.03 }}
                >
                  <div
                    className={cn(
                      "text-sm font-semibold mb-2 pb-1 border-b",
                      isToday && "text-primary"
                    )}
                  >
                    {format(day, "EEEE, MMMM d")}
                    {isToday && (
                      <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                        Today
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {events.map((event, eventIndex) => (
                      <motion.div
                        key={`${event.id}-${eventIndex}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: eventIndex * 0.02 }}
                        className={cn(
                          getEventColorClass(event.color),
                          "p-3 rounded-lg"
                        )}
                      >
                        {event.htmlLink ? (
                          <a
                            href={event.htmlLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block hover:opacity-80 transition-opacity"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold flex items-center gap-1.5">
                                  {event.isRepeating && (
                                    <Repeat className="h-3.5 w-3.5 shrink-0" />
                                  )}
                                  <span className="truncate">{event.title}</span>
                                </div>
                                <div className="text-sm opacity-80 mt-0.5">
                                  {event.isAllDay
                                    ? currentConfig.localization?.allDay || "All day"
                                    : `${formatEventTime(
                                        event.startTime,
                                        is24HourFormat
                                      )} - ${formatEventTime(
                                        event.endTime,
                                        is24HourFormat
                                      )}`}
                                </div>
                                {event.description && (
                                  <div className="text-sm opacity-70 mt-1 line-clamp-2">
                                    {event.description}
                                  </div>
                                )}
                              </div>
                              <ExternalLink className="h-4 w-4 shrink-0 opacity-60" />
                            </div>
                          </a>
                        ) : (
                          <div>
                            <div className="font-semibold flex items-center gap-1.5">
                              {event.isRepeating && (
                                <Repeat className="h-3.5 w-3.5 shrink-0" />
                              )}
                              <span className="truncate">{event.title}</span>
                            </div>
                            <div className="text-sm opacity-80 mt-0.5">
                              {event.isAllDay
                                ? currentConfig.localization?.allDay || "All day"
                                : `${formatEventTime(
                                    event.startTime,
                                    is24HourFormat
                                  )} - ${formatEventTime(
                                    event.endTime,
                                    is24HourFormat
                                  )}`}
                            </div>
                            {event.description && (
                              <div className="text-sm opacity-70 mt-1 line-clamp-2">
                                {event.description}
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};

export default ListView;


