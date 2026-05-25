const AIRTABLE_BASE  = process.env.AIRTABLE_BASE  || "appxlO24uZDwlswrq";
const AIRTABLE_TABLE = process.env.AIRTABLE_TABLE || "Testimonials";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
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
    const wantType = (req.query && req.query.type) ? String(req.query.type) : "";
    let formula = "{Approved}=TRUE()";
    if (wantType) {
      const safe = wantType.replace(/"/g, '\\"');
      formula = `AND({Approved}=TRUE(),{Work Type}="${safe}")`;
    }

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
    const testimonials = (data.records || []).map((rec) => {
      const f = rec.fields;
      const quote = (f["Quote final"] || f["Testimonial"] || "").trim();
      return {
        name: f["Name"] || "",
        company: f["Company"] || "",
        role: f["Role / Company"] || "",
        workType: f["Work Type"] || "",
        headline: (f["Headline final"] || "").trim(),
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
