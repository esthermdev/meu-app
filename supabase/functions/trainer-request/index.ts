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

  // Only proceed if this is an INSERT operation
  if (payload.type !== "INSERT") {
    return new Response(JSON.stringify({ message: "No action taken" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: medicalStaff } = await supabase
    .from("profiles")
    .select("id, expo_push_token")
    .eq("is_medical_staff", true)
    .eq("is_available", true);

  if (medicalStaff && medicalStaff.length > 0) {
    const notification = {
      title: "Requesting Trainer",
      body: `Assistance is required at Field ${payload.record.field_number}. \nDescription: ${payload.record.description_of_emergency}`,
      data: {
        requestId: payload.record.id,
        type: "new_medic_request",
      },
    };

    const messages = medicalStaff.map((staff) => ({
      to: staff.expo_push_token,
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
