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
  requester_token: string | null;
  anon_device_id: string | null;
  driver: string | null;
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

  // Handle INSERT operation (new request -> notify drivers)
  if (payload.type === "INSERT") {
    return await handleNewCartRequest(cartRequest);
  } 
  // Handle UPDATE operation (request accepted -> notify requester)
  else if (payload.type === "UPDATE" && 
           payload.old_record && 
           payload.old_record.status === "pending" && 
           cartRequest.status === "confirmed") {
    return await handleRequestAccepted(cartRequest);
  }

  return new Response(JSON.stringify({ message: "No action taken" }), {
    headers: { "Content-Type": "application/json" },
  });
});

// Function to handle new cart requests - notify available drivers
async function handleNewCartRequest(cartRequest: CartRequest) {
  try {
    // Fetch field names for any field numbers in the request
    const fieldNames = await getFieldNames([
      cartRequest.from_field_number, 
      cartRequest.to_field_number
    ].filter(Boolean) as number[]);

    const { data: drivers, error } = await supabase
      .from("profiles")
      .select("id, expo_push_token")
      .eq("is_driver", true)
      .eq("is_available", true)
      .eq("is_logged_in", true)

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
      // Format from location with field name if applicable
      let fromDisplay = cartRequest.from_location;
      if (cartRequest.from_location === 'Field' && cartRequest.from_field_number) {
        const fieldName = fieldNames[cartRequest.from_field_number];
        fromDisplay += fieldName ? ` ${fieldName}` : ` ${cartRequest.from_field_number}`;
      }

      // Format to location with field name if applicable
      let toDisplay = cartRequest.to_location;
      if (cartRequest.to_location === 'Field' && cartRequest.to_field_number) {
        const fieldName = fieldNames[cartRequest.to_field_number];
        toDisplay += fieldName ? ` ${fieldName}` : ` ${cartRequest.to_field_number}`;
      }

      // Format notification
      const notification = {
        sound: "default",
        title: "Cart Requested",
        body: `From: ${fromDisplay} -> To: ${toDisplay}\nPassengers: ${cartRequest.passenger_count}\n${cartRequest.special_request ? cartRequest.special_request : ""}`,
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
        recipients: validDrivers.length,
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
}

// New function to handle accepted requests - notify the requester
async function handleRequestAccepted(cartRequest: CartRequest) {
  try {
    console.log("Handling request accepted for ID:", cartRequest.id);
    
    // Fetch field names for any field numbers in the request
    const fieldNames = await getFieldNames([
      cartRequest.from_field_number, 
      cartRequest.to_field_number
    ].filter(Boolean) as number[]);
    
    // Get the push token to notify - either from request directly or anonymous_tokens table
    let pushToken = null;
    
    // Check if there's a direct requester_token (authenticated user)
    if (cartRequest.requester_token) {
      pushToken = cartRequest.requester_token;
      console.log("Using authenticated user token:", pushToken);
    } 
    // If no direct token, check for anonymous token using anon_device_id
    else if (cartRequest.anon_device_id) {
      const { data, error } = await supabase
        .from("anonymous_tokens")
        .select("token")  // Use "token" instead of "push_token" to match your schema
        .eq("device_id", cartRequest.anon_device_id)
        .single();
      
      if (error) {
        console.error("Error fetching anonymous token:", error);
      } else if (data && data.token) {
        pushToken = data.token;
        console.log("Using anonymous token:", pushToken);
      }
    }
    
    // If we have a token, send the notification
    if (pushToken) {
      // Get driver name if available
      let driverName = "A driver";
      if (cartRequest.driver) {
        const { data: driverProfile, error } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", cartRequest.driver)
          .single();
          
        if (!error && driverProfile && driverProfile.full_name) {
          driverName = driverProfile.full_name;
        }
      }
      
      // Format from location with field name if applicable
      let fromDisplay = cartRequest.from_location;
      if (cartRequest.from_location === 'Field' && cartRequest.from_field_number) {
        const fieldName = fieldNames[cartRequest.from_field_number];
        fromDisplay += fieldName ? ` ${fieldName}` : ` ${cartRequest.from_field_number}`;
      }

      // Format to location with field name if applicable
      let toDisplay = cartRequest.to_location;
      if (cartRequest.to_location === 'Field' && cartRequest.to_field_number) {
        const fieldName = fieldNames[cartRequest.to_field_number];
        toDisplay += fieldName ? ` ${fieldName}` : ` ${cartRequest.to_field_number}`;
      }
      
      const message = {
        to: pushToken,
        sound: "default",
        title: "Driver on the way!",
        body: `${driverName} is on the way to pick you up from ${fromDisplay} to ${toDisplay}.`,
        data: {
          requestId: cartRequest.id,
          type: "cart_request_accepted",
        },
        priority: "high",
      };
      
      console.log("Sending notification with message:", JSON.stringify(message));
      
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Accept-Encoding": "gzip, deflate",
        },
        body: JSON.stringify(message),
      });
      
      const result = await response.json();
      console.log("Requester notification result:", JSON.stringify(result));
      
      return new Response(JSON.stringify({ 
        message: "Requester notification sent", 
        result 
      }), {
        headers: { "Content-Type": "application/json" },
      });
    } else {
      console.log("No valid push token found for the requester");
      return new Response(JSON.stringify({ 
        message: "No valid push token found for the requester" 
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
}

// Helper function to get field names from field IDs
async function getFieldNames(fieldIds: number[]): Promise<Record<number, string>> {
  // If no field IDs, return empty object
  if (!fieldIds.length) return {};
  
  try {
    const { data, error } = await supabase
      .from("fields")
      .select("id, name")
      .in("id", fieldIds);
      
    if (error) {
      console.error("Error fetching field names:", error);
      return {};
    }
    
    // Create a mapping of field IDs to names
    const fieldMap: Record<number, string> = {};
    if (data) {
      data.forEach(field => {
        fieldMap[field.id] = field.name;
      });
    }
    
    return fieldMap;
  } catch (err) {
    console.error("Error in getFieldNames:", err);
    return {};
  }
}