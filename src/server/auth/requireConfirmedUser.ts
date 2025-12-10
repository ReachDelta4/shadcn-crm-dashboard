import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createServerSupabase } from "@/utils/supabase/server";

export async function requireConfirmedUser(redirectPath: string = "/dashboard"): Promise<User> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(redirectPath)}`);
  }

  if (!user.email_confirmed_at) {
    const email = user.email || "";
    redirect(`/verify-email?email=${encodeURIComponent(email)}`);
  }

  return user;
}

