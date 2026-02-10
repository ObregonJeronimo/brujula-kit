/* Improved SVG illustrations for ELDI items - professional clinical quality */
const S={w:300,h:220};
const svg=(children,bg="#f8faf9")=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S.w} ${S.h}" style="max-width:100%;border-radius:12px;background:${bg}">${children}</svg>`;

export const ELDI_IMAGES={

  /* AC10: Pelota - clear red ball with visible shine and shadow */
  ball: svg(`
    <defs><radialGradient id="bg" cx="40%" cy="35%"><stop offset="0%" stop-color="#ff6b6b"/><stop offset="100%" stop-color="#c0392b"/></radialGradient></defs>
    <circle cx="150" cy="100" r="55" fill="url(#bg)" stroke="#a93226" stroke-width="2"/>
    <ellipse cx="135" cy="80" rx="18" ry="8" fill="rgba(255,255,255,.35)" transform="rotate(-25 135 80)"/>
    <ellipse cx="150" cy="160" rx="40" ry="6" fill="rgba(0,0,0,.08)"/>
    <text x="150" y="195" text-anchor="middle" font-size="16" font-weight="700" fill="#2c3e50" font-family="sans-serif">Pelota</text>
  `),

  /* AC12: Body parts - clear arrows pointing to labeled features */
  body: svg(`
    <circle cx="150" cy="50" r="30" fill="#fcd34d" stroke="#f59e0b" stroke-width="2"/>
    <circle cx="140" cy="44" r="4" fill="#1e293b"/><circle cx="160" cy="44" r="4" fill="#1e293b"/>
    <ellipse cx="150" cy="57" rx="6" ry="3" fill="#e74c3c"/>
    <line x1="150" y1="80" x2="150" y2="140" stroke="#f59e0b" stroke-width="5" stroke-linecap="round"/>
    <line x1="150" y1="95" x2="120" y2="120" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>
    <line x1="150" y1="95" x2="180" y2="120" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>
    <line x1="150" y1="140" x2="130" y2="175" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>
    <line x1="150" y1="140" x2="170" y2="175" stroke="#f59e0b" stroke-width="4" stroke-linecap="round"/>
    <line x1="107" y1="44" x2="130" y2="44" stroke="#e74c3c" stroke-width="2" marker-end="url(#ar)"/>
    <defs><marker id="ar" viewBox="0 0 6 6" refX="6" refY="3" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#e74c3c"/></marker></defs>
    <text x="98" y="48" text-anchor="end" font-size="13" font-weight="700" fill="#e74c3c" font-family="sans-serif">Ojos</text>
    <line x1="107" y1="57" x2="138" y2="57" stroke="#e74c3c" stroke-width="2" marker-end="url(#ar)"/>
    <text x="98" y="61" text-anchor="end" font-size="13" font-weight="700" fill="#e74c3c" font-family="sans-serif">Boca</text>
    <line x1="107" y1="35" x2="135" y2="30" stroke="#e74c3c" stroke-width="2" marker-end="url(#ar)"/>
    <text x="98" y="38" text-anchor="end" font-size="13" font-weight="700" fill="#e74c3c" font-family="sans-serif">Nariz</text>
    <text x="150" y="200" text-anchor="middle" font-size="12" fill="#64748b" font-family="sans-serif">Se\u00f1ala las partes del cuerpo</text>
  `),

  /* AC13: 3 objects - pelota, cuaderno, bicicleta - clearly drawn */
  "3objects": svg(`
    <circle cx="55" cy="80" r="28" fill="#e74c3c" stroke="#c0392b" stroke-width="2"/>
    <ellipse cx="50" cy="68" rx="8" ry="4" fill="rgba(255,255,255,.3)" transform="rotate(-20 50 68)"/>
    <text x="55" y="130" text-anchor="middle" font-size="13" font-weight="600" fill="#2c3e50" font-family="sans-serif">Pelota</text>
    <rect x="120" y="55" width="50" height="65" rx="4" fill="#3498db" stroke="#2980b9" stroke-width="2"/>
    <line x1="128" y1="68" x2="162" y2="68" stroke="rgba(255,255,255,.5)" stroke-width="2"/>
    <line x1="128" y1="78" x2="162" y2="78" stroke="rgba(255,255,255,.5)" stroke-width="2"/>
    <line x1="128" y1="88" x2="150" y2="88" stroke="rgba(255,255,255,.5)" stroke-width="2"/>
    <rect x="123" y="100" width="14" height="16" rx="2" fill="#e74c3c"/>
    <text x="145" y="140" text-anchor="middle" font-size="13" font-weight="600" fill="#2c3e50" font-family="sans-serif">Cuaderno</text>
    <circle cx="230" cy="90" r="20" fill="none" stroke="#2c3e50" stroke-width="3"/>
    <circle cx="230" cy="90" r="3" fill="#2c3e50"/>
    <circle cx="260" cy="90" r="20" fill="none" stroke="#2c3e50" stroke-width="3"/>
    <circle cx="260" cy="90" r="3" fill="#2c3e50"/>
    <path d="M230 90 L245 60 L260 90" fill="none" stroke="#2c3e50" stroke-width="3" stroke-linejoin="round"/>
    <line x1="237" y1="75" x2="253" y2="75" stroke="#2c3e50" stroke-width="2"/>
    <line x1="245" y1="60" x2="245" y2="50" stroke="#2c3e50" stroke-width="2"/>
    <circle cx="245" cy="48" r="4" fill="#e74c3c"/>
    <text x="245" y="130" text-anchor="middle" font-size="13" font-weight="600" fill="#2c3e50" font-family="sans-serif">Bicicleta</text>
  `),

  /* AC15: Common images - perro, gato, auto, bebe - simple clear shapes */
  animals: svg(`
    <rect x="10" y="15" width="130" height="85" rx="8" fill="#fff" stroke="#e2e8f0" stroke-width="2"/>
    <ellipse cx="55" cy="45" rx="20" ry="15" fill="#d4a373"/><circle cx="47" cy="40" r="2" fill="#1e293b"/>
    <ellipse cx="55" cy="55" rx="12" ry="6" fill="#c8956e"/>
    <path d="M38 35 L30 25 L40 32" fill="#d4a373"/><path d="M72 35 L80 25 L70 32" fill="#d4a373"/>
    <text x="55" y="82" text-anchor="middle" font-size="11" font-weight="600" fill="#2c3e50" font-family="sans-serif">Perro</text>
    <rect x="160" y="15" width="130" height="85" rx="8" fill="#fff" stroke="#e2e8f0" stroke-width="2"/>
    <ellipse cx="225" cy="48" rx="16" ry="14" fill="#94a3b8"/><circle cx="219" cy="43" r="2" fill="#1e293b"/>
    <path d="M212 38 L205 25 L215 36" fill="#94a3b8"/><path d="M238 38 L245 25 L235 36" fill="#94a3b8"/>
    <line x1="225" y1="52" x2="225" y2="50" stroke="#f472b6" stroke-width="2"/>
    <text x="225" y="82" text-anchor="middle" font-size="11" font-weight="600" fill="#2c3e50" font-family="sans-serif">Gato</text>
    <rect x="10" y="115" width="130" height="85" rx="8" fill="#fff" stroke="#e2e8f0" stroke-width="2"/>
    <rect x="35" y="140" width="80" height="30" rx="8" fill="#3498db" stroke="#2980b9" stroke-width="2"/>
    <rect x="40" y="135" width="30" height="15" rx="4" fill="#bae6fd"/>
    <circle cx="50" cy="175" r="8" fill="#1e293b"/><circle cx="100" cy="175" r="8" fill="#1e293b"/>
    <text x="75" y="198" text-anchor="middle" font-size="11" font-weight="600" fill="#2c3e50" font-family="sans-serif">Auto</text>
    <rect x="160" y="115" width="130" height="85" rx="8" fill="#fff" stroke="#e2e8f0" stroke-width="2"/>
    <circle cx="225" cy="140" r="14" fill="#fcd34d" stroke="#f59e0b" stroke-width="2"/>
    <circle cx="220" cy="137" r="2" fill="#1e293b"/><circle cx="230" cy="137" r="2" fill="#1e293b"/>
    <path d="M222 144 Q225 148 228 144" fill="none" stroke="#1e293b" stroke-width="1.5"/>
    <rect x="215" y="154" width="20" height="20" rx="6" fill="#fbbf24"/>
    <text x="225" y="192" text-anchor="middle" font-size="11" font-weight="600" fill="#2c3e50" font-family="sans-serif">Beb\u00e9</text>
  `),

  /* AC17: Running child - clear motion lines */
  running: svg(`
    <circle cx="140" cy="42" r="22" fill="#fcd34d" stroke="#f59e0b" stroke-width="2"/>
    <circle cx="133" cy="37" r="3" fill="#1e293b"/><circle cx="147" cy="37" r="3" fill="#1e293b"/>
    <path d="M135 48 Q140 53 145 48" fill="none" stroke="#1e293b" stroke-width="1.5"/>
    <line x1="140" y1="64" x2="132" y2="110" stroke="#3498db" stroke-width="5" stroke-linecap="round"/>
    <line x1="132" y1="110" x2="108" y2="145" stroke="#3498db" stroke-width="4" stroke-linecap="round"/>
    <line x1="132" y1="110" x2="162" y2="148" stroke="#3498db" stroke-width="4" stroke-linecap="round"/>
    <line x1="135" y1="82" x2="172" y2="72" stroke="#3498db" stroke-width="4" stroke-linecap="round"/>
    <line x1="135" y1="82" x2="100" y2="90" stroke="#3498db" stroke-width="4" stroke-linecap="round"/>
    <line x1="80" y1="72" x2="95" y2="72" stroke="#94a3b8" stroke-width="2" opacity=".6"/>
    <line x1="75" y1="82" x2="92" y2="82" stroke="#94a3b8" stroke-width="2" opacity=".5"/>
    <line x1="78" y1="92" x2="90" y2="92" stroke="#94a3b8" stroke-width="2" opacity=".4"/>
    <text x="150" y="185" text-anchor="middle" font-size="16" font-weight="700" fill="#059669" font-family="sans-serif">Corriendo</text>
  `,`#f0fdf4`),

  /* AC18: Sizes - big vs small ball */
  sizes: svg(`
    <circle cx="100" cy="100" r="55" fill="#8b5cf6" stroke="#7c3aed" stroke-width="2"/>
    <ellipse cx="88" cy="76" rx="14" ry="7" fill="rgba(255,255,255,.25)" transform="rotate(-20 88 76)"/>
    <text x="100" y="175" text-anchor="middle" font-size="14" font-weight="700" fill="#2c3e50" font-family="sans-serif">Grande</text>
    <circle cx="220" cy="120" r="25" fill="#8b5cf6" stroke="#7c3aed" stroke-width="2"/>
    <text x="220" y="165" text-anchor="middle" font-size="14" font-weight="700" fill="#2c3e50" font-family="sans-serif">Peque\u00f1a</text>
  `),

  /* AC20: Spoon, ball, bike - clear which is for eating */
  spoon_ball_bike: svg(`
    <rect x="15" y="30" width="80" height="120" rx="10" fill="#fff" stroke="#e2e8f0" stroke-width="2"/>
    <ellipse cx="55" cy="65" rx="14" ry="20" fill="#cbd5e1" stroke="#94a3b8" stroke-width="2"/>
    <rect x="52" y="85" width="6" height="45" rx="3" fill="#94a3b8"/>
    <text x="55" y="160" text-anchor="middle" font-size="12" font-weight="600" fill="#2c3e50" font-family="sans-serif">Cuchara</text>
    <rect x="110" y="30" width="80" height="120" rx="10" fill="#fff" stroke="#e2e8f0" stroke-width="2"/>
    <circle cx="150" cy="80" r="25" fill="#e74c3c" stroke="#c0392b" stroke-width="2"/>
    <text x="150" y="160" text-anchor="middle" font-size="12" font-weight="600" fill="#2c3e50" font-family="sans-serif">Pelota</text>
    <rect x="205" y="30" width="80" height="120" rx="10" fill="#fff" stroke="#e2e8f0" stroke-width="2"/>
    <circle cx="232" cy="90" r="14" fill="none" stroke="#2c3e50" stroke-width="2.5"/>
    <circle cx="258" cy="90" r="14" fill="none" stroke="#2c3e50" stroke-width="2.5"/>
    <path d="M232 90 L245 65 L258 90" fill="none" stroke="#2c3e50" stroke-width="2.5"/>
    <text x="245" y="160" text-anchor="middle" font-size="12" font-weight="600" fill="#2c3e50" font-family="sans-serif">Bicicleta</text>
    <text x="150" y="195" text-anchor="middle" font-size="13" font-weight="700" fill="#059669" font-family="sans-serif">\u00bfCon qu\u00e9 comemos?</text>
  `),

  /* AC21: Dog in box - clearly inside */
  dog_box: svg(`
    <rect x="90" y="90" width="120" height="80" fill="#d4a373" stroke="#a3785f" stroke-width="3" rx="4"/>
    <rect x="86" y="82" width="128" height="14" fill="#c8956e" stroke="#a3785f" stroke-width="2" rx="3"/>
    <ellipse cx="150" cy="120" rx="22" ry="18" fill="#f5deb3"/>
    <circle cx="142" cy="114" r="3" fill="#1e293b"/>
    <circle cx="158" cy="114" r="3" fill="#1e293b"/>
    <ellipse cx="150" cy="122" rx="6" ry="3" fill="#1e293b"/>
    <path d="M132 108 L124 96" stroke="#d4a373" stroke-width="5" stroke-linecap="round"/>
    <path d="M168 108 L176 96" stroke="#d4a373" stroke-width="5" stroke-linecap="round"/>
    <text x="150" y="195" text-anchor="middle" font-size="14" font-weight="700" fill="#059669" font-family="sans-serif">\u00bfD\u00f3nde est\u00e1 el perro?</text>
    <text x="150" y="210" text-anchor="middle" font-size="11" fill="#64748b" font-family="sans-serif">El perro est\u00e1 adentro de la caja</text>
  `),

  /* AC22: Colors */
  colors: svg(`
    <rect x="25" y="30" width="60" height="60" rx="10" fill="#e74c3c" stroke="#c0392b" stroke-width="2"/>
    <text x="55" y="115" text-anchor="middle" font-size="13" font-weight="700" fill="#2c3e50" font-family="sans-serif">Rojo</text>
    <rect x="120" y="30" width="60" height="60" rx="10" fill="#3498db" stroke="#2980b9" stroke-width="2"/>
    <text x="150" y="115" text-anchor="middle" font-size="13" font-weight="700" fill="#2c3e50" font-family="sans-serif">Azul</text>
    <rect x="215" y="30" width="60" height="60" rx="10" fill="#f1c40f" stroke="#f39c12" stroke-width="2"/>
    <text x="245" y="115" text-anchor="middle" font-size="13" font-weight="700" fill="#2c3e50" font-family="sans-serif">Amarillo</text>
    <rect x="75" y="130" width="60" height="60" rx="10" fill="#2ecc71" stroke="#27ae60" stroke-width="2"/>
    <text x="105" y="210" text-anchor="middle" font-size="13" font-weight="700" fill="#2c3e50" font-family="sans-serif">Verde</text>
    <rect x="175" y="130" width="60" height="60" rx="10" fill="#f39c12" stroke="#e67e22" stroke-width="2"/>
    <text x="205" y="210" text-anchor="middle" font-size="13" font-weight="700" fill="#2c3e50" font-family="sans-serif">Naranja</text>
  `),

  /* AC25: Farm - animals with green field and house */
  farm: svg(`
    <rect x="0" y="120" width="300" height="100" fill="#86efac" rx="0"/>
    <rect x="0" y="0" width="300" height="120" fill="#bae6fd" rx="0"/>
    <circle cx="250" cy="40" r="28" fill="#fde68a" opacity=".8"/>
    <rect x="200" y="75" width="50" height="50" fill="#d4a373" stroke="#a3785f" stroke-width="2"/>
    <path d="M195 75 L225 50 L255 75" fill="#dc2626" stroke="#b91c1c" stroke-width="2"/>
    <rect x="215" y="95" width="16" height="30" fill="#7c3aed"/>
    <ellipse cx="60" cy="145" rx="18" ry="14" fill="#f5f5dc" stroke="#d4a373" stroke-width="2"/>
    <circle cx="52" cy="140" r="2" fill="#1e293b"/>
    <rect x="45" y="159" width="6" height="12" rx="2" fill="#d4a373"/>
    <rect x="62" y="159" width="6" height="12" rx="2" fill="#d4a373"/>
    <text x="60" y="190" text-anchor="middle" font-size="10" fill="#2c3e50" font-family="sans-serif">Vaca</text>
    <ellipse cx="130" cy="148" rx="12" ry="10" fill="#f59e0b" stroke="#d97706" stroke-width="1.5"/>
    <circle cx="126" cy="144" r="1.5" fill="#1e293b"/>
    <path d="M130 135 L127 128 L133 128 Z" fill="#dc2626"/>
    <text x="130" y="178" text-anchor="middle" font-size="10" fill="#2c3e50" font-family="sans-serif">Gallina</text>
    <rect x="18" y="60" width="12" height="60" fill="#8B4513"/>
    <circle cx="24" cy="50" r="24" fill="#22c55e" opacity=".8"/>
  `,`#e0f2fe`),

  /* AC26: Colored squares */
  squares: svg(`
    <rect x="50" y="40" width="80" height="80" rx="10" fill="#3498db" stroke="#2980b9" stroke-width="3"/>
    <text x="90" y="150" text-anchor="middle" font-size="15" font-weight="700" fill="#2c3e50" font-family="sans-serif">Azul</text>
    <rect x="170" y="40" width="80" height="80" rx="10" fill="#e74c3c" stroke="#c0392b" stroke-width="3"/>
    <text x="210" y="150" text-anchor="middle" font-size="15" font-weight="700" fill="#2c3e50" font-family="sans-serif">Rojo</text>
    <text x="150" y="190" text-anchor="middle" font-size="13" font-weight="600" fill="#059669" font-family="sans-serif">\u00bfCu\u00e1l es el azul? \u00bfCu\u00e1l es el rojo?</text>
  `),

  /* AC27: Running vs not running - clear difference */
  running_not: svg(`
    <rect x="10" y="15" width="130" height="160" rx="10" fill="#fff" stroke="#e2e8f0" stroke-width="2"/>
    <circle cx="75" cy="50" r="16" fill="#fcd34d"/>
    <circle cx="70" cy="47" r="2" fill="#1e293b"/><circle cx="80" cy="47" r="2" fill="#1e293b"/>
    <line x1="75" y1="66" x2="68" y2="100" stroke="#3498db" stroke-width="4" stroke-linecap="round"/>
    <line x1="68" y1="100" x2="50" y2="128" stroke="#3498db" stroke-width="3" stroke-linecap="round"/>
    <line x1="68" y1="100" x2="92" y2="126" stroke="#3498db" stroke-width="3" stroke-linecap="round"/>
    <line x1="70" y1="80" x2="98" y2="74" stroke="#3498db" stroke-width="3" stroke-linecap="round"/>
    <line x1="42" y1="70" x2="55" y2="70" stroke="#94a3b8" stroke-width="2" opacity=".5"/>
    <line x1="40" y1="78" x2="52" y2="78" stroke="#94a3b8" stroke-width="2" opacity=".4"/>
    <text x="75" y="155" text-anchor="middle" font-size="12" font-weight="700" fill="#059669" font-family="sans-serif">Corriendo</text>
    <rect x="160" y="15" width="130" height="160" rx="10" fill="#fff" stroke="#e2e8f0" stroke-width="2"/>
    <circle cx="225" cy="50" r="16" fill="#fcd34d"/>
    <circle cx="220" cy="47" r="2" fill="#1e293b"/><circle cx="230" cy="47" r="2" fill="#1e293b"/>
    <line x1="225" y1="66" x2="225" y2="110" stroke="#3498db" stroke-width="4" stroke-linecap="round"/>
    <line x1="225" y1="110" x2="210" y2="140" stroke="#3498db" stroke-width="3" stroke-linecap="round"/>
    <line x1="225" y1="110" x2="240" y2="140" stroke="#3498db" stroke-width="3" stroke-linecap="round"/>
    <line x1="225" y1="82" x2="200" y2="92" stroke="#3498db" stroke-width="3" stroke-linecap="round"/>
    <line x1="225" y1="82" x2="250" y2="92" stroke="#3498db" stroke-width="3" stroke-linecap="round"/>
    <text x="225" y="155" text-anchor="middle" font-size="12" font-weight="700" fill="#dc2626" font-family="sans-serif">Quieto</text>
    <text x="150" y="200" text-anchor="middle" font-size="13" font-weight="600" fill="#475569" font-family="sans-serif">\u00bfCu\u00e1l NO est\u00e1 corriendo?</text>
  `),

  /* AC28: One vs many balls */
  many_balls: svg(`
    <rect x="10" y="15" width="130" height="140" rx="10" fill="#fff" stroke="#e2e8f0" stroke-width="2"/>
    <circle cx="75" cy="75" r="35" fill="#e74c3c" stroke="#c0392b" stroke-width="2"/>
    <text x="75" y="138" text-anchor="middle" font-size="12" font-weight="700" fill="#2c3e50" font-family="sans-serif">Una pelota</text>
    <rect x="160" y="15" width="130" height="140" rx="10" fill="#fff" stroke="#e2e8f0" stroke-width="2"/>
    <circle cx="195" cy="55" r="16" fill="#3498db"/><circle cx="225" cy="50" r="16" fill="#2ecc71"/>
    <circle cx="255" cy="65" r="16" fill="#f1c40f"/><circle cx="200" cy="85" r="16" fill="#8b5cf6"/>
    <circle cx="235" cy="90" r="16" fill="#e67e22"/><circle cx="220" cy="118" r="16" fill="#e74c3c"/>
    <text x="225" y="145" text-anchor="middle" font-size="12" font-weight="700" fill="#2c3e50" font-family="sans-serif">Muchas pelotas</text>
    <text x="150" y="190" text-anchor="middle" font-size="13" font-weight="600" fill="#059669" font-family="sans-serif">\u00bfD\u00f3nde hay muchas?</text>
  `),

  /* AC29: Boy and girl - clearly distinguished */
  boy_girl: svg(`
    <rect x="15" y="15" width="120" height="165" rx="10" fill="#eff6ff" stroke="#bfdbfe" stroke-width="2"/>
    <circle cx="75" cy="55" r="22" fill="#fcd34d" stroke="#f59e0b" stroke-width="2"/>
    <circle cx="67" cy="50" r="3" fill="#1e293b"/><circle cx="83" cy="50" r="3" fill="#1e293b"/>
    <path d="M70 60 Q75 65 80 60" fill="none" stroke="#1e293b" stroke-width="1.5"/>
    <rect x="60" y="55" width="30" height="4" rx="2" fill="#2c3e50"/>
    <line x1="75" y1="77" x2="75" y2="120" stroke="#3498db" stroke-width="5" stroke-linecap="round"/>
    <line x1="75" y1="90" x2="55" y2="105" stroke="#3498db" stroke-width="3" stroke-linecap="round"/>
    <line x1="75" y1="90" x2="95" y2="105" stroke="#3498db" stroke-width="3" stroke-linecap="round"/>
    <line x1="75" y1="120" x2="60" y2="150" stroke="#3498db" stroke-width="3" stroke-linecap="round"/>
    <line x1="75" y1="120" x2="90" y2="150" stroke="#3498db" stroke-width="3" stroke-linecap="round"/>
    <text x="75" y="172" text-anchor="middle" font-size="15" font-weight="700" fill="#3498db" font-family="sans-serif">Ni\u00f1o</text>
    <rect x="165" y="15" width="120" height="165" rx="10" fill="#fdf2f8" stroke="#fbcfe8" stroke-width="2"/>
    <circle cx="225" cy="55" r="22" fill="#fcd34d" stroke="#f59e0b" stroke-width="2"/>
    <circle cx="217" cy="50" r="3" fill="#1e293b"/><circle cx="233" cy="50" r="3" fill="#1e293b"/>
    <path d="M220 60 Q225 65 230 60" fill="none" stroke="#1e293b" stroke-width="1.5"/>
    <path d="M207 42 Q212 32 225 35 Q238 32 243 42" fill="none" stroke="#7c3aed" stroke-width="3"/>
    <path d="M203 45 Q208 50 210 44" fill="none" stroke="#7c3aed" stroke-width="2"/>
    <line x1="225" y1="77" x2="225" y2="105" stroke="#ec4899" stroke-width="5" stroke-linecap="round"/>
    <path d="M208 105 L225 105 L242 105 L238 148 L212 148 Z" fill="#ec4899" stroke="#db2777" stroke-width="2"/>
    <line x1="225" y1="90" x2="205" y2="105" stroke="#ec4899" stroke-width="3" stroke-linecap="round"/>
    <line x1="225" y1="90" x2="245" y2="105" stroke="#ec4899" stroke-width="3" stroke-linecap="round"/>
    <text x="225" y="172" text-anchor="middle" font-size="15" font-weight="700" fill="#ec4899" font-family="sans-serif">Ni\u00f1a</text>
  `),

  /* AC33: Buildings - tall vs short, labels not overlapping */
  buildings: svg(`
    <rect x="0" y="175" width="300" height="45" fill="#e2e8f0"/>
    <rect x="40" y="100" width="70" height="75" fill="#94a3b8" stroke="#64748b" stroke-width="2" rx="3"/>
    <rect x="50" y="110" width="16" height="16" rx="2" fill="#bae6fd"/><rect x="74" y="110" width="16" height="16" rx="2" fill="#bae6fd"/>
    <rect x="50" y="134" width="16" height="16" rx="2" fill="#bae6fd"/><rect x="74" y="134" width="16" height="16" rx="2" fill="#bae6fd"/>
    <rect x="65" y="158" width="20" height="17" rx="2" fill="#475569"/>
    <text x="75" y="205" text-anchor="middle" font-size="14" font-weight="700" fill="#2c3e50" font-family="sans-serif">Bajo</text>
    <rect x="170" y="25" width="70" height="150" fill="#64748b" stroke="#475569" stroke-width="2" rx="3"/>
    <rect x="180" y="35" width="16" height="16" rx="2" fill="#bae6fd"/><rect x="214" y="35" width="16" height="16" rx="2" fill="#bae6fd"/>
    <rect x="180" y="58" width="16" height="16" rx="2" fill="#bae6fd"/><rect x="214" y="58" width="16" height="16" rx="2" fill="#bae6fd"/>
    <rect x="180" y="81" width="16" height="16" rx="2" fill="#bae6fd"/><rect x="214" y="81" width="16" height="16" rx="2" fill="#bae6fd"/>
    <rect x="180" y="104" width="16" height="16" rx="2" fill="#bae6fd"/><rect x="214" y="104" width="16" height="16" rx="2" fill="#bae6fd"/>
    <rect x="180" y="127" width="16" height="16" rx="2" fill="#bae6fd"/>
    <rect x="196" y="158" width="18" height="17" rx="2" fill="#475569"/>
    <text x="205" y="205" text-anchor="middle" font-size="14" font-weight="700" fill="#2c3e50" font-family="sans-serif">Alto</text>
    <text x="150" y="16" text-anchor="middle" font-size="13" font-weight="600" fill="#059669" font-family="sans-serif">\u00bfCu\u00e1l es m\u00e1s alto?</text>
  `),

  /* AC34: Thermometer - lines inside the tube */
  thermometer: svg(`
    <rect x="130" y="25" width="26" height="110" rx="13" fill="#fee2e2" stroke="#ef4444" stroke-width="2"/>
    <rect x="134" y="75" width="18" height="55" rx="9" fill="#ef4444"/>
    <circle cx="143" cy="150" r="22" fill="#ef4444" stroke="#dc2626" stroke-width="2"/>
    <circle cx="143" cy="150" r="12" fill="#b91c1c"/>
    <line x1="138" y1="45" x2="148" y2="45" stroke="#94a3b8" stroke-width="1"/>
    <line x1="138" y1="55" x2="148" y2="55" stroke="#94a3b8" stroke-width="1"/>
    <line x1="138" y1="65" x2="148" y2="65" stroke="#94a3b8" stroke-width="1"/>
    <line x1="138" y1="75" x2="148" y2="75" stroke="#94a3b8" stroke-width="1"/>
    <text x="175" y="50" font-size="10" fill="#64748b" font-family="sans-serif">Fr\u00edo</text>
    <text x="175" y="80" font-size="10" fill="#ef4444" font-family="sans-serif">Calor</text>
    <text x="143" y="200" text-anchor="middle" font-size="14" font-weight="700" fill="#475569" font-family="sans-serif">\u00bfPara qu\u00e9 sirve?</text>
  `),

  /* AC35: Rain + umbrella - person with hand on umbrella */
  rain_umbrella: svg(`
    <rect x="0" y="0" width="300" height="220" fill="#7f8c8d" rx="12"/>
    <line x1="50" y1="15" x2="45" y2="50" stroke="#bae6fd" stroke-width="2" opacity=".6"/>
    <line x1="90" y1="10" x2="85" y2="45" stroke="#bae6fd" stroke-width="2" opacity=".6"/>
    <line x1="210" y1="12" x2="205" y2="47" stroke="#bae6fd" stroke-width="2" opacity=".6"/>
    <line x1="250" y1="20" x2="245" y2="55" stroke="#bae6fd" stroke-width="2" opacity=".6"/>
    <line x1="170" y1="8" x2="165" y2="43" stroke="#bae6fd" stroke-width="2" opacity=".6"/>
    <path d="M100 95 Q150 35 200 95 Z" fill="#e74c3c" stroke="#c0392b" stroke-width="2"/>
    <line x1="150" y1="95" x2="150" y2="155" stroke="#475569" stroke-width="3"/>
    <path d="M150 155 Q142 168 136 160" fill="none" stroke="#475569" stroke-width="3"/>
    <circle cx="150" cy="168" r="14" fill="#fcd34d" stroke="#f59e0b" stroke-width="2"/>
    <circle cx="145" cy="165" r="2" fill="#1e293b"/><circle cx="155" cy="165" r="2" fill="#1e293b"/>
    <path d="M145 173 Q150 177 155 173" fill="none" stroke="#1e293b" stroke-width="1.5"/>
    <line x1="150" y1="95" x2="165" y2="80" stroke="#fcd34d" stroke-width="3" stroke-linecap="round"/>
    <text x="150" y="205" text-anchor="middle" font-size="13" font-weight="700" fill="#fff" font-family="sans-serif">\u00bfPor qu\u00e9 usa paraguas?</text>
  `),

  /* AC38: Hat man */
  hat_man: svg(`
    <circle cx="100" cy="75" r="25" fill="#fcd34d" stroke="#f59e0b" stroke-width="2"/>
    <circle cx="92" cy="70" r="3" fill="#1e293b"/><circle cx="108" cy="70" r="3" fill="#1e293b"/>
    <path d="M95 82 Q100 87 105 82" fill="none" stroke="#1e293b" stroke-width="1.5"/>
    <rect x="75" y="47" width="50" height="8" rx="3" fill="#475569"/>
    <rect x="85" y="27" width="30" height="25" rx="3" fill="#475569"/>
    <line x1="100" y1="100" x2="100" y2="155" stroke="#94a3b8" stroke-width="5" stroke-linecap="round"/>
    <line x1="100" y1="115" x2="75" y2="135" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/>
    <line x1="100" y1="115" x2="125" y2="135" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/>
    <rect x="190" y="90" width="50" height="8" rx="3" fill="#475569"/>
    <rect x="200" y="70" width="30" height="25" rx="3" fill="#475569"/>
    <rect x="180" y="115" width="70" height="6" rx="2" fill="#d4a373"/>
    <text x="150" y="195" text-anchor="middle" font-size="13" font-weight="700" fill="#059669" font-family="sans-serif">\u00bfCu\u00e1l es el sombrero del se\u00f1or?</text>
  `),

  /* AC45: Wet child in rain - more color */
  wet_rain: svg(`
    <rect x="0" y="0" width="300" height="220" rx="12" fill="#5b7d9a"/>
    <line x1="50" y1="15" x2="45" y2="55" stroke="#bae6fd" stroke-width="2" opacity=".7"/>
    <line x1="100" y1="20" x2="95" y2="60" stroke="#bae6fd" stroke-width="2" opacity=".7"/>
    <line x1="150" y1="10" x2="145" y2="50" stroke="#bae6fd" stroke-width="2" opacity=".7"/>
    <line x1="200" y1="18" x2="195" y2="58" stroke="#bae6fd" stroke-width="2" opacity=".7"/>
    <line x1="250" y1="25" x2="245" y2="65" stroke="#bae6fd" stroke-width="2" opacity=".7"/>
    <line x1="70" y1="45" x2="65" y2="85" stroke="#bae6fd" stroke-width="2" opacity=".5"/>
    <line x1="170" y1="40" x2="165" y2="80" stroke="#bae6fd" stroke-width="2" opacity=".5"/>
    <line x1="230" y1="50" x2="225" y2="90" stroke="#bae6fd" stroke-width="2" opacity=".5"/>
    <circle cx="150" cy="100" r="20" fill="#fcd34d" stroke="#f59e0b" stroke-width="2"/>
    <circle cx="143" cy="95" r="3" fill="#1e293b"/><circle cx="157" cy="95" r="3" fill="#1e293b"/>
    <path d="M143 108 Q150 114 157 108" fill="none" stroke="#1e293b" stroke-width="2"/>
    <line x1="150" y1="120" x2="150" y2="165" stroke="#3498db" stroke-width="5" stroke-linecap="round"/>
    <line x1="150" y1="135" x2="125" y2="150" stroke="#3498db" stroke-width="3" stroke-linecap="round"/>
    <line x1="150" y1="135" x2="175" y2="150" stroke="#3498db" stroke-width="3" stroke-linecap="round"/>
    <line x1="135" y1="85" x2="130" y2="75" stroke="#87ceeb" stroke-width="2"/>
    <line x1="165" y1="85" x2="170" y2="75" stroke="#87ceeb" stroke-width="2"/>
    <text x="150" y="60" text-anchor="middle" font-size="14" font-weight="600" fill="#bae6fd" font-family="sans-serif">Lluvia</text>
    <text x="150" y="200" text-anchor="middle" font-size="14" font-weight="700" fill="#fff" font-family="sans-serif">\u00bfPor qu\u00e9 est\u00e1 mojado?</text>
  `)
};
