import { useState, useRef } from "react";
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

function ageLabel(m){ return Math.floor(m/12)+" años, "+(m%12)+" meses"; }

export default function AIReportPanel({ ev, evalType, collectionName, evalLabel }){
  var existingReport = ev.aiReport || null;
  var _report = useState(existingReport), report = _report[0], setReport = _report[1];
  var _generating = useState(false), generating = _generating[0], setGenerating = _generating[1];
  var _genError = useState(null), genError = _genError[0], setGenError = _genError[1];
  var reportRef = useRef(null);

  if(existingReport && !report) setReport(existingReport);

  var handleGenerate = function(){
    setGenerating(true);
    setGenError(null);
    var evalData = {
      paciente: ev.paciente || "", pacienteDni: ev.pacienteDni || "",
      edadMeses: ev.edadMeses || 0, fechaEvaluacion: ev.fechaEvaluacion || "",
      derivadoPor: ev.derivadoPor || "", observaciones: ev.observaciones || "",
      resultados: ev.resultados || {}
    };
    if(evalType === "eldi"){
      evalData.evalRec = ev.evalRec; evalData.evalExp = ev.evalExp;
      evalData.resultados = { recRes: ev.recRes, expRes: ev.expRes };
    }
    fetch("/api/generate-report", {
      method: "POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ evalData: evalData, evalType: evalType, reportMode: "clinico" })
    })
    .then(function(r){ return r.json(); })
    .then(function(data){
      if(data.success && data.report){
        setReport(data.report);
        if(ev._fbId && collectionName){
          updateDoc(doc(db, collectionName, ev._fbId), {aiReport: data.report, aiReportDate: new Date().toISOString()}).catch(function(e){console.error(e);});
        }
      } else setGenError(data.error || "Error al generar informe.");
      setGenerating(false);
    })
    .catch(function(e){ setGenError("Error: "+e.message); setGenerating(false); });
  };

  var handlePDF = function(){
    if(!reportRef.current) return;
    doPDF(reportRef.current, "Informe_"+evalType.toUpperCase()+"_"+((ev.paciente||"").replace(/\s/g,"_"))+"_"+(ev.fechaEvaluacion||"")+".pdf");
  };

  if(!report && !generating && !genError) return <div style={{background:"#fffbeb",borderRadius:10,padding:"14px 18px",marginBottom:16,fontSize:13,color:"#92400e",border:"1px solid #fde68a",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
    <span>⚠ No se generó informe IA para esta evaluación.</span>
    <button onClick={handleGenerate} style={{padding:"8px 18px",background:"#9333ea",color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>Generar informe ahora</button>
  </div>;

  if(generating) return <div style={{background:"#fff",borderRadius:14,border:"1px solid "+K.bd,padding:40,textAlign:"center",marginBottom:20}}>
    <div style={{display:"inline-block",width:40,height:40,border:"4px solid #e2e8f0",borderTopColor:"#9333ea",borderRadius:"50%",animation:"spin 1s linear infinite",marginBottom:16}} />
    <div style={{fontSize:15,fontWeight:600,color:K.sd}}>Generando informe con IA...</div>
    <div style={{fontSize:12,color:K.mt,marginTop:6}}>Esto puede tardar unos segundos.</div>
    <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
  </div>;

  if(genError && !report) return <div style={{background:"#fff",borderRadius:14,border:"1px solid "+K.bd,padding:28,textAlign:"center",marginBottom:20}}>
    <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#dc2626"}}>{genError}</div>
    <button onClick={handleGenerate} style={{padding:"10px 24px",background:"#9333ea",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>Reintentar</button>
  </div>;

  return <div style={{marginBottom:20}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
      <div style={{fontSize:15,fontWeight:700,color:K.sd}}>Informe Fonoaudiológico</div>
      <button onClick={handlePDF} style={{padding:"7px 14px",background:K.ac,color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>🖨 Imprimir informe</button>
    </div>
    <div ref={reportRef} style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,paddingBottom:12,borderBottom:"2px solid "+K.bd}}>
        <div>
          <div style={{fontSize:10,color:K.mt,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>{"Informe Fonoaudiológico — "+(evalLabel||evalType.toUpperCase())}</div>
          <div style={{fontSize:17,fontWeight:700,marginTop:3}}>{ev.paciente}</div>
          <div style={{fontSize:12,color:K.mt,marginTop:2}}>{"DNI: "+(ev.pacienteDni||"N/A")+" · Edad: "+ageLabel(ev.edadMeses||0)}</div>
        </div>
        <div style={{textAlign:"right"}}><div style={{fontSize:11,color:K.mt}}>{"Fecha: "+(ev.fechaEvaluacion||"")}</div>{ev.evaluador && <div style={{fontSize:11,color:K.mt}}>{"Evaluador: "+ev.evaluador}</div>}</div>
      </div>
      <div>{renderReportText(report)}</div>
      <div style={{marginTop:20,background:"linear-gradient(135deg,#f3e8ff,#ede9fe)",borderRadius:10,padding:"14px 18px",border:"1px solid #d8b4fe"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:18}}>🧠</span><span style={{fontSize:11,fontWeight:700,color:"#6b21a8"}}>Generado con IA</span></div>
          <div style={{width:1,height:16,background:"#c4b5fd"}} />
          <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:18}}>✅</span><span style={{fontSize:11,fontWeight:700,color:"#059669"}}>Comprobado por profesionales en fonoaudiología de Córdoba</span></div>
        </div>
        <div style={{fontSize:10,color:"#7c3aed",marginTop:6}}>Generado con IA. Validado por profesionales fonoaudiólogos de Córdoba, Argentina. Debe ser revisado por el profesional tratante.</div>
      </div>
      <div style={{marginTop:14,paddingTop:8,borderTop:"1px solid "+K.bd,fontSize:9,color:"#94a3b8",textAlign:"center"}}>{"Brújula KIT — "+(evalLabel||evalType.toUpperCase())+" — "+new Date().toLocaleDateString("es-AR")}</div>
    </div>
  </div>;
}
