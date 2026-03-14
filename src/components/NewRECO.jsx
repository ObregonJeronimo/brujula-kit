import { useState, useCallback } from "react";
import { RECO_GROUPS, computeRecoResults } from "../data/recoFonData.js";
import EvalShell from "./EvalShell.jsx";
import { K } from "../lib/fb.js";

var SHELL_CONFIG = {
  title: "Reconocimiento Fonológico",
  subtitle: "Evaluación de reconocimiento de contrastes fonológicos",
  icon: "\ud83e\udde0",
  evalType: "reco",
  color: "#9333ea",
  steps: ["Paciente", "Evaluación", "Resultados"]
};

function recoComputeResults(responses) {
  return computeRecoResults(responses);
}

function recoBuildPayloadExtra(responses, obsMap) {
  return { responses: responses, obsMap: obsMap };
}

function recoRenderEval(props) {
  var responses = props.responses, setResponse = props.setResponse;
  var obsMap = props.obsMap, setOb = props.setOb;
  var obs = props.obs, setObs = props.setObs;
  var setStep = props.setStep, scrollTop = props.scrollTop;
  var accentColor = props.accentColor;
  var answeredCount = Object.keys(responses).length;
  var totalItems = 36;

  return <div>
    {/* Instructions */}
    <div style={{background:"#f3e8ff",border:"1px solid #c4b5fd",borderRadius:12,padding:"16px 20px",marginBottom:20}}>
      <div style={{fontSize:14,fontWeight:700,color:"#7c3aed",marginBottom:6}}>{"Como aplicar esta prueba"}</div>
      <div style={{fontSize:13,color:"#475569",lineHeight:1.7}}>
        {"Para cada item: diga las 5 palabras en voz alta, una por una. El paciente debe identificar si las palabras son iguales o diferentes. Marque 'Si' si el paciente reconoce correctamente el contraste entre los pares de palabras, o 'No' si no lo reconoce."}
      </div>
    </div>

    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <div style={{fontSize:13,color:"#64748b",fontWeight:600}}>{"Progreso: "+answeredCount+"/"+totalItems}</div>
      <div style={{width:120,height:6,background:"#e2e8f0",borderRadius:3,overflow:"hidden"}}><div style={{width:Math.round(answeredCount/totalItems*100)+"%",height:"100%",background:accentColor,borderRadius:3,transition:"width .3s"}}></div></div>
    </div>

    {RECO_GROUPS.map(function(group){
      return <div key={group.id} style={{background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",marginBottom:16,overflow:"hidden"}}>
        <div style={{background:"linear-gradient(135deg,#9333ea,#7c3aed)",padding:"14px 20px",color:"#fff"}}><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{background:"rgba(255,255,255,.2)",padding:"4px 10px",borderRadius:6,fontSize:14,fontWeight:800}}>{group.id}</span><span style={{fontSize:14,fontWeight:600}}>{group.label}</span></div></div>
        <div style={{padding:"12px 16px"}}>
          {group.items.map(function(item){
            var r = responses[item.lam];
            var pair = [];
            item.est.forEach(function(w){ if(pair.indexOf(w) === -1) pair.push(w); });
            var pairText = pair.join(" / ");

            return <div key={item.lam} style={{padding:"12px 16px",marginBottom:8,borderRadius:10,border:"1px solid "+(r==="si"?"#bbf7d0":r==="no"?"#fecaca":"#e2e8f0"),background:r==="si"?"#f0fdf4":r==="no"?"#fef2f2":"#fff"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,flex:1}}>
                  <span style={{fontSize:13,fontWeight:700,color:"#64748b",minWidth:30}}>{"#"+item.lam}</span>
                  <div>
                    <div style={{fontSize:15,fontWeight:700,color:"#1e293b"}}>{pairText}</div>
                    <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{"Diga las palabras en voz alta. El paciente identifica el contraste?"}</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={function(){setResponse(item.lam,r==="si"?undefined:"si")}} style={{padding:"8px 16px",borderRadius:8,border:r==="si"?"2px solid #059669":"1px solid #e2e8f0",background:r==="si"?"#059669":"#fff",color:r==="si"?"#fff":"#64748b",fontSize:13,fontWeight:700,cursor:"pointer"}}>{"Si"}</button>
                  <button onClick={function(){setResponse(item.lam,r==="no"?undefined:"no")}} style={{padding:"8px 16px",borderRadius:8,border:r==="no"?"2px solid #dc2626":"1px solid #e2e8f0",background:r==="no"?"#dc2626":"#fff",color:r==="no"?"#fff":"#64748b",fontSize:13,fontWeight:700,cursor:"pointer"}}>{"No"}</button>
                </div>
              </div>
              {r==="no" && <div style={{marginTop:8}}>
                <input value={obsMap[item.lam]||""} onChange={function(e){setOb(item.lam,e.target.value)}} placeholder="Observacion (opcional)" style={{width:"100%",padding:"6px 10px",border:"1px solid #fecaca",borderRadius:6,fontSize:12,background:"#fff"}} />
              </div>}
            </div>;
          })}
        </div>
      </div>;
    })}
    <div style={{marginTop:16}}><label style={{fontSize:12,fontWeight:600,color:"#64748b"}}>Observaciones generales</label><textarea value={obs} onChange={function(e){setObs(e.target.value)}} rows={3} placeholder="Notas..." style={{width:"100%",padding:"10px 12px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:13,marginTop:4,resize:"vertical",fontFamily:"inherit"}} /></div>
    <div style={{display:"flex",gap:10,marginTop:20}}>
      <button onClick={function(){setStep(0);scrollTop();}} style={{flex:1,padding:"12px",background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",color:"#64748b"}}>{"Volver"}</button>
      <button onClick={function(){setStep(2);scrollTop();}} style={{flex:2,padding:"12px",background:"#059669",border:"none",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",color:"#fff"}}>{"Ver Resultados"}</button>
    </div>
  </div>;
}

function recoRenderTech(results) {
  return <div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
      <div style={{background:"#f3e8ff",borderRadius:10,padding:16,textAlign:"center"}}><div style={{fontSize:28,fontWeight:800,color:"#9333ea"}}>{results.pct+"%"}</div><div style={{fontSize:11,color:K.mt,fontWeight:600}}>{"Aciertos"}</div></div>
      <div style={{background:results.severity==="Adecuado"?"#f0fdf4":results.severity==="Leve"?"#fffbeb":"#fef2f2",borderRadius:10,padding:16,textAlign:"center"}}><div style={{fontSize:20,fontWeight:700,color:results.severity==="Adecuado"?"#059669":results.severity==="Leve"?"#d97706":"#dc2626"}}>{results.severity}</div><div style={{fontSize:11,color:K.mt,fontWeight:600}}>{"Severidad"}</div></div>
      <div style={{background:"#f8fafc",borderRadius:10,padding:16,textAlign:"center"}}><div style={{fontSize:20,fontWeight:700,color:K.sd}}>{results.correct+"/"+results.total}</div><div style={{fontSize:11,color:K.mt,fontWeight:600}}>{"Contrastes"}</div></div>
    </div>
    <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,marginBottom:20}}>
      <h3 style={{fontSize:15,fontWeight:700,color:"#9333ea",marginBottom:12}}>{"Por grupo"}</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{results.groupResults.map(function(g){ var ok=g.correct===g.total; return <div key={g.id} style={{padding:"10px 14px",borderRadius:8,border:"1px solid "+(ok?"#bbf7d0":"#fecaca"),background:ok?"#f0fdf4":"#fef2f2",display:"flex",justifyContent:"space-between"}}><div><span style={{fontWeight:800,color:ok?"#059669":"#dc2626",marginRight:6}}>{g.id}</span><span style={{fontSize:12}}>{g.label}</span></div><span style={{fontWeight:700,color:ok?"#059669":"#dc2626"}}>{g.correct+"/"+g.total}</span></div>; })}</div>
    </div>
    {results.errorGroups.length>0 && <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,marginBottom:20}}>
      <h3 style={{fontSize:15,fontWeight:700,color:"#dc2626",marginBottom:12}}>{"\u26a0 Dificultades"}</h3>
      {results.errorGroups.map(function(g){ var f=g.items.filter(function(it){return it.reconoce===false;}); return <div key={g.id} style={{padding:"12px 14px",background:"#fef2f2",borderRadius:8,marginBottom:8}}><div style={{fontSize:13,fontWeight:700,color:"#dc2626"}}>{g.id+" - "+g.label}</div><div style={{fontSize:11,color:"#7f1d1d",marginTop:2}}>{"No reconocidos: "+f.map(function(it){return "Lám."+it.lam}).join(", ")}</div></div>; })}
    </div>}
    {results.errorGroups.length===0 && <div style={{background:"#dcfce7",borderRadius:12,padding:24,textAlign:"center",marginBottom:20}}><span style={{fontSize:28}}>{"\u2705"}</span><p style={{fontSize:14,fontWeight:600,color:"#059669",marginTop:8}}>{"Reconocimiento adecuado."}</p></div>}
  </div>;
}

export default function NewRECO({ onS, nfy, userId, draft }){
  return <EvalShell
    onS={onS} nfy={nfy} userId={userId}
    config={SHELL_CONFIG}
    renderEval={recoRenderEval}
    computeResults={recoComputeResults}
    buildPayloadExtra={recoBuildPayloadExtra}
    renderTechDetails={recoRenderTech} draft={draft}
  />;
}
