// NewREP Results — saves directly to Firestore, shows AI report via AIReportPanel
import { useState, useEffect, useRef } from "react";
import { ageLabel } from "./NewREP_logic.js";
import { fbAdd, K } from "../lib/fb.js";
import AIReportPanel from "./AIReportPanel.jsx";

var posLabels = {ISPP:"ISPP",ISIP:"ISIP",CSIP:"CSIP",CSFP:"CSFP"};
var posFull = {ISPP:"Inicio síl. — Pos. palabra",ISIP:"Inicio síl. — Int. palabra",CSIP:"Coda síl. — Int. palabra",CSFP:"Coda síl. — Final palabra"};

export default function NewREPResults({ results, patientAge, obs, onBack, onFinish, patient, evalDate, derivado, userId, nfy }){
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
      <div style={{background:"#dcfce7",borderRadius:10,padding:"12px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18}}>{"\u2705"}</span><span style={{fontSize:13,fontWeight:600,color:"#059669"}}>{"Evaluación guardada correctamente."}</span></div>

      <AIReportPanel ev={{_fbId:docIdRef.current,paciente:patient?patient.nombre:"",pacienteDni:patient?(patient.dni||""):"",edadMeses:patientAge||0,fechaEvaluacion:evalDate||"",derivadoPor:derivado||"",observaciones:obs||"",resultados:results}} evalType="rep" collectionName="evaluaciones" evalLabel="Repetición de Palabras" autoGenerate={true} />

      <button onClick={function(){ setShowTech(!showTech); }} style={{width:"100%",padding:"14px",background:showTech?"#f1f5f9":"#0a3d2f",color:showTech?"#1e293b":"#fff",border:"1px solid #e2e8f0",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",marginBottom:showTech?16:20}}>{showTech?"\u25b2 Ocultar datos técnicos":"\u25bc Ver datos técnicos de la evaluación"}</button>

      {showTech && <div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
          <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,textAlign:"center"}}><div style={{fontSize:32,fontWeight:800,color:K.ac}}>{results.pcc+"%"}</div><div style={{fontSize:12,color:K.mt,fontWeight:600}}>PCC</div></div>
          <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,textAlign:"center"}}><div style={{fontSize:24,fontWeight:700,color:sevColor}}>{results.severity}</div><div style={{fontSize:12,color:K.mt,fontWeight:600}}>Severidad</div></div>
          <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,textAlign:"center"}}><div style={{fontSize:24,fontWeight:700,color:K.sd}}>{results.totalCorrect+"/"+results.totalEvaluated}</div><div style={{fontSize:12,color:K.mt,fontWeight:600}}>Correctos</div><div style={{fontSize:11,color:K.mt}}>{results.totalErrors+" errores"}</div></div>
        </div>
        <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,marginBottom:16}}>
          <h3 style={{fontSize:15,fontWeight:700,marginBottom:12}}>{"Distribución por posición"}</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10}}>{["ISPP","ISIP","CSIP","CSFP"].map(function(posId){ var p=results.byPosition[posId]||{ok:0,err:0,total:0},pct=p.total>0?Math.round((p.ok/p.total)*100):0,clr=p.total===0?"#cbd5e1":pct>=85?"#059669":pct>=65?"#d97706":"#dc2626"; return <div key={posId} style={{background:"#f8faf9",borderRadius:10,padding:14,textAlign:"center",border:"1px solid "+K.bd}}><div style={{fontSize:13,fontWeight:700,color:K.ac,marginBottom:4}}>{posLabels[posId]}</div><div style={{fontSize:9,color:K.mt,marginBottom:8}}>{posFull[posId]}</div>{p.total>0?<div><div style={{fontSize:22,fontWeight:700,color:clr}}>{pct+"%"}</div><div style={{fontSize:11,color:K.mt}}>{p.ok+"/"+p.total}</div></div>:<div style={{fontSize:11,color:"#cbd5e1"}}>{"Sin items"}</div>}</div>; })}</div>
        </div>
        <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,marginBottom:16}}>
          <h3 style={{fontSize:15,fontWeight:700,marginBottom:12}}>{"Por categoría"}</h3>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr style={{borderBottom:"2px solid "+K.bd}}><th style={{textAlign:"left",padding:8,color:K.mt,fontSize:11}}>{"Categoría"}</th><th style={{textAlign:"center",padding:8,color:K.mt,fontSize:11}}>OK</th><th style={{textAlign:"center",padding:8,color:K.mt,fontSize:11}}>Err</th><th style={{textAlign:"center",padding:8,color:K.mt,fontSize:11}}>Total</th><th style={{textAlign:"center",padding:8,color:K.mt,fontSize:11}}>%</th></tr></thead><tbody>{Object.values(results.byCat).map(function(c){ var pct=c.total>0?Math.round((c.ok/c.total)*100):0; return <tr key={c.title} style={{borderBottom:"1px solid #f1f5f9"}}><td style={{padding:8,fontWeight:600}}>{c.title}</td><td style={{textAlign:"center",padding:8,color:"#059669",fontWeight:600}}>{c.ok}</td><td style={{textAlign:"center",padding:8,color:c.errors>0?"#dc2626":"#059669",fontWeight:600}}>{c.errors}</td><td style={{textAlign:"center",padding:8}}>{c.total}</td><td style={{textAlign:"center",padding:8}}><span style={{padding:"2px 8px",borderRadius:10,fontSize:12,fontWeight:600,background:pct>=85?"#dcfce7":pct>=65?"#fef3c7":"#fef2f2",color:pct>=85?"#059669":pct>=65?"#d97706":"#dc2626"}}>{pct+"%"}</span></td></tr>; })}</tbody></table>
        </div>
        <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,marginBottom:16}}>
          <h3 style={{fontSize:15,fontWeight:700,marginBottom:12}}>{"Por fonema"}</h3>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr style={{borderBottom:"2px solid "+K.bd}}><th style={{textAlign:"left",padding:"6px 8px",color:K.mt,fontSize:11}}>Fonema</th><th style={{textAlign:"center",padding:6,color:K.mt,fontSize:11}}>Edad</th><th style={{textAlign:"center",padding:6,color:"#059669",fontSize:11}}>{"\u2713"}</th><th style={{textAlign:"center",padding:6,color:"#dc2626",fontSize:11}}>Err</th><th style={{textAlign:"center",padding:6,color:K.mt,fontSize:11}}>Total</th><th style={{textAlign:"center",padding:6,color:K.mt,fontSize:11}}>Estado</th></tr></thead><tbody>{Object.entries(results.byPhoneme).map(function(e){ var id=e[0],ph=e[1],has=ph.errors>0,exp=(patientAge/12)>=ph.age; return <tr key={id} style={{borderBottom:"1px solid #f1f5f9",background:has&&exp?"#fef2f2":"transparent"}}><td style={{padding:"6px 8px",fontWeight:700}}>{ph.phoneme}</td><td style={{textAlign:"center",padding:6,fontSize:11}}>{ph.age+"a"}</td><td style={{textAlign:"center",padding:6,color:"#059669",fontWeight:600}}>{ph.ok||"-"}</td><td style={{textAlign:"center",padding:6,color:ph.errors>0?"#dc2626":"#d1d5db",fontWeight:600}}>{ph.errors||"-"}</td><td style={{textAlign:"center",padding:6}}>{ph.total}</td><td style={{textAlign:"center",padding:6}}>{has&&exp&&<span style={{padding:"2px 8px",borderRadius:10,background:"#fef2f2",color:"#dc2626",fontSize:10,fontWeight:700}}>ALTERADO</span>}{has&&!exp&&<span style={{padding:"2px 8px",borderRadius:10,background:"#fef3c7",color:"#d97706",fontSize:10,fontWeight:700}}>EN DESARROLLO</span>}{!has&&<span style={{padding:"2px 8px",borderRadius:10,background:"#dcfce7",color:"#059669",fontSize:10,fontWeight:700}}>ADECUADO</span>}</td></tr>; })}</tbody></table>
        </div>
        {results.errorList.length>0 && <div style={{background:"#fff",borderRadius:12,border:"1px solid #fecaca",padding:20,marginBottom:16}}>
          <h3 style={{fontSize:15,fontWeight:700,color:"#dc2626",marginBottom:12}}>{"\u26a0 Errores ("+results.errorList.length+")"}</h3>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr style={{borderBottom:"2px solid "+K.bd,background:"#fef2f2"}}><th style={{textAlign:"left",padding:"6px 8px",color:K.mt,fontSize:11}}>Fonema</th><th style={{textAlign:"left",padding:"6px 8px",color:K.mt,fontSize:11}}>Palabra</th><th style={{textAlign:"center",padding:6,color:K.mt,fontSize:11}}>Pos</th><th style={{textAlign:"left",padding:"6px 8px",color:K.mt,fontSize:11}}>{"Prod."}</th></tr></thead><tbody>{results.errorList.map(function(err,i){ var exp=(patientAge/12)>=err.age; return <tr key={i} style={{borderBottom:"1px solid #f1f5f9",background:exp?"#fef2f2":"#fffbeb"}}><td style={{padding:"6px 8px",fontWeight:700,color:K.ac}}>{err.phoneme}</td><td style={{padding:"6px 8px"}}>{err.word}</td><td style={{textAlign:"center",padding:6,fontSize:11,fontWeight:600,color:K.mt}}>{err.posId}</td><td style={{padding:"6px 8px",color:"#dc2626",fontWeight:600}}>{err.produccion}</td></tr>; })}</tbody></table>
        </div>}
        {(function(){ var alt=Object.entries(results.byPhoneme).filter(function(e){return e[1].errors>0&&(patientAge/12)>=e[1].age;}); if(alt.length===0) return <div style={{background:"#dcfce7",borderRadius:12,padding:20,marginBottom:16,textAlign:"center"}}><span style={{fontSize:24}}>{"\u2705"}</span><p style={{fontSize:14,fontWeight:600,color:"#059669",marginTop:8}}>{"Fonemas adecuados."}</p></div>; return <div style={{background:"#fef2f2",borderRadius:12,border:"1px solid #fecaca",padding:20,marginBottom:16}}><h3 style={{fontSize:15,fontWeight:700,color:"#dc2626",marginBottom:8}}>{"\u26a0 Fonemas alterados"}</h3><div style={{display:"flex",flexWrap:"wrap",gap:8}}>{alt.map(function(e){var ph=e[1]; return <div key={e[0]} style={{background:"#fff",borderRadius:8,padding:"8px 14px",border:"1px solid #fecaca"}}><span style={{fontWeight:700,fontSize:16}}>{ph.phoneme}</span><span style={{fontSize:11,color:"#dc2626",marginLeft:6}}>{ph.errors+" err"}</span>{ph.errorWords.length>0&&<div style={{fontSize:10,color:K.mt,marginTop:2}}>{ph.errorWords.map(function(ew){return ew.word+"\u2192"+ew.produccion}).join(", ")}</div>}</div>;})}</div></div>; })()}
        {obs&&<div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,marginBottom:16}}><h3 style={{fontSize:14,fontWeight:600,marginBottom:6}}>Observaciones</h3><p style={{fontSize:13,color:K.mt}}>{obs}</p></div>}
      </div>}

      <button onClick={function(){if(onFinish)onFinish();else if(onBack)onBack();}} style={{width:"100%",padding:"14px",background:"#0d9488",color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer",marginTop:4}}>{"Finalizar \u2713"}</button>
    </div>
  );
}
