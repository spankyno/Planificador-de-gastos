import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "media", // sigue el tema del sistema
  theme: { extend: {} },
  plugins: [],
} satisfies Config;
