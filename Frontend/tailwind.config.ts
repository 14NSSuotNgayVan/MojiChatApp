import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", ".dark"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        card: {
          DEFAULT: "var(--color-card)",
          foreground: "var(--color-card-foreground)",
        },
        popover: {
          DEFAULT: "var(--color-popover)",
          foreground: "var(--color-popover-foreground)",
        },
        primary: {
          DEFAULT: "rgb(var(--primary-rgb) / <alpha-value>)",
          foreground: "var(--color-primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          foreground: "var(--color-secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--color-muted)",
          foreground: "var(--color-muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          foreground: "var(--color-accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--color-destructive)",
          foreground: "var(--color-destructive-foreground)",
        },
        border: "var(--color-border)",
        input: "var(--color-input)",
        ring: "var(--color-ring)",
        chart: {
          "1": "var(--color-chart-1)",
          "2": "var(--color-chart-2)",
          "3": "var(--color-chart-3)",
          "4": "var(--color-chart-4)",
          "5": "var(--color-chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--color-sidebar)",
          foreground: "var(--color-sidebar-foreground)",
          primary: "var(--color-sidebar-primary)",
          "primary-foreground": "var(--color-sidebar-primary-foreground)",
          accent: "var(--color-sidebar-accent)",
          "accent-foreground": "var(--color-sidebar-accent-foreground)",
          border: "var(--color-sidebar-border)",
          ring: "var(--color-sidebar-ring)",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        "2xs": "var(--shadow-2xs)",
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
      },
      spacing: {
        base: "var(--spacing)", // 0.25rem
      },
      letterSpacing: {
        normal: "var(--tracking-normal)", // 0em
      },
      keyframes: {
        // World Map Animation
        worldMapLoop: {
          "0%, 100%": { opacity: "0.3", transform: "scale(1)" },
          "30%": { opacity: "0", transform: "scale(2)" },
          "70%": { opacity: "0", transform: "scale(2)" },
        },
        // Vietnam Map Animation
        vietnamMapLoop: {
          "0%, 10%": { opacity: "0", transform: "scale(0)" },
          "40%": { opacity: "0.15", transform: "scale(1)" },
          "70%": { opacity: "0.15", transform: "scale(1)" },
          "100%": { opacity: "0", transform: "scale(0)" },
        },
        // Flag Animation
        flagLoop: {
          "0%, 20%": {
            opacity: "1",
            transform: "translate(-50%, -50%) scale(1)",
          },
          "40%": {
            opacity: "0",
            transform: "translate(-50%, -50%) scale(1.5)",
          },
          "40%, 90%": {
            opacity: "0",
            transform: "translate(-50%, -50%) scale(1.5)",
          },
          "100%": {
            opacity: "1",
            transform: "translate(-50%, -50%) scale(1)",
          },
        },
      },
      animation: {
        "world-map": "worldMapLoop 5s ease-in-out infinite",
        "vietnam-map": "vietnamMapLoop 5s ease-out infinite",
        "flag-pulse": "flagLoop 5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
