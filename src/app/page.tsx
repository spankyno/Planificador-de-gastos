import { loadYear } from "./actions";
import Grid from "@/components/Grid";
export const runtime = "edge";

export default async function Home({ searchParams }: { searchParams: Promise<{ y?: string }> }) {
  const year = Number((await searchParams).y) || new Date().getFullYear();
  const data = await loadYear(year);
  return <Grid key={year} year={year} {...data} />; // key: reinicia el estado al cambiar de año
}
