import { useEffect } from "react";
import { db, doc, getDoc, setDoc } from "../firebase.js";

export async function acquireSessionLock(uid, isAdmin) {
  if (isAdmin) return true;
  const lockRef = doc(db, "system", "active_session");
  try {
    const snap = await getDoc(lockRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.uid && data.uid !== uid) {
        const lockTime = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
        const diff = Date.now() - lockTime.getTime();
        if (diff < 2 * 60 * 60 * 1000) return false;
      }
    }
    await setDoc(lockRef, { uid, timestamp: new Date().toISOString() });
    return true;
  } catch (e) { console.error("Session lock error:", e); return true; }
}

export async function releaseSessionLock(uid) {
  const lockRef = doc(db, "system", "active_session");
  try {
    const snap = await getDoc(lockRef);
    if (snap.exists() && snap.data().uid === uid) {
      await setDoc(lockRef, { uid: null, timestamp: null });
    }
  } catch (e) { console.error("Session release error:", e); }
}

export function useSessionHeartbeat(uid, isAdmin) {
  useEffect(() => {
    if (!uid || isAdmin) return;
    const interval = setInterval(async () => {
      const lockRef = doc(db, "system", "active_session");
      try { await setDoc(lockRef, { uid, timestamp: new Date().toISOString() }); } catch(e){}
    }, 60000);
    return () => clearInterval(interval);
  }, [uid, isAdmin]);
}
