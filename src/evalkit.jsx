import { useState, useEffect, useCallback } from "react";
import { db, collection, addDoc, getDocs, deleteDoc, doc } from "./firebase.js";
import Hist from "./components/Hist.jsx";
import RptELDI from "./components/RptELDI.jsx";
import RptPEFF from "./components/RptPEFF.jsx";
import Admin from "./components/Admin.jsx";
import NewELDI from "./components/NewELDI.jsx";
import NewPEFF from "./components/NewPEFF.jsx";

const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && window.innerWidth < 900;
const K = { sd: "#0a3d2f", ac: "#0d9488", al: "#ccfbf1", mt: "#64748b", bd: "#e2e8f0", bg: "#f0f5f3" };

async function fbGetAll(c) { const s = await getDocs(collection(db, c)); return s.docs.map(d => ({ _fbId: d.id, ...d.data() })); }
async function fbAdd(c, data) { try { const r = await addDoc(collection(db, c), data); return { success:true, id:r.id }; } catch(e) { return { success:false, error:e.message }; } }
async function fbDelete(c, id) { try { await deleteDoc(doc(db, c, id)); return { success:true }; } catch(e) { return { success:false, error:e.message }; } }
function withTimeout(promise, ms, label) { return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), ms))]); }

const SESSION_KEY="brujula_session";
const saveSession=(u)=>{try{sessionStorage.setItem(SESSION_KEY,JSON.stringify(u))}catch(e){}};
const loadSession=()=>{try{const s=sessionStorage.getItem(SESSION_KEY);return s?JSON.parse(s):null}catch(e){return null}};
const clearSession=()=>{try{sessionStorage.removeItem(SESSION_KEY)}catch(e){}};

