import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f4f9",
          100: "#e1e9f4",
          500: "#345995",
          600: "#2b4c82", // Cor base do U
          700: "#233d6a",
          800: "#1b2f51",
          900: "#13213a",
        },
        secondary: {
          50: "#fbfaf8",
          100: "#f6f4f0",
          200: "#ebe6df",
          500: "#d1c1a5", // Cor base do P
          600: "#c1b092",
          700: "#a8987b",
        }
      },
    },
  },
  plugins: [],
};
export default config;
