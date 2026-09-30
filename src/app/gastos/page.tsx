import { loadStructure } from "../actions";
import ManageForm from "@/components/ManageForm";
export const runtime = "edge";

export default async function Page() {
  const data = await loadStructure();
  return <ManageForm {...data} />;
}
