export interface Theme {
  name: string;
  font: string;
  fontSize: string;
  textColor: string;
  background: string;
  headingColor: string;
  accent: string;
  chartPalette: string[];
  spacing: { small: string; medium: string; large: string };
  radius: { small: string; medium: string; large: string };
}

export const THEMES: Record<string, Theme> = {
  minimal: {
    name: "minimal",
    font: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    fontSize: "16px",
    textColor: "#222",
    background: "#fff",
    headingColor: "#111",
    accent: "#2d6cdf",
    chartPalette: ["#2d6cdf", "#e0b84a", "#3aa675", "#c64a4a", "#8a4ac6", "#4ab8c6"],
    spacing: { small: "4px", medium: "12px", large: "24px" },
    radius: { small: "2px", medium: "6px", large: "12px" },
  },
  report: {
    name: "report",
    font: "Georgia, 'Times New Roman', serif",
    fontSize: "17px",
    textColor: "#1a1a1a",
    background: "#fafaf7",
    headingColor: "#1a1a1a",
    accent: "#8c2f2f",
    chartPalette: ["#8c2f2f", "#2d6cdf", "#3aa675", "#e0b84a", "#8a4ac6", "#4ab8c6"],
    spacing: { small: "6px", medium: "16px", large: "32px" },
    radius: { small: "0", medium: "2px", large: "4px" },
  },
  slide: {
    name: "slide",
    font: "'Helvetica Neue', Arial, sans-serif",
    fontSize: "20px",
    textColor: "#fff",
    background: "#1e1e2a",
    headingColor: "#fff",
    accent: "#ffce5c",
    chartPalette: ["#ffce5c", "#7fc8f8", "#b5f08a", "#ff7a7a", "#c58af8", "#5cf0d6"],
    spacing: { small: "8px", medium: "20px", large: "40px" },
    radius: { small: "4px", medium: "10px", large: "20px" },
  },
};

export function getTheme(name: unknown): Theme {
  if (typeof name === "string" && THEMES[name]) return THEMES[name];
  return THEMES.minimal;
}
