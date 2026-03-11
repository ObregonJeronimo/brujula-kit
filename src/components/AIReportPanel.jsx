import { useState, useRef, useEffect } from "react";
import { db, doc, updateDoc } from "../firebase.js";
import { K as _K, ageLabel } from "../lib/fb.js";
import { renderReportText } from "../lib/evalUtils.jsx";
var K = Object.assign({}, _K, { ac: "#9333ea" });

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

function ReportCard({ title, titleColor, borderColor, report, ev, evalLabel, refObj, onPDF }) {
  return <div style={{flex:1,minWidth:0}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:6}}>
      <div style={{fontSize:14,fontWeight:700,color:titleColor||K.sd}}>{title}</div>
      <button onClick={onPDF} style={{padding:"6px 12px",background:titleColor||K.ac,color:"#fff",border:"none",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer"}}>{"\ud83d\udda8 Imprimir"}</button>
    </div>
    <div ref={refObj} style={{background:"#fff",borderRadius:12,border:"2px solid "+(borderColor||K.bd),padding:20,fontSize:12}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12,paddingBottom:10,borderBottom:"1px solid #e2e8f0"}}>
        <div>
          <div style={{fontSize:9,color:titleColor||K.mt,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>{title+" \u2014 "+(evalLabel||"")}</div>
          <div style={{fontSize:15,fontWeight:700,marginTop:2}}>{ev.paciente}</div>
          <div style={{fontSize:11,color:K.mt,marginTop:1}}>{"DNI: "+(ev.pacienteDni||"N/A")+" \u00b7 Edad: "+ageLabel(ev.edadMeses||0)}</div>
        </div>
        <div style={{textAlign:"right",fontSize:10,color:K.mt}}>{"Fecha: "+(ev.fechaEvaluacion||"")}</div>
      </div>
      <div>{renderReportText(report)}</div>
      <div style={{marginTop:14,background:"linear-gradient(135deg,#f3e8ff,#ede9fe)",borderRadius:8,padding:"10px 14px",border:"1px solid #d8b4fe"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",fontSize:10}}>
          <span>{"\ud83e\udde0"} <b style={{color:"#6b21a8"}}>Generado con IA</b></span>
          <span style={{color:"#c4b5fd"}}>|</span>
          <span>{"\u2705"} <b style={{color:"#059669"}}>Validado por profesionales</b></span>
        </div>
        <div style={{fontSize:9,color:"#7c3aed",marginTop:4}}>Debe ser revisado por el profesional tratante.</div>
      </div>
      <div style={{marginTop:10,paddingTop:6,borderTop:"1px solid #e2e8f0",fontSize:8,color:"#94a3b8",textAlign:"center"}}>{"Br\u00fajula KIT \u2014 "+(evalLabel||"")+" \u2014 "+new Date().toLocaleDateString("es-AR")}</div>
    </div>
  </div>;
}

export default function AIReportPanel({ ev, evalType, collectionName, evalLabel, autoGenerate }){
  var existingReport = ev.aiReport || null;
  var existingCUD = ev.aiCudReport || null;
  var _report = useState(existingReport), report = _report[0], setReport = _report[1];
  var _generating = useState(false), generating = _generating[0], setGenerating = _generating[1];
  var _genError = useState(null), genError = _genError[0], setGenError = _genError[1];
  var _cudReport = useState(existingCUD), cudReport = _cudReport[0], setCudReport = _cudReport[1];
  var _cudGen = useState(false), cudGenerating = _cudGen[0], setCudGenerating = _cudGen[1];
  var _cudError = useState(null), cudError = _cudError[0], setCudError = _cudError[1];
  var _autoTriggered = useState(false), autoTriggered = _autoTriggered[0], setAutoTriggered = _autoTriggered[1];
  var reportRef = useRef(null);
  var cudRef = useRef(null);

  if(existingReport && !report) setReport(existingReport);
  if(existingCUD && !cudReport) setCudReport(existingCUD);

  var buildEvalData = function(){
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
    return evalData;
  };

  var handleGenerate = function(mode){
    var isClinico = mode !== "cud";
    if(isClinico){ setGenerating(true); setGenError(null); }
    else { setCudGenerating(true); setCudError(null); }
    
    fetch("/api/generate-report", {
      method: "POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ evalData: buildEvalData(), evalType: evalType, reportMode: mode || "clinico" })
    })
    .then(function(r){ return r.json(); })
    .then(function(data){
      if(data.success && data.report){
        if(isClinico){
          setReport(data.report);
          if(ev._fbId && collectionName){
            updateDoc(doc(db, collectionName, ev._fbId), {aiReport: data.report, aiReportDate: new Date().toISOString()}).catch(function(e){console.error(e);});
          }
        } else {
          setCudReport(data.report);
          if(ev._fbId && collectionName){
            updateDoc(doc(db, collectionName, ev._fbId), {aiCudReport: data.report, aiCudReportDate: new Date().toISOString()}).catch(function(e){console.error(e);});
          }
        }
      } else {
        var err = data.error || "Error al generar informe.";
        if(isClinico) setGenError(err); else setCudError(err);
      }
      if(isClinico) setGenerating(false); else setCudGenerating(false);
    })
    .catch(function(e){
      var err = "Error: "+e.message;
      if(isClinico){ setGenError(err); setGenerating(false); }
      else { setCudError(err); setCudGenerating(false); }
    });
  };

  var pdfName = function(prefix){ return prefix+"_"+evalType.toUpperCase()+"_"+((ev.paciente||"").replace(/\s/g,"_"))+"_"+(ev.fechaEvaluacion||"")+".pdf"; };

  // Auto-generate report on mount if autoGenerate=true and no existing report
  useEffect(function(){
    if(autoGenerate && !existingReport && !report && !generating && !genError && !autoTriggered){
      setAutoTriggered(true);
      handleGenerate("clinico");
    }
  }, [autoGenerate]);

  // No report at all
  if(!report && !generating && !genError) return <div style={{background:"#fffbeb",borderRadius:10,padding:"14px 18px",marginBottom:16,fontSize:13,color:"#92400e",border:"1px solid #fde68a",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
    <span>{"⚠ No se generó informe IA para esta evaluación."}</span>
    <button onClick={function(){handleGenerate("clinico")}} style={{padding:"8px 18px",background:"#9333ea",color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>Generar informe ahora</button>
  </div>;

  if(generating) return <div style={{background:"#fff",borderRadius:14,border:"1px solid "+K.bd,padding:40,textAlign:"center",marginBottom:20}}>
    <div style={{display:"inline-block",width:40,height:40,border:"4px solid #e2e8f0",borderTopColor:"#9333ea",borderRadius:"50%",animation:"spin 1s linear infinite",marginBottom:16}} />
    <div style={{fontSize:15,fontWeight:600,color:K.sd}}>Generando informe con IA...</div>
    <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
  </div>;

  if(genError && !report) return <div style={{background:"#fff",borderRadius:14,border:"1px solid "+K.bd,padding:28,textAlign:"center",marginBottom:20}}>
    <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#dc2626"}}>{genError}</div>
    <button onClick={function(){handleGenerate("clinico")}} style={{padding:"10px 24px",background:"#9333ea",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>Reintentar</button>
  </div>;

  // Report exists — book view if CUD exists
  var hasCUD = !!cudReport;

  return <div style={{marginBottom:20}}>
    <div style={{display:hasCUD?"flex":"block",gap:16,alignItems:"flex-start"}}>
      <ReportCard title="Informe Fonoaudiológico" titleColor={K.sd} borderColor={K.bd} report={report} ev={ev} evalLabel={evalLabel||evalType.toUpperCase()} refObj={reportRef} onPDF={function(){ if(reportRef.current) doPDF(reportRef.current, pdfName("Informe")); }} />
      {hasCUD && <ReportCard title="Informe para CUD" titleColor="#7c3aed" borderColor="#7c3aed" report={cudReport} ev={ev} evalLabel={evalLabel||evalType.toUpperCase()} refObj={cudRef} onPDF={function(){ if(cudRef.current) doPDF(cudRef.current, pdfName("CUD")); }} />}
    </div>

    {!hasCUD && !cudGenerating && <button onClick={function(){handleGenerate("cud")}} style={{width:"100%",marginTop:12,padding:"12px",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
      <span>{"\ud83d\udccb"}</span>{"Generar Informe para CUD"}
    </button>}
    {cudGenerating && <div style={{marginTop:12,background:"#fff",borderRadius:10,border:"1px solid "+K.bd,padding:20,textAlign:"center"}}>
      <div style={{display:"inline-block",width:30,height:30,border:"3px solid #e2e8f0",borderTopColor:"#7c3aed",borderRadius:"50%",animation:"spin 1s linear infinite",marginBottom:8}} />
      <div style={{fontSize:13,fontWeight:600,color:K.sd}}>Generando informe CUD...</div>
    </div>}
    {cudError && <div style={{marginTop:12,background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#dc2626"}}>{cudError}
      <button onClick={function(){handleGenerate("cud")}} style={{marginLeft:10,padding:"4px 12px",background:"#7c3aed",color:"#fff",border:"none",borderRadius:6,fontSize:11,cursor:"pointer"}}>Reintentar</button>
    </div>}
  </div>;
}
