/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#3b82f6", // Blue color as primary
          focus: "#2563eb",
        },
        secondary: {
          DEFAULT: "#6b7280", // Gray color as secondary
          focus: "#4b5563",
        },
        accent: {
          DEFAULT: "#8b5cf6", // Purple color as accent
          focus: "#7c3aed",
        },
        neutral: "#1f2937",
        "base-100": "#ffffff",
        "base-200": "#f9fafb",
        "base-300": "#f3f4f6",
        info: "#3ABFF8",
        success: "#36D399",
        warning: "#FBBD23",
        error: "#F87272",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          ...require("daisyui/src/theming/themes")["light"],
          primary: "#3b82f6",
          secondary: "#6b7280",
          accent: "#8b5cf6",
          neutral: "#1f2937",
          "base-100": "#ffffff",
          "base-200": "#f9fafb",
          "base-300": "#f3f4f6",
        },
        dark: {
          ...require("daisyui/src/theming/themes")["dark"],
          primary: "#3b82f6",
          secondary: "#6b7280",
          accent: "#8b5cf6",
          neutral: "#1f2937",
          "base-100": "#1f2937",
          "base-200": "#111827",
          "base-300": "#0f172a",
        },
      },
    ],
    darkTheme: "dark",
  },
}