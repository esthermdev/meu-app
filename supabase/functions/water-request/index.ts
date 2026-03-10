// deno-lint-ignore no-import-prefix
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

interface VolunteerRecipient {
  id: string;
  expo_push_token: string | null;
}

const supabase = createClient(
  Deno.env.get("EXPO_PUBLIC_SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("EXPO_PUBLIC_SUPABASE_ANON_KEY")!,
);

Deno.serve(async (req) => {
  const payload: WebhookPayload = await req.json();

  // Only proceed if this is an INSERT operation
  if (payload.type !== "INSERT") {
    return new Response(JSON.stringify({ message: "No action taken - not an INSERT operation" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // First, get the field information to include the field name
    const { data: fieldData, error: fieldError } = await supabase
      .from("fields")
      .select("name")
      .eq("id", payload.record.field_number)
      .single();

    if (fieldError) {
      console.error("Error fetching field name:", fieldError);
    }

    const fieldName = fieldData?.name || `Field ${payload.record.field_number}`;

    const { data: volunteers, error } = await supabase
      .from("profiles")
      .select("id, expo_push_token, profile_roles!inner(roles!inner(key))")
      .eq("profile_roles.roles.key", "volunteer")
      .eq("is_available", true)
      .eq("is_logged_in", true)
      
    if (error) {
      console.error("Error querying volunteers:", error);
      return new Response(JSON.stringify({ error: "Database query error", details: error }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Filter out volunteers without valid push tokens
    const validVolunteers = (volunteers as VolunteerRecipient[] | null)?.filter((volunteer: VolunteerRecipient) => 
      volunteer.expo_push_token && 
      volunteer.expo_push_token.startsWith('ExponentPushToken[')
    ) || [];

    if (validVolunteers.length > 0) {
      // Format notification - now using field name instead of just number
      const notification = {
        sound: "default",
        title: "Water Requested",
        body: `Please refill water jugs at ${fieldName}`,
        data: {
          requestId: payload.record.id,
          type: "new_water_request",
          field: payload.record.field_number,
          fieldName: fieldName  // Include field name in data payload
        },
        priority: "high",
      };

      // Send to each token individually
      const sendPromises = validVolunteers.map((volunteer: VolunteerRecipient) => {
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

      return new Response(JSON.stringify({ 
        message: "Notifications sent", 
        recipients: validVolunteers.length,
        results 
      }), {
        headers: { "Content-Type": "application/json" },
      });
    } else {
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