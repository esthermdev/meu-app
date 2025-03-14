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

  // Only proceed if this is an INSERT operation
  if (payload.type !== "INSERT") {
    return new Response(JSON.stringify({ message: "No action taken" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: drivers, error } = await supabase
    .from("profiles")
    .select("id, expo_push_token")
    .eq("is_driver", true)
    .eq("is_available", true)

  if (error) {
    console.error("Error fetching drivers:", error);
    throw new Error("Failed to fetch drivers");
  }

  if (drivers && drivers.length > 0) {
    const notification = {
      sound: "default",
      title: "New Cart Request",
      body: `From: ${cartRequest.from_location}${
        cartRequest.from_field_number ? ` ${cartRequest.from_field_number}` : ""
      } To: ${cartRequest.to_location}${
        cartRequest.to_field_number ? ` ${cartRequest.to_field_number}` : ""
      } - Passengers: ${cartRequest.passenger_count} - Special Requests: ${cartRequest.special_request}`,
      data: {
        requestId: cartRequest.id,
        type: "new_cart_request",
      },
      contentAvailable: true,
    };

    const tokens = drivers.map((driver) => driver.expo_push_token);
    const message = {
      to: tokens,
      ...notification,
    };

    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("EXPO_ACCESS_TOKEN")}`,
      },
      body: JSON.stringify(message),
    }).then((res) => res.json());

    return new Response(JSON.stringify(res), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ message: "No action taken" }), {
    headers: { "Content-Type": "application/json" },
  });
});
