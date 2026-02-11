import { db, collection, addDoc, getDocs, deleteDoc, doc, query, where, getDoc } from "../firebase.js";

export async function fbGetFiltered(c, userId) {
  const q2 = query(collection(db, c), where("userId", "==", userId));
  const s = await getDocs(q2);
  return s.docs.map(d => ({ _fbId: d.id, ...d.data() }));
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
  const existing = await fbGetAll("usuarios");
  const usernames = existing.map(u => u.username || "");
  let candidate = base;
  let n = 1;
  while (usernames.includes(candidate)) { candidate = base + n; n++; }
  return candidate;
}

export const ADMIN_EMAIL = "valkyriumsolutions@gmail.com";
export const K = { sd: "#0a3d2f", ac: "#0d9488", al: "#ccfbf1", mt: "#64748b", bd: "#e2e8f0", bg: "#f0f5f3" };
