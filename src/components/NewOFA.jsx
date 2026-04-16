// NewOFA — Examen Clinico EOF (seccion 1 del PEFF, independiente)
import { PEFF_SECTIONS } from "../data/peffSections.js";
import { HelpTip, OptionHelpTip, TeethButton } from "./NewPEFF_helpers.jsx";
import EvalShell from "./EvalShell.jsx";
import "../styles/NewOFA.css";

var OFA_SECTION = PEFF_SECTIONS.find(function(s){ return s.id === "ec"; });

var config = {
  evalType: "ofa",
  title: "Examen Clinico EOF",
  subtitle: "Evaluacion de organos fonoarticulatorios",
  icon: "\ud83e\ude7a",
  color: "#0891b2",
  steps: ["Paciente"].concat(OFA_SECTION.subsections.map(function(s){ return s.title.replace(/^\d+\.\d*\s*/,""); })).concat(["Resultados"])
};

function computeResults(responses){
  var total = 0, answered = 0;
  OFA_SECTION.subsections.forEach(function(sub){
    sub.fields.forEach(function(f){
      if(f.type !== "text"){ total++; if(responses[f.id]) answered++; }
    });
  });
  return { total: total, answered: answered, pct: total ? Math.round(answered/total*100) : 0, responses: responses };
}

function buildPayloadExtra(responses){
  return { seccionData: responses };
}

export default function NewOFA({ onS, nfy, userId, draft, therapistInfo }){
  // IMPORTANTE: NO usar useCallback aquí — commit 69d58c9 arreglo que los
  // botones EOF no respondían al click porque las props quedaban congeladas
  // al momento del mount. renderEval como función normal SI funciona.
  var renderEval = function(props){
    var subIdx = props.step - 1;
    if(subIdx < 0 || subIdx >= OFA_SECTION.subsections.length) return null;
    var sub = OFA_SECTION.subsections[subIdx];

    var rField = function(f){
      if(f.type === "text") return <div key={f.id} className="ofa-field">
        <label className="ofa-label">
          {f.label}
          <HelpTip text={f.help} searchTerm={f.label}/>
          {f.showTeethImg && <TeethButton arch={f.showTeethImg} ageMo={props.patientAge}/>}
        </label>
        <input
          value={props.responses[f.id] || ""}
          onChange={function(e){ props.setResponse(f.id, null); props.setResponse(f.id, e.target.value); }}
          className="ofa-input"
        />
      </div>;

      var cur = props.responses[f.id] || "";
      return <div key={f.id} className="ofa-field">
        <label className="ofa-label ofa-label--options">
          {f.label}
          <HelpTip text={f.help} searchTerm={f.label}/>
        </label>
        {f.desc && <div className="ofa-desc">{f.desc}</div>}
        <div className="ofa-opts">
          {f.options.map(function(o){
            return <span key={o} className="ofa-opt-wrap">
              <button
                onClick={function(){
                  props.setResponse(f.id, cur===o ? null : o);
                  props.setResponse(f.id, cur===o ? "" : o);
                }}
                className={"ofa-opt" + (cur === o ? " ofa-opt--active" : "")}
              >{cur === o && "\u2713 "}{o}</button>
              {f.optionHelp && f.optionHelp[o] && <OptionHelpTip text={f.optionHelp[o]} label={o}/>}
            </span>;
          })}
        </div>
      </div>;
    };

    return <div className="ofa">
      <h3 className="ofa-title">{sub.title}</h3>
      <div className="ofa-body">{sub.fields.map(rField)}</div>
      <div className="ofa-nav">
        <button onClick={function(){ props.setStep(props.step-1); props.scrollTop(); }} className="ofa-btn-back">{"Atras"}</button>
        <button onClick={function(){ props.setStep(props.step+1); props.scrollTop(); }} className="ofa-btn-next">{props.step < props.RESULT_STEP - 1 ? "Siguiente" : "Ver Resultados"}</button>
      </div>
    </div>;
  };

  var renderTechDetails = function(results){
    return <div className="ofa-tech">
      <div className="ofa-tech-title">Resumen OFA</div>
      <div className="ofa-tech-body">{"Campos completados: " + results.answered + "/" + results.total + " (" + results.pct + "%)"}</div>
    </div>;
  };

  return <EvalShell
    onS={onS} nfy={nfy} userId={userId}
    config={config}
    renderEval={renderEval}
    computeResults={computeResults}
    buildPayloadExtra={buildPayloadExtra}
    renderTechDetails={renderTechDetails}
    draft={draft} therapistInfo={therapistInfo}
  />;
}
