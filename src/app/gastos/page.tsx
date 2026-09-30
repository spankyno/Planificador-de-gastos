import { loadStructure } from "../actions";
import ManageForm from "@/components/ManageForm";
export const runtime = "edge";

export default async function Page() {
  const { families, categories } = await loadStructure();
  return <ManageForm families={families} categories={categories} />;
}
