import { useState, useRef } from "react";
import { RECO_GROUPS } from "../data/recoFonData.js";
import AIReportPanel from "./AIReportPanel.jsx";
import { K as _K, ageLabel } from "../lib/fb.js";
var K = Object.assign({}, _K, { ac: "#9333ea" });

export default function RptRECO({ ev, onD, therapistInfo }){
  var _cd = useState(false), cd = _cd[0], sCD = _cd[1];
  var _showTech = useState(false), showTech = _showTech[0], setShowTech = _showTech[1];
  var printRef = useRef(null);
  var res = ev.resultados || {};
  var responses = ev.responses || {};
  var obsMap = ev.obsMap || {};

  var handlePDF = function(){
    if(!printRef.current) return;
    var w = window.open("","_blank");
    w.document.write("<html><head><title>RECO "+ev.paciente+"</title><style>body{font-family:system-ui,sans-serif;padding:20px;font-size:12px;color:#1e293b}table{width:100%;border-collapse:collapse}th,td{padding:5px 8px;border:1px solid #ddd;text-align:left;font-size:11px}th{background:#f1f5f9;font-weight:700}h3{margin:16px 0 8px}@media print{body{padding:0}}</style></head><body>");
    w.document.write(printRef.current.innerHTML);
    w.document.write("</body></html>");
    w.document.close();
    setTimeout(function(){ w.print(); }, 300);
  };

  var sevColor = res.severity==="Adecuado"?"#059669":res.severity==="Leve"?"#d97706":"#dc2626";
  var sevBg = res.severity==="Adecuado"?"#f0fdf4":res.severity==="Leve"?"#fffbeb":"#fef2f2";

  return (
    <div style={{animation:"fi .3s ease",maxWidth:1200,margin:"0 auto"}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <h1 style={{fontSize:20,fontWeight:700}}>{"\ud83e\udde0 Reconocimiento Fonológico"}</h1>
        <div style={{display:"flex",gap:8}}>
          {cd
            ?<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"14px 20px",display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
              <div style={{fontSize:13,fontWeight:600,color:"#dc2626",textAlign:"center"}}>{"¿Está seguro que desea eliminar?"}</div>
              <div style={{fontSize:12,color:"#64748b",textAlign:"center"}}>{"Esta acción es irreversible"}</div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={function(){onD(ev._fbId)}} style={{background:"#dc2626",color:"#fff",border:"none",padding:"8px 20px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>{"Sí, eliminar"}</button>
                <button onClick={function(){sCD(false)}} style={{background:"#f1f5f9",border:"1px solid #e2e8f0",padding:"8px 20px",borderRadius:8,fontSize:13,cursor:"pointer",color:"#64748b"}}>Cancelar</button>
              </div>
            </div>
            :<button onClick={function(){sCD(true)}} style={{padding:"11px 22px",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{"Eliminar"}</button>
          }
        </div>
      </div>

      {/* AI Report Panel */}
      <AIReportPanel ev={ev} evalType="reco" collectionName="evaluaciones" evalLabel="Reconocimiento Fonológico" therapistInfo={therapistInfo} />

      {/* Technical Data Toggle */}
      <button onClick={function(){ setShowTech(!showTech); }} style={{width:"100%",padding:"14px",background:showTech?"#f1f5f9":"#0a3d2f",color:showTech?"#1e293b":"#fff",border:"1px solid #e2e8f0",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",marginBottom:showTech?16:20}}>
        {showTech ? "\u25b2 Ocultar datos técnicos" : "\u25bc Ver datos técnicos de la evaluación"}
      </button>

      {/* Technical Details */}
      {showTech && <div ref={printRef} style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:28,marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
          <button onClick={handlePDF} style={{padding:"9px 18px",background:K.ac,color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>{"\ud83d\udcc4 PDF datos técnicos"}</button>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,paddingBottom:16,borderBottom:"2px solid "+K.bd}}>
          <div>
            <div style={{fontSize:10,color:K.mt,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>{"Reconocimiento Fonológico"}</div>
            <div style={{fontSize:18,fontWeight:700,marginTop:4}}>{ev.paciente}</div>
            <div style={{fontSize:13,color:K.mt,marginTop:2}}>{"DNI: "+(ev.pacienteDni||"N/A")+" · Edad: "+ageLabel(ev.edadMeses||0)}</div>
            {ev.derivadoPor && <div style={{fontSize:12,color:K.mt,marginTop:2}}>{"Derivado por: "+ev.derivadoPor}</div>}
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:12,color:K.mt}}>{"Fecha: "+ev.fechaEvaluacion}</div>
            {ev.evaluador && <div style={{fontSize:12,color:K.mt}}>{"Evaluador: "+ev.evaluador}</div>}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:24}}>
          <div style={{background:"#f3e8ff",borderRadius:10,padding:16,textAlign:"center"}}>
            <div style={{fontSize:28,fontWeight:800,color:K.ac}}>{(res.pct||0)+"%"}</div>
            <div style={{fontSize:11,color:K.mt,fontWeight:600}}>{"Aciertos globales"}</div>
          </div>
          <div style={{background:sevBg,borderRadius:10,padding:16,textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:700,color:sevColor}}>{res.severity||"-"}</div>
            <div style={{fontSize:11,color:K.mt,fontWeight:600}}>{"Severidad"}</div>
          </div>
          <div style={{background:"#f8fafc",borderRadius:10,padding:16,textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:700,color:K.sd}}>{(res.correct||0)+"/"+(res.total||0)}</div>
            <div style={{fontSize:11,color:K.mt,fontWeight:600}}>{"Contrastes reconocidos"}</div>
          </div>
        </div>
        <h3 style={{fontSize:14,fontWeight:700,marginBottom:8}}>{"Detalle por grupo de contraste"}</h3>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,marginBottom:20}}>
          <thead><tr style={{borderBottom:"2px solid "+K.bd,background:"#f8fafc"}}>
            <th style={{textAlign:"center",padding:"6px 8px",color:K.mt,width:36}}>{"Gr."}</th>
            <th style={{textAlign:"left",padding:"6px 8px",color:K.mt}}>{"Tipo de contraste"}</th>
            <th style={{textAlign:"center",padding:"6px",color:K.mt,width:50}}>{"Lám."}</th>
            <th style={{textAlign:"left",padding:"6px 8px",color:K.mt}}>{"Estímulos"}</th>
            <th style={{textAlign:"center",padding:"6px",color:K.mt,width:70}}>{"Reconoce"}</th>
            <th style={{textAlign:"left",padding:"6px 8px",color:K.mt}}>{"Obs."}</th>
          </tr></thead>
          <tbody>
            {RECO_GROUPS.map(function(group){
              return group.items.map(function(item, idx){
                var r = responses[item.lam];
                var reconoce = r === "si" || r === true;
                var noReconoce = r === "no" || r === false;
                var noResp = r === undefined || r === null;
                var bgRow = noResp ? "#fffbeb" : reconoce ? "#f0fdf4" : "#fef2f2";
                return <tr key={item.lam} style={{borderBottom:"1px solid #f1f5f9",background:bgRow}}>
                  {idx === 0 && <td rowSpan={group.items.length} style={{textAlign:"center",padding:"6px 8px",fontWeight:800,color:K.ac,verticalAlign:"top",borderRight:"1px solid #f1f5f9"}}>{group.id}</td>}
                  {idx === 0 && <td rowSpan={group.items.length} style={{padding:"6px 8px",fontSize:11,color:"#334155",verticalAlign:"top",borderRight:"1px solid #f1f5f9"}}>{group.label}</td>}
                  <td style={{textAlign:"center",padding:"6px 8px",fontWeight:700,color:K.mt}}>{item.lam}</td>
                  <td style={{padding:"6px 8px",fontSize:11}}>{item.est.join(", ")}</td>
                  <td style={{textAlign:"center",padding:"6px"}}>
                    {noResp && <span style={{fontSize:10,color:"#92400e",fontWeight:600}}>{"Sin resp."}</span>}
                    {reconoce && <span style={{fontSize:10,color:"#059669",fontWeight:700}}>{"\u2714 Sí"}</span>}
                    {noReconoce && <span style={{fontSize:10,color:"#dc2626",fontWeight:700}}>{"\u2718 No"}</span>}
                  </td>
                  <td style={{padding:"6px 8px",fontSize:11,color:K.mt}}>{obsMap[item.lam]||""}</td>
                </tr>;
              });
            })}
          </tbody>
        </table>
        {res.groupResults && <div style={{marginBottom:20}}>
          <h3 style={{fontSize:14,fontWeight:700,color:K.ac,marginBottom:8}}>{"Resumen por grupo"}</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {res.groupResults.map(function(g){
              var isOk = g.correct === g.total;
              return <div key={g.id} style={{padding:"8px 12px",borderRadius:8,border:"1px solid "+(isOk?"#bbf7d0":"#fecaca"),background:isOk?"#f0fdf4":"#fef2f2",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <span style={{fontWeight:800,color:isOk?"#059669":"#dc2626",marginRight:6,fontSize:13}}>{g.id}</span>
                  <span style={{fontSize:11,color:"#334155"}}>{g.label}</span>
                </div>
                <span style={{fontSize:12,fontWeight:700,color:isOk?"#059669":"#dc2626"}}>{g.correct+"/"+g.total}</span>
              </div>;
            })}
          </div>
        </div>}
        {res.errorGroups && res.errorGroups.length > 0 && <div style={{marginBottom:20}}>
          <h3 style={{fontSize:14,fontWeight:700,color:"#dc2626",marginBottom:8}}>{"\u26a0 Grupos con dificultades"}</h3>
          {res.errorGroups.map(function(g){
            var failedItems = g.items.filter(function(it){ return !it.reconoce; });
            return <div key={g.id} style={{padding:"10px 14px",background:"#fef2f2",borderRadius:8,marginBottom:6,border:"1px solid #fecaca"}}>
              <div style={{fontSize:12,fontWeight:700,color:"#dc2626"}}>{g.id+" - "+g.label}</div>
              <div style={{fontSize:11,color:"#7f1d1d",marginTop:2}}>
                {"Items no reconocidos: "+failedItems.map(function(it){return "Lám. "+it.lam}).join(", ")}
              </div>
            </div>;
          })}
        </div>}
        {res.errorGroups && res.errorGroups.length === 0 && <div style={{background:"#dcfce7",borderRadius:12,padding:20,marginBottom:16,textAlign:"center"}}>
          <span style={{fontSize:24}}>{"\u2705"}</span>
          <p style={{fontSize:14,fontWeight:600,color:"#059669",marginTop:8}}>{"Reconocimiento fonológico adecuado."}</p>
        </div>}
        <div style={{background:"#f3e8ff",border:"1px solid #d8b4fe",borderRadius:10,padding:14,marginBottom:20,fontSize:12,color:"#6b21a8",lineHeight:1.6}}>
          <strong>{"\u2139\ufe0f Criterios de clasificación:"}</strong><br/>
          {"Adecuado: \u226595% \u00b7 Leve: 80-94% \u00b7 Moderado: 60-79% \u00b7 Severo: <60%"}
        </div>
        {ev.observaciones && <div style={{marginTop:12,padding:12,background:"#f8fafc",borderRadius:8}}>
          <strong style={{fontSize:12}}>Observaciones:</strong>
          <p style={{fontSize:12,color:K.mt,marginTop:4}}>{ev.observaciones}</p>
        </div>}
        <div style={{marginTop:24,paddingTop:12,borderTop:"1px solid "+K.bd,fontSize:10,color:"#94a3b8",textAlign:"center"}}>
          {"Brújula KIT — Reconocimiento Fonológico — Generado el "+new Date().toLocaleDateString("es-AR")}
        </div>
      </div>}
    </div>
  );
}
