import { useState, useEffect } from "react";
import { auth, onAuthStateChanged } from "./firebase.js";
import App from "./evalkit.jsx";
import LandingPage from "./components/LandingPage.jsx";

// Cached theme color for loading screen (same logic as evalkit)
var mixColor = function(hex, alpha){ if(!hex || alpha >= 100) return hex; var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16); var a = Math.max(30, Math.min(100, alpha)) / 100; var mr = Math.round(r * a + 255 * (1-a)), mg = Math.round(g * a + 255 * (1-a)), mb = Math.round(b * a + 255 * (1-a)); return "#" + ((1<<24)+(mr<<16)+(mg<<8)+mb).toString(16).slice(1); };
var _cachedBg = (function(){ try { var t = JSON.parse(localStorage.getItem("bk_theme")||"null"); if(t && t.primary) return mixColor(t.primary, t.primaryAlpha != null ? t.primaryAlpha : 100); } catch(e){} return "#0a3d2f"; })();

// Determine whether the current path is the landing page route
function isLandingPath() {
  return window.location.pathname === "/" || window.location.pathname === "";
}

export default function Root() {
  var _path = useState(window.location.pathname), path = _path[0], setPath = _path[1];
  var _authChecked = useState(false), authChecked = _authChecked[0], setAuthChecked = _authChecked[1];
  var _hasSession = useState(false), hasSession = _hasSession[0], setHasSession = _hasSession[1];

  // Listen to browser navigation (back/forward, pushState dispatches)
  useEffect(function() {
    var onPop = function() { setPath(window.location.pathname); };
    window.addEventListener("popstate", onPop);
    return function() { window.removeEventListener("popstate", onPop); };
  }, []);

  // Check auth state once to decide redirects
  useEffect(function() {
    var unsub = onAuthStateChanged(auth, function(u) {
      setHasSession(!!u);
      setAuthChecked(true);
    });
    return unsub;
  }, []);

  // While checking auth on the landing route, show a minimal loader to avoid flicker
  if (isLandingPath() && !authChecked) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: _cachedBg }}>
      <img src="/img/logo_96.png" alt="Brújula KIT" style={{ width: 56, height: 56, opacity: 0.9 }} />
    </div>;
  }

  // Landing route:
  // - If a session exists, send the user straight to the app (no need to see the landing)
  // - Otherwise show the public landing page
  if (isLandingPath()) {
    if (hasSession) {
      window.history.replaceState({}, "", "/app");
      return <App />;
    }
    return <LandingPage />;
  }

  // Any other route (/app, etc.) → the application (login or workspace)
  return <App />;
}
