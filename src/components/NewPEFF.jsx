import { useState } from "react";
import { PEFF_SECTIONS } from "../data/peffSections.js";
import { PF_CATEGORIES, ALL_PROCESSES } from "../data/peffProcesos.js";
const K={mt:"#64748b"};
const gm=(b,e)=>{const B=new Date(b),E=new Date(e);let m=(E.getFullYear()-B.getFullYear())*12+E.getMonth()-B.getMonth();if(E.getDate()<B.getDate())m--;return Math.max(0,m)};
const fa=m=>`${Math.floor(m/12)} años, ${m%12} meses`;

/* Severity description helper */
const sevDesc={
  "Adecuado":"El niño/a produce correctamente todos o casi todos los fonemas esperados para su edad. No se observan dificultades articulatorias significativas.",
  "Leve":"Se observan errores articulatorios aislados que no comprometen significativamente la inteligibilidad del habla. Puede requerir seguimiento.",
  "Moderado":"Se observan múltiples errores articulatorios que afectan parcialmente la inteligibilidad. Se recomienda intervención fonoaudiológica.",
  "Moderado-Severo":"Se observan errores articulatorios frecuentes que comprometen la inteligibilidad del habla en contextos comunicativos. Se requiere intervención fonoaudiológica.",
  "Severo":"Se observan errores articulatorios generalizados que comprometen severamente la inteligibilidad. Se requiere intervención fonoaudiológica intensiva."
};
const sevColor={"Adecuado":"#059669","Leve":"#f59e0b","Moderado":"#ea580c","Moderado-Severo":"#dc2626","Severo":"#dc2626"};

