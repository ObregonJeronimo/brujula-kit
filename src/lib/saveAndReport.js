// Shared utility: save eval to Firestore, then generate AI report and save it
import { db, doc, updateDoc } from "../firebase.js";
import { fbAdd } from "./fb.js";

/**
 * saveAndReport(collectionName, payload, evalType, evalDataForReport)
 * 1. Saves payload to Firestore via fbAdd
 * 2. Generates AI report via /api/generate-report
 * 3. Updates the saved doc with the aiReport
 * Returns { docId, report, error }
 */
export function saveAndReport(collectionName, payload, evalType, evalDataForReport, callbacks) {
  var cb = callbacks || {};
  var docId = null;

  // Step 1: Save to Firestore
  fbAdd(collectionName, payload).then(function(r) {
    if (r.success) {
      docId = r.id;
      if (cb.onSaved) cb.onSaved(r.id);
    } else {
      if (cb.onError) cb.onError("Error al guardar: " + (r.error || ""));
      return;
    }

    // Step 2: Generate AI report
    if (cb.onGenerating) cb.onGenerating();

    return fetch("/api/generate-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ evalData: evalDataForReport, evalType: evalType, reportMode: "clinico" })
    }).then(function(resp) { return resp.json(); });
  }).then(function(data) {
    if (!data) return; // save failed, already handled
    if (data.success && data.report) {
      if (cb.onReport) cb.onReport(data.report);

      // Step 3: Update Firestore doc with aiReport
      if (docId) {
        updateDoc(doc(db, collectionName, docId), {
          aiReport: data.report,
          aiReportDate: new Date().toISOString()
        }).catch(function(e) { console.error("Error saving aiReport:", e); });
      }
    } else {
      if (cb.onReportError) cb.onReportError(data.error || "Error al generar informe.");
    }
  }).catch(function(e) {
    console.error("saveAndReport error:", e);
    if (cb.onReportError) cb.onReportError("Error: " + e.message);
  });
}
