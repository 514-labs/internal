import { useCallback, useEffect, useRef } from "react";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isSameDay,
  isSameWeek,
  isSameMonth,
  isSameYear,
} from "date-fns";
import { CalendarViewType } from "../types";

interface UseDateRangeProps {
  currentView: CalendarViewType;
  currentDate: Date;
  onDateRangeChange?: (
    startDate: Date,
    endDate: Date,
    signal?: AbortSignal
  ) => Promise<void>;
  is24HourFormat?: boolean;
}

export const useDateRange = ({
  currentView,
  currentDate,
  onDateRangeChange,
  is24HourFormat,
}: UseDateRangeProps) => {
  const previousDateRef = useRef<Date | null>(null);
  const previousViewRef = useRef<CalendarViewType | null>(null);
  const isInitialFetchRef = useRef(true);

  const getDateRange = useCallback(() => {
    let startDate: Date;
    let endDate: Date;

    switch (currentView) {
      case "day":
        startDate = startOfDay(currentDate);
        endDate = endOfDay(currentDate);
        break;
      case "week":
        startDate = startOfWeek(currentDate, {
          weekStartsOn: is24HourFormat ? 1 : 0,
        });
        endDate = endOfWeek(currentDate, {
          weekStartsOn: is24HourFormat ? 1 : 0,
        });
        break;
      case "month":
        startDate = startOfMonth(currentDate);
        endDate = endOfMonth(currentDate);
        break;
      case "year":
        startDate = startOfYear(currentDate);
        endDate = endOfYear(currentDate);
        break;
      case "list":
        // For list view, show current month
        startDate = startOfMonth(currentDate);
        endDate = endOfMonth(currentDate);
        break;
      default:
        startDate = startOfDay(currentDate);
        endDate = endOfDay(currentDate);
    }

    return { startDate, endDate };
  }, [currentView, currentDate, is24HourFormat]);

  const shouldUpdateDateRange = useCallback(() => {
    // Always fetch on initial load
    if (isInitialFetchRef.current) {
      return true;
    }

    // Fetch if view changed
    if (currentView !== previousViewRef.current) {
      return true;
    }

    const prevDate = previousDateRef.current;
    if (!prevDate) {
      return true;
    }

    switch (currentView) {
      case "day":
        return !isSameDay(currentDate, prevDate);
      case "week":
        return !isSameWeek(currentDate, prevDate, {
          weekStartsOn: is24HourFormat ? 1 : 0,
        });
      case "month":
      case "list":
        return !isSameMonth(currentDate, prevDate);
      case "year":
        return !isSameYear(currentDate, prevDate);
      default:
        return true;
    }
  }, [currentView, currentDate, is24HourFormat]);

  useEffect(() => {
    const updateDateRange = async () => {
      if (!onDateRangeChange) return;

      if (shouldUpdateDateRange()) {
        const { startDate, endDate } = getDateRange();
        await onDateRangeChange(startDate, endDate);

        previousDateRef.current = currentDate;
        previousViewRef.current = currentView;
        isInitialFetchRef.current = false;
      }
    };

    updateDateRange();
  }, [
    currentView,
    currentDate,
    onDateRangeChange,
    getDateRange,
    shouldUpdateDateRange,
  ]);

  return { getDateRange };
};

