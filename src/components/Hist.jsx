import { useState } from "react";
import { isVisibleType, typeBadge, HIST_TABS } from "../config/evalTypes.js";
import { K, ageLabel } from "../lib/fb.js";
import "../styles/Hist.css";

export default function Hist({ TC, allEvals, onView, isA, onD, enabledTools, pacientes }) {
  var _q = useState(""), q = _q[0], sQ = _q[1];
  var _tab = useState("all"), tab = _tab[0], sTab = _tab[1];
  var _cf = useState(null), cf = _cf[0], sC = _cf[1];
  var _mode = useState("search"), searchMode = _mode[0], setSearchMode = _mode[1];
  var _selPat = useState(null), selPatient = _selPat[0], setSelPatient = _selPat[1];

  var all = (allEvals || []).filter(function(e){ return isVisibleType(e.tipo); })
    .sort(function(a, b){ return (b.fechaGuardado || "").localeCompare(a.fechaGuardado || ""); });

  // Contar evaluaciones por paciente (por DNI y por nombre normalizado)
  var evalsByDni = {};
  var evalsByName = {};
  all.forEach(function(e){
    var dni = e.pacienteDni || e.dni || "";
    var name = (e.paciente||"").toLowerCase().trim();
    if(dni) evalsByDni[dni] = (evalsByDni[dni] || 0) + 1;
    if(name) evalsByName[name] = (evalsByName[name] || 0) + 1;
  });

  // Lista de pacientes REGISTRADOS
  var patientsList = [];
  if(pacientes && pacientes.length > 0){
    patientsList = pacientes.map(function(p){
      // Preferir DNI si existe, sino caer en nombre
      var count = 0;
      if(p.dni && evalsByDni[p.dni]) count = evalsByDni[p.dni];
      else if(p.nombre) count = evalsByName[(p.nombre||"").toLowerCase().trim()] || 0;
      return { nombre: p.nombre, dni: p.dni || "", count: count };
    }).sort(function(a,b){ return a.nombre.localeCompare(b.nombre); });
  } else {
    // Fallback: agrupar por nombre normalizado
    var patientsMap = {};
    all.forEach(function(e){
      if(!e.paciente) return;
      var key = e.paciente.toLowerCase().trim();
      if(!patientsMap[key]) patientsMap[key] = { nombre: e.paciente, dni: e.pacienteDni||e.dni||"", count: 0 };
      patientsMap[key].count++;
    });
    patientsList = Object.values(patientsMap).sort(function(a,b){ return a.nombre.localeCompare(b.nombre); });
  }

  var f = all.filter(function(e){
    if(searchMode === "search" && q && !(e.paciente || "").toLowerCase().includes(q.toLowerCase())) return false;
    if(searchMode === "list" && selPatient){
      // Comparar primero por DNI si existe, sino por nombre (case-insensitive)
      var selDni = selPatient.dni || "";
      var evDni = e.pacienteDni || e.dni || "";
      var evName = (e.paciente||"").toLowerCase().trim();
      var selName = (selPatient.nombre||"").toLowerCase().trim();
      if(selDni && evDni){
        if(selDni !== evDni) return false;
      } else {
        if(evName !== selName) return false;
      }
    }
    if(tab !== "all" && e.tipo !== tab) return false;
    return true;
  });

  return (
    <div className="hist-page">
      <h1 className="hist-title">Historial</h1>
      <p className="hist-count">{all.length+" evaluaciones"}</p>
      <div className="hist-tabs">
        {HIST_TABS.filter(function(x){ return x[0]==="all" || !enabledTools || enabledTools[x[0]]!==false; }).map(function(x){
          var id=x[0], lb=x[1];
          return <button key={id} onClick={function(){sTab(id)}} className={"hist-tab"+(tab===id?" hist-tab--active":"")}>{lb}</button>;
        })}
      </div>
      <div className="hist-mode-row">
        <div className="hist-mode-switch">
          <button onClick={function(){setSearchMode("search");setSelPatient(null);}} className={"hist-mode-btn"+(searchMode==="search"?" hist-mode-btn--active":"")}>{"Buscar"}</button>
          <button onClick={function(){setSearchMode("list");sQ("");}} className={"hist-mode-btn"+(searchMode==="list"?" hist-mode-btn--active":"")}>{"Pacientes"}</button>
        </div>
        {searchMode==="search" && <input value={q} onChange={function(e){sQ(e.target.value)}} placeholder="Buscar paciente..." className="hist-search" />}
        {searchMode==="list" && <div className="hist-patients">
          <div className="hist-patients-box">
            {selPatient && <button onClick={function(){setSelPatient(null)}} className="hist-patients-clear">{"\u2715 Mostrar todos"}</button>}
            {patientsList.map(function(p){
              var active = selPatient && (selPatient.dni ? selPatient.dni===p.dni : selPatient.nombre===p.nombre);
              return <button key={p.dni||p.nombre} onClick={function(){setSelPatient(active?null:p)}} className={"hist-patient-item"+(active?" hist-patient-item--active":"")}>
                <span>{p.nombre}</span>
                <span className="hist-patient-count">{p.count+(p.count===1?" eval":" evals")}</span>
              </button>;
            })}
            {patientsList.length===0 && <div className="hist-patients-empty">Sin pacientes</div>}
          </div>
        </div>}
      </div>
      {f.length === 0 ? <div className="hist-empty">Sin resultados.</div> :
        <div className="hist-list">
          {f.map(function(ev){
            var bg = typeBadge(ev.tipo);
            return (
              <div key={ev._fbId||ev.id} className="hist-item">
                <div onClick={function(){if(onView)onView(ev)}} className="hist-item-info">
                  <div className="hist-item-title-row">
                    <span className="hist-item-badge" style={{background:bg.b,color:bg.c}}>{bg.l}</span>
                    <span className="hist-item-name">{ev.paciente}</span>
                  </div>
                  <div className="hist-item-meta">
                    {new Date(ev.fechaGuardado).toLocaleDateString("es-CL")+" \u00b7 "+ageLabel(ev.edadMeses)}{ev.evaluador?(" \u00b7 "+ev.evaluador):""}
                  </div>
                </div>
                <div className="hist-item-actions">
                  {ev.resultados && (ev.resultados.severity || ev.resultados.pct != null) && <span className="hist-item-score" style={{background:bg.b,color:bg.c}}>{ev.resultados.severity||(ev.resultados.pct+"%")}</span>}
                  {isA && (cf === (ev._fbId||ev.id) ?
                    <div className="hist-del-confirm">
                      <button onClick={function(){onD(ev._fbId); sC(null);}} className="hist-del-yes">¿Sí?</button>
                      <button onClick={function(){sC(null)}} className="hist-del-no">No</button>
                    </div> :
                    <button onClick={function(){sC(ev._fbId||ev.id)}} className="hist-del-btn">Eliminar</button>)}
                  <span onClick={function(){if(onView)onView(ev)}} className="hist-item-arrow">→</span>
                </div>
              </div>);
          })}
        </div>}
    </div>
  );
}
