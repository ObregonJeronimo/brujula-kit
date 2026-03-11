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
import AIReportPanel from "./AIReportPanel.jsx";
import { fbAdd, K, ageLabel } from "../lib/fb.js";

function scrollTop(){ var el=document.getElementById("main-scroll"); if(el) el.scrollTo({top:0,behavior:"smooth"}); }

function ageMo(birth){
  if(!birth) return 0;
  var b=new Date(birth), n=new Date();
  return (n.getFullYear()-b.getFullYear())*12+(n.getMonth()-b.getMonth())-(n.getDate()<b.getDate()?1:0);
}

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

        {/* AIReportPanel handles: generate report, show report, CUD, book view, PDF */}
        <AIReportPanel
          ev={{
            _fbId: docIdRef.current,
            paciente: patient ? patient.nombre : "",
            pacienteDni: patient ? (patient.dni||"") : "",
            edadMeses: patientAge,
            fechaEvaluacion: evalDate,
            derivadoPor: derivado,
            observaciones: obs,
            resultados: computeResults(responses, obsMap),
            aiReport: report
          }}
          evalType={config.evalType}
          collectionName="evaluaciones"
          evalLabel={config.title} autoGenerate={true}
        />

        <button onClick={function(){ setShowTech(!showTech); }} style={{width:"100%",padding:"14px",background:showTech?"#f1f5f9":"#0a3d2f",color:showTech?"#1e293b":"#fff",border:"1px solid #e2e8f0",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",marginBottom:showTech?16:20}}>{showTech ? "\u25b2 Ocultar datos técnicos" : "\u25bc Ver datos técnicos"}</button>

        {showTech && results && renderTechDetails(results)}

        <button onClick={function(){onS("tools")}} style={{width:"100%",padding:"14px",background:accentColor,color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer",marginTop:4}}>{"Finalizar \u2713"}</button>
      </div>}
    </div>
  );
}
