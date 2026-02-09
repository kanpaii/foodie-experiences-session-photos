import crypto from "crypto";

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
  const prefix = `${folder}/`;
  const timestamp = Math.floor(Date.now() / 1000);

  const signatureBase = `prefix=${prefix}&timestamp=${timestamp}`;
  const signature = crypto.createHash("sha1").update(signatureBase + apiSecret).digest("hex");

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/resources/image?prefix=${encodeURIComponent(prefix)}&timestamp=${timestamp}&api_key=${apiKey}&signature=${signature}`;

  const r = await fetch(url);
  const data = await r.json();
  if (!r.ok) return res.status(r.status).json(data);

  const urls = (data.resources || []).map(x => x.secure_url);
  res.status(200).json({ code, count: urls.length, urls });
