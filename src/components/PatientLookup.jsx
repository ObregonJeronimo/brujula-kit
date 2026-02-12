import { useState, useEffect } from "react";
import { db, collection, getDocs, query, where } from "../firebase.js";

var K = {mt:"#64748b"};
var I = {width:"100%",padding:"10px 14px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,background:"#f8faf9"};

function calcAge(birthStr){
  if(!birthStr) return "";
  var b = new Date(birthStr);
  var now = new Date();
  var years = now.getFullYear() - b.getFullYear();
  var months = now.getMonth() - b.getMonth();
  if(now.getDate() < b.getDate()) months--;
  if(months < 0){ years--; months += 12; }
  if(years < 1) return months + (months===1?" mes":" meses");
  var parts = years + (years===1?" a\u00f1o":" a\u00f1os");
  if(months > 0) parts += ", " + months + (months===1?" mes":" meses");
  return parts;
}

export default function PatientLookup({ userId, onSelect, selected, color }){
  var _d = useState(""), dniInput = _d[0], setDniInput = _d[1];
  var _s = useState("idle"), status = _s[0], setStatus = _s[1];
  var _r = useState([]), results = _r[0], setResults = _r[1];
  var accent = color || "#0d9488";

  var doSearch = function(){
    var dni = (dniInput||"").replace(/\D/g,"").trim();
    if(!dni || dni.length < 3){ setStatus("idle"); setResults([]); return; }
    setStatus("searching");
    var q2 = query(collection(db,"pacientes"), where("userId","==",userId));
    getDocs(q2).then(function(snap){
      var all = snap.docs.map(function(d){ return Object.assign({_fbId:d.id},d.data()); });
      var matched = all.filter(function(p){ return p.dni && p.dni.indexOf(dni) === 0; });
      if(matched.length === 0){ setResults([]); setStatus("empty"); }
      else if(matched.length === 1 && matched[0].dni === dni){ setResults(matched); setStatus("found"); onSelect(matched[0]); }
      else { setResults(matched); setStatus("found"); }
    }).catch(function(e){ console.error("PatientLookup error:", e); setStatus("error"); });
  };

  useEffect(function(){
    if(!dniInput || dniInput.replace(/\D/g,"").length < 3){ setStatus("idle"); setResults([]); return; }
    var timer = setTimeout(doSearch, 400);
    return function(){ clearTimeout(timer); };
  },[dniInput]);

  var clearSelection = function(){ onSelect(null); setDniInput(""); setResults([]); setStatus("idle"); };

  if(selected){
    return (
      <div style={{marginBottom:20}}>
        <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,padding:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:13,fontWeight:700,color:"#059669"}}>{"Paciente seleccionado"}</div>
            <button onClick={clearSelection} style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:6,padding:"4px 12px",fontSize:11,fontWeight:600,cursor:"pointer",color:"#dc2626"}}>Cambiar</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><div style={{fontSize:10,fontWeight:600,color:K.mt}}>DNI</div><div style={{fontSize:14,fontWeight:600}}>{selected.dni}</div></div>
            <div><div style={{fontSize:10,fontWeight:600,color:K.mt}}>Edad</div><div style={{fontSize:14,fontWeight:600}}>{calcAge(selected.fechaNac)}</div></div>
            <div style={{gridColumn:"1/-1"}}><div style={{fontSize:10,fontWeight:600,color:K.mt}}>Nombre completo</div><div style={{fontSize:14,fontWeight:700}}>{selected.nombre}</div></div>
            <div><div style={{fontSize:10,fontWeight:600,color:K.mt}}>Fecha de nacimiento</div><div style={{fontSize:14}}>{selected.fechaNac ? new Date(selected.fechaNac+"T12:00:00").toLocaleDateString("es-AR") : "-"}</div></div>
            <div><div style={{fontSize:10,fontWeight:600,color:K.mt}}>{"Jard\u00edn / Colegio"}</div><div style={{fontSize:14}}>{selected.colegio || "-"}</div></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{marginBottom:20}}>
      <label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>{"Ingrese DNI del paciente (sin puntos)"}</label>
      <div style={{display:"flex",gap:8}}>
        <input value={dniInput}
          onChange={function(e){ setDniInput(e.target.value.replace(/\D/g,"").slice(0,8)); onSelect(null); }}
          style={Object.assign({},I,{flex:1})} placeholder="Ej: 45123456" maxLength={8} inputMode="numeric" />
        <button onClick={doSearch} style={{background:accent,color:"#fff",border:"none",padding:"10px 18px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",flexShrink:0}}>Buscar</button>
      </div>
      {status==="searching" && <div style={{marginTop:8,fontSize:12,color:K.mt}}>Buscando...</div>}
      {status==="empty" && <div style={{marginTop:8,fontSize:12,color:"#dc2626"}}>{"No se encontr\u00f3 paciente con ese DNI. Cargalo primero en la secci\u00f3n Pacientes."}</div>}
      {status==="error" && <div style={{marginTop:8,fontSize:12,color:"#dc2626"}}>Error al buscar. Intente nuevamente.</div>}
      {status==="found" && results.length > 0 && !selected && (
        <div style={{marginTop:8}}>
          {results.length > 1 && <div style={{fontSize:11,color:K.mt,marginBottom:4}}>{"Seleccione un paciente:"}</div>}
          {results.map(function(pac){
            return <div key={pac._fbId} onClick={function(){ onSelect(pac); }}
              style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"#fff",borderRadius:8,border:"1px solid #e2e8f0",cursor:"pointer",marginBottom:4,transition:"all .15s"}}>
              <div style={{width:32,height:32,borderRadius:8,background:"#f0f9ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{"\ud83d\udc64"}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:13}}>{pac.nombre}</div>
                <div style={{fontSize:11,color:K.mt}}>{"DNI: "}{pac.dni}{" \u00b7 "}{calcAge(pac.fechaNac)}{pac.colegio ? " \u00b7 "+pac.colegio : ""}</div>
              </div>
              <span style={{color:accent,fontSize:12,fontWeight:600}}>Seleccionar</span>
            </div>;
          })}
        </div>
      )}
    </div>
  );
}
