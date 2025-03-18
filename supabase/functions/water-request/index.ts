// Edge function for water requests
import { createClient } from "jsr:@supabase/supabase-js@2";

interface WaterRequest {
  id: string;
  field_number: number;
  status: "pending" | "confirmed";
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: WaterRequest;
  schema: "public";
  old_record: null | WaterRequest;
}

const supabase = createClient(
  Deno.env.get("EXPO_PUBLIC_SUPABASE_URL")!,
  Deno.env.get("EXPO_PUBLIC_SUPABASE_ANON_KEY")!,
);

Deno.serve(async (req) => {
  const payload: WebhookPayload = await req.json();
  
  // Log the received payload for debugging
  console.log("Received webhook payload:", JSON.stringify(payload));

  // Only proceed if this is an INSERT operation
  if (payload.type !== "INSERT") {
    return new Response(JSON.stringify({ message: "No action taken - not an INSERT operation" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { data: volunteers, error } = await supabase
      .from("profiles")
      .select("id, expo_push_token")
      .eq("is_volunteer", true)
      .eq("is_available", true);
      
    if (error) {
      console.error("Error querying volunteers:", error);
      return new Response(JSON.stringify({ error: "Database query error", details: error }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${volunteers?.length || 0} available volunteers`);

    // Filter out volunteers without valid push tokens
    const validVolunteers = volunteers?.filter(volunteer => 
      volunteer.expo_push_token && 
      volunteer.expo_push_token.startsWith('ExponentPushToken[')
    ) || [];

    console.log(`Found ${validVolunteers.length} volunteers with valid push tokens`);

    if (validVolunteers.length > 0) {
      // Format notification
      const notification = {
        sound: "default",
        title: "Water Requested",
        body: `Please refill water jugs at Field ${payload.record.field_number}`,
        data: {
          requestId: payload.record.id,
          type: "new_water_request",
          field: payload.record.field_number,
        },
        priority: "high",
      };

      // Send to each token individually
      const sendPromises = validVolunteers.map(volunteer => {
        const message = {
          to: volunteer.expo_push_token,
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
        recipients: validVolunteers.length,
        results 
      }), {
        headers: { "Content-Type": "application/json" },
      });
    } else {
      console.log("No available volunteers with valid push tokens found");
      return new Response(JSON.stringify({ 
        message: "No available volunteers with valid push tokens found" 
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