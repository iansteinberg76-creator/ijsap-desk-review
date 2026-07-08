const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const token = event.headers["x-ijsap-token"];
  if (!token || token !== process.env.IJSAP_SECRET) {
    return { statusCode: 403, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  const id = event.queryStringParameters?.id;
  if (!id) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "id parameter is required" })
    };
  }

  const { data, error } = await supabase
    .from("desk_reviews")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return {
      statusCode: 404,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Not found" })
    };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  };
};
