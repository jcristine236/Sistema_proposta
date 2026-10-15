import { redirect } from "next/navigation";

export default async function Modelo({ params }: { params: Promise<{ id: string }> }) {
  redirect(`/admin/modelos/${(await params).id}/editar`);
}
