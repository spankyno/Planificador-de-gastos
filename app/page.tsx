import { loadYear } from "./actions";
import Grid from "@/components/Grid";
export const runtime = "edge";

export default async function Home({ searchParams }: { searchParams: Promise<{ y?: string }> }) {
  const year = Number((await searchParams).y) || new Date().getFullYear();
  const data = await loadYear(year);
  return <Grid year={year} {...data} />;
}
