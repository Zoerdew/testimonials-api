const AIRTABLE_BASE  = process.env.AIRTABLE_BASE  || "appxlO24uZDwlswrq";
const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE || "Testimonials";

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGIN ||
  "https://zoedew.com,https://www.zoedew.com")
  .split(",").map((s) => s.trim());

function resolveOrigin(req) {
  const origin = req.headers.origin || "";
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", resolveOrigin(req));
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!process.env.AIRTABLE_TOKEN) {
    return res.status(500).json({ error: "Server not configured" });
  }

  try {
    const q = req.query || {};
    const wantType = q.type ? String(q.type) : "";
    const wantPage = q.page ? String(q.page) : "";

    const clauses = ["{Approved}=TRUE()"];
    if (wantType) {
      clauses.push(`{Work Type}="${wantType.replace(/"/g, '\\"')}"`);
    }
    if (wantPage) {
      clauses.push(`FIND("${wantPage.replace(/"/g, '\\"')}",ARRAYJOIN({Show on page}))>0`);
    }
    const formula = clauses.length === 1 ? clauses[0] : `AND(${clauses.join(",")})`;

    const params = new URLSearchParams();
    params.set("filterByFormula", formula);
    params.append("sort[0][field]", "Submitted");
    params.append("sort[0][direction]", "desc");
    params.set("pageSize", "100");

    const url =
      `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(AIRTABLE_TABLE)}` +
      `?${params.toString()}`;

    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}` },
    });

    if (!r.ok) {
      console.error("Airtable error:", r.status, await r.text());
      return res.status(502).json({ error: "Could not load testimonials" });
    }

    const data = await r.json();
    const readAI = (v) => {
      if (v == null) return "";
      if (typeof v === "string") return v;
      if (typeof v === "object" && typeof v.value === "string") return v.value;
      return "";
    };

    const testimonials = (data.records || []).map((rec) => {
      const f = rec.fields;
      const headline = readAI(f["Headline"]).trim();
      const quote = (readAI(f["Pull quote"]) || f["Testimonial"] || "").trim();
      return {
        name: f["Name"] || "",
        company: f["Company"] || "",
        role: f["Role / Company"] || "",
        workType: f["Work Type"] || "",
        headline: headline,
        quote: quote,
        rating: f["Rating"] || null,
        photo: f["Photo URL"] || "",
        link: f["Link"] || "",
      };
    });

    return res.status(200).json({ testimonials });
  } catch (err) {
    console.error("testimonials handler error:", err);
    return res.status(500).json({ error: "Unexpected error" });
  }
}
