import { useState, useEffect, useCallback } from "react";
import { db, auth, collection, addDoc, getDocs, deleteDoc, doc, query, where, updateDoc, getDoc, setDoc, increment, orderBy, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, onAuthStateChanged, signOut } from "./firebase.js";
import Hist from "./components/Hist.jsx";
import RptELDI from "./components/RptELDI.jsx";
import RptPEFF from "./components/RptPEFF.jsx";
import Admin from "./components/Admin.jsx";
import NewELDI from "./components/NewELDI.jsx";
import NewPEFF from "./components/NewPEFF.jsx";

const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && window.innerWidth < 900;
const K = { sd: "#0a3d2f", ac: "#0d9488", al: "#ccfbf1", mt: "#64748b", bd: "#e2e8f0", bg: "#f0f5f3" };
const ADMIN_EMAIL = "calaadmin976@brujulakit.com";

async function fbGetFiltered(c, userId) {
  const q2 = query(collection(db, c), where("userId", "==", userId));
  const s = await getDocs(q2);
  return s.docs.map(d => ({ _fbId: d.id, ...d.data() }));
}
async function fbGetAll(c) { const s = await getDocs(collection(db, c)); return s.docs.map(d => ({ _fbId: d.id, ...d.data() })); }
async function fbAdd(c, data) { try { const r = await addDoc(collection(db, c), data); return { success: true, id: r.id }; } catch (e) { return { success: false, error: e.message }; } }
async function fbDelete(c, id) { try { await deleteDoc(doc(db, c, id)); return { success: true }; } catch (e) { return { success: false, error: e.message }; } }

async function getUserProfile(uid) {
  const d = await getDoc(doc(db, "usuarios", uid));
  return d.exists() ? { _fbId: d.id, ...d.data() } : null;
}

async function generateUsername(nombre, apellido) {
  const base = (nombre.charAt(0) + apellido).toLowerCase().replace(/[^a-z0-9]/g, "").substring(0, 12);
  const existing = await fbGetAll("usuarios");
  const usernames = existing.map(u => u.username || "");
  let candidate = base;
  let n = 1;
  while (usernames.includes(candidate)) { candidate = base + n; n++; }
  return candidate;
}

