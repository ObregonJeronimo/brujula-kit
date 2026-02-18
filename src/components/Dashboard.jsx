import { useState, useEffect, useCallback } from "react";
import { K } from "../lib/fb.js";
import { db, collection, getDocs, query, where } from "../firebase.js";

var MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
var DIAS = ["Lun","Mar","Mi\u00e9","Jue","Vie","S\u00e1b","Dom"];
var pad = function(n){ return String(n).padStart(2,"0"); };
var dateKey = function(y,m,d){ return y+"-"+pad(m+1)+"-"+pad(d); };

var COLOR_MAP = {
  red:"#dc2626", blue:"#2563eb", green:"#059669",
  yellow:"#d97706", violet:"#7c3aed"
};
function getHex(id){ return COLOR_MAP[id] || "#2563eb"; }

function countThisMonth(arr){
  var now = new Date();
  var y = now.getFullYear();
  var m = now.getMonth();
  var prefix = y + "-" + pad(m + 1);
  var count = 0;
  for(var i = 0; i < arr.length; i++){
    var fg = arr[i].fechaGuardado || "";
    if(fg.substring(0, 7) === prefix) count++;
  }
  return count;
}

var TOOL_MAP = {
  newELDI: { icon: "\ud83d\udccb", name: "ELDI", color: "#0d9488" },
  newPEFF: { icon: "\ud83d\udd0a", name: "PEFF", color: "#7c3aed" },
  newREP: { icon: "\ud83d\udcdd", name: "Rep. Palabras", color: "#2563eb" },
  newDISC: { icon: "\ud83d\udc42", name: "Disc. Fonol.", color: "#d97706" },
  newRECO: { icon: "\ud83c\udfaf", name: "Reco. Fonol.", color: "#9333ea" }
};
var TOOL_IDS = ["newELDI","newPEFF","newREP","newDISC","newRECO"];

function loadShortcuts(uid){
  try {
    var raw = window.localStorage.getItem("bk_shortcuts_"+uid);
    if(raw){ var parsed = JSON.parse(raw); if(Array.isArray(parsed)) return parsed.slice(0,4); }
  } catch(e){}
  return [];
}
function saveShortcuts(uid, arr){
  try { window.localStorage.setItem("bk_shortcuts_"+uid, JSON.stringify(arr.slice(0,4))); } catch(e){}
}

