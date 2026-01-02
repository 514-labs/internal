import { format, setHours } from "date-fns";

export const formatHour = (
  currentDate: Date,
  hour: number,
  is24HourFormat?: boolean
) => {
  if (is24HourFormat) {
    return format(setHours(currentDate, hour), "HH:mm");
  }
  return format(setHours(currentDate, hour), "h a").toLowerCase();
};

export const formatEventTime = (
  time: string,
  is24HourFormat: boolean
): string => {
  if (is24HourFormat) {
    return time;
  }

  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "pm" : "am";
  const displayHours = hours % 12 || 12;

  if (minutes === 0) {
    return `${displayHours}${period}`;
  }

  return `${displayHours}:${minutes.toString().padStart(2, "0")}${period}`;
};

export const formatTimeRange = (
  startTime: string,
  endTime: string,
  is24HourFormat: boolean
): string => {
  return `${formatEventTime(startTime, is24HourFormat)} - ${formatEventTime(endTime, is24HourFormat)}`;
};


