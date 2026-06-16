import { useState, useEffect, useRef } from "react";
import "../styles/LandingPage.css";

// ---- Navegación a la app ----
function goToApp() {
  window.history.pushState({}, "", "/app");
  window.dispatchEvent(new PopStateEvent("popstate"));
}

// ---- Iconos (SVG, set consistente stroke 1.8) ----
function Icon({ d, size }) {
  return <svg width={size || 20} height={size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
}
var ic = {
  arrow: <Icon d={<><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>} />,
  check: <Icon d={<polyline points="20 6 9 17 4 12"/>} size={18} />,
  play: <Icon d={<><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></>} />,
  clock: <Icon d={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>} />,
  spark: <Icon d={<><path d="M12 3v3M12 18v3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M3 12h3M18 12h3M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></>} />,
  doc: <Icon d={<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>} />,
  users: <Icon d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></>} />,
  shield: <Icon d={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>} />,
  calendar: <Icon d={<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>} />,
  edit: <Icon d={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></>} />,
  download: <Icon d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>} />,
  menu: <Icon d={<><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>} />,
  layers: <Icon d={<><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>} />,
  coin: <Icon d={<><circle cx="12" cy="12" r="9"/><path d="M14.5 9.5a2.5 2.5 0 0 0-2.5-1.5c-1.4 0-2.5.9-2.5 2s1.1 2 2.5 2 2.5.9 2.5 2-1.1 2-2.5 2a2.5 2.5 0 0 1-2.5-1.5"/><line x1="12" y1="6" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="18"/></>} />,
  x: <Icon d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>} size={18} />
};

// ---- Las 7 herramientas de evaluación ----
var TOOLS = [
  { code: "OFA", name: "Examen Clínico OFA", short: "Órganos Fonoarticulatorios", desc: "Registro estructurado del examen de los órganos fonoarticulatorios: labios, lengua, paladar, mejillas y funciones de respiración, succión, masticación y deglución.", feats: ["Evaluación de estructuras y funciones orales", "Registro guiado campo por campo", "Informe clínico listo para entregar"] },
  { code: "FON", name: "Evaluación Fonética", short: "Producción de sonidos del habla", desc: "Análisis de la producción de cada fonema del español. Permite registrar omisiones, sustituciones y distorsiones, con audios de referencia integrados.", feats: ["Inventario fonético completo", "Audios de referencia para cada sonido", "Detección de procesos fonológicos"] },
  { code: "REP", name: "Repetición de Palabras", short: "Precisión articulatoria", desc: "Evaluación de la capacidad de repetir palabras de complejidad creciente, midiendo precisión articulatoria y memoria fonológica.", feats: ["Listas de palabras graduadas", "Registro de aciertos y errores", "Análisis por estructura silábica"] },
  { code: "PEFF", name: "Prueba de Eficiencia Fonológica", short: "Conciencia fonológica", desc: "Mide la eficiencia fonológica del paciente a través de tareas que exploran el manejo de los sonidos del lenguaje.", feats: ["Tareas de conciencia fonológica", "Puntaje automático por sección", "Comparación con esperado por edad"] },
  { code: "DISC", name: "Discriminación Fonológica", short: "Distinción de sonidos", desc: "Evalúa la capacidad de distinguir entre pares de sonidos similares, clave para diagnosticar dificultades de procesamiento auditivo y fonológico.", feats: ["Pares mínimos contrastados", "Registro de discriminación auditiva", "Identificación de pares problemáticos"] },
  { code: "RECO", name: "Reconocimiento Fonológico", short: "Identificación de fonemas", desc: "Mide el reconocimiento e identificación de fonemas dentro de palabras, fundamental para la lectoescritura y el desarrollo del lenguaje.", feats: ["Identificación de fonemas en contexto", "Tareas de posición y secuencia", "Base para intervención en lectoescritura"] },
  { code: "ELDI", name: "Evaluación del Lenguaje Infantil", short: "Desarrollo del lenguaje", desc: "Evaluación integral del desarrollo del lenguaje en la infancia, abarcando los niveles comprensivo y expresivo del lenguaje.", feats: ["Niveles comprensivo y expresivo", "Hitos del desarrollo por edad", "Visión integral del lenguaje infantil"] }
];

