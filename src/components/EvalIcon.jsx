// =====================================================
// Iconos SVG profesionales para las evaluaciones y áreas
// Reemplazan a los emojis para un aspecto más clínico/pro.
// Uso: <EvalIcon name="ofa" size={22} color="#0891b2" />
// Los names coinciden con los id de EVAL_TYPES y EVAL_AREAS.
// =====================================================

var PATHS = {
  // Estetoscopio — Examen Clínico EOF (ofa)
  ofa: <g><path d="M5 3v5a4 4 0 0 0 8 0V3" /><path d="M5 3H4M13 3h1" /><path d="M9 16a5 5 0 0 0 5 5 4 4 0 0 0 4-4v-2" /><circle cx="18" cy="11" r="2" /></g>,
  // Onda de sonido / boca hablando — Evaluación Fonética (fon)
  fon: <g><path d="M3 10v4M7 7v10M11 4v16" /><path d="M15 8a5 5 0 0 1 0 8M18 5a9 9 0 0 1 0 14" /></g>,
  // Documento con líneas — Repetición de Palabras (rep)
  rep: <g><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h6" /></g>,
  // Oído — Discriminación Fonológica (disc)
  disc: <g><path d="M6 8.5a6 6 0 0 1 12 0c0 2.5-1.5 3.5-2.5 4.5S14 15 14 16.5a2.5 2.5 0 0 1-5 0" /><path d="M9 9a3 3 0 0 1 5 2" /></g>,
  // Diana / objetivo — Reconocimiento Fonológico Visual (reco)
  reco: <g><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" /></g>,
  // Niño / desarrollo — ELDI (eldi)
  eldi: <g><circle cx="12" cy="5" r="2.5" /><path d="M12 7.5v6M8 10h8M9 21l3-7 3 7" /></g>,
  // Portapapeles — Informe Complementario (complementario)
  complementario: <g><path d="M9 3h6a1 1 0 0 1 1 1v1h1a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1V4a1 1 0 0 1 1-1z" /><path d="M9 3.5h6" /><path d="M9 12h6M9 16h4" /></g>,
  // Área Fonético-Fonológico — altavoz con ondas
  fonetico_fonologico: <g><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16 9a4 4 0 0 1 0 6M18.5 7a7 7 0 0 1 0 10" /></g>,
  // Área Lenguaje y Desarrollo — niño
  lenguaje_desarrollo: <g><circle cx="12" cy="5" r="2.5" /><path d="M12 7.5v6M8 10h8M9 21l3-7 3 7" /></g>
};

export default function EvalIcon({ name, size, color, strokeWidth }) {
  var path = PATHS[name];
  if (!path) return null;
  var s = size || 22;
  return (
    <svg
      width={s} height={s} viewBox="0 0 24 24"
      fill="none" stroke={color || "currentColor"}
      strokeWidth={strokeWidth || 1.8}
      strokeLinecap="round" strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0 }}
      aria-hidden="true"
    >{path}</svg>
  );
}
