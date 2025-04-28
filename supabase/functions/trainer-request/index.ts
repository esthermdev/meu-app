// Edge function for medical requests
import { createClient } from "jsr:@supabase/supabase-js@2";

interface MedicalRequest {
  id: string;
  field_number: number;
  description_of_emergency: string;
  status: "pending" | "confirmed";
  team_name?: string; // Add this to support team name
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
    
    // Get medical staff who should receive notifications
    const { data: medicalStaff, error } = await supabase
      .from("profiles")
      .select("id, expo_push_token")
      .eq("is_medical_staff", true)
      .eq("is_available", true)
      .eq("is_logged_in", true);

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
      // Format notification - now includes field name instead of just ID
      // Also include team name if available
      const teamInfo = payload.record.team_name ? `\nTeam: ${payload.record.team_name}` : '';
      
      const notification = {
        sound: "default",
        title: "Medical Assistance Required",
        body: `Location: ${fieldName}\n${payload.record.description_of_emergency}${teamInfo}`,
        data: {
          requestId: payload.record.id,
          type: "new_medic_request",
          field: payload.record.field_number,
          fieldName: fieldName,
          teamName: payload.record.team_name
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