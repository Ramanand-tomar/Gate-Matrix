import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        green: {
          DEFAULT: "var(--green)",
          dark: "#115e59",
          soft: "var(--soft)",
        },
        brand: {
          navy: "#14213d",
          teal: "#0f766e",
          purple: "#6d28d9",
          red: "#b42318",
          amber: "#92400e",
        },
      },
    },
  },
  plugins: [],
};

export default config;
