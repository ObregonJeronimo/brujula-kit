import { useState, useEffect, useRef } from "react";
import { REC, EXP } from "../data/eldiItems.js";
import { ELDI_IMAGES } from "../data/eldiImages.js";

const K = { mt: "#64748b" };
const gm=(b,e)=>{const B=new Date(b),E=new Date(e);let m=(E.getFullYear()-B.getFullYear())*12+E.getMonth()-B.getMonth();if(E.getDate()<B.getDate())m--;return Math.max(0,m)};
const fa=m=>`${Math.floor(m/12)} a\u00f1os, ${m%12} meses`;

const scrollTop=()=>{
  const el=document.getElementById("main-scroll");
  if(el)el.scrollTo({top:0,behavior:"smooth"});
  else window.scrollTo({top:0,behavior:"smooth"});
};

const BANDS=[
  {min:0,max:5,label:"0;0\u20130;5"},{min:6,max:11,label:"0;6\u20130;11"},
  {min:12,max:17,label:"1;0\u20131;5"},{min:18,max:23,label:"1;6\u20131;11"},
  {min:24,max:29,label:"2;0\u20132;5"},{min:30,max:35,label:"2;6\u20132;11"},
  {min:36,max:41,label:"3;0\u20133;5"},{min:42,max:47,label:"3;6\u20133;11"},
  {min:48,max:59,label:"4;0\u20134;11"},{min:60,max:71,label:"5;0\u20135;11"},
  {min:72,max:95,label:"6;0\u20137;11"}
];
function getBandIndex(ageMo){for(let i=BANDS.length-1;i>=0;i--){if(ageMo>=BANDS[i].min)return i;}return 0;}

function calcScoring(items, rsp, ageMo){
  const bandIdx=getBandIndex(ageMo);
  const expectedCount=(bandIdx+1)*5;
  const expectedItems=items.slice(0,expectedCount);
  let logrado=0,noLogrado=0,noEvaluado=[];
  items.forEach(i=>{const v=rsp[i.id];if(v===true)logrado++;else if(v===false)noLogrado++;else noEvaluado.push(i.id);});
  let logradoExpected=0;
  expectedItems.forEach(i=>{if(rsp[i.id]===true)logradoExpected++;});
  let devAgeBandIdx=-1;
  for(let b=0;b<BANDS.length;b++){
    const bandItems=items.slice(b*5,b*5+5);
    const passed=bandItems.filter(i=>rsp[i.id]===true).length;
    if(passed>=4)devAgeBandIdx=b;else break;
  }
  const devAgeLabel=devAgeBandIdx>=0?BANDS[devAgeBandIdx].label:null;
  const pctExpected=expectedCount>0?Math.round(logradoExpected/expectedCount*100):null;
  let classification=null,classColor=null;
  if(pctExpected!==null){
    if(pctExpected>=90){classification="Dentro de L\u00edmites Normales";classColor="#059669";}
    else if(pctExpected>=75){classification="En Riesgo / Retraso Leve";classColor="#f59e0b";}
    else if(pctExpected>=50){classification="Retraso Moderado";classColor="#ea580c";}
    else{classification="Retraso Significativo";classColor="#dc2626";}
  }
  return{logrado,noLogrado,noEvaluado,total:items.length,evaluados:logrado+noLogrado,
    pctLogrado:(logrado+noLogrado)>0?Math.round(logrado/(logrado+noLogrado)*100):null,
    expectedCount,logradoExpected,pctExpected,devAgeBandIdx,devAgeLabel,
    classification,classColor};
}

