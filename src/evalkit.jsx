import { useState, useEffect, useCallback } from "react";
import { db, collection, addDoc, getDocs, deleteDoc, doc } from "./firebase.js";
import Hist from "./components/Hist.jsx";
import RptELDI from "./components/RptELDI.jsx";
import RptPEFF from "./components/RptPEFF.jsx";
import Admin from "./components/Admin.jsx";
import NewELDI from "./components/NewELDI.jsx";
import NewPEFF from "./components/NewPEFF.jsx";

const isMobile = () => window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const K = { sd: "#0a3d2f", ac: "#0d9488", al: "#ccfbf1", mt: "#64748b", bd: "#e2e8f0", bg: "#f0f5f3" };

async function fbGetAll(c) { const s = await getDocs(collection(db, c)); return s.docs.map(d => ({ _fbId: d.id, ...d.data() })); }
async function fbAdd(c, data) { try { const r = await addDoc(collection(db, c), data); return { success:true, id:r.id }; } catch(e) { return { success:false, error:e.message }; } }
async function fbDelete(c, id) { try { await deleteDoc(doc(db, c, id)); return { success:true }; } catch(e) { return { success:false, error:e.message }; } }

function normalCDF(x){const a1=.254829592,a2=-.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=.3275911;const s=x<0?-1:1;x=Math.abs(x)/Math.sqrt(2);const t=1/(1+p*x);const y=1-(((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x);return .5*(1+s*y);}
function ssToPercentile(ss){return Math.round(normalCDF((ss-100)/15)*1000)/10;}
const NM={"0-5":[{n:0,x:1,s:55},{n:2,x:3,s:70},{n:4,x:5,s:85},{n:6,x:7,s:100},{n:8,x:9,s:115},{n:10,x:99,s:130}],"6-11":[{n:0,x:2,s:55},{n:3,x:5,s:70},{n:6,x:8,s:85},{n:9,x:12,s:100},{n:13,x:16,s:115},{n:17,x:99,s:130}],"12-17":[{n:0,x:4,s:55},{n:5,x:8,s:70},{n:9,x:12,s:85},{n:13,x:17,s:100},{n:18,x:22,s:115},{n:23,x:99,s:130}],"18-23":[{n:0,x:6,s:55},{n:7,x:10,s:70},{n:11,x:15,s:85},{n:16,x:22,s:100},{n:23,x:28,s:115},{n:29,x:99,s:130}],"24-29":[{n:0,x:8,s:55},{n:9,x:13,s:70},{n:14,x:18,s:85},{n:19,x:26,s:100},{n:27,x:33,s:115},{n:34,x:99,s:130}],"30-35":[{n:0,x:10,s:55},{n:11,x:16,s:70},{n:17,x:22,s:85},{n:23,x:30,s:100},{n:31,x:37,s:115},{n:38,x:99,s:130}],"36-41":[{n:0,x:12,s:55},{n:13,x:18,s:70},{n:19,x:25,s:85},{n:26,x:34,s:100},{n:35,x:41,s:115},{n:42,x:99,s:130}],"42-47":[{n:0,x:14,s:55},{n:15,x:20,s:70},{n:21,x:28,s:85},{n:29,x:38,s:100},{n:39,x:45,s:115},{n:46,x:99,s:130}],"48-59":[{n:0,x:16,s:55},{n:17,x:24,s:70},{n:25,x:32,s:85},{n:33,x:42,s:100},{n:43,x:49,s:115},{n:50,x:99,s:130}],"60-71":[{n:0,x:20,s:55},{n:21,x:28,s:70},{n:29,x:36,s:85},{n:37,x:46,s:100},{n:47,x:52,s:115},{n:53,x:99,s:130}],"72-95":[{n:0,x:24,s:55},{n:25,x:32,s:70},{n:33,x:40,s:85},{n:41,x:49,s:100},{n:50,x:53,s:115},{n:54,x:99,s:130}]};
const gp=m=>m<6?"0-5":m<12?"6-11":m<18?"12-17":m<24?"18-23":m<30?"24-29":m<36?"30-35":m<42?"36-41":m<48?"42-47":m<60?"48-59":m<72?"60-71":"72-95";
const rawToSS=(r,m)=>{const t=NM[gp(m)];for(const v of t)if(r>=v.n&&r<=v.x)return v.s;return t[t.length-1].s};
const ssToAgeEq=ss=>ss<=55?"<0;3":ss<=70?"Desfase significativo":ss<=85?"Desfase leve":ss<=115?"Acorde a edad":"Superior a edad";
const itp=s=>s>=115?{t:"Superior al promedio",c:"#059669"}:s>=86?{t:"Dentro del promedio",c:"#2563eb"}:s>=78?{t:"Riesgo - Desfase leve",c:"#d97706"}:{t:"D\u00e9ficit significativo",c:"#dc2626"};
const gm=(b,e)=>{const B=new Date(b),E=new Date(e);let m=(E.getFullYear()-B.getFullYear())*12+E.getMonth()-B.getMonth();if(E.getDate()<B.getDate())m--;return Math.max(0,m)};
const fa=m=>`${Math.floor(m/12)} a\u00f1os, ${m%12} meses`;

export default function App(){
  const[user,sU]=useState(null),[view,sV]=useState("dash"),[evals,sE]=useState([]),[peffEvals,sPE]=useState([]);
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
  const saveEval=async(ev)=>{
    const ssR=rawToSS(ev.rR,ev.a),ssE2=rawToSS(ev.rE,ev.a),ssT=Math.round((ssR+ssE2)/2);
    const newEv={id:Date.now()+"",paciente:ev.pN,fechaNacimiento:ev.birth,fechaEvaluacion:ev.eD,establecimiento:ev.sch,derivadoPor:ev.ref,edadMeses:ev.a,brutoReceptivo:ev.rR,brutoExpresivo:ev.rE,ssReceptivo:ssR,pcReceptivo:ssToPercentile(ssR),aeReceptivo:ssToAgeEq(ssR),ssExpresivo:ssE2,pcExpresivo:ssToPercentile(ssE2),aeExpresivo:ssToAgeEq(ssE2),ssTotal:ssT,pcTotal:ssToPercentile(ssT),interpretacion:itp(ssT).t,observaciones:ev.obs||"",evaluador:user?.un||"",fechaGuardado:new Date().toISOString(),respuestas:ev.rsp||{}};
    const res=await fbAdd("evaluaciones",newEv);
    if(res.success){nfy("Evaluaci\u00f3n ELDI guardada","ok");await loadEvals()}else nfy("Error: "+res.error,"er");sV("dash");
  };
  const savePeff=async(data)=>{
    const res=await fbAdd("peff_evaluaciones",{id:Date.now()+"",evaluador:user?.un||"",fechaGuardado:new Date().toISOString(),...data});
    if(res.success){nfy("Evaluaci\u00f3n PEFF guardada","ok");await loadEvals()}else nfy("Error: "+res.error,"er");sV("dash");
  };
  const deleteEval=async(fbId,colName="evaluaciones")=>{
    if(!user?.adm)return;const res=await fbDelete(colName,fbId);
    if(res.success){nfy("Eliminada","ok");await loadEvals()}else nfy("Error: "+res.error,"er");sS(null);sV("hist");
  };
  if(!user)return<Login onOk={u=>{sU(u);nfy("Bienvenido/a, "+u.un,"ok")}}/>;
  const nav=mobile?[["hist","\u23f1","Historial"]]:[["dash","\u229e","Panel"],["tools","\ud83e\uddf0","Herramientas"],["hist","\u23f1","Historial"]];
  if(user.adm&&!mobile)nav.push(["adm","\u2699","Usuarios"]);
  return(
    <div style={{display:"flex",height:"100vh",width:"100vw",fontFamily:"'DM Sans',system-ui,sans-serif",background:K.bg,color:"#1e293b",overflow:"hidden"}}>
      <aside style={{width:mobile?60:230,minWidth:mobile?60:230,background:K.sd,color:"#fff",display:"flex",flexDirection:"column",padding:"18px 0",flexShrink:0,height:"100vh"}}>
        <div style={{padding:"0 14px",marginBottom:26,display:"flex",alignItems:"center",gap:9}}><span style={{fontSize:28}}>{"🧭"}</span>{!mobile&&<div><div style={{fontSize:17,fontWeight:700}}>{"Brújula KIT"}</div><div style={{fontSize:9,color:"#5eead4",fontWeight:600,letterSpacing:"1px"}}>{"FONOAUDIOLOGÍA"}</div></div>}</div>
        <nav style={{flex:1}}>{nav.map(([id,ic,lb])=><button key={id} onClick={()=>{sV(id);sS(null)}} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:mobile?"13px 0":"11px 18px",background:view===id?"rgba(94,234,212,.12)":"transparent",border:"none",color:view===id?"#5eead4":"rgba(255,255,255,.6)",cursor:"pointer",fontSize:14,fontWeight:view===id?600:400,borderLeft:view===id?"3px solid #5eead4":"3px solid transparent",textAlign:"left",justifyContent:mobile?"center":"flex-start"}}><span>{ic}</span>{!mobile&&<span>{lb}</span>}</button>)}</nav>
        <div style={{padding:"0 14px",borderTop:"1px solid rgba(255,255,255,.1)",paddingTop:12}}>{!mobile&&<div style={{fontSize:10,color:"rgba(255,255,255,.45)",marginBottom:5}}>{"Sesión: "}<b style={{color:"#5eead4"}}>{user.un}</b>{user.adm&&<span style={{background:"#5eead4",color:K.sd,padding:"1px 5px",borderRadius:3,fontSize:8,marginLeft:6,fontWeight:700}}>ADMIN</span>}</div>}<button onClick={()=>{sU(null);sV("dash");sS(null)}} style={{background:"rgba(255,255,255,.08)",border:"none",color:"rgba(255,255,255,.6)",padding:"7px 12px",borderRadius:6,cursor:"pointer",fontSize:mobile?16:12,width:"100%"}}>{mobile?"\u21a9":"↩ Cerrar sesión"}</button></div>
      </aside>
      <main style={{flex:1,overflowY:"auto",overflowX:"hidden",padding:mobile?"16px":"28px 36px",height:"100vh"}}>
        {toast&&<div style={{position:"fixed",top:16,right:16,zIndex:999,background:toast.t==="ok"?"#059669":"#dc2626",color:"#fff",padding:"10px 18px",borderRadius:8,fontSize:13,fontWeight:500,boxShadow:"0 4px 16px rgba(0,0,0,.15)",animation:"fi .3s ease"}}>{toast.m}</div>}
        {mobile&&<div style={{background:"#fef3c7",padding:"12px 16px",borderRadius:8,border:"1px solid #fde68a",fontSize:13,color:"#92400e",marginBottom:16}}>{"📱 Modo móvil: solo lectura."}</div>}
        {view==="dash"&&!mobile&&<Dash es={evals} pe={peffEvals} onT={()=>sV("tools")} onV={e=>{sS(e);sV("rpt")}} onVP={e=>{sS(e);sV("rptP")}} ld={loading}/>}
        {view==="tools"&&!mobile&&<Tools onSel={t=>sV(t)}/>}
        {view==="newELDI"&&!mobile&&<NewELDI onS={saveEval} nfy={nfy}/>}
        {view==="newPEFF"&&!mobile&&<NewPEFF onS={savePeff} nfy={nfy}/>}
        {view==="hist"&&<Hist es={evals} pe={peffEvals} onV={e=>{sS(e);sV("rpt")}} onVP={e=>{sS(e);sV("rptP")}} isA={user.adm} onD={deleteEval}/>}
        {view==="rpt"&&sel&&<RptELDI ev={sel} isA={user.adm} onD={deleteEval}/>}
        {view==="rptP"&&sel&&<RptPEFF ev={sel} isA={user.adm} onD={deleteEval}/>}
        {view==="adm"&&user.adm&&!mobile&&<Admin nfy={nfy}/>}
      </main>
    </div>
  );
}