export default function App() {
  const [authUser, setAuthUser] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [view, sV] = useState("dash");
  const [evals, sE] = useState([]);
  const [peffEvals, sPE] = useState([]);
  const [sel, sS] = useState(null);
  const [toast, sT] = useState(null);
  const [loading, sL] = useState(false);
  const [mobile] = useState(isMobile());
  const nfy = useCallback((m, t) => { sT({ m, t }); setTimeout(() => sT(null), 3500); }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        if (u.emailVerified) {
          const prof = await getUserProfile(u.uid);
          if (prof && prof.profileComplete) setProfile(prof);
          else setProfile(null);
        }
        setAuthUser(u);
      } else { setAuthUser(null); setProfile(null); }
    });
    return unsub;
  }, []);

  const loadEvals = useCallback(async () => {
    if (!profile) return;
    sL(true);
    try {
      let eldi, peff;
      if (profile.role === "admin") { eldi = await fbGetAll("evaluaciones"); peff = await fbGetAll("peff_evaluaciones"); }
      else { eldi = await fbGetFiltered("evaluaciones", authUser.uid); peff = await fbGetFiltered("peff_evaluaciones", authUser.uid); }
      sE(eldi.sort((a, b) => (b.fechaGuardado || "").localeCompare(a.fechaGuardado || "")));
      sPE(peff.sort((a, b) => (b.fechaGuardado || "").localeCompare(a.fechaGuardado || "")));
    } catch (e) { console.error(e); }
    sL(false);
  }, [profile, authUser]);

  useEffect(() => { if (profile) loadEvals(); }, [profile, loadEvals]);

  const navTo = (v) => { if ((view === "newELDI" || view === "newPEFF") && v !== view) { if (!window.confirm("Salir sin guardar?")) return; } sV(v); sS(null); };

  const checkCredits = () => {
    if (!profile) return false;
    if (profile.role === "admin") return true;
    if ((profile.creditos || 0) < 1) { nfy("Sin cr\u00e9ditos. Contacte al administrador.", "er"); return false; }
    return true;
  };

  const deductCredit = async () => {
    if (profile.role === "admin") return;
    try { await updateDoc(doc(db, "usuarios", authUser.uid), { creditos: increment(-1) }); setProfile(p => ({ ...p, creditos: (p.creditos || 0) - 1 })); } catch (e) { console.error(e); }
  };

  const saveEval = async (ev) => {
    const rspClean = {};
    if (ev.rsp) { Object.entries(ev.rsp).forEach(([k, v]) => { if (v === true) rspClean[k] = true; else if (v === false) rspClean[k] = false; }); }
    const newEv = { id: Date.now() + "", userId: authUser.uid, paciente: ev.pN, fechaNacimiento: ev.birth, fechaEvaluacion: ev.eD, establecimiento: ev.sch, derivadoPor: ev.ref, edadMeses: ev.a, evalRec: ev.evalRec || false, evalExp: ev.evalExp || false, brutoReceptivo: ev.rR, brutoExpresivo: ev.rE, recRes: ev.recRes || null, expRes: ev.expRes || null, allNoEval: ev.allNoEval || [], observaciones: ev.obs || "", evaluador: profile?.nombre ? (profile.nombre + " " + profile.apellido) : profile?.username || "", fechaGuardado: new Date().toISOString(), respuestas: rspClean };
    const res = await fbAdd("evaluaciones", newEv);
    if (res.success) { await deductCredit(); nfy("ELDI guardada", "ok"); await loadEvals(); } else nfy("Error: " + res.error, "er");
    sV("dash");
  };

  const savePeff = async (data) => {
    const res = await fbAdd("peff_evaluaciones", { id: Date.now() + "", userId: authUser.uid, evaluador: profile?.nombre ? (profile.nombre + " " + profile.apellido) : profile?.username || "", fechaGuardado: new Date().toISOString(), ...data });
    if (res.success) { await deductCredit(); nfy("PEFF guardada", "ok"); await loadEvals(); } else nfy("Error: " + res.error, "er");
    sV("dash");
  };

  const deleteEval = async (fbId, colName = "evaluaciones") => {
    if (profile?.role !== "admin") return;
    const res = await fbDelete(colName, fbId);
    if (res.success) { nfy("Eliminada", "ok"); await loadEvals(); } else nfy("Error: " + res.error, "er");
    sS(null); sV("hist");
  };

  const handleLogout = async () => { await signOut(auth); setAuthUser(null); setProfile(null); sV("dash"); sS(null); };

  if (authUser === undefined) return <div style={{width:"100vw",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0a3d2f",color:"#fff",fontFamily:"'DM Sans',system-ui,sans-serif"}}><div style={{textAlign:"center"}}><div style={{fontSize:48,marginBottom:16}}>{"\uD83E\uDDED"}</div><div style={{fontSize:20,fontWeight:700}}>Cargando...</div></div></div>;

  if (!authUser) return <AuthScreen onDone={(u, p) => { setAuthUser(u); setProfile(p); }} />;
  if (authUser && !authUser.emailVerified) return <VerifyEmailScreen user={authUser} onLogout={handleLogout} />;
  if (authUser && authUser.emailVerified && !profile) return <CompleteProfileScreen uid={authUser.uid} email={authUser.email} onDone={p => setProfile(p)} />;

  const isAdmin = profile?.role === "admin";
  const nav = [["dash", "\u229E", "Panel"], ["tools", "\uD83E\uDDF0", "Herramientas"], ["hist", "\u23F1", "Historial"]];
  if (isAdmin) nav.push(["adm", "\u2699", "Usuarios"]);

  return (
    <div style={{display:"flex",height:"100vh",width:"100vw",fontFamily:"'DM Sans',system-ui,sans-serif",background:K.bg,color:"#1e293b",overflow:"hidden"}}>
      <aside style={{width:mobile?60:230,minWidth:mobile?60:230,background:K.sd,color:"#fff",display:"flex",flexDirection:"column",padding:"18px 0",flexShrink:0,height:"100vh"}}>
        <div style={{padding:"0 14px",marginBottom:26,display:"flex",alignItems:"center",gap:9}}>
          <span style={{fontSize:28}}>{"\uD83E\uDDED"}</span>
          {!mobile&&<div><div style={{fontSize:17,fontWeight:700}}>{"Br\u00FAjula KIT"}</div><div style={{fontSize:9,color:"#5eead4",fontWeight:600,letterSpacing:"1px"}}>{"FONOAUDIOLOG\u00CDA"}</div></div>}
        </div>
        <nav style={{flex:1}}>{nav.map(([id,ic,lb])=><button key={id} onClick={()=>navTo(id)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:mobile?"13px 0":"11px 18px",background:view===id?"rgba(94,234,212,.12)":"transparent",border:"none",color:view===id?"#5eead4":"rgba(255,255,255,.6)",cursor:"pointer",fontSize:14,fontWeight:view===id?600:400,borderLeft:view===id?"3px solid #5eead4":"3px solid transparent",textAlign:"left",justifyContent:mobile?"center":"flex-start"}}><span>{ic}</span>{!mobile&&<span>{lb}</span>}</button>)}</nav>
        <div style={{padding:"0 14px",borderTop:"1px solid rgba(255,255,255,.1)",paddingTop:12}}>
          {!mobile&&<div style={{fontSize:10,color:"rgba(255,255,255,.45)",marginBottom:3}}>{"Sesi\u00F3n: "}<b style={{color:"#5eead4"}}>{profile.username}</b>{isAdmin&&<span style={{background:"#5eead4",color:K.sd,padding:"1px 5px",borderRadius:3,fontSize:8,marginLeft:6,fontWeight:700}}>ADMIN</span>}</div>}
          {!mobile&&<div style={{fontSize:10,color:"rgba(255,255,255,.35)",marginBottom:8}}>{"Cr\u00E9ditos: "}<b style={{color:profile.creditos>0?"#5eead4":"#f87171"}}>{isAdmin?"\u221E":(profile.creditos||0)}</b></div>}
          <button onClick={handleLogout} style={{background:"rgba(255,255,255,.08)",border:"none",color:"rgba(255,255,255,.6)",padding:"7px 12px",borderRadius:6,cursor:"pointer",fontSize:mobile?16:12,width:"100%"}}>{mobile?"\u21A9":"\u21A9 Cerrar sesi\u00F3n"}</button>
        </div>
      </aside>
      <main style={{flex:1,overflowY:"auto",overflowX:"hidden",padding:mobile?"16px":"28px 36px",height:"100vh"}}>
        {toast&&<div style={{position:"fixed",top:16,right:16,zIndex:999,background:toast.t==="ok"?"#059669":"#dc2626",color:"#fff",padding:"10px 18px",borderRadius:8,fontSize:13,fontWeight:500,boxShadow:"0 4px 16px rgba(0,0,0,.15)",animation:"fi .3s ease"}}>{toast.m}</div>}
        {view==="dash"&&<Dash es={evals} pe={peffEvals} onT={()=>navTo("tools")} onV={e=>{sS(e);sV("rpt")}} onVP={e=>{sS(e);sV("rptP")}} ld={loading} profile={profile} isAdmin={isAdmin}/>}
        {view==="tools"&&<Tools onSel={t=>{if(checkCredits())sV(t)}} credits={isAdmin?999:(profile.creditos||0)}/>}
        {view==="newELDI"&&<NewELDI onS={saveEval} nfy={nfy}/>}
        {view==="newPEFF"&&<NewPEFF onS={savePeff} nfy={nfy}/>}
        {view==="hist"&&<Hist es={evals} pe={peffEvals} onV={e=>{sS(e);sV("rpt")}} onVP={e=>{sS(e);sV("rptP")}} isA={isAdmin} onD={deleteEval}/>}
        {view==="rpt"&&sel&&<RptELDI ev={sel} isA={isAdmin} onD={deleteEval}/>}
        {view==="rptP"&&sel&&<RptPEFF ev={sel} isA={isAdmin} onD={deleteEval}/>}
        {view==="adm"&&isAdmin&&<Admin nfy={nfy}/>}
      </main>
    </div>
  );
}