export default function App(){
  const[user,sU]=useState(loadSession),[view,sV]=useState("dash"),[evals,sE]=useState([]),[peffEvals,sPE]=useState([]);
  const[sel,sS]=useState(null),[toast,sT]=useState(null),[loading,sL]=useState(false);
  const[mobile]=useState(isMobile());
  const nfy=useCallback((m,t)=>{sT({m,t});setTimeout(()=>sT(null),3500)},[]);
  const loadEvals=useCallback(async()=>{
    sL(true);try{
      const eldi=await fbGetAll("evaluaciones");sE(eldi.sort((a,b)=>(b.fechaGuardado||"").localeCompare(a.fechaGuardado||"")));
      const peff=await fbGetAll("peff_evaluaciones");sPE(peff.sort((a,b)=>(b.fechaGuardado||"").localeCompare(a.fechaGuardado||"")));
    }catch(e){console.error(e)}sL(false);
  },[]);
  useEffect(()=>{if(user)loadEvals()},[user,loadEvals]);
  const navTo=(v)=>{
    if((view==="newELDI"||view==="newPEFF")&&v!==view){
      if(!window.confirm("Salir sin guardar?"))return;
    }
    sV(v);sS(null);
  };
  const saveEval=async(ev)=>{
    const rspClean={};
    if(ev.rsp){Object.entries(ev.rsp).forEach(([k,v])=>{if(v===true)rspClean[k]=true;else if(v===false)rspClean[k]=false;});}
    const newEv={id:Date.now()+"",paciente:ev.pN,fechaNacimiento:ev.birth,fechaEvaluacion:ev.eD,establecimiento:ev.sch,derivadoPor:ev.ref,edadMeses:ev.a,evalRec:ev.evalRec||false,evalExp:ev.evalExp||false,brutoReceptivo:ev.rR,brutoExpresivo:ev.rE,recRes:ev.recRes||null,expRes:ev.expRes||null,allNoEval:ev.allNoEval||[],observaciones:ev.obs||"",evaluador:user?.un||"",fechaGuardado:new Date().toISOString(),respuestas:rspClean};
    const res=await fbAdd("evaluaciones",newEv);
    if(res.success){nfy("ELDI guardada","ok");await loadEvals()}else nfy("Error: "+res.error,"er");sV("dash");
  };
  const savePeff=async(data)=>{
    const res=await fbAdd("peff_evaluaciones",{id:Date.now()+"",evaluador:user?.un||"",fechaGuardado:new Date().toISOString(),...data});
    if(res.success){nfy("PEFF guardada","ok");await loadEvals()}else nfy("Error: "+res.error,"er");sV("dash");
  };
  const deleteEval=async(fbId,colName="evaluaciones")=>{
    if(!user?.adm)return;const res=await fbDelete(colName,fbId);
    if(res.success){nfy("Eliminada","ok");await loadEvals()}else nfy("Error: "+res.error,"er");sS(null);sV("hist");
  };
  if(!user)return<Login onOk={u=>{sU(u);saveSession(u);nfy("Bienvenido/a, "+u.un,"ok")}}/>;
  const nav=[["dash","\u229E","Panel"],["tools","\uD83E\uDDF0","Herramientas"],["hist","\u23F1","Historial"]];
  if(user.adm)nav.push(["adm","\u2699","Usuarios"]);
  return(
    <div style={{display:"flex",height:"100vh",width:"100vw",fontFamily:"'DM Sans',system-ui,sans-serif",background:K.bg,color:"#1e293b",overflow:"hidden"}}>
      <aside style={{width:mobile?60:230,minWidth:mobile?60:230,background:K.sd,color:"#fff",display:"flex",flexDirection:"column",padding:"18px 0",flexShrink:0,height:"100vh"}}>
        <div style={{padding:"0 14px",marginBottom:26,display:"flex",alignItems:"center",gap:9}}><span style={{fontSize:28}}>{"\uD83E\uDDED"}</span>{!mobile&&<div><div style={{fontSize:17,fontWeight:700}}>{"Br\u00FAjula KIT"}</div><div style={{fontSize:9,color:"#5eead4",fontWeight:600,letterSpacing:"1px"}}>{"FONOAUDIOLOG\u00CDA"}</div></div>}</div>
        <nav style={{flex:1}}>{nav.map(([id,ic,lb])=><button key={id} onClick={()=>navTo(id)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:mobile?"13px 0":"11px 18px",background:view===id?"rgba(94,234,212,.12)":"transparent",border:"none",color:view===id?"#5eead4":"rgba(255,255,255,.6)",cursor:"pointer",fontSize:14,fontWeight:view===id?600:400,borderLeft:view===id?"3px solid #5eead4":"3px solid transparent",textAlign:"left",justifyContent:mobile?"center":"flex-start"}}><span>{ic}</span>{!mobile&&<span>{lb}</span>}</button>)}</nav>
        <div style={{padding:"0 14px",borderTop:"1px solid rgba(255,255,255,.1)",paddingTop:12}}>{!mobile&&<div style={{fontSize:10,color:"rgba(255,255,255,.45)",marginBottom:5}}>{"Sesi\u00F3n: "}<b style={{color:"#5eead4"}}>{user.un}</b>{user.adm&&<span style={{background:"#5eead4",color:K.sd,padding:"1px 5px",borderRadius:3,fontSize:8,marginLeft:6,fontWeight:700}}>ADMIN</span>}</div>}<button onClick={()=>{sU(null);clearSession();sV("dash");sS(null)}} style={{background:"rgba(255,255,255,.08)",border:"none",color:"rgba(255,255,255,.6)",padding:"7px 12px",borderRadius:6,cursor:"pointer",fontSize:mobile?16:12,width:"100%"}}>{mobile?"\u21A9":"\u21A9 Cerrar sesi\u00F3n"}</button></div>
      </aside>
      <main style={{flex:1,overflowY:"auto",overflowX:"hidden",padding:mobile?"16px":"28px 36px",height:"100vh"}}>
        {toast&&<div style={{position:"fixed",top:16,right:16,zIndex:999,background:toast.t==="ok"?"#059669":"#dc2626",color:"#fff",padding:"10px 18px",borderRadius:8,fontSize:13,fontWeight:500,boxShadow:"0 4px 16px rgba(0,0,0,.15)",animation:"fi .3s ease"}}>{toast.m}</div>}
        {view==="dash"&&<Dash es={evals} pe={peffEvals} onT={()=>navTo("tools")} onV={e=>{sS(e);sV("rpt")}} onVP={e=>{sS(e);sV("rptP")}} ld={loading}/>}
        {view==="tools"&&<Tools onSel={t=>sV(t)}/>}
        {view==="newELDI"&&<NewELDI onS={saveEval} nfy={nfy}/>}
        {view==="newPEFF"&&<NewPEFF onS={savePeff} nfy={nfy}/>}
        {view==="hist"&&<Hist es={evals} pe={peffEvals} onV={e=>{sS(e);sV("rpt")}} onVP={e=>{sS(e);sV("rptP")}} isA={user.adm} onD={deleteEval}/>}
        {view==="rpt"&&sel&&<RptELDI ev={sel} isA={user.adm} onD={deleteEval}/>}
        {view==="rptP"&&sel&&<RptPEFF ev={sel} isA={user.adm} onD={deleteEval}/>}
        {view==="adm"&&user.adm&&<Admin nfy={nfy}/>}
      </main>
    </div>
  );
}

