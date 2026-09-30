import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class", // controlado por el selector de tema (por defecto sigue al sistema)
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
