import DashboardLayoutWrapper from "@/features/dashboard/components/dashboard-layout";
import { DashboardProviders } from "./providers";
import { requireConfirmedUser } from "@/server/auth/requireConfirmedUser";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireConfirmedUser("/dashboard");
  return (
    <DashboardProviders>
      <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>
    </DashboardProviders>
  );
}
