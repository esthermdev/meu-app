// deno-lint-ignore no-import-prefix
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("EXPO_PUBLIC_SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("EXPO_PUBLIC_SUPABASE_ANON_KEY");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase environment variables for delete-account function");
}

const createResponse = (body: Record<string, unknown>, status: number) =>
  new Response(JSON.stringify(body), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
    status,
  });

type AuthUserResponse = {
  id: string;
  email?: string;
};

type NotificationRow = {
  id: number;
};

const getAuthenticatedUser = async (authHeader: string): Promise<AuthUserResponse> => {
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: authHeader,
      apikey: supabaseAnonKey,
    },
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Failed to resolve authenticated user: ${response.status}`);
  }

  return await response.json() as AuthUserResponse;
};

const deleteAuthUser = async (userId: string) => {
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
      apikey: supabaseServiceRoleKey,
      "Content-Type": "application/json",
    },
    method: "DELETE",
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Failed to delete auth user: ${response.status} ${responseText}`);
  }
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return createResponse({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return createResponse({ error: "Missing authorization header" }, 401);
  }

  try {
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const user = await getAuthenticatedUser(authHeader);

    if (!user?.id) {
      console.error("Failed to resolve authenticated user");
      return createResponse({ error: "Unauthorized" }, 401);
    }

    const { data: notifications, error: notificationsQueryError } = await adminClient
      .from("notifications")
      .select("id")
      .eq("user_id", user.id)
      .returns<NotificationRow[]>();

    if (notificationsQueryError) {
      throw notificationsQueryError;
    }

    const notificationIds = (notifications ?? []).map((notification: NotificationRow) => notification.id);

    if (notificationIds.length > 0) {
      const { error: deleteNotificationReadStatusByNotificationError } = await adminClient
        .from("notification_read_status")
        .delete()
        .in("notification_id", notificationIds);

      if (deleteNotificationReadStatusByNotificationError) {
        throw deleteNotificationReadStatusByNotificationError;
      }
    }

    const { error: deleteNotificationReadStatusByUserError } = await adminClient
      .from("notification_read_status")
      .delete()
      .eq("user_id", user.id);

    if (deleteNotificationReadStatusByUserError) {
      throw deleteNotificationReadStatusByUserError;
    }

    const { error: deleteNotificationsError } = await adminClient
      .from("notifications")
      .delete()
      .eq("user_id", user.id);

    if (deleteNotificationsError) {
      throw deleteNotificationsError;
    }

    const { error: clearCartDriverError } = await adminClient
      .from("cart_requests")
      .update({ driver: null })
      .eq("driver", user.id);

    if (clearCartDriverError) {
      throw clearCartDriverError;
    }

    const { error: clearCartRequesterError } = await adminClient
      .from("cart_requests")
      .update({ requester: null, requester_id: null, requester_token: null })
      .eq("requester_id", user.id);

    if (clearCartRequesterError) {
      throw clearCartRequesterError;
    }

    const { error: clearMedicalAssignmentError } = await adminClient
      .from("medical_requests")
      .update({ assigned_to: null, trainer: null })
      .eq("assigned_to", user.id);

    if (clearMedicalAssignmentError) {
      throw clearMedicalAssignmentError;
    }

    await deleteAuthUser(user.id);

    return createResponse({ success: true }, 200);
  } catch (error) {
    console.error("Delete account function failed", error);
    return createResponse(
      {
        error: error instanceof Error ? error.message : "Failed to delete account",
      },
      500,
    );
  }
});