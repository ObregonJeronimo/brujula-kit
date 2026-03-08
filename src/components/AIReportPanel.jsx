import { useState, useRef, useEffect } from "react";
import { db, doc, updateDoc } from "../firebase.js";

var K = { sd:"#0a3d2f", ac:"#9333ea", mt:"#64748b", bd:"#e2e8f0" };

function renderReportText(text){
  if(!text) return null;
  var lines = text.split("\n");
  return lines.map(function(line, i){
    var trimmed = line.trim();
    if(!trimmed) return <div key={i} style={{height:8}} />;
    var isTitle = /^[A-Z\u00c0-\u00dc\s\d\.\:\-]{6,}:?\s*$/.test(trimmed) || /^\d+[\.\)]\s*[A-Z]/.test(trimmed);
    if(isTitle){
      return <div key={i} style={{fontSize:14,fontWeight:700,color:K.sd,marginTop:14,marginBottom:4}}>{trimmed}</div>;
    }
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
      var jsPDF = mod.jsPDF;
      var pdf = new jsPDF("p","mm","a4");
      var pW=210, pH=297, margin=10;
      var imgW=pW-margin*2;
      var imgH=(canvas.height*imgW)/canvas.width;
      var usableH=pH-margin*2;
      var pos=0, page=0;
      while(pos<imgH){
        if(page>0) pdf.addPage();
        var srcY=Math.round((pos/imgH)*canvas.height);
        var srcH=Math.round((Math.min(usableH,imgH-pos)/imgH)*canvas.height);
        if(srcH<=0) break;
        var sliceCanvas=document.createElement("canvas");
        sliceCanvas.width=canvas.width; sliceCanvas.height=srcH;
        var ctx=sliceCanvas.getContext("2d");
        ctx.drawImage(canvas,0,srcY,canvas.width,srcH,0,0,canvas.width,srcH);
        var sliceH=(srcH*imgW)/canvas.width;
        if(sliceH<1) break;
        pdf.addImage(sliceCanvas.toDataURL("image/png"),"PNG",margin,margin,imgW,sliceH);
        pos+=usableH; page++;
      }
      pdf.save(filename);
    });
  }).catch(function(e){ el.style.paddingBottom = ""; console.error(e); });
}

function ageLabel(m){ return Math.floor(m/12)+" a\u00f1os, "+(m%12)+" meses"; }

