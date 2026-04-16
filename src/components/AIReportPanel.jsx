import { useState, useRef, useEffect } from "react";
import { db, doc, updateDoc } from "../firebase.js";
import { K as _K, ageLabel } from "../lib/fb.js";
import { renderReportText } from "../lib/evalUtils.jsx";
import "../styles/AIReportPanel.css";
var K = Object.assign({}, _K, { ac: "#9333ea" });

function textPDF(title, evalLabel, ev, reportText, filename, therapistInfo){
  import("jspdf").then(function(mod){
    var jsPDF = mod.jsPDF;
    var pdf = new jsPDF("p","mm","a4");
    var pW=210, margin=14, maxW=pW-margin*2, y=margin;
    var lineH=5, titleH=7;
    var pageH=297-margin*2;
    var ti = therapistInfo || {};

    // Encabezado del profesional (si está configurado)
    if(ti.therapist || ti.clinic){
      pdf.setFontSize(11); pdf.setTextColor(10,61,47); pdf.setFont(undefined,"bold");
      if(ti.clinic){ pdf.text(ti.clinic, margin, y); y+=5; }
      if(ti.address){ pdf.setFontSize(8); pdf.setTextColor(100); pdf.setFont(undefined,"normal"); pdf.text(ti.address, margin, y); y+=4; }
      if(ti.therapist){ pdf.setFontSize(9); pdf.setTextColor(10,61,47); pdf.setFont(undefined,"bold"); pdf.text(ti.therapist+(ti.license?" \u2014 "+ti.license:""), margin, y); y+=4; pdf.setFont(undefined,"normal"); }
      var contactParts = [ti.phone, ti.email].filter(Boolean);
      if(contactParts.length > 0){ pdf.setFontSize(7); pdf.setTextColor(140); pdf.text(contactParts.join(" \u00b7 "), margin, y); y+=4; }
      pdf.setDrawColor(10,61,47); pdf.setLineWidth(0.5); pdf.line(margin, y, pW-margin, y); y+=8;
    }

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
    pdf.text(new Date().toLocaleDateString("es-AR"), pW-margin, y, {align:"right"});
    // Therapist info in footer if available
    if(ev.therapistName){
      y+=4;
      pdf.text(ev.therapistName + (ev.therapistLicense ? " - Mat. " + ev.therapistLicense : ""), margin, y);
    }

    pdf.save(filename);
  });
}

function ReportCard({ title, titleColor, borderColor, report, ev, evalLabel, onPDF, onReportChange, therapistInfo }) {
  var _editing = useState(false), editing = _editing[0], setEditing = _editing[1];
  var _editText = useState(""), editText = _editText[0], setEditText = _editText[1];

  var startEdit = function(){ setEditText(report || ""); setEditing(true); };
  var saveEdit = function(){ if(onReportChange) onReportChange(editText); setEditing(false); };
  var ti = therapistInfo || {};
  var hasHeader = ti.therapist || ti.clinic;

  // Inyectamos los colores dinámicos como CSS variables al wrapper de la card.
  var cardVars = {};
  if(titleColor) cardVars["--aip-title-color"] = titleColor;
  if(borderColor) cardVars["--aip-border-color"] = borderColor;

  return <div className="aip-card-wrap" style={cardVars}>
    <div className="aip-card-toolbar">
      <div className="aip-card-title">{title}</div>
      <div className="aip-card-actions">
        {!editing && <button onClick={startEdit} className="aip-btn-edit">{"Editar"}</button>}
        <button onClick={function(){onPDF(editing?editText:report)}} className="aip-btn-print">{"Imprimir"}</button>
      </div>
    </div>
    <div className="aip-card">
      {/* Encabezado del profesional */}
      {hasHeader && <div className="aip-letterhead">
        {ti.clinic && <div className="aip-letterhead-clinic">{ti.clinic}</div>}
        {ti.address && <div className="aip-letterhead-address">{ti.address}</div>}
        {ti.therapist && <div className="aip-letterhead-therapist">{ti.therapist}{ti.license ? " \u2014 "+ti.license : ""}</div>}
        {(ti.phone || ti.email) && <div className="aip-letterhead-contact">{[ti.phone,ti.email].filter(Boolean).join(" \u00b7 ")}</div>}
      </div>}
      <div className="aip-meta">
        <div>
          <div className="aip-meta-kicker">{title+" \u2014 "+(evalLabel||"")}</div>
          <div className="aip-meta-name">{ev.paciente}</div>
          <div className="aip-meta-sub">{"DNI: "+(ev.pacienteDni||"N/A")+" \u00b7 Edad: "+ageLabel(ev.edadMeses||0)}</div>
        </div>
        <div className="aip-meta-date">{"Fecha: "+(ev.fechaEvaluacion||"")}</div>
      </div>
      {editing ? <div>
        <textarea value={editText} onChange={function(e){setEditText(e.target.value)}} rows={16} className="aip-textarea" />
        <div className="aip-edit-actions">
          <button onClick={saveEdit} className="aip-btn-save">{"Guardar cambios"}</button>
          <button onClick={function(){setEditing(false)}} className="aip-btn-cancel">{"Cancelar"}</button>
        </div>
      </div> : <div className="aip-body">{renderReportText(report)}</div>}
    </div>
  </div>;
}

export default function AIReportPanel({ ev, evalType, collectionName, evalLabel, autoGenerate, therapistInfo }){
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
      resultados: ev.resultados || {},
      therapistName: therapistInfo ? therapistInfo.therapist : "",
      therapistLicense: therapistInfo ? therapistInfo.license : ""
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

  if(!report && !generating && !genError) return <div className="aip-warning">
    <span>{"No se genero informe IA para esta evaluacion."}</span>
    <button onClick={handleGenerate} className="aip-btn-purple aip-btn-purple--sm">Generar informe ahora</button>
  </div>;

  if(generating) return <div className="aip-loading">
    <div className="aip-spinner" />
    <div className="aip-loading-text">Generando informe con IA...</div>
  </div>;

  if(genError && !report) return <div className="aip-error-box">
    <div className="aip-error-msg">{genError}</div>
    <button onClick={handleGenerate} className="aip-btn-purple aip-btn-purple--md">Reintentar</button>
  </div>;

  return <div className="aip">
    <ReportCard
      title={"Informe Fonoaudiologico"}
      titleColor={K.sd}
      borderColor={K.bd}
      report={report}
      ev={ev}
      evalLabel={evalLabel||evalType.toUpperCase()}
      therapistInfo={therapistInfo}
      onPDF={function(txt){ textPDF("Informe Fonoaudiologico", evalLabel||evalType.toUpperCase(), ev, txt||report, pdfName("Informe"), therapistInfo); }}
      onReportChange={function(t){setReport(t)}}
    />
  </div>;
}
