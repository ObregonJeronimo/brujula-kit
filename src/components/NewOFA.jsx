// NewOFA — Examen Clinico EOF (seccion 1 del PEFF, independiente)
import { useCallback } from "react";
import { PEFF_SECTIONS } from "../data/peffSections.js";
import { HelpTip, OptionHelpTip, TeethButton } from "./NewPEFF_helpers.jsx";
import EvalShell from "./EvalShell.jsx";

var OFA_SECTION = PEFF_SECTIONS.find(function(s){ return s.id === "ec"; });
var I = {width:"100%",padding:"10px 14px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,background:"#f8faf9"};

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
  var renderEval = useCallback(function(props){
    var subIdx = props.step - 1;
    if(subIdx < 0 || subIdx >= OFA_SECTION.subsections.length) return null;
    var sub = OFA_SECTION.subsections[subIdx];

    var rField = function(f){
      if(f.type === "text") return <div key={f.id} style={{marginBottom:14}}>
        <label style={{fontSize:12,fontWeight:600,color:"#64748b",display:"block",marginBottom:4}}>{f.label}<HelpTip text={f.help} searchTerm={f.label}/>{f.showTeethImg && <TeethButton arch={f.showTeethImg} ageMo={props.patientAge}/>}</label>
        <input value={props.responses[f.id]||""} onChange={function(e){props.setResponse(f.id,null);props.setResponse(f.id,e.target.value)}} style={I}/>
      </div>;
      var cur = props.responses[f.id] || "";
      return <div key={f.id} style={{marginBottom:14}}>
        <label style={{fontSize:12,fontWeight:600,color:"#64748b",display:"block",marginBottom:6}}>{f.label}<HelpTip text={f.help} searchTerm={f.label}/></label>
        {f.desc && <div style={{fontSize:11,color:"#0891b2",marginBottom:6,fontStyle:"italic"}}>{f.desc}</div>}
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {f.options.map(function(o){
            return <span key={o} style={{display:"inline-flex",alignItems:"center"}}>
              <button onClick={function(){props.setResponse(f.id, cur===o ? null : o); props.setResponse(f.id, cur===o ? "" : o);}} style={{padding:"8px 14px",borderRadius:8,border:cur===o?"2px solid #0891b2":"1px solid #e2e8f0",background:cur===o?"#e0f2fe":"#fff",color:cur===o?"#0e7490":"#475569",fontSize:13,fontWeight:cur===o?700:400,cursor:"pointer",textAlign:"left"}}>{cur===o && "\u2713 "}{o}</button>
              {f.optionHelp && f.optionHelp[o] && <OptionHelpTip text={f.optionHelp[o]} label={o}/>}
            </span>;
          })}
        </div>
      </div>;
    };

    return <div>
      <h3 style={{fontSize:16,fontWeight:700,color:"#0891b2",marginBottom:4}}>{sub.title}</h3>
      <div style={{marginTop:16}}>{sub.fields.map(rField)}</div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:20,paddingTop:14,borderTop:"1px solid #e2e8f0"}}>
        <button onClick={function(){ props.setStep(props.step-1); props.scrollTop(); }} style={{background:"#f1f5f9",border:"none",padding:"10px 22px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{"Atras"}</button>
        <button onClick={function(){ props.setStep(props.step+1); props.scrollTop(); }} style={{background:"#0891b2",color:"#fff",border:"none",padding:"10px 22px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{props.step < props.RESULT_STEP - 1 ? "Siguiente" : "Ver Resultados"}</button>
      </div>
    </div>;
  },[]);

  var renderTechDetails = function(results){
    return <div style={{background:"#f8faf9",borderRadius:12,padding:20,border:"1px solid #e2e8f0",marginBottom:16}}>
      <div style={{fontSize:14,fontWeight:700,marginBottom:8}}>Resumen OFA</div>
      <div style={{fontSize:13,color:"#475569"}}>{"Campos completados: " + results.answered + "/" + results.total + " (" + results.pct + "%)"}</div>
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
