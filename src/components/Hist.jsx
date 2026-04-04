import { useState } from "react";
import { isVisibleType, typeBadge, HIST_TABS } from "../config/evalTypes.js";
import { K, ageLabel } from "../lib/fb.js";

export default function Hist({ allEvals, onView, isA, onD, enabledTools }) {
  var _q = useState(""), q = _q[0], sQ = _q[1];
  var _tab = useState("all"), tab = _tab[0], sTab = _tab[1];
  var _cf = useState(null), cf = _cf[0], sC = _cf[1];
  var _mode = useState("search"), searchMode = _mode[0], setSearchMode = _mode[1];
  var _selPat = useState(null), selPatient = _selPat[0], setSelPatient = _selPat[1];

  var all = (allEvals || []).filter(function(e){ return isVisibleType(e.tipo); })
    .sort(function(a, b){ return (b.fechaGuardado || "").localeCompare(a.fechaGuardado || ""); });

  // Get unique patients from evals
  var patientsMap = {};
  all.forEach(function(e){ if(e.paciente && !patientsMap[e.paciente]) patientsMap[e.paciente] = { nombre: e.paciente, count: 0 }; if(e.paciente) patientsMap[e.paciente].count++; });
  var patients = Object.values(patientsMap).sort(function(a,b){ return a.nombre.localeCompare(b.nombre); });

  var f = all.filter(function(e){
    if(searchMode === "search" && q && !(e.paciente || "").toLowerCase().includes(q.toLowerCase())) return false;
    if(searchMode === "list" && selPatient && e.paciente !== selPatient) return false;
    if(tab !== "all" && e.tipo !== tab) return false;
    return true;
  });

  return (
    <div style={{width:"100%",animation:"fi .3s ease"}}>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>Historial</h1>
      <p style={{color:K.mt,fontSize:14,marginBottom:14}}>{all.length+" evaluaciones"}</p>
      <div style={{display:"flex",gap:8,marginBottom:14,overflowX:"auto",WebkitOverflowScrolling:"touch",paddingBottom:4}}>
        {HIST_TABS.filter(function(x){ return x[0]==="all" || !enabledTools || enabledTools[x[0]]!==false; }).map(function(x){
          var id=x[0], lb=x[1];
          return <button key={id} onClick={function(){sTab(id)}} style={{padding:"6px 14px",borderRadius:6,border:tab===id?"2px solid #0d9488":"1px solid #e2e8f0",background:tab===id?"#ccfbf1":"#fff",color:tab===id?"#0d9488":"#64748b",fontSize:13,fontWeight:600,cursor:"pointer"}}>{lb}</button>;
        })}
      </div>
      {/* Search/List toggle */}
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
        <div style={{display:"flex",borderRadius:8,overflow:"hidden",border:"1px solid #e2e8f0"}}>
          <button onClick={function(){setSearchMode("search");setSelPatient(null);}} style={{padding:"8px 14px",border:"none",background:searchMode==="search"?"#0d9488":"#fff",color:searchMode==="search"?"#fff":"#64748b",fontSize:12,fontWeight:600,cursor:"pointer"}}>{"Buscar"}</button>
          <button onClick={function(){setSearchMode("list");sQ("");}} style={{padding:"8px 14px",border:"none",background:searchMode==="list"?"#0d9488":"#fff",color:searchMode==="list"?"#fff":"#64748b",fontSize:12,fontWeight:600,cursor:"pointer"}}>{"Pacientes"}</button>
        </div>
        {searchMode==="search" && <input value={q} onChange={function(e){sQ(e.target.value)}} placeholder="Buscar paciente..." style={{flex:1,maxWidth:350,padding:"10px 14px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,background:"#fff"}} />}
        {searchMode==="list" && <div style={{flex:1,maxWidth:350,position:"relative"}}>
          <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,maxHeight:180,overflowY:"auto"}}>
            {selPatient && <button onClick={function(){setSelPatient(null)}} style={{width:"100%",padding:"8px 14px",border:"none",borderBottom:"1px solid #f1f5f9",background:"#f0fdf4",color:"#059669",fontSize:13,fontWeight:600,cursor:"pointer",textAlign:"left"}}>{"✕ Mostrar todos"}</button>}
            {patients.map(function(p){
              var active = selPatient === p.nombre;
              return <button key={p.nombre} onClick={function(){setSelPatient(active?null:p.nombre)}} style={{width:"100%",padding:"8px 14px",border:"none",borderBottom:"1px solid #f1f5f9",background:active?"#ccfbf1":"#fff",color:active?"#0d9488":"#1e293b",fontSize:13,fontWeight:active?600:400,cursor:"pointer",textAlign:"left",display:"flex",justifyContent:"space-between"}}>
                <span>{p.nombre}</span>
                <span style={{fontSize:11,color:K.mt}}>{p.count}</span>
              </button>;
            })}
            {patients.length===0 && <div style={{padding:"12px 14px",color:K.mt,fontSize:13}}>Sin pacientes</div>}
          </div>
        </div>}
      </div>
      {f.length === 0 ? <div style={{background:"#fff",borderRadius:12,padding:40,textAlign:"center",border:"1px solid #e2e8f0",color:K.mt}}>Sin resultados.</div> :
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {f.map(function(ev){
            var bg = typeBadge(ev.tipo);
            return (
              <div key={ev._fbId||ev.id} style={{background:"#fff",borderRadius:10,padding:"14px 20px",border:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div onClick={function(){if(onView)onView(ev)}} style={{cursor:"pointer",flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{padding:"2px 8px",borderRadius:4,background:bg.b,color:bg.c,fontSize:10,fontWeight:700}}>{bg.l}</span>
                    <span style={{fontWeight:600,fontSize:15}}>{ev.paciente}</span>
                  </div>
                  <div style={{fontSize:12,color:K.mt,marginTop:2}}>
                    {new Date(ev.fechaGuardado).toLocaleDateString("es-CL")+" · "+ageLabel(ev.edadMeses)}{ev.evaluador?(" · "+ev.evaluador):""}
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  {ev.resultados && <span style={{padding:"3px 10px",borderRadius:14,background:bg.b,color:bg.c,fontSize:12,fontWeight:600}}>{ev.resultados.severity||(ev.resultados.pct+"%")}</span>}
                  {isA && (cf === (ev._fbId||ev.id) ?
                    <div style={{display:"flex",gap:4}}>
                      <button onClick={function(){onD(ev._fbId); sC(null);}} style={{background:"#dc2626",color:"#fff",border:"none",padding:"5px 10px",borderRadius:5,fontSize:11,cursor:"pointer",fontWeight:600}}>¿Sí?</button>
                      <button onClick={function(){sC(null)}} style={{background:"#f1f5f9",border:"none",padding:"5px 10px",borderRadius:5,fontSize:11,cursor:"pointer"}}>No</button>
                    </div> :
                    <button onClick={function(){sC(ev._fbId||ev.id)}} style={{background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",padding:"5px 12px",borderRadius:6,cursor:"pointer",fontSize:11,fontWeight:600}}>Eliminar</button>)}
                  <span onClick={function(){if(onView)onView(ev)}} style={{color:"#94a3b8",cursor:"pointer"}}>→</span>
                </div>
              </div>);
          })}
        </div>}
    </div>
  );
}
