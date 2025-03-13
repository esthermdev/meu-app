import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

interface WaterRequests {
  id: string;
  field_number: number;
  status: "pending" | "confirmed";
}

interface WebhookPayload {
  type: "INSERT" | "DELETE";
  table: string;
  record: WaterRequests;
  schema: "public";
  old_record: null | WaterRequests;
}

const supabase = createClient(
  Deno.env.get("EXPO_PUBLIC_SUPABASE_URL")!,
  Deno.env.get("EXPO_PUBLIC_SUPABASE_ANON_KEY")!,
);

Deno.serve(async (req) => {
  const payload: WebhookPayload = await req.json();

  // Only proceed if this is an INSERT operation
  if (payload.type !== "INSERT") {
    return new Response(JSON.stringify({ message: "No action taken" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: volunteers, error: queryError } = await supabase
  .from("profiles")
  .select("id, expo_push_token")
  .eq("is_volunteer", true)
  .not("expo_push_token", "is", null);
  
  if (queryError) {
    console.error("Error querying volunteers:", queryError);
    return new Response(JSON.stringify({ error: "Database query error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (volunteers && volunteers.length > 0) {
    const notification = {
      title: "Water Requested",
      body: `Please refill water jugs at Field ${payload.record.field_number}`,
      data: {
        requestId: payload.record.id,
        type: "new_water_request",
      },
    };

    const messages = volunteers.map((volunteer) => ({
      to: volunteer.expo_push_token,
      ...notification,
    }));

    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("EXPO_ACCESS_TOKEN")}`,
      },
      body: JSON.stringify(messages),
    }).then((res) => res.json());

    return new Response(JSON.stringify(res), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ message: "No action taken" }), {
    headers: { "Content-Type": "application/json" },
  });
});
