// Edge function for medical requests
import { createClient } from "jsr:@supabase/supabase-js@2";

interface MedicalRequest {
  id: string;
  field_number: number;
  description_of_emergency: string;
  status: "pending" | "confirmed";
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: MedicalRequest;
  schema: "public";
  old_record: null | MedicalRequest;
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
    const { data: medicalStaff, error } = await supabase
      .from("profiles")
      .select("id, expo_push_token")
      .eq("is_medical_staff", true)
      .eq("is_available", true);

    if (error) {
      console.error("Error fetching medical staff:", error);
      return new Response(JSON.stringify({ error: "Database query error", details: error }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${medicalStaff?.length || 0} available medical staff`);

    // Filter out staff without valid push tokens
    const validStaff = medicalStaff?.filter(staff => 
      staff.expo_push_token && 
      staff.expo_push_token.startsWith('ExponentPushToken[')
    ) || [];

    console.log(`Found ${validStaff.length} medical staff with valid push tokens`);

    if (validStaff.length > 0) {
      // Format notification
      const notification = {
        sound: "default",
        title: "Medical Assistance Required",
        body: `Location: Field ${payload.record.field_number}\n${payload.record.description_of_emergency}`,
        data: {
          requestId: payload.record.id,
          type: "new_medic_request",
          field: payload.record.field_number,
        },
        priority: "high",
      };

      // Send to each token individually
      const sendPromises = validStaff.map(staff => {
        const message = {
          to: staff.expo_push_token,
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
        recipients: validStaff.length,
        results 
      }), {
        headers: { "Content-Type": "application/json" },
      });
    } else {
      console.log("No available medical staff with valid push tokens found");
      return new Response(JSON.stringify({ 
        message: "No available medical staff with valid push tokens found" 
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