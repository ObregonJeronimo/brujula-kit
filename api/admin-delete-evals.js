// POST /api/admin-delete-evals
// Body: { key: "ADMIN_2026", action: "all" | "user", uid?: "..." }
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
  initializeApp({ credential: cert(sa) });
}
const db = getFirestore();

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (req.body?.key !== "ADMIN_2026") return res.status(403).json({ error: "Invalid key" });

  var action = req.body.action;
  var uid = req.body.uid;

  try {
    if (action === "all") {
      // Delete ALL evaluaciones
      var snap = await db.collection("evaluaciones").get();
      var count = 0;
      var batch = db.batch();
      snap.docs.forEach(function(d) { batch.delete(d.ref); count++; });
      if (count > 0) await batch.commit();
      return res.status(200).json({ success: true, deleted: count });

    } else if (action === "user" && uid) {
      // Delete evaluaciones for specific user
      var snap2 = await db.collection("evaluaciones").where("userId", "==", uid).get();
      var count2 = 0;
      var batch2 = db.batch();
      snap2.docs.forEach(function(d) { batch2.delete(d.ref); count2++; });
      if (count2 > 0) await batch2.commit();
      return res.status(200).json({ success: true, deleted: count2, uid: uid });

    } else if (action === "delete-user" && uid) {
      // Delete user + their evals + their pacientes
      var evSnap = await db.collection("evaluaciones").where("userId", "==", uid).get();
      var pacSnap = await db.collection("pacientes").where("userId", "==", uid).get();
      var b = db.batch();
      evSnap.docs.forEach(function(d) { b.delete(d.ref); });
      pacSnap.docs.forEach(function(d) { b.delete(d.ref); });
      b.delete(db.collection("usuarios").doc(uid));
      await b.commit();
      return res.status(200).json({ success: true, deletedEvals: evSnap.size, deletedPacientes: pacSnap.size, deletedUser: true });

    } else if (action === "delete-old-collections") {
      // Delete old separate collections
      var collections = ["peff_evaluaciones", "rep_evaluaciones", "disc_evaluaciones", "reco_evaluaciones"];
      var results = {};
      for (var colName of collections) {
        var s = await db.collection(colName).get();
        var b3 = db.batch();
        s.docs.forEach(function(d) { b3.delete(d.ref); });
        if (s.size > 0) await b3.commit();
        results[colName] = s.size;
      }
      return res.status(200).json({ success: true, deleted: results });

    } else {
      return res.status(400).json({ error: "Invalid action. Use: all, user, delete-user, delete-old-collections" });
    }
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
