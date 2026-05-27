// Outbound: Supabase -> GHL
// Triggered by a Supabase database webhook on UPDATE of `leads`.
// Pushes stage changes to GHL opportunities + contact field changes to GHL contacts.
//
// Required Supabase secrets:
//   GHL_PIT_TOKEN - Private Integration Token from GHL Settings -> Private Integrations

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GHL_TOKEN = Deno.env.get("GHL_PIT_TOKEN")!;
const GHL_API_BASE = "https://services.leadconnectorhq.com";
const GHL_LOCATION_ID = "1DYXEfvDtxIGCiAc9OOP";

// Map dashboard column -> GHL custom field UUID
const CUSTOM_FIELD_IDS: Record<string, string> = {
  industry: "oNiZGANXI6gvLhYmuivV",
  team_size: "W9BrEfvjsxqa1gzPIJKM",
  role: "fLtizRcimZ3SKXp4rv8W",
  problem: "QSoE7caCfx9UoM085RVX",
  urgency: "R2JZSRpuKvR1o0E1TlAY",
  budget: "SHneXCmps11TkpMlCEpR",
  decision_timeline: "sxBnIb7BEhvkcNGKGejz",
  source: "v9BUJ8EZ218qLqEmxqJU",
};

// Standard contact fields that map directly to GHL contact body keys
const STANDARD_FIELD_MAP: Record<string, string> = {
  first_name: "firstName",
  last_name: "lastName",
  email: "email",
  phone: "phone",
};

serve(async (req) => {
  // Diagnostics
  if (req.method === "GET") {
    const url = new URL(req.url);

    const getContactId = url.searchParams.get("get-contact");
    if (getContactId) {
      try {
        const res = await fetch(`${GHL_API_BASE}/contacts/${getContactId}`, {
          headers: {
            Authorization: `Bearer ${GHL_TOKEN}`,
            Version: "2021-07-28",
            Accept: "application/json",
          },
        });
        const body = await res.text();
        return new Response(
          JSON.stringify({ ghl_status: res.status, ghl_response: body }, null, 2),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      } catch (e) {
        return new Response(
          JSON.stringify({ error: String(e) }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    if (url.searchParams.has("list-custom-fields")) {
      try {
        const res = await fetch(
          `${GHL_API_BASE}/locations/${GHL_LOCATION_ID}/customFields`,
          {
            headers: {
              Authorization: `Bearer ${GHL_TOKEN}`,
              Version: "2021-07-28",
              Accept: "application/json",
            },
          },
        );
        const body = await res.text();
        return new Response(
          JSON.stringify({ ghl_status: res.status, ghl_response: body }, null, 2),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      } catch (e) {
        return new Response(
          JSON.stringify({ error: String(e) }),
          { status: 500, headers: { "Content-Type": "application/json" } },
        );
      }
    }
    return new Response("Method not allowed", { status: 405 });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), { status: 400 });
  }

  const { type, record, old_record } = payload;

  if (type !== "UPDATE") {
    return new Response(JSON.stringify({ skipped: "not an update" }), { status: 200 });
  }

  // Loop prevention: skip writes that came from GHL itself
  if (record?.last_source === "ghl") {
    return new Response(JSON.stringify({ skipped: "source is ghl" }), { status: 200 });
  }

  const results: Record<string, any> = {};

  // 1) Stage change -> PUT /opportunities/{id}
  const stageChanged = record?.stage_id !== old_record?.stage_id;
  if (stageChanged && record?.opportunity_id && record?.stage_id) {
    const res = await fetch(`${GHL_API_BASE}/opportunities/${record.opportunity_id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GHL_TOKEN}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ pipelineStageId: record.stage_id }),
    });
    if (!res.ok) {
      const error = await res.text();
      console.error("GHL opportunity update failed:", res.status, error);
      results.opportunity = { status: res.status, error };
    } else {
      results.opportunity = { ok: true };
    }
  }

  // 2) Contact field change -> PUT /contacts/{contactId}
  if (record?.contact_id) {
    const contactBody: Record<string, any> = {};

    // Standard fields
    for (const [col, ghlKey] of Object.entries(STANDARD_FIELD_MAP)) {
      if (record[col] !== old_record?.[col] && record[col] != null) {
        contactBody[ghlKey] = record[col];
      }
    }

    // Custom fields
    const customFields: { id: string; field_value: any }[] = [];
    for (const [col, cfId] of Object.entries(CUSTOM_FIELD_IDS)) {
      if (record[col] !== old_record?.[col] && record[col] != null) {
        customFields.push({ id: cfId, field_value: record[col] });
      }
    }
    if (customFields.length) {
      contactBody.customFields = customFields;
    }

    if (Object.keys(contactBody).length > 0) {
      const res = await fetch(`${GHL_API_BASE}/contacts/${record.contact_id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${GHL_TOKEN}`,
          Version: "2021-07-28",
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(contactBody),
      });
      if (!res.ok) {
        const error = await res.text();
        console.error("GHL contact update failed:", res.status, error);
        results.contact = { status: res.status, error, sent: contactBody };
      } else {
        results.contact = { ok: true, sent: contactBody };
      }
    }
  }

  if (Object.keys(results).length === 0) {
    return new Response(JSON.stringify({ skipped: "no relevant changes" }), { status: 200 });
  }

  const anyFailed = Object.values(results).some((r: any) => r.error);
  return new Response(JSON.stringify(results), {
    status: anyFailed ? 502 : 200,
    headers: { "Content-Type": "application/json" },
  });
});
