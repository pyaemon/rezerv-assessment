export type ClassValue = string | false | null | undefined;

/** Minimal `clsx` stand-in — the project has no runtime dependencies. */
export function cx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
