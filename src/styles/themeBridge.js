// ============================================
// Brújula KIT — Theme Bridge
// ============================================
// Sincroniza los colores dinámicos del admin
// (Firestore config/theme) con las CSS variables.
// Se llama desde evalkit.jsx cuando cambia el tema.
// ============================================

export function applyThemeToCSS(primary, accent) {
  var root = document.documentElement;
  if (primary) {
    root.style.setProperty("--c-primary", primary);
  }
  if (accent) {
    root.style.setProperty("--c-accent", accent);
    // Generar versión light del accent automáticamente
    // Parsear hex a rgb y hacer opacity 0.1
    var r = parseInt(accent.slice(1,3), 16);
    var g = parseInt(accent.slice(3,5), 16);
    var b = parseInt(accent.slice(5,7), 16);
    root.style.setProperty("--c-accent-light", "rgba("+r+","+g+","+b+",0.08)");
  }
}

// Cargar tema cacheado de localStorage al inicio (antes de React)
export function loadCachedTheme() {
  try {
    var cached = localStorage.getItem("bk_theme_cache");
    if (cached) {
      var t = JSON.parse(cached);
      if (t.primary) applyThemeToCSS(t.primary, t.accent);
    }
  } catch(e) {}
}
