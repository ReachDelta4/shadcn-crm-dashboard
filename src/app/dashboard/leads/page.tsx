import { LeadsPage } from "@/features/dashboard/pages/leads";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { LeadsRepository } from "@/server/repositories/leads";

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
  let initialLeads: any[] = [];
  let initialCount = 0;

  if (user) {
    const repo = new LeadsRepository(supabase);
    const result = await repo.list({ userId: user.id, page: 0, pageSize: 10, sort: 'date', direction: 'desc' } as any);
    initialLeads = (result.data || []).map((lead: any) => ({
      id: lead.id || '',
      leadNumber: lead.lead_number || '',
      subjectId: lead.subject_id ?? null,
      fullName: lead.full_name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      company: lead.company || '',
      value: typeof lead.value === 'number' ? lead.value : 0,
      status: lead.status || 'new',
      date: lead.date || new Date().toISOString(),
      updatedAt: lead.updated_at || lead.date || new Date().toISOString(),
      source: lead.source || 'unknown',
    }));
    initialCount = result.count || 0;
  }

  return <LeadsPage initialLeads={initialLeads} initialCount={initialCount} />;
} 
