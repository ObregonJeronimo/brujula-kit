import { useState, useEffect } from "react";
import { K, fbAdd } from "../lib/fb.js";
import { ALL_EVAL_TYPES, EVAL_AREAS, EVAL_TYPES, getEvalType } from "../config/evalTypes.js";
import { loadDrafts, deleteDraft } from "../lib/drafts.js";
import { renderReportText } from "../lib/evalUtils.jsx";
import "../styles/Tools.css";

export default function Tools({ TC, onSel, credits, onBuy, enabledTools, toolsConfig, userId, onResumeDraft, allEvals, nfy, therapistInfo, deductCredit, isAdmin }) {
  var _drafts = useState([]), drafts = _drafts[0], setDrafts = _drafts[1];
  var _openArea = useState(null), openArea = _openArea[0], setOpenArea = _openArea[1];
  var _info = useState(null), showInfo = _info[0], setShowInfo = _info[1];
  var _showConsol = useState(false), showConsol = _showConsol[0], setShowConsol = _showConsol[1];
  var _consolPatient = useState(null), consolPatient = _consolPatient[0], setConsolPatient = _consolPatient[1];
  var _consolSelected = useState({}), consolSelected = _consolSelected[0], setConsolSelected = _consolSelected[1];
  var _consolReport = useState(null), consolReport = _consolReport[0], setConsolReport = _consolReport[1];
  var _consolEditing = useState(false), consolEditing = _consolEditing[0], setConsolEditing = _consolEditing[1];
  var _consolEditText = useState(""), consolEditText = _consolEditText[0], setConsolEditText = _consolEditText[1];
  var _consolGen = useState(false), consolGenerating = _consolGen[0], setConsolGenerating = _consolGen[1];
  var noCredits = credits < 1;

  var _refreshKey = useState(0), refreshKey = _refreshKey[0];
  useEffect(function(){
    if(!userId) return;
    loadDrafts(userId).then(setDrafts);
  }, [userId, refreshKey]);
  // Reload drafts when component becomes visible (user navigated back)
  useEffect(function(){
    if(!userId) return;
    loadDrafts(userId).then(setDrafts);
  }, []);

  var handleDeleteDraft = function(draftId){
    if(!window.confirm("Eliminar evaluacion pausada?")) return;
    deleteDraft(draftId).then(function(){
      setDrafts(function(prev){ return prev.filter(function(d){ return d._fbId !== draftId; }); });
    });
  };

  var isEnabled = function(toolId){ return !enabledTools || enabledTools[toolId] !== false; };

  // Get unique patients from evals
  var patients = [];
  var seenDni = {};
  (allEvals||[]).forEach(function(ev){
    var key = ev.pacienteDni || ev.paciente || "";
    if(!key || seenDni[key]) return;
    seenDni[key] = true;
    patients.push({ nombre: ev.paciente, dni: ev.pacienteDni || "", edadMeses: ev.edadMeses || 0 });
  });

  var patientEvals = consolPatient ? (allEvals||[]).filter(function(ev){
    return (ev.pacienteDni || ev.paciente) === (consolPatient.dni || consolPatient.nombre) && ev.tipo !== "complementario";
  }) : [];

  var selectedCount = Object.keys(consolSelected).filter(function(k){ return consolSelected[k]; }).length;

  var handleGenerateConsol = function(){
    var selected = patientEvals.filter(function(ev){ return consolSelected[ev._fbId]; });
    if(selected.length < 2){ if(nfy) nfy("Selecciona al menos 2 evaluaciones","er"); return; }
    // Cobrar crédito con confirmación
    if(!isAdmin){
      var ok = window.confirm("Generar Informe Complementario?\n\nSe consumir\u00e1 1 cr\u00e9dito de tu cuenta.\nEsta acci\u00f3n no se puede deshacer.");
      if(!ok) return;
      if(deductCredit){
        deductCredit().then(function(success){
          if(success) doGenerateConsol(selected);
        });
        return;
      }
    }
    doGenerateConsol(selected);
  };
  var doGenerateConsol = function(selected){
    setConsolGenerating(true); setConsolReport(null);
    var summary = selected.map(function(ev){
      var t = getEvalType(ev.tipo);
      return (t?t.fullName:ev.tipo) + " (" + new Date(ev.fechaGuardado||ev.fechaEvaluacion).toLocaleDateString("es-AR") + "): " + JSON.stringify(ev.resultados||{}).substring(0,300);
    }).join("\n");
    var evalData = {
      paciente: consolPatient.nombre, pacienteDni: consolPatient.dni, edadMeses: consolPatient.edadMeses || 0,
      fechaEvaluacion: new Date().toISOString().split("T")[0],
      observaciones: "Informe consolidado de " + selected.length + " evaluaciones seleccionadas",
      resultados: { resumen: summary, cantEvals: selected.length }
    };
    fetch("/api/generate-report", {
      method: "POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ evalData: evalData, evalType: "consolidado", reportMode: "consolidado" })
    }).then(function(r){ return r.json(); })
    .then(function(data){
      if(data.success && data.report){
        setConsolReport(data.report);
        // Guardar en historial
        var payload = {
          id: Date.now()+"", userId: userId, tipo: "complementario",
          paciente: consolPatient.nombre, pacienteDni: consolPatient.dni || "",
          fechaNacimiento: consolPatient.fechaNac || "", edadMeses: consolPatient.edadMeses || 0,
          fechaEvaluacion: new Date().toISOString().split("T")[0],
          observaciones: "Informe complementario de " + selected.length + " evaluaciones",
          fechaGuardado: new Date().toISOString(),
          aiReport: data.report,
          resultados: { cantEvals: selected.length, evaluacionesIncluidas: selected.map(function(ev){ return { tipo: ev.tipo, fecha: ev.fechaEvaluacion || ev.fechaGuardado }; }) }
        };
        fbAdd("evaluaciones", payload).then(function(r){
          if(r.success && nfy) nfy("Informe complementario guardado en historial", "ok");
        });
      }
      else { if(nfy) nfy("Error: " + (data.error||""),"er"); }
      setConsolGenerating(false);
    }).catch(function(e){ if(nfy) nfy("Error: " + e.message,"er"); setConsolGenerating(false); });
  };

  return (
    <div className="tools-page">
      <h1 className="tools-title">{"Herramientas"}</h1>
      <p className="tools-subtitle">Seleccione un area de evaluacion</p>

      {/* Pending drafts */}
      {drafts.length > 0 && <div className="tools-drafts-wrap">
        <div className="tools-drafts">
          <div className="tools-drafts-title">{"Evaluaciones en progreso"}</div>
          <div className="tools-drafts-list">
            {drafts.map(function(d){
              var evalConfig = getEvalType(d.evalType);
              var data = d.data || {};
              var patientName = data.patient ? data.patient.nombre : (data.selectedPatient ? data.selectedPatient.nombre : (data.pd ? data.pd.pN : "Sin paciente"));
              return <div key={d._fbId} className="tools-draft-item">
                <div className="tools-draft-info">
                  <span className="tools-draft-icon">{evalConfig ? evalConfig.icon : ""}</span>
                  <div>
                    <div className="tools-draft-name">{evalConfig ? evalConfig.fullName : d.evalType}</div>
                    <div className="tools-draft-patient">{patientName}</div>
                  </div>
                </div>
                <div className="tools-draft-actions">
                  <button onClick={function(){ if(onResumeDraft) onResumeDraft(d); }} className="tools-btn-continue">Continuar</button>
                  <button onClick={function(){ handleDeleteDraft(d._fbId); }} className="tools-btn-discard">Descartar</button>
                </div>
              </div>;
            })}
          </div>
        </div>
      </div>}

      {noCredits && <div className="tools-no-credits">
        <div>
          <div className="tools-no-credits-title">{"Sin creditos restantes"}</div>
          <div className="tools-no-credits-desc">Necesitas creditos para realizar evaluaciones</div>
        </div>
        <button onClick={onBuy} className="tools-btn-buy">COMPRAR CREDITOS</button>
      </div>}

      {/* Evaluation Areas */}
      <div className="tools-areas">
        {EVAL_AREAS.map(function(area){
          var areaTools = area.tools.map(function(tid){ return EVAL_TYPES[tid]; }).filter(function(t){ return t && isEnabled(t.id); });
          if(areaTools.length === 0) return null;
          var isOpen = openArea === area.id;

          return <div key={area.id} className="tools-area">
            <div onClick={function(){ setOpenArea(isOpen ? null : area.id); }} className="tools-area-header">
              <div className="tools-area-header-info">
                <span className="tools-area-icon">{area.icon}</span>
                <div>
                  <div className="tools-area-name">{area.name}</div>
                  <div className="tools-area-desc">{area.desc}</div>
                </div>
              </div>
              <div className={"tools-area-chevron"+(isOpen?" tools-area-chevron--open":"")}>{"v"}</div>
            </div>

            {isOpen && <div className="tools-area-body">
              <div className="tools-grid">
                {areaTools.map(function(t){
                  var infoOpen = showInfo === t.newView;
                  var info = t.info;
                  return <div key={t.id} className={"tools-card"+(noCredits?" tools-card--disabled":"")}>
                    <div className="tools-card-body">
                      <div className="tools-card-header">
                        <span className="tools-card-icon">{t.icon}</span>
                        <div className="tools-card-title" style={{color:t.color}}>{t.fullName}</div>
                      </div>
                      <p className="tools-card-desc">{t.desc}</p>
                      <div className="tools-card-meta">
                        {(function(){
                          var tc = toolsConfig && toolsConfig[t.id] ? toolsConfig[t.id] : {};
                          var showAge = tc.showAge !== false;
                          var ageText = tc.age || t.age || "";
                          var timeText = tc.time || t.time || "";
                          var parts = [];
                          if(showAge && ageText) parts.push("Edad: " + ageText);
                          if(timeText) parts.push("Tiempo: " + timeText);
                          return parts.join(" \u00b7 ");
                        })()}
                      </div>
                      {noCredits
                        ? <button onClick={onBuy} className="tools-card-start" style={{background:"linear-gradient(135deg,#f59e0b,#d97706)"}}>COMPRAR CREDITOS</button>
                        : <button onClick={function(){onSel(t.newView)}} className="tools-card-start" style={{background:t.color}}>{"Iniciar"}</button>}
                      {info && <button onClick={function(){ setShowInfo(infoOpen ? null : t.newView); }} className="tools-card-info-btn" style={{border:"1px solid "+t.color+"44",color:t.color}}>
                        {infoOpen ? "Ocultar informacion" : "Ver informacion"}
                      </button>}
                      {infoOpen && info && <div className="tools-card-info-panel" style={{background:"linear-gradient(135deg,"+t.color+"08,"+t.color+"12)",border:"1px solid "+t.color+"30"}}>
                        <div className="tools-card-info-title" style={{color:t.color}}>{info.title}</div>
                        {info.sections.map(function(sec, i){
                          return <div key={i} className="tools-card-info-section">
                            <div className="tools-card-info-section-label" style={{color:t.color}}>{sec.label}</div>
                            <div className="tools-card-info-section-text">{sec.text}</div>
                          </div>;
                        })}
                      </div>}
                    </div>
                  </div>;
                })}
              </div>
            </div>}
          </div>;
        })}

        {/* Consolidated Report Builder */}
        <div className="tools-area">
          <div onClick={function(){ setShowConsol(!showConsol); setConsolReport(null); setConsolPatient(null); setConsolSelected({}); }} className="tools-area-header">
            <div className="tools-area-header-info">
              <span className="tools-area-icon">{"📋"}</span>
              <div>
                <div className="tools-area-name">Informe Complementario</div>
                <div className="tools-area-desc">{"Gener\u00e1 un informe integrando m\u00faltiples evaluaciones de un mismo paciente"}</div>
              </div>
            </div>
            <div className={"tools-area-chevron"+(showConsol?" tools-area-chevron--open":"")}>{"v"}</div>
          </div>

          {showConsol && <div className="tools-area-body">
            {/* Step 1: Select patient */}
            {!consolPatient && <div>
              <div className="tools-consol-step-title">{"1. Selecciona un paciente"}</div>
              {patients.length === 0 && <div className="tools-consol-empty">No hay evaluaciones realizadas todavia</div>}
              <div className="tools-consol-list">
                {patients.map(function(p,i){
                  var evCount = (allEvals||[]).filter(function(ev){ return (ev.pacienteDni||ev.paciente) === (p.dni||p.nombre); }).length;
                  return <button key={i} onClick={function(){ setConsolPatient(p); setConsolSelected({}); setConsolReport(null); }} className="tools-consol-patient">
                    <div>
                      <div className="tools-consol-patient-name">{p.nombre}</div>
                      <div className="tools-consol-patient-dni">{"DNI: "+(p.dni||"N/A")}</div>
                    </div>
                    <span className="tools-consol-patient-count">{evCount + " eval."}</span>
                  </button>;
                })}
              </div>
            </div>}

            {/* Step 2: Select evaluations */}
            {consolPatient && !consolReport && !consolGenerating && <div>
              <div className="tools-consol-step-header">
                <div className="tools-consol-step-title" style={{marginBottom:0}}>{"2. Selecciona evaluaciones para " + consolPatient.nombre}</div>
                <button onClick={function(){ setConsolPatient(null); setConsolSelected({}); }} className="tools-consol-change-btn">{"Cambiar paciente"}</button>
              </div>
              {patientEvals.length < 2 && <div className="tools-consol-warn">{"Este paciente tiene menos de 2 evaluaciones. Se necesitan al menos 2 para generar un informe complementario."}</div>}
              <div className="tools-consol-evals">
                {patientEvals.map(function(ev){
                  var t = getEvalType(ev.tipo);
                  var checked = !!consolSelected[ev._fbId];
                  return <label key={ev._fbId} className={"tools-consol-eval"+(checked?" tools-consol-eval--checked":"")}>
                    <input type="checkbox" checked={checked} onChange={function(){ setConsolSelected(function(prev){ var n = Object.assign({},prev); n[ev._fbId] = !prev[ev._fbId]; return n; }); }} className="tools-consol-checkbox" style={{accentColor:"var(--c-accent)"}} />
                    <span className="tools-consol-eval-icon">{t ? t.icon : ""}</span>
                    <div style={{flex:1}}>
                      <div className="tools-consol-eval-name">{t ? t.fullName : ev.tipo}</div>
                      <div className="tools-consol-eval-date">{new Date(ev.fechaGuardado||ev.fechaEvaluacion).toLocaleDateString("es-AR")}</div>
                    </div>
                    <div className="tools-consol-eval-sev" style={{color:t?t.color:"#64748b"}}>{ev.resultados && ev.resultados.severity ? ev.resultados.severity : ""}</div>
                  </label>;
                })}
              </div>
              <button onClick={handleGenerateConsol} disabled={selectedCount < 2} className="tools-consol-generate-btn" style={{background:selectedCount<2?"#94a3b8":"linear-gradient(135deg, var(--c-primary), var(--c-accent))",cursor:selectedCount<2?"not-allowed":"pointer"}}>{"Generar Informe Complementario (" + selectedCount + " seleccionadas)"}</button>
            </div>}

            {/* Generating */}
            {consolGenerating && <div className="tools-consol-generating">
              <div className="tools-consol-spinner" />
              <div className="tools-consol-generating-text">Generando informe complementario...</div>
            </div>}

            {/* Report result */}
            {consolReport && <div>
              <div className="tools-consol-report-header">
                <div className="tools-consol-report-title">{"Informe Complementario - " + consolPatient.nombre}</div>
                <div className="tools-consol-report-actions">
                  {!consolEditing && <button onClick={function(){ setConsolEditText(consolReport); setConsolEditing(true); }} className="tools-btn-edit">{"Editar"}</button>}
                  <button onClick={function(){
                    var textToUse = consolEditing ? consolEditText : consolReport;
                    import("jspdf").then(function(mod){
                      var jsPDF=mod.jsPDF,pdf=new jsPDF("p","mm","a4"),pW=210,margin=14,maxW=182,y=14;
                      var ti = therapistInfo || {};
                      if(ti.therapist || ti.clinic){
                        pdf.setFontSize(11);pdf.setTextColor(10,61,47);pdf.setFont(undefined,"bold");
                        if(ti.clinic){pdf.text(ti.clinic,margin,y);y+=5;}
                        if(ti.address){pdf.setFontSize(8);pdf.setTextColor(100);pdf.setFont(undefined,"normal");pdf.text(ti.address,margin,y);y+=4;}
                        if(ti.therapist){pdf.setFontSize(9);pdf.setTextColor(10,61,47);pdf.setFont(undefined,"bold");pdf.text(ti.therapist+(ti.license?" \u2014 "+ti.license:""),margin,y);y+=4;pdf.setFont(undefined,"normal");}
                        var cp=[ti.phone,ti.email].filter(Boolean);if(cp.length>0){pdf.setFontSize(7);pdf.setTextColor(140);pdf.text(cp.join(" \u00b7 "),margin,y);y+=4;}
                        pdf.setDrawColor(10,61,47);pdf.setLineWidth(0.5);pdf.line(margin,y,pW-margin,y);y+=8;
                      }
                      pdf.setFontSize(8);pdf.setTextColor(120);pdf.text("Informe Complementario - "+consolPatient.nombre,margin,y);y+=8;
                      pdf.setDrawColor(200);pdf.line(margin,y,196,y);y+=8;
                      pdf.setFontSize(14);pdf.setTextColor(10,61,47);pdf.setFont(undefined,"bold");pdf.text(consolPatient.nombre,margin,y);y+=7;
                      pdf.setFontSize(9);pdf.setTextColor(100);pdf.setFont(undefined,"normal");pdf.text("DNI: "+(consolPatient.dni||"N/A"),margin,y);y+=10;
                      textToUse.split("\n").forEach(function(line){
                        var t2=line.trim();if(!t2){y+=3;return;}
                        var isT=/^[A-Z\u00c0-\u00dc\s\d\.\:\-]{6,}:?\s*$/.test(t2);
                        if(isT){y+=3;pdf.setFontSize(10);pdf.setTextColor(10,61,47);pdf.setFont(undefined,"bold");if(y+7>283){pdf.addPage();y=14;}pdf.text(t2,margin,y);y+=7;pdf.setFont(undefined,"normal");}
                        else{pdf.setFontSize(9);pdf.setTextColor(51,65,85);var w=pdf.splitTextToSize(t2,maxW);w.forEach(function(l){if(y+5>283){pdf.addPage();y=14;}pdf.text(l,margin,y);y+=5;});}
                      });
                      pdf.save("Complementario_"+consolPatient.nombre.replace(/\s/g,"_")+".pdf");
                    });
                  }} className="tools-btn-print">{"Imprimir"}</button>
                  <button onClick={function(){ setConsolReport(null); setConsolSelected({}); setConsolEditing(false); }} className="tools-btn-new">{"Nuevo informe"}</button>
                </div>
              </div>
              <div className="tools-consol-report">
                {therapistInfo && (therapistInfo.therapist || therapistInfo.clinic) && <div className="tools-consol-therapist-header">
                  {therapistInfo.clinic && <div className="tools-consol-therapist-clinic">{therapistInfo.clinic}</div>}
                  {therapistInfo.address && <div className="tools-consol-therapist-addr">{therapistInfo.address}</div>}
                  {therapistInfo.therapist && <div className="tools-consol-therapist-name">{therapistInfo.therapist}{therapistInfo.license ? " \u2014 " + therapistInfo.license : ""}</div>}
                  {(therapistInfo.phone || therapistInfo.email) && <div className="tools-consol-therapist-contact">{[therapistInfo.phone, therapistInfo.email].filter(Boolean).join(" \u00b7 ")}</div>}
                </div>}
                {consolEditing ? <div>
                  <textarea value={consolEditText} onChange={function(e){setConsolEditText(e.target.value)}} rows={18} className="tools-consol-editor" />
                  <div className="tools-consol-editor-actions">
                    <button onClick={function(){ setConsolReport(consolEditText); setConsolEditing(false); }} className="tools-btn-save-edit">{"Guardar cambios"}</button>
                    <button onClick={function(){ setConsolEditing(false); }} className="tools-btn-cancel-edit">{"Cancelar"}</button>
                  </div>
                </div> : <div className="tools-consol-report-text">{renderReportText(consolReport)}</div>}
              </div>
            </div>}
          </div>}
        </div>
      </div>
    </div>
  );
}
