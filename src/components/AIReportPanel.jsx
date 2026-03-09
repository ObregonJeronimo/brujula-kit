import { useState, useRef, useEffect } from "react";
import { db, doc, updateDoc } from "../firebase.js";

var K = { sd:"#0a3d2f", ac:"#9333ea", mt:"#64748b", bd:"#e2e8f0" };

function renderReportText(text){
  if(!text) return null;
  return text.split("\n").map(function(line, i){
    var trimmed = line.trim();
    if(!trimmed) return <div key={i} style={{height:8}} />;
    var isTitle = /^[A-Z\u00c0-\u00dc\s\d\.\:\-]{6,}:?\s*$/.test(trimmed) || /^\d+[\.\)]\s*[A-Z]/.test(trimmed);
    if(isTitle) return <div key={i} style={{fontSize:14,fontWeight:700,color:K.sd,marginTop:14,marginBottom:4}}>{trimmed}</div>;
    return <div key={i} style={{fontSize:13,color:"#334155",lineHeight:1.7,marginBottom:1}}>{trimmed}</div>;
  });
}

function doPDF(el, filename){
  el.style.paddingBottom = "40px";
  import("html2canvas").then(function(mod){
    return mod.default(el,{scale:2,useCORS:true,backgroundColor:"#ffffff",scrollY:-window.scrollY,height:el.scrollHeight,windowHeight:el.scrollHeight+100});
  }).then(function(canvas){
    el.style.paddingBottom = "";
    return import("jspdf").then(function(mod){
      var jsPDF = mod.jsPDF; var pdf = new jsPDF("p","mm","a4");
      var pW=210,pH=297,margin=10,imgW=pW-margin*2,imgH=(canvas.height*imgW)/canvas.width,usableH=pH-margin*2,pos=0,page=0;
      while(pos<imgH){ if(page>0) pdf.addPage(); var srcY=Math.round((pos/imgH)*canvas.height); var srcH=Math.round((Math.min(usableH,imgH-pos)/imgH)*canvas.height); if(srcH<=0) break; var sc=document.createElement("canvas");sc.width=canvas.width;sc.height=srcH; sc.getContext("2d").drawImage(canvas,0,srcY,canvas.width,srcH,0,0,canvas.width,srcH); var sliceH=(srcH*imgW)/canvas.width; if(sliceH<1) break; pdf.addImage(sc.toDataURL("image/png"),"PNG",margin,margin,imgW,sliceH); pos+=usableH;page++; }
      pdf.save(filename);
    });
  }).catch(function(e){ el.style.paddingBottom = ""; console.error(e); });
}

function ageLabel(m){ return Math.floor(m/12)+" a\u00f1os, "+(m%12)+" meses"; }

// IMPORTANT: If ev.aiReport already exists, show it and do NOT regenerate
export default function AIReportPanel({ ev, evalType, collectionName, evalLabel }){
  var existingReport = ev.aiReport || null;
  var _report = useState(existingReport), report = _report[0], setReport = _report[1];
  var _generating = useState(false), generating = _generating[0], setGenerating = _generating[1];
  var _genError = useState(null), genError = _genError[0], setGenError = _genError[1];
  var _regenUsed = useState(ev.aiReportRegenerated || false), regenUsed = _regenUsed[0], setRegenUsed = _regenUsed[1];
  var reportRef = useRef(null);

  // If report already exists from Firestore, just show it - NEVER regenerate
  if(existingReport && !report) setReport(existingReport);

  var handlePDF = function(){
    if(!reportRef.current) return;
    doPDF(reportRef.current, "Informe_"+evalType.toUpperCase()+"_"+((ev.paciente||"").replace(/\s/g,"_"))+"_"+(ev.fechaEvaluacion||"")+".pdf");
  };

  // If no report exists at all, show nothing (report should have been generated at eval time)
  if(!report) return <div style={{background:"#fffbeb",borderRadius:10,padding:"14px 18px",marginBottom:16,fontSize:13,color:"#92400e",border:"1px solid #fde68a"}}>
    {"\u26a0 No se gener\u00f3 informe IA para esta evaluaci\u00f3n. Los informes se generan autom\u00e1ticamente al completar una evaluaci\u00f3n."}
  </div>;

  return <div style={{marginBottom:20}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
      <div style={{fontSize:15,fontWeight:700,color:K.sd}}>{"Informe Fonoaudiol\u00f3gico"}</div>
      <button onClick={handlePDF} style={{padding:"7px 14px",background:K.ac,color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>{"\ud83d\udda8 Imprimir informe"}</button>
    </div>
    <div ref={reportRef} style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,paddingBottom:12,borderBottom:"2px solid "+K.bd}}>
        <div>
          <div style={{fontSize:10,color:K.mt,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>{"Informe Fonoaudiol\u00f3gico \u2014 "+(evalLabel||evalType.toUpperCase())}</div>
          <div style={{fontSize:17,fontWeight:700,marginTop:3}}>{ev.paciente}</div>
          <div style={{fontSize:12,color:K.mt,marginTop:2}}>{"DNI: "+(ev.pacienteDni||"N/A")+" \u00b7 Edad: "+ageLabel(ev.edadMeses||0)}</div>
        </div>
        <div style={{textAlign:"right"}}><div style={{fontSize:11,color:K.mt}}>{"Fecha: "+(ev.fechaEvaluacion||"")}</div>{ev.evaluador && <div style={{fontSize:11,color:K.mt}}>{"Evaluador: "+ev.evaluador}</div>}</div>
      </div>
      <div>{renderReportText(report)}</div>
      <div style={{marginTop:20,background:"linear-gradient(135deg,#f3e8ff,#ede9fe)",borderRadius:10,padding:"14px 18px",border:"1px solid #d8b4fe"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:18}}>{"\ud83e\udde0"}</span><span style={{fontSize:11,fontWeight:700,color:"#6b21a8"}}>{"Generado con IA"}</span></div>
          <div style={{width:1,height:16,background:"#c4b5fd"}} />
          <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:18}}>{"\u2705"}</span><span style={{fontSize:11,fontWeight:700,color:"#059669"}}>{"Comprobado por profesionales en fonoaudiolog\u00eda de C\u00f3rdoba"}</span></div>
        </div>
        <div style={{fontSize:10,color:"#7c3aed",marginTop:6}}>{"Generado con IA. Validado por profesionales fonoaudi\u00f3logos de C\u00f3rdoba, Argentina. Debe ser revisado por el profesional tratante."}</div>
      </div>
      <div style={{marginTop:14,paddingTop:8,borderTop:"1px solid "+K.bd,fontSize:9,color:"#94a3b8",textAlign:"center"}}>{"Br\u00fajula KIT \u2014 "+(evalLabel||evalType.toUpperCase())+" \u2014 "+new Date().toLocaleDateString("es-AR")}</div>
    </div>
  </div>;
}
