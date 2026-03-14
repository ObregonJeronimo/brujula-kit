import { useState, useRef, useEffect } from "react";
import { db, doc, updateDoc } from "../firebase.js";
import { K as _K, ageLabel } from "../lib/fb.js";
import { renderReportText } from "../lib/evalUtils.jsx";
var K = Object.assign({}, _K, { ac: "#9333ea" });

function textPDF(title, evalLabel, ev, reportText, filename){
  import("jspdf").then(function(mod){
    var jsPDF = mod.jsPDF;
    var pdf = new jsPDF("p","mm","a4");
    var pW=210, margin=14, maxW=pW-margin*2, y=margin;
    var lineH=5, titleH=7;
    var pageH=297-margin*2;

    pdf.setFontSize(8); pdf.setTextColor(120);
    pdf.text(title+" \u2014 "+(evalLabel||""), margin, y); 
    pdf.text("Fecha: "+(ev.fechaEvaluacion||""), pW-margin, y, {align:"right"});
    y+=lineH+2;
    pdf.setDrawColor(200); pdf.line(margin, y, pW-margin, y); y+=8;

    pdf.setFontSize(14); pdf.setTextColor(10,61,47); pdf.setFont(undefined,"bold");
    pdf.text(ev.paciente||"", margin, y); y+=7;
    pdf.setFontSize(9); pdf.setTextColor(100); pdf.setFont(undefined,"normal");
    pdf.text("DNI: "+(ev.pacienteDni||"N/A")+" \u00b7 Edad: "+ageLabel(ev.edadMeses||0), margin, y); y+=10;

    if(reportText){
      var lines = reportText.split("\n");
      for(var i=0; i<lines.length; i++){
        var line = lines[i].trim();
        if(!line){ y+=3; continue; }
        var isTitle = /^[A-Z\u00c0-\u00dc\s\d\.\:\-]{6,}:?\s*$/.test(line) || /^\d+[\.\)]\s*[A-Z]/.test(line);
        if(isTitle){
          y+=3;
          pdf.setFontSize(10); pdf.setTextColor(10,61,47); pdf.setFont(undefined,"bold");
          if(y+titleH > pageH){ pdf.addPage(); y=margin; }
          pdf.text(line, margin, y); y+=titleH;
          pdf.setFont(undefined,"normal");
        } else {
          pdf.setFontSize(9); pdf.setTextColor(51,65,85); pdf.setFont(undefined,"normal");
          var wrapped = pdf.splitTextToSize(line, maxW);
          for(var j=0; j<wrapped.length; j++){
            if(y+lineH > pageH){ pdf.addPage(); y=margin; }
            pdf.text(wrapped[j], margin, y); y+=lineH;
          }
        }
      }
    }

    y+=6;
    if(y+10 > pageH){ pdf.addPage(); y=margin; }
    pdf.setDrawColor(200); pdf.line(margin, y, pW-margin, y); y+=4;
    pdf.setFontSize(7); pdf.setTextColor(150);
    pdf.text("Brujula KIT \u2014 "+(evalLabel||"")+" \u2014 Debe ser revisado por el profesional tratante.", margin, y);
    pdf.text(new Date().toLocaleDateString("es-AR"), pW-margin, y, {align:"right"});

    pdf.save(filename);
  });
}

