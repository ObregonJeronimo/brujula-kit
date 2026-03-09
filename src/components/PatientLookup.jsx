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
  var _inp = useState(""), searchInput = _inp[0], setSearchInput = _inp[1];
  var _s = useState("idle"), status = _s[0], setStatus = _s[1];
  var _r = useState([]), results = _r[0], setResults = _r[1];
  var _mode = useState("search"), mode = _mode[0], setMode = _mode[1];
  var _allPats = useState([]), allPats = _allPats[0], setAllPats = _allPats[1];
  var _listLoading = useState(false), listLoading = _listLoading[0], setListLoading = _listLoading[1];
  var accent = color || "#0d9488";

  var isNumeric = function(str){ return /^\d+$/.test(str); };

  var loadAllPatients = function(){
    setListLoading(true);
    var q2 = query(collection(db,"pacientes"), where("userId","==",userId));
    getDocs(q2).then(function(snap){
      var all = snap.docs.map(function(d){ return Object.assign({_fbId:d.id},d.data()); });
      all.sort(function(a,b){ return (a.nombre||"").localeCompare(b.nombre||""); });
      setAllPats(all);
      setListLoading(false);
    }).catch(function(e){ console.error(e); setListLoading(false); });
  };

  // Load patients when switching to list mode
  useEffect(function(){
    if(mode === "list" && allPats.length === 0 && !listLoading) loadAllPatients();
  },[mode]);

  var doSearch = function(){
    var raw = (searchInput||"").trim();
    if(!raw || raw.length < 2){ setStatus("idle"); setResults([]); return; }
    setStatus("searching");
    var q2 = query(collection(db,"pacientes"), where("userId","==",userId));
    getDocs(q2).then(function(snap){
      var all = snap.docs.map(function(d){ return Object.assign({_fbId:d.id},d.data()); });
      var matched;
      var searchingDni = isNumeric(raw);
      if(searchingDni){
        matched = all.filter(function(p){ return p.dni && p.dni.indexOf(raw) === 0; });
        if(matched.length === 1 && matched[0].dni === raw){
          setResults(matched); setStatus("found"); onSelect(matched[0]); return;
        }
      } else {
        var q = raw.toLowerCase();
        matched = all.filter(function(p){ return p.nombre && p.nombre.toLowerCase().indexOf(q) >= 0; });
      }
      if(matched.length === 0){ setResults([]); setStatus("empty"); }
      else { setResults(matched); setStatus("found"); }
    }).catch(function(e){ console.error("PatientLookup error:", e); setStatus("error"); });
  };

  useEffect(function(){
    if(mode !== "search") return;
    var raw = (searchInput||"").trim();
    if(!raw || raw.length < 2){ setStatus("idle"); setResults([]); return; }
    var timer = setTimeout(doSearch, 400);
    return function(){ clearTimeout(timer); };
  },[searchInput]);

  var clearSelection = function(){ onSelect(null); setSearchInput(""); setResults([]); setStatus("idle"); };

  var renderPatientCard = function(pac){
    return <div key={pac._fbId} onClick={function(){ onSelect(pac); }}
      style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"#fff",borderRadius:8,border:"1px solid #e2e8f0",cursor:"pointer",marginBottom:4,transition:"all .15s"}}>
      <div style={{width:32,height:32,borderRadius:8,background:"#f0f9ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{"\ud83d\udc64"}</div>
      <div style={{flex:1}}>
        <div style={{fontWeight:600,fontSize:13}}>{pac.nombre}</div>
        <div style={{fontSize:11,color:K.mt}}>{"DNI: "+(pac.dni||"N/A")+" \u00b7 "+calcAge(pac.fechaNac)+(pac.colegio ? " \u00b7 "+pac.colegio : "")}</div>
      </div>
      <span style={{color:accent,fontSize:12,fontWeight:600}}>Seleccionar</span>
    </div>;
  };

  // SELECTED STATE
  if(selected){
    return (
      <div style={{marginBottom:20}}>
        <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,padding:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:13,fontWeight:700,color:"#059669"}}>{"Paciente seleccionado"}</div>
            <button onClick={clearSelection} style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:6,padding:"4px 12px",fontSize:11,fontWeight:600,cursor:"pointer",color:"#dc2626"}}>Cambiar</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><div style={{fontSize:10,fontWeight:600,color:K.mt}}>DNI</div><div style={{fontSize:14,fontWeight:600}}>{selected.dni||"N/A"}</div></div>
            <div><div style={{fontSize:10,fontWeight:600,color:K.mt}}>Edad</div><div style={{fontSize:14,fontWeight:600}}>{calcAge(selected.fechaNac)}</div></div>
            <div style={{gridColumn:"1/-1"}}><div style={{fontSize:10,fontWeight:600,color:K.mt}}>Nombre completo</div><div style={{fontSize:14,fontWeight:700}}>{selected.nombre}</div></div>
            <div><div style={{fontSize:10,fontWeight:600,color:K.mt}}>Fecha de nacimiento</div><div style={{fontSize:14}}>{selected.fechaNac ? new Date(selected.fechaNac+"T12:00:00").toLocaleDateString("es-AR") : "-"}</div></div>
            <div><div style={{fontSize:10,fontWeight:600,color:K.mt}}>{"Jard\u00edn / Colegio"}</div><div style={{fontSize:14}}>{selected.colegio || "-"}</div></div>
          </div>
        </div>
      </div>
    );
  }

  // UNSELECTED STATE
  return (
    <div style={{marginBottom:20}}>
      {/* Toggle: Buscar / Ver lista */}
      <div style={{display:"flex",gap:0,marginBottom:12,borderRadius:8,overflow:"hidden",border:"1px solid #e2e8f0"}}>
        <button onClick={function(){ setMode("search"); }} style={{flex:1,padding:"9px 0",background:mode==="search"?accent:"#f8fafc",color:mode==="search"?"#fff":K.mt,border:"none",fontSize:13,fontWeight:600,cursor:"pointer",transition:"all .15s"}}>
          {"\ud83d\udd0d Buscar paciente"}
        </button>
        <button onClick={function(){ setMode("list"); }} style={{flex:1,padding:"9px 0",background:mode==="list"?accent:"#f8fafc",color:mode==="list"?"#fff":K.mt,border:"none",fontSize:13,fontWeight:600,cursor:"pointer",transition:"all .15s",borderLeft:"1px solid #e2e8f0"}}>
          {"\ud83d\udccb Mis pacientes"}
        </button>
      </div>

      {/* SEARCH MODE */}
      {mode === "search" && <div>
        <label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>{"Buscar por DNI o nombre"}</label>
        <div style={{display:"flex",gap:8}}>
          <input value={searchInput}
            onChange={function(e){ setSearchInput(e.target.value); onSelect(null); }}
            style={Object.assign({},I,{flex:1})} placeholder="Introducir DNI o Nombre y Apellido" />
          <button onClick={doSearch} style={{background:accent,color:"#fff",border:"none",padding:"10px 18px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",flexShrink:0}}>Buscar</button>
        </div>
        {status==="searching" && <div style={{marginTop:8,fontSize:12,color:K.mt}}>Buscando...</div>}
        {status==="empty" && <div style={{marginTop:8,fontSize:12,color:"#dc2626"}}>{"No se encontr\u00f3 paciente. Cargalo primero en la secci\u00f3n Pacientes."}</div>}
        {status==="error" && <div style={{marginTop:8,fontSize:12,color:"#dc2626"}}>Error al buscar. Intente nuevamente.</div>}
        {status==="found" && results.length > 0 && !selected && (
          <div style={{marginTop:8}}>
            <div style={{fontSize:11,color:K.mt,marginBottom:4}}>{results.length === 1 ? "1 paciente encontrado:" : results.length+" pacientes encontrados:"}</div>
            {results.map(renderPatientCard)}
          </div>
        )}
      </div>}

      {/* LIST MODE */}
      {mode === "list" && <div>
        {listLoading && <div style={{textAlign:"center",padding:20,color:K.mt,fontSize:13}}>Cargando pacientes...</div>}
        {!listLoading && allPats.length === 0 && <div style={{textAlign:"center",padding:20,color:K.mt,fontSize:13}}>{"No ten\u00e9s pacientes registrados. And\u00e1 a la secci\u00f3n Pacientes para cargar uno."}</div>}
        {!listLoading && allPats.length > 0 && <div>
          <div style={{fontSize:11,color:K.mt,marginBottom:8}}>{allPats.length+" paciente"+(allPats.length>1?"s":"")+" registrado"+(allPats.length>1?"s":"")}</div>
          <div style={{maxHeight:300,overflowY:"auto",borderRadius:8,border:"1px solid #e2e8f0",padding:6}}>
            {allPats.map(renderPatientCard)}
          </div>
        </div>}
      </div>}
    </div>
  );
}
