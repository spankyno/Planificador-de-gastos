import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";

if (process.env.NODE_ENV === "development") {
  await setupDevPlatform(); // expone el binding DB (D1 local) durante `next dev`
}

/** @type {import('next').NextConfig} */
export default {};
