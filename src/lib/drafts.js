// Draft evaluations — save/load/delete evaluation progress
import { db, collection, addDoc, getDocs, deleteDoc, doc, setDoc, query, where, orderBy } from "../firebase.js";

var DRAFTS_COL = "eval_drafts";

// Save draft (creates or updates)
export async function saveDraft(userId, evalType, draftData) {
  try {
    var payload = {
      userId: userId,
      evalType: evalType,
      data: JSON.stringify(draftData),
      updatedAt: new Date().toISOString()
    };
    // Check if draft already exists for this user+evalType+patient
    var key = userId + "_" + evalType + "_" + (draftData.patientId || "unknown");
    await setDoc(doc(db, DRAFTS_COL, key), payload);
    return { success: true, id: key };
  } catch(e) {
    console.error("saveDraft error:", e);
    return { success: false, error: e.message };
  }
}

// Load all drafts for a user
export async function loadDrafts(userId) {
  try {
    var q = query(collection(db, DRAFTS_COL), where("userId", "==", userId));
    var snap = await getDocs(q);
    return snap.docs.map(function(d) {
      var data = d.data();
      try { data.data = JSON.parse(data.data); } catch(e) {}
      return Object.assign({ _fbId: d.id }, data);
    });
  } catch(e) {
    console.error("loadDrafts error:", e);
    return [];
  }
}

// Delete a draft
export async function deleteDraft(draftId) {
  try {
    await deleteDoc(doc(db, DRAFTS_COL, draftId));
    return true;
  } catch(e) {
    console.error("deleteDraft error:", e);
    return false;
  }
}
