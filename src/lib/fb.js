import { db, collection, addDoc, getDocs, deleteDoc, doc, query, where, getDoc, orderBy, limit } from "../firebase.js";

export async function fbGetFiltered(c, userId, maxResults) {
  try {
    var q2 = maxResults
      ? query(collection(db, c), where("userId", "==", userId), orderBy("fechaGuardado", "desc"), limit(maxResults))
      : query(collection(db, c), where("userId", "==", userId), orderBy("fechaGuardado", "desc"));
    const s = await getDocs(q2);
    return s.docs.map(d => ({ _fbId: d.id, ...d.data() }));
  } catch(e) {
    // Fallback: query without orderBy (in case composite index is missing)
    console.warn("fbGetFiltered: falling back to simple query:", e.message);
    var q3 = query(collection(db, c), where("userId", "==", userId));
    const s2 = await getDocs(q3);
    var results = s2.docs.map(d => ({ _fbId: d.id, ...d.data() }));
    results.sort(function(a,b){ return (b.fechaGuardado||"").localeCompare(a.fechaGuardado||""); });
    return results;
  }
}

export async function fbGetAll(c) {
  const s = await getDocs(collection(db, c));
  return s.docs.map(d => ({ _fbId: d.id, ...d.data() }));
}

export async function fbAdd(c, data) {
  try { const r = await addDoc(collection(db, c), data); return { success: true, id: r.id }; }
  catch (e) { return { success: false, error: e.message }; }
}

export async function fbDelete(c, id) {
  try { await deleteDoc(doc(db, c, id)); return { success: true }; }
  catch (e) { return { success: false, error: e.message }; }
}

export async function getUserProfile(uid) {
  const d = await getDoc(doc(db, "usuarios", uid));
  return d.exists() ? { _fbId: d.id, ...d.data() } : null;
}

export async function generateUsername(nombre, apellido) {
  const base = (nombre.charAt(0) + apellido).toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 12);
  // Instead of downloading ALL users, query for matching usernames only
  const q2 = query(collection(db, "usuarios"), where("username", ">=", base), where("username", "<=", base + "\uf8ff"));
  const snap = await getDocs(q2);
  const usernames = snap.docs.map(d => d.data().username || "");
  let candidate = base;
  let n = 1;
  while (usernames.includes(candidate)) { candidate = base + n; n++; }
  return candidate;
}

export const ADMIN_EMAIL = "valkyriumsolutions@gmail.com";
export const K = { sd: "#0a3d2f", ac: "#0d9488", al: "#ccfbf1", mt: "#64748b", bd: "#e2e8f0", bg: "#f0f5f3" };

// =====================================================
// SHARED HELPERS — import from here, don't redefine
// =====================================================

// Format age in months to "X años, Y meses"
export function ageLabel(m) {
  return Math.floor(m / 12) + " años, " + (m % 12) + " meses";
}

// Format ISO date string to locale date
export function fmtDate(d) {
  return new Date(d).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
}

// Format ISO date string to short date
export function fmtDateShort(d) {
  return new Date(d).toLocaleDateString("es-CL");
}
