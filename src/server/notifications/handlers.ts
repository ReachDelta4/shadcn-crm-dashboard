import { z } from "zod";

export const markReadSchema = z.object({
  notification_ids: z.array(z.string().uuid()).optional(),
  mark_all: z.boolean().optional(),
});

export const settingsUpdateSchema = z.object({
  inapp: z.boolean().optional(),
  email: z.boolean().optional(),
  push: z.boolean().optional(),
  reminder_24h: z.boolean().optional(),
  reminder_1h: z.boolean().optional(),
  calendar_provider: z.enum(["google", "outlook", "none"]).optional(),
});

export async function listNotifications({
  supabase,
  userId,
  unreadOnly,
  limit,
}: {
  supabase: any;
  userId: string;
  unreadOnly: boolean;
  limit: number;
}) {
  let query = supabase
    .from("notifications")
    .select("*", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.eq("read", false);
  }

  const { data, error, count } = await query;
  if (error) throw error;
  return { notifications: data || [], count: count || 0 };
}

export async function markNotifications({
  supabase,
  userId,
  notificationIds,
  markAll,
}: {
  supabase: any;
  userId: string;
  notificationIds?: string[];
  markAll?: boolean;
}) {
  if (markAll) {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) throw error;
    return { success: true };
  }

  if (notificationIds && notificationIds.length > 0) {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .in("id", notificationIds);

    if (error) throw error;
    return { success: true };
  }

  throw new Error("Invalid request");
}

export async function getNotificationSettings({
  supabase,
  userId,
}: {
  supabase: any;
  userId: string;
}) {
  const { data } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("owner_id", userId)
    .maybeSingle();

  return (
    data || {
      inapp: true,
      email: false,
      push: false,
      reminder_24h: true,
      reminder_1h: true,
      calendar_provider: "none",
    }
  );
}

export async function updateNotificationSettings({
  supabase,
  userId,
  payload,
}: {
  supabase: any;
  userId: string;
  payload: unknown;
}) {
  const parsed = settingsUpdateSchema.parse(payload);

  const { data, error } = await supabase
    .from("notification_settings")
    .upsert(
      {
        owner_id: userId,
        ...parsed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "owner_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}
