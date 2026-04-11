import { useState, useEffect, useCallback } from "react";
import { K } from "../lib/fb.js";
import { db, collection, getDocs, query, where, doc, updateDoc } from "../firebase.js";
import { typeLabel, isVisibleType } from "../config/evalTypes.js";

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
  newELDI: { icon: "\ud83e\uddd2", name: "ELDI", color: (TC&&TC.ac||"#0d9488") }
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
    <div style={{animation:"fi .3s ease",width:"100%"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6,flexWrap:"wrap",gap:10}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:700,marginBottom:6,display:"flex",alignItems:"center",gap:8}}><img src="/img/logo_96.png" style={{width:28,height:28}} alt="logo" /> Panel Principal</h1>
          <p style={{color:K.mt,fontSize:14,marginBottom:0}}>Bienvenido/a, {profile && profile.nombre ? profile.nombre : (profile && profile.username ? profile.username : "")}{ld ? " — cargando..." : ""}</p>
        </div>
        {!alertsDismissed && alertCount > 0 && <button onClick={function(){ setShowAlerts(!showAlerts); }} style={{display:"flex",alignItems:"center",gap:8,background:"#fff7ed",border:"1px solid #fed7aa",borderRadius:10,padding:"10px 16px",cursor:"pointer",fontSize:13,fontWeight:600,color:"#c2410c"}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          {"Alertas y recordatorios"}
          <span style={{background:"#dc2626",color:"#fff",fontSize:11,fontWeight:800,minWidth:20,height:20,borderRadius:"50%",display:"inline-flex",alignItems:"center",justifyContent:"center"}}>{alertCount}</span>
        </button>}
      </div>

      {showAlerts && <div style={{background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:20,marginBottom:20,animation:"fi .2s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h3 style={{fontSize:15,fontWeight:700,color:(TC&&TC.sd||"#0a3d2f"),margin:0}}>Alertas y recordatorios</h3>
          <button onClick={dismissAlerts} style={{background:"none",border:"none",fontSize:18,color:"#94a3b8",cursor:"pointer"}}>{"\u00d7"}</button>
        </div>
        {alertCount === 0 && <p style={{color:"#94a3b8",fontSize:13,fontStyle:"italic",margin:0}}>No hay alertas activas.</p>}
        {upcomingAlerts.map(function(a, idx){
          var diasTxt = a.dias === 0 ? "Hoy" : a.dias === 1 ? "Mañana" : "En " + a.dias + " días";
          return <div key={idx} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"12px 14px",background:"#fffbeb",borderRadius:8,border:"1px solid #fef3c7",marginBottom:8}}>
            <span style={{fontSize:18,flexShrink:0}}>📅</span>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:"#92400e"}}>{"RECORDATORIO: " + diasTxt + " tiene evaluación con " + (a.cita.paciente || "paciente") + "."}</div>
              <div style={{fontSize:11,color:"#a16207",marginTop:2}}>{(a.cita.tipo || "") + " · " + (a.cita.hora ? a.cita.hora.substring(0,5) : "") + " · " + a.cita.fecha}</div>
            </div>
          </div>;
        })}
        {lowCredits && <div onClick={function(){ if(onBuyCredits) onBuyCredits(); }} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"12px 14px",background:"#fef2f2",borderRadius:8,border:"1px solid #fecaca",cursor:"pointer"}}>
          <span style={{fontSize:18,flexShrink:0}}>⚠️</span>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:"#dc2626"}}>{"Quedan " + credits + " créditos. ¿Adquirir más?"}</div>
            <div style={{fontSize:11,color:"#b91c1c",marginTop:2}}>Clic para comprar.</div>
          </div>
        </div>}
      </div>}

      <div style={{marginBottom:28}}>
        <div style={{display:"grid",gridTemplateColumns:_isMob?"1fr":"repeat(auto-fit,minmax(160px,1fr))",gap:16}}>
          {cards.map(function(c,i){ return <div key={i} style={{background:"#fff",borderRadius:12,padding:"14px 18px",border:"1px solid #e2e8f0",display:"flex",alignItems:"center",gap:14}}><div style={{fontSize:24}}>{c.ic}</div><div><div style={{fontSize:22,fontWeight:700,lineHeight:1}}>{c.value}</div><div style={{fontSize:12,color:K.mt,marginTop:2}}>{c.label}</div>{c.sublabel && <div style={{fontSize:10,color:"#94a3b8"}}>{c.sublabel}</div>}</div></div>; })}
        </div>
      </div>

      {/* Welcome modal - first login */}
      {showWelcome && <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.5)",backdropFilter:"blur(4px)",padding:20}}>
        <div style={{background:"#fff",borderRadius:20,padding:"36px 28px",width:400,maxWidth:"90vw",boxShadow:"0 20px 60px rgba(0,0,0,.25)",textAlign:"center"}}>
          <div style={{fontSize:48,marginBottom:12}}>{"\ud83c\udf89"}</div>
          <div style={{fontSize:20,fontWeight:700,color:(TC&&TC.sd||"#0a3d2f"),marginBottom:8}}>{"\u00a1Bienvenido/a a Br\u00fajula KIT!"}</div>
          <div style={{fontSize:14,color:"#475569",lineHeight:1.7,marginBottom:16}}>{"Te regalamos "}<b style={{color:"#059669"}}>{"5 cr\u00e9ditos gratis"}</b>{" para que puedas probar todas las evaluaciones disponibles."}</div>
          <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:12,padding:"14px 18px",marginBottom:20}}>
            <div style={{fontSize:28,fontWeight:800,color:"#059669"}}>{"5"}</div>
            <div style={{fontSize:12,color:"#065f46",fontWeight:600}}>{"cr\u00e9ditos disponibles"}</div>
          </div>
          <div style={{fontSize:12,color:"#94a3b8",marginBottom:16}}>{"Cada cr\u00e9dito = 1 evaluaci\u00f3n completa con informe profesional."}</div>
          <button onClick={dismissWelcome} style={{width:"100%",padding:"14px",background:"linear-gradient(135deg,"+(TC&&TC.ac||"#0d9488")+","+(TC&&TC.sd||"#0a3d2f")+")",color:"#fff",border:"none",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer"}}>{"\u00a1Comenzar!"}</button>
        </div>
      </div>}

      {/* Mobile: aviso de usar PC */}
      {_isMob && <div style={{background:"linear-gradient(135deg,#1e3a5f,#2563eb)",borderRadius:16,padding:"24px 20px",marginBottom:20,color:"#fff",textAlign:"center",boxShadow:"0 4px 16px rgba(37,99,235,.3)"}}>
        <div style={{fontSize:40,marginBottom:10}}>{"\ud83d\udcbb"}</div>
        <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>{"Modo consulta"}</div>
        <div style={{fontSize:13,opacity:.9,lineHeight:1.6}}>{"Pod\u00e9s ver el historial, pacientes y calendario desde el celular."}</div>
        <div style={{marginTop:12,padding:"10px 16px",background:"rgba(255,255,255,.15)",borderRadius:10,fontSize:12,fontWeight:600}}>{"Para realizar evaluaciones, inici\u00e1 sesi\u00f3n desde una PC o notebook."}</div>
      </div>}

      {!_isMob && <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:28}}>
        <button onClick={onT} style={{background:"linear-gradient(135deg,"+(TC&&TC.sd||"#0a3d2f")+","+(TC&&TC.ac||"#0d9488")+")",color:"#fff",border:"none",borderRadius:14,padding:"28px 24px",cursor:"pointer",display:"flex",alignItems:"center",gap:16,textAlign:"left"}}>
          <div style={{width:52,height:52,borderRadius:12,background:"rgba(255,255,255,.14)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{"\ud83e\uddf0"}</div>
          <div><div style={{fontSize:18,fontWeight:700}}>Herramientas</div><div style={{fontSize:13,opacity:.8,marginTop:4}}>{"Nueva evaluaci\u00f3n"}</div></div>
        </button>
        <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <h3 style={{fontSize:14,fontWeight:700,color:(TC&&TC.sd||"#0a3d2f"),margin:0}}>{"Acceso r\u00e1pido"}</h3>
            {shortcuts.length > 0 && shortcuts.length < 4 && availableToAdd.length > 0 && <button onClick={function(){ setShowAddSC(!showAddSC); }} style={{background:"none",border:"1px solid #e2e8f0",borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer",color:(TC&&TC.ac||"#0d9488")}}>{showAddSC ? "Cancelar" : "+ Agregar"}</button>}
          </div>
          {shortcuts.length === 0 && !showAddSC && <div style={{textAlign:"center",padding:"14px 0"}}>
            <button onClick={function(){ setShowAddSC(true); }} style={{background:"#f0fdfa",border:"1px dashed #99f6e4",borderRadius:10,padding:"14px 20px",cursor:"pointer",color:(TC&&TC.ac||"#0d9488"),fontSize:13,fontWeight:600,display:"inline-flex",alignItems:"center",gap:6}}>{"+ Agregar acceso r\u00e1pido"}</button>
            <p style={{fontSize:11,color:"#94a3b8",marginTop:6}}>{"Pod\u00e9s agregar hasta 4 evaluaciones"}</p>
          </div>}
          {shortcuts.length > 0 && <div style={{display:"grid",gridTemplateColumns:shortcuts.length > 2 ? "1fr 1fr" : "1fr",gap:8}}>
            {shortcuts.map(function(scId){ var tool = TOOL_MAP[scId]; if(!tool) return null; return <div key={scId} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:"#f8faf9",borderRadius:8,border:"1px solid #e2e8f0",cursor:"pointer"}} onClick={function(){ if(onStartEval) onStartEval(scId); }}><span style={{fontSize:20}}>{tool.icon}</span><span style={{fontSize:12,fontWeight:600,color:"#334155",flex:1}}>{tool.name}</span><button onClick={function(ev){ ev.stopPropagation(); removeShortcut(scId); }} style={{background:"none",border:"none",fontSize:14,color:"#94a3b8",cursor:"pointer",padding:"0 2px"}}>{"\u00d7"}</button></div>; })}
          </div>}
          {showAddSC && <div style={{marginTop:shortcuts.length > 0 ? 10 : 0,background:"#f0fdfa",borderRadius:8,padding:12,border:"1px solid #ccfbf1"}}>
            <div style={{fontSize:11,fontWeight:600,color:(TC&&TC.ac||"#0d9488"),marginBottom:8}}>{"Seleccionar evaluaci\u00f3n:"}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>{availableToAdd.map(function(toolId){ var tool = TOOL_MAP[toolId]; if(!tool) return null; return <button key={toolId} onClick={function(){ addShortcut(toolId); }} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 12px",background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:500,color:"#334155"}}><span style={{fontSize:16}}>{tool.icon}</span>{tool.name}</button>; })}</div>
          </div>}
        </div>
      </div>}

      <div style={{background:"#fff",borderRadius:14,padding:22,border:"1px solid #e2e8f0",marginBottom:28}}>
        <h3 style={{fontSize:15,fontWeight:600,marginBottom:14}}>Recientes</h3>
        {rc.length===0 ? <p style={{color:K.mt,fontSize:13}}>Sin evaluaciones aún.</p> : rc.map(function(ev){
          return <div key={ev._fbId||ev.id} onClick={function(){if(onView)onView(ev)}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #e2e8f0",cursor:"pointer"}}>
            <div><div style={{fontWeight:600,fontSize:14}}>{ev.paciente}</div><div style={{fontSize:11,color:K.mt}}>{typeLabel(ev.tipo)} · {new Date(ev.fechaGuardado).toLocaleDateString("es-CL")}</div></div>
            <span style={{color:K.mt}}>→</span>
          </div>;
        })}
      </div>

      {/* Consolidated report tip */}
      {uniquePatients > 0 && visibleEvals.length >= 2 && <div style={{background:"linear-gradient(135deg,#f3e8ff,#ede9fe)",borderRadius:14,border:"1px solid #c4b5fd",padding:"16px 20px",marginBottom:20,display:"flex",alignItems:"center",gap:14}}>
        <span style={{fontSize:28,flexShrink:0}}>{"📋"}</span>
        <div style={{flex:1}}>
          <div style={{fontSize:14,fontWeight:700,color:"#7c3aed"}}>{"Informe Complementario disponible"}</div>
          <div style={{fontSize:12,color:"#6b21a8",marginTop:2}}>{_isMob ? "Pod\u00e9s generar un informe que integre varias evaluaciones de un mismo paciente. Ingres\u00e1 en modo escritorio para acceder." : "Pod\u00e9s generar un informe que integre varias evaluaciones de un mismo paciente. Encontralo en Herramientas."}</div>
        </div>
        {!_isMob && <button onClick={onT} style={{padding:"8px 16px",background:"#7c3aed",color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",flexShrink:0}}>{"Ir"}</button>}
      </div>}

      <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:24,marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <h3 style={{fontSize:16,fontWeight:700,color:(TC&&TC.sd||"#0a3d2f"),margin:0}}>📅 Agenda</h3>
          {onCalendar && <button onClick={onCalendar} style={{background:"none",border:"1px solid #e2e8f0",borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer",color:(TC&&TC.ac||"#0d9488")}}>Ver completa →</button>}
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <button onClick={prevMonth} style={{background:"#f1f5f9",border:"none",padding:"6px 14px",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer",color:"#475569"}}>←</button>
          <div style={{fontSize:15,fontWeight:700,color:(TC&&TC.sd||"#0a3d2f")}}>{MESES[calMonth]+" "+calYear}</div>
          <button onClick={nextMonth} style={{background:"#f1f5f9",border:"none",padding:"6px 14px",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer",color:"#475569"}}>→</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,marginBottom:16}}>
          {DIAS.map(function(d){ return <div key={d} style={{textAlign:"center",fontSize:10,fontWeight:600,color:K.mt,padding:"4px 0"}}>{d}</div>; })}
          {Array.from({length:offset}).map(function(_,i){ return <div key={"e"+i} style={{minHeight:36}} />; })}
          {Array.from({length:daysInMonth}).map(function(_,i){
            var d = i+1; var dc = getCitasForDay(d); var isT = isToday(d);
            return <div key={d} onClick={function(){ if(onCalendar) onCalendar(); }} style={{minHeight:36,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",borderRadius:6,cursor:onCalendar?"pointer":"default",background:isT?"#ccfbf1":"transparent"}}>
              <div style={{fontSize:12,fontWeight:isT?700:400,color:isT?(TC&&TC.ac||"#0d9488"):"#1e293b"}}>{d}</div>
              {dc.length>0 && <div style={{display:"flex",gap:2,marginTop:1}}>{dc.slice(0,3).map(function(c,ci){ return <div key={ci} style={{width:5,height:5,borderRadius:"50%",background:getHex(c.color)}} />; })}</div>}
            </div>;
          })}
        </div>
        {upcoming.length>0 && <div>
          <div style={{fontSize:12,fontWeight:600,color:K.mt,marginBottom:8}}>Próximas citas</div>
          {upcoming.map(function(c){
            var parts = (c.fecha||"").split("-"); var dayNum = parts[2] ? parseInt(parts[2],10) : ""; var monthNum = parts[1] ? parseInt(parts[1],10)-1 : 0;
            return <div key={c._fbId} onClick={function(){ if(onCalendar) onCalendar(); }} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#f8faf9",borderRadius:8,border:"1px solid #e2e8f0",marginBottom:6,cursor:onCalendar?"pointer":"default",borderLeft:"3px solid "+getHex(c.color)}}>
              <div style={{textAlign:"center",minWidth:40}}><div style={{fontSize:16,fontWeight:700,color:(TC&&TC.sd||"#0a3d2f")}}>{dayNum}</div><div style={{fontSize:9,color:K.mt}}>{MESES[monthNum] ? MESES[monthNum].substring(0,3) : ""}</div></div>
              <div style={{flex:1}}><div style={{fontWeight:600,fontSize:13}}>{c.paciente}</div><div style={{fontSize:11,color:K.mt}}>{c.hora ? c.hora.substring(0,5) : ""}{c.tipo ? " · "+c.tipo : ""}</div></div>
              <span style={{background:getHex(c.color)+"22",color:getHex(c.color),padding:"2px 8px",borderRadius:12,fontSize:10,fontWeight:600}}>{c.estado||"pendiente"}</span>
            </div>;
          })}
        </div>}
        {upcoming.length===0 && !citasLoading && <div style={{textAlign:"center",padding:"8px 0",color:K.mt,fontSize:12,fontStyle:"italic"}}>No hay citas próximas</div>}
        {citasLoading && <div style={{textAlign:"center",padding:"8px 0",color:K.mt,fontSize:12}}>Cargando agenda...</div>}
      </div>
    </div>
  );
}
