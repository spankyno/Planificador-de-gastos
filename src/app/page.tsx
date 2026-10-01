import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { loadYear } from "./actions";
import Grid from "@/components/Grid";
import Landing from "@/components/Landing";

export const runtime = "edge";
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function Home({ searchParams }: { searchParams: Promise<{ y?: string }> }) {
  const { userId } = await auth();
  if (!userId) return <Landing />; // portada pública (indexable) para visitantes sin sesión
  const year = Number((await searchParams).y) || new Date().getFullYear();
  const data = await loadYear(year);
  return <Grid key={year} year={year} {...data} />; // key: reinicia el estado al cambiar de año
}
