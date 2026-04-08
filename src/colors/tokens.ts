/**
 * Single source for programmatic color use (charts, inline styles, TS).
 * Keep in sync with css-variables.css semantic names.
 */
export const semantic = {
  light: {
    bp: "#fff",
    bs: "#f1efea",
    bsh: "#e8e6e1",
    bp2: "#f5f5f3",
    t1: "#1a1a18",
    t2: "#73726c",
    t3: "#a0a09a",
    acc: "#1D9E75",
    accd: "#0F6E56",
    dan: "#E24B4A",
    war: "#BA7517",
    blue: "#378ADD",
  },
  dark: {
    bp: "#1e1e1c",
    bs: "#272725",
    bsh: "#333330",
    bp2: "#141412",
    t1: "#f0ede8",
    t2: "#8a8980",
    t3: "#5a5a56",
    acc: "#1D9E75",
    accd: "#0F6E56",
    dan: "#E24B4A",
    war: "#BA7517",
    blue: "#378ADD",
  },
} as const;

/** Accent palette for account / card pickers (matches finvoice_pro.html COLORS) */
export const accentPalette = [
  "#1D9E75",
  "#378ADD",
  "#D4537E",
  "#7F77DD",
  "#EF9F27",
  "#E24B4A",
  "#0F6E56",
  "#BA7517",
  "#888780",
  "#D85A30",
] as const;

export type SemanticScheme = (typeof semantic)["light"];
