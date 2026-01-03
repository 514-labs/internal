"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CalendarEventType, CalendarViewType, EventCalendarConfigType } from "./types";
import { useDateRange } from "./hooks";
import { DayView, WeekView, MonthView, YearView, ListView } from "./views";

interface CalendarViewProps {
  currentView: CalendarViewType;
  isListView: boolean;
  animationDirection: "up" | "down";
  currentDate: Date;
  filteredEvents: CalendarEventType[];
  currentConfig: EventCalendarConfigType;
  isLoading: boolean;
  is24HourFormat: boolean;
  setCurrentDate: React.Dispatch<React.SetStateAction<Date>>;
  setCurrentView: React.Dispatch<React.SetStateAction<CalendarViewType>>;
  onDateRangeChange?: (
    startDate: Date,
    endDate: Date,
    signal?: AbortSignal
  ) => Promise<void>;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  currentView,
  isListView,
  animationDirection,
  currentDate,
  filteredEvents,
  currentConfig,
  isLoading,
  is24HourFormat,
  setCurrentDate,
  setCurrentView,
  onDateRangeChange,
}) => {
  useDateRange({
    currentView,
    currentDate,
    onDateRangeChange,
    is24HourFormat,
  });

  const baseProps = {
    filteredEvents,
    currentDate,
    currentConfig,
    is24HourFormat,
    isLoading,
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${currentView}-${currentDate.toISOString()}`}
        initial={{
          opacity: 0,
          y: animationDirection === "up" ? -20 : animationDirection === "down" ? 20 : 0,
        }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{
          opacity: 0,
          y: animationDirection === "up" ? 20 : animationDirection === "down" ? -20 : 0,
        }}
        transition={{ duration: 0.1 }}
        className="h-full"
      >
        {isListView ? (
          <ListView {...baseProps} />
        ) : (
          <>
            {currentView === "day" && <DayView {...baseProps} />}
            {currentView === "week" && <WeekView {...baseProps} />}
            {currentView === "month" && <MonthView {...baseProps} />}
            {currentView === "year" && (
              <YearView
                {...baseProps}
                setCurrentDate={setCurrentDate}
                setCurrentView={setCurrentView}
              />
            )}
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default CalendarView;


