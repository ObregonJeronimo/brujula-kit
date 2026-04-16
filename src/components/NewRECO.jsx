import { useState, useCallback } from "react";
import { RECO_GROUPS, TOTAL_ITEMS, computeRecoResults, getImageUrl } from "../data/recoFonData.js";
import EvalShell from "./EvalShell.jsx";
import { K } from "../lib/fb.js";
import "../styles/NewRECO.css";

var SHELL_CONFIG = {
  title: "Reconocimiento Fonológico Visual",
  subtitle: "El paciente asocia imagenes con palabras",
  icon: "\ud83e\udde0",
  evalType: "reco",
  color: "#9333ea",
  steps: ["Paciente", "Evaluación", "Resultados"]
};

function recoComputeResults(responses) { return computeRecoResults(responses); }
function recoBuildPayloadExtra(responses, obsMap) { return { responses: responses, obsMap: obsMap }; }

function recoRenderEval(props) {
  var responses = props.responses, setResponse = props.setResponse;
  var obsMap = props.obsMap, setOb = props.setOb;
  var obs = props.obs, setObs = props.setObs;
  var setStep = props.setStep, scrollTop = props.scrollTop;
  var accentColor = props.accentColor;

  var answeredCount = 0;
  Object.keys(responses).forEach(function(k) { var r = responses[k]; if (r && r.objetivo && r.seleccion) answeredCount++; });
  var pctWidth = Math.round(answeredCount / TOTAL_ITEMS * 100);

  // Use obsMap with special keys to track image visibility (avoids hooks in non-component)
  var isImgVisible = function(lam) { return obsMap["_img_" + lam] === "1"; };
  var toggleImgs = function(lam) { setOb("_img_" + lam, isImgVisible(lam) ? "" : "1"); };

  var setObjetivo = function(lam, wordKey) { var current = responses[lam] || {}; setResponse(lam, { objetivo: wordKey, seleccion: current.seleccion || null }); };
  var setSeleccion = function(lam, wordKey) { var current = responses[lam] || {}; if (!current.objetivo) return; setResponse(lam, { objetivo: current.objetivo, seleccion: wordKey }); };
  var resetItem = function(lam) { setResponse(lam, undefined); setOb("_img_" + lam, ""); };

  return <div className="reco">
    <div className="reco-instructions">
      <div className="reco-instructions-title">{"Protocolo de aplicación"}</div>
      <div className="reco-instructions-body">
        {"1. Seleccione la palabra que va a pronunciar (botón \"Decir\")."}<br/>
        {"2. Presione \"Mostrar ambas imágenes\" para mostrar al paciente."}<br/>
        {"3. Diga la palabra en voz alta al paciente."}<br/>
        {"4. Registre qué imagen señaló el paciente."}<br/>
        {"Si la selecci\u00f3n del paciente coincide con la palabra objetivo, se registra como correcta."}
      </div>
    </div>

    <div className="reco-progress-row">
      <div className="reco-progress-label">{"Progreso: " + answeredCount + "/" + TOTAL_ITEMS}</div>
      <div className="reco-progress-bar">
        <div className="reco-progress-fill" style={{ width: pctWidth + "%", background: accentColor }}></div>
      </div>
    </div>

    {RECO_GROUPS.map(function(group){
      return <div key={group.id} className="reco-group">
        <div className="reco-group-head">
          <div className="reco-group-head-row">
            <span className="reco-group-badge">{group.id}</span>
            <span className="reco-group-label">{group.label}</span>
          </div>
        </div>
        <div className="reco-group-body">
          {group.items.map(function(item){
            var r = responses[item.lam] || {};
            var objetivo = r.objetivo || null;
            var seleccion = r.seleccion || null;
            var isComplete = objetivo && seleccion;
            var isCorrect = isComplete && objetivo === seleccion;
            var palabraObj = objetivo === "w1" ? item.w1 : objetivo === "w2" ? item.w2 : null;
            var palabraSel = seleccion === "w1" ? item.w1 : seleccion === "w2" ? item.w2 : null;
            var imgsVisible = isImgVisible(item.lam);
            var img1 = getImageUrl(item.w1);
            var img2 = getImageUrl(item.w2);

            return <div key={item.lam} className="reco-item">
              <div className="reco-item-header">
                <div className="reco-item-header-left">
                  <span className="reco-item-id">{"#" + item.lam}</span>
                  {!isComplete && !objetivo && <span className="reco-item-hint">{"Seleccione la palabra que va a pronunciar"}</span>}
                  {objetivo && !seleccion && <span className="reco-item-hint reco-item-hint--active">{"Diga \"" + palabraObj + "\" — registre qué imagen señaló"}</span>}
                </div>
                {isComplete && <button onClick={function(){ resetItem(item.lam); }} className="reco-btn-reset">Reiniciar</button>}
              </div>

              {/* Step 1: Choose which word to say */}
              {!objetivo && <div>
                <div className="reco-step-label">{"¿Qué palabra va a decir?"}</div>
                <div className="reco-word-row">
                  <button onClick={function(){ setObjetivo(item.lam, "w1"); }} className="reco-word-btn">{"Decir: \"" + item.w1 + "\""}</button>
                  <button onClick={function(){ setObjetivo(item.lam, "w2"); }} className="reco-word-btn">{"Decir: \"" + item.w2 + "\""}</button>
                </div>
              </div>}

              {/* Step 2: Show images button + record selection */}
              {objetivo && !seleccion && <div>
                {!imgsVisible && <button onClick={function(){ toggleImgs(item.lam); }} className="reco-btn-show-imgs">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  {"Mostrar ambas imágenes"}
                </button>}
                {imgsVisible && <button onClick={function(){ toggleImgs(item.lam); }} className="reco-btn-hide-imgs">{"Ocultar imágenes"}</button>}

                {imgsVisible && <div className="reco-imgs">
                  <div className="reco-img-card">
                    {img1 ? <img src={img1} alt={item.w1} className="reco-img" /> : <div className="reco-img-empty">Sin imagen</div>}
                    <div className="reco-img-caption">{item.w1}</div>
                  </div>
                  <div className="reco-img-card">
                    {img2 ? <img src={img2} alt={item.w2} className="reco-img" /> : <div className="reco-img-empty">Sin imagen</div>}
                    <div className="reco-img-caption">{item.w2}</div>
                  </div>
                </div>}

                <div className="reco-step-label reco-step-label--neutral">{"¿Qué imagen señaló el paciente?"}</div>
                <div className="reco-sel-row">
                  <div onClick={function(){ setSeleccion(item.lam, "w1"); }} className="reco-sel-card">
                    <div className="reco-sel-word">{item.w1}</div>
                    <div className="reco-sel-hint">{"Señaló esta"}</div>
                  </div>
                  <div onClick={function(){ setSeleccion(item.lam, "w2"); }} className="reco-sel-card">
                    <div className="reco-sel-word">{item.w2}</div>
                    <div className="reco-sel-hint">{"Señaló esta"}</div>
                  </div>
                </div>
              </div>}

              {isComplete && <div className={"reco-feedback " + (isCorrect ? "reco-feedback--ok" : "reco-feedback--ko")}>
                <div className="reco-feedback-icon">{isCorrect ? "\u2705" : "\u274c"}</div>
                <div className="reco-feedback-body">
                  <div className={"reco-feedback-title " + (isCorrect ? "reco-feedback-title--ok" : "reco-feedback-title--ko")}>{isCorrect ? "Correcto" : "Incorrecto"}</div>
                  <div className="reco-feedback-detail">{"Se dijo: \"" + palabraObj + "\" — Señaló: \"" + palabraSel + "\""}</div>
                </div>
              </div>}
            </div>;
          })}
        </div>
      </div>;
    })}

    <div className="reco-obs-wrap">
      <label className="reco-obs-label">Observaciones generales</label>
      <textarea
        value={obs}
        onChange={function(e){ setObs(e.target.value); }}
        rows={3}
        placeholder="Notas..."
        className="reco-obs-textarea"
      />
    </div>

    <div className="reco-nav">
      <button onClick={function(){ setStep(0); scrollTop(); }} className="reco-btn-back">{"Volver"}</button>
      <button onClick={function(){ setStep(2); scrollTop(); }} className="reco-btn-results">{"Ver Resultados"}</button>
    </div>
  </div>;
}

