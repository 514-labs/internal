"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  List,
  Columns,
  Grid,
  LayoutGrid,
  Calendar as CalendarIcon,
  Filter,
  Check,
} from "lucide-react";
import { CalendarViewType, Month, EventCalendarConfigType } from "./types";
import { useKeyboardNavigation } from "./hooks";
import { useState } from "react";

interface CalendarHeaderProps {
  currentDate: Date;
  currentView: CalendarViewType;
  handlePrevious: () => void;
  handleNext: () => void;
  handleTodayClick: () => void;
  toggleTimeFormat: () => void;
  setCurrentView: React.Dispatch<React.SetStateAction<CalendarViewType>>;
  isTimeFormatChanging: boolean;
  use24HourFormat: boolean;
  lastUpdated: "day" | "month" | "year" | null;
  animationDirection: "up" | "down";
  months: Month[];
  handleDayChange: (date: Date) => void;
  handleMonthChange: (month: Month) => void;
  handleYearChange: (year: number) => void;
  currentConfig: EventCalendarConfigType;
  isListView: boolean;
  setIsListView: React.Dispatch<React.SetStateAction<boolean>>;
  availableCalendars: string[];
  selectedCalendars: string[];
  setSelectedCalendars: React.Dispatch<React.SetStateAction<string[]>>;
}

const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  currentView,
  handlePrevious,
  handleNext,
  handleTodayClick,
  toggleTimeFormat,
  setCurrentView,
  use24HourFormat,
  months,
  handleMonthChange,
  handleYearChange,
  currentConfig,
  isListView,
  setIsListView,
  availableCalendars,
  selectedCalendars,
  setSelectedCalendars,
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useKeyboardNavigation({ handleNext, handlePrevious });

  const viewOptions = [
    { value: "day" as CalendarViewType, label: currentConfig.localization!.day, icon: List },
    { value: "week" as CalendarViewType, label: currentConfig.localization!.week, icon: Columns },
    { value: "month" as CalendarViewType, label: currentConfig.localization!.month, icon: Grid },
    { value: "year" as CalendarViewType, label: currentConfig.localization!.year, icon: LayoutGrid },
  ];

  const toggleCalendarSelection = (calendar: string) => {
    setSelectedCalendars((prev) =>
      prev.includes(calendar) ? prev.filter((c) => c !== calendar) : [...prev, calendar]
    );
  };

  const hasActiveFilters = selectedCalendars.length < availableCalendars.length;

  const isTodayDisabled = () => {
    const today = new Date();
    switch (currentView) {
      case "day":
        return format(currentDate, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
      case "week":
        return format(currentDate, "yyyy-ww") === format(today, "yyyy-ww");
      case "month":
        return format(currentDate, "yyyy-MM") === format(today, "yyyy-MM");
      case "year":
        return currentDate.getFullYear() === today.getFullYear();
      default:
        return false;
    }
  };

  const getTodayButtonText = () => {
    switch (currentView) {
      case "day":
        return currentConfig.localization!.today;
      case "week":
        return currentConfig.localization!.thisWeek;
      case "month":
        return currentConfig.localization!.thisMonth;
      case "year":
        return currentConfig.localization!.thisYear;
      default:
        return currentConfig.localization!.today;
    }
  };

  const getDateDisplay = () => {
    switch (currentView) {
      case "day":
        return format(currentDate, "MMMM d, yyyy");
      case "week":
        return format(currentDate, "MMMM yyyy");
      case "month":
        return format(currentDate, "MMMM yyyy");
      case "year":
        return format(currentDate, "yyyy");
      default:
        return format(currentDate, "MMMM yyyy");
    }
  };

  const currentMonth = months.find(
    (m) => m.value === format(currentDate, "MMM").toLowerCase()
  );

  const years = Array.from({ length: 11 }, (_, i) => currentDate.getFullYear() - 5 + i);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
      {/* Left side - Navigation */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={handlePrevious}>
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          {currentView !== "year" && (
            <Select
              value={currentMonth?.value}
              onValueChange={(value) => {
                const month = months.find((m) => m.value === value);
                if (month) handleMonthChange(month);
              }}
            >
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select
            value={currentDate.getFullYear().toString()}
            onValueChange={(value) => handleYearChange(parseInt(value))}
          >
            <SelectTrigger className="w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="icon" onClick={handleNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Right side - Controls */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {/* Time format toggle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 px-2">
                <span className="text-xs text-muted-foreground">12h</span>
                <Switch
                  checked={use24HourFormat}
                  onCheckedChange={toggleTimeFormat}
                  className="data-[state=checked]:bg-primary"
                />
                <span className="text-xs text-muted-foreground">24h</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {currentConfig.localization?.use24HourFormat}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Filter */}
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "gap-1",
                hasActiveFilters && "border-primary"
              )}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">
                {currentConfig.localization?.filter}
              </span>
              {hasActiveFilters && (
                <span className="text-xs bg-primary text-primary-foreground rounded-full px-1.5">
                  {selectedCalendars.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2">
            {/* Calendars section */}
            {availableCalendars.length > 0 ? (
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 mb-2">
                  Calendars
                </div>
                <div className="space-y-1">
                  {availableCalendars.map((calendar) => (
                    <button
                      key={calendar}
                      onClick={() => toggleCalendarSelection(calendar)}
                      className={cn(
                        "flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm hover:bg-muted transition-colors",
                        selectedCalendars.includes(calendar) && "bg-muted"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded",
                        calendar.toLowerCase().includes("work") ? "bg-blue-500" :
                        calendar.toLowerCase().includes("goal") ? "bg-purple-500" :
                        "bg-gray-500"
                      )} />
                      <span className="flex-1 text-left truncate">{calendar}</span>
                      {selectedCalendars.includes(calendar) && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground px-2 py-4 text-center">
                No calendars available
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Today button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleTodayClick}
          disabled={isTodayDisabled()}
        >
          {getTodayButtonText()}
        </Button>

        {/* List/Calendar toggle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsListView(!isListView)}
              >
                {isListView ? (
                  <CalendarIcon className="h-4 w-4" />
                ) : (
                  <List className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isListView
                ? currentConfig.localization?.displayCalendar
                : currentConfig.localization?.displayList}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* View selector */}
        <Select
          value={currentView}
          onValueChange={(value) => setCurrentView(value as CalendarViewType)}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {viewOptions.map((option) => {
              const Icon = option.icon;
              return (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default CalendarHeader;

