// Migration script: copies all evals from separate collections into unified 'evaluaciones'
// Run once via POST /api/migrate-evals with body { key: "MIGRATE_2026" }
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
if (!getApps().length) initializeApp({ credential: cert(sa) });
const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  if (req.body?.key !== "MIGRATE_2026") return res.status(403).json({ error: "Invalid key" });

  const results = { peff: 0, rep: 0, disc: 0, reco: 0, skipped: 0, errors: [] };

  const collections = [
    { name: "peff_evaluaciones", tipo: "peff" },
    { name: "rep_evaluaciones", tipo: "rep" },
    { name: "disc_evaluaciones", tipo: "disc" },
    { name: "reco_evaluaciones", tipo: "reco" }
  ];

  try {
    for (const col of collections) {
      const snap = await db.collection(col.name).get();
      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        // Check if already migrated (by looking for same id+tipo in evaluaciones)
        const existing = await db.collection("evaluaciones")
          .where("_migratedFrom", "==", col.name + ":" + docSnap.id)
          .limit(1).get();
        
        if (!existing.empty) {
          results.skipped++;
          continue;
        }

        // Add tipo field and migration marker
        const newDoc = Object.assign({}, data, {
          tipo: col.tipo,
          _migratedFrom: col.name + ":" + docSnap.id,
          _migratedAt: new Date().toISOString()
        });

        // Remove old 'tipo' field if it had a different format
        // (some old docs have tipo like 'rep_palabras', we normalize to 'rep')
        newDoc.tipo = col.tipo;

        try {
          await db.collection("evaluaciones").add(newDoc);
          results[col.tipo]++;
        } catch (e) {
          results.errors.push(col.name + ":" + docSnap.id + " -> " + e.message);
        }
      }
    }

    // Also clean up any ELDI docs that are already in 'evaluaciones' - add tipo field if missing
    const eldiSnap = await db.collection("evaluaciones").get();
    let eldiFixed = 0;
    for (const docSnap of eldiSnap.docs) {
      const data = docSnap.data();
      if (!data.tipo && !data._migratedFrom) {
        // This is an old ELDI doc, add tipo
        await db.collection("evaluaciones").doc(docSnap.id).update({ tipo: "eldi" });
        eldiFixed++;
      }
    }
    results.eldiFixed = eldiFixed;

    return res.status(200).json({ success: true, results });
  } catch (e) {
    return res.status(500).json({ error: e.message, results });
  }
}
