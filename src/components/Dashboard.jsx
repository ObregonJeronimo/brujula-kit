import { useState, useEffect, useCallback } from "react";
import { K } from "../lib/fb.js";
import { db, collection, getDocs, query, where, doc, updateDoc } from "../firebase.js";
import { typeLabel, isVisibleType } from "../config/evalTypes.js";
import "../styles/Dashboard.css";

var MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
var DIAS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
var pad = function(n){ return String(n).padStart(2,"0"); };
var dateKey = function(y,m,d){ return y+"-"+pad(m+1)+"-"+pad(d); };

var COLOR_MAP = { red:"#dc2626", blue:"#2563eb", green:"#059669", yellow:"#d97706", violet:"#7c3aed" };
function getHex(id){ return COLOR_MAP[id] || "#2563eb"; }

function countThisMonth(arr){
  var now = new Date();
  var prefix = now.getFullYear() + "-" + pad(now.getMonth() + 1);
  var count = 0;
  for(var i = 0; i < arr.length; i++){
    if((arr[i].fechaGuardado || "").substring(0, 7) === prefix) count++;
  }
  return count;
}

var TOOL_MAP = {
  newPEFF: { icon: "\ud83d\udd0a", name: "PEFF", color: "#7c3aed" },
  newOFA: { icon: "\ud83e\uddb7", name: "Examen EOF", color: "#0891b2" },
  newFON: { icon: "\ud83d\udde3\ufe0f", name: "Eval. Fon\u00e9tica", color: "#6d28d9" },
  newREP: { icon: "\ud83d\udcdd", name: "Rep. Palabras", color: "#2563eb" },
  newDISC: { icon: "\ud83d\udc42", name: "Disc. Fonol.", color: "#d97706" },
  newRECO: { icon: "\ud83c\udfaf", name: "Reco. Fonol.", color: "#9333ea" },
  newELDI: { icon: "\ud83e\uddd2", name: "ELDI", color: "#0d9488" }
};
var TOOL_IDS = ["newOFA","newFON","newREP","newDISC","newRECO"];

function loadShortcuts(uid){
  try { var raw = window.localStorage.getItem("bk_shortcuts_"+uid); if(raw){ var parsed = JSON.parse(raw); if(Array.isArray(parsed)) return parsed.slice(0,4); } } catch(e){}
  return [];
}
function saveShortcuts(uid, arr){ try { window.localStorage.setItem("bk_shortcuts_"+uid, JSON.stringify(arr.slice(0,4))); } catch(e){} }

function computeAlerts(citasArr, todayDate, reminderDays){
  var todayMs = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate()).getTime();
  var rangeMs = reminderDays * 24 * 60 * 60 * 1000;
  var results = [];
  for(var i = 0; i < citasArr.length; i++){
    var c = citasArr[i]; var est = (c.estado || "").toLowerCase();
    if(est === "cancelada" || est === "realizada") continue;
    var parts = (c.fecha || "").split("-"); if(parts.length < 3) continue;
    var citaMs = new Date(parseInt(parts[0],10), parseInt(parts[1],10)-1, parseInt(parts[2],10)).getTime();
    var diff = citaMs - todayMs;
    if(diff >= 0 && diff <= rangeMs) results.push({ cita: c, dias: Math.round(diff / (24*60*60*1000)) });
  }
  results.sort(function(a,b){ return a.dias - b.dias; });
  return results;
}

