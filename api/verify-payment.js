// Vercel Serverless Function — verify payment and credit user
// POST /api/verify-payment
// Body: { uid, payment_id, collection_id }

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Initialize Firebase Admin with detailed error logging
let db;
let initError = null;
try {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) {
      initError = "FIREBASE_SERVICE_ACCOUNT env var is empty/missing";
    } else {
      const serviceAccount = JSON.parse(raw);
      initializeApp({ credential: cert(serviceAccount) });
    }
  }
  if (!initError) db = getFirestore();
} catch (e) {
  initError = "Firebase init failed: " + e.message;
  console.error("[verify-payment] INIT ERROR:", e);
}

var VALID_CREDITS = [10, 25, 40, 60];

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Return init error as JSON so frontend can show it
  if (initError) {
    console.error("[verify-payment] initError:", initError);
    return res.status(500).json({ error: initError });
  }

  try {
    const { uid, payment_id, collection_id } = req.body;
    const payId = payment_id || collection_id;

    if (!uid || !payId) return res.status(400).json({ error: "Missing uid or payment_id" });

    const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
    if (!ACCESS_TOKEN) return res.status(500).json({ error: "MP_ACCESS_TOKEN not configured" });

    // Check if already processed (idempotency)
    const existing = await db.collection("pagos").doc(String(payId)).get();
    if (existing.exists) {
      const data = existing.data();
      return res.status(200).json({
        success: true,
        already_processed: true,
        credits_added: data.creditosAgregados || 0,
      });
    }

    // Fetch payment from MercadoPago
    const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${payId}`, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    });
    const payment = await paymentRes.json();

    console.log(`[verify-payment] Payment ${payId}: status=${payment.status}, ref=${payment.external_reference}`);

    if (payment.status !== "approved") {
      return res.status(200).json({ success: false, status: payment.status });
    }

    // Parse external_reference
    const extRef = payment.external_reference || "";
    let refUid, creditsToAdd;

    if (extRef.includes("|")) {
      const parts = extRef.split("|");
      refUid = parts[0];
      creditsToAdd = parseInt(parts[1], 10);
      if (!VALID_CREDITS.includes(creditsToAdd)) {
        return res.status(200).json({ success: false, error: "invalid_credits" });
      }
    } else {
      refUid = extRef;
      creditsToAdd = 30;
    }

    // Security: verify uid matches
    if (refUid !== uid) {
      console.error(`[verify-payment] UID mismatch: req=${uid}, payment=${refUid}`);
      return res.status(403).json({ error: "UID mismatch" });
    }

    // Credit user
    const userRef = db.collection("usuarios").doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(200).json({ success: false, error: "user_not_found" });
    }

    await userRef.update({
      creditos: FieldValue.increment(creditsToAdd),
    });

    // Record payment
    await db.collection("pagos").doc(String(payId)).set({
      paymentId: payId,
      uid: uid,
      email: payment.payer?.email || "",
      amount: payment.transaction_amount,
      status: payment.status,
      creditosAgregados: creditsToAdd,
      processedAt: new Date().toISOString(),
      paymentDate: payment.date_approved || payment.date_created,
      paymentMethod: payment.payment_method_id || "",
      source: "verify-payment",
    });

    console.log(`[verify-payment] \u2705 Added ${creditsToAdd} credits to user ${uid}`);
    return res.status(200).json({ success: true, credits_added: creditsToAdd });
  } catch (err) {
    console.error("[verify-payment] Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
