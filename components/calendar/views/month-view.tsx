"use client";

import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { EventCalendarConfigType, CalendarEventType } from "../types";
import { motion } from "framer-motion";
import { getEventColorClass } from "../constants/event-colors";
import { formatEventTime } from "../utils/format-time";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Repeat } from "lucide-react";

interface MonthViewProps {
  currentDate: Date;
  currentConfig: EventCalendarConfigType;
  is24HourFormat: boolean;
  filteredEvents: CalendarEventType[];
  isLoading: boolean;
}

const MonthView: React.FC<MonthViewProps> = ({
  filteredEvents,
  currentDate,
  currentConfig,
  is24HourFormat,
  isLoading,
}) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const showOnlyCurrentMonth = currentConfig.monthView?.showOnlyCurrentMonth;
  const firstDayOfMonth = getDay(monthStart);
  const today = new Date();

  const baseWeekDays = currentConfig.localization!.dayNames;

  let dateRange: Date[];
  let adjustedWeekdays: string[];

  if (showOnlyCurrentMonth) {
    dateRange = eachDayOfInterval({ start: monthStart, end: monthEnd });
    adjustedWeekdays = [
      ...baseWeekDays.slice(firstDayOfMonth),
      ...baseWeekDays.slice(0, firstDayOfMonth),
    ];
  } else {
    const weekStartsOn = is24HourFormat ? 1 : 0;
    const calendarStart = startOfWeek(monthStart, { weekStartsOn });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn });
    dateRange = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    adjustedWeekdays = is24HourFormat
      ? [...baseWeekDays.slice(1), baseWeekDays[0]]
      : baseWeekDays;
  }

  const getEventsForDay = (day: Date): CalendarEventType[] => {
    return filteredEvents.filter((event) => {
      return (
        isSameDay(event.startDate, day) ||
        (event.endDate &&
          isWithinInterval(day, {
            start: event.startDate,
            end: event.endDate,
          }))
      );
    });
  };

  const renderEventItem = (event: CalendarEventType, index: number) => {
    const isMultiDay = !isSameDay(event.startDate, event.endDate);

    return (
      <TooltipProvider key={`${event.id}-${index}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              {event.htmlLink ? (
                <a
                  href={event.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    getEventColorClass(event.color),
                    "block p-1 text-[8px] h-8 sm:h-10 sm:text-xs rounded mb-1 cursor-pointer",
                    "transition-colors duration-200",
                    "hover:opacity-80"
                  )}
                >
                  <div className="font-semibold truncate flex items-center gap-1">
                    {event.isRepeating && (
                      <Repeat className="h-2 w-2 sm:h-3 sm:w-3 shrink-0" />
                    )}
                    <span className="truncate">
                      {event.title || "Untitled Event"}
                    </span>
                  </div>
                  {!isMultiDay && !event.isAllDay && (
                    <div className="hidden sm:block truncate text-[10px] opacity-80">
                      {formatEventTime(event.startTime, is24HourFormat)}
                    </div>
                  )}
                </a>
              ) : (
                <div
                  className={cn(
                    getEventColorClass(event.color),
                    "p-1 text-[8px] h-8 sm:h-10 sm:text-xs rounded mb-1",
                    "transition-colors duration-200"
                  )}
                >
                  <div className="font-semibold truncate flex items-center gap-1">
                    {event.isRepeating && (
                      <Repeat className="h-2 w-2 sm:h-3 sm:w-3 shrink-0" />
                    )}
                    <span className="truncate">
                      {event.title || "Untitled Event"}
                    </span>
                  </div>
                  {!isMultiDay && !event.isAllDay && (
                    <div className="hidden sm:block truncate text-[10px] opacity-80">
                      {formatEventTime(event.startTime, is24HourFormat)}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-semibold">{event.title}</p>
              {event.isAllDay ? (
                <p className="text-sm opacity-70">All day</p>
              ) : (
                <p className="text-sm opacity-70">
                  {formatEventTime(event.startTime, is24HourFormat)} -{" "}
                  {formatEventTime(event.endTime, is24HourFormat)}
                </p>
              )}
              {event.description && (
                <p className="text-sm opacity-70 line-clamp-2">
                  {event.description}
                </p>
              )}
              {event.htmlLink && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  Open in Google Calendar
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <Card className="p-2 sm:p-4">
      <ScrollArea>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {adjustedWeekdays.map((day) => (
            <div
              key={day}
              className="text-center font-medium text-xs sm:text-sm py-2"
            >
              {day}
            </div>
          ))}
          {dateRange.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentDate);

            if (showOnlyCurrentMonth && !isCurrentMonth) {
              return <div key={day.toString()} />;
            }

            const dayEvents = getEventsForDay(day);
            const isToday = isSameDay(day, today);
            const visibleEvents = dayEvents.slice(0, 2);
            const remainingCount = dayEvents.length - 2;

            return (
              <div
                key={day.toString()}
                className={cn(
                  "p-1 sm:p-2 min-h-[80px] sm:min-h-[120px] border rounded relative group flex flex-col",
                  !isCurrentMonth && !showOnlyCurrentMonth && "bg-muted/50"
                )}
              >
                <div
                  className={cn(
                    "font-semibold mb-1 w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs sm:text-sm",
                    isToday && "bg-primary text-primary-foreground rounded-full"
                  )}
                >
                  {format(day, "d")}
                </div>
                <div className="flex-grow overflow-hidden space-y-0.5">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-8 sm:h-10 w-full rounded" />
                      <Skeleton className="h-8 sm:h-10 w-full rounded" />
                    </>
                  ) : (
                    <>
                      {visibleEvents.map((event, index) =>
                        renderEventItem(event, index)
                      )}
                      {remainingCount > 0 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-[10px] sm:text-xs text-muted-foreground hover:text-foreground cursor-pointer text-center py-1">
                                +{remainingCount}{" "}
                                {currentConfig.localization?.more || "more"}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              <div className="space-y-1">
                                {dayEvents.slice(2).map((event, i) => (
                                  <div key={i} className="text-sm">
                                    <span className="font-medium">
                                      {event.title}
                                    </span>
                                    {!event.isAllDay && (
                                      <span className="text-muted-foreground ml-2">
                                        {formatEventTime(
                                          event.startTime,
                                          is24HourFormat
                                        )}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default MonthView;