export default function Dashboard({ TC, allEvals, onT, onView, ld, profile, isAdmin, userId, nfy, onCalendar, onStartEval, onBuyCredits, userSettings }) {
  var visibleEvals = (allEvals || []).filter(function(e){ return isVisibleType(e.tipo); });
  visibleEvals.sort(function(a,b){ return (b.fechaGuardado || "").localeCompare(a.fechaGuardado || ""); });
  var rc = visibleEvals.slice(0, 5);
  var evalsThisMonth = countThisMonth(visibleEvals);
  var allPatients = {};
  visibleEvals.forEach(function(ev){ var name = (ev.paciente || "").trim(); if(name) allPatients[name.toLowerCase()] = true; });
  var uniquePatients = Object.keys(allPatients).length;
  var credits = isAdmin ? 999 : ((profile && profile.creditos) ? profile.creditos : 0);
  var cards = [
    { ic: "📋", label: "Evaluaciones", sublabel: "este mes", value: evalsThisMonth },
    { ic: "👦👧", label: "Pacientes evaluados", value: uniquePatients },
    { ic: "🌸", label: "Créditos", value: isAdmin ? "∞" : credits }
  ];

  var _sc = useState(function(){ return userId ? loadShortcuts(userId) : []; });
  var shortcuts = _sc[0], setShortcuts = _sc[1];
  var _showAdd = useState(false), showAddSC = _showAdd[0], setShowAddSC = _showAdd[1];
  var addShortcut = function(toolId){ if(shortcuts.indexOf(toolId) !== -1) return; var next = shortcuts.concat([toolId]).slice(0,4); setShortcuts(next); if(userId) saveShortcuts(userId, next); setShowAddSC(false); };
  var removeShortcut = function(toolId){ var next = shortcuts.filter(function(s){ return s !== toolId; }); setShortcuts(next); if(userId) saveShortcuts(userId, next); };
  var availableToAdd = TOOL_IDS.filter(function(id){ return shortcuts.indexOf(id) === -1; });

  var _showAlerts = useState(false), showAlerts = _showAlerts[0], setShowAlerts = _showAlerts[1];
  var _isMob = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && window.innerWidth < 900;
  // Dismiss persistente: una vez cerradas las alertas, no se muestran más
  var _alertsDismissed = useState(function(){ try { return localStorage.getItem("bk_alerts_dismissed_"+userId) === "1"; } catch(e){ return false; } });
  var alertsDismissed = _alertsDismissed[0], setAlertsDismissed = _alertsDismissed[1];
  var dismissAlerts = function(){ setShowAlerts(false); setAlertsDismissed(true); try { localStorage.setItem("bk_alerts_dismissed_"+userId, "1"); } catch(e){} };
  // Welcome modal - first time user (Firestore + localStorage backup)
  var _welcomeDismissed = (profile && profile.welcomeShown) || (function(){ try { return localStorage.getItem("bk_welcome_"+userId)==="1"; } catch(e){ return false; } })();
  var _showWelcome = useState(!_welcomeDismissed);
  var showWelcome = _showWelcome[0], setShowWelcome = _showWelcome[1];
  var dismissWelcome = function(){ setShowWelcome(false); try { localStorage.setItem("bk_welcome_"+userId,"1"); } catch(e){} if(userId){ updateDoc(doc(db,"usuarios",userId),{welcomeShown:true}).catch(function(){}); } };
  var now = new Date();
  var _ms = useState(now.getMonth()), calMonth = _ms[0], setCalMonth = _ms[1];
  var _ys = useState(now.getFullYear()), calYear = _ys[0], setCalYear = _ys[1];
  var _cs = useState([]), citas = _cs[0], setCitas = _cs[1];
  var _ls = useState(false), citasLoading = _ls[0], setCitasLoading = _ls[1];
  var _citasReady = useState(false), citasReady = _citasReady[0], setCitasReady = _citasReady[1];

  var loadCitas = useCallback(function(){
    if(!userId) return; setCitasLoading(true); setCitasReady(false);
    var q2 = query(collection(db,"citas"), where("userId","==",userId));
    getDocs(q2).then(function(snap){ setCitas(snap.docs.map(function(d){ return Object.assign({_fbId:d.id},d.data()); })); setCitasLoading(false); setCitasReady(true); }).catch(function(e){ console.error(e); setCitasLoading(false); setCitasReady(true); });
  },[userId]);
  useEffect(function(){ loadCitas(); },[loadCitas]);

  // Use settings for reminder days (default 3) and whether reminders are enabled (default true)
  var citaReminderEnabled = !userSettings || userSettings.citaReminder !== false;
  var reminderDays = (userSettings && userSettings.reminderDays) ? userSettings.reminderDays : 3;
  var upcomingAlerts = (citasReady && citaReminderEnabled) ? computeAlerts(citas, now, reminderDays) : [];
  var lowCredits = !isAdmin && credits <= 5 && credits > 0;
  var alertCount = upcomingAlerts.length + (lowCredits ? 1 : 0);

  var prevMonth = function(){ if(calMonth===0){ setCalMonth(11); setCalYear(function(y){return y-1;}); } else setCalMonth(function(m){return m-1;}); };
  var nextMonth = function(){ if(calMonth===11){ setCalMonth(0); setCalYear(function(y){return y+1;}); } else setCalMonth(function(m){return m+1;}); };
  var firstDay = new Date(calYear, calMonth, 1).getDay();
  var offset = firstDay===0 ? 6 : firstDay-1;
  var daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
  var isToday = function(d){ return now.getFullYear()===calYear && now.getMonth()===calMonth && now.getDate()===d; };
  var getCitasForDay = function(d){ var key = dateKey(calYear, calMonth, d); return citas.filter(function(c){ return c.fecha===key; }); };
  var todayStr = dateKey(now.getFullYear(), now.getMonth(), now.getDate());
  var upcoming = citas.filter(function(c){ return c.fecha >= todayStr && c.estado !== "cancelada"; }).sort(function(a,b){ return (a.fecha+(a.hora||"")).localeCompare(b.fecha+(b.hora||"")); }).slice(0, 3);

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div>
          <h1 className="dash-title"><img src="/img/logo_96.png" alt="logo" /> Panel Principal</h1>
          <p className="dash-greeting">Bienvenido/a, {profile && profile.nombre ? profile.nombre : (profile && profile.username ? profile.username : "")}{ld ? " — cargando..." : ""}</p>
        </div>
        {!alertsDismissed && alertCount > 0 && <button onClick={function(){ setShowAlerts(!showAlerts); }} className="dash-alerts-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          {"Alertas y recordatorios"}
          <span className="dash-alerts-badge">{alertCount}</span>
        </button>}
      </div>

      {showAlerts && <div className="dash-alerts-panel">
        <div className="dash-alerts-header">
          <h3 className="dash-alerts-title">Alertas y recordatorios</h3>
          <button onClick={dismissAlerts} className="dash-alerts-close">{"\u00d7"}</button>
        </div>
        {alertCount === 0 && <p className="dash-alert-empty">No hay alertas activas.</p>}
        {upcomingAlerts.map(function(a, idx){
          var diasTxt = a.dias === 0 ? "Hoy" : a.dias === 1 ? "Mañana" : "En " + a.dias + " días";
          return <div key={idx} className="dash-alert-item">
            <span className="dash-alert-icon">📅</span>
            <div>
              <div className="dash-alert-title">{"RECORDATORIO: " + diasTxt + " tiene evaluación con " + (a.cita.paciente || "paciente") + "."}</div>
              <div className="dash-alert-meta">{(a.cita.tipo || "") + " · " + (a.cita.hora ? a.cita.hora.substring(0,5) : "") + " · " + a.cita.fecha}</div>
            </div>
          </div>;
        })}
        {lowCredits && <div onClick={function(){ if(onBuyCredits) onBuyCredits(); }} className="dash-alert-item dash-alert-item--danger">
          <span className="dash-alert-icon">⚠️</span>
          <div>
            <div className="dash-alert-title dash-alert-title--danger">{"Quedan " + credits + " créditos. ¿Adquirir más?"}</div>
            <div className="dash-alert-meta dash-alert-meta--danger">Clic para comprar.</div>
          </div>
        </div>}
      </div>}

      <div className="dash-stats">
        <div className={"dash-stats-grid"+(_isMob?" dash-stats-grid--mobile":"")}>
          {cards.map(function(c,i){ return <div key={i} className="dash-stat-card"><div className="dash-stat-icon">{c.ic}</div><div><div className="dash-stat-value">{c.value}</div><div className="dash-stat-label">{c.label}</div>{c.sublabel && <div className="dash-stat-sublabel">{c.sublabel}</div>}</div></div>; })}
        </div>
      </div>

      {/* Welcome modal - first login */}
      {showWelcome && <div className="modal-overlay">
        <div className="dash-welcome">
          <div className="dash-welcome-icon">{"\ud83c\udf89"}</div>
          <div className="dash-welcome-title">{"\u00a1Bienvenido/a a Br\u00fajula KIT!"}</div>
          <div className="dash-welcome-desc">{"Te regalamos "}<b style={{color:"var(--c-success)"}}>{"5 cr\u00e9ditos gratis"}</b>{" para que puedas probar todas las evaluaciones disponibles."}</div>
          <div className="dash-welcome-credits">
            <div className="dash-welcome-credits-big">{"5"}</div>
            <div className="dash-welcome-credits-label">{"cr\u00e9ditos disponibles"}</div>
          </div>
          <div className="dash-welcome-note">{"Cada cr\u00e9dito = 1 evaluaci\u00f3n completa con informe profesional."}</div>
          <button onClick={dismissWelcome} className="dash-welcome-btn">{"\u00a1Comenzar!"}</button>
        </div>
      </div>}

      {/* Mobile: aviso de usar PC */}
      {_isMob && <div className="dash-mobile-banner">
        <div className="dash-mobile-icon">{"\ud83d\udcbb"}</div>
        <div className="dash-mobile-title">{"Modo consulta"}</div>
        <div className="dash-mobile-desc">{"Pod\u00e9s ver el historial, pacientes y calendario desde el celular."}</div>
        <div className="dash-mobile-note">{"Para realizar evaluaciones, inici\u00e1 sesi\u00f3n desde una PC o notebook."}</div>
      </div>}

      {!_isMob && <div className="dash-grid-2">
        <button onClick={onT} className="dash-tools-btn">
          <div className="dash-tools-icon">{"\ud83e\uddf0"}</div>
          <div><div className="dash-tools-title">Herramientas</div><div className="dash-tools-subtitle">{"Nueva evaluaci\u00f3n"}</div></div>
        </button>
        <div className="dash-shortcuts">
          <div className="dash-shortcuts-header">
            <h3 className="dash-shortcuts-title">{"Acceso r\u00e1pido"}</h3>
            {shortcuts.length > 0 && shortcuts.length < 4 && availableToAdd.length > 0 && <button onClick={function(){ setShowAddSC(!showAddSC); }} className="dash-shortcuts-add-btn">{showAddSC ? "Cancelar" : "+ Agregar"}</button>}
          </div>
          {shortcuts.length === 0 && !showAddSC && <div className="dash-shortcuts-empty">
            <button onClick={function(){ setShowAddSC(true); }} className="dash-shortcuts-empty-btn">{"+ Agregar acceso r\u00e1pido"}</button>
            <p className="dash-shortcuts-empty-hint">{"Pod\u00e9s agregar hasta 4 evaluaciones"}</p>
          </div>}
          {shortcuts.length > 0 && <div className={"dash-shortcuts-grid"+(shortcuts.length > 2 ? " dash-shortcuts-grid--2":"")}>
            {shortcuts.map(function(scId){ var tool = TOOL_MAP[scId]; if(!tool) return null; return <div key={scId} className="dash-shortcut-item" onClick={function(){ if(onStartEval) onStartEval(scId); }}><span className="dash-shortcut-icon">{tool.icon}</span><span className="dash-shortcut-name">{tool.name}</span><button onClick={function(ev){ ev.stopPropagation(); removeShortcut(scId); }} className="dash-shortcut-remove">{"\u00d7"}</button></div>; })}
          </div>}
          {showAddSC && <div className="dash-shortcuts-picker">
            <div className="dash-shortcuts-picker-title">{"Seleccionar evaluaci\u00f3n:"}</div>
            <div className="dash-shortcuts-picker-list">{availableToAdd.map(function(toolId){ var tool = TOOL_MAP[toolId]; if(!tool) return null; return <button key={toolId} onClick={function(){ addShortcut(toolId); }} className="dash-shortcut-pick-btn"><span className="dash-shortcut-icon" style={{fontSize:16}}>{tool.icon}</span>{tool.name}</button>; })}</div>
          </div>}
        </div>
      </div>}

      <div className="dash-recent">
        <h3 className="dash-recent-title">Recientes</h3>
        {rc.length===0 ? <p className="dash-recent-empty">Sin evaluaciones aún.</p> : rc.map(function(ev){
          return <div key={ev._fbId||ev.id} onClick={function(){if(onView)onView(ev)}} className="dash-recent-row">
            <div><div className="dash-recent-name">{ev.paciente}</div><div className="dash-recent-meta">{typeLabel(ev.tipo)} · {new Date(ev.fechaGuardado).toLocaleDateString("es-CL")}</div></div>
            <span className="dash-recent-arrow">→</span>
          </div>;
        })}
      </div>

      {/* Consolidated report tip */}
      {uniquePatients > 0 && visibleEvals.length >= 2 && <div className="dash-consol-tip">
        <span className="dash-consol-icon">{"📋"}</span>
        <div style={{flex:1}}>
          <div className="dash-consol-title">{"Informe Complementario disponible"}</div>
          <div className="dash-consol-desc">{_isMob ? "Pod\u00e9s generar un informe que integre varias evaluaciones de un mismo paciente. Ingres\u00e1 en modo escritorio para acceder." : "Pod\u00e9s generar un informe que integre varias evaluaciones de un mismo paciente. Encontralo en Herramientas."}</div>
        </div>
        {!_isMob && <button onClick={onT} className="dash-consol-btn">{"Ir"}</button>}
      </div>}

      <div className="dash-agenda">
        <div className="dash-agenda-header">
          <h3 className="dash-agenda-title">📅 Agenda</h3>
          {onCalendar && <button onClick={onCalendar} className="dash-agenda-link">Ver completa →</button>}
        </div>
        <div className="dash-cal-nav">
          <button onClick={prevMonth} className="dash-cal-arrow">←</button>
          <div className="dash-cal-month">{MESES[calMonth]+" "+calYear}</div>
          <button onClick={nextMonth} className="dash-cal-arrow">→</button>
        </div>
        <div className="dash-cal-grid">
          {DIAS.map(function(d){ return <div key={d} className="dash-cal-day-label">{d}</div>; })}
          {Array.from({length:offset}).map(function(_,i){ return <div key={"e"+i} className="dash-cal-empty" />; })}
          {Array.from({length:daysInMonth}).map(function(_,i){
            var d = i+1; var dc = getCitasForDay(d); var isT = isToday(d);
            return <div key={d} onClick={function(){ if(onCalendar) onCalendar(); }} className={"dash-cal-day"+(isT?" dash-cal-day--today":"")} style={{cursor:onCalendar?"pointer":"default"}}>
              <div className="dash-cal-day-num">{d}</div>
              {dc.length>0 && <div className="dash-cal-dots">{dc.slice(0,3).map(function(c,ci){ return <div key={ci} className="dash-cal-dot" style={{background:getHex(c.color)}} />; })}</div>}
            </div>;
          })}
        </div>
        {upcoming.length>0 && <div>
          <div className="dash-upcoming-title">Próximas citas</div>
          {upcoming.map(function(c){
            var parts = (c.fecha||"").split("-"); var dayNum = parts[2] ? parseInt(parts[2],10) : ""; var monthNum = parts[1] ? parseInt(parts[1],10)-1 : 0;
            return <div key={c._fbId} onClick={function(){ if(onCalendar) onCalendar(); }} className="dash-upcoming-item" style={{cursor:onCalendar?"pointer":"default",borderLeft:"3px solid "+getHex(c.color)}}>
              <div className="dash-upcoming-date"><div className="dash-upcoming-day">{dayNum}</div><div className="dash-upcoming-mon">{MESES[monthNum] ? MESES[monthNum].substring(0,3) : ""}</div></div>
              <div className="dash-upcoming-info"><div className="dash-upcoming-name">{c.paciente}</div><div className="dash-upcoming-meta">{c.hora ? c.hora.substring(0,5) : ""}{c.tipo ? " · "+c.tipo : ""}</div></div>
              <span className="dash-upcoming-badge" style={{background:getHex(c.color)+"22",color:getHex(c.color)}}>{c.estado||"pendiente"}</span>
            </div>;
          })}
        </div>}
        {upcoming.length===0 && !citasLoading && <div className="dash-upcoming-empty">No hay citas próximas</div>}
        {citasLoading && <div className="dash-upcoming-empty" style={{fontStyle:"normal"}}>Cargando agenda...</div>}
      </div>
    </div>
  );
}
