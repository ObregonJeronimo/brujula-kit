import { useState, useEffect } from "react";
import { REC, EXP } from "../data/eldiItems.js";
import { ELDI_IMAGES } from "../data/eldiImages.js";
import PatientLookup from "./PatientLookup.jsx";
import { calcScoring, gm, fa, scrollTop } from "./NewELDI_scoring.js";
import { SequenceGame, ShapesGame } from "./NewELDI_games.jsx";

var K = { mt: "#64748b" };

export default function NewELDI({onS,nfy,userId}){
  var _s=useState(1),step=_s[0],sS=_s[1];
  var _pd=useState({pN:"",birth:"",eD:new Date().toISOString().split("T")[0],sch:"",ref:"",obs:"",dni:""}),pd=_pd[0],sPd=_pd[1];
  var _rsp=useState({}),rsp=_rsp[0],sR=_rsp[1];
  var _ex=useState({}),showEx=_ex[0],setEx=_ex[1];
  var _im=useState({}),showImg=_im[0],setImg=_im[1];
  var _st2=useState({}),showStory=_st2[0],setStory=_st2[1];
  var _er=useState(true),evalRec=_er[0],setEvalRec=_er[1];
  var _ee=useState(true),evalExp=_ee[0],setEvalExp=_ee[1];
  var _d=useState(false),dirty=_d[0],setDirty=_d[1];
  var _sp=useState(null),selectedPatient=_sp[0],setSelectedPatient=_sp[1];

  useEffect(function(){scrollTop()},[step]);
  useEffect(function(){
    if(!dirty)return;
    var handler=function(e){e.preventDefault();e.returnValue=""};
    window.addEventListener("beforeunload",handler);
    return function(){window.removeEventListener("beforeunload",handler)};
  },[dirty]);

  var handlePatientSelect=function(pac){
    setSelectedPatient(pac);
    if(pac) sPd(function(p){return Object.assign({},p,{pN:pac.nombre||"",birth:pac.fechaNac||"",sch:pac.colegio||"",dni:pac.dni||""})});
    else sPd(function(p){return Object.assign({},p,{pN:"",birth:"",sch:"",dni:""})});
  };

  var a=pd.birth&&pd.eD?gm(pd.birth,pd.eD):0;
  var tog=function(id){setDirty(true);sR(function(p){var v=p[id];if(v===undefined)return Object.assign({},p,{[id]:true});if(v===true)return Object.assign({},p,{[id]:false});var n=Object.assign({},p);delete n[id];return n})};
  var markSection=function(groupItems,value){
    setDirty(true);
    sR(function(p){var n=Object.assign({},p);groupItems.forEach(function(item){if(value==="clear")delete n[item.id];else n[item.id]=value});return n});
  };

  var rR=evalRec?calcScoring(REC,rsp,a):{logrado:0,noLogrado:0,noEvaluado:REC.map(function(i){return i.id}),total:55,evaluados:0,pctLogrado:null};
  var rE=evalExp?calcScoring(EXP,rsp,a):{logrado:0,noLogrado:0,noEvaluado:EXP.map(function(i){return i.id}),total:55,evaluados:0,pctLogrado:null};

  var I={width:"100%",padding:"10px 14px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,background:"#f8faf9"};
  var Id={width:"100%",padding:"10px 14px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,background:"#f1f5f9",color:"#64748b",cursor:"not-allowed"};
  var Bt=function(props){return <button onClick={props.onClick} style={{background:props.pr?"#0d9488":"#f1f5f9",color:props.pr?"#fff":"#1e293b",border:"none",padding:"10px 22px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{props.children}</button>};

  var RI=function(items,prefix){
    var gr={};items.forEach(function(i){if(!gr[i.a])gr[i.a]=[];gr[i.a].push(i)});
    return <div>
      <h2 style={{fontSize:18,fontWeight:700,marginBottom:4}}>{prefix==="AC"?"\ud83d\udd0a Comprension Auditiva":"\ud83d\udde3\ufe0f Comunicacion Expresiva"}</h2>
      <p style={{color:K.mt,fontSize:13,marginBottom:16}}>{"1 click = \u2714 Logrado \u00b7 2 clicks = \u2718 No logrado \u00b7 3 clicks = Sin evaluar"}</p>
      {Object.entries(gr).map(function(entry){
        var range=entry[0],gi=entry[1];
        var allOk=gi.every(function(i){return rsp[i.id]===true});
        var allNo=gi.every(function(i){return rsp[i.id]===false});
        var allClear=gi.every(function(i){return rsp[i.id]===undefined});
        return <div key={range} style={{marginBottom:18}}>
          <div style={{background:"#ccfbf1",padding:"6px 12px",borderRadius:6,fontSize:12,fontWeight:600,color:"#0d9488",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:6}}>
            <span>{"Edad: "+range}</span>
            <div style={{display:"flex",gap:4}}>
              <button onClick={function(){markSection(gi,true)}} style={{background:allOk?"#059669":"#fff",color:allOk?"#fff":"#059669",border:"1px solid #059669",borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>{"\u2713 Todas"}</button>
              <button onClick={function(){markSection(gi,false)}} style={{background:allNo?"#dc2626":"#fff",color:allNo?"#fff":"#dc2626",border:"1px solid #dc2626",borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>{"\u2717 Todas"}</button>
              <button onClick={function(){markSection(gi,"clear")}} style={{background:allClear?"#94a3b8":"#fff",color:allClear?"#fff":"#94a3b8",border:"1px solid #94a3b8",borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>{"\u25cb Limpiar"}</button>
            </div>
          </div>
          {gi.map(function(item){
            var v=rsp[item.id];var exO=showEx[item.id];var imgO=showImg[item.id];
            var hasImg=!!item.img||!!item.imgUrl;var hasGame=!!item.game;var hasStoryBtn=!!item.story;
            return <div key={item.id} style={{marginBottom:3}}>
              <div onClick={function(){tog(item.id)}} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:(exO||imgO)?"8px 8px 0 0":8,cursor:"pointer",background:v===true?"#ecfdf5":v===false?"#fef2f2":"#fff",border:"1px solid "+(v===true?"#a7f3d0":v===false?"#fecaca":"#e2e8f0"),borderBottom:(exO||imgO)?"none":undefined}}>
                <div style={{width:28,height:28,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",background:v===true?"#059669":v===false?"#dc2626":"#e2e8f0",color:"#fff",fontSize:13,fontWeight:700,flexShrink:0}}>{v===true?"\u2713":v===false?"\u2717":"\u2014"}</div>
                <span style={{fontWeight:600,fontSize:12,color:"#64748b",minWidth:36}}>{item.id}</span>
                <span style={{fontSize:13,flex:1}}>{item.l}</span>
                <div style={{display:"flex",gap:4,flexShrink:0}}>
                  {(hasImg||hasGame)&&<button onClick={function(e){e.stopPropagation();setImg(function(p){var n=Object.assign({},p);n[item.id]=!p[item.id];return n});if(showEx[item.id])setEx(function(p){var n=Object.assign({},p);n[item.id]=false;return n})}}
                    style={{background:imgO?"#0d9488":"#f0fdf4",color:imgO?"#fff":"#0d9488",border:"1px solid #0d9488",borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>{imgO?"Ocultar":"Ver imagen"}</button>}
                  <button onClick={function(e){e.stopPropagation();setEx(function(p){var n=Object.assign({},p);n[item.id]=!p[item.id];return n});if(showImg[item.id])setImg(function(p){var n=Object.assign({},p);n[item.id]=false;return n})}}
                    style={{background:"none",border:"1px solid #e2e8f0",borderRadius:6,padding:"4px 10px",fontSize:11,color:"#64748b",cursor:"pointer"}}>{exO?"Ocultar":"Ejemplo"}</button>
                </div>
              </div>
              {exO&&<div style={{background:"#f0fdf4",padding:"8px 14px 8px 52px",borderRadius:imgO?"0":"0 0 8px 8px",border:"1px solid #e2e8f0",borderTop:"none",fontSize:12,color:"#16a34a",fontStyle:"italic"}}>
                {item.ej}
                {hasStoryBtn&&<div style={{marginTop:8}}>
                  <button onClick={function(){setStory(function(p){var n=Object.assign({},p);n[item.id]=!p[item.id];return n})}}
                    style={{background:"#0a3d2f",color:"#fff",border:"none",borderRadius:6,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                    {showStory[item.id]?"Ocultar historia":"Ver historia"}</button>
                  {showStory[item.id]&&<div style={{marginTop:8,padding:12,background:"#fff",border:"1px solid #d1fae5",borderRadius:8,fontStyle:"normal",color:"#1e293b",lineHeight:1.6}}>{item.story}</div>}
                </div>}
              </div>}
              {imgO&&<div style={{background:"#f8faf9",padding:12,borderRadius:"0 0 8px 8px",border:"1px solid #e2e8f0",borderTop:"none",textAlign:"center"}}>
                {item.game==="sequence"?<SequenceGame/>:
                 item.game==="shapes"?<ShapesGame/>:
                 item.imgUrl?<img src={item.imgUrl} alt={item.l} style={{maxWidth:340,maxHeight:340,borderRadius:10,margin:"0 auto",display:"block"}} loading="lazy"/>:
                 item.img&&ELDI_IMAGES[item.img]?<div dangerouslySetInnerHTML={{__html:ELDI_IMAGES[item.img]}} style={{maxWidth:300,margin:"0 auto"}}/>:
                 <div style={{color:"#94a3b8",fontSize:12,fontStyle:"italic"}}>Imagen no disponible</div>}
              </div>}
            </div>;
          })}
        </div>;
      })}
    </div>;
  };

  var steps=["Paciente"];
  if(evalRec)steps.push("Receptivo");
  if(evalExp)steps.push("Expresivo");
  steps.push("Resultado");
  var getStepContent=function(){var label=steps[step-1];if(label==="Paciente")return"patient";if(label==="Receptivo")return"rec";if(label==="Expresivo")return"exp";return"result"};
  var content=getStepContent();

  var renderNoEval=function(noEvalIds,items){
    if(noEvalIds.length===0)return null;
    var groups={};noEvalIds.forEach(function(id){var item=items.find(function(i){return i.id===id});if(item){if(!groups[item.a])groups[item.a]=[];groups[item.a].push(item)}});
    return <div style={{marginTop:12,padding:12,background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8}}>
      <div style={{fontSize:12,fontWeight:600,color:"#92400e",marginBottom:8}}>{"Items no evaluados:"}</div>
      {Object.entries(groups).map(function(e){return <div key={e[0]} style={{marginBottom:6}}>
        <div style={{fontSize:11,fontWeight:600,color:"#78350f",marginBottom:2}}>{"Edad "+e[0]+":"}</div>
        {e[1].map(function(it){return <div key={it.id} style={{fontSize:11,color:"#78350f",paddingLeft:8,lineHeight:1.6}}>{"\u2022 "+it.l+" ("+it.id+")"}</div>})}
      </div>})}
    </div>;
  };

  var renderClassification=function(scoring,label){
    if(!scoring||scoring.pctExpected===null||scoring.evaluados===0)return null;
    return <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:18,marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:14,color:"#0a3d2f",marginBottom:12}}>{"Analisis Criterial \u2014 "+label}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div style={{background:"#f0f9ff",padding:12,borderRadius:8}}>
          <div style={{fontSize:10,color:K.mt,marginBottom:4}}>{"Rendimiento segun edad"}</div>
          <div style={{fontSize:22,fontWeight:700,color:scoring.classColor}}>{scoring.pctExpected+"%"}</div>
          <div style={{fontSize:11,color:K.mt}}>{"("+scoring.logradoExpected+"/"+scoring.expectedCount+" items esperados logrados)"}</div>
        </div>
        <div style={{background:"#f0f9ff",padding:12,borderRadius:8}}>
          <div style={{fontSize:10,color:K.mt,marginBottom:4}}>{"Clasificacion"}</div>
          <div style={{fontSize:16,fontWeight:700,color:scoring.classColor}}>{scoring.classification}</div>
        </div>
        {scoring.devAgeLabel&&<div style={{background:"#f0f9ff",padding:12,borderRadius:8,gridColumn:"1/-1"}}>
          <div style={{fontSize:10,color:K.mt,marginBottom:4}}>{"Edad de desarrollo estimada"}</div>
          <div style={{fontSize:18,fontWeight:700,color:"#0d9488"}}>{scoring.devAgeLabel}</div>
          <div style={{fontSize:11,color:K.mt}}>{"(banda maxima con >=80% de items logrados)"}</div>
        </div>}
      </div>
    </div>;
  };

  return <div style={{width:"100%",maxWidth:800,animation:"fi .3s ease"}}>
    <div style={{display:"flex",gap:4,marginBottom:22}}>{steps.map(function(s,i){return <div key={i} style={{flex:1,textAlign:"center"}}><div style={{height:4,borderRadius:2,marginBottom:5,background:step>i+1?"#0d9488":step===i+1?"#b2dfdb":"#e2e8f0"}}/><span style={{fontSize:11,color:step===i+1?"#0d9488":"#64748b",fontWeight:step===i+1?600:400}}>{s}</span></div>})}</div>
    <div style={{background:"#fff",borderRadius:12,padding:28,border:"1px solid #e2e8f0"}}>

      {content==="patient"&&<div>
        <h2 style={{fontSize:18,fontWeight:700,marginBottom:4}}>{"ELDI \u2014 Datos del Paciente"}</h2>
        <p style={{color:K.mt,fontSize:13,marginBottom:20}}>{"Evaluacion del Lenguaje y Desarrollo Infantil"}</p>
        <PatientLookup userId={userId} onSelect={handlePatientSelect} selected={selectedPatient} color="#0d9488" />
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div style={{gridColumn:"1/-1"}}><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Nombre completo</label><input value={pd.pN} readOnly disabled style={Id}/></div>
          <div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>DNI</label><input value={pd.dni} readOnly disabled style={Id}/></div>
          <div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Fecha nacimiento</label><input type="date" value={pd.birth} readOnly disabled style={Id}/></div>
          <div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Establecimiento</label><input value={pd.sch} readOnly disabled style={Id}/></div>
          <div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>{"Fecha evaluacion"}</label><input type="date" value={pd.eD} onChange={function(e){sPd(function(p){return Object.assign({},p,{eD:e.target.value})})}} style={I}/></div>
          <div style={{gridColumn:"1/-1"}}><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Derivado por</label><input value={pd.ref} onChange={function(e){sPd(function(p){return Object.assign({},p,{ref:e.target.value})})}} style={I} placeholder="Profesional"/></div>
        </div>
        {a>0&&<div style={{marginTop:14,padding:"10px 16px",background:"#ccfbf1",borderRadius:8,fontSize:14}}><strong>{"Edad:"}</strong>{" "+fa(a)+" ("+a+" meses)"}</div>}
        <div style={{marginTop:20,padding:16,background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:10}}>
          <div style={{fontSize:13,fontWeight:700,color:"#0369a1",marginBottom:10}}>{"Que areas evaluar?"}</div>
          <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:14}}><input type="checkbox" checked={evalRec} onChange={function(e){setEvalRec(e.target.checked)}} style={{width:18,height:18,accentColor:"#0d9488"}}/>{"\ud83d\udd0a Comprension Auditiva (Receptivo)"}</label>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:14}}><input type="checkbox" checked={evalExp} onChange={function(e){setEvalExp(e.target.checked)}} style={{width:18,height:18,accentColor:"#0d9488"}}/>{"\ud83d\udde3\ufe0f Comunicacion Expresiva"}</label>
          </div>
          {!evalRec&&!evalExp&&<div style={{marginTop:8,color:"#dc2626",fontSize:12,fontWeight:600}}>{"Debe seleccionar al menos un area"}</div>}
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:20}}><Bt pr={true} onClick={function(){if(!selectedPatient){nfy("Busque y seleccione un paciente por DNI","er");return}if(!evalRec&&!evalExp){nfy("Seleccione al menos un area","er");return}setDirty(true);sS(2)}}>{"Siguiente \u2192"}</Bt></div>
      </div>}

      {content==="rec"&&<div>{RI(REC,"AC")}<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14,paddingTop:14,borderTop:"1px solid #e2e8f0"}}><span style={{fontSize:13,color:K.mt}}>{"Logrados: "}<b style={{color:"#0d9488"}}>{rR.logrado}</b>{"/55 \u00b7 Sin evaluar: "}<b style={{color:"#f59e0b"}}>{rR.noEvaluado.length}</b></span><div style={{display:"flex",gap:8}}><Bt onClick={function(){sS(step-1)}}>{"\u2190 Atras"}</Bt><Bt pr={true} onClick={function(){sS(step+1)}}>{"Siguiente \u2192"}</Bt></div></div></div>}

      {content==="exp"&&<div>{RI(EXP,"EC")}<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14,paddingTop:14,borderTop:"1px solid #e2e8f0"}}><span style={{fontSize:13,color:K.mt}}>{"Logrados: "}<b style={{color:"#0d9488"}}>{rE.logrado}</b>{"/55 \u00b7 Sin evaluar: "}<b style={{color:"#f59e0b"}}>{rE.noEvaluado.length}</b></span><div style={{display:"flex",gap:8}}><Bt onClick={function(){sS(step-1)}}>{"\u2190 Atras"}</Bt><Bt pr={true} onClick={function(){sS(step+1)}}>{"Resultados \u2192"}</Bt></div></div></div>}

      {content==="result"&&(function(){
        var recRes={label:"Comprension Auditiva",evaluated:evalRec};Object.assign(recRes,rR);
        var expRes={label:"Comunicacion Expresiva",evaluated:evalExp};Object.assign(expRes,rE);
        var allNoEval=[].concat(evalRec?rR.noEvaluado:[]).concat(evalExp?rE.noEvaluado:[]);

        return <div>
          <h2 style={{fontSize:20,fontWeight:700,marginBottom:8}}>{"Resultados ELDI \u2014 "+pd.pN}</h2>
          <p style={{fontSize:12,color:K.mt,marginBottom:20}}>{"Edad: "+fa(a)+" \u00b7 Evaluacion: "+pd.eD+(pd.dni?" \u00b7 DNI: "+pd.dni:"")}</p>

          {evalRec&&rR.evaluados>0&&renderClassification(rR,"Comprension Auditiva")}
          {evalExp&&rE.evaluados>0&&renderClassification(rE,"Comunicacion Expresiva")}

          <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:10,padding:14,marginBottom:20,fontSize:12,color:"#0369a1"}}>
            <strong>{"Nota:"}</strong>{" La clasificacion se basa en un analisis criterial (comparacion con hitos esperados por edad), no en baremos normativos. Cortes: >=90% = Normal, 75-89% = En Riesgo, 50-74% = Retraso Moderado, menos de 50% = Retraso Significativo."}
          </div>

          {[recRes,expRes].map(function(area,i){
            var items=i===0?REC:EXP;
            if(!area.evaluated)return <div key={i} style={{background:"#f1f5f9",borderRadius:10,padding:20,border:"1px solid #e2e8f0",marginBottom:14}}>
              <div style={{fontWeight:700,fontSize:15}}>{i===0?"\ud83d\udd0a":"\ud83d\udde3\ufe0f"}{" "+area.label}</div>
              <div style={{fontSize:14,color:"#64748b",fontStyle:"italic",marginTop:6}}>{"No evaluado en esta sesion"}</div>
            </div>;
            return <div key={i} style={{background:"#f8faf9",borderRadius:10,padding:20,border:"1px solid #e2e8f0",marginBottom:14}}>
              <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>{i===0?"\ud83d\udd0a":"\ud83d\udde3\ufe0f"}{" "+area.label}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                <div><div style={{fontSize:10,color:K.mt,marginBottom:2}}>{"Items logrados"}</div><div style={{fontSize:24,fontWeight:700,color:"#059669"}}>{area.logrado}<span style={{fontSize:14,color:K.mt}}>{"/"+area.total}</span></div></div>
                <div><div style={{fontSize:10,color:K.mt,marginBottom:2}}>{"No logrados"}</div><div style={{fontSize:24,fontWeight:700,color:"#dc2626"}}>{area.noLogrado}</div></div>
                <div><div style={{fontSize:10,color:K.mt,marginBottom:2}}>{"Sin evaluar"}</div><div style={{fontSize:24,fontWeight:700,color:"#f59e0b"}}>{area.noEvaluado.length}</div></div>
              </div>
              {area.evaluados>0&&<div style={{marginTop:12}}>
                <div style={{fontSize:10,color:K.mt,marginBottom:4}}>{"Porcentaje de logro (sobre items evaluados)"}</div>
                <div style={{background:"#e2e8f0",borderRadius:6,height:24,overflow:"hidden",position:"relative"}}>
                  <div style={{background:area.pctLogrado>=80?"#059669":area.pctLogrado>=50?"#f59e0b":"#dc2626",height:"100%",width:area.pctLogrado+"%",borderRadius:6,transition:"width .5s"}}/>
                  <span style={{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",fontSize:12,fontWeight:700,color:"#1e293b"}}>{area.pctLogrado+"%"}</span>
                </div>
              </div>}
              {renderNoEval(area.noEvaluado,items)}
            </div>;
          })}

          <div style={{background:"linear-gradient(135deg,#0a3d2f,#0d9488)",borderRadius:10,padding:24,color:"#fff",marginBottom:24}}>
            <div style={{fontSize:13,opacity:.8,marginBottom:8}}>Resumen</div>
            <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
              {evalRec&&<div><span style={{fontSize:36,fontWeight:700}}>{rR.logrado}</span><span style={{fontSize:14,opacity:.7}}>{"/"+rR.evaluados+" Receptivo"}</span></div>}
              {evalExp&&<div><span style={{fontSize:36,fontWeight:700}}>{rE.logrado}</span><span style={{fontSize:14,opacity:.7}}>{"/"+rE.evaluados+" Expresivo"}</span></div>}
            </div>
            {allNoEval.length>0&&<div style={{marginTop:12,padding:"8px 12px",background:"rgba(255,255,255,.12)",borderRadius:8,fontSize:12}}>{allNoEval.length+" items sin evaluar \u2014 resultados parciales"}</div>}
          </div>

          <div style={{marginBottom:20}}><label style={{fontSize:13,fontWeight:600,color:K.mt,display:"block",marginBottom:6}}>{"Observaciones clinicas"}</label><textarea value={pd.obs} onChange={function(e){sPd(function(p){return Object.assign({},p,{obs:e.target.value})})}} rows={4} style={{width:"100%",padding:"12px 14px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,resize:"vertical",background:"#f8faf9"}} placeholder="Interpretacion profesional..."/></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><Bt onClick={function(){sS(step-1)}}>{"\u2190 Atras"}</Bt><button onClick={function(){setDirty(false);onS(Object.assign({},pd,{a:a,rsp:rsp,evalRec:evalRec,evalExp:evalExp,rR:rR.logrado,rE:rE.logrado,recRes:recRes,expRes:expRes,allNoEval:allNoEval,scoringRec:evalRec?rR:null,scoringExp:evalExp?rE:null}))}} style={{background:"#0d9488",color:"#fff",border:"none",padding:"12px 28px",borderRadius:8,fontSize:15,fontWeight:700,cursor:"pointer"}}>Guardar</button></div>
        </div>;
      })()}
    </div>
  </div>;
}
