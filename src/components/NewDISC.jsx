import { useCallback } from "react";
import { DISC_PAIRS, computeDiscResults } from "../data/discFonData.js";
import EvalShell from "./EvalShell.jsx";
import { K } from "../lib/fb.js";

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

  return <div>
    {/* Instructions */}
    <div style={{background:"#fff7ed",border:"1px solid #fed7aa",borderRadius:12,padding:"16px 20px",marginBottom:16}}>
      <div style={{fontSize:14,fontWeight:700,color:"#c2410c",marginBottom:6}}>{"Como aplicar esta prueba"}</div>
      <div style={{fontSize:13,color:"#475569",lineHeight:1.7}}>
        {"Tapese la boca con la mano o una hoja para que el paciente no pueda leer sus labios. Diga cada par de palabras en voz alta y pregunte: \"Estas dos palabras son iguales o distintas?\". Registre la respuesta del paciente."}
      </div>
    </div>

    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <div style={{fontSize:13,color:K.mt,fontWeight:600}}>{"Progreso: "+answeredCount+"/"+DISC_PAIRS.length}</div>
      <div style={{width:120,height:6,background:"#e2e8f0",borderRadius:3,overflow:"hidden"}}><div style={{width:Math.round(answeredCount/DISC_PAIRS.length*100)+"%",height:"100%",background:K.ac,borderRadius:3,transition:"width .3s"}}></div></div>
    </div>
    <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,overflow:"hidden"}}>
      <div style={{display:"grid",gridTemplateColumns:"44px 1fr 180px 1fr",gap:0,background:K.sd,color:"#fff",padding:"10px 16px",fontSize:12,fontWeight:700}}><span>{"N\u00b0"}</span><span>{"Oposición"}</span><span style={{textAlign:"center"}}>{"Respuesta"}</span><span>{"Observación"}</span></div>
      {DISC_PAIRS.map(function(pair){ var r=responses[pair.id],isCorrect=r===pair.clave,isIncorrect=r!==undefined&&r!==pair.clave,bgRow=r===undefined?"#fff":isCorrect?"#f0fdf4":"#fef2f2";
        return <div key={pair.id} style={{display:"grid",gridTemplateColumns:"44px 1fr 180px 1fr",gap:0,padding:"10px 16px",borderTop:"1px solid #f1f5f9",background:bgRow,alignItems:"center"}}>
          <span style={{fontSize:13,fontWeight:700,color:K.mt}}>{pair.id}</span>
          <span style={{fontSize:14,fontWeight:500}}>{pair.word1+" \u2014 "+pair.word2}</span>
          <div style={{display:"flex",gap:4,justifyContent:"center"}}>
            <button onClick={function(){setResponse(pair.id,"I")}} style={{padding:"6px 12px",borderRadius:6,border:r==="I"?"2px solid #2563eb":"1px solid "+K.bd,background:r==="I"?"#dbeafe":"#fff",color:r==="I"?"#2563eb":K.mt,fontSize:11,fontWeight:700,cursor:"pointer"}}>IGUALES</button>
            <button onClick={function(){setResponse(pair.id,"D")}} style={{padding:"6px 12px",borderRadius:6,border:r==="D"?"2px solid #be185d":"1px solid "+K.bd,background:r==="D"?"#fce7f3":"#fff",color:r==="D"?"#be185d":K.mt,fontSize:11,fontWeight:700,cursor:"pointer"}}>DIFERENTES</button>
          </div>
          <input value={obsMap[pair.id]||""} onChange={function(e){setOb(pair.id,e.target.value)}} placeholder="..." style={{padding:"5px 8px",border:"1px solid "+K.bd,borderRadius:6,fontSize:11,background:"#fff",width:"100%"}} />
          {r!==undefined && <div style={{gridColumn:"1/-1",paddingTop:4}}>{isCorrect && <span style={{fontSize:10,color:"#059669",fontWeight:600}}>{"\u2714 Correcto"}</span>}{isIncorrect && <span style={{fontSize:10,color:"#dc2626",fontWeight:600}}>{"\u2718 Incorrecto"}</span>}</div>}
        </div>;
      })}
    </div>
    <div style={{marginTop:16}}><label style={{fontSize:12,fontWeight:600,color:K.mt}}>Observaciones generales</label><textarea value={obs} onChange={function(e){setObs(e.target.value)}} rows={3} placeholder="Notas..." style={{width:"100%",padding:"10px 12px",border:"1px solid "+K.bd,borderRadius:8,fontSize:13,marginTop:4,resize:"vertical",fontFamily:"inherit"}} /></div>
    <div style={{display:"flex",gap:10,marginTop:20}}>
      <button onClick={function(){setStep(0);scrollTop();}} style={{flex:1,padding:"12px",background:"#f1f5f9",border:"1px solid "+K.bd,borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",color:K.mt}}>{"\u2190 Volver"}</button>
      <button onClick={function(){setStep(2);scrollTop();}} style={{flex:2,padding:"12px",background:"#059669",border:"none",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",color:"#fff"}}>{"Ver Resultados \u2192"}</button>
    </div>
  </div>;
}

function discRenderTech(results) {
  return <div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
      <div style={{background:"#f0fdf4",borderRadius:10,padding:16,textAlign:"center"}}><div style={{fontSize:28,fontWeight:800,color:K.ac}}>{results.pct+"%"}</div><div style={{fontSize:11,color:K.mt,fontWeight:600}}>{"Aciertos"}</div></div>
      <div style={{background:results.severity==="Adecuado"?"#f0fdf4":results.severity==="Leve"?"#fffbeb":"#fef2f2",borderRadius:10,padding:16,textAlign:"center"}}><div style={{fontSize:20,fontWeight:700,color:results.severity==="Adecuado"?"#059669":results.severity==="Leve"?"#d97706":"#dc2626"}}>{results.severity}</div><div style={{fontSize:11,color:K.mt,fontWeight:600}}>{"Severidad"}</div></div>
      <div style={{background:"#f8fafc",borderRadius:10,padding:16,textAlign:"center"}}><div style={{fontSize:20,fontWeight:700,color:K.sd}}>{results.correct+"/"+results.evaluated}</div><div style={{fontSize:11,color:K.mt,fontWeight:600}}>{"Correctos"}</div></div>
    </div>
    {results.errors.length > 0 && <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,marginBottom:20}}>
      <h3 style={{fontSize:15,fontWeight:700,color:"#dc2626",marginBottom:12}}>{"\u26a0 Errores ("+results.errors.length+")"}</h3>
      {results.errors.map(function(e){ return <div key={e.id} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 12px",background:"#fef2f2",borderRadius:8,marginBottom:6,flexWrap:"wrap"}}><span style={{fontWeight:700,color:K.mt,fontSize:12}}>{"#"+e.id}</span><span style={{fontSize:13}}>{e.word1+" \u2014 "+e.word2}</span><span style={{fontSize:11,color:"#dc2626",fontWeight:600}}>{"Clave:"+e.clave+" Resp:"+e.respuesta}</span></div>; })}
    </div>}
    {results.errors.length===0 && <div style={{background:"#dcfce7",borderRadius:12,padding:24,textAlign:"center",marginBottom:20}}><span style={{fontSize:28}}>{"\u2705"}</span><p style={{fontSize:14,fontWeight:600,color:"#059669",marginTop:8}}>{"Discriminación adecuada."}</p></div>}
  </div>;
}

export default function NewDISC({ onS, nfy, userId, draft }){
  return <EvalShell
    onS={onS} nfy={nfy} userId={userId}
    config={SHELL_CONFIG}
    renderEval={discRenderEval}
    computeResults={discComputeResults}
    buildPayloadExtra={discBuildPayloadExtra}
    renderTechDetails={discRenderTech} draft={draft}
  />;
}
