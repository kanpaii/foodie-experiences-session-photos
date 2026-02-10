const crypto = require("crypto");

module.exports = function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // Vercel peut donner req.body déjà objet, ou string
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const folder = body.folder;
    const adminCode = body.adminCode;

    if (!folder) return res.status(400).json({ error: "Missing folder" });

    const required = process.env.FE_ADMIN_CODE || "";
    if (required && adminCode !== required) {
      return res.status(401).json({ error: "Unauthorized" }); // <-- guillemets !
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return res.status(500).json({ error: "Missing Cloudinary env vars" });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;

    const signature = crypto
      .createHash("sha1")
      .update(paramsToSign + apiSecret)
      .digest("hex");

    return res.status(200).json({ cloudName, apiKey, timestamp, signature });
  } catch (e) {
    return res.status(500).json({ error: "sign crashed", details: String(e?.message || e) });
  }
};

