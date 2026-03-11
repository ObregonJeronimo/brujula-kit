// =====================================================
// EvalShell — shared wrapper for all evaluations
// =====================================================
// Handles: patient selection, date/derivador, save to Firestore,
// AI report generation, PDF export, results display.
// Each evaluation only provides: renderEval(), computeResults(),
// buildPayload(), renderTechDetails(), and config.
// =====================================================
import { useState, useEffect, useRef, useCallback } from "react";
import PatientLookup from "./PatientLookup.jsx";
import { db, doc, updateDoc } from "../firebase.js";
import { fbAdd, K, ageLabel } from "../lib/fb.js";

function scrollTop(){ var el=document.getElementById("main-scroll"); if(el) el.scrollTo({top:0,behavior:"smooth"}); }

function ageMo(birth){
  if(!birth) return 0;
  var b=new Date(birth), n=new Date();
  return (n.getFullYear()-b.getFullYear())*12+(n.getMonth()-b.getMonth())-(n.getDate()<b.getDate()?1:0);
}

function renderReportText(text){
  if(!text) return null;
  return text.split("\n").map(function(line, i){
    var trimmed = line.trim();
    if(!trimmed) return <div key={i} style={{height:8}} />;
    var isTitle = /^[A-Z\u00c0-\u00dc\s\d\.\:\-]{6,}:?\s*$/.test(trimmed) || /^\d+[\.\\)]\s*[A-Z]/.test(trimmed);
    if(isTitle) return <div key={i} style={{fontSize:14,fontWeight:700,color:K.sd,marginTop:14,marginBottom:4}}>{trimmed}</div>;
    return <div key={i} style={{fontSize:13,color:"#334155",lineHeight:1.7,marginBottom:1}}>{trimmed}</div>;
  });
}

function saveReportToDoc(colName, docIdRef, report) {
  var tryUpdate = function(retries) {
    var id = docIdRef.current;
    if (id) {
      updateDoc(doc(db, colName, id), { aiReport: report, aiReportDate: new Date().toISOString() }).catch(function(e) { console.error("Error saving aiReport:", e); });
    } else if (retries > 0) {
      setTimeout(function() { tryUpdate(retries - 1); }, 1500);
    }
  };
  tryUpdate(5);
}

// config: { title, subtitle, icon, evalType, color, steps: ["Paciente","Evaluación","Resultados"] }
// renderEval({ responses, setResponse, obsMap, setOb, obs, setObs, patient, patientAge, evalDate })
// computeResults(responses, obsMap)
// buildPayloadExtra(responses, obsMap, results) => extra fields for Firestore
// renderTechDetails(results) => JSX for tech details panel

