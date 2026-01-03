"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfMonth,
} from "date-fns";
import { EventCalendarConfigType, CalendarEventType } from "../types";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

interface YearViewProps {
  currentDate: Date;
  currentConfig: EventCalendarConfigType;
  is24HourFormat: boolean;
  filteredEvents: CalendarEventType[];
  isLoading: boolean;
  setCurrentDate?: React.Dispatch<React.SetStateAction<Date>>;
  setCurrentView?: React.Dispatch<React.SetStateAction<"day" | "week" | "month" | "year" | "list">>;
}

const YearView: React.FC<YearViewProps> = ({
  filteredEvents,
  currentDate,
  currentConfig,
  isLoading,
  setCurrentDate,
  setCurrentView,
}) => {
  const year = currentDate.getFullYear();
  const today = new Date();
  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
  const dayNames = currentConfig.localization?.dayNames || [
    "S",
    "M",
    "T",
    "W",
    "T",
    "F",
    "S",
  ];

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

  const handleMonthClick = (monthDate: Date) => {
    if (setCurrentDate && setCurrentView) {
      setCurrentDate(monthDate);
      setCurrentView("month");
    }
  };

  const renderMonth = (monthDate: Date, monthIndex: number) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDay = getDay(monthStart);

    const paddingDays = Array.from({ length: startDay }, (_, i) => (
      <div key={`padding-${i}`} className="w-5 h-5 sm:w-6 sm:h-6" />
    ));

    return (
      <motion.div
        key={monthIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: monthIndex * 0.03 }}
      >
        <Card className="p-2 sm:p-3">
          <h3
            className={cn(
              "text-sm font-semibold mb-2 text-center",
              setCurrentDate && setCurrentView && "cursor-pointer hover:text-primary"
            )}
            onClick={() => handleMonthClick(monthDate)}
          >
            {format(monthDate, "MMMM")}
          </h3>
          <div className="grid grid-cols-7 gap-0.5">
            {dayNames.map((day, i) => (
              <div
                key={i}
                className="w-5 h-4 sm:w-6 sm:h-5 text-[8px] sm:text-[10px] text-muted-foreground text-center"
              >
                {day.charAt(0)}
              </div>
            ))}
            {paddingDays}
            {isLoading ? (
              <div className="col-span-7">
                <Skeleton className="h-20 w-full" />
              </div>
            ) : (
              days.map((day) => {
                const dayEvents = getEventsForDay(day);
                const hasEvents = dayEvents.length > 0;
                const isCurrentDay = isSameDay(day, today);
                const isCurrentMonth = isSameMonth(day, monthDate);

                return (
                  <TooltipProvider key={day.toString()}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "w-5 h-5 sm:w-6 sm:h-6 text-[10px] sm:text-xs flex items-center justify-center rounded-sm relative",
                            !isCurrentMonth && "text-muted-foreground/50",
                            isCurrentDay &&
                              "bg-primary text-primary-foreground font-bold",
                            hasEvents &&
                              !isCurrentDay &&
                              "font-semibold"
                          )}
                        >
                          {format(day, "d")}
                          {hasEvents && !isCurrentDay && (
                            <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                          )}
                        </div>
                      </TooltipTrigger>
                      {hasEvents && (
                        <TooltipContent side="right" className="max-w-xs">
                          <div className="space-y-1">
                            <p className="font-medium text-sm">
                              {format(day, "EEEE, MMMM d")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {dayEvents.length} event
                              {dayEvents.length !== 1 ? "s" : ""}
                            </p>
                            <div className="space-y-0.5 max-h-32 overflow-auto">
                              {dayEvents.slice(0, 5).map((event, i) => (
                                <div
                                  key={i}
                                  className="text-xs truncate"
                                >
                                  {event.title}
                                </div>
                              ))}
                              {dayEvents.length > 5 && (
                                <div className="text-xs text-muted-foreground">
                                  +{dayEvents.length - 5} more
                                </div>
                              )}
                            </div>
                          </div>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                );
              })
            )}
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
      {months.map((month, index) => renderMonth(month, index))}
    </div>
  );
};

export default YearView;


