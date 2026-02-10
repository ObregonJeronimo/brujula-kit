/* peffImages.js — SVG images for PEFF OFA section options
   Simple anatomical diagrams for clinical reference.
   Format: key → SVG string, 200x140 viewBox */

export const PEFF_IMAGES = {
  /* 1.1 Labios - Postura */
  lab_ocluidos: `<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="140" rx="10" fill="#fdf4ff"/><ellipse cx="100" cy="70" rx="55" ry="35" fill="#fda4af" stroke="#e11d48" stroke-width="1.5"/><line x1="45" y1="70" x2="155" y2="70" stroke="#e11d48" stroke-width="2"/><text x="100" y="125" text-anchor="middle" font-size="11" fill="#6b21a8" font-weight="600">Ocluidos</text></svg>`,

  lab_entreabiertos: `<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="140" rx="10" fill="#fdf4ff"/><path d="M45 65 Q100 55 155 65" fill="#fda4af" stroke="#e11d48" stroke-width="1.5"/><path d="M45 75 Q100 85 155 75" fill="#fda4af" stroke="#e11d48" stroke-width="1.5"/><ellipse cx="100" cy="70" rx="40" ry="6" fill="#fff1f2"/><rect x="60" y="64" width="80" height="12" rx="3" fill="#fff1f2" stroke="#fda4af" stroke-width="0.5"/><text x="100" y="125" text-anchor="middle" font-size="11" fill="#6b21a8" font-weight="600">Entreabiertos</text></svg>`,

  lab_abiertos: `<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="140" rx="10" fill="#fdf4ff"/><path d="M45 55 Q100 45 155 55" fill="#fda4af" stroke="#e11d48" stroke-width="1.5"/><path d="M45 85 Q100 95 155 85" fill="#fda4af" stroke="#e11d48" stroke-width="1.5"/><ellipse cx="100" cy="70" rx="42" ry="16" fill="#1c1917" opacity="0.15"/><rect x="65" y="59" width="70" height="22" rx="8" fill="#292524" opacity="0.1"/><text x="100" y="125" text-anchor="middle" font-size="11" fill="#6b21a8" font-weight="600">Abiertos</text></svg>`,

  /* 1.1 Labios - Simetría */
  lab_simetricos: `<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="140" rx="10" fill="#f0fdf4"/><ellipse cx="100" cy="65" rx="55" ry="30" fill="#fda4af" stroke="#e11d48" stroke-width="1.5"/><line x1="100" y1="35" x2="100" y2="95" stroke="#059669" stroke-width="1" stroke-dasharray="4"/><text x="60" y="65" text-anchor="middle" font-size="9" fill="#059669">L</text><text x="140" y="65" text-anchor="middle" font-size="9" fill="#059669">R</text><text x="100" y="125" text-anchor="middle" font-size="11" fill="#059669" font-weight="600">✓ Simétricos</text></svg>`,

  lab_asimetrico_der: `<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="140" rx="10" fill="#fef2f2"/><path d="M45 65 Q100 50 155 60 Q155 80 100 85 Q45 80 45 65" fill="#fda4af" stroke="#e11d48" stroke-width="1.5"/><line x1="100" y1="35" x2="100" y2="95" stroke="#dc2626" stroke-width="1" stroke-dasharray="4"/><circle cx="145" cy="60" r="8" fill="none" stroke="#dc2626" stroke-width="2"/><text x="145" y="64" text-anchor="middle" font-size="8" fill="#dc2626">!</text><text x="100" y="125" text-anchor="middle" font-size="11" fill="#dc2626" font-weight="600">Asimétrico - Der.</text></svg>`,

  /* 1.2 ATM */
  atm_apertura_ok: `<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="140" rx="10" fill="#f0fdf4"/><rect x="70" y="20" rx="5" width="60" height="30" fill="#fda4af" stroke="#e11d48" stroke-width="1"/><rect x="65" y="55" rx="5" width="70" height="35" fill="#fda4af" stroke="#e11d48" stroke-width="1"/><line x1="135" y1="50" x2="155" y2="40" stroke="#059669" stroke-width="1.5"/><text x="160" y="42" font-size="9" fill="#059669">≥35mm</text><path d="M135 50 L155 65" stroke="#059669" stroke-width="1.5"/><text x="100" y="125" text-anchor="middle" font-size="11" fill="#059669" font-weight="600">Apertura adecuada</text></svg>`,

  /* 1.3 Lengua - Postura */
  len_piso: `<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="140" rx="10" fill="#f0fdf4"/><path d="M40 90 Q60 30 100 25 Q140 30 160 90" fill="none" stroke="#94a3b8" stroke-width="2"/><path d="M50 85 Q70 80 100 82 Q130 80 150 85" fill="#f87171" stroke="#dc2626" stroke-width="1.5"/><path d="M50 90 L150 90" stroke="#94a3b8" stroke-width="1" stroke-dasharray="3"/><text x="165" y="93" font-size="8" fill="#64748b">piso</text><text x="100" y="125" text-anchor="middle" font-size="11" fill="#059669" font-weight="600">En piso de boca</text></svg>`,

  len_interdental: `<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="140" rx="10" fill="#fef2f2"/><path d="M40 90 Q60 30 100 25 Q140 30 160 90" fill="none" stroke="#94a3b8" stroke-width="2"/><rect x="55" y="50" width="90" height="8" rx="2" fill="#fff" stroke="#94a3b8" stroke-width="1"/><rect x="55" y="62" width="90" height="8" rx="2" fill="#fff" stroke="#94a3b8" stroke-width="1"/><path d="M70 55 Q100 48 130 55 L130 65 Q100 72 70 65Z" fill="#f87171" stroke="#dc2626" stroke-width="1.5"/><text x="100" y="125" text-anchor="middle" font-size="11" fill="#dc2626" font-weight="600">Interdental</text></svg>`,

  len_paladar: `<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="140" rx="10" fill="#f0f9ff"/><path d="M40 90 Q60 30 100 25 Q140 30 160 90" fill="none" stroke="#94a3b8" stroke-width="2"/><path d="M70 45 Q100 35 130 45" fill="#f87171" stroke="#dc2626" stroke-width="2"/><circle cx="100" cy="38" r="3" fill="#dc2626"/><text x="100" y="125" text-anchor="middle" font-size="11" fill="#0369a1" font-weight="600">En paladar</text></svg>`,

  /* 1.3 Lengua - Frenillo */
  len_frenillo_normal: `<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="140" rx="10" fill="#f0fdf4"/><path d="M60 50 Q100 30 140 50" fill="#f87171" stroke="#dc2626" stroke-width="2"/><line x1="100" y1="50" x2="100" y2="90" stroke="#fda4af" stroke-width="2"/><path d="M60 90 L140 90" stroke="#94a3b8" stroke-width="1"/><text x="100" y="125" text-anchor="middle" font-size="11" fill="#059669" font-weight="600">Frenillo normal</text></svg>`,

  len_frenillo_corto: `<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="140" rx="10" fill="#fef2f2"/><path d="M60 60 Q100 50 140 60" fill="#f87171" stroke="#dc2626" stroke-width="2"/><line x1="100" y1="55" x2="100" y2="75" stroke="#fda4af" stroke-width="3"/><path d="M85 75 L115 75 L100 90 Z" fill="#fda4af" stroke="#dc2626" stroke-width="1"/><path d="M60 90 L140 90" stroke="#94a3b8" stroke-width="1"/><text x="100" y="125" text-anchor="middle" font-size="11" fill="#dc2626" font-weight="600">Frenillo corto</text></svg>`,

  /* 1.4 Dientes - Mordida */
  mordida_normal: `<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="140" rx="10" fill="#f0fdf4"/><rect x="50" y="30" width="100" height="20" rx="4" fill="#fff" stroke="#94a3b8" stroke-width="1.5"/><rect x="50" y="55" width="100" height="20" rx="4" fill="#fff" stroke="#94a3b8" stroke-width="1.5"/><g stroke="#e2e8f0" stroke-width="0.5"><line x1="70" y1="30" x2="70" y2="50"/><line x1="90" y1="30" x2="90" y2="50"/><line x1="110" y1="30" x2="110" y2="50"/><line x1="130" y1="30" x2="130" y2="50"/><line x1="70" y1="55" x2="70" y2="75"/><line x1="90" y1="55" x2="90" y2="75"/><line x1="110" y1="55" x2="110" y2="75"/><line x1="130" y1="55" x2="130" y2="75"/></g><text x="100" y="125" text-anchor="middle" font-size="11" fill="#059669" font-weight="600">Mordida normal</text></svg>`,

  mordida_abierta: `<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="140" rx="10" fill="#fef2f2"/><rect x="50" y="25" width="100" height="20" rx="4" fill="#fff" stroke="#94a3b8" stroke-width="1.5"/><rect x="50" y="65" width="100" height="20" rx="4" fill="#fff" stroke="#94a3b8" stroke-width="1.5"/><path d="M75 45 L75 55 M125 45 L125 55" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="3"/><rect x="80" y="47" width="40" height="16" rx="3" fill="none" stroke="#dc2626" stroke-width="2"/><text x="100" y="57" text-anchor="middle" font-size="7" fill="#dc2626">gap</text><text x="100" y="125" text-anchor="middle" font-size="11" fill="#dc2626" font-weight="600">Mordida abierta</text></svg>`,

  mordida_cruzada: `<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="140" rx="10" fill="#fef2f2"/><rect x="55" y="30" width="90" height="20" rx="4" fill="#fff" stroke="#94a3b8" stroke-width="1.5"/><rect x="45" y="55" width="110" height="20" rx="4" fill="#fff" stroke="#94a3b8" stroke-width="1.5"/><path d="M45 55 L55 50" stroke="#dc2626" stroke-width="2"/><path d="M155 55 L145 50" stroke="#dc2626" stroke-width="2"/><text x="100" y="125" text-anchor="middle" font-size="11" fill="#dc2626" font-weight="600">Mordida cruzada</text></svg>`,

  /* 1.5 Paladar */
  paladar_adecuado: `<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="140" rx="10" fill="#f0fdf4"/><path d="M40 90 Q100 40 160 90" fill="#fce7f3" stroke="#e11d48" stroke-width="2"/><path d="M40 90 L160 90" stroke="#94a3b8" stroke-width="1"/><text x="100" y="125" text-anchor="middle" font-size="11" fill="#059669" font-weight="600">Altura adecuada</text></svg>`,

  paladar_ojival: `<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="140" rx="10" fill="#fef2f2"/><path d="M50 90 Q100 15 150 90" fill="#fce7f3" stroke="#e11d48" stroke-width="2"/><path d="M50 90 L150 90" stroke="#94a3b8" stroke-width="1"/><text x="100" y="55" text-anchor="middle" font-size="8" fill="#dc2626">↑ profundo</text><text x="100" y="125" text-anchor="middle" font-size="11" fill="#dc2626" font-weight="600">Ojival (profundo)</text></svg>`,

  /* 1.6 Velo */
  velo_competente: `<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="140" rx="10" fill="#f0fdf4"/><path d="M40 30 L40 90 Q100 70 160 90 L160 30" fill="none" stroke="#94a3b8" stroke-width="2"/><path d="M80 50 Q100 65 120 50" fill="#fce7f3" stroke="#e11d48" stroke-width="2"/><circle cx="100" cy="60" r="4" fill="#e11d48"/><path d="M80 55 Q100 75 120 55" stroke="#059669" stroke-width="2" fill="none"/><text x="100" y="125" text-anchor="middle" font-size="11" fill="#059669" font-weight="600">Competencia velar</text></svg>`,

  velo_incompetente: `<svg viewBox="0 0 200 140" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="140" rx="10" fill="#fef2f2"/><path d="M40 30 L40 90 Q100 70 160 90 L160 30" fill="none" stroke="#94a3b8" stroke-width="2"/><path d="M80 50 Q100 55 120 50" fill="#fce7f3" stroke="#e11d48" stroke-width="2"/><circle cx="100" cy="52" r="4" fill="#e11d48"/><rect x="85" y="60" width="30" height="15" rx="3" fill="none" stroke="#dc2626" stroke-width="2" stroke-dasharray="3"/><text x="100" y="100" text-anchor="middle" font-size="8" fill="#dc2626">escape nasal ↑</text><text x="100" y="125" text-anchor="middle" font-size="11" fill="#dc2626" font-weight="600">Incompetencia</text></svg>`
};

