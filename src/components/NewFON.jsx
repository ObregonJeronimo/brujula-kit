// NewFON — Evaluacion Fonetica (repeticion de silabas, seccion 2 del PEFF)
import { useState, useCallback, useEffect } from "react";
import { PEFF_SECTIONS } from "../data/peffSections.js";
import { PF_CATEGORIES, ALL_PROCESSES } from "../data/peffProcesos.js";
import EvalShell from "./EvalShell.jsx";
import { detectProceso } from "../lib/detectProceso.js";
import { db, collection, getDocs } from "../firebase.js";
import "../styles/NewFON.css";

var FON_SECTION_RAW = PEFF_SECTIONS.find(function(s){ return s.id === "fon"; });
// Filter out Vocales and clean titles (remove "X años")
var FON_SECTION = {
  id: FON_SECTION_RAW.id,
  title: FON_SECTION_RAW.title,
  description: FON_SECTION_RAW.description,
  subsections: FON_SECTION_RAW.subsections.filter(function(sub){
    return sub.id !== "sil_2"; // Remove Vocales
  }).map(function(sub){
    return Object.assign({}, sub, {
      title: sub.title.replace(/\s*\d+\s*a\u00f1os?\s*/gi, " ").replace(/^\d+\.\d*\s*/, "").replace(/Fonemas\s*/, "Fonemas ").trim()
    });
  })
};

var sevCalc = function(pct){
  if(pct >= 100) return "Adecuado";
  if(pct >= 85) return "Leve";
  if(pct >= 65) return "Leve-Moderado";
  if(pct >= 50) return "Moderado-Severo";
  return "Severo";
};
var sevColor = {"Adecuado":"#059669","Leve":"#84cc16","Leve-Moderado":"#f59e0b","Moderado-Severo":"#ea580c","Severo":"#dc2626"};
// Versión "soft" para el gradient (equivale al alpha dd del hex original)
var sevColorSoft = {"Adecuado":"#059669dd","Leve":"#84cc16dd","Leve-Moderado":"#f59e0bdd","Moderado-Severo":"#ea580cdd","Severo":"#dc2626dd"};


var config = {
  evalType: "fon",
  title: "Evaluacion Fonetica",
  subtitle: "Repeticion de silabas - produccion fonetica",
  icon: "\ud83d\udde3\ufe0f",
  color: "#6d28d9",
  steps: ["Paciente"].concat(FON_SECTION.subsections.map(function(s){ return s.title.replace(/^\d+\.\d*\s*/,""); })).concat(["Resultados"])
};

function computeResults(responses, obsMap){
  var allItems = FON_SECTION.subsections.flatMap(function(sub){ return sub.items || []; });
  var ok = allItems.filter(function(i){ return responses[i.id] === "ok"; }).length;
  var evaluated = allItems.filter(function(i){ return !!responses[i.id]; }).length;
  var pct = evaluated > 0 ? Math.round(ok / evaluated * 100) : 0;
  var sev = sevCalc(pct);
  // Process analysis from obsMap (proceso fonologico data)
  var procErrors = [];
  Object.keys(obsMap).forEach(function(itemId){
    var pd = obsMap[itemId];
    if(!pd || !pd.proceso) return;
    var proc = ALL_PROCESSES.find(function(p){ return p.id === pd.proceso; });
    var item = allItems.find(function(i){ return i.id === itemId; });
    procErrors.push({ word: item ? item.word : itemId, target: item ? item.target : "", produccion: pd.produccion || "", procesoName: proc ? proc.name : pd.proceso });
  });
  return { ok: ok, total: allItems.length, evaluated: evaluated, pct: pct, severity: sev, procErrors: procErrors };
}

function buildPayloadExtra(responses, obsMap){
  return { seccionData: responses, procesosData: obsMap };
}

