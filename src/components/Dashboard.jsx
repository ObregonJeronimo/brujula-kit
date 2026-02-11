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

export default function Dashboard({ es, pe, onT, onV, onVP, ld, profile, isAdmin, userId, nfy, onCalendar }) {
  var all = [].concat(es,pe).sort(function(a,b){ return (b.fechaGuardado||"").localeCompare(a.fechaGuardado||""); });
  var rc = all.slice(0, 5);
  var cards = [
    { ic: "\ud83d\udccb", label: "Eval. ELDI", value: es.length },
    { ic: "\ud83d\udd0a", label: "Eval. PEFF", value: pe.length },
    { ic: "\ud83d\udc66\ud83d\udc67", label: "Pacientes", value: new Set([].concat(es.map(function(e){return e.paciente}),pe.map(function(e){return e.paciente}))).size },
    { ic: "\ud83c\udf38", label: "Cr\u00e9ditos", value: isAdmin ? "\u221e" : (profile?.creditos || 0) }
  ];

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
      setCitas(arr);
      setCitasLoading(false);
    }).catch(function(e){
      console.error("Error cargando citas:", e);
      setCitasLoading(false);
    });
  },[userId]);

  useEffect(function(){ loadCitas(); },[loadCitas]);

  var prevMonth = function(){
    if(calMonth===0){ setCalMonth(11); setCalYear(function(y){return y-1;}); }
    else setCalMonth(function(m){return m-1;});
  };
  var nextMonth = function(){
    if(calMonth===11){ setCalMonth(0); setCalYear(function(y){return y+1;}); }
    else setCalMonth(function(m){return m+1;});
  };

  var firstDay = new Date(calYear, calMonth, 1).getDay();
  var offset = firstDay===0 ? 6 : firstDay-1;
  var daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
  var isToday = function(d){ return now.getFullYear()===calYear && now.getMonth()===calMonth && now.getDate()===d; };

  var getCitasForDay = function(d){
    var key = dateKey(calYear, calMonth, d);
    return citas.filter(function(c){ return c.fecha===key; });
  };

  var todayStr = dateKey(now.getFullYear(), now.getMonth(), now.getDate());
  var upcoming = citas
    .filter(function(c){ return c.fecha >= todayStr && c.estado !== "cancelada"; })
    .sort(function(a,b){ return (a.fecha+(a.hora||"")).localeCompare(b.fecha+(b.hora||"")); })
    .slice(0, 3);

  return (
    <div style={{animation:"fi .3s ease",width:"100%"}}>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>{"\ud83e\udded Panel Principal"}</h1>
      <p style={{color:K.mt,fontSize:14,marginBottom:24}}>{"Bienvenido/a, "}{profile?.nombre || profile?.username}{ld ? " \u2014 cargando..." : ""}</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:16,marginBottom:28}}>
        {cards.map(function(c,i){
          return (
            <div key={i} style={{background:"#fff",borderRadius:12,padding:22,border:"1px solid #e2e8f0"}}>
              <div style={{fontSize:28,marginBottom:6}}>{c.ic}</div>
              <div style={{fontSize:28,fontWeight:700}}>{c.value}</div>
              <div style={{fontSize:13,color:K.mt,marginTop:2}}>{c.label}</div>
            </div>
          );
        })}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:28}}>
        <button onClick={onT} style={{background:"linear-gradient(135deg,#0a3d2f,#0d9488)",color:"#fff",border:"none",borderRadius:14,padding:"28px 24px",cursor:"pointer",display:"flex",alignItems:"center",gap:16,textAlign:"left"}}>
          <div style={{width:52,height:52,borderRadius:12,background:"rgba(255,255,255,.14)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{"\ud83e\uddf0"}</div>
          <div><div style={{fontSize:18,fontWeight:700}}>Herramientas</div><div style={{fontSize:13,opacity:.8,marginTop:4}}>{"Nueva evaluaci\u00f3n"}</div></div>
        </button>
        <div style={{background:"#fff",borderRadius:14,padding:22,border:"1px solid #e2e8f0"}}>
          <h3 style={{fontSize:15,fontWeight:600,marginBottom:14}}>Recientes</h3>
          {rc.length===0 ? <p style={{color:K.mt,fontSize:13}}>{"Sin evaluaciones a\u00fan."}</p> : rc.map(function(ev){
            var isP = !!ev.seccionData;
            return (
              <div key={ev._fbId||ev.id} onClick={function(){isP?onVP(ev):onV(ev)}} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #e2e8f0",cursor:"pointer"}}>
                <div><div style={{fontWeight:600,fontSize:14}}>{ev.paciente}</div><div style={{fontSize:11,color:K.mt}}>{isP?"PEFF":"ELDI"}{" \u00b7 "}{new Date(ev.fechaGuardado).toLocaleDateString("es-CL")}</div></div>
                <span style={{color:K.mt}}>{"\u2192"}</span>
              </div>
            );
          })}
        </div>
      </div>

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
            var d = i+1;
            var dc = getCitasForDay(d);
            var isT = isToday(d);
            return (
              <div key={d} onClick={function(){ if(onCalendar) onCalendar(); }}
                style={{minHeight:36,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",borderRadius:6,cursor:onCalendar?"pointer":"default",background:isT?"#ccfbf1":"transparent",transition:"background .15s",position:"relative"}}>
                <div style={{fontSize:12,fontWeight:isT?700:400,color:isT?"#0d9488":"#1e293b"}}>{d}</div>
                {dc.length>0 && <div style={{display:"flex",gap:2,marginTop:1}}>
                  {dc.slice(0,3).map(function(c,ci){ return <div key={ci} style={{width:5,height:5,borderRadius:"50%",background:getHex(c.color)}} />; })}
                </div>}
              </div>
            );
          })}
        </div>

        {upcoming.length>0 && (
          <div>
            <div style={{fontSize:12,fontWeight:600,color:K.mt,marginBottom:8}}>{"Pr\u00f3ximas citas"}</div>
            {upcoming.map(function(c){
              var parts = (c.fecha||"").split("-");
              var dayNum = parts[2] ? parseInt(parts[2],10) : "";
              var monthNum = parts[1] ? parseInt(parts[1],10)-1 : 0;
              return (
                <div key={c._fbId} onClick={function(){ if(onCalendar) onCalendar(); }}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#f8faf9",borderRadius:8,border:"1px solid #e2e8f0",marginBottom:6,cursor:onCalendar?"pointer":"default",borderLeft:"3px solid "+getHex(c.color)}}>
                  <div style={{textAlign:"center",minWidth:40}}>
                    <div style={{fontSize:16,fontWeight:700,color:"#0a3d2f"}}>{dayNum}</div>
                    <div style={{fontSize:9,color:K.mt}}>{MESES[monthNum] ? MESES[monthNum].substring(0,3) : ""}</div>
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:13}}>{c.paciente}</div>
                    <div style={{fontSize:11,color:K.mt}}>{c.hora ? c.hora.substring(0,5) : ""}{c.tipo ? " \u00b7 "+c.tipo : ""}</div>
                  </div>
                  <span style={{background:getHex(c.color)+"22",color:getHex(c.color),padding:"2px 8px",borderRadius:12,fontSize:10,fontWeight:600}}>{c.estado||"pendiente"}</span>
                </div>
              );
            })}
          </div>
        )}
        {upcoming.length===0 && !citasLoading && (
          <div style={{textAlign:"center",padding:"8px 0",color:K.mt,fontSize:12,fontStyle:"italic"}}>{"No hay citas pr\u00f3ximas"}</div>
        )}
        {citasLoading && (
          <div style={{textAlign:"center",padding:"8px 0",color:K.mt,fontSize:12}}>{"Cargando agenda..."}</div>
        )}
      </div>
    </div>
  );
}
