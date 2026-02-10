import { useState, useEffect } from "react";
import { REC, EXP } from "../data/eldiItems.js";

const K = { mt: "#64748b" };
const gm=(b,e)=>{const B=new Date(b),E=new Date(e);let m=(E.getFullYear()-B.getFullYear())*12+E.getMonth()-B.getMonth();if(E.getDate()<B.getDate())m--;return Math.max(0,m)};
const fa=m=>`${Math.floor(m/12)} a\u00f1os, ${m%12} meses`;

export default function NewELDI({onS,nfy}){
  const[step,sS]=useState(1);
  const[pd,sPd]=useState({pN:"",birth:"",eD:new Date().toISOString().split("T")[0],sch:"",ref:"",obs:""});
  const[rsp,sR]=useState({});
  const[showEx,setEx]=useState({});
  const[evalRec,setEvalRec]=useState(true);
  const[evalExp,setEvalExp]=useState(true);
  const[dirty,setDirty]=useState(false);

  useEffect(()=>{
    if(!dirty)return;
    const handler=e=>{e.preventDefault();e.returnValue="";};
    window.addEventListener("beforeunload",handler);
    return()=>window.removeEventListener("beforeunload",handler);
  },[dirty]);

  const a=pd.birth&&pd.eD?gm(pd.birth,pd.eD):0;
  const tog=id=>{setDirty(true);sR(p=>{const v=p[id];if(v===undefined)return{...p,[id]:true};if(v===true)return{...p,[id]:false};const n={...p};delete n[id];return n})};

  const countItems=(items)=>{
    let logrado=0,noLogrado=0,noEvaluado=[];
    items.forEach(i=>{const v=rsp[i.id];if(v===true)logrado++;else if(v===false)noLogrado++;else noEvaluado.push(i.id);});
    return{logrado,noLogrado,noEvaluado,total:items.length,evaluados:logrado+noLogrado};
  };

  const rR=countItems(REC);
  const rE=countItems(EXP);

  const I={width:"100%",padding:"10px 14px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,background:"#f8faf9"};
  const Bt=({children,onClick,pr})=><button onClick={onClick} style={{background:pr?"#0d9488":"#f1f5f9",color:pr?"#fff":"#1e293b",border:"none",padding:"10px 22px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{children}</button>;

  const RI=(items,prefix)=>{const gr={};items.forEach(i=>{if(!gr[i.a])gr[i.a]=[];gr[i.a].push(i)});
    return(<div><h2 style={{fontSize:18,fontWeight:700,marginBottom:4}}>{prefix==="AC"?"\ud83d\udd0a Comprensi\u00f3n Auditiva":"\ud83d\udde3\ufe0f Comunicaci\u00f3n Expresiva"}</h2>
      <p style={{color:K.mt,fontSize:13,marginBottom:16}}>1 click = \u2714 Logrado \u00b7 2 clicks = \u2718 No logrado \u00b7 3 clicks = Sin evaluar</p>
      {Object.entries(gr).map(([range,gi])=><div key={range} style={{marginBottom:18}}><div style={{background:"#ccfbf1",padding:"6px 12px",borderRadius:6,fontSize:12,fontWeight:600,color:"#0d9488",marginBottom:8}}>Edad: {range}</div>
        {gi.map(item=>{const v=rsp[item.id];const exO=showEx[item.id];return(<div key={item.id} style={{marginBottom:3}}>
          <div onClick={()=>tog(item.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:exO?"8px 8px 0 0":8,cursor:"pointer",background:v===true?"#ecfdf5":v===false?"#fef2f2":"#fff",border:`1px solid ${v===true?"#a7f3d0":v===false?"#fecaca":"#e2e8f0"}`,borderBottom:exO?"none":undefined}}>
            <div style={{width:28,height:28,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",background:v===true?"#059669":v===false?"#dc2626":"#e2e8f0",color:"#fff",fontSize:13,fontWeight:700,flexShrink:0}}>{v===true?"\u2713":v===false?"\u2717":"\u2014"}</div>
            <span style={{fontWeight:600,fontSize:12,color:"#64748b",minWidth:36}}>{item.id}</span><span style={{fontSize:13,flex:1}}>{item.l}</span>
            <button onClick={e=>{e.stopPropagation();setEx(p=>({...p,[item.id]:!p[item.id]}))}} style={{background:"none",border:"1px solid #e2e8f0",borderRadius:4,padding:"2px 8px",fontSize:11,color:"#64748b",cursor:"pointer",flexShrink:0}}>{exO?"ocultar":"ver ejemplo"}</button>
          </div>
          {exO&&<div style={{background:"#f0fdf4",padding:"8px 14px 8px 52px",borderRadius:"0 0 8px 8px",border:"1px solid #e2e8f0",borderTop:"none",fontSize:12,color:"#16a34a",fontStyle:"italic"}}>{"\ud83d\udca1"} {item.ej}</div>}
        </div>)})}</div>)}</div>)};

  const steps=["Paciente"];
  if(evalRec)steps.push("Receptivo");
  if(evalExp)steps.push("Expresivo");
  steps.push("Resultado");

  const getStepContent=()=>{
    const label=steps[step-1];
    if(label==="Paciente")return"patient";
    if(label==="Receptivo")return"rec";
    if(label==="Expresivo")return"exp";
    if(label==="Resultado")return"result";
    return"patient";
  };
  const content=getStepContent();

  return(<div style={{width:"100%",maxWidth:800,animation:"fi .3s ease"}}>
    <div style={{display:"flex",gap:4,marginBottom:22}}>{steps.map((s,i)=><div key={i} style={{flex:1,textAlign:"center"}}><div style={{height:4,borderRadius:2,marginBottom:5,background:step>i+1?"#0d9488":step===i+1?"#b2dfdb":"#e2e8f0"}}/><span style={{fontSize:11,color:step===i+1?"#0d9488":"#64748b",fontWeight:step===i+1?600:400}}>{s}</span></div>)}</div>
    <div style={{background:"#fff",borderRadius:12,padding:28,border:"1px solid #e2e8f0"}}>

      {content==="patient"&&<div><h2 style={{fontSize:18,fontWeight:700,marginBottom:4}}>{"\ud83d\udccb ELDI \u2014 Datos del Paciente"}</h2><p style={{color:K.mt,fontSize:13,marginBottom:20}}>{"Evaluaci\u00f3n del Lenguaje y Desarrollo Infantil"}</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div style={{gridColumn:"1/-1"}}><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Nombre completo</label><input value={pd.pN} onChange={e=>sPd(p=>({...p,pN:e.target.value}))} style={I} placeholder="Nombre y apellido"/></div>
          <div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Fecha nacimiento</label><input type="date" value={pd.birth} onChange={e=>sPd(p=>({...p,birth:e.target.value}))} style={I}/></div>
          <div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>{"Fecha evaluaci\u00f3n"}</label><input type="date" value={pd.eD} onChange={e=>sPd(p=>({...p,eD:e.target.value}))} style={I}/></div>
          <div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Establecimiento</label><input value={pd.sch} onChange={e=>sPd(p=>({...p,sch:e.target.value}))} style={I} placeholder={"Jard\u00edn / Colegio"}/></div>
          <div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Derivado por</label><input value={pd.ref} onChange={e=>sPd(p=>({...p,ref:e.target.value}))} style={I} placeholder="Profesional"/></div>
        </div>
        {a>0&&<div style={{marginTop:14,padding:"10px 16px",background:"#ccfbf1",borderRadius:8,fontSize:14}}><strong>Edad:</strong> {fa(a)} ({a} meses)</div>}
        <div style={{marginTop:20,padding:16,background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:10}}>
          <div style={{fontSize:13,fontWeight:700,color:"#0369a1",marginBottom:10}}>{"\u00bfQu\u00e9 \u00e1reas evaluar?"}</div>
          <div style={{display:"flex",gap:20}}>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:14}}><input type="checkbox" checked={evalRec} onChange={e=>setEvalRec(e.target.checked)} style={{width:18,height:18,accentColor:"#0d9488"}}/>{"\ud83d\udd0a Comprensi\u00f3n Auditiva (Receptivo)"}</label>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:14}}><input type="checkbox" checked={evalExp} onChange={e=>setEvalExp(e.target.checked)} style={{width:18,height:18,accentColor:"#0d9488"}}/>{"\ud83d\udde3\ufe0f Comunicaci\u00f3n Expresiva"}</label>
          </div>
          {!evalRec&&!evalExp&&<div style={{marginTop:8,color:"#dc2626",fontSize:12,fontWeight:600}}>{"\u26a0 Debe seleccionar al menos un \u00e1rea"}</div>}
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:20}}><Bt pr onClick={()=>{if(!pd.pN||!pd.birth){nfy("Complete nombre y fecha","er");return}if(!evalRec&&!evalExp){nfy("Seleccione al menos un \u00e1rea","er");return}setDirty(true);sS(2)}}>{"Siguiente \u2192"}</Bt></div>
      </div>}

      {content==="rec"&&<div>{RI(REC,"AC")}<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14,paddingTop:14,borderTop:"1px solid #e2e8f0"}}><span style={{fontSize:13,color:K.mt}}>{"Logrados: "}<b style={{color:"#0d9488"}}>{rR.logrado}</b>{"/55 \u00b7 Sin evaluar: "}<b style={{color:"#f59e0b"}}>{rR.noEvaluado.length}</b></span><div style={{display:"flex",gap:8}}><Bt onClick={()=>sS(step-1)}>{"\u2190 Atr\u00e1s"}</Bt><Bt pr onClick={()=>sS(step+1)}>{"Siguiente \u2192"}</Bt></div></div></div>}

      {content==="exp"&&<div>{RI(EXP,"EC")}<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14,paddingTop:14,borderTop:"1px solid #e2e8f0"}}><span style={{fontSize:13,color:K.mt}}>{"Logrados: "}<b style={{color:"#0d9488"}}>{rE.logrado}</b>{"/55 \u00b7 Sin evaluar: "}<b style={{color:"#f59e0b"}}>{rE.noEvaluado.length}</b></span><div style={{display:"flex",gap:8}}><Bt onClick={()=>sS(step-1)}>{"\u2190 Atr\u00e1s"}</Bt><Bt pr onClick={()=>sS(step+1)}>{"Resultados \u2192"}</Bt></div></div></div>}

      {content==="result"&&(()=>{
        const buildArea=(items,label,evaluated)=>{
          if(!evaluated)return{label,evaluated:false,logrado:0,noLogrado:0,noEvaluado:items.map(i=>i.id),total:items.length,evaluados:0,pctLogrado:null};
          const c=countItems(items);
          return{label,evaluated:true,...c,pctLogrado:c.evaluados>0?Math.round(c.logrado/c.evaluados*100):null};
        };
        const recRes=buildArea(REC,"Comprensi\u00f3n Auditiva",evalRec);
        const expRes=buildArea(EXP,"Comunicaci\u00f3n Expresiva",evalExp);
        const allNoEval=[...(evalRec?rR.noEvaluado:[]),...(evalExp?rE.noEvaluado:[])];

        return<div>
          <h2 style={{fontSize:20,fontWeight:700,marginBottom:8}}>{"Resultados ELDI \u2014 "}{pd.pN}</h2>
          <p style={{fontSize:12,color:K.mt,marginBottom:20}}>{"Edad: "}{fa(a)}{" \u00b7 Evaluaci\u00f3n: "}{pd.eD}</p>
          <div style={{background:"#fef3c7",border:"1px solid #fde68a",borderRadius:10,padding:16,marginBottom:20}}>
            <div style={{fontSize:13,fontWeight:700,color:"#92400e",marginBottom:6}}>{"\u26a0 Nota sobre interpretaci\u00f3n"}</div>
            <div style={{fontSize:12,color:"#78350f",lineHeight:1.6}}>{"Este instrumento no cuenta con baremo normativo publicado oficialmente. Los puntajes que se muestran son "}<strong>puntajes brutos</strong>{" (conteo directo de \u00edtems logrados). No se calculan puntajes est\u00e1ndar, percentiles ni clasificaciones cl\u00ednicas derivadas. La interpretaci\u00f3n cl\u00ednica debe realizarla el/la profesional evaluador/a."}</div>
          </div>

          {[recRes,expRes].map((area,i)=>{
            if(!area.evaluated)return<div key={i} style={{background:"#f1f5f9",borderRadius:10,padding:20,border:"1px solid #e2e8f0",marginBottom:14}}>
              <div style={{fontWeight:700,fontSize:15,marginBottom:8}}>{i===0?"\ud83d\udd0a":"\ud83d\udde3\ufe0f"} {area.label}</div>
              <div style={{fontSize:14,color:"#64748b",fontStyle:"italic"}}>{"No evaluado en esta sesi\u00f3n"}</div>
            </div>;
            return<div key={i} style={{background:"#f8faf9",borderRadius:10,padding:20,border:"1px solid #e2e8f0",marginBottom:14}}>
              <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>{i===0?"\ud83d\udd0a":"\ud83d\udde3\ufe0f"} {area.label}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                <div><div style={{fontSize:10,color:K.mt,marginBottom:2}}>{"\u00cdtems logrados"}</div><div style={{fontSize:24,fontWeight:700,color:"#059669"}}>{area.logrado}<span style={{fontSize:14,color:K.mt}}>/{area.total}</span></div></div>
                <div><div style={{fontSize:10,color:K.mt,marginBottom:2}}>{"\u00cdtems no logrados"}</div><div style={{fontSize:24,fontWeight:700,color:"#dc2626"}}>{area.noLogrado}</div></div>
                <div><div style={{fontSize:10,color:K.mt,marginBottom:2}}>Sin evaluar</div><div style={{fontSize:24,fontWeight:700,color:"#f59e0b"}}>{area.noEvaluado.length}</div></div>
              </div>
              {area.evaluados>0&&<div style={{marginTop:12}}>
                <div style={{fontSize:10,color:K.mt,marginBottom:4}}>{"Porcentaje de logro (sobre \u00edtems evaluados)"}</div>
                <div style={{background:"#e2e8f0",borderRadius:6,height:24,overflow:"hidden",position:"relative"}}>
                  <div style={{background:area.pctLogrado>=80?"#059669":area.pctLogrado>=50?"#f59e0b":"#dc2626",height:"100%",width:`${area.pctLogrado}%`,borderRadius:6,transition:"width .5s"}}/>
                  <span style={{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",fontSize:12,fontWeight:700,color:"#1e293b"}}>{area.pctLogrado}%</span>
                </div>
              </div>}
              {area.noEvaluado.length>0&&<div style={{marginTop:12,padding:10,background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8}}>
                <div style={{fontSize:11,fontWeight:600,color:"#92400e",marginBottom:4}}>{"\u00cdtems no evaluados:"}</div>
                <div style={{fontSize:11,color:"#78350f",wordBreak:"break-all"}}>{area.noEvaluado.join(", ")}</div>
              </div>}
            </div>
          })}

          <div style={{background:"linear-gradient(135deg,#0a3d2f,#0d9488)",borderRadius:10,padding:24,color:"#fff",marginBottom:24}}>
            <div style={{fontSize:13,opacity:.8,marginBottom:8}}>Resumen de puntajes brutos</div>
            <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
              {evalRec&&<div><span style={{fontSize:36,fontWeight:700}}>{rR.logrado}</span><span style={{fontSize:14,opacity:.7}}>/{rR.evaluados} Receptivo</span></div>}
              {evalExp&&<div><span style={{fontSize:36,fontWeight:700}}>{rE.logrado}</span><span style={{fontSize:14,opacity:.7}}>/{rE.evaluados} Expresivo</span></div>}
            </div>
            {allNoEval.length>0&&<div style={{marginTop:12,padding:"8px 12px",background:"rgba(255,255,255,.12)",borderRadius:8,fontSize:12}}>{"\u26a0 "}{allNoEval.length}{" \u00edtems sin evaluar \u2014 resultados parciales"}</div>}
          </div>

          <div style={{marginBottom:20}}><label style={{fontSize:13,fontWeight:600,color:K.mt,display:"block",marginBottom:6}}>{"Observaciones cl\u00ednicas"}</label><textarea value={pd.obs} onChange={e=>sPd(p=>({...p,obs:e.target.value}))} rows={4} style={{width:"100%",padding:"12px 14px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,resize:"vertical",background:"#f8faf9"}} placeholder={"Interpretaci\u00f3n profesional..."}/></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><Bt onClick={()=>sS(step-1)}>{"\u2190 Atr\u00e1s"}</Bt><button onClick={()=>{setDirty(false);onS({...pd,a,rsp,evalRec,evalExp,rR:rR.logrado,rE:rE.logrado,recRes,expRes,allNoEval})}} style={{background:"#0d9488",color:"#fff",border:"none",padding:"12px 28px",borderRadius:8,fontSize:15,fontWeight:700,cursor:"pointer"}}>{"\ud83d\udcbe Guardar"}</button></div>
        </div>})()}
    </div>
  </div>);
}
