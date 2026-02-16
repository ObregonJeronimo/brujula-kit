// Vercel Serverless Function — creates MercadoPago Checkout Pro preference
// POST /api/create-preference
// Body: { uid, email, nombre, packId, credits, price }

var VALID_PACKS = {
  "pack-10": { credits: 10, price: 18999, title: "10 Cr\u00e9ditos" },
  "pack-25": { credits: 25, price: 35499, title: "25 Cr\u00e9ditos" },
  "pack-40": { credits: 40, price: 53199, title: "40 Cr\u00e9ditos" },
  "pack-60": { credits: 60, price: 79799, title: "60 Cr\u00e9ditos" }
};

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { uid, email, nombre, packId } = req.body;
    if (!uid || !email) return res.status(400).json({ error: "Missing uid or email" });

    // Validate pack — use server-side prices for security
    const pack = VALID_PACKS[packId];
    if (!pack) return res.status(400).json({ error: "Invalid pack: " + packId });

    const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
    if (!ACCESS_TOKEN) return res.status(500).json({ error: "MP_ACCESS_TOKEN not configured" });

    // Determine the base URL for callbacks
    const BASE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.BASE_URL || "https://brujula-kit.vercel.app";

    const preference = {
      items: [
        {
          id: packId,
          title: `Br\u00fajula KIT \u2014 ${pack.title}`,
          description: `${pack.credits} evaluaciones fonoaudiol\u00f3gicas (ELDI + PEFF + Rep. Palabras)`,
          quantity: 1,
          currency_id: "ARS",
          unit_price: pack.price,
        },
      ],
      payer: {
        email: email,
        name: nombre || "",
      },
      // external_reference encodes uid AND credits so webhook knows how many to add
      external_reference: `${uid}|${pack.credits}`,
      back_urls: {
        success: `${BASE_URL}/?payment=success`,
        failure: `${BASE_URL}/?payment=failure`,
        pending: `${BASE_URL}/?payment=pending`,
      },
      auto_return: "approved",
      notification_url: `${BASE_URL}/api/webhook-mp`,
      statement_descriptor: "BRUJULA KIT",
    };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preference),
    });

    const data = await mpRes.json();
    if (!mpRes.ok) {
      console.error("MP error:", data);
      return res.status(500).json({ error: "MercadoPago error", details: data });
    }

    return res.status(200).json({
      init_point: data.init_point,
      sandbox_init_point: data.sandbox_init_point,
      preference_id: data.id,
    });
  } catch (err) {
    console.error("create-preference error:", err);
    return res.status(500).json({ error: err.message });
  }
}
