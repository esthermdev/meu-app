import { createClient } from "jsr:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("EXPO_PUBLIC_SUPABASE_URL")!,
  Deno.env.get("EXPO_PUBLIC_SUPABASE_ANON_KEY")!,
);

const BATCH_SIZE = 100;

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

async function sendNotifications(
  notifications: Notification[],
): Promise<ExpoPushResponse> {
  console.log(`Sending batch of ${notifications.length} notifications`);
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
  if (req.method === "POST") {
    try {
      console.log("Received POST request");
      const { title, message } = await req.json() as {
        title: string;
        message: string;
      };
      console.log("Parsed request body:", { title, message });

      // First, save the announcement to the notifications table
      const { error: insertError } = await supabase
        .from("notifications")
        .insert({
          title: title,
          message: message,
          type: "announcement",
          user_id: null, // null means it's a public announcement visible to all
          is_read: false
        });

      if (insertError) {
        console.error("Error saving announcement to database:", insertError);
        throw insertError;
      }

      console.log("Announcement saved to database");

      // Collect tokens from both authenticated users and anonymous users
      const [authUserResponse, anonymousResponse] = await Promise.all([
        supabase.from("profiles").select("expo_push_token").not("expo_push_token", "is", null),
        supabase.from("anonymous_tokens").select("token")
      ]);

      if (authUserResponse.error) {
        throw authUserResponse.error;
      }
      
      if (anonymousResponse.error) {
        throw anonymousResponse.error;
      }

      // Extract tokens from both sources and deduplicate
      const authTokens = authUserResponse.data.map(user => user.expo_push_token);
      const anonymousTokens = anonymousResponse.data.map(entry => entry.token);
      
      // Combine and remove duplicates
      const allTokens = [...new Set([...authTokens, ...anonymousTokens])];
      
      console.log(`Fetched total unique tokens: ${allTokens.length} (${authTokens.length} auth, ${anonymousTokens.length} anon)`);

      // Send notifications in batches
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

        console.log(
          `Preparing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${
            Math.ceil(allTokens.length / BATCH_SIZE)
          }`,
        );
        const result = await sendNotifications(batchNotifications);
        results.push(result);
      }

      console.log("All notifications sent successfully");

      return new Response(JSON.stringify({ success: true, data: results }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    } catch (error) {
      console.error("Detailed error:", error);
      return new Response(
        JSON.stringify({
          error: (error as Error).message,
          details: (error as Error).toString(),
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 400,
        },
      );
    }
  } else {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      headers: { "Content-Type": "application/json" },
      status: 405,
    });
  }
});