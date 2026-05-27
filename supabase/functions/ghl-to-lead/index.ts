// Inbound: GHL -> Supabase
// Public endpoint. GHL workflow webhook posts here when an opportunity
// stage changes (or a contact is created/updated).
// Upserts the leads row with last_source='ghl' to prevent loops.
//
// Required Supabase secrets:
//   SUPABASE_URL                  (auto-injected by Supabase)
//   SUPABASE_SERVICE_ROLE_KEY     (auto-injected by Supabase)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// GHL workflow merge fields only expose stage NAME, not stage UUID.
// Map the name we receive back to the UUID the dashboard expects.
const PIPELINE_ID = "WIL2HBe5ReETBdRnnwfX";
const STAGE_NAME_TO_ID: Record<string, string> = {
  "New Lead": "c1717568-7aa4-4f60-9b89-beead7b0ea23",
  "Contacted": "133223f5-f21e-4a18-9011-352154a7e923",
  "Qualified": "322a153e-2211-4302-951b-f6a1a5432a8e",
  "Proposal Sent": "736ce93d-0800-40f8-ac79-8d4c8d3c9448",
  "Negotiation": "3261c5ae-2a66-4fcf-86ed-94034266e32f",
  "Closed": "b5009947-3028-4255-8dd4-a593325f3f91",
};

// Helper: pull a value from any of several possible keys (GHL payloads vary)
function pick<T = any>(obj: any, ...keys: string[]): T | undefined {
  for (const k of keys) {
    const parts = k.split(".");
    let cur = obj;
    for (const p of parts) {
      if (cur == null) break;
      cur = cur[p];
    }
    if (cur !== undefined && cur !== null && cur !== "") return cur as T;
  }
  return undefined;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), { status: 400 });
  }

  // Log the raw payload so we can see exactly what GHL sends
  console.log("RAW PAYLOAD:", JSON.stringify(payload));

  // GHL workflow webhook field names vary. Map both camelCase and snake_case.
  const opportunity_id = pick(payload, "opportunity_id", "opportunityId", "id");
  const contact_id = pick(payload, "contact_id", "contactId", "contact.id");
  const pipeline_id = pick(payload, "pipeline_id", "pipelineId");
  const stage_id = pick(payload, "pipeline_stage_id", "pipelineStageId", "stageId");
  const stage = pick(payload, "pipeline_stage", "pipelineStageName", "stage");
  const first_name = pick(payload, "first_name", "firstName", "contact.firstName");
  const last_name = pick(payload, "last_name", "lastName", "contact.lastName");
  const email = pick(payload, "email", "contact.email");
  const phone = pick(payload, "phone", "contact.phone");

  // Custom fields (sent from Contact Updated workflow)
  const industry = pick(payload, "industry");
  const team_size = pick(payload, "team_size");
  const role = pick(payload, "role");
  const problem = pick(payload, "problem");
  const urgency = pick(payload, "urgency");
  const budget = pick(payload, "budget");
  const timeline = pick(payload, "timeline", "decision_timeline");
  const source = pick(payload, "source");

  if (!contact_id) {
    return new Response(
      JSON.stringify({ error: "missing contact_id in payload", payload }),
      { status: 400 },
    );
  }

  const row: Record<string, any> = {
    contact_id,
    last_source: "ghl",
    updated_at: new Date().toISOString(),
  };

  if (opportunity_id) row.opportunity_id = opportunity_id;
  row.pipeline_id = pipeline_id || PIPELINE_ID;
  const resolved_stage_id = stage_id || (stage ? STAGE_NAME_TO_ID[stage.trim()] : undefined);
  if (resolved_stage_id) row.stage_id = resolved_stage_id;
  if (stage) row.stage = stage;
  if (first_name) row.first_name = first_name;
  if (last_name) row.last_name = last_name;
  if (email) row.email = email;
  if (phone) row.phone = phone;
  if (industry) row.industry = industry;
  if (team_size) row.team_size = team_size;
  if (role) row.role = role;
  if (problem) row.problem = problem;
  if (urgency) row.urgency = urgency;
  if (budget) row.budget = budget;
  if (timeline) row.decision_timeline = timeline;
  if (source) row.source = source;

  const { error } = await supabase
    .from("leads")
    .upsert(row, { onConflict: "contact_id" });

  if (error) {
    console.error("Supabase upsert failed:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true, opportunity_id }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
