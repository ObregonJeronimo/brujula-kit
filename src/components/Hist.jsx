import { useState } from "react";
const K = { mt: "#64748b" };
const itp=s=>s>=115?{t:"Superior al promedio",c:"#059669"}:s>=86?{t:"Dentro del promedio",c:"#2563eb"}:s>=78?{t:"Riesgo - Desfase leve",c:"#d97706"}:{t:"Déficit significativo",c:"#dc2626"};
const fa=m=>`${Math.floor(m/12)} años, ${m%12} meses`;

export default function Hist({es,pe,onV,onVP,isA,onD}){
  const[q,sQ]=useState(""),[tab,sTab]=useState("all"),[cf,sC]=useState(null);
  const all=[...es.map(e=>({...e,_t:"eldi"})),...pe.map(e=>({...e,_t:"peff"}))].sort((a,b)=>(b.fechaGuardado||"").localeCompare(a.fechaGuardado||""));
  const f=all.filter(e=>{if(q&&!(e.paciente||"").toLowerCase().includes(q.toLowerCase()))return false;if(tab==="eldi"&&e._t!=="eldi")return false;if(tab==="peff"&&e._t!=="peff")return false;return true});
  return(<div style={{width:"100%",animation:"fi .3s ease"}}>
    <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>Historial</h1><p style={{color:K.mt,fontSize:14,marginBottom:14}}>{all.length} evaluaciones</p>
    <div style={{display:"flex",gap:8,marginBottom:14}}>{[["all","Todas"],["eldi","📋 ELDI"],["peff","🔊 PEFF"]].map(([id,lb])=><button key={id} onClick={()=>sTab(id)} style={{padding:"6px 14px",borderRadius:6,border:tab===id?"2px solid #0d9488":"1px solid #e2e8f0",background:tab===id?"#ccfbf1":"#fff",color:tab===id?"#0d9488":"#64748b",fontSize:13,fontWeight:600,cursor:"pointer"}}>{lb}</button>)}</div>
    <input value={q} onChange={e=>sQ(e.target.value)} placeholder="Buscar paciente..." style={{width:"100%",maxWidth:400,padding:"10px 14px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,marginBottom:18,background:"#fff"}}/>
    {f.length===0?<div style={{background:"#fff",borderRadius:12,padding:40,textAlign:"center",border:"1px solid #e2e8f0",color:K.mt}}>Sin resultados.</div>:
    <div style={{display:"flex",flexDirection:"column",gap:6}}>{f.map(ev=>{const isP=ev._t==="peff";const bg=isP?{b:"#ede9fe",c:"#7c3aed",l:"PEFF"}:{b:"#ccfbf1",c:"#0d9488",l:"ELDI"};
      return(<div key={ev._fbId||ev.id} style={{background:"#fff",borderRadius:10,padding:"14px 20px",border:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div onClick={()=>isP?onVP(ev):onV(ev)} style={{cursor:"pointer",flex:1}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{padding:"2px 8px",borderRadius:4,background:bg.b,color:bg.c,fontSize:10,fontWeight:700}}>{bg.l}</span><span style={{fontWeight:600,fontSize:15}}>{ev.paciente}</span></div>
          <div style={{fontSize:12,color:K.mt,marginTop:2}}>{new Date(ev.fechaGuardado).toLocaleDateString("es-CL")} · {fa(ev.edadMeses)}{ev.evaluador?` · ${ev.evaluador}`:""}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          {!isP&&ev.ssTotal&&<span style={{padding:"3px 10px",borderRadius:14,background:itp(ev.ssTotal).c+"15",color:itp(ev.ssTotal).c,fontSize:12,fontWeight:600}}>PE:{ev.ssTotal}</span>}
          {isP&&ev.resultados&&<span style={{padding:"3px 10px",borderRadius:14,background:"#ede9fe",color:"#7c3aed",fontSize:12,fontWeight:600}}>{ev.resultados.severity}</span>}
          {isA&&(cf===(ev._fbId||ev.id)?<div style={{display:"flex",gap:4}}><button onClick={()=>{onD(ev._fbId,isP?"peff_evaluaciones":"evaluaciones");sC(null)}} style={{background:"#dc2626",color:"#fff",border:"none",padding:"5px 10px",borderRadius:5,fontSize:11,cursor:"pointer",fontWeight:600}}>Sí</button><button onClick={()=>sC(null)} style={{background:"#f1f5f9",border:"none",padding:"5px 10px",borderRadius:5,fontSize:11,cursor:"pointer"}}>No</button></div>:<button onClick={()=>sC(ev._fbId||ev.id)} style={{background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",padding:"5px 10px",borderRadius:6,cursor:"pointer",fontSize:11}}>🗑</button>)}
          <span onClick={()=>isP?onVP(ev):onV(ev)} style={{color:"#94a3b8",cursor:"pointer"}}>→</span>
        </div>
      </div>)})}</div>}
  </div>);
}
