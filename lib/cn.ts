/** Tiny className combiner — joins truthy class strings. s */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
