import { useCallback } from "react";
import { DISC_PAIRS, computeDiscResults } from "../data/discFonData.js";
import EvalShell from "./EvalShell.jsx";
import { K } from "../lib/fb.js";
import "../styles/NewDISC.css";

var SHELL_CONFIG = {
  title: "Discriminación Fonológica",
  subtitle: "Evaluación de discriminación auditiva de fonemas",
  icon: "\ud83d\udc42",
  evalType: "disc",
  color: K.ac,
  steps: ["Paciente", "Evaluación", "Resultados"]
};

function discComputeResults(responses, obsMap) {
  return computeDiscResults(responses, obsMap);
}

function discBuildPayloadExtra(responses, obsMap) {
  return { responses: responses, obsMap: obsMap };
}

function discRenderEval(props) {
  var responses = props.responses, setResponse = props.setResponse;
  var obsMap = props.obsMap, setOb = props.setOb;
  var obs = props.obs, setObs = props.setObs;
  var setStep = props.setStep, scrollTop = props.scrollTop;
  var answeredCount = Object.keys(responses).length;
  var pctWidth = Math.round(answeredCount / DISC_PAIRS.length * 100);

  return <div>
    {/* Instructions */}
    <div className="disc-instructions">
      <div className="disc-instructions-title">{"Como aplicar esta prueba"}</div>
      <div className="disc-instructions-body">
        {"Tapese la boca con la mano o una hoja para que el paciente no pueda leer sus labios. Diga cada par de palabras en voz alta y pregunte: \"Estas dos palabras son iguales o distintas?\". Registre la respuesta del paciente."}
      </div>
    </div>

    <div className="disc-progress-row">
      <div className="disc-progress-label">{"Progreso: "+answeredCount+"/"+DISC_PAIRS.length}</div>
      <div className="disc-progress-bar">
        <div className="disc-progress-fill" style={{ width: pctWidth + "%" }}></div>
      </div>
    </div>

    <div className="disc-table">
      <div className="disc-table-head">
        <span>{"N\u00b0"}</span>
        <span>{"Oposición"}</span>
        <span className="disc-table-head-center">{"Respuesta"}</span>
        <span>{"Observación"}</span>
      </div>
      {DISC_PAIRS.map(function(pair){
        var r = responses[pair.id];
        var isCorrect = r === pair.clave;
        var isIncorrect = r !== undefined && r !== pair.clave;

        var rowCls = "disc-row";
        if (isCorrect) rowCls += " disc-row--correct";
        else if (isIncorrect) rowCls += " disc-row--incorrect";

        return <div key={pair.id} className={rowCls}>
          <span className="disc-row-num">{pair.id}</span>
          <span className="disc-row-pair">{pair.word1 + " \u2014 " + pair.word2}</span>
          <div className="disc-row-buttons">
            <button
              onClick={function(){ setResponse(pair.id, "I"); }}
              className={"disc-btn" + (r === "I" ? " disc-btn--i-active" : "")}
            >IGUALES</button>
            <button
              onClick={function(){ setResponse(pair.id, "D"); }}
              className={"disc-btn" + (r === "D" ? " disc-btn--d-active" : "")}
            >DIFERENTES</button>
          </div>
          <input
            value={obsMap[pair.id] || ""}
            onChange={function(e){ setOb(pair.id, e.target.value); }}
            placeholder="..."
            className="disc-obs-input"
          />
          {r !== undefined && <div className="disc-feedback">
            {isCorrect && <span className="disc-feedback--ok">{"\u2714 Correcto"}</span>}
            {isIncorrect && <span className="disc-feedback--ko">{"\u2718 Incorrecto"}</span>}
          </div>}
        </div>;
      })}
    </div>

    <div className="disc-obs-wrap">
      <label className="disc-obs-label">Observaciones generales</label>
      <textarea
        value={obs}
        onChange={function(e){ setObs(e.target.value); }}
        rows={3}
        placeholder="Notas..."
        className="disc-obs-textarea"
      />
    </div>

    <div className="disc-nav">
      <button onClick={function(){ setStep(0); scrollTop(); }} className="disc-btn-back">{"\u2190 Volver"}</button>
      <button onClick={function(){ setStep(2); scrollTop(); }} className="disc-btn-results">{"Ver Resultados \u2192"}</button>
    </div>
  </div>;
}

function discRenderTech(results) {
  var sevClass = "disc-stat-card--adequate";
  var sevColorClass = "disc-stat-sev--adequate";
  if (results.severity === "Leve") {
    sevClass = "disc-stat-card--mild";
    sevColorClass = "disc-stat-sev--mild";
  } else if (results.severity !== "Adecuado") {
    sevClass = "disc-stat-card--severe";
    sevColorClass = "disc-stat-sev--severe";
  }

  return <div>
    <div className="disc-stats">
      <div className="disc-stat-card disc-stat-card--accent">
        <div className="disc-stat-big">{results.pct + "%"}</div>
        <div className="disc-stat-label">{"Aciertos"}</div>
      </div>
      <div className={"disc-stat-card " + sevClass}>
        <div className={"disc-stat-small " + sevColorClass}>{results.severity}</div>
        <div className="disc-stat-label">{"Severidad"}</div>
      </div>
      <div className="disc-stat-card disc-stat-card--neutral">
        <div className="disc-stat-small">{results.correct + "/" + results.evaluated}</div>
        <div className="disc-stat-label">{"Correctos"}</div>
      </div>
    </div>

    {results.errors.length > 0 && <div className="disc-errors-card">
      <h3 className="disc-errors-title">{"\u26a0 Errores (" + results.errors.length + ")"}</h3>
      {results.errors.map(function(e){ return <div key={e.id} className="disc-error-row">
        <span className="disc-error-id">{"#" + e.id}</span>
        <span className="disc-error-pair">{e.word1 + " \u2014 " + e.word2}</span>
        <span className="disc-error-detail">{"Clave:" + e.clave + " Resp:" + e.respuesta}</span>
      </div>; })}
    </div>}

    {results.errors.length === 0 && <div className="disc-empty-ok">
      <span className="disc-empty-icon">{"\u2705"}</span>
      <p className="disc-empty-text">{"Discriminación adecuada."}</p>
    </div>}
  </div>;
}

export default function NewDISC({ onS, nfy, userId, draft, therapistInfo }){
  return <EvalShell
    onS={onS} nfy={nfy} userId={userId}
    config={SHELL_CONFIG}
    renderEval={discRenderEval}
    computeResults={discComputeResults}
    buildPayloadExtra={discBuildPayloadExtra}
    renderTechDetails={discRenderTech} draft={draft} therapistInfo={therapistInfo}
  />;
}