export default function Dashboard({ es, pe, re, de, rce, onT, onV, onVP, ld, profile, isAdmin, userId, nfy, onCalendar, onStartEval, onBuyCredits }) {
  var allEs = [].concat(es || []);
  var allPe = [].concat(pe || []);
  var allRe = [].concat(re || []);
  var allDe = [].concat(de || []);
  var allRce = [].concat(rce || []);
  var allEvals = [].concat(allEs, allPe, allRe, allDe, allRce);
  allEvals.sort(function(a,b){ return (b.fechaGuardado || "").localeCompare(a.fechaGuardado || ""); });
  var rc = allEvals.slice(0, 5);
  var evalsThisMonth = countThisMonth(allEs) + countThisMonth(allPe) + countThisMonth(allRe) + countThisMonth(allDe) + countThisMonth(allRce);
  var allPatients = {};
  allEvals.forEach(function(ev){ var name = (ev.paciente || "").trim(); if(name) allPatients[name.toLowerCase()] = true; });
  var uniquePatients = Object.keys(allPatients).length;
  var credits = isAdmin ? 999 : ((profile && profile.creditos) ? profile.creditos : 0);
  var cards = [
    { ic: "\ud83d\udccb", label: "Evaluaciones", sublabel: "este mes", value: evalsThisMonth },
    { ic: "\ud83d\udc66\ud83d\udc67", label: "Pacientes evaluados", value: uniquePatients },
    { ic: "\ud83c\udf38", label: "Cr\u00e9ditos", value: isAdmin ? "\u221e" : credits }
  ];

  var _sc = useState(function(){ return userId ? loadShortcuts(userId) : []; });
  var shortcuts = _sc[0], setShortcuts = _sc[1];
  var _showAdd = useState(false), showAddSC = _showAdd[0], setShowAddSC = _showAdd[1];
  var addShortcut = function(toolId){ if(shortcuts.indexOf(toolId) !== -1) return; var next = shortcuts.concat([toolId]).slice(0,4); setShortcuts(next); if(userId) saveShortcuts(userId, next); setShowAddSC(false); };
  var removeShortcut = function(toolId){ var next = shortcuts.filter(function(s){ return s !== toolId; }); setShortcuts(next); if(userId) saveShortcuts(userId, next); };
  var availableToAdd = TOOL_IDS.filter(function(id){ return shortcuts.indexOf(id) === -1; });

  var _showAlerts = useState(false), showAlerts = _showAlerts[0], setShowAlerts = _showAlerts[1];
  var now = new Date();
  var _ms = useState(now.getMonth()), calMonth = _ms[0], setCalMonth = _ms[1];
  var _ys = useState(now.getFullYear()), calYear = _ys[0], setCalYear = _ys[1];
  var _cs = useState([]), citas = _cs[0], setCitas = _cs[1];
  var _ls = useState(false), citasLoading = _ls[0], setCitasLoading = _ls[1];

  var loadCitas = useCallback(function(){
    if(!userId) return;
    setCitasLoading(true);
    var q2 = query(collection(db,"citas"), where("userId","==",userId));
    getDocs(q2).then(function(snap){
      var arr = snap.docs.map(function(d){ return Object.assign({_fbId:d.id},d.data()); });
      setCitas(arr); setCitasLoading(false);
    }).catch(function(e){ console.error("Error cargando citas:", e); setCitasLoading(false); });
  },[userId]);
  useEffect(function(){ loadCitas(); },[loadCitas]);

  var todayMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  var threeDaysMs = 3 * 24 * 60 * 60 * 1000;
  var upcomingAlerts = citas.filter(function(c){
    if(c.estado === "cancelada" || c.estado === "realizada") return false;
    var parts = (c.fecha || "").split("-"); if(parts.length < 3) return false;
    var citaMs = new Date(parseInt(parts[0],10), parseInt(parts[1],10)-1, parseInt(parts[2],10)).getTime();
    var diff = citaMs - todayMs; return diff >= 0 && diff <= threeDaysMs;
  }).map(function(c){
    var parts = (c.fecha || "").split("-");
    var citaMs = new Date(parseInt(parts[0],10), parseInt(parts[1],10)-1, parseInt(parts[2],10)).getTime();
    return { cita: c, dias: Math.round((citaMs - todayMs) / (24*60*60*1000)) };
  }).sort(function(a,b){ return a.dias - b.dias; });
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
      {/* HEADER + ALERTS BUTTON */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6,flexWrap:"wrap",gap:10}}>
        <div>
          <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>{"\ud83e\udded Panel Principal"}</h1>
          <p style={{color:K.mt,fontSize:14,marginBottom:0}}>{"Bienvenido/a, "}{profile && profile.nombre ? profile.nombre : (profile && profile.username ? profile.username : "")}{ld ? " \u2014 cargando..." : ""}</p>
        </div>
        <button onClick={function(){ setShowAlerts(!showAlerts); }} style={{display:"flex",alignItems:"center",gap:8,background:alertCount > 0 ? "#fff7ed" : "#f8fafc",border:alertCount > 0 ? "1px solid #fed7aa" : "1px solid #e2e8f0",borderRadius:10,padding:"10px 16px",cursor:"pointer",fontSize:13,fontWeight:600,color:alertCount > 0 ? "#c2410c" : "#64748b",transition:"all .2s"}}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          {"Alertas y recordatorios"}
          {alertCount > 0 && <span style={{background:"#dc2626",color:"#fff",fontSize:11,fontWeight:800,minWidth:20,height:20,borderRadius:"50%",display:"inline-flex",alignItems:"center",justifyContent:"center",lineHeight:1}}>{alertCount}</span>}
        </button>
      </div>

      {/* ALERTS PANEL */}
      {showAlerts && <div style={{background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:20,marginBottom:20,animation:"fi .2s ease"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h3 style={{fontSize:15,fontWeight:700,color:"#0a3d2f",margin:0}}>{"Alertas y recordatorios"}</h3>
          <button onClick={function(){ setShowAlerts(false); }} style={{background:"none",border:"none",fontSize:18,color:"#94a3b8",cursor:"pointer"}}>{"\u00d7"}</button>
        </div>
        {alertCount === 0 && <p style={{color:"#94a3b8",fontSize:13,fontStyle:"italic",margin:0}}>{"No hay alertas activas en este momento."}</p>}
        {upcomingAlerts.map(function(a, idx){
          var diasTxt = a.dias === 0 ? "Hoy" : a.dias === 1 ? "Ma\u00f1ana" : "En " + a.dias + " d\u00edas";
          return <div key={idx} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"12px 14px",background:"#fffbeb",borderRadius:8,border:"1px solid #fef3c7",marginBottom:8}}>
            <span style={{fontSize:18,flexShrink:0}}>{"\ud83d\udcc5"}</span>
            <div>
              <div style={{fontSize:13,fontWeight:600,color:"#92400e"}}>{"RECORDATORIO: " + diasTxt + " tiene evaluaci\u00f3n con " + (a.cita.paciente || "paciente") + "."}</div>
              <div style={{fontSize:11,color:"#a16207",marginTop:2}}>{(a.cita.tipo || "") + " \u00b7 " + (a.cita.hora ? a.cita.hora.substring(0,5) : "") + " \u00b7 " + a.cita.fecha}</div>
            </div>
          </div>;
        })}
        {lowCredits && <div onClick={function(){ if(onBuyCredits) onBuyCredits(); }} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"12px 14px",background:"#fef2f2",borderRadius:8,border:"1px solid #fecaca",cursor:"pointer"}}>
          <span style={{fontSize:18,flexShrink:0}}>{"\u26a0\ufe0f"}</span>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:"#dc2626"}}>{"Aviso: quedan " + credits + " cr\u00e9ditos restantes. \u00bfDesea adquirir m\u00e1s cr\u00e9ditos?"}</div>
            <div style={{fontSize:11,color:"#b91c1c",marginTop:2}}>{"Haga clic aqu\u00ed para comprar cr\u00e9ditos."}</div>
          </div>
        </div>}
      </div>}

      {/* CARDS */}
      <div style={{marginBottom:28}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:16}}>
          {cards.map(function(c,i){
            return <div key={i} style={{background:"#fff",borderRadius:12,padding:22,border:"1px solid #e2e8f0"}}>
              <div style={{fontSize:28,marginBottom:6}}>{c.ic}</div>
              <div style={{fontSize:28,fontWeight:700}}>{c.value}</div>
              <div style={{fontSize:13,color:K.mt,marginTop:2}}>{c.label}</div>
              {c.sublabel && <div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>{c.sublabel}</div>}
            </div>;
          })}
        </div>
      </div>

      {/* TOOLS + QUICK ACCESS */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:28}}>
        <button onClick={onT} style={{background:"linear-gradient(135deg,#0a3d2f,#0d9488)",color:"#fff",border:"none",borderRadius:14,padding:"28px 24px",cursor:"pointer",display:"flex",alignItems:"center",gap:16,textAlign:"left"}}>
          <div style={{width:52,height:52,borderRadius:12,background:"rgba(255,255,255,.14)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{"\ud83e\uddf0"}</div>
          <div><div style={{fontSize:18,fontWeight:700}}>Herramientas</div><div style={{fontSize:13,opacity:.8,marginTop:4}}>{"Nueva evaluaci\u00f3n"}</div></div>
        </button>
        <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <h3 style={{fontSize:14,fontWeight:700,color:"#0a3d2f",margin:0}}>{"Acceso r\u00e1pido"}</h3>
            {shortcuts.length > 0 && shortcuts.length < 4 && availableToAdd.length > 0 && <button onClick={function(){ setShowAddSC(!showAddSC); }} style={{background:"none",border:"1px solid #e2e8f0",borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer",color:"#0d9488"}}>{showAddSC ? "Cancelar" : "+ Agregar"}</button>}
          </div>
          {shortcuts.length === 0 && !showAddSC && <div style={{textAlign:"center",padding:"14px 0"}}>
            <button onClick={function(){ setShowAddSC(true); }} style={{background:"#f0fdfa",border:"1px dashed #99f6e4",borderRadius:10,padding:"14px 20px",cursor:"pointer",color:"#0d9488",fontSize:13,fontWeight:600,display:"inline-flex",alignItems:"center",gap:6}}>{"+ Agregar acceso r\u00e1pido"}</button>
            <p style={{fontSize:11,color:"#94a3b8",marginTop:6}}>{"Pod\u00e9s agregar hasta 4 evaluaciones"}</p>
          </div>}
          {shortcuts.length > 0 && <div style={{display:"grid",gridTemplateColumns:shortcuts.length > 2 ? "1fr 1fr" : "1fr",gap:8}}>
            {shortcuts.map(function(scId){
              var tool = TOOL_MAP[scId]; if(!tool) return null;
              return <div key={scId} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",background:"#f8faf9",borderRadius:8,border:"1px solid #e2e8f0",cursor:"pointer"}} onClick={function(){ if(onStartEval) onStartEval(scId); }}>
                <span style={{fontSize:20}}>{tool.icon}</span>
                <span style={{fontSize:12,fontWeight:600,color:"#334155",flex:1}}>{tool.name}</span>
                <button onClick={function(ev){ ev.stopPropagation(); removeShortcut(scId); }} style={{background:"none",border:"none",fontSize:14,color:"#94a3b8",cursor:"pointer",padding:"0 2px",lineHeight:1}}>{"\u00d7"}</button>
              </div>;
            })}
          </div>}
          {showAddSC && <div style={{marginTop:shortcuts.length > 0 ? 10 : 0,background:"#f0fdfa",borderRadius:8,padding:12,border:"1px solid #ccfbf1"}}>
            <div style={{fontSize:11,fontWeight:600,color:"#0d9488",marginBottom:8}}>{"Seleccionar evaluaci\u00f3n:"}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {availableToAdd.map(function(toolId){
                var tool = TOOL_MAP[toolId]; if(!tool) return null;
                return <button key={toolId} onClick={function(){ addShortcut(toolId); }} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 12px",background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,cursor:"pointer",fontSize:12,fontWeight:500,color:"#334155"}}><span style={{fontSize:16}}>{tool.icon}</span>{tool.name}</button>;
              })}
            </div>
          </div>}
        </div>
      </div>

      {/* RECIENTES */}
      <div style={{background:"#fff",borderRadius:14,padding:22,border:"1px solid #e2e8f0",marginBottom:28}}>
        <h3 style={{fontSize:15,fontWeight:600,marginBottom:14}}>Recientes</h3>
        {rc.length===0 ? <p style={{color:K.mt,fontSize:13}}>{"Sin evaluaciones a\u00fan."}</p> : rc.map(function(ev){
          var isP = !!ev.seccionData;
          return <div key={ev._fbId||ev.id} onClick={function(){isP?onVP(ev):onV(ev)}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #e2e8f0",cursor:"pointer"}}>
            <div><div style={{fontWeight:600,fontSize:14}}>{ev.paciente}</div><div style={{fontSize:11,color:K.mt}}>{isP?"PEFF":"ELDI"}{" \u00b7 "}{new Date(ev.fechaGuardado).toLocaleDateString("es-CL")}</div></div>
            <span style={{color:K.mt}}>{"\u2192"}</span>
          </div>;
        })}
      </div>

      {/* CALENDAR */}
      <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:24,marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <h3 style={{fontSize:16,fontWeight:700,color:"#0a3d2f",margin:0}}>{"\ud83d\udcc5 Agenda"}</h3>
          {onCalendar && <button onClick={onCalendar} style={{background:"none",border:"1px solid #e2e8f0",borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#0d9488"}}>{"Ver completa \u2192"}</button>}
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <button onClick={prevMonth} style={{background:"#f1f5f9",border:"none",padding:"6px 14px",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer",color:"#475569"}}>{"\u2190"}</button>
          <div style={{fontSize:15,fontWeight:700,color:"#0a3d2f"}}>{MESES[calMonth]+" "+calYear}</div>
          <button onClick={nextMonth} style={{background:"#f1f5f9",border:"none",padding:"6px 14px",borderRadius:6,fontSize:13,fontWeight:600,cursor:"pointer",color:"#475569"}}>{"\u2192"}</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:1,marginBottom:16}}>
          {DIAS.map(function(d){ return <div key={d} style={{textAlign:"center",fontSize:10,fontWeight:600,color:K.mt,padding:"4px 0"}}>{d}</div>; })}
          {Array.from({length:offset}).map(function(_,i){ return <div key={"e"+i} style={{minHeight:36}} />; })}
          {Array.from({length:daysInMonth}).map(function(_,i){
            var d = i+1; var dc = getCitasForDay(d); var isT = isToday(d);
            return <div key={d} onClick={function(){ if(onCalendar) onCalendar(); }} style={{minHeight:36,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",borderRadius:6,cursor:onCalendar?"pointer":"default",background:isT?"#ccfbf1":"transparent",transition:"background .15s"}}>
              <div style={{fontSize:12,fontWeight:isT?700:400,color:isT?"#0d9488":"#1e293b"}}>{d}</div>
              {dc.length>0 && <div style={{display:"flex",gap:2,marginTop:1}}>{dc.slice(0,3).map(function(c,ci){ return <div key={ci} style={{width:5,height:5,borderRadius:"50%",background:getHex(c.color)}} />; })}</div>}
            </div>;
          })}
        </div>
        {upcoming.length>0 && <div>
          <div style={{fontSize:12,fontWeight:600,color:K.mt,marginBottom:8}}>{"Pr\u00f3ximas citas"}</div>
          {upcoming.map(function(c){
            var parts = (c.fecha||"").split("-"); var dayNum = parts[2] ? parseInt(parts[2],10) : ""; var monthNum = parts[1] ? parseInt(parts[1],10)-1 : 0;
            return <div key={c._fbId} onClick={function(){ if(onCalendar) onCalendar(); }} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#f8faf9",borderRadius:8,border:"1px solid #e2e8f0",marginBottom:6,cursor:onCalendar?"pointer":"default",borderLeft:"3px solid "+getHex(c.color)}}>
              <div style={{textAlign:"center",minWidth:40}}><div style={{fontSize:16,fontWeight:700,color:"#0a3d2f"}}>{dayNum}</div><div style={{fontSize:9,color:K.mt}}>{MESES[monthNum] ? MESES[monthNum].substring(0,3) : ""}</div></div>
              <div style={{flex:1}}><div style={{fontWeight:600,fontSize:13}}>{c.paciente}</div><div style={{fontSize:11,color:K.mt}}>{c.hora ? c.hora.substring(0,5) : ""}{c.tipo ? " \u00b7 "+c.tipo : ""}</div></div>
              <span style={{background:getHex(c.color)+"22",color:getHex(c.color),padding:"2px 8px",borderRadius:12,fontSize:10,fontWeight:600}}>{c.estado||"pendiente"}</span>
            </div>;
          })}
        </div>}
        {upcoming.length===0 && !citasLoading && <div style={{textAlign:"center",padding:"8px 0",color:K.mt,fontSize:12,fontStyle:"italic"}}>{"No hay citas pr\u00f3ximas"}</div>}
        {citasLoading && <div style={{textAlign:"center",padding:"8px 0",color:K.mt,fontSize:12}}>{"Cargando agenda..."}</div>}
      </div>
    </div>
  );
}
