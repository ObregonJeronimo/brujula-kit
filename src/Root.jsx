import { useState, useEffect } from "react";
import App from "./evalkit.jsx";
import LandingPage from "./components/LandingPage.jsx";

// Determine whether the current path is the landing page route
function isLandingPath() {
  return window.location.pathname === "/" || window.location.pathname === "";
}

export default function Root() {
  var _path = useState(window.location.pathname), path = _path[0], setPath = _path[1];

  // Listen to browser navigation (back/forward, and our own pushState dispatches)
  useEffect(function() {
    var onPop = function() { setPath(window.location.pathname); };
    window.addEventListener("popstate", onPop);
    return function() { window.removeEventListener("popstate", onPop); };
  }, []);

  // Landing route: always show the public landing page (Option 1).
  // A logged-in user clicking "Ir al sistema" goes to /app and lands directly
  // in their workspace, since their session is still active.
  if (isLandingPath()) {
    return <LandingPage />;
  }

  // Any other route (/app, etc.) → the application (login or workspace)
  return <App />;
}
