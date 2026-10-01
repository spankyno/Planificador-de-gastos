import { loadStructure } from "../actions";
import ManageForm from "@/components/ManageForm";
export const runtime = "edge";
export const metadata = { title: "Gastos y familias", robots: { index: false, follow: false } };

export default async function Page() {
  const data = await loadStructure();
  return <ManageForm {...data} />;
}
