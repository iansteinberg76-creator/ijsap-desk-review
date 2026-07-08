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

  const params = event.queryStringParameters || {};

  let query = supabase
    .from("desk_reviews")
    .select("*")
    .order("assessment_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (params.outcome) {
    query = query.eq("outcome", params.outcome);
  }

  if (params.genre) {
    query = query.eq("genre", params.genre);
  }

  if (params.editor) {
    query = query.ilike("editors", `%${params.editor}%`);
  }

  if (params.submission) {
    query = query.or(
      `submission_id.ilike.%${params.submission}%,submission_title.ilike.%${params.submission}%`
    );
  }

  if (params.from) {
    query = query.gte("assessment_date", params.from);
  }

  if (params.to) {
    query = query.lte("assessment_date", params.to);
  }

  const { data, error } = await query;

  if (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Database error" })
    };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data || [])
  };
};