function Login({onOk}){
  const[u,su]=useState(""),[p,sp]=useState(""),[ld,sl]=useState(false),[e,se]=useState(""),[info,setInfo]=useState("");
  const go=async ev=>{ev.preventDefault();sl(true);se("");setInfo("");
    try{
      let users=await fbGetAll("usuarios");
      if(users.length===0){
        setInfo("BD vac\u00EDa. Creando admin...");
        try{await withTimeout(addDoc(collection(db,"usuarios"),{usuario:"CalaAdmin976",contrasena:"BrujulaKit2025!"}),10000,"addDoc")}catch(addErr){se("Error: "+addErr.message);sl(false);return}
        users=await fbGetAll("usuarios");setInfo("");
      }
      const found=users.find(usr=>(usr.usuario||"").trim()===u.trim()&&(usr.contrasena||"").trim()===p.trim());
      if(found)onOk({un:u.trim(),adm:u.trim()==="CalaAdmin976"});
      else se("Credenciales incorrectas.");
    }catch(err){se("Error: "+err.message)}sl(false);
  };
  const I={width:"100%",padding:"12px 14px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,background:"#f8faf9"};
  return(<div style={{width:"100vw",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(145deg,#0a3d2f,#0d7363)",fontFamily:"'DM Sans',system-ui,sans-serif"}}><div style={{background:"rgba(255,255,255,.97)",borderRadius:16,padding:"44px 36px",width:380,maxWidth:"90vw",boxShadow:"0 20px 50px rgba(0,0,0,.3)"}}><div style={{textAlign:"center",marginBottom:28}}><div style={{display:"inline-flex",alignItems:"center",gap:9,marginBottom:8}}><span style={{fontSize:32}}>{"\uD83E\uDDED"}</span><span style={{fontSize:26,fontWeight:700,color:"#0a3d2f"}}>{"Br\u00FAjula KIT"}</span></div><p style={{color:"#64748b",fontSize:13}}>{"Sistema Integral de Evaluaci\u00F3n Fonoaudiol\u00F3gica"}</p></div><form onSubmit={go}><div style={{marginBottom:14}}><label style={{fontSize:12,fontWeight:600,color:"#64748b",display:"block",marginBottom:5}}>Usuario</label><input value={u} onChange={e=>su(e.target.value)} style={I} placeholder="Ingrese su usuario" required/></div><div style={{marginBottom:22}}><label style={{fontSize:12,fontWeight:600,color:"#64748b",display:"block",marginBottom:5}}>{"Contrase\u00F1a"}</label><input type="password" value={p} onChange={e=>sp(e.target.value)} style={I} placeholder="Ingrese su contrase\u00F1a" required/></div>{e&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626",padding:"10px 12px",borderRadius:8,fontSize:12,marginBottom:14}}>{e}</div>}{info&&<div style={{background:"#eff6ff",border:"1px solid #bfdbfe",color:"#2563eb",padding:"10px 12px",borderRadius:8,fontSize:12,marginBottom:14}}>{info}</div>}<button type="submit" disabled={ld} style={{width:"100%",padding:"13px",background:"#0d9488",color:"#fff",border:"none",borderRadius:8,fontSize:15,fontWeight:600,cursor:ld?"wait":"pointer",opacity:ld?.7:1}}>{ld?"Verificando...":"Iniciar sesi\u00F3n"}</button></form><p style={{textAlign:"center",marginTop:20,fontSize:10,color:"#94a3b8"}}>{"Br\u00FAjula KIT v4.1"}</p></div></div>);
}

function Dash({es,pe,onT,onV,onVP,ld}){
  const all=[...es,...pe].sort((a,b)=>(b.fechaGuardado||"").localeCompare(a.fechaGuardado||""));const rc=all.slice(0,5);
  return(<div style={{animation:"fi .3s ease",width:"100%"}}><h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>{"\uD83E\uDDED Panel Principal"}</h1><p style={{color:K.mt,fontSize:14,marginBottom:24}}>{"Resumen"}{ld?" \u2014 cargando...":""}</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:16,marginBottom:28}}>{[["\uD83D\uDCCB","ELDI",es.length],["\uD83D\uDD0A","PEFF",pe.length],["\uD83D\uDC76","Pacientes",new Set([...es.map(e=>e.paciente),...pe.map(e=>e.paciente)]).size]].map(([ic,lb,v],i)=><div key={i} style={{background:"#fff",borderRadius:12,padding:22,border:"1px solid #e2e8f0"}}><div style={{fontSize:28,marginBottom:6}}>{ic}</div><div style={{fontSize:28,fontWeight:700}}>{v}</div><div style={{fontSize:13,color:K.mt,marginTop:2}}>{lb}</div></div>)}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}><button onClick={onT} style={{background:"linear-gradient(135deg,#0a3d2f,#0d9488)",color:"#fff",border:"none",borderRadius:14,padding:"28px 24px",cursor:"pointer",display:"flex",alignItems:"center",gap:16,textAlign:"left"}}><div style={{width:52,height:52,borderRadius:12,background:"rgba(255,255,255,.14)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{"\uD83E\uDDF0"}</div><div><div style={{fontSize:18,fontWeight:700}}>Herramientas</div><div style={{fontSize:13,opacity:.8,marginTop:4}}>Nueva evaluaci\u00F3n</div></div></button><div style={{background:"#fff",borderRadius:14,padding:22,border:"1px solid #e2e8f0"}}><h3 style={{fontSize:15,fontWeight:600,marginBottom:14}}>Recientes</h3>{rc.length===0?<p style={{color:K.mt,fontSize:13}}>Sin evaluaciones.</p>:rc.map(ev=>{const isP=!!ev.seccionData;return(<div key={ev._fbId||ev.id} onClick={()=>isP?onVP(ev):onV(ev)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #e2e8f0",cursor:"pointer"}}><div><div style={{fontWeight:600,fontSize:14}}>{ev.paciente}</div><div style={{fontSize:11,color:K.mt}}>{isP?"PEFF":"ELDI"}{" \u00B7 "}{new Date(ev.fechaGuardado).toLocaleDateString("es-CL")}</div></div><span style={{color:K.mt}}>{"\u2192"}</span></div>)})}</div></div></div>);
}

function Tools({onSel}){
  const tools=[{id:"newELDI",icon:"\uD83D\uDCCB",name:"ELDI",full:"Evaluaci\u00F3n del Lenguaje y Desarrollo Infantil",desc:"Comprensi\u00F3n auditiva y comunicaci\u00F3n expresiva (55+55 \u00EDtems) de 0 a 7 a\u00F1os.",age:"0-7;11",time:"~30-45 min",color:"#0d9488"},{id:"newPEFF",icon:"\uD83D\uDD0A",name:"PEFF",full:"Protocolo Fon\u00E9tico-Fonol\u00F3gico",desc:"OFA, diadococinesis, s\u00EDlabas, discriminaci\u00F3n y reconocimiento fonol\u00F3gico.",age:"2;6-6;11",time:"~45-60 min",color:"#7c3aed"}];
  return(<div style={{animation:"fi .3s ease",width:"100%"}}><h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>{"\uD83E\uDDF0 Herramientas"}</h1><p style={{color:K.mt,fontSize:14,marginBottom:24}}>Seleccione evaluaci\u00F3n</p><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>{tools.map(t=><div key={t.id} onClick={()=>onSel(t.id)} style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden",cursor:"pointer"}}><div style={{background:`linear-gradient(135deg,${t.color},${t.color}aa)`,padding:"24px 24px 20px",color:"#fff"}}><div style={{fontSize:36,marginBottom:8}}>{t.icon}</div><div style={{fontSize:22,fontWeight:700}}>{t.name}</div><div style={{fontSize:12,opacity:.85,marginTop:2}}>{t.full}</div></div><div style={{padding:"20px 24px"}}><p style={{fontSize:13,color:"#475569",lineHeight:1.6,marginBottom:16}}>{t.desc}</p><div style={{display:"flex",gap:16,fontSize:12,color:K.mt}}><span>{"\uD83D\uDC76 "}{t.age}</span><span>{"\u23F1 "}{t.time}</span></div><button style={{marginTop:16,width:"100%",padding:"11px",background:t.color,color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{"Iniciar \u2192"}</button></div></div>)}</div></div>);
}
