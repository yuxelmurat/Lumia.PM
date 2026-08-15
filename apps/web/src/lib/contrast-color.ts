/**
 * Picks black or white text for a given background hex color using relative
 * luminance (WCAG-style approximation) — good enough for an arbitrary
 * studio-chosen brand color where we can't know the pairing in advance.
 */
export function getContrastingTextColor(hex: string): "#000000" | "#ffffff" {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return "#000000";

  const value = Number.parseInt(match[1], 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#000000" : "#ffffff";
}

export function isValidHexColor(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value.trim());
}
