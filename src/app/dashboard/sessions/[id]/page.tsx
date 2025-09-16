import { SessionDetailPage } from "@/features/dashboard/pages/sessions/detail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SessionDetailPage sessionId={id} />;
}

