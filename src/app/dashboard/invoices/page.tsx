import { InvoicesPage } from "@/features/dashboard/pages/invoices";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { InvoicesRepository } from "@/server/repositories/invoices";

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
    const result = await repo.list({ userId: user.id, page: 0, pageSize: 10, sort: 'date', direction: 'desc' });
    initialInvoices = (result.data || []).map((invoice: any) => ({
      id: invoice.id || '',
      invoiceNumber: invoice.invoice_number || '',
      customerName: invoice.customer_name || '',
      email: invoice.email || '',
      amount: typeof invoice.amount === 'number' ? invoice.amount : 0,
      status: invoice.status || 'draft',
      date: invoice.date || new Date().toISOString(),
      dueDate: invoice.due_date || new Date().toISOString(),
      items: typeof invoice.items === 'number' ? invoice.items : 0,
      paymentMethod: invoice.payment_method || 'card',
    }));
    initialCount = result.count || 0;
  }

  return <InvoicesPage initialInvoices={initialInvoices} initialCount={initialCount} />;
} 