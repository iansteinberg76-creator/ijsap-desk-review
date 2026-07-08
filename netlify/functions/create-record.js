const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

function generateId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

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

  const maxRetries = 5;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const id = generateId();
    const origin = event.headers.origin || event.headers.referer?.replace(/\/[^/]*$/, "") || "";
    const shareableUrl = `${origin}/?id=${id}`;

    const row = {
      id,
      submission_id: body.submission_id || "",
      submission_title: body.submission_title || "",
      genre: body.genre || "",
      suggested_genre: body.suggested_genre || null,
      editors: body.editors || "",
      assessment_date: body.assessment_date || null,
      reviewed_by: body.reviewed_by || null,
      reviewed_date: body.reviewed_date || null,
      layer_of_decision: body.layer_of_decision || "",
      outcome: body.outcome || "",
      key_reason: body.key_reason || "",
      points_to_carry_forward: body.points_to_carry_forward || null,
      formatting_note: body.formatting_note || null,
      email_text: body.email_text || "",
      shareable_url: shareableUrl,
      rubric_version: body.rubric_version || "",
      content_version: body.content_version || "",
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from("desk_reviews").insert(row);

    if (!error) {
      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, url: shareableUrl })
      };
    }

    // If not a primary key collision, stop retrying
    if (!error.message?.includes("duplicate key") && error.code !== "23505") {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Database error" })
      };
    }
  }

  return {
    statusCode: 500,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ error: "Could not generate unique ID" })
  };
};
