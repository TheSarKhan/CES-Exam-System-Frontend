"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type Severity = "WARNING" | "CRITICAL" | "LOGGED";

export interface ACViolation {
  type: string;
  label: string;
  severity: Severity;
  at: number;
}

interface Options {
  enabled?: boolean;
  limit?: number;
  inactivityMs?: number;
  onTerminate?: (violations: ACViolation[]) => void;
}

/**
 * Anti-cheat monitor for the exam screen.
 * - "Strike" events (tab switch, window blur, fullscreen exit) escalate and
 *   auto-terminate after `limit` strikes (default 3, admin-configurable).
 * - Other events (copy/paste/right-click/devtools/refresh/offline/inactivity)
 *   are logged with a timestamp but do not by themselves terminate the exam.
 */
export function useAntiCheat({
  enabled = true,
  limit = 3,
  inactivityMs = 120000,
  onTerminate,
}: Options) {
  const [violations, setViolations] = useState<ACViolation[]>([]);
  const [count, setCount] = useState(0);
  const [warning, setWarning] = useState<{ label: string; severity: Severity } | null>(null);
  const [terminated, setTerminated] = useState(false);

  const countRef = useRef(0);
  const terminatedRef = useRef(false);
  const onTerminateRef = useRef(onTerminate);
  onTerminateRef.current = onTerminate;
  const allRef = useRef<ACViolation[]>([]);
  // Tracks whether the user is currently *outside* the exam window. Leaving
  // fires several native events for one action (a tab switch triggers both
  // `visibilitychange` and `blur`), so we count one strike on the transition
  // into the "away" state and ignore the rest until the user returns.
  const awayRef = useRef(false);

  const push = useCallback((v: ACViolation) => {
    allRef.current = [...allRef.current, v];
    setViolations(allRef.current);
  }, []);

  const log = useCallback(
    (type: string, label: string) => {
      if (!enabled || terminatedRef.current) return;
      push({ type, label, severity: "LOGGED", at: Date.now() });
    },
    [enabled, push],
  );

  const strike = useCallback(
    (type: string, label: string) => {
      if (!enabled || terminatedRef.current) return;
      countRef.current += 1;
      const n = countRef.current;
      const reached = n >= limit;
      const severity: Severity = reached ? "CRITICAL" : "WARNING";
      push({ type, label, severity, at: Date.now() });
      setCount(n);
      setWarning({
        label: reached
          ? "Limit aşıldı — imtahan avtomatik sonlandırılır."
          : `Xəbərdarlıq ${n}/${limit}: ${label}. ${limit - n} cəhd qaldı.`,
        severity,
      });
      if (reached && !terminatedRef.current) {
        terminatedRef.current = true;
        setTerminated(true);
        onTerminateRef.current?.(allRef.current);
      }
    },
    [enabled, limit, push],
  );

  const dismissWarning = useCallback(() => setWarning(null), []);

  useEffect(() => {
    if (!enabled) return;

    // One user action (tab switch, app switch) can raise `blur` and
    // `visibilitychange` together. Register a single strike on the transition
    // into "away" and mark the state; the paired event is then ignored. The
    // state clears once the exam window regains focus/visibility, so the next
    // genuine departure counts again — even if it happens right away.
    const leave = (type: string, label: string) => {
      if (awayRef.current) return;
      awayRef.current = true;
      strike(type, label);
    };
    const back = () => { awayRef.current = false; };

    const onVisibility = () => {
      if (document.hidden) leave("TAB_SWITCH", "Başqa tab/pəncərəyə keçid");
      else back();
    };
    const onBlur = () => leave("WINDOW_BLUR", "Pəncərə fokusdan çıxdı");
    const onFocus = () => back();
    const onFullscreen = () => {
      if (!document.fullscreenElement) log("FULLSCREEN_EXIT", "Tam ekran rejimindən çıxış");
    };
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      log("RIGHT_CLICK", "Sağ klik cəhdi");
    };
    const onCopy = () => log("COPY", "Mətn kopyalama cəhdi");
    const onPaste = () => log("PASTE", "Mətn yapışdırma cəhdi");
    const onOffline = () => log("OFFLINE", "İnternet bağlantısı kəsildi");
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      log("REFRESH", "Səhifəni yeniləmə/tərk etmə cəhdi");
      e.preventDefault();
      e.returnValue = "";
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F12" || ((e.ctrlKey || e.metaKey) && e.shiftKey && ["I", "J", "C"].includes(e.key.toUpperCase()))) {
        log("DEVTOOLS", "Developer Tools açma cəhdi");
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);
    document.addEventListener("fullscreenchange", onFullscreen);
    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("copy", onCopy);
    document.addEventListener("paste", onPaste);
    window.addEventListener("offline", onOffline);
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("keydown", onKeyDown);

    // Devtools-size heuristic — log only on the closed→open transition so a
    // single open session produces one record, not one every 4 seconds.
    let devtoolsOpen = false;
    const devtoolsCheck = setInterval(() => {
      const wDiff = window.outerWidth - window.innerWidth;
      const hDiff = window.outerHeight - window.innerHeight;
      const open = wDiff > 200 || hDiff > 220;
      if (open && !devtoolsOpen) {
        log("DEVTOOLS", "Developer Tools açıq ola bilər");
      }
      devtoolsOpen = open;
    }, 4000);

    // Inactivity
    let inactivityTimer: ReturnType<typeof setTimeout>;
    const resetInactivity = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => log("INACTIVITY", "Uzun müddət fəaliyyətsizlik"), inactivityMs);
    };
    ["mousemove", "keydown", "click"].forEach((ev) => window.addEventListener(ev, resetInactivity));
    resetInactivity();

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("fullscreenchange", onFullscreen);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("paste", onPaste);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("keydown", onKeyDown);
      clearInterval(devtoolsCheck);
      clearTimeout(inactivityTimer);
      ["mousemove", "keydown", "click"].forEach((ev) => window.removeEventListener(ev, resetInactivity));
    };
  }, [enabled, inactivityMs, strike, log]);

  return { violations, count, limit, warning, dismissWarning, terminated };
}
