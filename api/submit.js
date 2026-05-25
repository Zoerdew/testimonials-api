// =====================================================================
//  POST /api/submit  -- receives a testimonial from the website form
//  and creates a record in Airtable. The API key never leaves the server.
//
//  Deploy target: Vercel (this file goes at  /api/submit.js)
//
//  Required environment variables (set in Vercel project settings):
//    AIRTABLE_TOKEN   -> your Airtable personal access token
//    AIRTABLE_BASE    -> appxlO24uZDwlswrq
//    AIRTABLE_TABLE   -> Testimonials
//
//  Optional:
//    ALLOWED_ORIGIN   -> https://www.zoedew.com  (locks CORS to your site)
// =====================================================================

const AIRTABLE_BASE  = process.env.AIRTABLE_BASE  || "appxlO24uZDwlswrq";
const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE || "Testimonials";

// the valid work types; anything else is rejected
const WORK_TYPES = [
  "One-to-one",
  "Training",
  "Speaking",
  "100 Reps Club",
  "Something else",
];

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default async function handler(req, res) {
  const headers = corsHeaders();
  Object.entries(headers).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!process.env.AIRTABLE_TOKEN) {
    return res.status(500).json({ error: "Server not configured" });
  }

  const body = typeof req.body === "string" ? safeParse(req.body) : (req.body || {});

  const name = String(body.name || "").trim();
  const company = String(body.company || "").trim();
  const testimonial = String(body.testimonial || "").trim();
  const workType = String(body.workType || "").trim();

  if (!name || !company || !testimonial || !workType) {
    return res.status(400).json({ error: "Name, company, work type and testimonial are required" });
  }
  if (!WORK_TYPES.includes(workType)) {
    return res.status(400).json({ error: "Unknown work type" });
  }
  // length guards against junk / abuse
  if (name.length > 120 || company.length > 160 || testimonial.length > 4000) {
    return res.status(400).json({ error: "Submission too long" });
  }

  const fields = {
    "Name": name,
    "Company": company,
    "Work Type": workType,
    "Testimonial": testimonial,
    "Submitted": new Date().toISOString(),
    "Approved": false, // always starts unapproved; you approve in Airtable
  };

  const role = String(body.role || "").trim();
  if (role) fields["Role / Company"] = role;

  const context = String(body.context || "").trim();
  if (context) fields["Context answers"] = context.slice(0, 6000);

  const recommend = String(body.recommend || "").trim();
  if (recommend) fields["Recommend to"] = recommend.slice(0, 2000);

  const rating = Number(body.rating);
  if (rating >= 1 && rating <= 5) fields["Rating"] = Math.round(rating);

  const photo = String(body.photo || "").trim();
  if (/^https?:\/\//i.test(photo)) fields["Photo URL"] = photo;

  const link = String(body.link || "").trim();
  if (/^https?:\/\//i.test(link)) fields["Link"] = link;

  try {
    const r = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_TABLE)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ records: [{ fields }], typecast: true }),
      }
    );

    if (!r.ok) {
      console.error("Airtable error:", r.status, await r.text());
      return res.status(502).json({ error: "Could not save testimonial" });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("submit handler error:", err);
    return res.status(500).json({ error: "Unexpected error" });
  }
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return {}; }
}
