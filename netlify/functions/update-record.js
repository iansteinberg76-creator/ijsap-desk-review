const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const token = event.headers["x-ijsap-token"];
  if (!token || token !== process.env.IJSAP_SECRET) {
    return { statusCode: 403, body: JSON.stringify({ error: "Unauthorized" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON" }) };
  }

  const { id, expected_updated_at, ...fields } = body;

  if (!id || !expected_updated_at) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "id and expected_updated_at are required" })
    };
  }

  // Fetch current record to check optimistic lock
  const { data: existing, error: fetchError } = await supabase
    .from("desk_reviews")
    .select("updated_at")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return {
      statusCode: 404,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Not found" })
    };
  }

  // Compare timestamps for optimistic locking
  const storedTime = new Date(existing.updated_at).getTime();
  const expectedTime = new Date(expected_updated_at).getTime();

  if (storedTime !== expectedTime) {
    return {
      statusCode: 409,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Conflict", updated_at: existing.updated_at })
    };
  }

  const now = new Date().toISOString();

  const updateFields = {};
  const allowedFields = [
    "submission_id", "submission_title", "genre", "suggested_genre",
    "editors", "assessment_date", "reviewed_by", "reviewed_date",
    "layer_of_decision", "outcome", "key_reason", "points_to_carry_forward",
    "formatting_note", "email_text", "shareable_url",
    "rubric_version", "content_version"
  ];

  for (const field of allowedFields) {
    if (field in fields) {
      updateFields[field] = fields[field];
    }
  }

  updateFields.updated_at = now;

  const { error: updateError } = await supabase
    .from("desk_reviews")
    .update(updateFields)
    .eq("id", id);

  if (updateError) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Database error" })
    };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, updated: true, updated_at: now })
  };
};