export default function EvalShell({ onS, nfy, userId, config, renderEval, computeResults, buildPayloadExtra, renderTechDetails }){
  var todayStr = new Date().toISOString().split("T")[0];
  var _st = useState(0), step = _st[0], setStep = _st[1];
  var _pat = useState(null), patient = _pat[0], setPatient = _pat[1];
  var _ed = useState(todayStr), evalDate = _ed[0], setEvalDate = _ed[1];
  var _ref = useState(""), derivado = _ref[0], setDerivado = _ref[1];
  var _rsp = useState({}), responses = _rsp[0], setResponses = _rsp[1];
  var _obsMap = useState({}), obsMap = _obsMap[0], setObsMap = _obsMap[1];
  var _obs = useState(""), obs = _obs[0], setObs = _obs[1];
  var _saved = useState(false), saved = _saved[0], setSaved = _saved[1];
  var docIdRef = useRef(null);
  var _report = useState(null), report = _report[0], setReport = _report[1];
  var _generating = useState(false), generating = _generating[0], setGenerating = _generating[1];
  var _genError = useState(null), genError = _genError[0], setGenError = _genError[1];
  var _showTech = useState(false), showTech = _showTech[0], setShowTech = _showTech[1];
  var reportRef = useRef(null);

  var patientAge = patient ? ageMo(patient.fechaNac) : 0;
  var accentColor = config.color || K.ac;
  var steps = config.steps || ["Paciente","Evaluación","Resultados"];
  var RESULT_STEP = steps.length - 1;

  var setResponse = useCallback(function(id, val){
    setResponses(function(prev){ var n = Object.assign({}, prev); if(n[id] === val) delete n[id]; else n[id] = val; return n; });
  },[]);
  var setOb = useCallback(function(id, val){
    setObsMap(function(prev){ var n = Object.assign({}, prev); n[id] = val; return n; });
  },[]);

  useEffect(function(){ scrollTop(); },[step]);

  // Save to Firestore on result step
  useEffect(function(){
    if(step === RESULT_STEP && !saved){
      var res = computeResults(responses, obsMap);
      var base = {
        id: Date.now()+"", userId: userId, tipo: config.evalType,
        paciente: patient ? patient.nombre : "", pacienteDni: patient ? (patient.dni||"") : "",
        fechaNacimiento: patient ? (patient.fechaNac||"") : "", edadMeses: patientAge,
        fechaEvaluacion: evalDate, derivadoPor: derivado, observaciones: obs,
        evaluador: "", fechaGuardado: new Date().toISOString(),
        resultados: res
      };
      var extra = buildPayloadExtra ? buildPayloadExtra(responses, obsMap, res) : {};
      var payload = Object.assign(base, extra);
      fbAdd("evaluaciones", payload).then(function(r){
        if(r.success){ docIdRef.current = r.id; nfy("Evaluación guardada","ok"); }
        else nfy("Error al guardar: "+r.error,"er");
      });
      setSaved(true);
    }
  }, [step]);

  // Generate AI report
  useEffect(function(){
    if(step === RESULT_STEP && saved && !report && !generating && !genError){
      setGenerating(true);
      var res = computeResults(responses, obsMap);
      var evalData = {
        paciente: patient ? patient.nombre : "", pacienteDni: patient ? (patient.dni||"") : "",
        edadMeses: patientAge, fechaEvaluacion: evalDate, derivadoPor: derivado, observaciones: obs, resultados: res
      };
      fetch("/api/generate-report", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evalData: evalData, evalType: config.evalType, reportMode: "clinico" })
      })
      .then(function(r){ return r.json(); })
      .then(function(data){
        if(data.success && data.report){
          setReport(data.report);
          saveReportToDoc("evaluaciones", docIdRef, data.report);
        } else setGenError(data.error || "Error al generar informe.");
        setGenerating(false);
      })
      .catch(function(e){ setGenError("Error: " + e.message); setGenerating(false); });
    }
  }, [step, saved]);

  var handlePDFReport = function(){
    if(!reportRef.current) return;
    reportRef.current.style.paddingBottom = "40px";
    import("html2canvas").then(function(mod){
      return mod.default(reportRef.current,{scale:2,useCORS:true,backgroundColor:"#ffffff",scrollY:-window.scrollY,height:reportRef.current.scrollHeight,windowHeight:reportRef.current.scrollHeight+100});
    }).then(function(canvas){
      reportRef.current.style.paddingBottom = "";
      return import("jspdf").then(function(mod){
        var jsPDF = mod.jsPDF; var pdf = new jsPDF("p","mm","a4");
        var pW=210,pH=297,margin=10,imgW=pW-margin*2,imgH=(canvas.height*imgW)/canvas.width;
        var usableH=pH-margin*2,pos=0,page=0;
        while(pos<imgH){ if(page>0) pdf.addPage(); var srcY=Math.round((pos/imgH)*canvas.height); var srcH=Math.round((Math.min(usableH,imgH-pos)/imgH)*canvas.height); if(srcH<=0)break; var sc=document.createElement("canvas");sc.width=canvas.width;sc.height=srcH; sc.getContext("2d").drawImage(canvas,0,srcY,canvas.width,srcH,0,0,canvas.width,srcH); pdf.addImage(sc.toDataURL("image/png"),"PNG",margin,margin,imgW,(srcH*imgW)/canvas.width); pos+=usableH;page++; }
        var name = (patient?patient.nombre:"").replace(/\s/g,"_");
        pdf.save("Informe_"+config.evalType.toUpperCase()+"_"+name+"_"+(evalDate||"")+".pdf");
      });
    }).catch(function(e){ reportRef.current.style.paddingBottom=""; console.error(e); });
  };

  var results = step === RESULT_STEP ? computeResults(responses, obsMap) : null;

  return (
    <div style={{animation:"fi .3s ease",maxWidth:900,margin:"0 auto"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <span style={{fontSize:32}}>{config.icon}</span>
        <div><h1 style={{fontSize:20,fontWeight:700,margin:0}}>{config.title}</h1>{config.subtitle && <p style={{fontSize:12,color:K.mt,margin:0}}>{config.subtitle}</p>}</div>
      </div>

      {/* Step indicators */}
      <div style={{display:"flex",gap:4,marginBottom:24}}>
        {steps.map(function(lb,i){ var active=step===i,done=step>i; return <div key={i} style={{flex:1,textAlign:"center",padding:"8px 0",borderRadius:8,fontSize:13,fontWeight:active?700:500,background:active?accentColor:done?"#059669":"#f1f5f9",color:active||done?"#fff":K.mt}}>{(i+1)+". "+lb}</div>; })}
      </div>

      {/* Step 0: Patient data */}
      {step===0 && <div>
        <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:24,marginBottom:16}}>
          <h3 style={{fontSize:16,fontWeight:600,marginBottom:16}}>{"Datos del paciente"}</h3>
          <PatientLookup userId={userId} onSelect={setPatient} selected={patient} />
        </div>
        {patient && <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:24,marginBottom:16}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>{"Fecha de evaluación"}</label><input type="date" value={evalDate} onChange={function(e){setEvalDate(e.target.value)}} style={{width:"100%",padding:"10px 12px",border:"1px solid "+K.bd,borderRadius:8,fontSize:14}} /></div>
            <div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>{"Derivado por"}</label><input value={derivado} onChange={function(e){setDerivado(e.target.value)}} placeholder="Nombre del derivador" style={{width:"100%",padding:"10px 12px",border:"1px solid "+K.bd,borderRadius:8,fontSize:14}} /></div>
          </div>
        </div>}
        <button onClick={function(){ if(!patient){nfy("Seleccioná un paciente","er");return;} setStep(1);scrollTop(); }} disabled={!patient} style={{width:"100%",padding:"14px",background:!patient?"#94a3b8":accentColor,color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:!patient?"not-allowed":"pointer"}}>{"Comenzar evaluación \u2192"}</button>
      </div>}

      {/* Middle steps: evaluation content (provided by each eval) */}
      {step >= 1 && step < RESULT_STEP && renderEval({
        step: step, setStep: setStep, scrollTop: scrollTop,
        responses: responses, setResponse: setResponse,
        obsMap: obsMap, setOb: setOb,
        obs: obs, setObs: setObs,
        patient: patient, patientAge: patientAge, evalDate: evalDate,
        accentColor: accentColor, RESULT_STEP: RESULT_STEP
      })}

      {/* Result step */}
      {step === RESULT_STEP && <div>
        <div style={{background:"#dcfce7",borderRadius:10,padding:"12px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18}}>{"\u2705"}</span><span style={{fontSize:13,fontWeight:600,color:"#059669"}}>{"Evaluación guardada correctamente."}</span></div>

        {generating && <div style={{background:"#fff",borderRadius:14,border:"1px solid "+K.bd,padding:40,textAlign:"center",marginBottom:20}}>
          <div style={{display:"inline-block",width:40,height:40,border:"4px solid #e2e8f0",borderTopColor:accentColor,borderRadius:"50%",animation:"spin 1s linear infinite",marginBottom:16}} />
          <div style={{fontSize:15,fontWeight:600,color:K.sd}}>{"Generando informe con IA..."}</div>
          <div style={{fontSize:12,color:K.mt,marginTop:6}}>{"Esto puede tardar unos segundos."}</div>
          <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
        </div>}

        {genError && !report && <div style={{background:"#fff",borderRadius:14,border:"1px solid "+K.bd,padding:28,textAlign:"center",marginBottom:20}}>
          <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#dc2626"}}>{genError}</div>
          <button onClick={function(){ setGenError(null); }} style={{padding:"10px 24px",background:accentColor,color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>{"Reintentar"}</button>
        </div>}

        {report && <div style={{marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
            <div style={{fontSize:15,fontWeight:700,color:K.sd}}>{"Informe Fonoaudiológico"}</div>
            <button onClick={handlePDFReport} style={{padding:"7px 14px",background:accentColor,color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>{"\ud83d\udda8 Imprimir informe"}</button>
          </div>
          <div ref={reportRef} style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:24}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,paddingBottom:12,borderBottom:"2px solid "+K.bd}}>
              <div><div style={{fontSize:10,color:K.mt,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>{"Informe Fonoaudiológico \u2014 "+config.title}</div><div style={{fontSize:17,fontWeight:700,marginTop:3}}>{patient?patient.nombre:""}</div><div style={{fontSize:12,color:K.mt,marginTop:2}}>{"DNI: "+(patient?patient.dni||"N/A":"N/A")+" \u00b7 Edad: "+(patientAge?ageLabel(patientAge):"")}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:11,color:K.mt}}>{"Fecha: "+(evalDate||"")}</div></div>
            </div>
            <div>{renderReportText(report)}</div>
            <div style={{marginTop:20,background:"linear-gradient(135deg,#f3e8ff,#ede9fe)",borderRadius:10,padding:"14px 18px",border:"1px solid #d8b4fe"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:18}}>{"\ud83e\udde0"}</span><span style={{fontSize:11,fontWeight:700,color:"#6b21a8"}}>{"Generado con IA"}</span></div><div style={{width:1,height:16,background:"#c4b5fd"}} /><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:18}}>{"\u2705"}</span><span style={{fontSize:11,fontWeight:700,color:"#059669"}}>{"Comprobado por profesionales en fonoaudiología de Córdoba"}</span></div></div>
              <div style={{fontSize:10,color:"#7c3aed",marginTop:6}}>{"Debe ser revisado por el profesional tratante."}</div>
            </div>
            <div style={{marginTop:14,paddingTop:8,borderTop:"1px solid "+K.bd,fontSize:9,color:"#94a3b8",textAlign:"center"}}>{"Brújula KIT \u2014 "+config.title+" \u2014 "+new Date().toLocaleDateString("es-AR")}</div>
          </div>
        </div>}

        <button onClick={function(){ setShowTech(!showTech); }} style={{width:"100%",padding:"14px",background:showTech?"#f1f5f9":"#0a3d2f",color:showTech?"#1e293b":"#fff",border:"1px solid #e2e8f0",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",marginBottom:showTech?16:20}}>{showTech ? "\u25b2 Ocultar datos técnicos" : "\u25bc Ver datos técnicos"}</button>

        {showTech && results && renderTechDetails(results)}

        <button onClick={function(){onS("tools")}} style={{width:"100%",padding:"14px",background:accentColor,color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer",marginTop:4}}>{"Finalizar \u2713"}</button>
      </div>}
    </div>
  );
}
