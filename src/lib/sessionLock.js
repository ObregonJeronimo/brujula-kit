import { useEffect } from "react";
import { db, doc, getDoc, setDoc } from "../firebase.js";

// Session lock is now PER-USER: each user gets their own lock document
// at sessions/{uid} instead of a single global system/active_session.
// This allows unlimited concurrent users.

export async function acquireSessionLock(uid, isAdmin) {
  if (isAdmin) return true;
  var lockRef = doc(db, "sessions", uid);
  try {
    var snap = await getDoc(lockRef);
    if (snap.exists()) {
      var data = snap.data();
      var lockTime = data.timestamp ? new Date(data.timestamp).getTime() : 0;
      var diff = Date.now() - lockTime;
      // If lock is stale (>5 min without heartbeat), allow takeover
      if (diff < 5 * 60 * 1000 && data.active) {
        return false; // Another active session exists
      }
    }
    await setDoc(lockRef, { uid: uid, timestamp: new Date().toISOString(), active: true });
    return true;
  } catch (e) { console.error("Session lock error:", e); return true; }
}

export async function releaseSessionLock(uid) {
  var lockRef = doc(db, "sessions", uid);
  try {
    await setDoc(lockRef, { uid: uid, timestamp: new Date().toISOString(), active: false });
  } catch (e) { console.error("Session release error:", e); }
}

export function useSessionHeartbeat(uid, isAdmin) {
  useEffect(function() {
    if (!uid || isAdmin) return;
    var lockRef = doc(db, "sessions", uid);
    // Heartbeat every 3 minutes instead of 1 (reduces Firestore writes by 66%)
    var interval = setInterval(function() {
      setDoc(lockRef, { uid: uid, timestamp: new Date().toISOString(), active: true }).catch(function(){});
    }, 180000);
    return function() { clearInterval(interval); };
  }, [uid, isAdmin]);
}
