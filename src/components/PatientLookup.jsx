import { useState, useEffect } from "react";
import { db, collection, getDocs, query, where } from "../firebase.js";
import "../styles/PatientLookup.css";

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

  // Inyectamos el color dinámico como CSS variable local al wrapper.
  // Si no llega prop, CSS hace fallback a var(--c-accent).
  var wrapperStyle = color ? { "--plk-accent": color } : undefined;

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
    return <div key={pac._fbId} onClick={function(){ onSelect(pac); }} className="plk-card">
      <div className="plk-card-avatar">{"\ud83d\udc64"}</div>
      <div className="plk-card-info">
        <div className="plk-card-name">{pac.nombre}</div>
        <div className="plk-card-meta">{"DNI: "+(pac.dni||"N/A")+" \u00b7 "+calcAge(pac.fechaNac)+(pac.colegio ? " \u00b7 "+pac.colegio : "")}</div>
      </div>
      <span className="plk-card-action">Seleccionar</span>
    </div>;
  };

  // SELECTED STATE
  if(selected){
    return (
      <div className="plk" style={wrapperStyle}>
        <div className="plk-selected">
          <div className="plk-selected-header">
            <div className="plk-selected-title">{"Paciente seleccionado"}</div>
            <button onClick={clearSelection} className="plk-btn-change">Cambiar</button>
          </div>
          <div className="plk-selected-grid">
            <div className="plk-field">
              <div className="plk-field-label">DNI</div>
              <div className="plk-field-value">{selected.dni||"N/A"}</div>
            </div>
            <div className="plk-field">
              <div className="plk-field-label">Edad</div>
              <div className="plk-field-value">{calcAge(selected.fechaNac)}</div>
            </div>
            <div className="plk-field plk-field--full">
              <div className="plk-field-label">Nombre completo</div>
              <div className="plk-field-value plk-field-value--strong">{selected.nombre}</div>
            </div>
            <div className="plk-field">
              <div className="plk-field-label">Fecha de nacimiento</div>
              <div className="plk-field-value--plain">{selected.fechaNac ? new Date(selected.fechaNac+"T12:00:00").toLocaleDateString("es-AR") : "-"}</div>
            </div>
            <div className="plk-field">
              <div className="plk-field-label">{"Jard\u00edn / Colegio"}</div>
              <div className="plk-field-value--plain">{selected.colegio || "-"}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // UNSELECTED STATE
  return (
    <div className="plk" style={wrapperStyle}>
      {/* Toggle: Buscar / Ver lista */}
      <div className="plk-toggle">
        <button
          onClick={function(){ setMode("search"); }}
          className={"plk-toggle-btn" + (mode==="search" ? " plk-toggle-btn--active" : "")}
        >{"\ud83d\udd0d Buscar paciente"}</button>
        <button
          onClick={function(){ setMode("list"); }}
          className={"plk-toggle-btn" + (mode==="list" ? " plk-toggle-btn--active" : "")}
        >{"\ud83d\udccb Mis pacientes"}</button>
      </div>

      {/* SEARCH MODE */}
      {mode === "search" && <div>
        <label className="plk-label">{"Buscar por DNI o nombre"}</label>
        <div className="plk-search-row">
          <input
            value={searchInput}
            onChange={function(e){ setSearchInput(e.target.value); onSelect(null); }}
            className="plk-input"
            placeholder="Introducir DNI o Nombre y Apellido"
          />
          <button onClick={doSearch} className="plk-btn-search">Buscar</button>
        </div>
        {status==="searching" && <div className="plk-status plk-status--muted">Buscando...</div>}
        {status==="empty" && <div className="plk-status plk-status--error">{"No se encontr\u00f3 paciente. Cargalo primero en la secci\u00f3n Pacientes."}</div>}
        {status==="error" && <div className="plk-status plk-status--error">Error al buscar. Intente nuevamente.</div>}
        {status==="found" && results.length > 0 && !selected && (
          <div className="plk-results">
            <div className="plk-results-count">{results.length === 1 ? "1 paciente encontrado:" : results.length+" pacientes encontrados:"}</div>
            {results.map(renderPatientCard)}
          </div>
        )}
      </div>}

      {/* LIST MODE */}
      {mode === "list" && <div>
        {listLoading && <div className="plk-list-empty">Cargando pacientes...</div>}
        {!listLoading && allPats.length === 0 && <div className="plk-list-empty">{"No ten\u00e9s pacientes registrados. And\u00e1 a la secci\u00f3n Pacientes para cargar uno."}</div>}
        {!listLoading && allPats.length > 0 && <div>
          <div className="plk-list-count">{allPats.length+" paciente"+(allPats.length>1?"s":"")+" registrado"+(allPats.length>1?"s":"")}</div>
          <div className="plk-list-scroll">
            {allPats.map(renderPatientCard)}
          </div>
        </div>}
      </div>}
    </div>
  );
}
