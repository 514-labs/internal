import { useEffect, useState } from "react";

/**
 * Hook to track the current time position for day/week view timeline
 * Returns the top offset in pixels for the current time indicator
 */
export const useCurrentTimeLine = () => {
  const [currentTimeTop, setCurrentTimeTop] = useState<number>(0);

  useEffect(() => {
    const updateCurrentTimeLine = () => {
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes();
      // 16px per 15 minutes = ~64px per hour
      const top = minutes * (16 / 15);
      setCurrentTimeTop(top);
    };

    updateCurrentTimeLine();
    const interval = setInterval(updateCurrentTimeLine, 60000);

    return () => clearInterval(interval);
  }, []);

  return currentTimeTop;
};