export default function NewPEFF({onS,nfy}){
  const[step,sS2]=useState(0),[pd,sPd]=useState({pN:"",birth:"",eD:new Date().toISOString().split("T")[0],sch:"",ref:"",obs:""}),[data,setD]=useState({}),[procData,setProcData]=useState({});
  const a=pd.birth&&pd.eD?gm(pd.birth,pd.eD):0;
  const I={width:"100%",padding:"10px 14px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,background:"#f8faf9"};
  const sf=(id,v)=>setD(p=>({...p,[id]:v}));
  const spf=(itemId,field,v)=>setProcData(p=>({...p,[itemId]:{...(p[itemId]||{}), [field]:v}}));

  /* OFA: render options as visible cards instead of dropdowns */
  const rField=f=>{
    if(f.type==="text") return <div key={f.id} style={{marginBottom:14}}>
      <label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>{f.label}</label>
      <input value={data[f.id]||""} onChange={e=>sf(f.id,e.target.value)} style={I}/>
    </div>;
    /* Select → visible option cards */
    const cur=data[f.id]||"";
    return <div key={f.id} style={{marginBottom:14}}>
      <label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:6}}>{f.label}</label>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {f.options.map(o=><button key={o} onClick={()=>sf(f.id,cur===o?"":o)}
          style={{padding:"8px 14px",borderRadius:8,border:cur===o?"2px solid #7c3aed":"1px solid #e2e8f0",
            background:cur===o?"#ede9fe":"#fff",color:cur===o?"#5b21b6":"#475569",
            fontSize:13,fontWeight:cur===o?700:400,cursor:"pointer",transition:"all .15s"}}>
          {cur===o&&"✓ "}{o}
        </button>)}
      </div>
    </div>;
  };

  /* Leyenda as a column item for sticky sidebar */
  const legendItems=[
    {v:"✓",bg:"#059669",t:"Correcto",d:"Producción adecuada del fonema"},
    {v:"D",bg:"#f59e0b",t:"Distorsión",d:"Sonido alterado pero reconocible"},
    {v:"O",bg:"#dc2626",t:"Omisión",d:"No produce el fonema"},
    {v:"S",bg:"#7c3aed",t:"Sustitución",d:"Reemplaza por otro fonema"}
  ];

  const legendBox=<div style={{background:"#ede9fe",border:"1px solid #c4b5fd",borderRadius:10,padding:14}}>
    <div style={{fontSize:12,fontWeight:700,color:"#5b21b6",marginBottom:8}}>Leyenda de opciones</div>
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {legendItems.map(o=><div key={o.v} style={{display:"flex",alignItems:"center",gap:6}}>
        <div style={{width:24,height:24,borderRadius:6,background:o.bg,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0}}>{o.v}</div>
        <span style={{fontSize:12}}><b>{o.t}</b> — {o.d}</span>
      </div>)}
    </div>
    <div style={{marginTop:10,fontSize:11,color:"#7c3aed",fontStyle:"italic"}}>
      {"ℹ️ Si no se selecciona ninguna opción, el ítem se considera no evaluado."}
    </div>
  </div>;

  const rPhon=item=>{const v=data[item.id]||"";const isError=v==="D"||v==="O"||v==="S";const pd2=procData[item.id]||{};
    return<div key={item.id} style={{marginBottom:isError?12:4}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",background:isError?"#fef2f2":v==="ok"?"#f0fdf4":"#fff",borderRadius:isError?"8px 8px 0 0":8,border:`1px solid ${isError?"#fecaca":v==="ok"?"#bbf7d0":"#e2e8f0"}`}}>
        <span style={{fontWeight:700,fontSize:16,minWidth:50,color:"#7c3aed"}}>{item.word}</span>
        <span style={{fontSize:12,color:K.mt,flex:1}}>{item.target}</span>
        <div style={{display:"flex",gap:4}}>
          {[{v:"ok",l:"✓",bg:"#059669"},{v:"D",l:"D",bg:"#f59e0b"},{v:"O",l:"O",bg:"#dc2626"},{v:"S",l:"S",bg:"#7c3aed"}].map(o=>
            <button key={o.v} onClick={()=>{sf(item.id,v===o.v?"":o.v);if(o.v==="ok")setProcData(p=>{const n={...p};delete n[item.id];return n})}}
              style={{width:30,height:30,borderRadius:6,border:v===o.v?`2px solid ${o.bg}`:"1px solid #e2e8f0",background:v===o.v?o.bg:"#fff",color:v===o.v?"#fff":"#64748b",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{o.l}</button>)}
        </div>
      </div>
      {isError&&<div style={{background:"#fff5f5",border:"1px solid #fecaca",borderTop:"none",borderRadius:"0 0 8px 8px",padding:"10px 14px"}}>
        <div style={{display:"flex",gap:8,marginBottom:6,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:180}}>
            <label style={{fontSize:10,fontWeight:700,color:"#dc2626",display:"block",marginBottom:3}}>Producción del niño</label>
            <input value={pd2.produccion||""} onChange={e=>spf(item.id,"produccion",e.target.value)} style={{...I,fontSize:13,padding:"6px 10px",background:"#fff"}} placeholder={`¿Qué dijo en vez de "${item.word}"?`}/>
          </div>
          <div style={{flex:2,minWidth:220}}>
            <label style={{fontSize:10,fontWeight:700,color:"#dc2626",display:"block",marginBottom:3}}>Proceso fonológico</label>
            <select value={pd2.proceso||""} onChange={e=>spf(item.id,"proceso",e.target.value)} style={{...I,fontSize:13,padding:"6px 10px",background:"#fff",cursor:"pointer"}}>
              <option value="">-- Clasificar proceso --</option>
              {PF_CATEGORIES.map(cat=><optgroup key={cat.id} label={cat.title}>{cat.processes.map(pr=><option key={pr.id} value={pr.id}>{pr.name}</option>)}</optgroup>)}
            </select>
          </div>
        </div>
        {pd2.proceso&&<div style={{fontSize:11,color:"#7c3aed",fontStyle:"italic",marginTop:2}}>{ALL_PROCESSES.find(p=>p.id===pd2.proceso)?.desc||""}</div>}
      </div>}
    </div>};

  const rDisc=item=>{const v=data[item.id]||"";
    return<div key={item.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:v==="correcto"?"#f0fdf4":v==="incorrecto"?"#fef2f2":"#fff",borderRadius:8,border:`1px solid ${v==="correcto"?"#bbf7d0":v==="incorrecto"?"#fecaca":"#e2e8f0"}`,marginBottom:4}}>
      <span style={{fontWeight:600,fontSize:14,flex:1}}>{item.pair}</span>
      {item.contrast&&<span style={{fontSize:11,color:K.mt}}>{item.contrast}</span>}
      <div style={{display:"flex",gap:4}}>
        {["correcto","incorrecto"].map(o=><button key={o} onClick={()=>sf(item.id,v===o?"":o)}
          style={{padding:"5px 10px",borderRadius:6,border:v===o?`2px solid ${o==="correcto"?"#059669":"#dc2626"}`:"1px solid #e2e8f0",background:v===o?(o==="correcto"?"#059669":"#dc2626"):"#fff",color:v===o?"#fff":"#64748b",fontSize:12,fontWeight:600,cursor:"pointer"}}>
          {o==="correcto"?"✔":"✘"}</button>)}
      </div>
    </div>};

  const rRec=item=>{const v=data[item.id]||"";
    return<div key={item.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:v==="reconoce"?"#f0fdf4":v==="no"?"#fef2f2":"#fff",borderRadius:8,border:`1px solid ${v==="reconoce"?"#bbf7d0":v==="no"?"#fecaca":"#e2e8f0"}`,marginBottom:4}}>
      <span style={{fontWeight:600,fontSize:14,flex:1}}>{item.target}</span>
      <span style={{fontSize:11,color:K.mt}}>{item.contrast}</span>
      <div style={{display:"flex",gap:4}}>
        {["reconoce","no"].map(o=><button key={o} onClick={()=>sf(item.id,v===o?"":o)}
          style={{padding:"5px 10px",borderRadius:6,border:v===o?`2px solid ${o==="reconoce"?"#059669":"#dc2626"}`:"1px solid #e2e8f0",background:v===o?(o==="reconoce"?"#059669":"#dc2626"):"#fff",color:v===o?"#fff":"#64748b",fontSize:12,fontWeight:600,cursor:"pointer"}}>
          {o==="reconoce"?"✔":"✘"}</button>)}
      </div>
    </div>};

  const isFonSection=(sec)=>sec.id==="fon";

  const rSec=sec=>{
    const isFon=isFonSection(sec);
    const mainContent=<div style={isFon?{flex:1,minWidth:0}:{}}>
      <h2 style={{fontSize:18,fontWeight:700,marginBottom:4,color:"#7c3aed"}}>{sec.title}</h2>
      {sec.description&&<p style={{color:K.mt,fontSize:13,marginBottom:16}}>{sec.description}</p>}
      {sec.subsections.map(sub=><div key={sub.id} style={{marginBottom:20}}>
        <h3 style={{fontSize:15,fontWeight:600,marginBottom:10,color:"#0a3d2f",paddingBottom:6,borderBottom:"2px solid #ede9fe"}}>{sub.title}</h3>
        {sub.fields&&sub.fields.map(f=>rField(f))}
        {sub.items&&sub.items.map(i=>rPhon(i))}
        {sub.discItems&&sub.discItems.map(i=>rDisc(i))}
        {sub.recItems&&sub.recItems.map(i=>rRec(i))}
      </div>)}
    </div>;

    if(!isFon) return mainContent;

    /* Fonética: layout with sticky legend sidebar */
    return <div style={{display:"flex",gap:16,alignItems:"flex-start"}}>
      {mainContent}
      <div style={{width:260,flexShrink:0,position:"sticky",top:16,alignSelf:"flex-start"}}>
        {legendBox}
      </div>
    </div>;
  };

  /* Coordinación neuromotora: also use option cards via rField (already handled above) */

  const countUnevalSelects=()=>{let c=0;PEFF_SECTIONS.forEach(sec=>{sec.subsections.forEach(sub=>{if(sub.fields)sub.fields.forEach(f=>{if(f.type==="select"&&!data[f.id])c++})})});return c};
  const countUnevalPhon=()=>{let c=0;const s=PEFF_SECTIONS.find(s=>s.id==="fon");if(s)s.subsections.forEach(sub=>{if(sub.items)sub.items.forEach(i=>{if(!data[i.id])c++})});return c};
  const countUnevalDisc=()=>{let c=0;const s=PEFF_SECTIONS.find(s=>s.id==="disc");if(s)s.subsections.forEach(sub=>{if(sub.discItems)sub.discItems.forEach(i=>{if(!data[i.id])c++})});return c};
  const countUnevalRec=()=>{let c=0;const s=PEFF_SECTIONS.find(s=>s.id==="recfon");if(s)s.subsections.forEach(sub=>{if(sub.recItems)sub.recItems.forEach(i=>{if(!data[i.id])c++})});return c};

  const calc=()=>{
    const sI=PEFF_SECTIONS.find(s=>s.id==="fon")?.subsections.flatMap(sub=>sub.items||[])||[];
    const sOk=sI.filter(i=>data[i.id]==="ok").length;
    const sEvaluated=sI.filter(i=>!!data[i.id]).length;
    const sPct=sI.length?Math.round(sOk/sI.length*100):0;
    const sPctEval=sEvaluated>0?Math.round(sOk/sEvaluated*100):0;
    const dI=PEFF_SECTIONS.find(s=>s.id==="disc")?.subsections.flatMap(sub=>sub.discItems||[])||[];
    const dOk=dI.filter(i=>data[i.id]==="correcto").length;
    const dEval=dI.filter(i=>!!data[i.id]).length;
    const dPct=dEval>0?Math.round(dOk/dEval*100):0;
    const rI=PEFF_SECTIONS.find(s=>s.id==="recfon")?.subsections.flatMap(sub=>sub.recItems||[])||[];
    const rOk=rI.filter(i=>data[i.id]==="reconoce").length;
    const rEval=rI.filter(i=>!!data[i.id]).length;
    const rPct=rEval>0?Math.round(rOk/rEval*100):0;
    let sev="Adecuado";
    if(sPct<50)sev="Severo";else if(sPct<65)sev="Moderado-Severo";else if(sPct<85)sev="Moderado";else if(sPct<98)sev="Leve";
    const procAnalysis={byCategory:{},byProcess:{},errors:[],total:0};
    Object.entries(procData).forEach(([itemId,pd2])=>{
      if(!pd2.proceso)return;
      const proc=ALL_PROCESSES.find(p=>p.id===pd2.proceso);
      if(!proc)return;
      procAnalysis.total++;
      procAnalysis.byCategory[proc.category]=(procAnalysis.byCategory[proc.category]||0)+1;
      procAnalysis.byProcess[proc.id]=(procAnalysis.byProcess[proc.id]||0)+1;
      const item=sI.find(i=>i.id===itemId);
      procAnalysis.errors.push({itemId,word:item?.word||itemId,target:item?.target||"",produccion:pd2.produccion||"",proceso:proc.id,procesoName:proc.name,category:proc.category,categoryTitle:proc.categoryTitle,expectedAge:proc.expectedAge});
    });
    const us=countUnevalSelects(),up=countUnevalPhon(),ud=countUnevalDisc(),ur=countUnevalRec();
    return{silOk:sOk,silTotal:sI.length,silPct:sPct,silEval:sEvaluated,silPctEval:sPctEval,
      discOk:dOk,discTotal:dI.length,discEval:dEval,discPct:dPct,
      recOk:rOk,recTotal:rI.length,recEval:rEval,recPct:rPct,
      severity:sev,procAnalysis,
      unevalSelects:us,unevalPhon:up,unevalDisc:ud,unevalRec:ur,unevalTotal:us+up+ud+ur};
  };

  const renderProcResults=(r)=>{
    const pa=r.procAnalysis;
    if(!pa||pa.total===0)return<div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,padding:20,marginBottom:20}}>
      <div style={{fontSize:14,fontWeight:600,color:"#059669"}}>{"✓ No se registraron procesos fonológicos"}</div>
    </div>;
    const catNames={sust:"Sustituciones",asim:"Asimilaciones",estr:"Estructuración silábica"};
    const catColors={sust:"#f59e0b",asim:"#7c3aed",estr:"#dc2626"};
    const ageExpected=pa.errors.filter(e=>a>0&&e.expectedAge<a);
    return<div style={{marginBottom:20}}>
      <h3 style={{fontSize:16,fontWeight:700,color:"#7c3aed",marginBottom:12}}>{"Procesos Fonológicos ("}{pa.total}{")"}</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
        {Object.entries(catNames).map(([id,name])=>{const c=pa.byCategory[id]||0;
          return<div key={id} style={{background:"#f8faf9",borderRadius:10,padding:16,border:`2px solid ${c>0?catColors[id]:"#e2e8f0"}`,textAlign:"center"}}>
            <div style={{fontSize:28,fontWeight:700,color:c>0?catColors[id]:"#cbd5e1"}}>{c}</div>
            <div style={{fontSize:11,color:K.mt,marginTop:2}}>{name}</div>
          </div>})}
      </div>
      <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,overflow:"hidden",marginBottom:16}}>
        <div style={{background:"#f8faf9",padding:"10px 16px",fontSize:12,fontWeight:700,color:K.mt,display:"grid",gridTemplateColumns:"60px 80px 80px 1fr 1fr",gap:8}}>
          <span>Sílaba</span><span>Producc.</span><span>Tipo</span><span>Proceso</span><span>Cat.</span>
        </div>
        {pa.errors.map((e,i)=><div key={i} style={{padding:"8px 16px",fontSize:13,display:"grid",gridTemplateColumns:"60px 80px 80px 1fr 1fr",gap:8,borderTop:"1px solid #f1f5f9",alignItems:"center",background:a>0&&e.expectedAge<a?"#fef2f2":"#fff"}}>
          <span style={{fontWeight:700,color:"#7c3aed"}}>{e.word}</span>
          <span style={{color:"#dc2626",fontWeight:600}}>{e.produccion||"—"}</span>
          <span style={{fontSize:11}}>{data[e.itemId]||""}</span>
          <span style={{fontSize:12}}>{e.procesoName}</span>
          <span style={{fontSize:11,color:catColors[e.category],fontWeight:600}}>{e.categoryTitle}</span>
        </div>)}
      </div>
      {ageExpected.length>0&&<div style={{background:"#fef3c7",border:"1px solid #fde68a",borderRadius:10,padding:16,marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:700,color:"#92400e",marginBottom:6}}>{"⚠ No esperados ("}{fa(a)}{")"}</div>
        <div style={{fontSize:12,color:"#78350f"}}>{ageExpected.map(e=>`${e.procesoName} (esperable hasta ${fa(e.expectedAge)})`).filter((v,i,a)=>a.indexOf(v)===i).join("; ")}</div>
      </div>}
      {(()=>{const sorted=Object.entries(pa.byProcess).sort((a,b)=>b[1]-a[1]);if(sorted.length===0)return null;const top=sorted.slice(0,3).map(([id,count])=>{const p=ALL_PROCESSES.find(x=>x.id===id);return`${p?.name||id} (${count})`});
        return<div style={{background:"#ede9fe",borderRadius:10,padding:16}}>
          <div style={{fontSize:13,fontWeight:700,color:"#5b21b6",marginBottom:4}}>Predominantes</div>
          <div style={{fontSize:13,color:"#3b0764"}}>{top.join(", ")}</div>
        </div>})()}
    </div>;
  };

  /* ── Result card component ── */
  const ResultCard=({title,desc,ok,total,evaluated,pct,color})=>
    <div style={{background:"#f8faf9",borderRadius:12,padding:20,border:"1px solid #e2e8f0"}}>
      <div style={{fontSize:14,fontWeight:700,color:"#1e293b",marginBottom:4}}>{title}</div>
      <div style={{fontSize:11,color:K.mt,marginBottom:12,lineHeight:1.5}}>{desc}</div>
      <div style={{fontSize:36,fontWeight:700,color:color||"#7c3aed",textAlign:"center"}}>{ok}<span style={{fontSize:16,color:K.mt}}>{"/"}{total}</span></div>
      {pct!==undefined&&<div style={{textAlign:"center",fontSize:13,color:K.mt,marginTop:4}}>{pct}{"% correcto"}</div>}
      {evaluated!==undefined&&evaluated<total&&<div style={{textAlign:"center",fontSize:11,color:"#f59e0b",marginTop:4}}>{"("}{evaluated}{" evaluados de "}{total}{")"}</div>}
    </div>;

  return<div style={{width:"100%",maxWidth:900,animation:"fi .3s ease"}}>
    <div style={{display:"flex",gap:2,marginBottom:22}}>
      {["Datos",...PEFF_SECTIONS.map((_,i)=>`${i+1}`),"Result"].map((s,i)=>
        <div key={i} style={{flex:1,textAlign:"center"}}>
          <div style={{height:4,borderRadius:2,marginBottom:4,background:step>i?"#7c3aed":step===i?"#c4b5fd":"#e2e8f0"}}/>
          <span style={{fontSize:9,color:step===i?"#7c3aed":"#64748b"}}>{s}</span>
        </div>)}
    </div>
    <div style={{background:"#fff",borderRadius:12,padding:28,border:"1px solid #e2e8f0"}}>

      {step===0&&<div>
        <h2 style={{fontSize:18,fontWeight:700,marginBottom:4,color:"#7c3aed"}}>{"PEFF — Datos del Paciente"}</h2>
        <p style={{color:K.mt,fontSize:13,marginBottom:16}}>{"Protocolo de Evaluación Fonético-Fonológica"}</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div style={{gridColumn:"1/-1"}}><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>{"Nombre completo"}</label><input value={pd.pN} onChange={e=>sPd(p=>({...p,pN:e.target.value}))} style={I} placeholder="Nombre y apellido"/></div>
          <div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>{"Fecha nacimiento"}</label><input type="date" value={pd.birth} onChange={e=>sPd(p=>({...p,birth:e.target.value}))} style={I}/></div>
          <div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>{"Fecha evaluación"}</label><input type="date" value={pd.eD} onChange={e=>sPd(p=>({...p,eD:e.target.value}))} style={I}/></div>
          <div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>{"Establecimiento"}</label><input value={pd.sch} onChange={e=>sPd(p=>({...p,sch:e.target.value}))} style={I}/></div>
          <div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>{"Derivado por"}</label><input value={pd.ref} onChange={e=>sPd(p=>({...p,ref:e.target.value}))} style={I}/></div>
        </div>
        {a>0&&<div style={{marginTop:14,padding:"10px 16px",background:"#ede9fe",borderRadius:8,fontSize:14}}><strong>{"Edad:"}</strong>{" "}{fa(a)}</div>}
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:20}}>
          <button onClick={()=>{if(!pd.pN||!pd.birth){nfy("Complete datos","er");return}sS2(1)}} style={{background:"#7c3aed",color:"#fff",border:"none",padding:"10px 22px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{"Siguiente →"}</button>
        </div>
      </div>}

      {step>=1&&step<=PEFF_SECTIONS.length&&rSec(PEFF_SECTIONS[step-1])}

      {step===PEFF_SECTIONS.length+1&&(()=>{
        const r=calc();
        const sc=sevColor[r.severity]||"#7c3aed";
        return<div>
          <h2 style={{fontSize:20,fontWeight:700,marginBottom:6,color:"#7c3aed"}}>{"Resultados PEFF — "}{pd.pN}</h2>
          <p style={{fontSize:12,color:K.mt,marginBottom:20}}>{"Edad: "}{fa(a)}{" · Evaluación: "}{pd.eD}</p>

          {/* ── Main scores ── */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:20}}>
            <ResultCard
              title="Producción de Sílabas"
              desc="Cantidad de sílabas producidas correctamente por el niño/a al repetir los estímulos fonéticos presentados."
              ok={r.silOk} total={r.silTotal} evaluated={r.silEval}
              pct={r.silPctEval} color={r.silPctEval>=85?"#059669":r.silPctEval>=50?"#f59e0b":"#dc2626"}/>
            <ResultCard
              title="Discriminación Auditiva"
              desc="Capacidad del niño/a para diferenciar si dos palabras suenan igual o diferente (percepción auditiva fonológica)."
              ok={r.discOk} total={r.discTotal} evaluated={r.discEval}
              pct={r.discPct} color={r.discPct>=85?"#059669":r.discPct>=50?"#f59e0b":"#dc2626"}/>
            <ResultCard
              title="Reconocimiento Fonológico"
              desc="Capacidad del niño/a para identificar la palabra correcta entre dos opciones cuando se le dice una palabra objetivo."
              ok={r.recOk} total={r.recTotal} evaluated={r.recEval}
              pct={r.recPct} color={r.recPct>=85?"#059669":r.recPct>=50?"#f59e0b":"#dc2626"}/>
          </div>

          {/* ── Severity ── */}
          <div style={{background:`linear-gradient(135deg,${sc}dd,${sc})`,borderRadius:12,padding:24,color:"#fff",marginBottom:20}}>
            <div style={{fontSize:13,opacity:.8,marginBottom:4}}>{"Severidad del trastorno fonético-fonológico"}</div>
            <div style={{fontSize:36,fontWeight:700,marginBottom:8}}>{r.severity}</div>
            <div style={{fontSize:13,opacity:.9,lineHeight:1.6}}>{sevDesc[r.severity]}</div>
          </div>

          {/* ── Scoring criteria explanation ── */}
          <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:10,padding:16,marginBottom:20,fontSize:12,color:"#0369a1",lineHeight:1.6}}>
            <strong>{"ℹ️ Criterios de clasificación:"}</strong><br/>
            {"• Adecuado: ≥98% de sílabas correctas"}<br/>
            {"• Leve: 85-97% correctas — errores aislados"}<br/>
            {"• Moderado: 65-84% correctas — múltiples errores"}<br/>
            {"• Moderado-Severo: 50-64% correctas — errores frecuentes"}<br/>
            {"• Severo: <50% correctas — errores generalizados"}<br/>
            <span style={{fontStyle:"italic",marginTop:6,display:"block"}}>{"La severidad se calcula sobre el total de sílabas del protocolo. Los ítems no evaluados se consideran como no logrados."}</span>
          </div>

          {/* ── Unevaluated ── */}
          {r.unevalTotal>0&&<div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:16,marginBottom:20}}>
            <div style={{fontSize:13,fontWeight:700,color:"#92400e",marginBottom:8}}>{"⚠ Ítems sin evaluar ("}{r.unevalTotal}{")"}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,fontSize:12,color:"#78350f"}}>
              {r.unevalSelects>0&&<div>{"Examen Clínico OFA / Coordinación: "}<b>{r.unevalSelects}</b></div>}
              {r.unevalPhon>0&&<div>{"Producción de Sílabas: "}<b>{r.unevalPhon}</b></div>}
              {r.unevalDisc>0&&<div>{"Discriminación Auditiva: "}<b>{r.unevalDisc}</b></div>}
              {r.unevalRec>0&&<div>{"Reconocimiento Fonológico: "}<b>{r.unevalRec}</b></div>}
            </div>
          </div>}

          {renderProcResults(r)}

          <div style={{marginBottom:20}}>
            <label style={{fontSize:13,fontWeight:600,color:K.mt,display:"block",marginBottom:6}}>{"Observaciones clínicas"}</label>
            <textarea value={pd.obs} onChange={e=>sPd(p=>({...p,obs:e.target.value}))} rows={4} style={{width:"100%",padding:"12px 14px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,resize:"vertical",background:"#f8faf9"}} placeholder="Interpretación profesional..."/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <button onClick={()=>sS2(step-1)} style={{background:"#f1f5f9",border:"none",padding:"10px 22px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{"← Atrás"}</button>
            <button onClick={()=>onS({paciente:pd.pN,fechaNacimiento:pd.birth,fechaEvaluacion:pd.eD,establecimiento:pd.sch,derivadoPor:pd.ref,edadMeses:a,observaciones:pd.obs,seccionData:data,procesosData:procData,resultados:r})} style={{background:"#7c3aed",color:"#fff",border:"none",padding:"12px 28px",borderRadius:8,fontSize:15,fontWeight:700,cursor:"pointer"}}>{"💾 Guardar"}</button>
          </div>
        </div>})()}

      {step>=1&&step<=PEFF_SECTIONS.length&&<div style={{display:"flex",justifyContent:"space-between",marginTop:20,paddingTop:14,borderTop:"1px solid #e2e8f0"}}>
        <button onClick={()=>sS2(step-1)} style={{background:"#f1f5f9",border:"none",padding:"10px 22px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{"← Atrás"}</button>
        <button onClick={()=>sS2(step+1)} style={{background:"#7c3aed",color:"#fff",border:"none",padding:"10px 22px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{"Siguiente →"}</button>
      </div>}
    </div>
  </div>;
}
