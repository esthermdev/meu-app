// deno-lint-ignore no-import-prefix
import { createClient } from "jsr:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("EXPO_PUBLIC_SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("EXPO_PUBLIC_SUPABASE_ANON_KEY");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase environment variables for announcement function");
}

const BATCH_SIZE = 100;
const jsonHeaders = { "Content-Type": "application/json" };

// Define the type for a single notification
interface Notification {
  to: string;
  sound: string;
  title: string;
  body: string;
  data: { type: string };
}

// Define the type for the Expo API response
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
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const user = await getAuthenticatedUser(authHeader);
    if (!user?.id) {
      return createResponse({ error: "Unauthorized" }, 401);
    }

    const { data: adminRole, error: adminRoleError } = await adminClient
      .from("profile_roles")
      .select("role:roles!inner(key)")
      .eq("profile_id", user.id)
      .eq("roles.key", "admin")
      .maybeSingle();

    if (adminRoleError) {
      throw adminRoleError;
    }

    if (!adminRole) {
      return createResponse({ error: "Only admins can send announcements" }, 403);
    }

    const payload = await req.json() as { title?: unknown; message?: unknown };
    const title = typeof payload.title === "string" ? payload.title.trim() : "";
    const message = typeof payload.message === "string" ? payload.message.trim() : "";

    if (!title || !message) {
      return createResponse({ error: "Title and message are required" }, 400);
    }

    // Save one public announcement record visible to all users.
    const { error: insertError } = await adminClient
      .from("notifications")
      .insert({
        title,
        message,
        type: "announcement",
        user_id: null,
      });

    if (insertError) {
      console.error("Error saving announcement to database:", insertError);
      throw insertError;
    }

    const [authUserResponse, anonymousResponse] = await Promise.all([
      adminClient
        .from("profiles")
        .select("expo_push_token")
        .not("expo_push_token", "is", null),
      adminClient
        .from("anonymous_tokens")
        .select("token")
        .not("token", "is", null),
    ]);

    if (authUserResponse.error) {
      throw authUserResponse.error;
    }

    if (anonymousResponse.error) {
      throw anonymousResponse.error;
    }

    const authTokens = authUserResponse.data
      .map((userRow: { expo_push_token: string }) => userRow.expo_push_token)
      .filter(isExpoPushToken);

    const anonymousTokens = anonymousResponse.data
      .map((entry: { token: string }) => entry.token)
      .filter(isExpoPushToken);

    const allTokens = [...new Set([...authTokens, ...anonymousTokens])];

    if (allTokens.length === 0) {
      return createResponse({ success: true, recipients: 0, data: [] }, 200);
    }

    const results: ExpoPushResponse[] = [];
    for (let i = 0; i < allTokens.length; i += BATCH_SIZE) {
      const batchTokens = allTokens.slice(i, i + BATCH_SIZE);
      const batchNotifications: Notification[] = batchTokens.map((token) => ({
        to: token,
        sound: "default",
        title,
        body: message,
        data: { type: "announcement" },
      }));

      const result = await sendNotifications(batchNotifications);
      results.push(result);
    }

    return createResponse({ success: true, recipients: allTokens.length, data: results }, 200);
  } catch (error) {
    console.error("Detailed error:", error);
    return createResponse(
      {
        error: error instanceof Error ? error.message : "Failed to send announcement",
      },
      500,
    );
  }
});