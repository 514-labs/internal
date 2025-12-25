"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Hook to sync state with URL search parameters
 * @param key - The URL search param key
 * @param defaultValue - Default value if param is not present
 * @returns [value, setValue] tuple similar to useState
 */
export function useUrlState<T extends string | number | null>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL or default value
  const [state, setState] = useState<T>(() => {
    const param = searchParams.get(key);
    if (param === null) {
      return defaultValue;
    }

    // Handle different types
    if (typeof defaultValue === "number") {
      const num = Number(param);
      return (isNaN(num) ? defaultValue : num) as T;
    }

    return param as T;
  });

  // Sync state with URL params when they change externally
  useEffect(() => {
    const param = searchParams.get(key);

    if (param === null) {
      if (state !== defaultValue) {
        setState(defaultValue);
      }
      return;
    }

    let parsedValue: T;
    if (typeof defaultValue === "number") {
      const num = Number(param);
      parsedValue = (isNaN(num) ? defaultValue : num) as T;
    } else {
      parsedValue = param as T;
    }

    if (parsedValue !== state) {
      setState(parsedValue);
    }
  }, [searchParams, key, defaultValue, state]);

  // Update both state and URL
  const setValue = useCallback(
    (value: T) => {
      setState(value);

      // Create new URLSearchParams from current params
      const params = new URLSearchParams(searchParams.toString());

      // Update or remove the param
      if (value === null || value === defaultValue) {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }

      // Update URL without page refresh
      const newUrl = params.toString()
        ? `?${params.toString()}`
        : window.location.pathname;
      router.push(newUrl, { scroll: false });
    },
    [key, defaultValue, router, searchParams]
  );

  return [state, setValue];
}

/**
 * Hook to sync date state with URL search parameters
 * @param key - The URL search param key
 * @param defaultValue - Default date value
 * @returns [value, setValue] tuple
 */
export function useUrlDateState(
  key: string,
  defaultValue: Date | null
): [Date | null, (value: Date | null) => void] {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [state, setState] = useState<Date | null>(() => {
    const param = searchParams.get(key);
    if (param === null) {
      return defaultValue;
    }

    const date = new Date(param);
    return isNaN(date.getTime()) ? defaultValue : date;
  });

  // Sync state with URL params when they change externally
  useEffect(() => {
    const param = searchParams.get(key);

    if (param === null) {
      if (state !== defaultValue) {
        setState(defaultValue);
      }
      return;
    }

    const date = new Date(param);
    const parsedValue = isNaN(date.getTime()) ? defaultValue : date;

    if (parsedValue?.getTime() !== state?.getTime()) {
      setState(parsedValue);
    }
  }, [searchParams, key, defaultValue, state]);

  const setValue = useCallback(
    (value: Date | null) => {
      setState(value);

      const params = new URLSearchParams(searchParams.toString());

      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value.toISOString());
      }

      const newUrl = params.toString()
        ? `?${params.toString()}`
        : window.location.pathname;
      router.push(newUrl, { scroll: false });
    },
    [key, router, searchParams]
  );

  return [state, setValue];
}

