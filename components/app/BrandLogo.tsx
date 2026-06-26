"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme";

/**
 * Theme-aware CES logo.
 *  - dark mode  → /logo-dark.png   (light-coloured logo for dark backgrounds)
 *  - light mode → /logo-white.png  (dark-coloured logo for light backgrounds)
 *
 * `forceDark` always uses the dark-mode logo — use it on always-dark chrome
 * such as the sidebar. The image is preloaded first, so a missing file shows
 * `fallback` instead of a broken-image icon (no flash of broken image).
 */
export function BrandLogo({
  forceDark = false,
  className,
  fallback,
}: {
  forceDark?: boolean;
  className?: string;
  fallback?: React.ReactNode;
}) {
  const { theme } = useTheme();
  const useDark = forceDark || theme === "dark";
  const src = useDark ? "/logo-dark.png" : "/logo-white.png";
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    let active = true;
    setStatus("loading");
    const img = new window.Image();
    img.onload = () => { if (active) setStatus("ok"); };
    img.onerror = () => { if (active) setStatus("error"); };
    img.src = src;
    return () => { active = false; };
  }, [src]);

  // Only render the <img> once we've confirmed it actually loads.
  if (status === "ok") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="CES" className={className} />;
  }
  return <>{fallback ?? null}</>;
}
