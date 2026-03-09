// src/theme/index.ts — Design tokens centralizados

export const colors = {
  // Brand
  primary: "#FF8C00",
  primaryLight: "#FFAD46",
  primaryDark: "#CC7000",
  primarySubtle: "#FFF3E0",

  // Neutrals
  black: "#0A0A0A",
  gray900: "#111827",
  gray800: "#1F2937",
  gray700: "#374151",
  gray600: "#4B5563",
  gray500: "#6B7280",
  gray400: "#9CA3AF",
  gray300: "#D1D5DB",
  gray200: "#E5E7EB",
  gray100: "#F3F4F6",
  gray50: "#F9FAFB",
  white: "#FFFFFF",

  // Semantic
  success: "#10B981",
  successBg: "#D1FAE5",
  error: "#EF4444",
  errorBg: "#FEE2E2",
  warning: "#F59E0B",
  warningBg: "#FEF3C7",
  info: "#3B82F6",
  infoBg: "#DBEAFE",

  // Backgrounds
  background: "#F4F5F7",
  surface: "#FFFFFF",
  border: "#E5E7EB",
  borderLight: "#F3F4F6",
  overlay: "rgba(0,0,0,0.5)",
};

export const fonts = {
  regular: "Karla-Regular",
  semiBold: "Karla-SemiBold",
  bold: "Karla-Bold",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 40,
};

export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
};

/**
 * Añade un canal alpha a un color hex de 6 dígitos.
 * @param hex  — e.g. "#FF8C00"
 * @param alpha — 0-100 (porcentaje de opacidad)
 */
export const withAlpha = (hex: string, alpha: number): string => {
  const alphaHex = Math.round((alpha / 100) * 255)
    .toString(16)
    .padStart(2, "0");
  const clean = hex.startsWith("#") ? hex.slice(1) : hex;
  return `#${clean.slice(0, 6)}${alphaHex}`;
};

const theme = { colors, fonts, spacing, radii, shadows, withAlpha };
export default theme;
