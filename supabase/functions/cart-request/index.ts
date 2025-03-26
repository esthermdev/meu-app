// Edge function for cart requests
import { createClient } from "jsr:@supabase/supabase-js@2";

interface CartRequest {
  id: number;
  from_location: string;
  to_location: string;
  from_field_number: number | null;
  to_field_number: number | null;
  status: string;
  passenger_count: number;
  special_request: string;
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: CartRequest;
  schema: "public";
  old_record: null | CartRequest;
}

const supabase = createClient(
  Deno.env.get("EXPO_PUBLIC_SUPABASE_URL")!,
  Deno.env.get("EXPO_PUBLIC_SUPABASE_ANON_KEY")!,
);

Deno.serve(async (req) => {
  const payload: WebhookPayload = await req.json();
  const cartRequest = payload.record;

  // Log the received payload for debugging
  console.log("Received webhook payload:", JSON.stringify(payload));

  // Only proceed if this is an INSERT operation
  if (payload.type !== "INSERT") {
    return new Response(JSON.stringify({ message: "No action taken - not an INSERT operation" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { data: drivers, error } = await supabase
      .from("profiles")
      .select("id, expo_push_token")
      .eq("is_driver", true)
      .eq("is_available", true);

    if (error) {
      console.error("Error fetching drivers:", error);
      return new Response(JSON.stringify({ error: "Database query error", details: error }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${drivers?.length || 0} available drivers`);

    // Filter out drivers without valid push tokens
    const validDrivers = drivers?.filter(driver => 
      driver.expo_push_token && 
      driver.expo_push_token.startsWith('ExponentPushToken[')
    ) || [];

    console.log(`Found ${validDrivers.length} drivers with valid push tokens`);

    if (validDrivers.length > 0) {
      // Format notification
      const notification = {
        sound: "default",
        title: "Cart Requested",
        body: `From: ${cartRequest.from_location}${
          cartRequest.from_field_number ? ` ${cartRequest.from_field_number}` : ""
        } -> To: ${cartRequest.to_location}${
          cartRequest.to_field_number ? ` ${cartRequest.to_field_number}` : ""
        }\nPassengers: ${cartRequest.passenger_count}\n${cartRequest.special_request ? cartRequest.special_request : ""}`,
        data: {
          requestId: cartRequest.id,
          type: "new_cart_request",
        },
        priority: "high",
      };

      // Send to each token individually to ensure delivery
      const sendPromises = validDrivers.map(driver => {
        const message = {
          to: driver.expo_push_token,
          ...notification,
        };

        return fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Accept-Encoding": "gzip, deflate",
          },
          body: JSON.stringify(message),
        }).then(res => res.json());
      });

      // Wait for all notification sends to complete
      const results = await Promise.all(sendPromises);
      console.log("Push notification results:", JSON.stringify(results));

      return new Response(JSON.stringify({ 
        message: "Notifications sent", 
        recipients: tokens.length,
        results 
      }), {
        headers: { "Content-Type": "application/json" },
      });
    } else {
      console.log("No available drivers with valid push tokens found");
      return new Response(JSON.stringify({ 
        message: "No available drivers with valid push tokens found" 
      }), {
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Unexpected error", details: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});