function ReportCard({ title, titleColor, borderColor, report, ev, evalLabel, onPDF, onReportChange }) {
  var _editing = useState(false), editing = _editing[0], setEditing = _editing[1];
  var _editText = useState(""), editText = _editText[0], setEditText = _editText[1];

  var startEdit = function(){ setEditText(report || ""); setEditing(true); };
  var saveEdit = function(){ if(onReportChange) onReportChange(editText); setEditing(false); };

  return <div style={{flex:1,minWidth:0}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:6}}>
      <div style={{fontSize:14,fontWeight:700,color:titleColor||K.sd}}>{title}</div>
      <div style={{display:"flex",gap:6}}>
        {!editing && <button onClick={startEdit} style={{padding:"6px 12px",background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",color:K.mt}}>{"Editar"}</button>}
        <button onClick={function(){onPDF(editing?editText:report)}} style={{padding:"6px 12px",background:titleColor||K.ac,color:"#fff",border:"none",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer"}}>{"Imprimir"}</button>
      </div>
    </div>
    <div style={{background:"#fff",borderRadius:12,border:"2px solid "+(borderColor||K.bd),padding:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,paddingBottom:10,borderBottom:"1px solid #e2e8f0"}}>
        <div>
          <div style={{fontSize:9,color:titleColor||K.mt,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>{title+" \u2014 "+(evalLabel||"")}</div>
          <div style={{fontSize:16,fontWeight:700,marginTop:3}}>{ev.paciente}</div>
          <div style={{fontSize:12,color:K.mt,marginTop:2}}>{"DNI: "+(ev.pacienteDni||"N/A")+" \u00b7 Edad: "+ageLabel(ev.edadMeses||0)}</div>
        </div>
        <div style={{textAlign:"right",fontSize:11,color:K.mt}}>{"Fecha: "+(ev.fechaEvaluacion||"")}</div>
      </div>
      {editing ? <div>
        <textarea value={editText} onChange={function(e){setEditText(e.target.value)}} rows={16} style={{width:"100%",padding:"12px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:13,lineHeight:1.7,fontFamily:"inherit",resize:"vertical"}} />
        <div style={{display:"flex",gap:8,marginTop:10}}>
          <button onClick={saveEdit} style={{padding:"8px 16px",background:"#059669",color:"#fff",border:"none",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer"}}>{"Guardar cambios"}</button>
          <button onClick={function(){setEditing(false)}} style={{padding:"8px 16px",background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:6,fontSize:12,cursor:"pointer",color:K.mt}}>{"Cancelar"}</button>
        </div>
      </div> : <div style={{fontSize:13,lineHeight:1.7}}>{renderReportText(report)}</div>}
      <div style={{marginTop:14,paddingTop:8,borderTop:"1px solid #e2e8f0",fontSize:9,color:"#94a3b8",textAlign:"center"}}>{"Brujula KIT \u2014 "+(evalLabel||"")+" \u2014 "+new Date().toLocaleDateString("es-AR")+" \u2014 Debe ser revisado por el profesional tratante."}</div>
    </div>
  </div>;
}

export default function AIReportPanel({ ev, evalType, collectionName, evalLabel, autoGenerate }){
  var existingReport = ev.aiReport || null;
  var _report = useState(existingReport), report = _report[0], setReport = _report[1];
  var _generating = useState(false), generating = _generating[0], setGenerating = _generating[1];
  var _genError = useState(null), genError = _genError[0], setGenError = _genError[1];
  var _autoTriggered = useState(false), autoTriggered = _autoTriggered[0], setAutoTriggered = _autoTriggered[1];
  var fbIdRef = useRef(ev._fbId);
  useEffect(function(){ fbIdRef.current = ev._fbId; }, [ev._fbId]);

  useEffect(function(){
    if(existingReport && !report) setReport(existingReport);
  }, [existingReport]);

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

  var handleGenerate = function(){
    setGenerating(true); setGenError(null);
    fetch("/api/generate-report", {
      method: "POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ evalData: buildEvalData(), evalType: evalType, reportMode: "clinico" })
    })
    .then(function(r){ return r.json(); })
    .then(function(data){
      if(data.success && data.report){
        setReport(data.report);
        var saveToFirestore = function(retries){
          var id = fbIdRef.current || ev._fbId;
          if(id && collectionName){
            updateDoc(doc(db, collectionName, id), {aiReport: data.report, aiReportDate: new Date().toISOString()}).catch(function(e){console.error("Save report error:",e);});
          } else if(retries > 0){
            setTimeout(function(){ saveToFirestore(retries-1); }, 2000);
          }
        };
        saveToFirestore(5);
      } else {
        setGenError(data.error || "Error al generar informe.");
      }
      setGenerating(false);
    })
    .catch(function(e){
      setGenError("Error: "+e.message);
      setGenerating(false);
    });
  };

  var pdfName = function(prefix){ return prefix+"_"+evalType.toUpperCase()+"_"+((ev.paciente||"").replace(/\s/g,"_"))+"_"+(ev.fechaEvaluacion||"")+".pdf"; };

  // Auto-generate
  useEffect(function(){
    if(!autoGenerate || existingReport || report || generating || genError || autoTriggered) return;
    var timer = setTimeout(function(){
      setAutoTriggered(true);
      try { handleGenerate(); } catch(e){ console.error(e); }
    }, 1500);
    return function(){ clearTimeout(timer); };
  }, [autoGenerate]);

  if(!report && !generating && !genError) return <div style={{background:"#fffbeb",borderRadius:10,padding:"14px 18px",marginBottom:16,fontSize:13,color:"#92400e",border:"1px solid #fde68a",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
    <span>{"No se genero informe IA para esta evaluacion."}</span>
    <button onClick={handleGenerate} style={{padding:"8px 18px",background:"#9333ea",color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>Generar informe ahora</button>
  </div>;

  if(generating) return <div style={{background:"#fff",borderRadius:14,border:"1px solid "+K.bd,padding:40,textAlign:"center",marginBottom:20}}>
    <div style={{display:"inline-block",width:40,height:40,border:"4px solid #e2e8f0",borderTopColor:"#9333ea",borderRadius:"50%",animation:"spin 1s linear infinite",marginBottom:16}} />
    <div style={{fontSize:15,fontWeight:600,color:K.sd}}>Generando informe con IA...</div>
    <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
  </div>;

  if(genError && !report) return <div style={{background:"#fff",borderRadius:14,border:"1px solid "+K.bd,padding:28,textAlign:"center",marginBottom:20}}>
    <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#dc2626"}}>{genError}</div>
    <button onClick={handleGenerate} style={{padding:"10px 24px",background:"#9333ea",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>Reintentar</button>
  </div>;

  return <div style={{marginBottom:20}}>
    <ReportCard title={"Informe Fonoaudiologico"} titleColor={K.sd} borderColor={K.bd} report={report} ev={ev} evalLabel={evalLabel||evalType.toUpperCase()} onPDF={function(txt){ textPDF("Informe Fonoaudiologico", evalLabel||evalType.toUpperCase(), ev, txt||report, pdfName("Informe")); }} onReportChange={function(t){setReport(t)}} />
  </div>;
}