function recoRenderTech(results) {
  var sevClass = "reco-stat--adequate";
  var sevColorClass = "reco-stat-sev--adequate";
  if (results.severity === "Leve") {
    sevClass = "reco-stat--mild";
    sevColorClass = "reco-stat-sev--mild";
  } else if (results.severity !== "Adecuado") {
    sevClass = "reco-stat--severe";
    sevColorClass = "reco-stat-sev--severe";
  }

  return <div className="reco">
    <div className="reco-stats">
      <div className="reco-stat reco-stat--accent">
        <div className="reco-stat-big">{results.pct + "%"}</div>
        <div className="reco-stat-label">{"Aciertos"}</div>
      </div>
      <div className={"reco-stat " + sevClass}>
        <div className={"reco-stat-med " + sevColorClass}>{results.severity}</div>
        <div className="reco-stat-label">{"Severidad"}</div>
      </div>
      <div className="reco-stat reco-stat--neutral">
        <div className="reco-stat-med">{results.correct + "/" + results.total}</div>
        <div className="reco-stat-label">{"Contrastes reconocidos"}</div>
      </div>
    </div>

    <div className="reco-group-summary-card">
      <h3 className="reco-group-summary-title">{"Por grupo"}</h3>
      <div className="reco-group-summary-grid">
        {results.groupResults.map(function(g){
          var ok = g.correct === g.total && g.total > 0;
          return <div key={g.id} className={"reco-group-row " + (ok ? "reco-group-row--ok" : "reco-group-row--ko")}>
            <div>
              <span className={"reco-group-row-id " + (ok ? "reco-group-row-id--ok" : "reco-group-row-id--ko")}>{g.id}</span>
              <span className="reco-group-row-label">{g.label}</span>
            </div>
            <span className={"reco-group-row-count " + (ok ? "reco-group-row-count--ok" : "reco-group-row-count--ko")}>{g.correct + "/" + g.total}</span>
          </div>;
        })}
      </div>
    </div>

    {results.errorGroups.length > 0 && <div className="reco-errors-card">
      <h3 className="reco-errors-title">{"\u26a0 Dificultades"}</h3>
      {results.errorGroups.map(function(g){
        var f = g.items.filter(function(it){ return it.reconoce === false; });
        return <div key={g.id} className="reco-error-group">
          <div className="reco-error-group-title">{g.id + " - " + g.label}</div>
          {f.map(function(it){ return <div key={it.lam} className="reco-error-item">{"Lám. " + it.lam + ": Se dijo \"" + it.palabraObjetivo + "\" — Señaló \"" + it.palabraSeleccionada + "\""}</div>; })}
        </div>;
      })}
    </div>}

    {results.errorGroups.length === 0 && <div className="reco-empty-ok">
      <span className="reco-empty-icon">{"\u2705"}</span>
      <p className="reco-empty-text">{"Reconocimiento adecuado."}</p>
    </div>}
  </div>;
}

export default function NewRECO({ onS, nfy, userId, draft, therapistInfo }){
  return <EvalShell
    onS={onS} nfy={nfy} userId={userId}
    config={SHELL_CONFIG}
    renderEval={recoRenderEval}
    computeResults={recoComputeResults}
    buildPayloadExtra={recoBuildPayloadExtra}
    renderTechDetails={recoRenderTech} draft={draft} therapistInfo={therapistInfo}
  />;
}
