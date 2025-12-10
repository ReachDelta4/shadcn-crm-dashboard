import { InvoicesPage } from "@/features/dashboard/pages/invoices";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { InvoicesRepository } from "@/server/repositories/invoices";
import { mapInvoiceRecord } from "@/features/dashboard/pages/invoices/types/invoice";

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  let initialInvoices: any[] = [];
  let initialCount = 0;

  if (user) {
    const repo = new InvoicesRepository(supabase);
    const result = await repo.list({
      userId: user.id,
      page: 0,
      pageSize: 10,
      sort: "date",
      direction: "desc",
    });

    initialInvoices = (result.data || []).map((invoice: any) =>
      mapInvoiceRecord(invoice),
    );
    initialCount = result.count || 0;
  }

  return <InvoicesPage initialInvoices={initialInvoices} initialCount={initialCount} />;
}
