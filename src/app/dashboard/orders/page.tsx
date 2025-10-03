import { OrdersPage } from "@/features/dashboard/pages/orders";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { OrdersRepository } from "@/server/repositories/orders";

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
  let initialOrders: any[] = [];
  let initialCount = 0;

  if (user) {
    const repo = new OrdersRepository(supabase);
    const result = await repo.list({ userId: user.id, page: 0, pageSize: 10, sort: 'date', direction: 'desc' } as any);
    initialOrders = (result.data || []).map((order: any) => ({
      id: order.id || '',
      orderNumber: order.order_number || '',
      customerName: order.customer_name || '',
      email: order.email || '',
      amount: typeof order.amount === 'number' ? order.amount : 0,
      status: order.status || 'pending',
      date: order.date || new Date().toISOString(),
      items: typeof order.items === 'number' ? order.items : 0,
      paymentMethod: order.payment_method || 'card',
    }));
    initialCount = result.count || 0;
  }

  return <OrdersPage initialOrders={initialOrders} initialCount={initialCount} />;
}
  