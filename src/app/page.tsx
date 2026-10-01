import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { loadYear } from "./actions";
import Grid from "@/components/Grid";
import Landing from "@/components/Landing";
import Nav from "@/components/Nav";

export const runtime = "edge";
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function Home({ searchParams }: { searchParams: Promise<{ y?: string }> }) {
  const { userId } = await auth();
  if (!userId) return <Landing />; // portada pública (indexable) para visitantes sin sesión
  const y = Number((await searchParams).y);
  const year = Number.isInteger(y) && y >= 1990 && y <= 2100 ? y : new Date().getFullYear(); // valida el año de la URL
  const data = await loadYear(year);
  return (
    <>
      <Nav />
      <Grid key={year} year={year} {...data} /> {/* key: reinicia el estado al cambiar de año */}
    </>
  );
}
