// deno-lint-ignore no-import-prefix
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("EXPO_PUBLIC_SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("EXPO_PUBLIC_SUPABASE_ANON_KEY");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase environment variables for admin-chat-message function");
}

const TITLE = "Maine Ultimate";
const BATCH_SIZE = 100;
const jsonHeaders = { "Content-Type": "application/json" };

interface ConversationRow {
  id: string;
  user_id: string;
  admin_last_read_at: string | null;
}

interface DirectPayload {
  conversationId?: unknown;
  senderId?: unknown;
}

interface ExpoPushTicket {
  id: string;
  status: "ok" | "error";
  message?: string;
  details?: {
    error: string;
  };
}

interface ExpoPushResponse {
  data: ExpoPushTicket[];
}

type AuthUserResponse = {
  id: string;
  email?: string;
};

interface Notification {
  to: string;
  sound: string;
  title: string;
  body: string;
  data: {
    type: string;
    conversationId: string;
    count: number;
  };
  priority: string;
}

interface AdminProfileRow {
  id: string;
  expo_push_token: string | null;
}

const createResponse = (body: Record<string, unknown>, status: number) =>
  new Response(JSON.stringify(body), {
    headers: jsonHeaders,
    status,
  });

const isExpoPushToken = (token: string): boolean =>
  /^(ExponentPushToken|ExpoPushToken)\[[^\]]+\]$/.test(token);

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

async function sendNotifications(
  notifications: Notification[],
): Promise<ExpoPushResponse> {
  const response = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(notifications),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(
      `Failed to send notifications: ${response.status} ${responseText}`,
    );
  }

  return await response.json() as ExpoPushResponse;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return createResponse({ error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return createResponse({ error: "Missing authorization header" }, 401);
  }

  try {
    const payload = await req.json() as DirectPayload;
    const conversationId = typeof payload.conversationId === "string" ? payload.conversationId : "";
    const senderId = typeof payload.senderId === "string" ? payload.senderId : "";

    if (!conversationId || !senderId) {
      return createResponse({ error: "conversationId and senderId are required" }, 400);
    }

    const user = await getAuthenticatedUser(authHeader);
    if (!user?.id) {
      return createResponse({ error: "Unauthorized" }, 401);
    }

    if (user.id !== senderId) {
      return createResponse({ error: "Sender mismatch" }, 403);
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: senderIsAdmin, error: senderRoleError } = await adminClient
      .from("profile_roles")
      .select("role:roles!inner(key)")
      .eq("profile_id", senderId)
      .eq("roles.key", "admin")
      .maybeSingle();

    if (senderRoleError) {
      throw senderRoleError;
    }

    // Admin messages should not trigger admin push notifications.
    if (senderIsAdmin) {
      return createResponse({ success: true, skipped: "sender_is_admin" }, 200);
    }

    const { data: conversation, error: conversationError } = await adminClient
      .from("conversations")
      .select("id, user_id, admin_last_read_at")
      .eq("id", conversationId)
      .maybeSingle();

    if (conversationError) {
      throw conversationError;
    }

    if (!conversation) {
      return createResponse({ error: "Conversation not found" }, 404);
    }

    const conversationRow = conversation as ConversationRow;
    if (conversationRow.user_id !== senderId) {
      return createResponse({ error: "Sender is not owner of conversation" }, 403);
    }

    let unreadQuery = adminClient
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", conversationId)
      .eq("sender_id", conversationRow.user_id);

    if (conversationRow.admin_last_read_at) {
      unreadQuery = unreadQuery.gt("created_at", conversationRow.admin_last_read_at);
    }

    const { count: unreadCountRaw, error: unreadCountError } = await unreadQuery;
    if (unreadCountError) {
      throw unreadCountError;
    }

    const unreadCount = Number(unreadCountRaw ?? 1);

    const { data: adminProfiles, error: adminProfilesError } = await adminClient
      .from("profiles")
      .select("id, expo_push_token, profile_roles!inner(roles!inner(key))")
      .eq("profile_roles.roles.key", "admin")
      .eq("is_chat_online", true)
      .eq("is_logged_in", true)
      .not("expo_push_token", "is", null);

    if (adminProfilesError) {
      throw adminProfilesError;
    }

    const typedAdminProfiles = (adminProfiles ?? []) as AdminProfileRow[];
    const tokens: string[] = typedAdminProfiles
      .map((profile) => profile.expo_push_token)
      .filter((token: string | null): token is string => typeof token === "string")
      .filter(isExpoPushToken);

    const uniqueTokens: string[] = [...new Set(tokens)];

    if (uniqueTokens.length === 0) {
      return createResponse({ success: true, recipients: 0, data: [] }, 200);
    }

    const body = `You have a new message.`;

    const results: ExpoPushResponse[] = [];
    for (let i = 0; i < uniqueTokens.length; i += BATCH_SIZE) {
      const batchTokens = uniqueTokens.slice(i, i + BATCH_SIZE);
      const batchNotifications: Notification[] = batchTokens.map((token) => ({
        to: token,
        sound: "default",
        title: TITLE,
        body,
        data: {
          type: "admin_chat_message",
          conversationId,
          count: unreadCount,
        },
        priority: "high",
      }));

      const result = await sendNotifications(batchNotifications);
      results.push(result);
    }

    return createResponse({ success: true, recipients: uniqueTokens.length, data: results }, 200);
  } catch (error) {
    console.error("Detailed error:", error);
    return createResponse(
      {
        error: error instanceof Error ? error.message : "Failed to send admin chat notifications",
      },
      500,
    );
  }
});