// ---- Onda fonética: alturas pseudo-aleatorias estables ----
var WAVE_HEIGHTS = [38, 62, 45, 78, 90, 70, 52, 84, 96, 66, 48, 72, 88, 58, 42, 76, 94, 64, 50, 80, 68, 44, 86, 60, 40, 74, 92, 56, 46, 82];

export default function LandingPage() {
  var _tool = useState(0), activeTool = _tool[0], setActiveTool = _tool[1];
  var _scrolled = useState(false), scrolled = _scrolled[0], setScrolled = _scrolled[1];

  useEffect(function() {
    var onScroll = function() { setScrolled(window.scrollY > 12); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return function() { window.removeEventListener("scroll", onScroll); };
  }, []);

  // Scroll suave a secciones
  var scrollTo = function(id) {
    var el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  var tool = TOOLS[activeTool];

  return (
    <div className="lp">
      {/* ===== NAV ===== */}
      <nav className={"lp-nav" + (scrolled ? " is-scrolled" : "")}>
        <div className="lp-container lp-nav-inner">
          <div className="lp-nav-brand">
            <img src="/img/logo_96.png" alt="Brújula KIT" />
            {"Brújula KIT"}
          </div>
          <div className="lp-nav-links">
            <button className="lp-nav-link" onClick={function(){ scrollTo("herramientas"); }}>Herramientas</button>
            <button className="lp-nav-link" onClick={function(){ scrollTo("como-funciona"); }}>Cómo funciona</button>
            <button className="lp-nav-link" onClick={function(){ scrollTo("precios"); }}>Créditos</button>
            <button className="lp-nav-cta" onClick={goToApp}>Ingresar</button>
          </div>
          <button className="lp-nav-menu-btn" onClick={goToApp} aria-label="Ingresar al sistema">{ic.menu}</button>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <header className="lp-hero">
        <div className="lp-container lp-hero-grid">
          <div className="lp-hero-text">
            <div className="lp-eyebrow"><span className="lp-eyebrow-dot" />Para profesionales de la fonoaudiología</div>
            <h1>El habla, evaluada con <em>claridad</em> de principio a fin.</h1>
            <p className="lp-hero-sub">
              Brújula KIT reúne siete evaluaciones fonoaudiológicas, informes redactados con inteligencia artificial y la gestión de tus pacientes en una sola plataforma web. Sin instalaciones, sin papeles.
            </p>
            <div className="lp-hero-actions">
              <button className="lp-btn-primary" onClick={goToApp}>Empezar con 5 créditos gratis {ic.arrow}</button>
              <button className="lp-btn-ghost" onClick={function(){ scrollTo("como-funciona"); }}>{ic.play} Ver cómo funciona</button>
            </div>
            <div className="lp-hero-trust">
              {ic.shield}
              Tus datos y los de tus pacientes, privados y solo tuyos.
            </div>
          </div>

          {/* Visual: tarjeta con onda fonética */}
          <div className="lp-hero-visual">
            <div className="lp-wave-card">
              <div className="lp-wave-card-head">
                <div className="lp-wave-card-title"><span />Evaluación fonética</div>
                <div className="lp-wave-card-tag">EN ANÁLISIS</div>
              </div>
              <div className="lp-wave" aria-hidden="true">
                {WAVE_HEIGHTS.map(function(h, i) {
                  return <div key={i} className="lp-wave-bar" style={{ height: h + "%", animationDelay: (i * 0.045) + "s" }} />;
                })}
              </div>
              <div className="lp-wave-caption">
                <div className="lp-wave-caption-big">/r/</div>
                <div className="lp-wave-caption-small">Sonido vibrante múltiple<br/>registrado y analizado</div>
              </div>
            </div>
            <div className="lp-float-card">
              <div className="lp-float-card-icon">{ic.doc}</div>
              <div className="lp-float-card-text">
                <strong>Informe generado</strong>
                <span>Listo en menos de un minuto</span>
              </div>
            </div>
          </div>
        </div>

        {/* Strip de stats */}
        <div className="lp-container">
          <div className="lp-strip">
            <div className="lp-strip-inner">
              <div className="lp-stat"><div className="lp-stat-num">7</div><div className="lp-stat-label">Evaluaciones clínicas</div></div>
              <div className="lp-stat"><div className="lp-stat-num">IA</div><div className="lp-stat-label">Redacta tus informes</div></div>
              <div className="lp-stat"><div className="lp-stat-num">100%</div><div className="lp-stat-label">Web, sin instalar nada</div></div>
              <div className="lp-stat"><div className="lp-stat-num">5</div><div className="lp-stat-label">Créditos de regalo</div></div>
            </div>
          </div>
        </div>
      </header>

      {/* ===== PROBLEMA → SOLUCIÓN ===== */}
      <section className="lp-section lp-problem">
        <div className="lp-container lp-problem-grid">
          <div className="lp-problem-text">
            <div className="lp-section-eyebrow">El antes y el después</div>
            <h2>Menos tiempo redactando. Más tiempo con tus pacientes.</h2>
            <p>Cada evaluación fonoaudiológica termina en lo mismo: horas frente a una hoja en blanco, ordenando resultados y redactando el informe a mano.</p>
            <p>Brújula KIT registra la evaluación de forma guiada y genera el informe por vos. Vos revisás, ajustás y entregás.</p>
          </div>
          <div className="lp-problem-compare">
            <div className="lp-compare-row is-bad">
              <div className="lp-compare-icon is-bad">{ic.clock}</div>
              <div><strong>Antes</strong><span>Planillas sueltas, informes redactados desde cero, horas de trabajo administrativo.</span></div>
            </div>
            <div className="lp-compare-row is-good">
              <div className="lp-compare-icon is-good">{ic.spark}</div>
              <div><strong>Con Brújula KIT</strong><span>Evaluación guiada, informe redactado por IA y todo tu historial en un solo lugar.</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HERRAMIENTAS (demo interactivo) ===== */}
      <section className="lp-section" id="herramientas">
        <div className="lp-container">
          <div className="lp-section-head">
            <div className="lp-section-eyebrow">Siete herramientas, un solo lugar</div>
            <h2>Las evaluaciones que ya usás, en formato digital</h2>
            <p className="lp-section-sub">Tocá cada evaluación para ver qué incluye. Todas generan su informe profesional listo para entregar.</p>
          </div>

          <div className="lp-tools-layout">
            <div className="lp-tools-list" role="tablist" aria-label="Evaluaciones disponibles">
              {TOOLS.map(function(t, i) {
                return <button
                  key={t.code}
                  role="tab"
                  aria-selected={activeTool === i}
                  className={"lp-tool-item" + (activeTool === i ? " is-active" : "")}
                  onClick={function(){ setActiveTool(i); }}
                  onMouseEnter={function(){ setActiveTool(i); }}
                >
                  <div className="lp-tool-code">{t.code}</div>
                  <div className="lp-tool-item-text">
                    <strong>{t.name}</strong>
                    <span>{t.short}</span>
                  </div>
                </button>;
              })}
            </div>

            <div className="lp-tool-detail" role="tabpanel">
              <div className="lp-tool-detail-bg" aria-hidden="true">{tool.code}</div>
              <div className="lp-tool-detail-inner" key={activeTool}>
                <div className="lp-tool-detail-tag">{tool.short}</div>
                <h3>{tool.name}</h3>
                <p>{tool.desc}</p>
                <div className="lp-tool-detail-feats">
                  {tool.feats.map(function(f, i) {
                    return <div key={i} className="lp-tool-feat">{ic.check} {f}</div>;
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CÓMO FUNCIONA ===== */}
      <section className="lp-section" id="como-funciona" style={{ background: "var(--lp-mist)" }}>
        <div className="lp-container">
          <div className="lp-section-head">
            <div className="lp-section-eyebrow">De la evaluación al informe</div>
            <h2>Tres pasos, sin vueltas</h2>
            <p className="lp-section-sub">Así es el camino desde que abrís una evaluación hasta que entregás el informe.</p>
          </div>
          <div className="lp-steps">
            <div className="lp-step">
              <div className="lp-step-num">Paso 1</div>
              <div className="lp-step-icon">{ic.edit}</div>
              <h3>Evaluás</h3>
              <p>Elegís la herramienta y completás la evaluación con formularios guiados, paso a paso, sin olvidarte de ningún dato.</p>
            </div>
            <div className="lp-step">
              <div className="lp-step-num">Paso 2</div>
              <div className="lp-step-icon">{ic.spark}</div>
              <h3>La IA redacta</h3>
              <p>Al terminar, el sistema genera un informe clínico profesional con los resultados. Lo revisás y ajustás a tu criterio.</p>
            </div>
            <div className="lp-step">
              <div className="lp-step-num">Paso 3</div>
              <div className="lp-step-icon">{ic.download}</div>
              <h3>Entregás</h3>
              <p>Exportás el informe en PDF, listo para compartir con la familia, la escuela o el equipo interdisciplinario.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== INFORME COMPLEMENTARIO ===== */}
      <section className="lp-section lp-feature">
        <div className="lp-container">
          <div className="lp-feature-card">
            <div className="lp-feature-text">
              <div className="lp-section-eyebrow">Informe complementario</div>
              <h2>Varias evaluaciones, un solo informe consolidado</h2>
              <p>Cuando un paciente tiene varias evaluaciones, Brújula KIT las integra en un único documento que cruza los resultados. Ideal para derivaciones, seguimientos y trabajo interdisciplinario.</p>
              <div className="lp-tool-detail-feats">
                <div className="lp-tool-feat">{ic.check} Integra todas las evaluaciones del paciente</div>
                <div className="lp-tool-feat">{ic.check} Visión completa para derivar o hacer seguimiento</div>
                <div className="lp-tool-feat">{ic.check} Un solo PDF, ordenado y profesional</div>
              </div>
            </div>
            <div className="lp-feature-visual">
              <div className="lp-merge" aria-hidden="true">
                <div className="lp-merge-sources">
                  <div className="lp-merge-chip"><span>OFA</span> Examen Clínico OFA</div>
                  <div className="lp-merge-chip"><span>FON</span> Evaluación Fonética</div>
                  <div className="lp-merge-chip"><span>PEFF</span> Eficiencia Fonológica</div>
                </div>
                <div className="lp-merge-arrow">{ic.layers}</div>
                <div className="lp-merge-result">
                  <div className="lp-merge-result-icon">{ic.doc}</div>
                  <div><strong>Informe complementario</strong><span>Consolidado en un documento</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== GESTIÓN (3 features extra) ===== */}
      <section className="lp-section">
        <div className="lp-container">
          <div className="lp-section-head">
            <div className="lp-section-eyebrow">Más que evaluaciones</div>
            <h2>Tu consultorio, ordenado</h2>
          </div>
          <div className="lp-steps">
            <div className="lp-step">
              <div className="lp-step-icon" style={{ background: "var(--lp-teal)" }}>{ic.users}</div>
              <h3>Pacientes</h3>
              <p>Datos clínicos, responsables e historial de evaluaciones de cada paciente, siempre a mano.</p>
            </div>
            <div className="lp-step">
              <div className="lp-step-icon" style={{ background: "var(--lp-teal)" }}>{ic.calendar}</div>
              <h3>Calendario</h3>
              <p>Agendá turnos y enviá recordatorios automáticos por email a responsables o pacientes.</p>
            </div>
            <div className="lp-step">
              <div className="lp-step-icon" style={{ background: "var(--lp-teal)" }}>{ic.shield}</div>
              <h3>Privacidad</h3>
              <p>Cada profesional tiene su espacio privado. La información clínica no se comparte entre usuarios.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRECIOS / CRÉDITOS ===== */}
      <section className="lp-section" id="precios" style={{ background: "var(--lp-mist)" }}>
        <div className="lp-container">
          <div className="lp-section-head">
            <div className="lp-section-eyebrow">Sin suscripciones</div>
            <h2>Pagás solo lo que usás</h2>
            <p className="lp-section-sub">Brújula KIT funciona con créditos prepagos. Sin cuotas mensuales ni contratos: cada profesional usa los créditos que necesita.</p>
          </div>
          <div className="lp-pricing-card">
            <div className="lp-pricing-badge">Empezá gratis</div>
            <h3>5 créditos de bienvenida</h3>
            <div className="lp-pricing-eq">{ic.coin} 1 crédito = 1 evaluación</div>
            <ul className="lp-pricing-list">
              <li>{ic.check} Realizá evaluaciones reales sin pagar nada</li>
              <li>{ic.check} Conocé el sistema completo antes de comprar</li>
              <li>{ic.check} Los créditos no vencen</li>
              <li>{ic.check} Comprás más cuando los necesites, con MercadoPago</li>
            </ul>
            <button className="lp-btn-primary" onClick={goToApp} style={{ width: "100%", justifyContent: "center" }}>Crear mi cuenta gratis {ic.arrow}</button>
            <p className="lp-pricing-note">No se requiere tarjeta para empezar.</p>
          </div>
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
      <section className="lp-section lp-cta">
        <div className="lp-cta-wave" aria-hidden="true">
          {WAVE_HEIGHTS.concat(WAVE_HEIGHTS.slice(0, 10)).map(function(h, i) {
            return <span key={i} style={{ height: (h * 0.9) + "%" }} />;
          })}
        </div>
        <div className="lp-container">
          <div className="lp-cta-inner">
            <h2>Probá Brújula KIT con tu próxima evaluación</h2>
            <p>Creá tu cuenta, recibí 5 créditos de regalo y generá tu primer informe hoy mismo.</p>
            <button className="lp-btn-amber" onClick={goToApp}>Empezar gratis {ic.arrow}</button>
            <div className="lp-cta-sub">Sin tarjeta · Sin instalación · En español</div>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-top">
            <div className="lp-footer-brand">
              <div className="lp-footer-brand-logo">
                <img src="/img/logo_96.png" alt="Brújula KIT" />
                {"Brújula KIT"}
              </div>
              <p>Sistema integral de evaluación fonoaudiológica para profesionales de la salud.</p>
            </div>
            <div className="lp-footer-links">
              <div className="lp-footer-col">
                <h4>Producto</h4>
                <button onClick={function(){ scrollTo("herramientas"); }}>Herramientas</button>
                <button onClick={function(){ scrollTo("como-funciona"); }}>Cómo funciona</button>
                <button onClick={function(){ scrollTo("precios"); }}>Créditos</button>
                <button onClick={goToApp}>Ingresar</button>
              </div>
              <div className="lp-footer-col">
                <h4>Legal</h4>
                <a href="/politicas.html" target="_blank" rel="noopener noreferrer">Términos y Condiciones</a>
                <a href="/politicas.html#privacidad" target="_blank" rel="noopener noreferrer">Política de Privacidad</a>
              </div>
              <div className="lp-footer-col">
                <h4>Contacto</h4>
                <a href="mailto:brujulakit@gmail.com">brujulakit@gmail.com</a>
              </div>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <div>© 2026 Brújula KIT. Todos los derechos reservados.</div>
            <div>Hecho en Argentina</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