function Login({onOk}){
  const[u,su]=useState(""),[p,sp]=useState(""),[ld,sl]=useState(false),[e,se]=useState(""),[info,setInfo]=useState("");
  const go=async ev=>{ev.preventDefault();sl(true);se("");setInfo("");
    try{
      console.log("=== LOGIN DEBUG START ===");
      console.log("1. Intentando leer colección 'usuarios'...");
      let users=await fbGetAll("usuarios");
      console.log("2. Usuarios encontrados:", users.length, JSON.stringify(users));
      if(users.length===0){
        setInfo("BD vacía. Creando admin...");
        console.log("3. Colección vacía — intentando addDoc...");
        try{
          const ref = await addDoc(collection(db, "usuarios"), {usuario:"CalaAdmin976",contrasena:"BrujulaKit2025!"});
          console.log("4. addDoc exitoso! ID:", ref.id);
        }catch(addErr){
          console.error("4. ERROR en addDoc:", addErr.code, addErr.message, addErr);
          se("Error creando usuario: " + addErr.code + " - " + addErr.message);
          sl(false);
          return;
        }
        console.log("5. Re-leyendo usuarios...");
        users=await fbGetAll("usuarios");
        console.log("6. Usuarios después de seed:", users.length, JSON.stringify(users));
        setInfo("");
      }
      const found=users.find(usr=>{
        const dbUser = (usr.usuario||"").trim();
        const dbPass = (usr.contrasena||"").trim();
        const inUser = u.trim();
        const inPass = p.trim();
        console.log("Comparando:", JSON.stringify(dbUser), "===", JSON.stringify(inUser), "->", dbUser===inUser, "| pass:", JSON.stringify(dbPass), "===", JSON.stringify(inPass), "->", dbPass===inPass);
        return dbUser===inUser && dbPass===inPass;
      });
      if(found){console.log("=== LOGIN OK ===");onOk({un:u.trim(),adm:u.trim()==="CalaAdmin976"});}
      else{console.log("=== LOGIN FAIL ===");se("Credenciales incorrectas. "+users.length+" usuarios en BD.");}
    }catch(err){console.error("Firebase login error:",err);se("Error Firebase: "+err.code+" - "+err.message)}
    sl(false);
  };
  const I={width:"100%",padding:"12px 14px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,background:"#f8faf9"};
  return(<div style={{width:"100vw",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(145deg,#0a3d2f,#0d7363)",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
    <div style={{background:"rgba(255,255,255,.97)",borderRadius:16,padding:"44px 36px",width:380,maxWidth:"90vw",boxShadow:"0 20px 50px rgba(0,0,0,.3)"}}>
      <div style={{textAlign:"center",marginBottom:28}}><div style={{display:"inline-flex",alignItems:"center",gap:9,marginBottom:8}}><span style={{fontSize:32}}>{"🧭"}</span><span style={{fontSize:26,fontWeight:700,color:"#0a3d2f"}}>{"Brújula KIT"}</span></div><p style={{color:"#64748b",fontSize:13}}>{"Sistema Integral de Evaluación Fonoaudiológica"}</p></div>
      <form onSubmit={go}>
        <div style={{marginBottom:14}}><label style={{fontSize:12,fontWeight:600,color:"#64748b",display:"block",marginBottom:5}}>{"Usuario"}</label><input value={u} onChange={e=>su(e.target.value)} style={I} placeholder="Ingrese su usuario" required/></div>
        <div style={{marginBottom:22}}><label style={{fontSize:12,fontWeight:600,color:"#64748b",display:"block",marginBottom:5}}>{"Contraseña"}</label><input type="password" value={p} onChange={e=>sp(e.target.value)} style={I} placeholder="Ingrese su contraseña" required/></div>
        {e&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626",padding:"10px 12px",borderRadius:8,fontSize:12,marginBottom:14}}>{e}</div>}
        {info&&<div style={{background:"#eff6ff",border:"1px solid #bfdbfe",color:"#2563eb",padding:"10px 12px",borderRadius:8,fontSize:12,marginBottom:14}}>{info}</div>}
        <button type="submit" disabled={ld} style={{width:"100%",padding:"13px",background:"#0d9488",color:"#fff",border:"none",borderRadius:8,fontSize:15,fontWeight:600,cursor:ld?"wait":"pointer",opacity:ld?.7:1}}>{ld?"Verificando...":"Iniciar sesión"}</button>
      </form>
      <p style={{textAlign:"center",marginTop:20,fontSize:10,color:"#94a3b8"}}>{"Brújula KIT v3.0"}</p>
    </div>
  </div>);
}

function Dash({es,pe,onT,onV,onVP,ld}){
  const all=[...es,...pe].sort((a,b)=>(b.fechaGuardado||"").localeCompare(a.fechaGuardado||""));const rc=all.slice(0,5);
  return(<div style={{animation:"fi .3s ease",width:"100%"}}>
    <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>{"🧭 Panel Principal"}</h1>
    <p style={{color:K.mt,fontSize:14,marginBottom:24}}>{"Resumen"}{ld?" — cargando...":""}</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:16,marginBottom:28}}>
      {[["📋","ELDI",es.length],["🔊","PEFF",pe.length],["👶","Pacientes",new Set([...es.map(e=>e.paciente),...pe.map(e=>e.paciente)]).size]].map(([ic,lb,v],i)=><div key={i} style={{background:"#fff",borderRadius:12,padding:22,border:"1px solid #e2e8f0"}}><div style={{fontSize:28,marginBottom:6}}>{ic}</div><div style={{fontSize:28,fontWeight:700}}>{v}</div><div style={{fontSize:13,color:K.mt,marginTop:2}}>{lb}</div></div>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <button onClick={onT} style={{background:"linear-gradient(135deg,#0a3d2f,#0d9488)",color:"#fff",border:"none",borderRadius:14,padding:"28px 24px",cursor:"pointer",display:"flex",alignItems:"center",gap:16,textAlign:"left"}}><div style={{width:52,height:52,borderRadius:12,background:"rgba(255,255,255,.14)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{"🧰"}</div><div><div style={{fontSize:18,fontWeight:700}}>{"Herramientas"}</div><div style={{fontSize:13,opacity:.8,marginTop:4}}>{"Nueva evaluación"}</div></div></button>
      <div style={{background:"#fff",borderRadius:14,padding:22,border:"1px solid #e2e8f0"}}><h3 style={{fontSize:15,fontWeight:600,marginBottom:14}}>{"Recientes"}</h3>
        {rc.length===0?<p style={{color:K.mt,fontSize:13}}>{"Sin evaluaciones."}</p>:rc.map(ev=>{const isP=!!ev.seccionData;return(<div key={ev._fbId||ev.id} onClick={()=>isP?onVP(ev):onV(ev)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #e2e8f0",cursor:"pointer"}}><div><div style={{fontWeight:600,fontSize:14}}>{ev.paciente}</div><div style={{fontSize:11,color:K.mt}}>{isP?"PEFF":"ELDI"}{" · "}{new Date(ev.fechaGuardado).toLocaleDateString("es-CL")}</div></div><span style={{color:K.mt}}>{"→"}</span></div>)})}
      </div>
    </div>
  </div>);
}

function Tools({onSel}){
  const tools=[{id:"newELDI",icon:"📋",name:"ELDI",full:"Evaluación del Lenguaje y Desarrollo Infantil",desc:"Comprensión auditiva y comunicación expresiva (55+55 ítems) de 0 a 7 años.",age:"0-7;11",time:"~30-45 min",color:"#0d9488"},{id:"newPEFF",icon:"🔊",name:"PEFF",full:"Protocolo Fonético-Fonológico",desc:"OFA, diadococinesis, sílabas, discriminación y reconocimiento fonológico.",age:"2;6-6;11",time:"~45-60 min",color:"#7c3aed"}];
  return(<div style={{animation:"fi .3s ease",width:"100%"}}>
    <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>{"🧰 Herramientas"}</h1>
    <p style={{color:K.mt,fontSize:14,marginBottom:24}}>{"Seleccione evaluación"}</p>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      {tools.map(t=><div key={t.id} onClick={()=>onSel(t.id)} style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden",cursor:"pointer"}}>
        <div style={{background:`linear-gradient(135deg,${t.color},${t.color}aa)`,padding:"24px 24px 20px",color:"#fff"}}><div style={{fontSize:36,marginBottom:8}}>{t.icon}</div><div style={{fontSize:22,fontWeight:700}}>{t.name}</div><div style={{fontSize:12,opacity:.85,marginTop:2}}>{t.full}</div></div>
        <div style={{padding:"20px 24px"}}><p style={{fontSize:13,color:"#475569",lineHeight:1.6,marginBottom:16}}>{t.desc}</p><div style={{display:"flex",gap:16,fontSize:12,color:K.mt}}><span>{"👶 "}{t.age}</span><span>{"⏱ "}{t.time}</span></div><button style={{marginTop:16,width:"100%",padding:"11px",background:t.color,color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{"Iniciar →"}</button></div>
      </div>)}
    </div>
  </div>);
}
