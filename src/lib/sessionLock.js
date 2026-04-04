import { useEffect } from "react";
import { db, doc, getDoc, setDoc } from "../firebase.js";

// Session lock is now PER-USER: each user gets their own lock document
// at sessions/{uid} instead of a single global system/active_session.
// This allows unlimited concurrent users.

// Session lock — per-user with browser session ID to avoid self-blocking on reload
var _sessionId = (function(){ var id = sessionStorage.getItem("bk_sid"); if(!id){ id = Date.now()+"_"+Math.random().toString(36).slice(2); sessionStorage.setItem("bk_sid", id); } return id; })();

export async function acquireSessionLock(uid, isAdmin) {
  if (isAdmin) return true;
  var lockRef = doc(db, "sessions", uid);
  try {
    var snap = await getDoc(lockRef);
    if (snap.exists()) {
      var data = snap.data();
      var lockTime = data.timestamp ? new Date(data.timestamp).getTime() : 0;
      var diff = Date.now() - lockTime;
      // Allow if: same session (reload), or lock is stale (>2 min)
      if (data.sessionId === _sessionId) { /* same browser tab/reload — allow */ }
      else if (diff < 2 * 60 * 1000 && data.active) {
        return false; // Another active session exists
      }
    }
    await setDoc(lockRef, { uid: uid, timestamp: new Date().toISOString(), active: true, sessionId: _sessionId });
    return true;
  } catch (e) { console.error("Session lock error:", e); return true; }
}

export async function releaseSessionLock(uid) {
  var lockRef = doc(db, "sessions", uid);
  try {
    await setDoc(lockRef, { uid: uid, timestamp: new Date().toISOString(), active: false, sessionId: _sessionId });
  } catch (e) { console.error("Session release error:", e); }
}

export function useSessionHeartbeat(uid, isAdmin) {
  useEffect(function() {
    if (!uid || isAdmin) return;
    var lockRef = doc(db, "sessions", uid);
    var interval = setInterval(function() {
      setDoc(lockRef, { uid: uid, timestamp: new Date().toISOString(), active: true, sessionId: _sessionId }).catch(function(){});
    }, 90000);
    return function() { clearInterval(interval); };
  }, [uid, isAdmin]);
}
