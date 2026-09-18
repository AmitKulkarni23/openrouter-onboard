"use client";

import { createTheme } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    grid: string;
    ink: string;
    inkMuted: string;
    editorGround: string;
    editorText: string;
    editorGutter: string;
    editorLine: string;
    pass: string;
    passLight: string;
    fail: string;
    failLight: string;
    blue: string;
    blueLight: string;
    surface: string;
  }
  interface PaletteOptions {
    grid?: string;
    ink?: string;
    inkMuted?: string;
    editorGround?: string;
    editorText?: string;
    editorGutter?: string;
    editorLine?: string;
    pass?: string;
    passLight?: string;
    fail?: string;
    failLight?: string;
    blue?: string;
    blueLight?: string;
    surface?: string;
  }
}

const theme = createTheme({
  palette: {
    primary: { main: "#0057FF" },
    error: { main: "#DC2626" },
    success: { main: "#16A34A" },
    background: {
      default: "#F5F7FA",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#111111",
      secondary: "#6B7280",
    },
    grid: "#E6EBF2",
    ink: "#111111",
    inkMuted: "#6B7280",
    surface: "#F5F7FA",
    blue: "#0057FF",
    blueLight: "#EBF2FF",
    pass: "#16A34A",
    passLight: "#ECFDF5",
    fail: "#DC2626",
    failLight: "#FEF2F2",
    editorGround: "#1B1D2A",
    editorText: "#E4E4E7",
    editorGutter: "#3F4257",
    editorLine: "#2A2D3E",
  },
  typography: {
    fontFamily: "'DM Sans', sans-serif",
    h1: {
      fontFamily: "'Space Grotesk', sans-serif",
      fontWeight: 700,
      letterSpacing: "0.06em",
    },
    h2: {
      fontFamily: "'Space Grotesk', sans-serif",
      fontWeight: 700,
      letterSpacing: "0.06em",
    },
    h6: {
      fontFamily: "'Space Grotesk', sans-serif",
      fontWeight: 700,
      fontSize: "0.8125rem",
      letterSpacing: "0.06em",
    },
    subtitle2: {
      fontFamily: "'DM Sans', sans-serif",
      fontWeight: 500,
      fontSize: "0.6875rem",
      letterSpacing: "0.08em",
      textTransform: "uppercase" as const,
    },
    body2: {
      fontSize: "0.8125rem",
      lineHeight: 1.5,
    },
    caption: {
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: "0.75rem",
    },
  },
  shape: {
    borderRadius: 0,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          textTransform: "uppercase" as const,
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          letterSpacing: "0.06em",
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: "none",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
      },
    },
  },
});

export default theme;
