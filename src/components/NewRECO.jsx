import { useState, useCallback } from "react";
import { RECO_GROUPS, TOTAL_ITEMS, computeRecoResults, getImageUrl } from "../data/recoFonData.js";
import EvalShell from "./EvalShell.jsx";
import { K } from "../lib/fb.js";

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

  var _showImgs = useState({}), showImgs = _showImgs[0], setShowImgs = _showImgs[1];
  var toggleImgs = function(lam) { setShowImgs(function(prev) { var n = Object.assign({}, prev); n[lam] = !n[lam]; return n; }); };

  var setObjetivo = function(lam, wordKey) { var current = responses[lam] || {}; setResponse(lam, { objetivo: wordKey, seleccion: current.seleccion || null }); };
  var setSeleccion = function(lam, wordKey) { var current = responses[lam] || {}; if (!current.objetivo) return; setResponse(lam, { objetivo: current.objetivo, seleccion: wordKey }); };
  var resetItem = function(lam) { setResponse(lam, undefined); setShowImgs(function(prev) { var n = Object.assign({}, prev); delete n[lam]; return n; }); };

  return <div>
    <div style={{background:"#f3e8ff",border:"1px solid #c4b5fd",borderRadius:12,padding:"16px 20px",marginBottom:20}}>
      <div style={{fontSize:14,fontWeight:700,color:"#7c3aed",marginBottom:6}}>{"Protocolo de aplicación"}</div>
      <div style={{fontSize:13,color:"#475569",lineHeight:1.7}}>
        {"1. Seleccione la palabra que va a pronunciar (botón \"Decir\")."}<br/>
        {"2. Presione \"Mostrar ambas imágenes\" para mostrar al paciente."}<br/>
        {"3. Diga la palabra en voz alta al paciente."}<br/>
        {"4. Registre qué imagen señaló el paciente."}<br/>
        {"Si la selección del paciente coincide con la palabra pronunciada, se registra como acierto."}
      </div>
    </div>

    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
      <div style={{fontSize:13,color:"#64748b",fontWeight:600}}>{"Progreso: "+answeredCount+"/"+TOTAL_ITEMS}</div>
      <div style={{width:120,height:6,background:"#e2e8f0",borderRadius:3,overflow:"hidden"}}><div style={{width:Math.round(answeredCount/TOTAL_ITEMS*100)+"%",height:"100%",background:accentColor,borderRadius:3,transition:"width .3s"}}></div></div>
    </div>

    {RECO_GROUPS.map(function(group){
      return <div key={group.id} style={{background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",marginBottom:16,overflow:"hidden"}}>
        <div style={{background:"linear-gradient(135deg,#9333ea,#7c3aed)",padding:"14px 20px",color:"#fff"}}><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{background:"rgba(255,255,255,.2)",padding:"4px 10px",borderRadius:6,fontSize:14,fontWeight:800}}>{group.id}</span><span style={{fontSize:14,fontWeight:600}}>{group.label}</span></div></div>
        <div style={{padding:"12px 16px"}}>
          {group.items.map(function(item){
            var r = responses[item.lam] || {};
            var objetivo = r.objetivo || null;
            var seleccion = r.seleccion || null;
            var isComplete = objetivo && seleccion;
            var isCorrect = isComplete && objetivo === seleccion;
            var palabraObj = objetivo === "w1" ? item.w1 : objetivo === "w2" ? item.w2 : null;
            var palabraSel = seleccion === "w1" ? item.w1 : seleccion === "w2" ? item.w2 : null;
            var imgsVisible = showImgs[item.lam];
            var img1 = getImageUrl(item.w1);
            var img2 = getImageUrl(item.w2);

            return <div key={item.lam} style={{padding:"14px 0",marginBottom:8,borderBottom:"1px solid #f1f5f9"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:13,fontWeight:700,color:"#64748b"}}>{"#"+item.lam}</span>
                  {!isComplete && !objetivo && <span style={{fontSize:11,color:"#94a3b8"}}>{"Seleccione la palabra que va a pronunciar"}</span>}
                  {objetivo && !seleccion && <span style={{fontSize:11,color:"#7c3aed",fontWeight:600}}>{"Diga \""+palabraObj+"\" — registre qué imagen señaló"}</span>}
                </div>
                {isComplete && <button onClick={function(){resetItem(item.lam)}} style={{fontSize:10,color:"#94a3b8",background:"none",border:"1px solid #e2e8f0",borderRadius:6,padding:"3px 8px",cursor:"pointer"}}>Reiniciar</button>}
              </div>

              {/* Step 1: Choose which word to say */}
              {!objetivo && <div>
                <div style={{fontSize:11,fontWeight:600,color:"#7c3aed",marginBottom:6}}>{"¿Qué palabra va a decir?"}</div>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={function(){setObjetivo(item.lam,"w1")}} style={{flex:1,padding:"12px 16px",borderRadius:10,border:"2px solid #c4b5fd",background:"#faf5ff",cursor:"pointer",fontSize:14,fontWeight:700,color:"#7c3aed",transition:"all .15s"}}>{"Decir: \""+item.w1+"\""}</button>
                  <button onClick={function(){setObjetivo(item.lam,"w2")}} style={{flex:1,padding:"12px 16px",borderRadius:10,border:"2px solid #c4b5fd",background:"#faf5ff",cursor:"pointer",fontSize:14,fontWeight:700,color:"#7c3aed",transition:"all .15s"}}>{"Decir: \""+item.w2+"\""}</button>
                </div>
              </div>}

              {/* Step 2: Show images button + record selection */}
              {objetivo && !seleccion && <div>
                {/* Show images toggle */}
                {!imgsVisible && <button onClick={function(){toggleImgs(item.lam)}} style={{width:"100%",padding:"10px",borderRadius:10,border:"2px dashed #c4b5fd",background:"#faf5ff",cursor:"pointer",fontSize:13,fontWeight:600,color:"#7c3aed",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  {"Mostrar ambas imágenes"}
                </button>}
                {imgsVisible && <button onClick={function(){toggleImgs(item.lam)}} style={{width:"100%",padding:"6px",borderRadius:8,border:"1px solid #e2e8f0",background:"#f8fafc",cursor:"pointer",fontSize:11,fontWeight:500,color:"#94a3b8",marginBottom:10,textAlign:"center"}}>{"Ocultar imágenes"}</button>}

                {/* Images display */}
                {imgsVisible && <div style={{display:"flex",gap:12,marginBottom:12}}>
                  <div style={{flex:1,borderRadius:12,border:"2px solid #e2e8f0",overflow:"hidden",background:"#fff"}}>
                    {img1 ? <img src={img1} alt={item.w1} style={{width:"100%",height:140,objectFit:"contain",display:"block",padding:8}} /> : <div style={{height:140,display:"flex",alignItems:"center",justifyContent:"center",background:"#f1f5f9",color:"#94a3b8",fontSize:12}}>Sin imagen</div>}
                    <div style={{textAlign:"center",padding:"6px",fontSize:12,fontWeight:600,color:"#475569",borderTop:"1px solid #f1f5f9"}}>{item.w1}</div>
                  </div>
                  <div style={{flex:1,borderRadius:12,border:"2px solid #e2e8f0",overflow:"hidden",background:"#fff"}}>
                    {img2 ? <img src={img2} alt={item.w2} style={{width:"100%",height:140,objectFit:"contain",display:"block",padding:8}} /> : <div style={{height:140,display:"flex",alignItems:"center",justifyContent:"center",background:"#f1f5f9",color:"#94a3b8",fontSize:12}}>Sin imagen</div>}
                    <div style={{textAlign:"center",padding:"6px",fontSize:12,fontWeight:600,color:"#475569",borderTop:"1px solid #f1f5f9"}}>{item.w2}</div>
                  </div>
                </div>}

                <div style={{fontSize:11,fontWeight:600,color:"#475569",marginBottom:6}}>{"¿Qué imagen señaló el paciente?"}</div>
                <div style={{display:"flex",gap:12}}>
                  <div onClick={function(){setSeleccion(item.lam,"w1")}} style={{flex:1,padding:"14px",borderRadius:12,border:"2px solid #e2e8f0",background:"#f8faf9",cursor:"pointer",textAlign:"center",transition:"all .15s"}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#1e293b"}}>{item.w1}</div>
                    <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{"Señaló esta"}</div>
                  </div>
                  <div onClick={function(){setSeleccion(item.lam,"w2")}} style={{flex:1,padding:"14px",borderRadius:12,border:"2px solid #e2e8f0",background:"#f8faf9",cursor:"pointer",textAlign:"center",transition:"all .15s"}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#1e293b"}}>{item.w2}</div>
                    <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{"Señaló esta"}</div>
                  </div>
                </div>
              </div>}

              {/* Result badge */}
              {isComplete && <div style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:10,background:isCorrect?"#f0fdf4":"#fef2f2",border:isCorrect?"1px solid #bbf7d0":"1px solid #fecaca"}}>
                <div style={{fontSize:18}}>{isCorrect?"\u2705":"\u274c"}</div>
                <div style={{flex:1}}>
                  <div style={{fontSize:12,fontWeight:700,color:isCorrect?"#059669":"#dc2626"}}>{isCorrect?"Correcto":"Incorrecto"}</div>
                  <div style={{fontSize:11,color:"#475569",marginTop:1}}>{"Se dijo: \""+palabraObj+"\" — Señaló: \""+palabraSel+"\""}</div>
                </div>
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
      <div style={{background:"#f8fafc",borderRadius:10,padding:16,textAlign:"center"}}><div style={{fontSize:20,fontWeight:700,color:K.sd}}>{results.correct+"/"+results.total}</div><div style={{fontSize:11,color:K.mt,fontWeight:600}}>{"Contrastes reconocidos"}</div></div>
    </div>
    <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,marginBottom:20}}>
      <h3 style={{fontSize:15,fontWeight:700,color:"#9333ea",marginBottom:12}}>{"Por grupo"}</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{results.groupResults.map(function(g){ var ok=g.correct===g.total&&g.total>0; return <div key={g.id} style={{padding:"10px 14px",borderRadius:8,border:"1px solid "+(ok?"#bbf7d0":"#fecaca"),background:ok?"#f0fdf4":"#fef2f2",display:"flex",justifyContent:"space-between"}}><div><span style={{fontWeight:800,color:ok?"#059669":"#dc2626",marginRight:6}}>{g.id}</span><span style={{fontSize:12}}>{g.label}</span></div><span style={{fontWeight:700,color:ok?"#059669":"#dc2626"}}>{g.correct+"/"+g.total}</span></div>; })}</div>
    </div>
    {results.errorGroups.length>0 && <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,marginBottom:20}}>
      <h3 style={{fontSize:15,fontWeight:700,color:"#dc2626",marginBottom:12}}>{"\u26a0 Dificultades"}</h3>
      {results.errorGroups.map(function(g){ var f=g.items.filter(function(it){return it.reconoce===false;}); return <div key={g.id} style={{padding:"12px 14px",background:"#fef2f2",borderRadius:8,marginBottom:8}}>
        <div style={{fontSize:13,fontWeight:700,color:"#dc2626"}}>{g.id+" - "+g.label}</div>
        {f.map(function(it){ return <div key={it.lam} style={{fontSize:11,color:"#7f1d1d",marginTop:3}}>{"Lám. "+it.lam+": Se dijo \""+it.palabraObjetivo+"\" — Señaló \""+it.palabraSeleccionada+"\""}</div>; })}
      </div>; })}
    </div>}
    {results.errorGroups.length===0 && <div style={{background:"#dcfce7",borderRadius:12,padding:24,textAlign:"center",marginBottom:20}}><span style={{fontSize:28}}>{"\u2705"}</span><p style={{fontSize:14,fontWeight:600,color:"#059669",marginTop:8}}>{"Reconocimiento adecuado."}</p></div>}
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
