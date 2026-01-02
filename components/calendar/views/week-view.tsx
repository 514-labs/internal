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
  endOfWeek,
  format,
  isSameDay,
  isWithinInterval,
  startOfWeek,
} from "date-fns";
import { EventCalendarConfigType, CalendarEventType } from "../types";
import { motion } from "framer-motion";
import { getEventColorClass } from "../constants/event-colors";
import { formatHour, formatEventTime } from "../utils/format-time";
import { useCurrentTimeLine } from "../hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Repeat } from "lucide-react";
import { useRef } from "react";

interface WeekViewProps {
  currentDate: Date;
  currentConfig: EventCalendarConfigType;
  is24HourFormat: boolean;
  filteredEvents: CalendarEventType[];
  isLoading: boolean;
}

const WeekView: React.FC<WeekViewProps> = ({
  filteredEvents,
  currentDate,
  currentConfig,
  is24HourFormat,
  isLoading,
}) => {
  const currentTimeTop = useCurrentTimeLine();
  const currentTimeLineRef = useRef<HTMLDivElement>(null);
  const today = new Date();

  const weekStartsOn = is24HourFormat ? 1 : 0;
  const weekStart = startOfWeek(currentDate, { weekStartsOn });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const hours = Array.from({ length: 24 }, (_, i) => i);

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

  const getEventPosition = (event: CalendarEventType) => {
    const [startHour, startMin] = event.startTime.split(":").map(Number);
    const [endHour, endMin] = event.endTime.split(":").map(Number);

    const top = (startHour * 60 + startMin) * (64 / 60);
    const height =
      ((endHour - startHour) * 60 + (endMin - startMin)) * (64 / 60);

    return { top, height: Math.max(height, 20) };
  };

  const renderEvent = (event: CalendarEventType, index: number) => {
    if (event.isAllDay) return null;

    const { top, height } = getEventPosition(event);

    return (
      <TooltipProvider key={`${event.id}-${index}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="absolute left-0.5 right-0.5 z-10"
              style={{ top: `${top}px`, height: `${height}px` }}
            >
              {event.htmlLink ? (
                <a
                  href={event.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    getEventColorClass(event.color),
                    "block h-full p-1 text-[10px] rounded cursor-pointer overflow-hidden",
                    "hover:opacity-80 transition-opacity"
                  )}
                >
                  <div className="font-semibold truncate flex items-center gap-0.5">
                    {event.isRepeating && (
                      <Repeat className="h-2 w-2 shrink-0" />
                    )}
                    <span className="truncate">{event.title}</span>
                  </div>
                  {height > 30 && (
                    <div className="truncate opacity-80">
                      {formatEventTime(event.startTime, is24HourFormat)}
                    </div>
                  )}
                </a>
              ) : (
                <div
                  className={cn(
                    getEventColorClass(event.color),
                    "h-full p-1 text-[10px] rounded overflow-hidden"
                  )}
                >
                  <div className="font-semibold truncate flex items-center gap-0.5">
                    {event.isRepeating && (
                      <Repeat className="h-2 w-2 shrink-0" />
                    )}
                    <span className="truncate">{event.title}</span>
                  </div>
                  {height > 30 && (
                    <div className="truncate opacity-80">
                      {formatEventTime(event.startTime, is24HourFormat)}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs ">
            <div className="space-y-1">
              <p className="font-semibold">{event.title}</p>
              <p className="text-sm opacity-70">
                {formatEventTime(event.startTime, is24HourFormat)} -{" "}
                {formatEventTime(event.endTime, is24HourFormat)}
              </p>
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

  const getAllDayEvents = (day: Date): CalendarEventType[] => {
    return getEventsForDay(day).filter((event) => event.isAllDay);
  };

  return (
    <Card className="p-2 sm:p-4">
      <ScrollArea className="h-[600px]">
        {/* All-day events section */}
        <div className="grid grid-cols-8 gap-1 mb-2 border-b pb-2">
          <div className="w-12 sm:w-16" />
          {days.map((day) => {
            const allDayEvents = getAllDayEvents(day);
            const isToday = isSameDay(day, today);

            return (
              <div key={day.toString()} className="min-w-0">
                <div
                  className={cn(
                    "text-center text-xs sm:text-sm font-medium mb-1",
                    isToday && "text-primary"
                  )}
                >
                  <span className="hidden sm:inline">{format(day, "EEE")}</span>
                  <span className="sm:hidden">{format(day, "EEEEE")}</span>
                  <span
                    className={cn(
                      "ml-1 inline-flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full",
                      isToday && "bg-primary text-primary-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                </div>
                {allDayEvents.length > 0 && (
                  <div className="space-y-0.5">
                    {allDayEvents.slice(0, 2).map((event, i) => (
                      <div
                        key={event.id}
                        className={cn(
                          getEventColorClass(event.color),
                          "text-[8px] sm:text-[10px] p-0.5 rounded truncate"
                        )}
                      >
                        {event.title}
                      </div>
                    ))}
                    {allDayEvents.length > 2 && (
                      <div className="text-[8px] text-muted-foreground text-center">
                        +{allDayEvents.length - 2}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div className="grid grid-cols-8 gap-1">
          <div className="w-12 sm:w-16">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-16 text-[10px] sm:text-xs text-muted-foreground text-right pr-1 sm:pr-2"
              >
                {formatHour(currentDate, hour, is24HourFormat)}
              </div>
            ))}
          </div>
          {days.map((day) => {
            const dayEvents = getEventsForDay(day).filter(
              (event) => !event.isAllDay
            );
            const isToday = isSameDay(day, today);

            return (
              <div key={day.toString()} className="relative min-w-0">
                {hours.map((hour) => (
                  <div key={hour} className="h-16 border-t border-border/50" />
                ))}
                {isLoading ? (
                  <div className="absolute inset-0 p-1 space-y-1">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  dayEvents.map((event, index) => renderEvent(event, index))
                )}
                {isToday && (
                  <div
                    ref={currentTimeLineRef}
                    className="absolute left-0 right-0 h-0.5 bg-red-500 z-20"
                    style={{ top: `${currentTimeTop}px` }}
                  >
                    <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default WeekView;
