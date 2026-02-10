/* Improved SVG illustrations for ELDI items - clinical quality */
const S={w:300,h:220};
const svg=(children,bg="#f8faf9")=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S.w} ${S.h}" style="max-width:100%;border-radius:12px;background:${bg}">${children}</svg>`;

export const ELDI_IMAGES={

  /* AC10: Pelota - clear red ball */
  ball: svg(`
    <defs><radialGradient id="bg" cx="40%" cy="35%"><stop offset="0%" stop-color="#ff6b6b"/><stop offset="100%" stop-color="#c0392b"/></radialGradient></defs>
    <circle cx="150" cy="100" r="55" fill="url(#bg)" stroke="#a93226" stroke-width="2"/>
    <ellipse cx="135" cy="80" rx="18" ry="8" fill="rgba(255,255,255,.35)" transform="rotate(-25 135 80)"/>
    <ellipse cx="150" cy="160" rx="40" ry="6" fill="rgba(0,0,0,.08)"/>
  `),

  /* AC12: Cara simple con ojos, nariz y boca claramente visibles - SIN texto */
  body: svg(`
    <circle cx="150" cy="95" r="70" fill="#fef3c7" stroke="#f59e0b" stroke-width="3"/>
    <ellipse cx="120" cy="78" rx="10" ry="12" fill="#fff" stroke="#1e293b" stroke-width="2"/>
    <circle cx="120" cy="78" r="5" fill="#1e293b"/>
    <ellipse cx="180" cy="78" rx="10" ry="12" fill="#fff" stroke="#1e293b" stroke-width="2"/>
    <circle cx="180" cy="78" r="5" fill="#1e293b"/>
    <ellipse cx="150" cy="105" rx="8" ry="6" fill="#f4a460" stroke="#d4845f" stroke-width="1.5"/>
    <path d="M130 128 Q150 148 170 128" fill="#e74c3c" stroke="#c0392b" stroke-width="2"/>
    <path d="M130 128 Q150 138 170 128" fill="#f8b4b4"/>
    <path d="M118 60 Q120 52 128 58" fill="none" stroke="#8B6508" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M182 60 Q180 52 172 58" fill="none" stroke="#8B6508" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M110 40 Q150 20 190 40" fill="none" stroke="#8B6508" stroke-width="6" stroke-linecap="round"/>
  `,`#e0f2fe`),

  /* AC13: 3 objetos con EMOJIS - pelota, cuaderno, bicicleta - SIN texto */
  "3objects": svg(`
    <rect x="15" y="30" width="80" height="140" rx="12" fill="#fff" stroke="#e2e8f0" stroke-width="2"/>
    <text x="55" y="115" text-anchor="middle" font-size="60">\u26bd</text>
    <rect x="110" y="30" width="80" height="140" rx="12" fill="#fff" stroke="#e2e8f0" stroke-width="2"/>
    <text x="150" y="115" text-anchor="middle" font-size="60">\ud83d\udcd3</text>
    <rect x="205" y="30" width="80" height="140" rx="12" fill="#fff" stroke="#e2e8f0" stroke-width="2"/>
    <text x="245" y="115" text-anchor="middle" font-size="60">\ud83d\udeb2</text>
  `),

  /* AC15: Common images - perro, gato, auto, bebe - SIN texto */
  animals: svg(`
    <rect x="10" y="10" width="130" height="90" rx="10" fill="#fff" stroke="#e2e8f0" stroke-width="2"/>
    <text x="75" y="72" text-anchor="middle" font-size="50">\ud83d\udc36</text>
    <rect x="160" y="10" width="130" height="90" rx="10" fill="#fff" stroke="#e2e8f0" stroke-width="2"/>
    <text x="225" y="72" text-anchor="middle" font-size="50">\ud83d\udc31</text>
    <rect x="10" y="115" width="130" height="90" rx="10" fill="#fff" stroke="#e2e8f0" stroke-width="2"/>
    <text x="75" y="177" text-anchor="middle" font-size="50">\ud83d\ude97</text>
    <rect x="160" y="115" width="130" height="90" rx="10" fill="#fff" stroke="#e2e8f0" stroke-width="2"/>
    <text x="225" y="177" text-anchor="middle" font-size="50">\ud83d\udc76</text>
  `),

  /* AC17: Dos ni\u00f1os - uno corriendo, otro quieto - SIN texto */
  running: svg(`
    <rect x="10" y="10" width="130" height="190" rx="10" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="2"/>
    <circle cx="75" cy="50" r="20" fill="#fcd34d" stroke="#f59e0b" stroke-width="2"/>
    <circle cx="68" cy="46" r="3" fill="#1e293b"/><circle cx="82" cy="46" r="3" fill="#1e293b"/>
    <path d="M70 55 Q75 60 80 55" fill="none" stroke="#1e293b" stroke-width="1.5"/>
    <line x1="75" y1="70" x2="68" y2="110" stroke="#3498db" stroke-width="5" stroke-linecap="round"/>
    <line x1="68" y1="110" x2="48" y2="145" stroke="#3498db" stroke-width="4" stroke-linecap="round"/>
    <line x1="68" y1="110" x2="95" y2="140" stroke="#3498db" stroke-width="4" stroke-linecap="round"/>
    <line x1="70" y1="85" x2="100" y2="78" stroke="#3498db" stroke-width="4" stroke-linecap="round"/>
    <line x1="70" y1="85" x2="45" y2="95" stroke="#3498db" stroke-width="4" stroke-linecap="round"/>
    <line x1="35" y1="78" x2="50" y2="78" stroke="#94a3b8" stroke-width="2" opacity=".5"/>
    <line x1="32" y1="86" x2="48" y2="86" stroke="#94a3b8" stroke-width="2" opacity=".4"/>
    <line x1="34" y1="94" x2="46" y2="94" stroke="#94a3b8" stroke-width="2" opacity=".3"/>
    <rect x="160" y="10" width="130" height="190" rx="10" fill="#fff" stroke="#e2e8f0" stroke-width="2"/>
    <circle cx="225" cy="50" r="20" fill="#fcd34d" stroke="#f59e0b" stroke-width="2"/>
    <circle cx="218" cy="46" r="3" fill="#1e293b"/><circle cx="232" cy="46" r="3" fill="#1e293b"/>
    <path d="M220 55 Q225 60 230 55" fill="none" stroke="#1e293b" stroke-width="1.5"/>
    <line x1="225" y1="70" x2="225" y2="120" stroke="#3498db" stroke-width="5" stroke-linecap="round"/>
    <line x1="225" y1="120" x2="210" y2="155" stroke="#3498db" stroke-width="4" stroke-linecap="round"/>
    <line x1="225" y1="120" x2="240" y2="155" stroke="#3498db" stroke-width="4" stroke-linecap="round"/>
    <line x1="225" y1="90" x2="200" y2="100" stroke="#3498db" stroke-width="4" stroke-linecap="round"/>
    <line x1="225" y1="90" x2="250" y2="100" stroke="#3498db" stroke-width="4" stroke-linecap="round"/>
  `),

  /* AC18: Tama\u00f1o - pelota grande y peque\u00f1a - SIN texto */
  sizes: svg(`
    <circle cx="100" cy="100" r="60" fill="#8b5cf6" stroke="#7c3aed" stroke-width="2"/>
    <ellipse cx="85" cy="76" rx="16" ry="7" fill="rgba(255,255,255,.25)" transform="rotate(-20 85 76)"/>
    <circle cx="225" cy="125" r="28" fill="#8b5cf6" stroke="#7c3aed" stroke-width="2"/>
    <ellipse cx="218" cy="114" rx="8" ry="4" fill="rgba(255,255,255,.25)" transform="rotate(-20 218 114)"/>
  `),

  /* AC20: Cuchara, pelota, bici - con EMOJIS - SIN texto de nombres */
  spoon_ball_bike: svg(`
    <rect x="15" y="25" width="80" height="130" rx="12" fill="#fff" stroke="#e2e8f0" stroke-width="2"/>
    <text x="55" y="105" text-anchor="middle" font-size="55">\ud83e\udd44</text>
    <rect x="110" y="25" width="80" height="130" rx="12" fill="#fff" stroke="#e2e8f0" stroke-width="2"/>
    <text x="150" y="105" text-anchor="middle" font-size="55">\u26bd</text>
    <rect x="205" y="25" width="80" height="130" rx="12" fill="#fff" stroke="#e2e8f0" stroke-width="2"/>
    <text x="245" y="105" text-anchor="middle" font-size="55">\ud83d\udeb2</text>
    <text x="150" y="195" text-anchor="middle" font-size="14" font-weight="700" fill="#059669" font-family="sans-serif">\u00bfCon qu\u00e9 comemos?</text>
  `),

  /* AC21: Perro dentro de una caja - dibujo mejorado - SIN texto descriptivo */
  dog_box: svg(`
    <rect x="75" y="85" width="150" height="100" fill="#d4a373" stroke="#a3785f" stroke-width="3" rx="4"/>
    <rect x="70" y="75" width="160" height="16" fill="#c8956e" stroke="#a3785f" stroke-width="2" rx="3"/>
    <ellipse cx="150" cy="130" rx="30" ry="24" fill="#f5deb3"/>
    <circle cx="138" cy="120" r="5" fill="#1e293b"/>
    <circle cx="162" cy="120" r="5" fill="#1e293b"/>
    <ellipse cx="150" cy="132" rx="8" ry="5" fill="#1e293b"/>
    <path d="M125 110 L112 95" stroke="#c8956e" stroke-width="7" stroke-linecap="round"/>
    <path d="M175 110 L188 95" stroke="#c8956e" stroke-width="7" stroke-linecap="round"/>
    <path d="M140 137 Q150 145 160 137" fill="none" stroke="#c0392b" stroke-width="2"/>
  `,`#fef9f0`),

  /* AC22: Colors - SIN texto de nombres */
  colors: svg(`
    <rect x="25" y="30" width="70" height="70" rx="12" fill="#e74c3c" stroke="#c0392b" stroke-width="2"/>
    <rect x="115" y="30" width="70" height="70" rx="12" fill="#3498db" stroke="#2980b9" stroke-width="2"/>
    <rect x="205" y="30" width="70" height="70" rx="12" fill="#f1c40f" stroke="#f39c12" stroke-width="2"/>
    <rect x="70" y="125" width="70" height="70" rx="12" fill="#2ecc71" stroke="#27ae60" stroke-width="2"/>
    <rect x="160" y="125" width="70" height="70" rx="12" fill="#f39c12" stroke="#e67e22" stroke-width="2"/>
  `),

  /* AC25: Granja con animales - escena completa con emojis */
  farm: svg(`
    <rect x="0" y="130" width="300" height="90" fill="#86efac" rx="0"/>
    <rect x="0" y="0" width="300" height="130" fill="#bae6fd" rx="0"/>
    <circle cx="260" cy="35" r="25" fill="#fde68a" opacity=".9"/>
    <text x="220" y="120" font-size="35">\ud83c\udfe1</text>
    <text x="15" y="80" font-size="32">\ud83c\udf33</text>
    <text x="265" y="80" font-size="32">\ud83c\udf33</text>
    <text x="30" y="175" font-size="32">\ud83d\udc04</text>
    <text x="90" y="175" font-size="32">\ud83d\udc14</text>
    <text x="145" y="175" font-size="32">\ud83d\udc11</text>
    <text x="195" y="175" font-size="32">\ud83d\udc34</text>
    <rect x="55" y="130" width="3" height="55" fill="#8B4513"/>
    <rect x="105" y="130" width="3" height="55" fill="#8B4513"/>
    <rect x="155" y="130" width="3" height="55" fill="#8B4513"/>
    <rect x="205" y="130" width="3" height="55" fill="#8B4513"/>
    <line x1="40" y1="140" x2="220" y2="140" stroke="#8B4513" stroke-width="3"/>
    <line x1="40" y1="155" x2="220" y2="155" stroke="#8B4513" stroke-width="3"/>
  `,`#e0f2fe`),

  /* AC26: Colored squares - SIN texto */
  squares: svg(`
    <rect x="50" y="40" width="80" height="80" rx="10" fill="#3498db" stroke="#2980b9" stroke-width="3"/>
    <rect x="170" y="40" width="80" height="80" rx="10" fill="#e74c3c" stroke="#c0392b" stroke-width="3"/>
  `),

  /* AC27: Corriendo vs quieto - SIN texto descriptivo */
  running_not: svg(`
    <rect x="10" y="10" width="130" height="190" rx="10" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="2"/>
    <circle cx="75" cy="48" r="18" fill="#fcd34d" stroke="#f59e0b" stroke-width="2"/>
    <circle cx="69" cy="45" r="2.5" fill="#1e293b"/><circle cx="81" cy="45" r="2.5" fill="#1e293b"/>
    <path d="M71 53 Q75 57 79 53" fill="none" stroke="#1e293b" stroke-width="1.5"/>
    <line x1="75" y1="66" x2="68" y2="100" stroke="#3498db" stroke-width="4" stroke-linecap="round"/>
    <line x1="68" y1="100" x2="50" y2="132" stroke="#3498db" stroke-width="3" stroke-linecap="round"/>
    <line x1="68" y1="100" x2="92" y2="128" stroke="#3498db" stroke-width="3" stroke-linecap="round"/>
    <line x1="70" y1="80" x2="98" y2="74" stroke="#3498db" stroke-width="3" stroke-linecap="round"/>
    <line x1="70" y1="80" x2="48" y2="88" stroke="#3498db" stroke-width="3" stroke-linecap="round"/>
    <line x1="38" y1="74" x2="52" y2="74" stroke="#94a3b8" stroke-width="2" opacity=".5"/>
    <line x1="35" y1="82" x2="50" y2="82" stroke="#94a3b8" stroke-width="2" opacity=".4"/>
    <rect x="160" y="10" width="130" height="190" rx="10" fill="#fff" stroke="#e2e8f0" stroke-width="2"/>
    <circle cx="225" cy="48" r="18" fill="#fcd34d" stroke="#f59e0b" stroke-width="2"/>
    <circle cx="219" cy="45" r="2.5" fill="#1e293b"/><circle cx="231" cy="45" r="2.5" fill="#1e293b"/>
    <path d="M221 53 Q225 57 229 53" fill="none" stroke="#1e293b" stroke-width="1.5"/>
    <line x1="225" y1="66" x2="225" y2="110" stroke="#3498db" stroke-width="4" stroke-linecap="round"/>
    <line x1="225" y1="110" x2="210" y2="145" stroke="#3498db" stroke-width="3" stroke-linecap="round"/>
    <line x1="225" y1="110" x2="240" y2="145" stroke="#3498db" stroke-width="3" stroke-linecap="round"/>
    <line x1="225" y1="85" x2="200" y2="95" stroke="#3498db" stroke-width="3" stroke-linecap="round"/>
    <line x1="225" y1="85" x2="250" y2="95" stroke="#3498db" stroke-width="3" stroke-linecap="round"/>
  `),

  /* AC28: One vs many balls */
  many_balls: svg(`
    <rect x="10" y="15" width="130" height="140" rx="10" fill="#fff" stroke="#e2e8f0" stroke-width="2"/>
    <circle cx="75" cy="75" r="35" fill="#e74c3c" stroke="#c0392b" stroke-width="2"/>
    <rect x="160" y="15" width="130" height="140" rx="10" fill="#fff" stroke="#e2e8f0" stroke-width="2"/>
    <circle cx="195" cy="55" r="16" fill="#3498db"/><circle cx="225" cy="50" r="16" fill="#2ecc71"/>
    <circle cx="255" cy="65" r="16" fill="#f1c40f"/><circle cx="200" cy="85" r="16" fill="#8b5cf6"/>
    <circle cx="235" cy="90" r="16" fill="#e67e22"/><circle cx="220" cy="118" r="16" fill="#e74c3c"/>
  `),

  /* AC29: Ni\u00f1o y ni\u00f1a - claramente distinguibles - SIN texto */
  boy_girl: svg(`
    <rect x="15" y="10" width="120" height="195" rx="10" fill="#eff6ff" stroke="#bfdbfe" stroke-width="2"/>
    <circle cx="75" cy="55" r="25" fill="#fcd34d" stroke="#f59e0b" stroke-width="2"/>
    <circle cx="67" cy="50" r="3.5" fill="#1e293b"/><circle cx="83" cy="50" r="3.5" fill="#1e293b"/>
    <path d="M70 62 Q75 67 80 62" fill="none" stroke="#1e293b" stroke-width="1.5"/>
    <rect x="58" y="30" width="34" height="6" rx="3" fill="#5b4a3f"/>
    <line x1="75" y1="80" x2="75" y2="130" stroke="#3498db" stroke-width="5" stroke-linecap="round"/>
    <line x1="75" y1="95" x2="55" y2="112" stroke="#3498db" stroke-width="4" stroke-linecap="round"/>
    <line x1="75" y1="95" x2="95" y2="112" stroke="#3498db" stroke-width="4" stroke-linecap="round"/>
    <line x1="75" y1="130" x2="58" y2="165" stroke="#2563eb" stroke-width="4" stroke-linecap="round"/>
    <line x1="75" y1="130" x2="92" y2="165" stroke="#2563eb" stroke-width="4" stroke-linecap="round"/>
    <rect x="165" y="10" width="120" height="195" rx="10" fill="#fdf2f8" stroke="#fbcfe8" stroke-width="2"/>
    <circle cx="225" cy="55" r="25" fill="#fcd34d" stroke="#f59e0b" stroke-width="2"/>
    <circle cx="217" cy="50" r="3.5" fill="#1e293b"/><circle cx="233" cy="50" r="3.5" fill="#1e293b"/>
    <path d="M220 62 Q225 67 230 62" fill="none" stroke="#1e293b" stroke-width="1.5"/>
    <path d="M204 42 Q210 28 225 32 Q240 28 246 42" fill="none" stroke="#7c3aed" stroke-width="4"/>
    <path d="M200 48 Q205 55 208 46" fill="none" stroke="#7c3aed" stroke-width="2.5"/>
    <path d="M242 46 Q245 55 250 48" fill="none" stroke="#7c3aed" stroke-width="2.5"/>
    <line x1="225" y1="80" x2="225" y2="110" stroke="#ec4899" stroke-width="5" stroke-linecap="round"/>
    <path d="M208 110 L225 110 L242 110 L238 165 L212 165 Z" fill="#ec4899" stroke="#db2777" stroke-width="2"/>
    <line x1="225" y1="95" x2="205" y2="112" stroke="#ec4899" stroke-width="4" stroke-linecap="round"/>
    <line x1="225" y1="95" x2="245" y2="112" stroke="#ec4899" stroke-width="4" stroke-linecap="round"/>
  `),

  /* AC33: Buildings - tall vs short - SIN texto */
  buildings: svg(`
    <rect x="0" y="175" width="300" height="45" fill="#e2e8f0"/>
    <rect x="40" y="100" width="70" height="75" fill="#94a3b8" stroke="#64748b" stroke-width="2" rx="3"/>
    <rect x="50" y="110" width="16" height="16" rx="2" fill="#bae6fd"/><rect x="74" y="110" width="16" height="16" rx="2" fill="#bae6fd"/>
    <rect x="50" y="134" width="16" height="16" rx="2" fill="#bae6fd"/><rect x="74" y="134" width="16" height="16" rx="2" fill="#bae6fd"/>
    <rect x="65" y="158" width="20" height="17" rx="2" fill="#475569"/>
    <rect x="170" y="25" width="70" height="150" fill="#64748b" stroke="#475569" stroke-width="2" rx="3"/>
    <rect x="180" y="35" width="16" height="16" rx="2" fill="#bae6fd"/><rect x="214" y="35" width="16" height="16" rx="2" fill="#bae6fd"/>
    <rect x="180" y="58" width="16" height="16" rx="2" fill="#bae6fd"/><rect x="214" y="58" width="16" height="16" rx="2" fill="#bae6fd"/>
    <rect x="180" y="81" width="16" height="16" rx="2" fill="#bae6fd"/><rect x="214" y="81" width="16" height="16" rx="2" fill="#bae6fd"/>
    <rect x="180" y="104" width="16" height="16" rx="2" fill="#bae6fd"/><rect x="214" y="104" width="16" height="16" rx="2" fill="#bae6fd"/>
    <rect x="180" y="127" width="16" height="16" rx="2" fill="#bae6fd"/>
    <rect x="196" y="158" width="18" height="17" rx="2" fill="#475569"/>
  `),

  /* AC34: Thermometer */
  thermometer: svg(`
    <rect x="130" y="25" width="26" height="110" rx="13" fill="#fee2e2" stroke="#ef4444" stroke-width="2"/>
    <rect x="134" y="75" width="18" height="55" rx="9" fill="#ef4444"/>
    <circle cx="143" cy="150" r="22" fill="#ef4444" stroke="#dc2626" stroke-width="2"/>
    <circle cx="143" cy="150" r="12" fill="#b91c1c"/>
    <line x1="138" y1="45" x2="148" y2="45" stroke="#94a3b8" stroke-width="1"/>
    <line x1="138" y1="55" x2="148" y2="55" stroke="#94a3b8" stroke-width="1"/>
    <line x1="138" y1="65" x2="148" y2="65" stroke="#94a3b8" stroke-width="1"/>
    <line x1="138" y1="75" x2="148" y2="75" stroke="#94a3b8" stroke-width="1"/>
    <text x="143" y="200" text-anchor="middle" font-size="14" font-weight="700" fill="#475569" font-family="sans-serif">\u00bfPara qu\u00e9 sirve?</text>
  `),

  /* AC35: Ni\u00f1o con paraguas bajo la lluvia */
  rain_umbrella: svg(`
    <rect x="0" y="0" width="300" height="220" fill="#7f8c8d" rx="12"/>
    <line x1="40" y1="10" x2="35" y2="50" stroke="#bae6fd" stroke-width="2" opacity=".6"/>
    <line x1="80" y1="5" x2="75" y2="45" stroke="#bae6fd" stroke-width="2" opacity=".6"/>
    <line x1="200" y1="8" x2="195" y2="48" stroke="#bae6fd" stroke-width="2" opacity=".6"/>
    <line x1="240" y1="15" x2="235" y2="55" stroke="#bae6fd" stroke-width="2" opacity=".6"/>
    <line x1="260" y1="30" x2="255" y2="70" stroke="#bae6fd" stroke-width="2" opacity=".5"/>
    <line x1="55" y1="50" x2="50" y2="90" stroke="#bae6fd" stroke-width="2" opacity=".5"/>
    <path d="M100 95 Q150 35 200 95 Z" fill="#e74c3c" stroke="#c0392b" stroke-width="2"/>
    <line x1="150" y1="95" x2="150" y2="155" stroke="#475569" stroke-width="3"/>
    <path d="M150 155 Q142 168 136 160" fill="none" stroke="#475569" stroke-width="3"/>
    <circle cx="150" cy="168" r="16" fill="#fcd34d" stroke="#f59e0b" stroke-width="2"/>
    <circle cx="144" cy="164" r="2.5" fill="#1e293b"/><circle cx="156" cy="164" r="2.5" fill="#1e293b"/>
    <path d="M145 173 Q150 178 155 173" fill="none" stroke="#1e293b" stroke-width="1.5"/>
    <line x1="150" y1="184" x2="150" y2="210" stroke="#3498db" stroke-width="4" stroke-linecap="round"/>
    <line x1="150" y1="195" x2="135" y2="205" stroke="#3498db" stroke-width="3" stroke-linecap="round"/>
    <line x1="150" y1="195" x2="165" y2="205" stroke="#3498db" stroke-width="3" stroke-linecap="round"/>
    <line x1="150" y1="95" x2="168" y2="78" stroke="#fcd34d" stroke-width="3" stroke-linecap="round"/>
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
    <text x="150" y="200" text-anchor="middle" font-size="13" font-weight="700" fill="#059669" font-family="sans-serif">\u00bfCu\u00e1l es el sombrero del se\u00f1or?</text>
  `),

  /* AC45: Ni\u00f1o mojado bajo la lluvia - sin paraguas */
  wet_rain: svg(`
    <rect x="0" y="0" width="300" height="220" rx="12" fill="#5b7d9a"/>
    <line x1="40" y1="10" x2="35" y2="55" stroke="#bae6fd" stroke-width="2" opacity=".7"/>
    <line x1="90" y1="15" x2="85" y2="60" stroke="#bae6fd" stroke-width="2" opacity=".7"/>
    <line x1="150" y1="5" x2="145" y2="50" stroke="#bae6fd" stroke-width="2" opacity=".7"/>
    <line x1="200" y1="12" x2="195" y2="57" stroke="#bae6fd" stroke-width="2" opacity=".7"/>
    <line x1="250" y1="20" x2="245" y2="65" stroke="#bae6fd" stroke-width="2" opacity=".7"/>
    <line x1="65" y1="40" x2="60" y2="85" stroke="#bae6fd" stroke-width="2" opacity=".5"/>
    <line x1="170" y1="35" x2="165" y2="80" stroke="#bae6fd" stroke-width="2" opacity=".5"/>
    <line x1="230" y1="45" x2="225" y2="90" stroke="#bae6fd" stroke-width="2" opacity=".5"/>
    <circle cx="150" cy="100" r="22" fill="#fcd34d" stroke="#f59e0b" stroke-width="2"/>
    <circle cx="142" cy="95" r="3" fill="#1e293b"/><circle cx="158" cy="95" r="3" fill="#1e293b"/>
    <path d="M143 108 Q150 114 157 108" fill="none" stroke="#1e293b" stroke-width="2"/>
    <line x1="150" y1="122" x2="150" y2="170" stroke="#60a5fa" stroke-width="5" stroke-linecap="round"/>
    <line x1="150" y1="140" x2="125" y2="155" stroke="#60a5fa" stroke-width="4" stroke-linecap="round"/>
    <line x1="150" y1="140" x2="175" y2="155" stroke="#60a5fa" stroke-width="4" stroke-linecap="round"/>
    <line x1="150" y1="170" x2="132" y2="200" stroke="#60a5fa" stroke-width="4" stroke-linecap="round"/>
    <line x1="150" y1="170" x2="168" y2="200" stroke="#60a5fa" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="130" cy="88" rx="8" ry="3" fill="#93c5fd" opacity=".6"/>
    <ellipse cx="170" cy="88" rx="8" ry="3" fill="#93c5fd" opacity=".6"/>
    <ellipse cx="140" cy="135" rx="5" ry="2" fill="#93c5fd" opacity=".5"/>
    <ellipse cx="160" cy="150" rx="5" ry="2" fill="#93c5fd" opacity=".5"/>
  `),

  /* EC11: 10 palabras reconocibles */
  words10: svg(`
    <text x="150" y="22" text-anchor="middle" font-size="13" font-weight="700" fill="#0d9488" font-family="sans-serif">Palabras esperables:</text>
    <rect x="15" y="35" width="80" height="30" rx="8" fill="#ecfdf5" stroke="#a7f3d0" stroke-width="1.5"/>
    <text x="55" y="55" text-anchor="middle" font-size="13" font-weight="600" fill="#065f46" font-family="sans-serif">Mam\u00e1</text>
    <rect x="110" y="35" width="80" height="30" rx="8" fill="#ecfdf5" stroke="#a7f3d0" stroke-width="1.5"/>
    <text x="150" y="55" text-anchor="middle" font-size="13" font-weight="600" fill="#065f46" font-family="sans-serif">Pap\u00e1</text>
    <rect x="205" y="35" width="80" height="30" rx="8" fill="#ecfdf5" stroke="#a7f3d0" stroke-width="1.5"/>
    <text x="245" y="55" text-anchor="middle" font-size="13" font-weight="600" fill="#065f46" font-family="sans-serif">Agua</text>
    <rect x="15" y="75" width="80" height="30" rx="8" fill="#ecfdf5" stroke="#a7f3d0" stroke-width="1.5"/>
    <text x="55" y="95" text-anchor="middle" font-size="13" font-weight="600" fill="#065f46" font-family="sans-serif">No</text>
    <rect x="110" y="75" width="80" height="30" rx="8" fill="#ecfdf5" stroke="#a7f3d0" stroke-width="1.5"/>
    <text x="150" y="95" text-anchor="middle" font-size="13" font-weight="600" fill="#065f46" font-family="sans-serif">M\u00e1s</text>
    <rect x="205" y="75" width="80" height="30" rx="8" fill="#ecfdf5" stroke="#a7f3d0" stroke-width="1.5"/>
    <text x="245" y="95" text-anchor="middle" font-size="13" font-weight="600" fill="#065f46" font-family="sans-serif">Leche</text>
    <rect x="15" y="115" width="80" height="30" rx="8" fill="#ecfdf5" stroke="#a7f3d0" stroke-width="1.5"/>
    <text x="55" y="135" text-anchor="middle" font-size="13" font-weight="600" fill="#065f46" font-family="sans-serif">Pan</text>
    <rect x="110" y="115" width="80" height="30" rx="8" fill="#ecfdf5" stroke="#a7f3d0" stroke-width="1.5"/>
    <text x="150" y="135" text-anchor="middle" font-size="13" font-weight="600" fill="#065f46" font-family="sans-serif">Nene/a</text>
    <rect x="205" y="115" width="80" height="30" rx="8" fill="#ecfdf5" stroke="#a7f3d0" stroke-width="1.5"/>
    <text x="245" y="135" text-anchor="middle" font-size="13" font-weight="600" fill="#065f46" font-family="sans-serif">S\u00ed</text>
    <rect x="110" y="155" width="80" height="30" rx="8" fill="#ecfdf5" stroke="#a7f3d0" stroke-width="1.5"/>
    <text x="150" y="175" text-anchor="middle" font-size="13" font-weight="600" fill="#065f46" font-family="sans-serif">Teta</text>
    <text x="150" y="208" text-anchor="middle" font-size="11" fill="#64748b" font-family="sans-serif">El ni\u00f1o/a debe usar al menos 10 palabras con intenci\u00f3n comunicativa</text>
  `),

  /* EC19: Ni\u00f1o comiendo y ni\u00f1o corriendo - SIN texto */
  eating_running: svg(`
    <rect x="10" y="10" width="130" height="190" rx="10" fill="#fff8f0" stroke="#fed7aa" stroke-width="2"/>
    <circle cx="75" cy="48" r="18" fill="#fcd34d" stroke="#f59e0b" stroke-width="2"/>
    <circle cx="69" cy="45" r="2.5" fill="#1e293b"/><circle cx="81" cy="45" r="2.5" fill="#1e293b"/>
    <ellipse cx="75" cy="54" rx="5" ry="3" fill="#e74c3c"/>
    <line x1="75" y1="66" x2="75" y2="115" stroke="#f97316" stroke-width="4" stroke-linecap="round"/>
    <line x1="75" y1="85" x2="55" y2="100" stroke="#f97316" stroke-width="3" stroke-linecap="round"/>
    <line x1="75" y1="85" x2="100" y2="80" stroke="#f97316" stroke-width="3" stroke-linecap="round"/>
    <line x1="75" y1="115" x2="60" y2="150" stroke="#f97316" stroke-width="3" stroke-linecap="round"/>
    <line x1="75" y1="115" x2="90" y2="150" stroke="#f97316" stroke-width="3" stroke-linecap="round"/>
    <rect x="92" y="74" width="18" height="4" rx="2" fill="#94a3b8"/>
    <circle cx="114" cy="76" r="6" fill="#fcd34d" stroke="#f59e0b" stroke-width="1"/>
    <rect x="160" y="10" width="130" height="190" rx="10" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="2"/>
    <circle cx="225" cy="48" r="18" fill="#fcd34d" stroke="#f59e0b" stroke-width="2"/>
    <circle cx="219" cy="45" r="2.5" fill="#1e293b"/><circle cx="231" cy="45" r="2.5" fill="#1e293b"/>
    <path d="M221 53 Q225 57 229 53" fill="none" stroke="#1e293b" stroke-width="1.5"/>
    <line x1="225" y1="66" x2="218" y2="100" stroke="#3498db" stroke-width="4" stroke-linecap="round"/>
    <line x1="218" y1="100" x2="200" y2="135" stroke="#3498db" stroke-width="3" stroke-linecap="round"/>
    <line x1="218" y1="100" x2="245" y2="130" stroke="#3498db" stroke-width="3" stroke-linecap="round"/>
    <line x1="220" y1="82" x2="248" y2="76" stroke="#3498db" stroke-width="3" stroke-linecap="round"/>
    <line x1="220" y1="82" x2="195" y2="90" stroke="#3498db" stroke-width="3" stroke-linecap="round"/>
    <line x1="188" y1="76" x2="200" y2="76" stroke="#94a3b8" stroke-width="2" opacity=".5"/>
    <line x1="185" y1="84" x2="198" y2="84" stroke="#94a3b8" stroke-width="2" opacity=".4"/>
  `),

  /* EC45: Ni\u00f1o cay\u00e9ndose en piso mojado */
  falling_wet: svg(`
    <rect x="0" y="170" width="300" height="50" fill="#bfdbfe" rx="0"/>
    <rect x="0" y="0" width="300" height="170" fill="#f8faf9" rx="12"/>
    <ellipse cx="170" cy="170" rx="60" ry="8" fill="#93c5fd" opacity=".6"/>
    <circle cx="155" cy="90" r="20" fill="#fcd34d" stroke="#f59e0b" stroke-width="2"/>
    <circle cx="148" cy="86" r="3" fill="#1e293b"/><circle cx="162" cy="86" r="3" fill="#1e293b"/>
    <path d="M150 97 Q155 93 160 97" fill="none" stroke="#1e293b" stroke-width="2"/>
    <line x1="155" y1="110" x2="145" y2="145" stroke="#f97316" stroke-width="4" stroke-linecap="round"/>
    <line x1="145" y1="145" x2="120" y2="165" stroke="#f97316" stroke-width="3" stroke-linecap="round"/>
    <line x1="145" y1="145" x2="165" y2="168" stroke="#f97316" stroke-width="3" stroke-linecap="round"/>
    <line x1="148" y1="125" x2="180" y2="112" stroke="#f97316" stroke-width="3" stroke-linecap="round"/>
    <line x1="148" y1="125" x2="120" y2="115" stroke="#f97316" stroke-width="3" stroke-linecap="round"/>
    <text x="110" y="82" font-size="16" fill="#fbbf24">\u2605</text>
    <text x="175" y="78" font-size="14" fill="#fbbf24">\u2605</text>
    <text x="130" y="72" font-size="12" fill="#fbbf24">\u2605</text>
    <text x="90" y="170" font-size="11" fill="#60a5fa" font-family="sans-serif">\u223c\u223c\u223c</text>
    <text x="140" y="170" font-size="11" fill="#60a5fa" font-family="sans-serif">\u223c\u223c\u223c</text>
    <text x="200" y="170" font-size="11" fill="#60a5fa" font-family="sans-serif">\u223c\u223c\u223c</text>
    <rect x="80" y="155" width="40" height="5" rx="2" fill="#fbbf24" opacity=".4"/>
    <text x="55" y="195" font-size="14" fill="#60a5fa" font-family="sans-serif">\u26a0 Piso mojado</text>
  `)
};