export default function NewFON({ onS, nfy, userId, draft, therapistInfo }){
  var _procData = useState({}), procData = _procData[0], setProcData = _procData[1];
  var _savedAudios = useState({}), savedAudios = _savedAudios[0], setSavedAudios = _savedAudios[1];
  var _aiLoading = useState(null), aiLoading = _aiLoading[0], setAiLoading = _aiLoading[1];
  var _aiSuggestion = useState({}), aiSuggestion = _aiSuggestion[0], setAiSuggestion = _aiSuggestion[1];

  var suggestProceso = function(itemId, word, production, errorType){
    setAiLoading(itemId);
    fetch("/api/suggest-proceso", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({word: word, production: production, errorType: errorType})
    }).then(function(r){ return r.json(); })
    .then(function(data){
      setAiLoading(null);
      if(data.success && data.suggestion){
        setAiSuggestion(function(prev){ var n = Object.assign({},prev); n[itemId] = data.suggestion; return n; });
        // Auto-seleccionar el proceso sugerido
        var sug = data.suggestion;
        var matchId = findProcesoId(sug.proceso);
        if(matchId){
          spfGlobal(itemId, "proceso", matchId);
          spfGlobal(itemId, "autoDetected", true);
          spfGlobal(itemId, "manualProceso", false);
        }
      } else {
        nfy("No se pudo obtener sugerencia","er");
      }
    }).catch(function(e){
      setAiLoading(null);
      nfy("Error: "+e.message,"er");
    });
  };

  // Buscar el ID del proceso por nombre (fuzzy match)
  var findProcesoId = function(name){
    if(!name) return null;
    var lower = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    var all = PF_CATEGORIES.flatMap(function(c){ return c.processes; });
    // Exact match first
    var exact = all.find(function(p){ return p.name.toLowerCase() === name.toLowerCase(); });
    if(exact) return exact.id;
    // Fuzzy match
    var fuzzy = all.find(function(p){
      var pLower = p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
      return pLower.indexOf(lower) >= 0 || lower.indexOf(pLower) >= 0;
    });
    return fuzzy ? fuzzy.id : null;
  };

  // spf global (fuera de renderEval)
  var spfGlobal = function(itemId, field, val){
    setProcData(function(prev){ var n = Object.assign({}, prev); if(!n[itemId]) n[itemId] = {}; n[itemId][field] = val; return n; });
  };

  // Cargar audios guardados de Firestore al montar
  useEffect(function(){
    getDocs(collection(db,"fon_audios")).then(function(snap){
      var audios = {};
      snap.docs.forEach(function(d){ audios[d.id] = d.data().audio; });
      setSavedAudios(audios);
    }).catch(function(){ setSavedAudios({}); });
  },[]);

  // Reproducir audio guardado
  var playWord = function(word){
    var key = word.toLowerCase();
    if(savedAudios[key]){
      new Audio(savedAudios[key]).play().catch(function(){});
    }
  };

  var renderEval = useCallback(function(props){
    var subIdx = props.step - 1;
    if(subIdx < 0 || subIdx >= FON_SECTION.subsections.length) return null;
    var sub = FON_SECTION.subsections[subIdx];
    var items = sub.items || [];

    var spf = function(itemId, field, val){
      setProcData(function(prev){ var n = Object.assign({}, prev); if(!n[itemId]) n[itemId] = {}; n[itemId][field] = val; props.setOb(itemId, n[itemId]); return n; });
    };

    var legendItems = [
      {v:"\u2713", cls:"fon-legend-badge fon-legend-badge--ok", t:"Correcto"},
      {v:"D", cls:"fon-legend-badge fon-legend-badge--d", t:"Distorsion"},
      {v:"O", cls:"fon-legend-badge fon-legend-badge--o", t:"Omision"},
      {v:"S", cls:"fon-legend-badge fon-legend-badge--s", t:"Sustitucion"}
    ];

    // Mapeo v -> clase active del botón de respuesta
    var respBtnActiveClass = { "ok":"fon-resp-btn--ok-active", "D":"fon-resp-btn--d-active", "O":"fon-resp-btn--o-active", "S":"fon-resp-btn--s-active" };

    return <div className="fon">
      <h3 className="fon-title">{sub.title}</h3>
      {sub.description && <p className="fon-desc">{sub.description}</p>}

      {/* Legend */}
      <div className="fon-legend">
        <div className="fon-legend-row">
          {legendItems.map(function(o){ return <div key={o.v} className="fon-legend-item">
            <div className={o.cls}>{o.v}</div>
            <span className="fon-legend-text">{o.t}</span>
          </div>; })}
        </div>
      </div>

      {items.map(function(item){
        var v = props.responses[item.id] || "";
        var isError = v==="D"||v==="O"||v==="S";
        var pd = procData[item.id] || {};

        var headCls = "fon-item-head";
        if(isError) headCls += " fon-item-head--error";
        else if(v==="ok") headCls += " fon-item-head--ok";

        return <div key={item.id} className={"fon-item" + (isError ? " fon-item--error" : "")}>
          <div className={headCls}>
            {savedAudios[item.word.toLowerCase()]
              ? <button onClick={function(){playWord(item.word)}} className="fon-btn-audio">{"\ud83d\udd0a Escuchar"}</button>
              : <span className="fon-no-audio">{"Sin audio"}</span>}
            <span className="fon-word">{item.word}</span>
            <span className="fon-target">{item.target}</span>
            <div className="fon-resp-row">
              {[{v:"ok",l:"\u2713"},{v:"D",l:"D"},{v:"O",l:"O"},{v:"S",l:"S"}].map(function(o){
                var btnCls = "fon-resp-btn" + (v===o.v ? " " + respBtnActiveClass[o.v] : "");
                return <button
                  key={o.v}
                  onClick={function(){
                    props.setResponse(item.id, v===o.v ? "" : o.v);
                    if(o.v==="ok") setProcData(function(p){var n=Object.assign({},p);delete n[item.id];return n});
                  }}
                  className={btnCls}
                >{o.l}</button>;
              })}
            </div>
          </div>
          {isError && <div className="fon-err-panel">
            <div className="fon-err-row">
              <div className="fon-err-col-prod">
                <label className="fon-err-label">{"Produccion del paciente"}</label>
                <input
                  value={pd.produccion||""}
                  onChange={function(e){
                    var val = e.target.value;
                    spf(item.id,"produccion",val);
                    // Auto-detect proceso fonológico
                    var detected = detectProceso(item.word, val, v);
                    if(detected && !(pd.proceso && pd.manualProceso)){
                      spf(item.id,"proceso",detected);
                      spf(item.id,"autoDetected",true);
                    }
                  }}
                  className="fon-input-sm"
                  placeholder={"Que dijo en vez de "+item.word}
                />
              </div>
              <div className="fon-err-col-proc">
                <label className="fon-err-label">
                  {"Proceso fonologico"}
                  {pd.autoDetected && !pd.manualProceso && <span className="fon-auto-badge">{"auto-detectado"}</span>}
                </label>
                <div className="fon-proc-row">
                  <button
                    onClick={function(){
                      if(!pd.produccion) { nfy("Escrib\u00ed primero qu\u00e9 dijo el paciente","er"); return; }
                      suggestProceso(item.id, item.word, pd.produccion, v);
                    }}
                    disabled={aiLoading===item.id}
                    title={!pd.produccion?"Escrib\u00ed qu\u00e9 dijo el paciente para sugerir":"Sugerir proceso fonol\u00f3gico con IA"}
                    className={
                      "fon-btn-ai"
                      + (aiLoading===item.id ? " fon-btn-ai--loading" : "")
                      + (!pd.produccion && aiLoading!==item.id ? " fon-btn-ai--disabled" : "")
                    }
                  >{aiLoading===item.id ? "\u23f3 Analizando..." : "\ud83e\udd16 Sugerir"}</button>
                  <select
                    value={pd.proceso||""}
                    onChange={function(e){
                      spf(item.id,"proceso",e.target.value);
                      spf(item.id,"manualProceso",true);
                      spf(item.id,"autoDetected",false);
                      setAiSuggestion(function(prev){var n=Object.assign({},prev);delete n[item.id];return n});
                    }}
                    className={"fon-select-sm" + (pd.autoDetected && !pd.manualProceso ? " fon-select-sm--auto" : "")}
                  >
                    <option value="">-- Clasificar --</option>
                    {PF_CATEGORIES.map(function(cat){ return <optgroup key={cat.id} label={cat.title}>
                      {cat.processes.map(function(pr){ return <option key={pr.id} value={pr.id}>{pr.name}</option>; })}
                    </optgroup>; })}
                  </select>
                </div>
                {aiSuggestion[item.id] && !pd.manualProceso && <div className="fon-ai-suggestion">{"\ud83e\udd16 "+aiSuggestion[item.id].explicacion+" ("+(aiSuggestion[item.id].confianza)+")"}</div>}
              </div>
            </div>
          </div>}
        </div>;
      })}

      <div className="fon-nav">
        <button onClick={function(){ props.setStep(props.step-1); props.scrollTop(); }} className="fon-btn-back">{"Atras"}</button>
        <button onClick={function(){ props.setStep(props.step+1); props.scrollTop(); }} className="fon-btn-next">{props.step < props.RESULT_STEP - 1 ? "Siguiente" : "Ver Resultados"}</button>
      </div>
    </div>;
  },[procData, savedAudios, aiLoading, aiSuggestion]);

  var renderTechDetails = function(results){
    var sc = sevColor[results.severity] || "#6d28d9";
    var scSoft = sevColorSoft[results.severity] || "#6d28d9dd";
    var sevStyle = { "--fon-sev": sc, "--fon-sev-soft": scSoft };
    return <div className="fon fon-tech">
      <div className="fon-severity" style={sevStyle}>
        <div className="fon-severity-label">Severidad PCC</div>
        <div className="fon-severity-value">{results.severity}</div>
        <div className="fon-severity-stats">{results.ok + "/" + results.evaluated + " correctos (" + results.pct + "%)"}</div>
      </div>
      {results.procErrors.length > 0 && <div className="fon-errors-card">
        <div className="fon-errors-title">{"Errores identificados (" + results.procErrors.length + ")"}</div>
        {results.procErrors.map(function(e,i){
          return <div key={i} className="fon-error-row">
            <b>{e.word}</b>{" (" + e.target + ") -> " + e.produccion + " | " + e.procesoName}
          </div>;
        })}
      </div>}
    </div>;
  };

  return <EvalShell
    onS={onS} nfy={nfy} userId={userId}
    config={config}
    renderEval={renderEval}
    computeResults={computeResults}
    buildPayloadExtra={buildPayloadExtra}
    renderTechDetails={renderTechDetails}
    draft={draft} therapistInfo={therapistInfo}
  />;
}