function AuthScreen({ onDone }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [ld, setLd] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState("");
  const I = { width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, background: "#f8faf9" };

  const handleLogin = async (ev) => {
    ev.preventDefault(); setLd(true); setErr(""); setInfo("");
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const u = cred.user;
      if (!u.emailVerified) { setLd(false); return; }
      const prof = await getUserProfile(u.uid);
      if (prof && prof.profileComplete) onDone(u, prof);
    } catch (e) {
      if (e.code === "auth/user-not-found" || e.code === "auth/invalid-credential") setErr("Email o contrase\u00F1a incorrectos.");
      else if (e.code === "auth/wrong-password") setErr("Contrase\u00F1a incorrecta.");
      else if (e.code === "auth/too-many-requests") setErr("Demasiados intentos. Espere unos minutos.");
      else setErr("Error: " + e.message);
    }
    setLd(false);
  };

  const handleRegister = async (ev) => {
    ev.preventDefault(); setLd(true); setErr(""); setInfo("");
    if (pass.length < 6) { setErr("La contrase\u00F1a debe tener al menos 6 caracteres."); setLd(false); return; }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      await sendEmailVerification(cred.user);
      setInfo("Se envi\u00F3 un email de verificaci\u00F3n a " + email.trim() + ". Revise su bandeja (y spam).");
    } catch (e) {
      if (e.code === "auth/email-already-in-use") setErr("Ya existe una cuenta con ese email.");
      else if (e.code === "auth/invalid-email") setErr("Email inv\u00E1lido.");
      else setErr("Error: " + e.message);
    }
    setLd(false);
  };

  return (
    <div style={{width:"100vw",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(145deg,#0a3d2f,#0d7363)",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <div style={{background:"rgba(255,255,255,.97)",borderRadius:16,padding:"44px 36px",width:400,maxWidth:"92vw",boxShadow:"0 20px 50px rgba(0,0,0,.3)"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:9,marginBottom:8}}><span style={{fontSize:32}}>{"\uD83E\uDDED"}</span><span style={{fontSize:26,fontWeight:700,color:"#0a3d2f"}}>{"Br\u00FAjula KIT"}</span></div>
          <p style={{color:"#64748b",fontSize:13}}>{"Sistema Integral de Evaluaci\u00F3n Fonoaudiol\u00F3gica"}</p>
        </div>
        <div style={{display:"flex",marginBottom:22,borderRadius:8,overflow:"hidden",border:"1px solid #e2e8f0"}}>
          {[["login","Iniciar sesi\u00F3n"],["register","Crear cuenta"]].map(([id,lb])=>(
            <button key={id} onClick={()=>{setMode(id);setErr("");setInfo("")}} style={{flex:1,padding:"10px",border:"none",background:mode===id?"#0d9488":"#f8faf9",color:mode===id?"#fff":"#64748b",fontSize:13,fontWeight:600,cursor:"pointer"}}>{lb}</button>
          ))}
        </div>
        <form onSubmit={mode==="login"?handleLogin:handleRegister}>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:12,fontWeight:600,color:"#64748b",display:"block",marginBottom:5}}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} style={I} placeholder="correo@ejemplo.com" required/>
          </div>
          <div style={{marginBottom:22}}>
            <label style={{fontSize:12,fontWeight:600,color:"#64748b",display:"block",marginBottom:5}}>{"Contrase\u00F1a"}</label>
            <input type="password" value={pass} onChange={e=>setPass(e.target.value)} style={I} placeholder={mode==="register"?"M\u00EDnimo 6 caracteres":"Su contrase\u00F1a"} required/>
          </div>
          {err&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626",padding:"10px 12px",borderRadius:8,fontSize:12,marginBottom:14}}>{err}</div>}
          {info&&<div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",color:"#059669",padding:"10px 12px",borderRadius:8,fontSize:12,marginBottom:14}}>{info}</div>}
          <button type="submit" disabled={ld} style={{width:"100%",padding:"13px",background:"#0d9488",color:"#fff",border:"none",borderRadius:8,fontSize:15,fontWeight:600,cursor:ld?"wait":"pointer",opacity:ld?.7:1}}>
            {ld?"Procesando...":mode==="login"?"Iniciar sesi\u00F3n":"Crear cuenta"}
          </button>
        </form>
        <p style={{textAlign:"center",marginTop:20,fontSize:10,color:"#94a3b8"}}>{"Br\u00FAjula KIT v5.0"}</p>
      </div>
    </div>
  );
}

function VerifyEmailScreen({ user, onLogout }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const resend = async () => { setSending(true); try { await sendEmailVerification(user); setSent(true); } catch(e){} setSending(false); };
  return (
    <div style={{width:"100vw",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(145deg,#0a3d2f,#0d7363)",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <div style={{background:"rgba(255,255,255,.97)",borderRadius:16,padding:"44px 36px",width:420,maxWidth:"92vw",boxShadow:"0 20px 50px rgba(0,0,0,.3)",textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>{"\uD83D\uDCE7"}</div>
        <h2 style={{fontSize:20,fontWeight:700,color:"#0a3d2f",marginBottom:10}}>Verifique su email</h2>
        <p style={{color:"#64748b",fontSize:14,lineHeight:1.6,marginBottom:20}}>{"Enviamos un enlace de verificaci\u00F3n a "}<b style={{color:"#0d9488"}}>{user.email}</b>{". Haga clic en el enlace y vuelva aqu\u00ED."}</p>
        <p style={{color:"#94a3b8",fontSize:12,marginBottom:20}}>{"Revise tambi\u00E9n su carpeta de spam."}</p>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={()=>window.location.reload()} style={{background:"#0d9488",color:"#fff",border:"none",padding:"12px 24px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{"Ya verifiqu\u00E9 \u2192"}</button>
          <button onClick={resend} disabled={sending||sent} style={{background:"#f1f5f9",border:"none",padding:"12px 24px",borderRadius:8,fontSize:14,cursor:sending?"wait":"pointer",color:"#64748b"}}>{sent?"\u2713 Reenviado":sending?"Enviando...":"Reenviar email"}</button>
        </div>
        <button onClick={onLogout} style={{marginTop:20,background:"none",border:"none",color:"#94a3b8",fontSize:12,cursor:"pointer",textDecoration:"underline"}}>{"Cerrar sesi\u00F3n"}</button>
      </div>
    </div>
  );
}

function CompleteProfileScreen({ uid, email, onDone }) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [dni, setDni] = useState("");
  const [ld, setLd] = useState(false);
  const [err, setErr] = useState("");
  const [genUser, setGenUser] = useState("");
  const I = { width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, background: "#f8faf9" };

  useEffect(() => { (async () => { const existing = await getUserProfile(uid); if (existing && existing.profileComplete) onDone(existing); })(); }, [uid]);

  const handleSubmit = async (ev) => {
    ev.preventDefault(); setLd(true); setErr("");
    if (!nombre.trim() || !apellido.trim() || !dni.trim()) { setErr("Complete todos los campos."); setLd(false); return; }
    try {
      const username = await generateUsername(nombre.trim(), apellido.trim());
      const isAdminUser = email === ADMIN_EMAIL;
      const profileData = { uid, email, nombre: nombre.trim(), apellido: apellido.trim(), dni: dni.trim(), username, creditos: 5, role: isAdminUser ? "admin" : "user", profileComplete: true, createdAt: new Date().toISOString() };
      await setDoc(doc(db, "usuarios", uid), profileData);
      setGenUser(username);
      setTimeout(() => onDone(profileData), 2500);
    } catch (e) { setErr("Error: " + e.message); }
    setLd(false);
  };

  if (genUser) return (
    <div style={{width:"100vw",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(145deg,#0a3d2f,#0d7363)",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <div style={{background:"rgba(255,255,255,.97)",borderRadius:16,padding:"44px 36px",width:420,maxWidth:"92vw",textAlign:"center",boxShadow:"0 20px 50px rgba(0,0,0,.3)"}}>
        <div style={{fontSize:48,marginBottom:16}}>{"\u2705"}</div>
        <h2 style={{fontSize:20,fontWeight:700,color:"#0a3d2f",marginBottom:10}}>Cuenta creada</h2>
        <p style={{color:"#64748b",fontSize:14,marginBottom:20}}>Su nombre de usuario es:</p>
        <div style={{background:"#ccfbf1",borderRadius:10,padding:"16px 24px",fontSize:24,fontWeight:700,color:"#0d9488",marginBottom:16}}>{genUser}</div>
        <p style={{color:"#94a3b8",fontSize:12}}>{"Tiene 5 cr\u00E9ditos de prueba. Ingresando..."}</p>
      </div>
    </div>
  );

  return (
    <div style={{width:"100vw",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(145deg,#0a3d2f,#0d7363)",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <div style={{background:"rgba(255,255,255,.97)",borderRadius:16,padding:"44px 36px",width:420,maxWidth:"92vw",boxShadow:"0 20px 50px rgba(0,0,0,.3)"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:40,marginBottom:8}}>{"\uD83D\uDCDD"}</div>
          <h2 style={{fontSize:20,fontWeight:700,color:"#0a3d2f"}}>Complete su perfil</h2>
          <p style={{color:"#64748b",fontSize:13,marginTop:4}}>{email}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom:14}}><label style={{fontSize:12,fontWeight:600,color:"#64748b",display:"block",marginBottom:5}}>Nombre</label><input value={nombre} onChange={e=>setNombre(e.target.value)} style={I} placeholder="Nombre del profesional" required/></div>
          <div style={{marginBottom:14}}><label style={{fontSize:12,fontWeight:600,color:"#64748b",display:"block",marginBottom:5}}>Apellido</label><input value={apellido} onChange={e=>setApellido(e.target.value)} style={I} placeholder="Apellido" required/></div>
          <div style={{marginBottom:22}}><label style={{fontSize:12,fontWeight:600,color:"#64748b",display:"block",marginBottom:5}}>DNI</label><input value={dni} onChange={e=>setDni(e.target.value)} style={I} placeholder={"N\u00FAmero de documento"} required/></div>
          {err&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626",padding:"10px 12px",borderRadius:8,fontSize:12,marginBottom:14}}>{err}</div>}
          <button type="submit" disabled={ld} style={{width:"100%",padding:"13px",background:"#0d9488",color:"#fff",border:"none",borderRadius:8,fontSize:15,fontWeight:600,cursor:ld?"wait":"pointer",opacity:ld?.7:1}}>{ld?"Creando perfil...":"Completar registro"}</button>
        </form>
      </div>
    </div>
  );
}

function Dash({ es, pe, onT, onV, onVP, ld, profile, isAdmin }) {
  const all = [...es, ...pe].sort((a, b) => (b.fechaGuardado || "").localeCompare(a.fechaGuardado || ""));
  const rc = all.slice(0, 5);
  return (
    <div style={{animation:"fi .3s ease",width:"100%"}}>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>{"\uD83E\uDDED Panel Principal"}</h1>
      <p style={{color:K.mt,fontSize:14,marginBottom:24}}>{"Bienvenido/a, "}{profile?.nombre || profile?.username}{ld?" \u2014 cargando...":""}</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:16,marginBottom:28}}>
        {[["\uD83D\uDCCB","ELDI",es.length],["\uD83D\uDD0A","PEFF",pe.length],["\uD83D\uDC76","Pacientes",new Set([...es.map(e=>e.paciente),...pe.map(e=>e.paciente)]).size],["\uD83D\uDCB3","Cr\u00E9ditos",isAdmin?"\u221E":(profile?.creditos||0)]].map(([ic,lb,v],i)=>
          <div key={i} style={{background:"#fff",borderRadius:12,padding:22,border:"1px solid #e2e8f0"}}>
            <div style={{fontSize:28,marginBottom:6}}>{ic}</div>
            <div style={{fontSize:28,fontWeight:700}}>{v}</div>
            <div style={{fontSize:13,color:K.mt,marginTop:2}}>{lb}</div>
          </div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <button onClick={onT} style={{background:"linear-gradient(135deg,#0a3d2f,#0d9488)",color:"#fff",border:"none",borderRadius:14,padding:"28px 24px",cursor:"pointer",display:"flex",alignItems:"center",gap:16,textAlign:"left"}}>
          <div style={{width:52,height:52,borderRadius:12,background:"rgba(255,255,255,.14)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{"\uD83E\uDDF0"}</div>
          <div><div style={{fontSize:18,fontWeight:700}}>Herramientas</div><div style={{fontSize:13,opacity:.8,marginTop:4}}>{"Nueva evaluaci\u00F3n"}</div></div>
        </button>
        <div style={{background:"#fff",borderRadius:14,padding:22,border:"1px solid #e2e8f0"}}>
          <h3 style={{fontSize:15,fontWeight:600,marginBottom:14}}>Recientes</h3>
          {rc.length===0?<p style={{color:K.mt,fontSize:13}}>{"Sin evaluaciones a\u00FAn."}</p>:rc.map(ev=>{const isP=!!ev.seccionData;return(
            <div key={ev._fbId||ev.id} onClick={()=>isP?onVP(ev):onV(ev)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #e2e8f0",cursor:"pointer"}}>
              <div><div style={{fontWeight:600,fontSize:14}}>{ev.paciente}</div><div style={{fontSize:11,color:K.mt}}>{isP?"PEFF":"ELDI"}{" \u00B7 "}{new Date(ev.fechaGuardado).toLocaleDateString("es-CL")}</div></div>
              <span style={{color:K.mt}}>{"\u2192"}</span>
            </div>)})}
        </div>
      </div>
    </div>
  );
}

function Tools({ onSel, credits }) {
  const tools = [
    { id: "newELDI", icon: "\uD83D\uDCCB", name: "ELDI", full: "Evaluaci\u00F3n del Lenguaje y Desarrollo Infantil", desc: "Comprensi\u00F3n auditiva y comunicaci\u00F3n expresiva (55+55 \u00EDtems) de 0 a 7 a\u00F1os.", age: "0-7;11", time: "~30-45 min", color: "#0d9488" },
    { id: "newPEFF", icon: "\uD83D\uDD0A", name: "PEFF", full: "Protocolo Fon\u00E9tico-Fonol\u00F3gico", desc: "OFA, diadococinesis, s\u00EDlabas, discriminaci\u00F3n y reconocimiento fonol\u00F3gico.", age: "2;6-6;11", time: "~45-60 min", color: "#7c3aed" }
  ];
  return (
    <div style={{animation:"fi .3s ease",width:"100%"}}>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>{"\uD83E\uDDF0 Herramientas"}</h1>
      <p style={{color:K.mt,fontSize:14,marginBottom:8}}>{"Seleccione evaluaci\u00F3n"}</p>
      {credits<1&&<div style={{background:"#fef3c7",border:"1px solid #fde68a",borderRadius:10,padding:14,marginBottom:16,fontSize:13,color:"#92400e",fontWeight:600}}>{"\u26A0 Sin cr\u00E9ditos disponibles. Contacte al administrador."}</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        {tools.map(t=><div key={t.id} onClick={()=>onSel(t.id)} style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden",cursor:credits<1?"not-allowed":"pointer",opacity:credits<1?0.5:1}}>
          <div style={{background:`linear-gradient(135deg,${t.color},${t.color}aa)`,padding:"24px 24px 20px",color:"#fff"}}>
            <div style={{fontSize:36,marginBottom:8}}>{t.icon}</div><div style={{fontSize:22,fontWeight:700}}>{t.name}</div>
            <div style={{fontSize:12,opacity:.85,marginTop:2}}>{t.full}</div>
          </div>
          <div style={{padding:"20px 24px"}}>
            <p style={{fontSize:13,color:"#475569",lineHeight:1.6,marginBottom:16}}>{t.desc}</p>
            <div style={{display:"flex",gap:16,fontSize:12,color:K.mt}}><span>{"\uD83D\uDC76 "}{t.age}</span><span>{"\u23F1 "}{t.time}</span></div>
            <button style={{marginTop:16,width:"100%",padding:"11px",background:t.color,color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{"Iniciar \u2192"}</button>
          </div>
        </div>)}
      </div>
    </div>
  );
}
