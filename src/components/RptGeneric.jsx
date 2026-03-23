// RptGeneric — generic report viewer for evaluations without specific Rpt components
import { useState } from "react";
import AIReportPanel from "./AIReportPanel.jsx";
import { K, ageLabel } from "../lib/fb.js";
import { getEvalType } from "../config/evalTypes.js";

export default function RptGeneric({ ev, onD, therapistInfo }) {
  var _showTech = useState(false), showTech = _showTech[0], setShowTech = _showTech[1];
  var evalConfig = getEvalType(ev.tipo);
  var label = evalConfig ? evalConfig.fullName : (ev.tipo || "").toUpperCase();
  var icon = evalConfig ? evalConfig.icon : "";

  return <div style={{animation:"fi .3s ease",maxWidth:1200,margin:"0 auto"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:28}}>{icon}</span>
        <h2 style={{fontSize:18,fontWeight:700,margin:0}}>{label}</h2>
      </div>
      {onD && <button onClick={function(){if(window.confirm("Eliminar esta evaluacion?")) onD(ev._fbId||ev.id)}} style={{padding:"8px 16px",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>Eliminar</button>}
    </div>

    <AIReportPanel
      ev={ev}
      evalType={ev.tipo}
      collectionName="evaluaciones"
      evalLabel={label} therapistInfo={therapistInfo}
    />

    <button onClick={function(){setShowTech(!showTech)}} style={{width:"100%",padding:"14px",background:showTech?"#f1f5f9":"#0a3d2f",color:showTech?"#1e293b":"#fff",border:"1px solid #e2e8f0",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",marginBottom:showTech?16:20}}>{showTech ? "Ocultar datos tecnicos" : "Ver datos tecnicos de la evaluacion"}</button>

    {showTech && <div style={{background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:20,marginBottom:20}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
        <div><div style={{fontSize:11,fontWeight:600,color:K.mt}}>Paciente</div><div style={{fontSize:15,fontWeight:600}}>{ev.paciente}</div></div>
        <div><div style={{fontSize:11,fontWeight:600,color:K.mt}}>DNI</div><div style={{fontSize:15}}>{ev.pacienteDni || "N/A"}</div></div>
        <div><div style={{fontSize:11,fontWeight:600,color:K.mt}}>Edad</div><div style={{fontSize:15}}>{ageLabel(ev.edadMeses||0)}</div></div>
        <div><div style={{fontSize:11,fontWeight:600,color:K.mt}}>Fecha</div><div style={{fontSize:15}}>{ev.fechaEvaluacion || ""}</div></div>
      </div>
      {ev.resultados && <div>
        <div style={{fontSize:13,fontWeight:700,color:K.sd,marginBottom:8}}>Resultados</div>
        <pre style={{background:"#f8faf9",padding:14,borderRadius:8,fontSize:12,overflow:"auto",maxHeight:300,border:"1px solid #e2e8f0",whiteSpace:"pre-wrap"}}>{JSON.stringify(ev.resultados, null, 2)}</pre>
      </div>}
    </div>}
  </div>;
}
