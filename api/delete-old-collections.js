// Cleanup script: deletes documents from old separate collections after migration
// Run once via POST /api/delete-old-collections with body { key: "DELETE_OLD_2026" }
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
if (!getApps().length) initializeApp({ credential: cert(sa) });
const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (req.body?.key !== "DELETE_OLD_2026") return res.status(403).json({ error: "Invalid key" });

  const collections = ["peff_evaluaciones", "rep_evaluaciones", "disc_evaluaciones", "reco_evaluaciones"];
  const results = {};

  try {
    for (const colName of collections) {
      const snap = await db.collection(colName).get();
      let deleted = 0;
      for (const docSnap of snap.docs) {
        await db.collection(colName).doc(docSnap.id).delete();
        deleted++;
      }
      results[colName] = deleted;
    }
    return res.status(200).json({ success: true, deleted: results });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
