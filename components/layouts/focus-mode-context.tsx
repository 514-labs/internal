"use client";

import * as React from "react";

const FOCUS_MODE_COOKIE_NAME = "focus_mode";
const FOCUS_MODE_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

type FocusModeContextProps = {
  focusMode: boolean;
  setFocusMode: (value: boolean) => void;
  toggleFocusMode: () => void;
  hasSidebars: boolean;
  setHasSidebars: (value: boolean) => void;
};

const FocusModeContext = React.createContext<FocusModeContextProps | null>(
  null
);

export function useFocusMode() {
  const context = React.useContext(FocusModeContext);
  if (!context) {
    throw new Error("useFocusMode must be used within a FocusModeProvider.");
  }
  return context;
}

export function useFocusModeOptional() {
  return React.useContext(FocusModeContext);
}

interface FocusModeProviderProps {
  defaultFocusMode?: boolean;
  children: React.ReactNode;
}

export function FocusModeProvider({
  defaultFocusMode = false,
  children,
}: FocusModeProviderProps) {
  const [focusMode, _setFocusMode] = React.useState(defaultFocusMode);
  const [hasSidebars, setHasSidebars] = React.useState(false);

  const setFocusMode = React.useCallback((value: boolean) => {
    _setFocusMode(value);
    // Persist to cookie
    document.cookie = `${FOCUS_MODE_COOKIE_NAME}=${value}; path=/; max-age=${FOCUS_MODE_COOKIE_MAX_AGE}`;
  }, []);

  const toggleFocusMode = React.useCallback(() => {
    setFocusMode(!focusMode);
  }, [focusMode, setFocusMode]);

  const contextValue = React.useMemo<FocusModeContextProps>(
    () => ({
      focusMode,
      setFocusMode,
      toggleFocusMode,
      hasSidebars,
      setHasSidebars,
    }),
    [focusMode, setFocusMode, toggleFocusMode, hasSidebars]
  );

  return (
    <FocusModeContext.Provider value={contextValue}>
      {children}
    </FocusModeContext.Provider>
  );
}