function SequenceGame(){
  const imgs=[
    {id:1,label:"Corre hacia la pelota",emoji:"\ud83c\udfc3\u200d\u2642\ufe0f\u27a1\ufe0f\u26bd"},
    {id:2,label:"Patea la pelota",emoji:"\ud83e\uddb5\u26bd"},
    {id:3,label:"La pelota vuela",emoji:"\u26bd\ud83d\udca8"}
  ];
  const[order,setOrder]=useState([3,1,2]);
  const[dragging,setDragging]=useState(null);
  const correct=order[0]===1&&order[1]===2&&order[2]===3;
  const swap=(from,to)=>{const n=[...order];const t=n[from];n[from]=n[to];n[to]=t;setOrder(n);};
  return<div style={{padding:16,background:"#f8faf9",borderRadius:10,border:"1px solid #e2e8f0"}}>
    <div style={{fontSize:13,fontWeight:600,color:"#0a3d2f",marginBottom:10}}>{"Orden\u00e1 las im\u00e1genes en secuencia correcta:"}</div>
    <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
      {order.map((imgId,idx)=>{const img=imgs.find(i=>i.id===imgId);
        return<div key={idx} draggable onDragStart={()=>setDragging(idx)} onDragOver={e=>e.preventDefault()}
          onDrop={()=>{if(dragging!==null){swap(dragging,idx);setDragging(null)}}}
          style={{width:120,padding:12,background:"#fff",border:`2px solid ${correct?"#059669":"#e2e8f0"}`,borderRadius:10,textAlign:"center",cursor:"grab",userSelect:"none"}}>
          <div style={{fontSize:32}}>{img.emoji}</div>
          <div style={{fontSize:11,color:"#475569",marginTop:4}}>{img.label}</div>
          <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{"Paso "}{idx+1}</div>
        </div>})}
    </div>
    {correct&&<div style={{marginTop:10,textAlign:"center",color:"#059669",fontWeight:700,fontSize:13}}>{"Orden correcto!"}</div>}
    {!correct&&<div style={{marginTop:8,textAlign:"center",fontSize:11,color:"#94a3b8"}}>{"Arrastr\u00e1 y solt\u00e1 para reordenar"}</div>}
  </div>;
}

function ShapesGame(){
  const shapes=[
    {id:"circle",filled:"\ud83d\udd34",empty:"\u2b55",label:"C\u00edrculo"},
    {id:"square",filled:"\ud83d\udfe6",empty:"\u2b1c",label:"Cuadrado"},
    {id:"triangle",filled:"\ud83d\udd3a",empty:"\u25b3",label:"Tri\u00e1ngulo"}
  ];
  const[matched,setMatched]=useState({});
  const[draggingShape,setDraggingShape]=useState(null);
  const allDone=Object.keys(matched).length===3&&Object.entries(matched).every(([k,v])=>k===v);
  return<div style={{padding:16,background:"#f8faf9",borderRadius:10,border:"1px solid #e2e8f0"}}>
    <div style={{fontSize:13,fontWeight:600,color:"#0a3d2f",marginBottom:10}}>{"Arrastr\u00e1 cada forma a su lugar:"}</div>
    <div style={{display:"flex",gap:24,justifyContent:"center",flexWrap:"wrap"}}>
      <div>
        <div style={{fontSize:11,color:"#94a3b8",marginBottom:6,textAlign:"center"}}>{"Formas"}</div>
        {shapes.filter(s=>!Object.values(matched).includes(s.id)).map(s=>
          <div key={s.id} draggable onDragStart={()=>setDraggingShape(s.id)}
            style={{padding:"8px 16px",margin:4,background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,cursor:"grab",textAlign:"center",fontSize:24,userSelect:"none"}}>
            {s.filled} <span style={{fontSize:11}}>{s.label}</span>
          </div>)}
      </div>
      <div>
        <div style={{fontSize:11,color:"#94a3b8",marginBottom:6,textAlign:"center"}}>{"Espacios"}</div>
        {shapes.map(s=>
          <div key={s.id} onDragOver={e=>e.preventDefault()}
            onDrop={()=>{if(draggingShape){setMatched(p=>({...p,[s.id]:draggingShape}));setDraggingShape(null)}}}
            style={{padding:"8px 16px",margin:4,background:matched[s.id]===s.id?"#ecfdf5":matched[s.id]?"#fef2f2":"#f1f5f9",border:`2px dashed ${matched[s.id]===s.id?"#059669":matched[s.id]?"#dc2626":"#cbd5e1"}`,borderRadius:8,textAlign:"center",fontSize:24,minWidth:100}}>
            {matched[s.id]?shapes.find(x=>x.id===matched[s.id]).filled:s.empty}
            <span style={{fontSize:11,display:"block",color:"#94a3b8"}}>{s.label}</span>
          </div>)}
      </div>
    </div>
    {allDone&&<div style={{marginTop:10,textAlign:"center",color:"#059669",fontWeight:700,fontSize:13}}>{"Todas en su lugar!"}</div>}
    {Object.keys(matched).length>0&&!allDone&&<button onClick={()=>setMatched({})} style={{display:"block",margin:"8px auto 0",background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:6,padding:"4px 12px",fontSize:11,cursor:"pointer"}}>{"Reiniciar"}</button>}
  </div>;
}

