import { CalendarEventColorType } from "../types";

export const EVENT_COLOR_OPTIONS: CalendarEventColorType[] = [
  {
    value: "blue",
    label: "Blue",
    class: "bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200",
  },
  {
    value: "green",
    label: "Green",
    class: "bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200",
  },
  {
    value: "yellow",
    label: "Yellow",
    class:
      "bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200",
  },
  {
    value: "purple",
    label: "Purple",
    class:
      "bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200",
  },
  {
    value: "red",
    label: "Red",
    class: "bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200",
  },
  {
    value: "indigo",
    label: "Indigo",
    class:
      "bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200",
  },
  {
    value: "pink",
    label: "Pink",
    class: "bg-pink-200 dark:bg-pink-800 text-pink-800 dark:text-pink-200",
  },
  {
    value: "gray",
    label: "Gray",
    class: "bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
  },
  {
    value: "orange",
    label: "Orange",
    class:
      "bg-orange-200 dark:bg-orange-900 text-orange-800 dark:text-orange-200",
  },
] as const;

export function getEventColorClass(colorValue: string): string {
  const color = EVENT_COLOR_OPTIONS.find((c) => c.value === colorValue);
  return color?.class || EVENT_COLOR_OPTIONS[0].class;
}


