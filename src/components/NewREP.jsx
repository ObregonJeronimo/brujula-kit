import { useState, useCallback, useRef } from "react";
import { REP_CATEGORIES, POSITIONS } from "../data/repWordsData.js";
import PatientLookup from "./PatientLookup.jsx";
import { ageMo, ageLabel, ALL_ITEMS, buildCatGroups, wordKey, catProgress, computeResults, scrollTop } from "./NewREP_logic.js";
import NewREPResults from "./NewREP_results.jsx";
import { saveDraft, deleteDraft } from "../lib/drafts.js";
import "../styles/NewREP.css";
var catGroups = buildCatGroups();

export default function NewREP({ onS, nfy, userId, draft, therapistInfo }){
  var init = draft ? draft.data : null;
  var _st = useState(init?(init.step||0):0), step = _st[0], setStep = _st[1];
  var _pat = useState(init?init.patient:null), patient = _pat[0], setPatient = _pat[1];
  var _ed = useState(init?(init.evalDate||new Date().toISOString().split("T")[0]):new Date().toISOString().split("T")[0]), evalDate = _ed[0], setEvalDate = _ed[1];
  var _ref = useState(init?(init.derivado||""):""), derivado = _ref[0], setDerivado = _ref[1];
  var _rsp = useState(init?(init.responses||{}):{}), responses = _rsp[0], setResponses = _rsp[1];
  var _obs = useState(init?(init.obs||""):""), obs = _obs[0], setObs = _obs[1];
  var _ci = useState(init?(init.catIdx||0):0), catIdx = _ci[0], setCatIdx = _ci[1];
  var mainRef = useRef(null);

  var handlePauseREP = function(){
    var draftData = {step:step,patient:patient,evalDate:evalDate,derivado:derivado,responses:responses,obs:obs,catIdx:catIdx,patientId:patient?(patient._fbId||patient.dni||patient.nombre):"unknown"};
    saveDraft(userId,"rep",draftData).then(function(r){if(r.success)nfy("Evaluacion pausada","ok");onS("tools");});
  };
  var handleFinishEarlyREP = function(){
    if(!patient){nfy("Selecciona un paciente","er");return;}
    if(Object.keys(responses).length===0){nfy("Registra al menos una respuesta","er");return;}
    if(window.confirm("Finalizar evaluacion ahora?"))setStep(2);
  };

  var patientAge = patient ? ageMo(patient.fechaNac) : 0;

  var setResponse = useCallback(function(key, val){
    setResponses(function(prev){ var n = Object.assign({}, prev); n[key] = val; return n; });
  },[]);
  var toggleOk = useCallback(function(key){
    setResponses(function(prev){ var n = Object.assign({}, prev); if(n[key]==="ok") delete n[key]; else n[key]="ok"; return n; });
  },[]);
  var markPhonOk = useCallback(function(phonId, posWords){
    setResponses(function(prev){ var n = Object.assign({}, prev); POSITIONS.forEach(function(pos){ var ws=posWords[pos.id]||[]; ws.forEach(function(w){ n[wordKey(phonId,pos.id,w)]="ok"; }); }); return n; });
  },[]);
  var markAllCatOk = useCallback(function(catId){
    setResponses(function(prev){ var n = Object.assign({}, prev); ALL_ITEMS.filter(function(it){return it.catId===catId;}).forEach(function(it){ n[it.key]="ok"; }); return n; });
  },[]);

  var results = step === 2 ? computeResults(responses) : null;

  var renderWordCell = function(phonId, posId, word){
    if(!word) return <div className="rep-word-cell--empty">{"\u2014"}</div>;
    var key = wordKey(phonId, posId, word);
    var val = responses[key] || "";
    var isOk = val === "ok";
    var hasError = val !== "" && val !== "ok";
    return <div className="rep-word-cell">
      <div className="rep-word-label">{word}</div>
      <div className="rep-word-row">
        <button
          onClick={function(){ toggleOk(key); }}
          className={"rep-btn-ok" + (isOk ? " rep-btn-ok--active" : "")}
        >{isOk ? "\u2713" : ""}</button>
        <input
          value={hasError ? val : ""}
          placeholder="error..."
          onChange={function(e){ var v=e.target.value.trim(); if(v==="") setResponse(key,""); else setResponse(key,v); }}
          onFocus={function(){ if(isOk) setResponse(key,""); }}
          className={"rep-word-input" + (hasError ? " rep-word-input--error" : "")}
        />
      </div>
    </div>;
  };

  return (
    <div ref={mainRef} className="rep">
      <div className="rep-header">
        <span className="rep-icon">{"\ud83d\udcdd"}</span>
        <div>
          <h1 className="rep-title">{"Repetici\u00f3n de Palabras"}</h1>
          <p className="rep-subtitle">{"Análisis fonético-fonológico mediante repetición"}</p>
        </div>
      </div>

      <div className="rep-steps">
        {["Paciente","Evaluaci\u00f3n","Resultados"].map(function(lb,i){
          var active = step===i, done = step>i;
          var cls = "rep-step";
          if(active) cls += " rep-step--active";
          else if(done) cls += " rep-step--done";
          return <div key={i} className={cls}>{(i+1)+". "+lb}</div>;
        })}
      </div>

      {step===0 && <div>
        <div className="rep-card">
          <h3 className="rep-card-title">{"Datos del paciente"}</h3>
          <PatientLookup userId={userId} onSelect={setPatient} selected={patient} />
        </div>
        {patient && <div className="rep-card">
          <div className="rep-grid-2">
            <div>
              <label className="rep-label">{"Fecha"}</label>
              <input type="date" value={evalDate} onChange={function(e){setEvalDate(e.target.value)}} className="rep-input" />
            </div>
            <div>
              <label className="rep-label">{"Derivado por"}</label>
              <input value={derivado} onChange={function(e){setDerivado(e.target.value)}} placeholder="Derivador" className="rep-input" />
            </div>
          </div>
        </div>}
        <button
          onClick={function(){ if(!patient){nfy("Seleccion\u00e1 un paciente","er");return;} setStep(1);scrollTop(); }}
          disabled={!patient}
          className="rep-cta"
        >{"Comenzar evaluaci\u00f3n \u2192"}</button>
      </div>}

      {step===1 && <div>
        <div className="rep-cats">
          {catGroups.map(function(cg,i){
            var prog = catProgress(cg.id, responses);
            var active = catIdx===i;
            var complete = prog.answered===prog.total && prog.total>0;
            var cls = "rep-cat-tab";
            if(active) cls += " rep-cat-tab--active";
            else if(complete) cls += " rep-cat-tab--complete";
            return <button
              key={cg.id}
              onClick={function(){setCatIdx(i); scrollTop();}}
              className={cls}
            >
              {cg.title}
              {prog.total>0 && <span className="rep-cat-tab-progress">{prog.answered+"/"+prog.total}</span>}
            </button>;
          })}
        </div>

        {(function(){
          var cg = catGroups[catIdx];
          if(!cg) return null;
          return <div>
            <div className="rep-cat-header">
              <h2 className="rep-cat-title">{cg.title}</h2>
              <button onClick={function(){markAllCatOk(cg.id)}} className="rep-btn-mark-all">{"\u2713 Todo correcto"}</button>
            </div>

            <div className="rep-info">
              <strong>{"\u2139\ufe0f"}</strong>
              {" Marque \u2713 si repiti\u00f3 correctamente. Si hay error, escriba la producci\u00f3n."}
            </div>

            {cg.phonRows.map(function(pr){
              var isExp = (patientAge/12) >= pr.age;
              return <div key={pr.phonId} className="rep-phon">
                <div className={"rep-phon-head " + (isExp ? "rep-phon-head--expected" : "rep-phon-head--pending")}>
                  <div className="rep-phon-label">
                    <span className="rep-phon-name">{pr.phoneme}</span>
                  </div>
                  <button onClick={function(){markPhonOk(pr.phonId, pr.posWords)}} className="rep-btn-phon-all">{"\u2713 Todo"}</button>
                </div>
                <div className="rep-phon-body">
                  <div className="rep-pos-grid">
                    {POSITIONS.map(function(pos){
                      var ws = pr.posWords[pos.id] || [];
                      var has = ws.length > 0;
                      return <div key={pos.id}>
                        <div
                          title={pos.full}
                          className={"rep-pos-header " + (has ? "rep-pos-header--has" : "rep-pos-header--empty")}
                        >{pos.label + " \u24d8"}</div>
                        {has
                          ? ws.map(function(w){ return <div key={w}>{renderWordCell(pr.phonId, pos.id, w)}</div>; })
                          : <div className="rep-pos-empty">{"\u2014"}</div>}
                      </div>;
                    })}
                  </div>
                </div>
              </div>;
            })}

            <div className="rep-nav">
              {catIdx>0 && <button onClick={function(){setCatIdx(catIdx-1); scrollTop();}} className="rep-btn-prev">{"Anterior"}</button>}
              <button onClick={handleFinishEarlyREP} className="rep-btn-finish">{"Finalizar ahora"}</button>
              <button onClick={handlePauseREP} className="rep-btn-pause">{"Pausar"}</button>
              {catIdx<catGroups.length-1 && <button onClick={function(){setCatIdx(catIdx+1); scrollTop();}} className="rep-btn-next">{"Siguiente"}</button>}
              {catIdx===catGroups.length-1 && <button onClick={function(){setStep(2); scrollTop();}} className="rep-btn-results">{"Ver Resultados"}</button>}
            </div>

            <div className="rep-obs-wrap">
              <label className="rep-label">Observaciones</label>
              <textarea
                value={obs}
                onChange={function(e){setObs(e.target.value)}}
                rows={3}
                placeholder="Notas..."
                className="rep-obs-textarea"
              />
            </div>
          </div>;
        })()}
      </div>}

      {step===2 && <NewREPResults results={results} patientAge={patientAge} obs={obs}
        onBack={function(){setStep(1);scrollTop();}}
        onFinish={function(){onS("tools")}}
        patient={patient} evalDate={evalDate} derivado={derivado} userId={userId} nfy={nfy} therapistInfo={therapistInfo} />}
    </div>
  );
}