export default function NewELDI({onS,nfy,deductCredit,isAdmin}){
  const[step,sS]=useState(1);
  const[pd,sPd]=useState({pN:"",birth:"",eD:new Date().toISOString().split("T")[0],sch:"",ref:"",obs:""});
  const[rsp,sR]=useState({});
  const[showEx,setEx]=useState({});
  const[showImg,setImg]=useState({});
  const[showStory,setStory]=useState({});
  const[evalRec,setEvalRec]=useState(true);
  const[evalExp,setEvalExp]=useState(true);
  const[dirty,setDirty]=useState(false);
  const creditDeducted=useRef(false);

  useEffect(()=>{scrollTop()},[step]);

  useEffect(()=>{
    if(!dirty)return;
    const handler=e=>{e.preventDefault();e.returnValue="";};
    window.addEventListener("beforeunload",handler);
    return()=>window.removeEventListener("beforeunload",handler);
  },[dirty]);

  const a=pd.birth&&pd.eD?gm(pd.birth,pd.eD):0;
  const tog=id=>{setDirty(true);sR(p=>{const v=p[id];if(v===undefined)return{...p,[id]:true};if(v===true)return{...p,[id]:false};const n={...p};delete n[id];return n})};

  const markSection=(groupItems,value)=>{
    setDirty(true);
    sR(p=>{
      const n={...p};
      groupItems.forEach(item=>{
        if(value==="clear") delete n[item.id];
        else n[item.id]=value;
      });
      return n;
    });
  };

  const rR=evalRec?calcScoring(REC,rsp,a):
    {logrado:0,noLogrado:0,noEvaluado:REC.map(i=>i.id),total:55,evaluados:0,pctLogrado:null};
  const rE=evalExp?calcScoring(EXP,rsp,a):
    {logrado:0,noLogrado:0,noEvaluado:EXP.map(i=>i.id),total:55,evaluados:0,pctLogrado:null};

  const I={width:"100%",padding:"10px 14px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,background:"#f8faf9"};
  const Bt=({children,onClick,pr})=><button onClick={onClick} style={{background:pr?"#0d9488":"#f1f5f9",color:pr?"#fff":"#1e293b",border:"none",padding:"10px 22px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{children}</button>;

  const RI=(items,prefix)=>{
    const gr={};items.forEach(i=>{if(!gr[i.a])gr[i.a]=[];gr[i.a].push(i)});
    return(<div>
      <h2 style={{fontSize:18,fontWeight:700,marginBottom:4}}>{prefix==="AC"?"\ud83d\udd0a Comprensi\u00f3n Auditiva":"\ud83d\udde3\ufe0f Comunicaci\u00f3n Expresiva"}</h2>
      <p style={{color:K.mt,fontSize:13,marginBottom:16}}>{"1 click = \u2714 Logrado \u00b7 2 clicks = \u2718 No logrado \u00b7 3 clicks = Sin evaluar"}</p>
      {Object.entries(gr).map(([range,gi])=>{
        const allOk=gi.every(i=>rsp[i.id]===true);
        const allNo=gi.every(i=>rsp[i.id]===false);
        const allClear=gi.every(i=>rsp[i.id]===undefined);
        return<div key={range} style={{marginBottom:18}}>
          <div style={{background:"#ccfbf1",padding:"6px 12px",borderRadius:6,fontSize:12,fontWeight:600,color:"#0d9488",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:6}}>
            <span>{"Edad: "}{range}</span>
            <div style={{display:"flex",gap:4}}>
              <button onClick={()=>markSection(gi,true)} title="Marcar todas como Logrado"
                style={{background:allOk?"#059669":"#fff",color:allOk?"#fff":"#059669",border:"1px solid #059669",borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                {"\u2713 Todas"}
              </button>
              <button onClick={()=>markSection(gi,false)} title="Marcar todas como No logrado"
                style={{background:allNo?"#dc2626":"#fff",color:allNo?"#fff":"#dc2626",border:"1px solid #dc2626",borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                {"\u2717 Todas"}
              </button>
              <button onClick={()=>markSection(gi,"clear")} title="Limpiar secci\u00f3n"
                style={{background:allClear?"#94a3b8":"#fff",color:allClear?"#fff":"#94a3b8",border:"1px solid #94a3b8",borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                {"\u25cb Limpiar"}
              </button>
            </div>
          </div>
          {gi.map(item=>{
            const v=rsp[item.id];
            const exO=showEx[item.id];
            const imgO=showImg[item.id];
            const hasImg=!!item.img;
            const hasGame=!!item.game;
            const hasStoryBtn=!!item.story;
            return(<div key={item.id} style={{marginBottom:3}}>
              <div onClick={()=>tog(item.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:(exO||imgO)?"8px 8px 0 0":8,cursor:"pointer",background:v===true?"#ecfdf5":v===false?"#fef2f2":"#fff",border:`1px solid ${v===true?"#a7f3d0":v===false?"#fecaca":"#e2e8f0"}`,borderBottom:(exO||imgO)?"none":undefined}}>
                <div style={{width:28,height:28,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",background:v===true?"#059669":v===false?"#dc2626":"#e2e8f0",color:"#fff",fontSize:13,fontWeight:700,flexShrink:0}}>{v===true?"\u2713":v===false?"\u2717":"\u2014"}</div>
                <span style={{fontWeight:600,fontSize:12,color:"#64748b",minWidth:36}}>{item.id}</span>
                <span style={{fontSize:13,flex:1}}>{item.l}</span>
                <div style={{display:"flex",gap:4,flexShrink:0}}>
                  {(hasImg||hasGame)&&<button onClick={e=>{e.stopPropagation();setImg(p=>({...p,[item.id]:!p[item.id]}));if(showEx[item.id])setEx(p=>({...p,[item.id]:false}))}}
                    style={{background:imgO?"#0d9488":"#f0fdf4",color:imgO?"#fff":"#0d9488",border:"1px solid #0d9488",borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer",transition:"all .15s"}}>
                    {imgO?"Ocultar":"Ver imagen"}</button>}
                  <button onClick={e=>{e.stopPropagation();setEx(p=>({...p,[item.id]:!p[item.id]}));if(showImg[item.id])setImg(p=>({...p,[item.id]:false}))}}
                    style={{background:"none",border:"1px solid #e2e8f0",borderRadius:6,padding:"4px 10px",fontSize:11,color:"#64748b",cursor:"pointer"}}>
                    {exO?"Ocultar":"Ejemplo"}</button>
                </div>
              </div>
              {exO&&<div style={{background:"#f0fdf4",padding:"8px 14px 8px 52px",borderRadius:imgO?"0":"0 0 8px 8px",border:"1px solid #e2e8f0",borderTop:"none",fontSize:12,color:"#16a34a",fontStyle:"italic"}}>
                {item.ej}
                {hasStoryBtn&&<div style={{marginTop:8}}>
                  <button onClick={()=>setStory(p=>({...p,[item.id]:!p[item.id]}))}
                    style={{background:"#0a3d2f",color:"#fff",border:"none",borderRadius:6,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                    {showStory[item.id]?"Ocultar historia":"Ver historia"}</button>
                  {showStory[item.id]&&<div style={{marginTop:8,padding:12,background:"#fff",border:"1px solid #d1fae5",borderRadius:8,fontStyle:"normal",color:"#1e293b",lineHeight:1.6}}>
                    {item.story}
                  </div>}
                </div>}
              </div>}
              {imgO&&<div style={{background:"#f8faf9",padding:12,borderRadius:"0 0 8px 8px",border:"1px solid #e2e8f0",borderTop:"none",textAlign:"center"}}>
                {item.game==="sequence"?<SequenceGame/>:
                 item.game==="shapes"?<ShapesGame/>:
                 item.img&&ELDI_IMAGES[item.img]?
                  <div dangerouslySetInnerHTML={{__html:ELDI_IMAGES[item.img]}} style={{maxWidth:300,margin:"0 auto"}}/>:
                  <div style={{color:"#94a3b8",fontSize:12,fontStyle:"italic"}}>{"Imagen no disponible"}</div>}
              </div>}
            </div>)})}
        </div>})}
    </div>)};

  const steps=["Paciente"];
  if(evalRec)steps.push("Receptivo");
  if(evalExp)steps.push("Expresivo");
  steps.push("Resultado");
  const getStepContent=()=>{const label=steps[step-1];if(label==="Paciente")return"patient";if(label==="Receptivo")return"rec";if(label==="Expresivo")return"exp";return"result";};
  const content=getStepContent();

  /* Deduct credit when reaching results */
  useEffect(()=>{
    if(content==="result"&&!creditDeducted.current&&deductCredit&&!isAdmin){
      creditDeducted.current=true;
      deductCredit();
    }
  },[content]);

  const renderNoEval=(noEvalIds,items)=>{
    if(noEvalIds.length===0)return null;
    const groups={};
    noEvalIds.forEach(id=>{const item=items.find(i=>i.id===id);if(item){if(!groups[item.a])groups[item.a]=[];groups[item.a].push(item);}});
    return<div style={{marginTop:12,padding:12,background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8}}>
      <div style={{fontSize:12,fontWeight:600,color:"#92400e",marginBottom:8}}>{"Items no evaluados:"}</div>
      {Object.entries(groups).map(([band,gItems])=><div key={band} style={{marginBottom:6}}>
        <div style={{fontSize:11,fontWeight:600,color:"#78350f",marginBottom:2}}>{"Edad "}{band}{":"}</div>
        {gItems.map(it=><div key={it.id} style={{fontSize:11,color:"#78350f",paddingLeft:8,lineHeight:1.6}}>{"\u2022 "}{it.l}{" ("}{it.id}{")"}</div>)}
      </div>)}
    </div>;
  };

  const renderClassification=(scoring,label)=>{
    if(!scoring||scoring.pctExpected===null||scoring.evaluados===0)return null;
    return<div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:18,marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:14,color:"#0a3d2f",marginBottom:12}}>{"An\u00e1lisis Criterial \u2014 "}{label}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div style={{background:"#f0f9ff",padding:12,borderRadius:8}}>
          <div style={{fontSize:10,color:K.mt,marginBottom:4}}>{"Rendimiento seg\u00fan edad"}</div>
          <div style={{fontSize:22,fontWeight:700,color:scoring.classColor}}>{scoring.pctExpected}{"%"}</div>
          <div style={{fontSize:11,color:K.mt}}>{"("}{scoring.logradoExpected}{"/"}{scoring.expectedCount}{" \u00edtems esperados logrados)"}</div>
        </div>
        <div style={{background:"#f0f9ff",padding:12,borderRadius:8}}>
          <div style={{fontSize:10,color:K.mt,marginBottom:4}}>{"Clasificaci\u00f3n"}</div>
          <div style={{fontSize:16,fontWeight:700,color:scoring.classColor}}>{scoring.classification}</div>
        </div>
        {scoring.devAgeLabel&&<div style={{background:"#f0f9ff",padding:12,borderRadius:8,gridColumn:"1/-1"}}>
          <div style={{fontSize:10,color:K.mt,marginBottom:4}}>{"Edad de desarrollo estimada"}</div>
          <div style={{fontSize:18,fontWeight:700,color:"#0d9488"}}>{scoring.devAgeLabel}</div>
          <div style={{fontSize:11,color:K.mt}}>{"(banda m\u00e1xima con \u226580% de \u00edtems logrados)"}</div>
        </div>}
      </div>
    </div>;
  };

  return(<div style={{width:"100%",maxWidth:800,animation:"fi .3s ease"}}>
    <div style={{display:"flex",gap:4,marginBottom:22}}>{steps.map((s,i)=>