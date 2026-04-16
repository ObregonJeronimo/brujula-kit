import { useState, useEffect, useRef, useCallback } from "react";
import PatientLookup from "./PatientLookup.jsx";
import AIReportPanel from "./AIReportPanel.jsx";
import { fbAdd, K, ageLabel } from "../lib/fb.js";
import { saveDraft, deleteDraft } from "../lib/drafts.js";
import "../styles/EvalShell.css";

function scrollTop(){ var el=document.getElementById("main-scroll"); if(el) el.scrollTo({top:0,behavior:"smooth"}); }

function ageMo(birth){
  if(!birth) return 0;
  var b=new Date(birth), n=new Date();
  return (n.getFullYear()-b.getFullYear())*12+(n.getMonth()-b.getMonth())-(n.getDate()<b.getDate()?1:0);
}

export default function EvalShell({ onS, nfy, userId, config, renderEval, computeResults, buildPayloadExtra, renderTechDetails, draft, therapistInfo, deductCredit, isAdmin, userSettings }){
  var todayStr = new Date().toISOString().split("T")[0];
  // If resuming from draft, initialize from draft data
  var init = draft ? draft.data : null;
  var _st = useState(init ? (init.step||1) : 0), step = _st[0], setStep = _st[1];
  var _pat = useState(init ? init.patient : null), patient = _pat[0], setPatient = _pat[1];
  var _ed = useState(init ? (init.evalDate||todayStr) : todayStr), evalDate = _ed[0], setEvalDate = _ed[1];
  var _ref = useState(init ? (init.derivado||"") : ""), derivado = _ref[0], setDerivado = _ref[1];
  var _rsp = useState(init ? (init.responses||{}) : {}), responses = _rsp[0], setResponses = _rsp[1];
  var _obsMap = useState(init ? (init.obsMap||{}) : {}), obsMap = _obsMap[0], setObsMap = _obsMap[1];
  var _obs = useState(init ? (init.obs||"") : ""), obs = _obs[0], setObs = _obs[1];
  var _saved = useState(false), saved = _saved[0], setSaved = _saved[1];
  var docIdRef = useRef(null);
  var _report = useState(null), report = _report[0], setReport = _report[1];
  var _showTech = useState(false), showTech = _showTech[0], setShowTech = _showTech[1];

  var patientAge = patient ? ageMo(patient.fechaNac) : 0;
  var accentColor = config.color || K.ac;
  var steps = config.steps || ["Paciente","Evaluacion","Resultados"];
  var RESULT_STEP = steps.length - 1;

  // Inyectamos el accent dinámico como CSS variable local al wrapper.
  var wrapperStyle = { "--esh-accent": accentColor };

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
        if(r.success){ docIdRef.current = r.id; nfy("Evaluacion guardada","ok"); }
        else nfy("Error al guardar: "+r.error,"er");
      });
      // Delete draft if resuming
      if(draft && draft._fbId) deleteDraft(draft._fbId);
      setSaved(true);
    }
  }, [step]);

  // Pause: save draft and go back to tools
  var handlePause = function(){
    if(!patient){ onS("tools"); return; }
    var draftData = {
      step: step, patient: patient, evalDate: evalDate, derivado: derivado,
      responses: responses, obsMap: obsMap, obs: obs,
      patientId: patient ? (patient._fbId || patient.dni || patient.nombre) : "unknown"
    };
    saveDraft(userId, config.evalType, draftData).then(function(r){
      if(r.success) nfy("Evaluacion pausada. Podras continuar despues.","ok");
      else nfy("Error al pausar","er");
      onS("tools");
    });
  };

  // Finish early: jump to result step
  var handleFinishEarly = function(){
    if(!patient){ nfy("Selecciona un paciente primero","er"); return; }
    if(Object.keys(responses).length === 0){ nfy("Registra al menos una respuesta","er"); return; }
    var ok = window.confirm("Finalizar evaluacion ahora?\n\nSe guardaran los datos registrados hasta el momento.");
    if(ok) setStep(RESULT_STEP);
  };

  var results = step === RESULT_STEP ? computeResults(responses, obsMap) : null;

  var buildStepClass = function(i){
    var active = step === i;
    var done = step > i;
    var isResult = i === RESULT_STEP;
    var canClick = !isResult && i > 0 && step > 0;
    var cls = "esh-step";
    if(active) cls += " esh-step--active";
    else if(done) cls += " esh-step--done";
    if(canClick) cls += " esh-step--clickable";
    if(isResult && !active) cls += " esh-step--result-inactive";
    return cls;
  };

  return (
    <div className="esh" style={wrapperStyle}>
      {/* Header */}
      <div className="esh-header">
        <div className="esh-header-title">
          <span className="esh-icon">{config.icon}</span>
          <div>
            <h1 className="esh-title">{config.title}</h1>
            {config.subtitle && <p className="esh-subtitle">{config.subtitle}</p>}
          </div>
        </div>
        {/* Pause/Finish buttons — visible during evaluation (not on patient select or results) */}
        {step >= 1 && step < RESULT_STEP && <div className="esh-header-actions">
          <button onClick={handleFinishEarly} className="esh-btn-finish-early">{"Finalizar ahora"}</button>
          <button onClick={handlePause} className="esh-btn-pause">{"Pausar"}</button>
        </div>}
      </div>

      {/* Step indicators */}
      <div className="esh-steps">
        {steps.map(function(lb,i){
          var isResult = i === RESULT_STEP;
          var canClick = !isResult && i > 0 && step > 0;
          return <div
            key={i}
            onClick={function(){ if(canClick){ setStep(i); scrollTop(); } }}
            className={buildStepClass(i)}
          >{(i+1)+". "+lb}</div>;
        })}
      </div>

      {/* Step 0: Patient data */}
      {step===0 && <div>
        <div className="esh-card">
          <h3 className="esh-card-title">{"Datos del paciente"}</h3>
          <PatientLookup userId={userId} onSelect={setPatient} selected={patient} color={accentColor} />
        </div>
        {patient && <div className="esh-card">
          <div className="esh-grid-2">
            <div>
              <label className="esh-field-label">{"Fecha de evaluacion"}</label>
              <input type="date" value={evalDate} onChange={function(e){setEvalDate(e.target.value)}} className="esh-input" />
            </div>
            <div>
              <label className="esh-field-label">{"Derivado por"}</label>
              <input value={derivado} onChange={function(e){setDerivado(e.target.value)}} placeholder="Nombre del derivador" className="esh-input" />
            </div>
          </div>
        </div>}
        <button
          onClick={function(){ if(!patient){nfy("Selecciona un paciente","er");return;} setStep(1);scrollTop(); }}
          disabled={!patient}
          className="esh-cta"
        >{"Comenzar evaluaci\u00f3n \u2192"}</button>
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
        <div className="esh-result-ok">
          <span className="esh-result-ok-icon">{"\u2705"}</span>
          <span className="esh-result-ok-text">{"Evaluacion guardada correctamente."}</span>
        </div>

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
          therapistInfo={therapistInfo}
        />

        <button
          onClick={function(){ setShowTech(!showTech); }}
          className={"esh-tech-toggle" + (showTech ? " esh-tech-toggle--open" : "")}
        >{showTech ? "Ocultar datos tecnicos" : "Ver datos tecnicos"}</button>

        {showTech && results && renderTechDetails(results)}

        <button onClick={function(){onS("tools")}} className="esh-cta esh-cta--mt">{"Finalizar"}</button>
      </div>}
    </div>
  );
}
