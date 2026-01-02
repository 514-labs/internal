import { Dispatch, SetStateAction, useState } from "react";
import {
  addDays,
  subMonths,
  addMonths,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  format,
} from "date-fns";
import { CalendarViewType, Month, EventCalendarTranslations } from "../types";

interface UseCalendarNavigationProps {
  config: {
    defaultView: CalendarViewType;
    use24HourFormatByDefault: boolean;
  };
  translations: EventCalendarTranslations;
}

interface UseCalendarNavigationReturn {
  currentDate: Date;
  setCurrentDate: Dispatch<SetStateAction<Date>>;
  currentView: CalendarViewType;
  setCurrentView: Dispatch<SetStateAction<CalendarViewType>>;
  handleNext: () => void;
  handlePrevious: () => void;
  animationDirection: "up" | "down";
  lastUpdated: "day" | "month" | "year" | null;
  setLastUpdated: (value: "day" | "month" | "year" | null) => void;
  handleTodayClick: () => void;
  handleYearChange: (year: number) => void;
  handleMonthChange: (month: Month) => void;
  handleDayChange: (date: Date) => void;
  use24HourFormat: boolean;
  setUse24HourFormat: (use24Hour: boolean) => void;
  isTimeFormatChanging: boolean;
  toggleTimeFormat: () => void;
  months: Month[];
}

export const useCalendarNavigation = ({
  config,
  translations,
}: UseCalendarNavigationProps): UseCalendarNavigationReturn => {
  const months = translations.monthNames.map((name, index) => ({
    label: name,
    value: format(new Date(2000, index), "MMM").toLowerCase(),
  }));

  // Basic states
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });
  const [currentView, setCurrentView] = useState<CalendarViewType>(
    config.defaultView
  );
  const [animationDirection, setAnimationDirection] = useState<"up" | "down">(
    "down"
  );
  const [lastUpdated, setLastUpdated] = useState<
    "day" | "month" | "year" | null
  >(null);
  const [use24HourFormat, setUse24HourFormat] = useState(
    config.use24HourFormatByDefault
  );
  const [isTimeFormatChanging, setIsTimeFormatChanging] = useState(false);

  // Navigation handlers
  const handlePrevious = () => {
    setAnimationDirection("up");

    switch (currentView) {
      case "day":
        setCurrentDate(addDays(currentDate, -1));
        setLastUpdated("day");
        break;
      case "week":
        setCurrentDate(addDays(currentDate, -7));
        setLastUpdated("day");
        break;
      case "month":
        setCurrentDate(subMonths(currentDate, 1));
        setLastUpdated("month");
        break;
      case "year":
        setCurrentDate(
          new Date(currentDate.getFullYear() - 1, currentDate.getMonth())
        );
        setLastUpdated("year");
        break;
    }
  };

  const handleNext = () => {
    setAnimationDirection("down");

    switch (currentView) {
      case "day":
        setCurrentDate(addDays(currentDate, 1));
        setLastUpdated("day");
        break;
      case "week":
        setCurrentDate(addDays(currentDate, 7));
        setLastUpdated("day");
        break;
      case "month":
        setCurrentDate(addMonths(currentDate, 1));
        setLastUpdated("month");
        break;
      case "year":
        setCurrentDate(
          new Date(currentDate.getFullYear() + 1, currentDate.getMonth())
        );
        setLastUpdated("year");
        break;
    }
  };

  // View change handlers
  const handleYearChange = (year: number) => {
    setCurrentDate(new Date(year, currentDate.getMonth()));
    setLastUpdated("year");
  };

  const handleMonthChange = (selectedMonth: Month) => {
    const monthIndex = months.findIndex(
      (month) => month.value === selectedMonth.value
    );
    setCurrentDate(new Date(currentDate.getFullYear(), monthIndex));
    setLastUpdated("month");
  };

  const handleDayChange = (selectedDate: Date) => {
    setCurrentDate(selectedDate);
    setLastUpdated("day");
  };

  const handleTodayClick = () => {
    const today = new Date();
    let newDate;

    switch (currentView) {
      case "day":
        newDate = startOfDay(today);
        break;
      case "week":
        newDate = startOfWeek(today, { weekStartsOn: use24HourFormat ? 1 : 0 });
        break;
      case "month":
        newDate = startOfMonth(today);
        break;
      case "year":
        newDate = startOfYear(today);
        break;
      default:
        newDate = startOfDay(today);
    }

    setCurrentDate(newDate);
    setLastUpdated("day");
  };

  // Toggling
  const toggleTimeFormat = () => {
    setIsTimeFormatChanging(true);
    setUse24HourFormat((prevFormat) => !prevFormat);
    setTimeout(() => {
      setIsTimeFormatChanging(false);
    }, 300);
  };

  return {
    currentDate,
    setCurrentDate,
    currentView,
    setCurrentView,
    handleNext,
    handlePrevious,
    animationDirection,
    lastUpdated,
    setLastUpdated,
    handleTodayClick,
    handleYearChange,
    handleMonthChange,
    handleDayChange,
    use24HourFormat,
    setUse24HourFormat,
    isTimeFormatChanging,
    toggleTimeFormat,
    months,
  };
};


