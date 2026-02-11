// Vercel Serverless Function — MercadoPago webhook
// POST /api/webhook-mp
// Receives payment notifications, adds 30 credits to user in Firestore

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Initialize Firebase Admin (singleton)
if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
  initializeApp({
    credential: cert(serviceAccount),
  });
}
const db = getFirestore();

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  // MP sends GET for validation sometimes
  if (req.method === "GET") return res.status(200).send("OK");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { type, data } = req.body;

    // Only process payment notifications
    if (type !== "payment" || !data?.id) {
      return res.status(200).json({ received: true, ignored: true });
    }

    const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
    if (!ACCESS_TOKEN) return res.status(500).json({ error: "MP_ACCESS_TOKEN not configured" });

    // Fetch payment details from MercadoPago
    const paymentRes = await fetch(`https://api.mercadopago.com/v1/payments/${data.id}`, {
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    });
    const payment = await paymentRes.json();

    console.log(`[webhook-mp] Payment ${data.id}: status=${payment.status}, ref=${payment.external_reference}`);

    // Only credit on approved payments
    if (payment.status !== "approved") {
      return res.status(200).json({ received: true, status: payment.status });
    }

    const uid = payment.external_reference;
    if (!uid) {
      console.error("[webhook-mp] No external_reference (uid) in payment");
      return res.status(200).json({ received: true, error: "no_uid" });
    }

    // Check if we already processed this payment (idempotency)
    const paymentDoc = await db.collection("pagos").doc(String(data.id)).get();
    if (paymentDoc.exists) {
      console.log(`[webhook-mp] Payment ${data.id} already processed, skipping`);
      return res.status(200).json({ received: true, already_processed: true });
    }

    // Add 30 credits to user
    const userRef = db.collection("usuarios").doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      console.error(`[webhook-mp] User ${uid} not found in Firestore`);
      return res.status(200).json({ received: true, error: "user_not_found" });
    }

    await userRef.update({
      creditos: FieldValue.increment(30),
      plan: "Plan Premium",
    });

    // Record the payment for idempotency and audit
    await db.collection("pagos").doc(String(data.id)).set({
      paymentId: data.id,
      uid: uid,
      email: payment.payer?.email || "",
      amount: payment.transaction_amount,
      status: payment.status,
      creditosAgregados: 30,
      processedAt: new Date().toISOString(),
      paymentDate: payment.date_approved || payment.date_created,
      paymentMethod: payment.payment_method_id || "",
    });

    console.log(`[webhook-mp] ✅ Added 30 credits to user ${uid}`);
    return res.status(200).json({ received: true, credits_added: 30 });
  } catch (err) {
    console.error("[webhook-mp] Error:", err);
    // Always return 200 so MP doesn't retry indefinitely
    return res.status(200).json({ received: true, error: err.message });
  }
}
