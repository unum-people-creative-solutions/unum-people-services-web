import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-poppins)', 'sans-serif'],
      },
      colors: {
        brand: {
          blue: "#0A1C82", // Base tecnológica e autoridade
          purple: "#6B00D7", // Transição e fluidez
          orange: "#FF3D00", // Calor e energia
        },
        support: {
          grey: "#6E7191",
        },
        // Mapeando legacy colors para manter compatibilidade até as páginas serem refatoradas (Tasks 2, 3, 4)
        // Isso evita que o build quebre imediatamente.
        primary: {
          50: "#f0f4f9",
          100: "#e1e9f4",
          200: "#d2dff0",
          400: "#a9bce0",
          500: "#345995",
          600: "#0A1C82", // Mapeado base 600 antigo para o novo brand-blue temporariamente se necessário
          700: "#233d6a",
          800: "#1b2f51",
          900: "#13213a",
        },
        secondary: {
          50: "#fbfaf8",
          100: "#f6f4f0",
          200: "#ebe6df",
          500: "#d1c1a5",
          600: "#c1b092",
          700: "#a8987b",
        }
      },
    },
  },
  plugins: [],
};
export default config;
