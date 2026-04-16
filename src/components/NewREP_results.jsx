// NewREP Results — saves directly to Firestore, shows AI report via AIReportPanel
import { useState, useEffect, useRef } from "react";
import { ageLabel } from "./NewREP_logic.js";
import { fbAdd } from "../lib/fb.js";
import AIReportPanel from "./AIReportPanel.jsx";
import "../styles/NewREP_results.css";

var posLabels = {ISPP:"Inicio de palabra",ISIP:"Medio de palabra",CSIP:"Coda media",CSFP:"Final de palabra"};
var posFull = {ISPP:"Consonante al inicio de la palabra",ISIP:"Consonante en el interior de la palabra",CSIP:"Consonante cerrando silaba en medio de palabra",CSFP:"Consonante cerrando silaba al final de palabra"};

// Determina la clase de rango según el porcentaje
function pctRange(pct){ return pct>=85 ? "is-good" : pct>=65 ? "is-warn" : "is-bad"; }

export default function NewREPResults({ results, patientAge, obs, onBack, onFinish, patient, evalDate, derivado, userId, nfy, therapistInfo }){
  var _saved = useState(false), saved = _saved[0], setSaved = _saved[1];
  var _savedDocId = useState(null), savedDocId = _savedDocId[0], setSavedDocId = _savedDocId[1];
  var docIdRef = useRef(null);
  var _showTech = useState(false), showTech = _showTech[0], setShowTech = _showTech[1];

  if(!results) return null;

  // Direct save to Firestore on mount
  useEffect(function(){
    if(!saved){
      var payload = {
        id: Date.now()+"", userId: userId, tipo: "rep",
        paciente: patient ? patient.nombre : "", pacienteDni: patient ? (patient.dni||"") : "",
        fechaNacimiento: patient ? (patient.fechaNac||"") : "", edadMeses: patientAge,
        fechaEvaluacion: evalDate||"", derivadoPor: derivado||"", observaciones: obs||"",
        evaluador: "", fechaGuardado: new Date().toISOString(),
        resultados: results
      };
      fbAdd("evaluaciones", payload).then(function(r){
        if(r.success){ docIdRef.current = r.id; setSavedDocId(r.id); if(nfy) nfy("Evaluación guardada","ok"); }
        else if(nfy) nfy("Error: "+(r.error||""),"er");
      });
      setSaved(true);
    }
  }, []);

  var sevColor = results.pcc===100?"#059669":results.pcc>=85?"#059669":results.pcc>=65?"#d97706":results.pcc>=50?"#ea580c":"#dc2626";

  return (
    <div>
      <div className="new-rep-res-saved"><span className="new-rep-res-saved-icon">{"\u2705"}</span><span className="new-rep-res-saved-text">{"Evaluación guardada correctamente."}</span></div>

      <AIReportPanel ev={{_fbId:docIdRef.current,paciente:patient?patient.nombre:"",pacienteDni:patient?(patient.dni||""):"",edadMeses:patientAge||0,fechaEvaluacion:evalDate||"",derivadoPor:derivado||"",observaciones:obs||"",resultados:results}} evalType="rep" collectionName="evaluaciones" evalLabel="Repeticion de Palabras" autoGenerate={true} therapistInfo={therapistInfo} />

      <button onClick={function(){ setShowTech(!showTech); }} className={"new-rep-res-tech-toggle"+(showTech?" is-open":"")}>{showTech?"\u25b2 Ocultar datos técnicos":"\u25bc Ver datos técnicos de la evaluación"}</button>

      {showTech && <div>
        <div className="new-rep-res-stats">
          <div className="new-rep-res-stat"><div className="new-rep-res-stat-pcc">{results.pcc+"%"}</div><div className="new-rep-res-stat-label">PCC</div></div>
          <div className="new-rep-res-stat"><div className="new-rep-res-stat-sev" style={{"--new-rep-res-sev":sevColor}}>{results.severity}</div><div className="new-rep-res-stat-label">Severidad</div></div>
          <div className="new-rep-res-stat"><div className="new-rep-res-stat-correct">{results.totalCorrect+"/"+results.totalEvaluated}</div><div className="new-rep-res-stat-label">Correctos</div><div className="new-rep-res-stat-sub">{results.totalErrors+" errores"}</div></div>
        </div>
        <div className="new-rep-res-card">
          <h3 className="new-rep-res-card-title">{"Distribución por posición"}</h3>
          <div className="new-rep-res-pos-grid">{["ISPP","ISIP","CSIP","CSFP"].map(function(posId){ var p=results.byPosition[posId]||{ok:0,err:0,total:0},pct=p.total>0?Math.round((p.ok/p.total)*100):0,clr=p.total===0?"#cbd5e1":pct>=85?"#059669":pct>=65?"#d97706":"#dc2626"; return <div key={posId} className="new-rep-res-pos"><div className="new-rep-res-pos-label">{posLabels[posId]}</div><div className="new-rep-res-pos-full">{posFull[posId]}</div>{p.total>0?<div><div className="new-rep-res-pos-pct" style={{"--new-rep-res-pos-clr":clr}}>{pct+"%"}</div><div className="new-rep-res-pos-count">{p.ok+"/"+p.total}</div></div>:<div className="new-rep-res-pos-empty">{"Sin items"}</div>}</div>; })}</div>
        </div>
        <div className="new-rep-res-card">
          <h3 className="new-rep-res-card-title">{"Por categoría"}</h3>
          <table className="new-rep-res-tbl"><thead><tr><th className="is-left">{"Categoría"}</th><th className="is-center">OK</th><th className="is-center">Err</th><th className="is-center">Total</th><th className="is-center">%</th></tr></thead><tbody>{Object.values(results.byCat).map(function(c){ var pct=c.total>0?Math.round((c.ok/c.total)*100):0; return <tr key={c.title}><td className="is-bold">{c.title}</td><td className="is-center is-ok">{c.ok}</td><td className={"is-center is-bold "+(c.errors>0?"is-err":"is-ok")}>{c.errors}</td><td className="is-center">{c.total}</td><td className="is-center"><span className={"new-rep-res-pct-badge "+pctRange(pct)}>{pct+"%"}</span></td></tr>; })}</tbody></table>
        </div>
        <div className="new-rep-res-card">
          <h3 className="new-rep-res-card-title">{"Por fonema"}</h3>
          <table className="new-rep-res-tbl new-rep-res-tbl--sm"><thead><tr><th className="is-left is-sm-pad">Fonema</th><th className="is-center is-xs-pad">Edad</th><th className="is-center is-xs-pad is-ok-color">{"\u2713"}</th><th className="is-center is-xs-pad is-err-color">Err</th><th className="is-center is-xs-pad">Total</th><th className="is-center is-xs-pad">Estado</th></tr></thead><tbody>{Object.entries(results.byPhoneme).map(function(e){ var id=e[0],ph=e[1],has=ph.errors>0,exp=(patientAge/12)>=ph.age; return <tr key={id} className={has&&exp?"is-err-row":""}><td className="is-sm-pad is-bold-strong">{ph.phoneme}</td><td className="is-center is-xs-pad is-muted-sm">{ph.age+"a"}</td><td className="is-center is-xs-pad is-ok">{ph.ok||"-"}</td><td className={"is-center is-xs-pad is-bold "+(ph.errors>0?"is-err":"is-neutral")}>{ph.errors||"-"}</td><td className="is-center is-xs-pad">{ph.total}</td><td className="is-center is-xs-pad">{has&&exp&&<span className="new-rep-res-phon-badge is-altered">ALTERADO</span>}{has&&!exp&&<span className="new-rep-res-phon-badge is-developing">EN DESARROLLO</span>}{!has&&<span className="new-rep-res-phon-badge is-adequate">ADECUADO</span>}</td></tr>; })}</tbody></table>
        </div>
        {results.errorList.length>0 && <div className="new-rep-res-err-card">
          <h3 className="new-rep-res-err-title">{"\u26a0 Errores ("+results.errorList.length+")"}</h3>
          <table className="new-rep-res-tbl new-rep-res-tbl--sm"><thead><tr className="has-err-bg"><th className="is-left is-sm-pad">Fonema</th><th className="is-left is-sm-pad">Palabra</th><th className="is-center is-xs-pad">Pos</th><th className="is-left is-sm-pad">{"Prod."}</th></tr></thead><tbody>{results.errorList.map(function(err,i){ var exp=(patientAge/12)>=err.age; return <tr key={i} className={exp?"is-err-row":"is-warn-row"}><td className="is-sm-pad is-accent">{err.phoneme}</td><td className="is-sm-pad">{err.word}</td><td className="is-center is-xs-pad is-muted-sm">{err.posId}</td><td className="is-sm-pad is-err">{err.produccion}</td></tr>; })}</tbody></table>
        </div>}
        {(function(){ var alt=Object.entries(results.byPhoneme).filter(function(e){return e[1].errors>0&&(patientAge/12)>=e[1].age;}); if(alt.length===0) return <div className="new-rep-res-ok-card"><span className="new-rep-res-ok-icon">{"\u2705"}</span><p className="new-rep-res-ok-text">{"Fonemas adecuados."}</p></div>; return <div className="new-rep-res-alt-card"><h3 className="new-rep-res-alt-title">{"\u26a0 Fonemas alterados"}</h3><div className="new-rep-res-alt-list">{alt.map(function(e){var ph=e[1]; return <div key={e[0]} className="new-rep-res-alt-chip"><span className="new-rep-res-alt-phoneme">{ph.phoneme}</span><span className="new-rep-res-alt-count">{ph.errors+" err"}</span>{ph.errorWords.length>0&&<div className="new-rep-res-alt-words">{ph.errorWords.map(function(ew){return ew.word+"\u2192"+ew.produccion}).join(", ")}</div>}</div>;})}</div></div>; })()}
        {obs&&<div className="new-rep-res-obs-card"><h3 className="new-rep-res-obs-title">Observaciones</h3><p className="new-rep-res-obs-text">{obs}</p></div>}
      </div>}

      <button onClick={function(){if(onFinish)onFinish();else if(onBack)onBack();}} className="new-rep-res-finish">{"Finalizar \u2713"}</button>
    </div>
  );
}
