export default async function handler(req, res) {
  const code = (req.query.code || "").toString().trim().toUpperCase();
  if (!code) return res.status(400).json({ error: "Missing code" });

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return res.status(500).json({ error: "Missing Cloudinary env vars" });
  }

  const folder = `fe_sessions/${code}`;

  // Cloudinary Search API
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/search`;

  const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");

  const body = {
    expression: `folder:${folder}`,
    sort_by: [{ created_at: "desc" }],
    max_results: 50,
    with_field: ["context"], // optional; you can remove to be even faster
  };

  // simple timeout (10s) so the browser doesn't hang forever
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 10000);

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json(data);

    const urls = (data.resources || []).map(x => x.secure_url);
    return res.status(200).json({ code, count: urls.length, urls });
  } catch (e) {
    return res.status(504).json({ error: "Cloudinary list timeout" });
  } finally {
    clearTimeout(t);
  }
}
