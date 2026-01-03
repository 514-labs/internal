import { useEffect, useState } from "react";

interface UseKeyboardNavigationProps {
  handleNext: () => void;
  handlePrevious: () => void;
}

export const useKeyboardNavigation = ({
  handleNext,
  handlePrevious,
}: UseKeyboardNavigationProps) => {
  const [lastKeyPressTime, setLastKeyPressTime] = useState<number>(0);
  const [isKeyHeld, setIsKeyHeld] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle if focus is in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        const currentTime = Date.now();
        if (!isKeyHeld && currentTime - lastKeyPressTime > 200) {
          setIsKeyHeld(true);
          setLastKeyPressTime(currentTime);
          if (event.key === "ArrowLeft") {
            handlePrevious();
          } else {
            handleNext();
          }
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        setIsKeyHeld(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleNext, handlePrevious, isKeyHeld, lastKeyPressTime]);
};


