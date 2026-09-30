import { loadReport } from "../actions";
import Report from "@/components/Report";
export const runtime = "edge";

export default async function Page({ searchParams }: { searchParams: Promise<{ y?: string }> }) {
  const now = new Date().getFullYear();
  const raw = (await searchParams).y;
  const years = (raw ? raw.split(",").map(Number).filter((n) => n > 1990 && n < 2100) : [now, now - 1])
    .slice(0, 4).sort((a, b) => a - b);
  const data = await loadReport(years);
  return <Report years={years} {...data} />;
}
