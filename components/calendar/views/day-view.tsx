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
import { format, isSameDay, isWithinInterval } from "date-fns";
import { EventCalendarConfigType, CalendarEventType } from "../types";
import { motion } from "framer-motion";
import { getEventColorClass } from "../constants/event-colors";
import { formatHour, formatEventTime } from "../utils/format-time";
import { useCurrentTimeLine } from "../hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Repeat } from "lucide-react";
import { useRef } from "react";

interface DayViewProps {
  currentDate: Date;
  currentConfig: EventCalendarConfigType;
  is24HourFormat: boolean;
  filteredEvents: CalendarEventType[];
  isLoading: boolean;
}

const DayView: React.FC<DayViewProps> = ({
  filteredEvents,
  currentDate,
  currentConfig,
  is24HourFormat,
  isLoading,
}) => {
  const currentTimeTop = useCurrentTimeLine();
  const currentTimeLineRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  const isToday = isSameDay(currentDate, today);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const dayEvents = filteredEvents.filter((event) => {
    return (
      isSameDay(event.startDate, currentDate) ||
      (event.endDate &&
        isWithinInterval(currentDate, {
          start: event.startDate,
          end: event.endDate,
        }))
    );
  });

  const allDayEvents = dayEvents.filter((event) => event.isAllDay);
  const timedEvents = dayEvents.filter((event) => !event.isAllDay);

  const getEventPosition = (event: CalendarEventType) => {
    const [startHour, startMin] = event.startTime.split(":").map(Number);
    const [endHour, endMin] = event.endTime.split(":").map(Number);

    const top = (startHour * 60 + startMin) * (64 / 60);
    const height =
      ((endHour - startHour) * 60 + (endMin - startMin)) * (64 / 60);

    return { top, height: Math.max(height, 24) };
  };

  const renderEvent = (event: CalendarEventType, index: number) => {
    const { top, height } = getEventPosition(event);

    return (
      <TooltipProvider key={`${event.id}-${index}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="absolute left-16 sm:left-20 right-4 z-10"
              style={{ top: `${top}px`, height: `${height}px` }}
            >
              {event.htmlLink ? (
                <a
                  href={event.htmlLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    getEventColorClass(event.color),
                    "block h-full p-2 text-sm rounded cursor-pointer overflow-hidden",
                    "hover:opacity-80 transition-opacity"
                  )}
                >
                  <div className="font-semibold truncate flex items-center gap-1">
                    {event.isRepeating && (
                      <Repeat className="h-3 w-3 shrink-0" />
                    )}
                    <span className="truncate">{event.title}</span>
                  </div>
                  {height > 40 && (
                    <div className="text-xs opacity-80 mt-0.5">
                      {formatEventTime(event.startTime, is24HourFormat)} -{" "}
                      {formatEventTime(event.endTime, is24HourFormat)}
                    </div>
                  )}
                  {height > 60 && event.description && (
                    <div className="text-xs opacity-70 mt-1 line-clamp-2">
                      {event.description}
                    </div>
                  )}
                </a>
              ) : (
                <div
                  className={cn(
                    getEventColorClass(event.color),
                    "h-full p-2 text-sm rounded overflow-hidden"
                  )}
                >
                  <div className="font-semibold truncate flex items-center gap-1">
                    {event.isRepeating && (
                      <Repeat className="h-3 w-3 shrink-0" />
                    )}
                    <span className="truncate">{event.title}</span>
                  </div>
                  {height > 40 && (
                    <div className="text-xs opacity-80 mt-0.5">
                      {formatEventTime(event.startTime, is24HourFormat)} -{" "}
                      {formatEventTime(event.endTime, is24HourFormat)}
                    </div>
                  )}
                  {height > 60 && event.description && (
                    <div className="text-xs opacity-70 mt-1 line-clamp-2">
                      {event.description}
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
                <p className="text-sm opacity-70">{event.description}</p>
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
      {/* Header */}
      <div className="mb-4 text-center">
        <h2 className="text-lg sm:text-xl font-semibold">
          {format(currentDate, "EEEE, MMMM d, yyyy")}
        </h2>
      </div>

      {/* All-day events */}
      {allDayEvents.length > 0 && (
        <div className="mb-4 border-b pb-4">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            {currentConfig.localization?.allDay || "All Day"}
          </div>
          <div className="space-y-1">
            {allDayEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {event.htmlLink ? (
                  <a
                    href={event.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      getEventColorClass(event.color),
                      "block p-2 rounded hover:opacity-80 transition-opacity"
                    )}
                  >
                    <span className="font-medium">{event.title}</span>
                  </a>
                ) : (
                  <div
                    className={cn(
                      getEventColorClass(event.color),
                      "p-2 rounded"
                    )}
                  >
                    <span className="font-medium">{event.title}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Time grid */}
      <ScrollArea className="h-[500px]">
        <div className="relative">
          {hours.map((hour) => (
            <div key={hour} className="flex h-16">
              <div className="w-14 sm:w-18 text-xs sm:text-sm text-muted-foreground text-right pr-2 sm:pr-4 pt-0">
                {formatHour(currentDate, hour, is24HourFormat)}
              </div>
              <div className="flex-1 border-t border-border/50" />
            </div>
          ))}

          {isLoading ? (
            <div className="absolute top-0 left-16 sm:left-20 right-4 space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-16 w-full mt-32" />
              <Skeleton className="h-20 w-full mt-16" />
            </div>
          ) : (
            timedEvents.map((event, index) => renderEvent(event, index))
          )}

          {isToday && (
            <div
              ref={currentTimeLineRef}
              className="absolute left-14 sm:left-18 right-0 h-0.5 bg-red-500 z-20"
              style={{ top: `${currentTimeTop}px` }}
            >
              <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500" />
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default DayView;