// Props:
// ev - evaluation object
// evalType - "eldi"|"peff"|"rep"|"disc"|"reco"
// collectionName - Firestore collection name
// evalLabel - display name like "ELDI" or "Rep. Palabras"
export default function AIReportPanel({ ev, evalType, collectionName, evalLabel }){
  var _report = useState(ev.aiReport || null), report = _report[0], setReport = _report[1];
  var _cudReport = useState(ev.aiCudReport || null), cudReport = _cudReport[0], setCudReport = _cudReport[1];
  var _generating = useState(false), generating = _generating[0], setGenerating = _generating[1];
  var _genCud = useState(false), genCud = _genCud[0], setGenCud = _genCud[1];
  var _genError = useState(null), genError = _genError[0], setGenError = _genError[1];
  var _regenUsed = useState(ev.aiReportRegenerated || false), regenUsed = _regenUsed[0], setRegenUsed = _regenUsed[1];
  var _showCud = useState(false), showCud = _showCud[0], setShowCud = _showCud[1];
  var _showCudTip = useState(false), showCudTip = _showCudTip[0], setShowCudTip = _showCudTip[1];
  var reportRef = useRef(null);
  var cudRef = useRef(null);

  useEffect(function(){
    if(ev.aiReport && !report) setReport(ev.aiReport);
    if(ev.aiCudReport && !cudReport) setCudReport(ev.aiCudReport);
    if(ev.aiReportRegenerated) setRegenUsed(true);
  }, [ev.aiReport, ev.aiCudReport, ev.aiReportRegenerated]);

  // Auto-generate clinical report on mount if not exists
  useEffect(function(){
    if(!report && !generating && !genError){
      doGenerate("clinico", false);
    }
  }, []);

  function doGenerate(mode, isRegen){
    if(mode === "clinico"){ setGenerating(true); }
    else { setGenCud(true); }
    setGenError(null);

    fetch("/api/generate-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ evalData: ev, evalType: evalType, reportMode: mode })
    })
    .then(function(r){ return r.json(); })
    .then(function(data){
      if(data.success && data.report){
        if(mode === "clinico"){
          setReport(data.report);
          if(isRegen) setRegenUsed(true);
          if(ev._fbId && collectionName){
            var upd = { aiReport: data.report, aiReportDate: new Date().toISOString() };
            if(isRegen) upd.aiReportRegenerated = true;
            updateDoc(doc(db, collectionName, ev._fbId), upd).catch(function(e){ console.error(e); });
          }
        } else {
          setCudReport(data.report);
          setShowCud(true);
          if(ev._fbId && collectionName){
            updateDoc(doc(db, collectionName, ev._fbId), { aiCudReport: data.report, aiCudReportDate: new Date().toISOString() }).catch(function(e){ console.error(e); });
          }
        }
      } else {
        setGenError(data.error || "Error al generar informe.");
      }
      if(mode === "clinico") setGenerating(false);
      else setGenCud(false);
    })
    .catch(function(e){
      setGenError("Error de conexi\u00f3n: " + e.message);
      if(mode === "clinico") setGenerating(false);
      else setGenCud(false);
    });
  }

  var handlePDF = function(ref, prefix){
    if(!ref.current) return;
    doPDF(ref.current, prefix+"_"+((ev.paciente||"").replace(/\s/g,"_"))+"_"+(ev.fechaEvaluacion||"")+".pdf");
  };

  // LOADING STATE
  if(generating && !report){
    return <div style={{background:"#fff",borderRadius:14,border:"1px solid "+K.bd,padding:40,textAlign:"center",marginBottom:20}}>
      <div style={{display:"inline-block",width:40,height:40,border:"4px solid #e2e8f0",borderTopColor:K.ac,borderRadius:"50%",animation:"spin 1s linear infinite",marginBottom:16}} />
      <div style={{fontSize:15,fontWeight:600,color:K.sd}}>{"Generando informe con IA..."}</div>
      <div style={{fontSize:12,color:K.mt,marginTop:6}}>{"Esto puede tardar unos segundos."}</div>
      <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
    </div>;
  }

  // ERROR STATE (no report)
  if(!report && genError){
    return <div style={{background:"#fff",borderRadius:14,border:"1px solid "+K.bd,padding:28,textAlign:"center",marginBottom:20}}>
      <div style={{fontSize:24,marginBottom:8}}>{"\ud83e\udde0"}</div>
      <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#dc2626"}}>{genError}</div>
      <button onClick={function(){ doGenerate("clinico", false); }} style={{padding:"12px 28px",background:"linear-gradient(135deg,#7c3aed,#9333ea)",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer"}}>{"Reintentar"}</button>
    </div>;
  }

  // NO REPORT YET (should not happen due to auto-generate)
  if(!report) return null;

  return <div style={{marginBottom:20}}>
    {/* CLINICAL REPORT */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
      <div style={{fontSize:15,fontWeight:700,color:K.sd}}>{"Informe Fonoaudiol\u00f3gico"}</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <button onClick={function(){ handlePDF(reportRef, "Informe_"+evalType.toUpperCase()); }} style={{padding:"7px 14px",background:K.ac,color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>{"\ud83d\udda8 Imprimir informe"}</button>
        {!cudReport && !genCud
          ? <button onClick={function(){ doGenerate("cud", false); }} style={{padding:"7px 14px",background:"#0d9488",color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>{"\ud83c\udfe5 Imprimir para CUD"}</button>
          : cudReport
            ? <button onClick={function(){ setShowCud(!showCud); }} style={{padding:"7px 14px",background:showCud?"#0a3d2f":"#0d9488",color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>{showCud ? "Ocultar CUD" : "\ud83c\udfe5 Ver informe CUD"}</button>
            : <span style={{padding:"7px 14px",background:"#f1f5f9",borderRadius:8,fontSize:12,color:K.mt}}>{"Generando CUD..."}</span>
        }
        <div style={{position:"relative",display:"inline-block"}}>
          <button onClick={function(){ setShowCudTip(!showCudTip); }} style={{width:24,height:24,borderRadius:"50%",background:"#f1f5f9",border:"1px solid #e2e8f0",fontSize:12,fontWeight:700,color:K.mt,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{"?"}</button>
          {showCudTip && <div style={{position:"absolute",top:30,right:0,background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,padding:12,width:260,fontSize:11,color:"#334155",boxShadow:"0 4px 12px rgba(0,0,0,.1)",zIndex:10,lineHeight:1.6}}>
            <strong>{"CUD (Certificado \u00danico de Discapacidad)"}</strong><br/>
            {"Es un documento que certifica la discapacidad de una persona en Argentina. El informe CUD tiene formato cl\u00ednico formal orientado a la presentaci\u00f3n ante juntas evaluadoras."}
            <div onClick={function(){ setShowCudTip(false); }} style={{marginTop:6,color:K.ac,cursor:"pointer",fontWeight:600}}>{"Cerrar"}</div>
          </div>}
        </div>
        {!regenUsed
          ? <button onClick={function(){ doGenerate("clinico", true); }} disabled={generating} style={{padding:"7px 14px",background:"#f1f5f9",color:"#64748b",border:"1px solid #e2e8f0",borderRadius:8,fontSize:12,fontWeight:600,cursor:generating?"wait":"pointer",opacity:generating?0.6:1}}>{generating ? "Regenerando..." : "\u21bb Regenerar"}</button>
          : <span style={{padding:"7px 14px",background:"#f1f5f9",color:"#cbd5e1",borderRadius:8,fontSize:12,fontWeight:600,border:"1px solid #e2e8f0"}}>{"\u21bb Regenerado"}</span>
        }
      </div>
    </div>

    <div ref={reportRef} style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,paddingBottom:12,borderBottom:"2px solid "+K.bd}}>
        <div>
          <div style={{fontSize:10,color:K.mt,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>{"Informe Fonoaudiol\u00f3gico \u2014 "+(evalLabel||evalType.toUpperCase())}</div>
          <div style={{fontSize:17,fontWeight:700,marginTop:3}}>{ev.paciente}</div>
          <div style={{fontSize:12,color:K.mt,marginTop:2}}>{"DNI: "+(ev.pacienteDni||"N/A")+" \u00b7 Edad: "+ageLabel(ev.edadMeses||0)}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:11,color:K.mt}}>{"Fecha: "+(ev.fechaEvaluacion||"")}</div>
          {ev.evaluador && <div style={{fontSize:11,color:K.mt}}>{"Evaluador: "+ev.evaluador}</div>}
        </div>
      </div>
      <div>{renderReportText(report)}</div>
      <div style={{marginTop:16,padding:8,background:"#f3e8ff",borderRadius:8,fontSize:10,color:"#7c3aed",textAlign:"center"}}>
        {"Este informe fue generado con asistencia de IA. Debe ser revisado y validado por un profesional fonoaudi\u00f3logo."}
      </div>
      <div style={{marginTop:12,paddingTop:8,borderTop:"1px solid "+K.bd,fontSize:9,color:"#94a3b8",textAlign:"center"}}>
        {"Br\u00fajula KIT \u2014 "+(evalLabel||evalType.toUpperCase())+" \u2014 "+new Date().toLocaleDateString("es-AR")}
      </div>
    </div>

    {/* CUD REPORT */}
    {showCud && cudReport && <div style={{marginTop:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontSize:14,fontWeight:700,color:"#0d9488"}}>{"\ud83c\udfe5 Informe para CUD"}</div>
        <button onClick={function(){ handlePDF(cudRef, "CUD_"+evalType.toUpperCase()); }} style={{padding:"7px 14px",background:"#0d9488",color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>{"\ud83d\udda8 Imprimir CUD"}</button>
      </div>
      <div ref={cudRef} style={{background:"#fff",borderRadius:12,border:"1px solid #99f6e4",padding:24}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,paddingBottom:12,borderBottom:"2px solid #ccfbf1"}}>
          <div>
            <div style={{fontSize:10,color:"#0d9488",fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>{"Informe para CUD \u2014 "+(evalLabel||evalType.toUpperCase())}</div>
            <div style={{fontSize:17,fontWeight:700,marginTop:3}}>{ev.paciente}</div>
            <div style={{fontSize:12,color:K.mt,marginTop:2}}>{"DNI: "+(ev.pacienteDni||"N/A")+" \u00b7 Edad: "+ageLabel(ev.edadMeses||0)}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:11,color:K.mt}}>{"Fecha: "+(ev.fechaEvaluacion||"")}</div>
          </div>
        </div>
        <div>{renderReportText(cudReport)}</div>
        <div style={{marginTop:16,padding:8,background:"#f0fdf4",borderRadius:8,fontSize:10,color:"#059669",textAlign:"center"}}>
          {"Informe generado con asistencia de IA para presentaci\u00f3n ante junta evaluadora CUD. Debe ser revisado por profesional."}
        </div>
      </div>
    </div>}
  </div>;
}
