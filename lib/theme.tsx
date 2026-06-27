"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggle: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const stored = (localStorage.getItem("ces_theme") as Theme | null) ?? "light";
    setThemeState(stored);
    document.documentElement.classList.toggle("dark", stored === "dark");
  }, []);

  const apply = useCallback((t: Theme) => {
    document.documentElement.classList.toggle("dark", t === "dark");
    localStorage.setItem("ces_theme", t);
    setThemeState(t);
  }, []);

  const toggle = useCallback(() => {
    apply(document.documentElement.classList.contains("dark") ? "light" : "dark");
  }, [apply]);

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme: apply }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
