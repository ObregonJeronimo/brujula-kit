import { useState, useEffect } from "react";
import { K } from "../lib/fb.js";
import { ALL_EVAL_TYPES, EVAL_AREAS, EVAL_TYPES, getEvalType } from "../config/evalTypes.js";
import { loadDrafts, deleteDraft } from "../lib/drafts.js";
import { renderReportText } from "../lib/evalUtils.jsx";

export default function Tools({ onSel, credits, onBuy, enabledTools, toolsConfig, userId, onResumeDraft, allEvals, nfy }) {
  var _drafts = useState([]), drafts = _drafts[0], setDrafts = _drafts[1];
  var _openArea = useState(null), openArea = _openArea[0], setOpenArea = _openArea[1];
  var _info = useState(null), showInfo = _info[0], setShowInfo = _info[1];
  var _showConsol = useState(false), showConsol = _showConsol[0], setShowConsol = _showConsol[1];
  var _consolPatient = useState(null), consolPatient = _consolPatient[0], setConsolPatient = _consolPatient[1];
  var _consolSelected = useState({}), consolSelected = _consolSelected[0], setConsolSelected = _consolSelected[1];
  var _consolReport = useState(null), consolReport = _consolReport[0], setConsolReport = _consolReport[1];
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
    return (ev.pacienteDni || ev.paciente) === (consolPatient.dni || consolPatient.nombre);
  }) : [];

  var selectedCount = Object.keys(consolSelected).filter(function(k){ return consolSelected[k]; }).length;

  var handleGenerateConsol = function(){
    var selected = patientEvals.filter(function(ev){ return consolSelected[ev._fbId]; });
    if(selected.length < 2){ if(nfy) nfy("Selecciona al menos 2 evaluaciones","er"); return; }
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
      if(data.success && data.report) setConsolReport(data.report);
      else { if(nfy) nfy("Error: " + (data.error||""),"er"); }
      setConsolGenerating(false);
    }).catch(function(e){ if(nfy) nfy("Error: " + e.message,"er"); setConsolGenerating(false); });
  };

  return (
    <div style={{animation:"fi .3s ease",width:"100%"}}>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>{"Herramientas"}</h1>
      <p style={{color:"#64748b",fontSize:14,marginBottom:16}}>Seleccione un area de evaluacion</p>

      {/* Pending drafts */}
      {drafts.length > 0 && <div style={{marginBottom:20}}>
        <div style={{background:"linear-gradient(135deg,#fef3c7,#fde68a)",border:"1px solid #f59e0b",borderRadius:12,padding:"18px 20px"}}>
          <div style={{fontSize:14,fontWeight:700,color:"#92400e",marginBottom:12}}>{"Evaluaciones en progreso"}</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {drafts.map(function(d){
              var evalConfig = getEvalType(d.evalType);
              var data = d.data || {};
              var patientName = data.patient ? data.patient.nombre : (data.selectedPatient ? data.selectedPatient.nombre : (data.pd ? data.pd.pN : "Sin paciente"));
              return <div key={d._fbId} style={{background:"#fff",borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:24}}>{evalConfig ? evalConfig.icon : ""}</span>
                  <div>
                    <div style={{fontWeight:600,fontSize:14}}>{evalConfig ? evalConfig.fullName : d.evalType}</div>
                    <div style={{fontSize:12,color:"#64748b"}}>{patientName}</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={function(){ if(onResumeDraft) onResumeDraft(d); }} style={{padding:"8px 16px",background:"#059669",color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>Continuar</button>
                  <button onClick={function(){ handleDeleteDraft(d._fbId); }} style={{padding:"8px 16px",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>Descartar</button>
                </div>
              </div>;
            })}
          </div>
        </div>
      </div>}

      {noCredits&&<div style={{background:"linear-gradient(135deg,#fef3c7,#fde68a)",border:"1px solid #f59e0b",borderRadius:12,padding:"18px 20px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:"#92400e"}}>{"Sin creditos restantes"}</div>
          <div style={{fontSize:12,color:"#a16207",marginTop:2}}>Necesitas creditos para realizar evaluaciones</div>
        </div>
        <button onClick={onBuy} style={{padding:"10px 24px",background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer"}}>COMPRAR CREDITOS</button>
      </div>}

      {/* Evaluation Areas */}
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        {EVAL_AREAS.map(function(area){
          var areaTools = area.tools.map(function(tid){ return EVAL_TYPES[tid]; }).filter(function(t){ return t && isEnabled(t.id); });
          if(areaTools.length === 0) return null;
          var isOpen = openArea === area.id;

          return <div key={area.id} style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden"}}>
            <div onClick={function(){ setOpenArea(isOpen ? null : area.id); }} style={{background:"linear-gradient(135deg,"+area.color+","+area.color+"cc)",padding:"20px 24px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",color:"#fff"}}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <span style={{fontSize:36}}>{area.icon}</span>
                <div>
                  <div style={{fontSize:18,fontWeight:700}}>{area.name}</div>
                  <div style={{fontSize:13,opacity:.85,marginTop:2}}>{area.desc}</div>
                </div>
              </div>
              <div style={{fontSize:24,fontWeight:300,transition:"transform .2s",transform:isOpen?"rotate(180deg)":"rotate(0)"}}>{"v"}</div>
            </div>

            {isOpen && <div style={{padding:20}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                {areaTools.map(function(t){
                  var infoOpen = showInfo === t.newView;
                  var info = t.info;
                  return <div key={t.id} style={{background:"#f8faf9",borderRadius:12,border:"1px solid #e2e8f0",overflow:"hidden",opacity:noCredits?0.5:1}}>
                    <div style={{padding:"16px 20px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                        <span style={{fontSize:28}}>{t.icon}</span>
                        <div style={{fontSize:16,fontWeight:700,color:t.color}}>{t.fullName}</div>
                      </div>
                      <p style={{fontSize:13,color:"#475569",lineHeight:1.6,marginBottom:12}}>{t.desc}</p>
                      <div style={{fontSize:12,color:"#64748b",marginBottom:14}}>
                        {(function(){
                          var tc = toolsConfig && toolsConfig[t.id] ? toolsConfig[t.id] : {};
                          var showAge = tc.showAge !== false;
                          var ageText = tc.age || t.age || "";
                          var timeText = tc.time || t.time || "";
                          var parts = [];
                          if(showAge && ageText) parts.push("Edad: " + ageText);
                          if(timeText) parts.push("Tiempo: " + timeText);
                          return parts.join(" · ");
                        })()}
                      </div>
                      {noCredits
                        ? <button onClick={onBuy} style={{width:"100%",padding:"10px",background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer"}}>COMPRAR CREDITOS</button>
                        : <button onClick={function(){onSel(t.newView)}} style={{width:"100%",padding:"10px",background:t.color,color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{"Iniciar"}</button>}
                      {info && <button onClick={function(){ setShowInfo(infoOpen ? null : t.newView); }}
                        style={{marginTop:8,width:"100%",padding:"8px",background:"transparent",border:"1px solid "+t.color+"44",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",color:t.color}}>
                        {infoOpen ? "Ocultar informacion" : "Ver informacion"}
                      </button>}
                      {infoOpen && info && <div style={{marginTop:10,background:"linear-gradient(135deg,"+t.color+"08,"+t.color+"12)",border:"1px solid "+t.color+"30",borderRadius:10,padding:"14px 16px",animation:"fi .3s ease"}}>
                        <div style={{fontSize:13,fontWeight:700,color:t.color,marginBottom:10}}>{info.title}</div>
                        {info.sections.map(function(sec, i){
                          return <div key={i} style={{marginBottom:i < info.sections.length-1 ? 10 : 0}}>
                            <div style={{fontSize:11,fontWeight:700,color:t.color,textTransform:"uppercase",letterSpacing:".5px",marginBottom:3}}>{sec.label}</div>
                            <div style={{fontSize:12,color:"#475569",lineHeight:1.7}}>{sec.text}</div>
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
        <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden"}}>
          <div onClick={function(){ setShowConsol(!showConsol); setConsolReport(null); setConsolPatient(null); setConsolSelected({}); }} style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)",padding:"20px 24px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",color:"#fff"}}>
            <div style={{display:"flex",alignItems:"center",gap:14}}>
              <span style={{fontSize:36}}>{"📋"}</span>
              <div>
                <div style={{fontSize:18,fontWeight:700}}>Informe Consolidado</div>
                <div style={{fontSize:13,opacity:.85,marginTop:2}}>Genera un informe integrando varias evaluaciones de un mismo paciente</div>
              </div>
            </div>
            <div style={{fontSize:24,fontWeight:300,transition:"transform .2s",transform:showConsol?"rotate(180deg)":"rotate(0)"}}>{"v"}</div>
          </div>

          {showConsol && <div style={{padding:20}}>
            {/* Step 1: Select patient */}
            {!consolPatient && <div>
              <div style={{fontSize:14,fontWeight:700,color:"#7c3aed",marginBottom:12}}>{"1. Selecciona un paciente"}</div>
              {patients.length === 0 && <div style={{fontSize:13,color:"#64748b",fontStyle:"italic"}}>No hay evaluaciones realizadas todavia</div>}
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {patients.map(function(p,i){
                  var evCount = (allEvals||[]).filter(function(ev){ return (ev.pacienteDni||ev.paciente) === (p.dni||p.nombre); }).length;
                  return <button key={i} onClick={function(){ setConsolPatient(p); setConsolSelected({}); setConsolReport(null); }} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:"#f8faf9",border:"1px solid #e2e8f0",borderRadius:10,cursor:"pointer",textAlign:"left"}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:14}}>{p.nombre}</div>
                      <div style={{fontSize:12,color:"#64748b"}}>{"DNI: "+(p.dni||"N/A")}</div>
                    </div>
                    <span style={{fontSize:12,color:"#7c3aed",fontWeight:600}}>{evCount + " eval."}</span>
                  </button>;
                })}
              </div>
            </div>}

            {/* Step 2: Select evaluations */}
            {consolPatient && !consolReport && !consolGenerating && <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontSize:14,fontWeight:700,color:"#7c3aed"}}>{"2. Selecciona evaluaciones para " + consolPatient.nombre}</div>
                <button onClick={function(){ setConsolPatient(null); setConsolSelected({}); }} style={{fontSize:12,color:"#64748b",background:"#f1f5f9",border:"none",borderRadius:6,padding:"6px 12px",cursor:"pointer"}}>{"Cambiar paciente"}</button>
              </div>
              {patientEvals.length < 2 && <div style={{fontSize:13,color:"#dc2626",background:"#fef2f2",padding:"10px 14px",borderRadius:8,marginBottom:12}}>{"Este paciente tiene menos de 2 evaluaciones. Necesitas al menos 2 para generar un informe consolidado."}</div>}
              <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:16}}>
                {patientEvals.map(function(ev){
                  var t = getEvalType(ev.tipo);
                  var checked = !!consolSelected[ev._fbId];
                  return <label key={ev._fbId} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:checked?"#f3e8ff":"#f8faf9",border:"1px solid "+(checked?"#c4b5fd":"#e2e8f0"),borderRadius:10,cursor:"pointer"}}>
                    <input type="checkbox" checked={checked} onChange={function(){ setConsolSelected(function(prev){ var n = Object.assign({},prev); n[ev._fbId] = !prev[ev._fbId]; return n; }); }} style={{width:18,height:18,accentColor:"#7c3aed"}} />
                    <span style={{fontSize:24}}>{t ? t.icon : ""}</span>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:14}}>{t ? t.fullName : ev.tipo}</div>
                      <div style={{fontSize:12,color:"#64748b"}}>{new Date(ev.fechaGuardado||ev.fechaEvaluacion).toLocaleDateString("es-AR")}</div>
                    </div>
                    <div style={{fontSize:12,color:t?t.color:"#64748b",fontWeight:600}}>{ev.resultados && ev.resultados.severity ? ev.resultados.severity : ""}</div>
                  </label>;
                })}
              </div>
              <button onClick={handleGenerateConsol} disabled={selectedCount < 2} style={{width:"100%",padding:"14px",background:selectedCount<2?"#94a3b8":"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:selectedCount<2?"not-allowed":"pointer"}}>{"Generar Informe Consolidado (" + selectedCount + " seleccionadas)"}</button>
            </div>}

            {/* Generating */}
            {consolGenerating && <div style={{textAlign:"center",padding:30}}>
              <div style={{display:"inline-block",width:36,height:36,border:"4px solid #e2e8f0",borderTopColor:"#7c3aed",borderRadius:"50%",animation:"spin 1s linear infinite",marginBottom:12}} />
              <div style={{fontSize:14,fontWeight:600,color:"#0a3d2f"}}>Generando informe consolidado...</div>
              <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
            </div>}

            {/* Report result */}
            {consolReport && <div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontSize:15,fontWeight:700,color:"#7c3aed"}}>{"Informe Consolidado - " + consolPatient.nombre}</div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={function(){
                    import("jspdf").then(function(mod){
                      var jsPDF=mod.jsPDF,pdf=new jsPDF("p","mm","a4"),margin=14,maxW=182,y=14;
                      pdf.setFontSize(8);pdf.setTextColor(120);pdf.text("Informe Consolidado - "+consolPatient.nombre,margin,y);y+=8;
                      pdf.setDrawColor(200);pdf.line(margin,y,196,y);y+=8;
                      pdf.setFontSize(14);pdf.setTextColor(10,61,47);pdf.setFont(undefined,"bold");pdf.text(consolPatient.nombre,margin,y);y+=7;
                      pdf.setFontSize(9);pdf.setTextColor(100);pdf.setFont(undefined,"normal");pdf.text("DNI: "+(consolPatient.dni||"N/A"),margin,y);y+=10;
                      consolReport.split("\n").forEach(function(line){
                        var t2=line.trim();if(!t2){y+=3;return;}
                        var isT=/^[A-Z\u00c0-\u00dc\s\d\.\:\-]{6,}:?\s*$/.test(t2);
                        if(isT){y+=3;pdf.setFontSize(10);pdf.setTextColor(10,61,47);pdf.setFont(undefined,"bold");if(y+7>283){pdf.addPage();y=14;}pdf.text(t2,margin,y);y+=7;pdf.setFont(undefined,"normal");}
                        else{pdf.setFontSize(9);pdf.setTextColor(51,65,85);var w=pdf.splitTextToSize(t2,maxW);w.forEach(function(l){if(y+5>283){pdf.addPage();y=14;}pdf.text(l,margin,y);y+=5;});}
                      });
                      pdf.save("Consolidado_"+consolPatient.nombre.replace(/\s/g,"_")+".pdf");
                    });
                  }} style={{padding:"8px 16px",background:"#7c3aed",color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>{"Imprimir"}</button>
                  <button onClick={function(){ setConsolReport(null); setConsolSelected({}); }} style={{padding:"8px 16px",background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:8,fontSize:12,cursor:"pointer",color:"#64748b"}}>{"Nuevo informe"}</button>
                </div>
              </div>
              <div style={{background:"#fff",borderRadius:12,border:"2px solid #7c3aed",padding:24}}>
                <div style={{fontSize:13,lineHeight:1.7}}>{renderReportText(consolReport)}</div>
                <div style={{marginTop:14,paddingTop:8,borderTop:"1px solid #e2e8f0",fontSize:9,color:"#94a3b8",textAlign:"center"}}>{"Brujula KIT - Informe Consolidado - " + new Date().toLocaleDateString("es-AR") + " - Debe ser revisado por el profesional tratante."}</div>
              </div>
            </div>}
          </div>}
        </div>
      </div>
    </div>
  );
}
