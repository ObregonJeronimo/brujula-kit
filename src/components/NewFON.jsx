// NewFON — Evaluacion Fonetica (repeticion de silabas, seccion 2 del PEFF)
import { useState, useCallback } from "react";
import { PEFF_SECTIONS } from "../data/peffSections.js";
import { PF_CATEGORIES, ALL_PROCESSES } from "../data/peffProcesos.js";
import EvalShell from "./EvalShell.jsx";
import { detectProceso } from "../lib/detectProceso.js";

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
var I = {width:"100%",padding:"10px 14px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,background:"#f8faf9"};
var speak = function(text){
  if(!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  var u = new SpeechSynthesisUtterance(text);
  u.lang = "es-AR"; u.rate = 0.7; u.pitch = 1.05; u.volume = 1;
  var voices = window.speechSynthesis.getVoices();
  var pick = voices.find(function(v){return /es[-_]AR/i.test(v.lang) && /Google|Microsoft/i.test(v.name)})
    || voices.find(function(v){return /es[-_](AR|MX|ES)/i.test(v.lang) && /Google|Microsoft/i.test(v.name)})
    || voices.find(function(v){return /es[-_]AR/i.test(v.lang)})
    || voices.find(function(v){return /es[-_]MX/i.test(v.lang)})
    || voices.find(function(v){return /es[-_]ES/i.test(v.lang)})
    || voices.find(function(v){return v.lang.startsWith("es")});
  if(pick) u.voice = pick;
  window.speechSynthesis.speak(u);
};

var sevCalc = function(pct){
  if(pct >= 100) return "Adecuado";
  if(pct >= 85) return "Leve";
  if(pct >= 65) return "Leve-Moderado";
  if(pct >= 50) return "Moderado-Severo";
  return "Severo";
};
var sevColor = {"Adecuado":"#059669","Leve":"#84cc16","Leve-Moderado":"#f59e0b","Moderado-Severo":"#ea580c","Severo":"#dc2626"};


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

  var renderEval = useCallback(function(props){
    var subIdx = props.step - 1;
    if(subIdx < 0 || subIdx >= FON_SECTION.subsections.length) return null;
    var sub = FON_SECTION.subsections[subIdx];
    var items = sub.items || [];

    var spf = function(itemId, field, val){
      setProcData(function(prev){ var n = Object.assign({}, prev); if(!n[itemId]) n[itemId] = {}; n[itemId][field] = val; props.setOb(itemId, n[itemId]); return n; });
    };

    var legendItems = [
      {v:"\u2713",bg:"#059669",t:"Correcto"},{v:"D",bg:"#f59e0b",t:"Distorsion"},
      {v:"O",bg:"#dc2626",t:"Omision"},{v:"S",bg:"#7c3aed",t:"Sustitucion"}
    ];

    return <div>
      <h3 style={{fontSize:16,fontWeight:700,color:"#6d28d9",marginBottom:4}}>{sub.title}</h3>
      {sub.description && <p style={{fontSize:12,color:"#64748b",marginBottom:12}}>{sub.description}</p>}

      {/* Legend */}
      <div style={{background:"#ede9fe",border:"1px solid #c4b5fd",borderRadius:10,padding:12,marginBottom:16}}>
        <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          {legendItems.map(function(o){ return <div key={o.v} style={{display:"flex",alignItems:"center",gap:4}}>
            <div style={{width:22,height:22,borderRadius:5,background:o.bg,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}}>{o.v}</div>
            <span style={{fontSize:11}}>{o.t}</span>
          </div>; })}
        </div>
      </div>

      {items.map(function(item){
        var v = props.responses[item.id] || "";
        var isError = v==="D"||v==="O"||v==="S";
        var pd = procData[item.id] || {};
        return <div key={item.id} style={{marginBottom:isError?12:4}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",background:isError?"#fef2f2":v==="ok"?"#f0fdf4":"#fff",borderRadius:isError?"8px 8px 0 0":8,border:"1px solid "+(isError?"#fecaca":v==="ok"?"#bbf7d0":"#e2e8f0")}}>
            <button onClick={function(){speak(item.word)}} style={{background:"#ede9fe",border:"1px solid #c4b5fd",borderRadius:6,padding:"4px 8px",fontSize:12,cursor:"pointer",color:"#6d28d9"}}>{"Escuchar"}</button>
            <span style={{fontWeight:700,fontSize:16,minWidth:50,color:"#6d28d9"}}>{item.word}</span>
            <span style={{fontSize:12,color:"#64748b",flex:1}}>{item.target}</span>
            <div style={{display:"flex",gap:4}}>
              {[{v:"ok",l:"\u2713",bg:"#059669"},{v:"D",l:"D",bg:"#f59e0b"},{v:"O",l:"O",bg:"#dc2626"},{v:"S",l:"S",bg:"#7c3aed"}].map(function(o){
                return <button key={o.v} onClick={function(){props.setResponse(item.id, v===o.v ? "" : o.v); if(o.v==="ok") setProcData(function(p){var n=Object.assign({},p);delete n[item.id];return n})}} style={{width:30,height:30,borderRadius:6,border:v===o.v?"2px solid "+o.bg:"1px solid #e2e8f0",background:v===o.v?o.bg:"#fff",color:v===o.v?"#fff":"#64748b",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{o.l}</button>;
              })}
            </div>
          </div>
          {isError && <div style={{background:"#fff5f5",border:"1px solid #fecaca",borderTop:"none",borderRadius:"0 0 8px 8px",padding:"10px 14px"}}>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:180}}>
                <label style={{fontSize:10,fontWeight:700,color:"#dc2626",display:"block",marginBottom:3}}>{"Produccion del paciente"}</label>
                <input value={pd.produccion||""} onChange={function(e){
                  var val = e.target.value;
                  spf(item.id,"produccion",val);
                  // Auto-detect proceso fonológico
                  var detected = detectProceso(item.word, val, v);
                  if(detected && !(pd.proceso && pd.manualProceso)){
                    spf(item.id,"proceso",detected);
                    spf(item.id,"autoDetected",true);
                  }
                }} style={Object.assign({},I,{fontSize:13,padding:"6px 10px",background:"#fff"})} placeholder={"Que dijo en vez de "+item.word}/>
              </div>
              <div style={{flex:2,minWidth:220}}>
                <label style={{fontSize:10,fontWeight:700,color:"#dc2626",display:"block",marginBottom:3}}>
                  {"Proceso fonologico"}
                  {pd.autoDetected && !pd.manualProceso && <span style={{marginLeft:6,fontSize:9,color:"#7c3aed",background:"#ede9fe",padding:"1px 6px",borderRadius:4,fontWeight:600}}>{"auto-detectado"}</span>}
                </label>
                <select value={pd.proceso||""} onChange={function(e){spf(item.id,"proceso",e.target.value);spf(item.id,"manualProceso",true);spf(item.id,"autoDetected",false)}} style={Object.assign({},I,{fontSize:13,padding:"6px 10px",background:pd.autoDetected&&!pd.manualProceso?"#f5f3ff":"#fff",cursor:"pointer",borderColor:pd.autoDetected&&!pd.manualProceso?"#a78bfa":"#e2e8f0"})}>
                  <option value="">-- Clasificar --</option>
                  {PF_CATEGORIES.map(function(cat){ return <optgroup key={cat.id} label={cat.title}>
                    {cat.processes.map(function(pr){ return <option key={pr.id} value={pr.id}>{pr.name}</option>; })}
                  </optgroup>; })}
                </select>
              </div>
            </div>
          </div>}
        </div>;
      })}

      <div style={{display:"flex",justifyContent:"space-between",marginTop:20,paddingTop:14,borderTop:"1px solid #e2e8f0"}}>
        <button onClick={function(){ props.setStep(props.step-1); props.scrollTop(); }} style={{background:"#f1f5f9",border:"none",padding:"10px 22px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{"Atras"}</button>
        <button onClick={function(){ props.setStep(props.step+1); props.scrollTop(); }} style={{background:"#6d28d9",color:"#fff",border:"none",padding:"10px 22px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{props.step < props.RESULT_STEP - 1 ? "Siguiente" : "Ver Resultados"}</button>
      </div>
    </div>;
  },[procData]);

  var renderTechDetails = function(results){
    var sc = sevColor[results.severity] || "#6d28d9";
    return <div style={{marginBottom:16}}>
      <div style={{background:"linear-gradient(135deg,"+sc+"dd,"+sc+")",borderRadius:12,padding:24,color:"#fff",marginBottom:16}}>
        <div style={{fontSize:13,opacity:.8,marginBottom:4}}>Severidad PCC</div>
        <div style={{fontSize:36,fontWeight:700}}>{results.severity}</div>
        <div style={{fontSize:13,opacity:.9}}>{results.ok + "/" + results.evaluated + " correctos (" + results.pct + "%)"}</div>
      </div>
      {results.procErrors.length > 0 && <div style={{background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:20}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:10}}>{"Errores identificados (" + results.procErrors.length + ")"}</div>
        {results.procErrors.map(function(e,i){
          return <div key={i} style={{padding:"8px 12px",background:"#fef2f2",borderRadius:8,marginBottom:4,fontSize:13}}>
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