/* Map OFA option text to image key */
export const OFA_OPTION_IMAGES = {
  /* 1.1 Labios - Postura */
  "Ocluidos": "lab_ocluidos",
  "Entreabiertos": "lab_entreabiertos",
  "Abiertos": "lab_abiertos",
  /* 1.1 Labios - Simetría */
  "Simétricos": "lab_simetricos",
  "Asimétricos - Derecha": "lab_asimetrico_der",
  /* 1.2 ATM */
  "Adecuada (≥35mm)": "atm_apertura_ok",
  /* 1.3 Lengua - Postura */
  "En piso de boca": "len_piso",
  "Interdental": "len_interdental",
  "En paladar": "len_paladar",
  /* 1.3 Lengua - Frenillo */
  "Normal": "len_frenillo_normal",
  "Corto": "len_frenillo_corto",
  /* 1.4 Dientes - Mordida */
  "Normal": "mordida_normal",
  "Mordida abierta anterior": "mordida_abierta",
  "Mordida cruzada": "mordida_cruzada",
  /* 1.5 Paladar */
  "Adecuada": "paladar_adecuado",
  "Ojival": "paladar_ojival",
  /* 1.6 Velo */
  "Competencia (sin escape)": "velo_competente",
  "Incompetencia leve": "velo_incompetente",
  "Incompetencia evidente": "velo_incompetente"
};
