import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "#FAF7F0",
          50: "#FFFFFF",
          100: "#FAF7F0",
          200: "#F3EEE2",
        },
        ink: {
          DEFAULT: "#15171C",
          700: "#2A2A28",
          500: "#6E6A5E",
          300: "#9A9384",
        },
        border: {
          DEFAULT: "#DED7C7",
          dark: "#E6DECC",
        },
        honduras: {
          blue: "#0073CF",
          "blue-dark": "#004A8F",
          red: "#CE1126",
          "red-dark": "#9E0E1F",
        },
        accent: {
          amber: "#A66A00",
          green: "#1F7A4D",
          "green-light": "#5BC489",
          purple: "#6B4E9E",
        },
      },
      fontFamily: {
        serif: ["var(--font-headline)", "Georgia", "serif"],
        article: ["var(--font-article)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-100%)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
      },
      animation: {
        marquee: "marquee 40s linear infinite",
        "pulse-dot": "pulse-dot 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
