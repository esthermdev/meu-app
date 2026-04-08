// deno-lint-ignore no-import-prefix
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("EXPO_PUBLIC_SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("EXPO_PUBLIC_SUPABASE_ANON_KEY");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase environment variables for user-chat-message function");
}

const TITLE = "Maine Ultimate";
const jsonHeaders = { "Content-Type": "application/json" };

interface DirectPayload {
  conversationId?: unknown;
  senderId?: unknown;
}

interface ConversationRow {
  id: string;
  user_id: string;
}

interface ProfileRow {
  id: string;
  expo_push_token: string | null;
  is_logged_in: boolean | null;
}

type AuthUserResponse = {
  id: string;
  email?: string;
};

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

    if (!senderIsAdmin) {
      return createResponse({ error: "Only admins can send this notification" }, 403);
    }

    const { data: conversation, error: conversationError } = await adminClient
      .from("conversations")
      .select("id, user_id")
      .eq("id", conversationId)
      .maybeSingle();

    if (conversationError) {
      throw conversationError;
    }

    if (!conversation) {
      return createResponse({ error: "Conversation not found" }, 404);
    }

    const conversationRow = conversation as ConversationRow;
    const targetUserId = conversationRow.user_id;

    const { data: targetProfile, error: targetProfileError } = await adminClient
      .from("profiles")
      .select("id, expo_push_token, is_logged_in")
      .eq("id", targetUserId)
      .maybeSingle();

    if (targetProfileError) {
      throw targetProfileError;
    }

    if (!targetProfile) {
      return createResponse({ error: "Conversation user not found" }, 404);
    }

    const profile = targetProfile as ProfileRow;

    if (!profile.is_logged_in) {
      return createResponse({ success: true, skipped: "user_offline" }, 200);
    }

    if (!profile.expo_push_token || !isExpoPushToken(profile.expo_push_token)) {
      return createResponse({ success: true, skipped: "missing_or_invalid_token" }, 200);
    }

    const body = "You have a new message.";

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: profile.expo_push_token,
        sound: "default",
        title: TITLE,
        body,
        data: {
          type: "user_chat_message",
          conversationId,
          count: 1,
        },
        priority: "high",
      }),
    });

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`Failed to send notification: ${response.status} ${responseText}`);
    }

    const result = await response.json();

    return createResponse({ success: true, recipients: 1, data: result }, 200);
  } catch (error) {
    console.error("Detailed error:", error);
    return createResponse(
      {
        error: error instanceof Error ? error.message : "Failed to send user chat notifications",
      },
      500,
    );
  }
});