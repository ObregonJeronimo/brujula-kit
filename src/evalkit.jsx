import { useState, useEffect, useCallback } from "react";
import { db, auth, collection, addDoc, getDocs, deleteDoc, doc, query, where, updateDoc, getDoc, setDoc, increment, orderBy, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, onAuthStateChanged, signOut } from "./firebase.js";
import Hist from "./components/Hist.jsx";
import RptELDI from "./components/RptELDI.jsx";
import RptPEFF from "./components/RptPEFF.jsx";
import Admin from "./components/Admin.jsx";
import NewELDI from "./components/NewELDI.jsx";
import NewPEFF from "./components/NewPEFF.jsx";
import CalendarPage from "./components/CalendarPage.jsx";

const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && window.innerWidth < 900;
const K = { sd: "#0a3d2f", ac: "#0d9488", al: "#ccfbf1", mt: "#64748b", bd: "#e2e8f0", bg: "#f0f5f3" };
const ADMIN_EMAIL = "valkyriumsolutions@gmail.com";

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

async function acquireSessionLock(uid, isAdmin) {
  if (isAdmin) return true;
  const lockRef = doc(db, "system", "active_session");
  try {
    const snap = await getDoc(lockRef);
    if (snap.exists()) {
      const data = snap.data();
      if (data.uid && data.uid !== uid) {
        const lockTime = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
        const diff = Date.now() - lockTime.getTime();
        if (diff < 2 * 60 * 60 * 1000) return false;
      }
    }
    await setDoc(lockRef, { uid, timestamp: new Date().toISOString() });
    return true;
  } catch (e) { console.error("Session lock error:", e); return true; }
}

async function releaseSessionLock(uid) {
  const lockRef = doc(db, "system", "active_session");
  try {
    const snap = await getDoc(lockRef);
    if (snap.exists() && snap.data().uid === uid) {
      await setDoc(lockRef, { uid: null, timestamp: null });
    }
  } catch (e) { console.error("Session release error:", e); }
}

function useSessionHeartbeat(uid, isAdmin) {
  useEffect(() => {
    if (!uid || isAdmin) return;
    const interval = setInterval(async () => {
      const lockRef = doc(db, "system", "active_session");
      try { await setDoc(lockRef, { uid, timestamp: new Date().toISOString() }); } catch(e){}
    }, 60000);
    return () => clearInterval(interval);
  }, [uid, isAdmin]);
}

function NoCreditsModal({ onClose, onUpgrade }) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.5)",backdropFilter:"blur(4px)",animation:"fi .25s ease"}}>
      <div style={{background:"#fff",borderRadius:20,padding:"40px 36px",width:440,maxWidth:"92vw",boxShadow:"0 25px 60px rgba(0,0,0,.25)",textAlign:"center",position:"relative"}}>
        <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"none",border:"none",fontSize:20,color:"#94a3b8",cursor:"pointer",lineHeight:1}}>{"\u00d7"}</button>
        <div style={{width:72,height:72,borderRadius:"50%",background:"linear-gradient(135deg,#fef3c7,#fde68a)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:36}}>{"\ud83d\udcb3"}</div>
        <h2 style={{fontSize:22,fontWeight:700,color:"#0a3d2f",marginBottom:8}}>{"Cr\u00e9ditos agotados"}</h2>
        <p style={{color:"#64748b",fontSize:14,lineHeight:1.7,marginBottom:8}}>Has utilizado todas las evaluaciones disponibles en tu <b style={{color:"#0d9488"}}>Plan Demo</b>.</p>
        <p style={{color:"#94a3b8",fontSize:13,lineHeight:1.6,marginBottom:28}}>{"Para continuar realizando evaluaciones profesionales con Br\u00fajula KIT, actualiz\u00e1 tu plan y acced\u00e9 a m\u00e1s cr\u00e9ditos."}</p>
        <button onClick={onUpgrade} style={{width:"100%",padding:"14px 24px",background:"linear-gradient(135deg,#0a3d2f,#0d9488)",color:"#fff",border:"none",borderRadius:12,fontSize:16,fontWeight:700,cursor:"pointer",marginBottom:12,boxShadow:"0 4px 16px rgba(13,148,136,.3)",letterSpacing:".3px"}}>{"\u2728 Actualizar a Premium"}</button>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#94a3b8",fontSize:13,cursor:"pointer",padding:8}}>Volver al panel</button>
      </div>
    </div>
  );
}

function ProfilePage({ profile, authUser, nfy }) {
  const [resetSending, setResetSending] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const handlePasswordReset = async () => {
    setResetSending(true);
    try { await sendPasswordResetEmail(auth, authUser.email); setResetSent(true); nfy("Email de recuperaci\u00f3n enviado", "ok"); } catch (e) { nfy("Error al enviar email: " + e.message, "er"); }
    setResetSending(false);
  };
  const isAdm = profile?.role === "admin";
  const credits = isAdm ? "\u221e" : (profile?.creditos || 0);
  const plan = isAdm ? "Administrador" : (profile?.plan || "Plan Demo");
  const planColor = isAdm ? "#0d9488" : "#f59e0b";
  const planBg = isAdm ? "#ccfbf1" : "#fef3c7";
  const InfoRow = ({ label, value, icon }) => (
    <div style={{display:"flex",alignItems:"center",gap:14,padding:"16px 0",borderBottom:"1px solid #f1f5f9"}}>
      <div style={{width:40,height:40,borderRadius:10,background:"#f0f5f3",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{icon}</div>
      <div style={{flex:1}}>
        <div style={{fontSize:11,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".5px",marginBottom:2}}>{label}</div>
        <div style={{fontSize:15,fontWeight:500,color:"#1e293b"}}>{value}</div>
      </div>
    </div>
  );
  return (
    <div style={{animation:"fi .3s ease",width:"100%",maxWidth:600}}>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>{"\ud83d\udc64 Mi Perfil"}</h1>
      <p style={{color:K.mt,fontSize:14,marginBottom:24}}>{"Informaci\u00f3n de tu cuenta"}</p>
      <div style={{background:"linear-gradient(135deg,#0a3d2f,#0d9488)",borderRadius:16,padding:"24px 28px",color:"#fff",marginBottom:24,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
        <div><div style={{fontSize:12,opacity:.7,marginBottom:4}}>Plan actual</div><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:22,fontWeight:700}}>{plan}</span><span style={{background:planBg,color:planColor,padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700}}>{isAdm?"ADMIN":"DEMO"}</span></div></div>
        <div style={{textAlign:"right"}}><div style={{fontSize:12,opacity:.7,marginBottom:4}}>{"Cr\u00e9ditos disponibles"}</div><div style={{fontSize:32,fontWeight:700}}>{credits}</div></div>
      </div>
      <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:"8px 24px",marginBottom:20}}>
        <InfoRow icon={"\ud83d\udce7"} label="Email" value={profile?.email || authUser?.email || "\u2014"} />
        <InfoRow icon={"\ud83d\udc64"} label="Nombre de usuario" value={profile?.username || "\u2014"} />
        <InfoRow icon={"\ud83e\udea3"} label="DNI" value={profile?.dni || "\u2014"} />
        <InfoRow icon={"\ud83d\udcdd"} label="Nombre completo" value={profile?.nombre && profile?.apellido ? `${profile.nombre} ${profile.apellido}` : "\u2014"} />
        <InfoRow icon={"\ud83d\udcb3"} label={"Cr\u00e9ditos restantes"} value={isAdm ? "Ilimitados" : `${profile?.creditos || 0} evaluaciones`} />
        <div style={{display:"flex",alignItems:"center",gap:14,padding:"16px 0"}}>
          <div style={{width:40,height:40,borderRadius:10,background:"#f0f5f3",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{"\ud83d\udcc5"}</div>
          <div style={{flex:1}}><div style={{fontSize:11,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".5px",marginBottom:2}}>Miembro desde</div><div style={{fontSize:15,fontWeight:500,color:"#1e293b"}}>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("es-AR",{year:"numeric",month:"long",day:"numeric"}) : "\u2014"}</div></div>
        </div>
      </div>
      <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:"20px 24px"}}>
        <div style={{fontSize:14,fontWeight:600,color:"#1e293b",marginBottom:4}}>Seguridad</div>
        <p style={{fontSize:13,color:"#94a3b8",marginBottom:14}}>{"Se enviar\u00e1 un enlace a tu email para establecer una nueva contrase\u00f1a."}</p>
        <button onClick={handlePasswordReset} disabled={resetSending||resetSent} style={{padding:"10px 20px",background:resetSent?"#ecfdf5":"#f8faf9",border:resetSent?"1px solid #a7f3d0":"1px solid #e2e8f0",borderRadius:10,fontSize:13,fontWeight:600,cursor:resetSending?"wait":resetSent?"default":"pointer",color:resetSent?"#059669":"#1e293b",display:"flex",alignItems:"center",gap:8,transition:"all .2s"}}>
          {resetSent?"\u2713 Email enviado":(resetSending?"Enviando...":"\ud83d\udd12 Cambiar contrase\u00f1a")}
        </button>
      </div>
    </div>
  );
}

function PremiumPage({ profile, nfy, onBack }) {
  return (
    <div style={{animation:"fi .3s ease",width:"100%",maxWidth:600}}>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>{"\u2728 Plan Premium"}</h1>
      <p style={{color:K.mt,fontSize:14,marginBottom:24}}>{"Actualiz\u00e1 tu plan para seguir evaluando"}</p>
      <div style={{background:"linear-gradient(135deg,#0a3d2f,#0d9488)",borderRadius:16,padding:"32px 28px",color:"#fff",marginBottom:24,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:12}}>{"\ud83d\ude80"}</div>
        <div style={{fontSize:28,fontWeight:700,marginBottom:4}}>{"30 Cr\u00e9ditos"}</div>
        <div style={{fontSize:36,fontWeight:800,marginBottom:8}}>$49.500</div>
        <div style={{fontSize:13,opacity:.8}}>{"Pago \u00fanico \u00b7 Sin suscripci\u00f3n \u00b7 30 evaluaciones"}</div>
      </div>
      <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:"24px",marginBottom:20}}>
        <div style={{fontSize:15,fontWeight:700,color:"#0a3d2f",marginBottom:16}}>Medios de pago</div>
        <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:10,padding:16,marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:600,color:"#0369a1",marginBottom:8}}>{"\ud83d\udcf1 Transferencia bancaria / Ual\u00e1 / MercadoPago"}</div>
          <div style={{fontSize:13,color:"#475569",lineHeight:1.7}}>
            {"Realiz\u00e1 una transferencia por "}<b>$49.500</b>{" al siguiente CBU/Alias:"}
            <div style={{background:"#e0f2fe",borderRadius:8,padding:"12px 16px",margin:"10px 0",fontFamily:"monospace",fontSize:14,fontWeight:600,color:"#0c4a6e",letterSpacing:".5px",textAlign:"center",userSelect:"all"}}>brujula.kit.fono</div>
            {"Luego envi\u00e1 el comprobante por WhatsApp o email para activar tus cr\u00e9ditos."}
          </div>
        </div>
        <div style={{background:"#f8faf9",border:"1px solid #e2e8f0",borderRadius:10,padding:16}}>
          <div style={{fontSize:14,fontWeight:600,color:"#1e293b",marginBottom:8}}>{"\ud83d\udce7 Contacto para activaci\u00f3n"}</div>
          <div style={{fontSize:13,color:"#475569",lineHeight:1.7}}>Email: <b>valkyriumsolutions@gmail.com</b><br/>{"Indic\u00e1 tu email de cuenta y adjunt\u00e1 el comprobante de pago."}</div>
        </div>
      </div>
      <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:16,marginBottom:20,fontSize:12,color:"#92400e",lineHeight:1.6}}>
        <b>{"\u26a0 Nota:"}</b>{" La activaci\u00f3n de cr\u00e9ditos es manual y puede demorar hasta 24 horas h\u00e1biles. Estamos trabajando en un sistema de pago autom\u00e1tico."}
      </div>
      <button onClick={onBack} style={{background:"#f1f5f9",border:"none",padding:"12px 24px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",color:"#64748b"}}>{"\u2190 Volver al panel"}</button>
    </div>
  );
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
  const [sessionBlocked, setSessionBlocked] = useState(false);
  const [showNoCredits, setShowNoCredits] = useState(false);
  const nfy = useCallback((m, t) => { sT({ m, t }); setTimeout(() => sT(null), 3500); }, []);
  const isAdmin = profile?.role === "admin";
  useSessionHeartbeat(authUser?.uid, isAdmin);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        if (u.emailVerified) {
          const prof = await getUserProfile(u.uid);
          if (prof && prof.profileComplete) {
            const canLogin = await acquireSessionLock(u.uid, prof.role === "admin");
            if (!canLogin) { setSessionBlocked(true); setAuthUser(u); setProfile(prof); return; }
            setSessionBlocked(false); setProfile(prof);
          } else setProfile(null);
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

  useEffect(() => { if (profile && !sessionBlocked) loadEvals(); }, [profile, loadEvals, sessionBlocked]);

  const navTo = (v) => {
    if ((view === "newELDI" || view === "newPEFF") && v !== view) {
      if (!window.confirm("\u00bfSalir de la evaluaci\u00f3n?\n\nLa evaluaci\u00f3n no se guarda a medias y el cr\u00e9dito consumido no se recupera.")) return;
    }
    sV(v); sS(null); window.scrollTo({top:0,behavior:"smooth"});
  };

  const checkCredits = () => {
    if (!profile) return false;
    if (profile.role === "admin") return true;
    if ((profile.creditos || 0) < 1) { setShowNoCredits(true); return false; }
    return true;
  };

  const deductCredit = async () => {
    if (!profile || profile.role === "admin") return;
    try {
      const userRef = doc(db, "usuarios", authUser.uid);
      await updateDoc(userRef, { creditos: increment(-1) });
      const fresh = await getDoc(userRef);
      if (fresh.exists()) { setProfile(p => ({ ...p, creditos: fresh.data().creditos })); }
    } catch (e) { console.error("deductCredit error:", e); }
  };

  const startEval = async (toolId) => {
    if (!checkCredits()) return;
    if (!isAdmin) {
      const ok = window.confirm("\u00bfIniciar evaluaci\u00f3n?\n\nSe consumir\u00e1 1 cr\u00e9dito de tu cuenta. Esta acci\u00f3n no se puede deshacer.");
      if (!ok) return;
      await deductCredit();
    }
    sV(toolId);
  };

  const saveEval = async (ev) => {
    const rspClean = {};
    if (ev.rsp) { Object.entries(ev.rsp).forEach(([k, v]) => { if (v === true) rspClean[k] = true; else if (v === false) rspClean[k] = false; }); }
    const newEv = { id: Date.now() + "", userId: authUser.uid, paciente: ev.pN, fechaNacimiento: ev.birth, fechaEvaluacion: ev.eD, establecimiento: ev.sch, derivadoPor: ev.ref, edadMeses: ev.a, evalRec: ev.evalRec || false, evalExp: ev.evalExp || false, brutoReceptivo: ev.rR, brutoExpresivo: ev.rE, recRes: ev.recRes || null, expRes: ev.expRes || null, allNoEval: ev.allNoEval || [], observaciones: ev.obs || "", evaluador: profile?.nombre ? (profile.nombre + " " + profile.apellido) : profile?.username || "", fechaGuardado: new Date().toISOString(), respuestas: rspClean };
    const res = await fbAdd("evaluaciones", newEv);
    if (res.success) { nfy("ELDI guardada", "ok"); await loadEvals(); } else nfy("Error: " + res.error, "er");
    sV("dash");
  };

  const savePeff = async (data) => {
    const res = await fbAdd("peff_evaluaciones", { id: Date.now() + "", userId: authUser.uid, evaluador: profile?.nombre ? (profile.nombre + " " + profile.apellido) : profile?.username || "", fechaGuardado: new Date().toISOString(), ...data });
    if (res.success) { nfy("PEFF guardada", "ok"); await loadEvals(); } else nfy("Error: " + res.error, "er");
    sV("dash");
  };

  const deleteEval = async (fbId, colName = "evaluaciones") => {
    if (profile?.role !== "admin") return;
    const res = await fbDelete(colName, fbId);
    if (res.success) { nfy("Eliminada", "ok"); await loadEvals(); } else nfy("Error: " + res.error, "er");
    sS(null); sV("hist");
  };

  const handleLogout = async () => {
    if (authUser?.uid) await releaseSessionLock(authUser.uid);
    await signOut(auth);
    setAuthUser(null); setProfile(null); setSessionBlocked(false); sV("dash"); sS(null);
  };

  if (authUser === undefined) return <div style={{width:"100vw",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0a3d2f",color:"#fff",fontFamily:"'DM Sans',system-ui,sans-serif"}}><div style={{textAlign:"center"}}><div style={{fontSize:48,marginBottom:16}}>{"\ud83e\udded"}</div><div style={{fontSize:20,fontWeight:700}}>Cargando...</div></div></div>;
  if (!authUser) return <AuthScreen onDone={(u, p) => { setAuthUser(u); setProfile(p); }} />;
  if (authUser && !authUser.emailVerified) return <VerifyEmailScreen user={authUser} onLogout={handleLogout} />;
  if (authUser && authUser.emailVerified && !profile) return <CompleteProfileScreen uid={authUser.uid} email={authUser.email} onDone={p => setProfile(p)} />;

  if (sessionBlocked) return (
    <div style={{width:"100vw",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(145deg,#0a3d2f,#0d7363)",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <div style={{background:"rgba(255,255,255,.97)",borderRadius:16,padding:"44px 36px",width:440,maxWidth:"92vw",boxShadow:"0 20px 50px rgba(0,0,0,.3)",textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>{"\ud83d\udd12"}</div>
        <h2 style={{fontSize:20,fontWeight:700,color:"#0a3d2f",marginBottom:12}}>{"Sesi\u00f3n ocupada"}</h2>
        <p style={{color:"#64748b",fontSize:14,lineHeight:1.7,marginBottom:20}}>{"Otro usuario ya est\u00e1 conectado en este momento. Solo una persona puede usar la aplicaci\u00f3n a la vez."}</p>
        <p style={{color:"#94a3b8",fontSize:12,marginBottom:24}}>{"Si cree que es un error, espere unos minutos e intente nuevamente. La sesi\u00f3n se libera autom\u00e1ticamente despu\u00e9s de 2 horas de inactividad."}</p>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={async()=>{const canLogin=await acquireSessionLock(authUser.uid,false);if(canLogin){setSessionBlocked(false);window.location.reload()}else{nfy("La sesi\u00f3n sigue ocupada","er")}}} style={{background:"#0d9488",color:"#fff",border:"none",padding:"12px 24px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>Reintentar</button>
          <button onClick={handleLogout} style={{background:"#f1f5f9",border:"none",padding:"12px 24px",borderRadius:8,fontSize:14,cursor:"pointer",color:"#64748b"}}>{"Cerrar sesi\u00f3n"}</button>
        </div>
      </div>
    </div>
  );

  const nav = [["dash", "\u229e", "Panel"], ["tools", "\ud83e\uddf0", "Herramientas"], ["hist", "\u23f1", "Historial"], ["calendario", "\ud83d\udcc5", "Calendario"], ["profile", "\ud83d\udc64", "Perfil"]];
  if (isAdmin) nav.push(["adm", "\u2699", "Usuarios"]);

  return (
    <div style={{display:"flex",height:"100vh",width:"100vw",fontFamily:"'DM Sans',system-ui,sans-serif",background:K.bg,color:"#1e293b",overflow:"hidden"}}>
      {showNoCredits && <NoCreditsModal onClose={()=>{setShowNoCredits(false);sV("dash")}} onUpgrade={()=>{setShowNoCredits(false);sV("premium")}} />}
      <aside style={{width:mobile?60:230,minWidth:mobile?60:230,background:K.sd,color:"#fff",display:"flex",flexDirection:"column",padding:"18px 0",flexShrink:0,height:"100vh"}}>
        <div style={{padding:"0 14px",marginBottom:26,display:"flex",alignItems:"center",gap:9}}>
          <span style={{fontSize:28}}>{"\ud83e\udded"}</span>
          {!mobile&&<div><div style={{fontSize:17,fontWeight:700}}>{"Br\u00fajula KIT"}</div><div style={{fontSize:9,color:"#5eead4",fontWeight:600,letterSpacing:"1px"}}>{"FONOAUDIOLOG\u00cdA"}</div></div>}
        </div>
        <nav style={{flex:1}}>{nav.map(([id,ic,lb])=><button key={id} onClick={()=>navTo(id)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:mobile?"13px 0":"11px 18px",background:view===id?"rgba(94,234,212,.12)":"transparent",border:"none",color:view===id?"#5eead4":"rgba(255,255,255,.6)",cursor:"pointer",fontSize:14,fontWeight:view===id?600:400,borderLeft:view===id?"3px solid #5eead4":"3px solid transparent",textAlign:"left",justifyContent:mobile?"center":"flex-start"}}><span>{ic}</span>{!mobile&&<span>{lb}</span>}</button>)}</nav>
        <div style={{padding:"0 14px",borderTop:"1px solid rgba(255,255,255,.1)",paddingTop:12}}>
          {!mobile&&<div style={{fontSize:10,color:"rgba(255,255,255,.45)",marginBottom:3}}>{"Sesi\u00f3n: "}<b style={{color:"#5eead4"}}>{profile.username}</b>{isAdmin&&<span style={{background:"#5eead4",color:K.sd,padding:"1px 5px",borderRadius:3,fontSize:8,marginLeft:6,fontWeight:700}}>ADMIN</span>}</div>}
          {!mobile&&<div style={{fontSize:10,color:"rgba(255,255,255,.35)",marginBottom:8}}>{"Cr\u00e9ditos: "}<b style={{color:profile.creditos>0?"#5eead4":"#f87171"}}>{isAdmin?"\u221e":(profile.creditos||0)}</b></div>}
          <button onClick={handleLogout} style={{background:"rgba(255,255,255,.08)",border:"none",color:"rgba(255,255,255,.6)",padding:"7px 12px",borderRadius:6,cursor:"pointer",fontSize:mobile?16:12,width:"100%"}}>{mobile?"\u21a9":"\u21a9 Cerrar sesi\u00f3n"}</button>
        </div>
      </aside>
      <main id="main-scroll" style={{flex:1,overflowY:"auto",overflowX:"hidden",padding:mobile?"16px":"28px 36px",height:"100vh"}}>
        {toast&&<div style={{position:"fixed",top:16,right:16,zIndex:999,background:toast.t==="ok"?"#059669":"#dc2626",color:"#fff",padding:"10px 18px",borderRadius:8,fontSize:13,fontWeight:500,boxShadow:"0 4px 16px rgba(0,0,0,.15)",animation:"fi .3s ease"}}>{toast.m}</div>}
        {view==="dash"&&<Dash es={evals} pe={peffEvals} onT={()=>navTo("tools")} onV={e=>{sS(e);sV("rpt")}} onVP={e=>{sS(e);sV("rptP")}} ld={loading} profile={profile} isAdmin={isAdmin}/>}
        {view==="tools"&&<Tools onSel={startEval} credits={isAdmin?999:(profile.creditos||0)}/>}
        {view==="newELDI"&&<NewELDI onS={saveEval} nfy={nfy}/>}
        {view==="newPEFF"&&<NewPEFF onS={savePeff} nfy={nfy}/>}
        {view==="hist"&&<Hist es={evals} pe={peffEvals} onV={e=>{sS(e);sV("rpt")}} onVP={e=>{sS(e);sV("rptP")}} isA={isAdmin} onD={deleteEval}/>}
        {view==="rpt"&&sel&&<RptELDI ev={sel} isA={isAdmin} onD={deleteEval}/>}
        {view==="rptP"&&sel&&<RptPEFF ev={sel} isA={isAdmin} onD={deleteEval}/>}
        {view==="profile"&&<ProfilePage profile={profile} authUser={authUser} nfy={nfy}/>}
        {view==="calendario"&&<CalendarPage userId={authUser?.uid} nfy={nfy}/>}
        {view==="premium"&&<PremiumPage profile={profile} nfy={nfy} onBack={()=>sV("dash")}/>}
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
      if (prof && prof.profileComplete) {
        const canLogin = await acquireSessionLock(u.uid, prof.role === "admin");
        if (!canLogin) { setErr("Otro usuario ya est\u00e1 conectado. Solo una persona puede usar la app a la vez."); setLd(false); return; }
        onDone(u, prof);
      }
    } catch (e) {
      if (e.code === "auth/user-not-found" || e.code === "auth/invalid-credential") setErr("Email o contrase\u00f1a incorrectos.");
      else if (e.code === "auth/wrong-password") setErr("Contrase\u00f1a incorrecta.");
      else if (e.code === "auth/too-many-requests") setErr("Demasiados intentos. Espere unos minutos.");
      else setErr("Error: " + e.message);
    }
    setLd(false);
  };
  const handleRegister = async (ev) => {
    ev.preventDefault(); setLd(true); setErr(""); setInfo("");
    if (pass.length < 6) { setErr("La contrase\u00f1a debe tener al menos 6 caracteres."); setLd(false); return; }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      await sendEmailVerification(cred.user);
      setInfo("Se envi\u00f3 un email de verificaci\u00f3n a " + email.trim() + ". Revise su bandeja (y spam).");
    } catch (e) {
      if (e.code === "auth/email-already-in-use") setErr("Ya existe una cuenta con ese email.");
      else if (e.code === "auth/invalid-email") setErr("Email inv\u00e1lido.");
      else setErr("Error: " + e.message);
    }
    setLd(false);
  };
  return (
    <div style={{width:"100vw",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(145deg,#0a3d2f,#0d7363)",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <div style={{background:"rgba(255,255,255,.97)",borderRadius:16,padding:"44px 36px",width:400,maxWidth:"92vw",boxShadow:"0 20px 50px rgba(0,0,0,.3)"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:9,marginBottom:8}}><span style={{fontSize:32}}>{"\ud83e\udded"}</span><span style={{fontSize:26,fontWeight:700,color:"#0a3d2f"}}>{"Br\u00fajula KIT"}</span></div>
          <p style={{color:"#64748b",fontSize:13}}>{"Sistema Integral de Evaluaci\u00f3n Fonaudiol\u00f3gica"}</p>
        </div>
        <div style={{display:"flex",marginBottom:22,borderRadius:8,overflow:"hidden",border:"1px solid #e2e8f0"}}>
          {[["login","Iniciar sesi\u00f3n"],["register","Crear cuenta"]].map(([id,lb])=>(
            <button key={id} onClick={()=>{setMode(id);setErr("");setInfo("")}} style={{flex:1,padding:"10px",border:"none",background:mode===id?"#0d9488":"#f8faf9",color:mode===id?"#fff":"#64748b",fontSize:13,fontWeight:600,cursor:"pointer"}}>{lb}</button>
          ))}
        </div>
        <form onSubmit={mode==="login"?handleLogin:handleRegister}>
          <div style={{marginBottom:14}}><label style={{fontSize:12,fontWeight:600,color:"#64748b",display:"block",marginBottom:5}}>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} style={I} placeholder="correo@ejemplo.com" required/></div>
          <div style={{marginBottom:22}}><label style={{fontSize:12,fontWeight:600,color:"#64748b",display:"block",marginBottom:5}}>{"Contrase\u00f1a"}</label><input type="password" value={pass} onChange={e=>setPass(e.target.value)} style={I} placeholder={mode==="register"?"M\u00ednimo 6 caracteres":"Su contrase\u00f1a"} required/></div>
          {err&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626",padding:"10px 12px",borderRadius:8,fontSize:12,marginBottom:14}}>{err}</div>}
          {info&&<div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",color:"#059669",padding:"10px 12px",borderRadius:8,fontSize:12,marginBottom:14}}>{info}</div>}
          <button type="submit" disabled={ld} style={{width:"100%",padding:"13px",background:"#0d9488",color:"#fff",border:"none",borderRadius:8,fontSize:15,fontWeight:600,cursor:ld?"wait":"pointer",opacity:ld?.7:1}}>
            {ld?"Procesando...":mode==="login"?"Iniciar sesi\u00f3n":"Crear cuenta"}
          </button>
        </form>
        <p style={{textAlign:"center",marginTop:20,fontSize:10,color:"#94a3b8"}}>{"Br\u00fajula KIT v5.5"}</p>
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
        <div style={{fontSize:48,marginBottom:16}}>{"\ud83d\udce7"}</div>
        <h2 style={{fontSize:20,fontWeight:700,color:"#0a3d2f",marginBottom:10}}>Verifique su email</h2>
        <p style={{color:"#64748b",fontSize:14,lineHeight:1.6,marginBottom:20}}>{"Enviamos un enlace de verificaci\u00f3n a "}<b style={{color:"#0d9488"}}>{user.email}</b>{'. Haga clic en el enlace y vuelva aqu\u00ed.'}</p>
        <p style={{color:"#94a3b8",fontSize:12,marginBottom:20}}>{"Revise tambi\u00e9n su carpeta de spam."}</p>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={()=>window.location.reload()} style={{background:"#0d9488",color:"#fff",border:"none",padding:"12px 24px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{"Ya verifiqu\u00e9 \u2192"}</button>
          <button onClick={resend} disabled={sending||sent} style={{background:"#f1f5f9",border:"none",padding:"12px 24px",borderRadius:8,fontSize:14,cursor:sending?"wait":"pointer",color:"#64748b"}}>{sent?"\u2713 Reenviado":sending?"Enviando...":"Reenviar email"}</button>
        </div>
        <button onClick={onLogout} style={{marginTop:20,background:"none",border:"none",color:"#94a3b8",fontSize:12,cursor:"pointer",textDecoration:"underline"}}>{"Cerrar sesi\u00f3n"}</button>
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
      const isAdminUser = email === ADMIN_EMAIL;
      let username = isAdminUser ? "CalaAdmin976" : await generateUsername(nombre.trim(), apellido.trim());
      const profileData = { uid, email, nombre: nombre.trim(), apellido: apellido.trim(), dni: dni.trim(), username, creditos: 5, plan: "Plan Demo", role: isAdminUser ? "admin" : "user", profileComplete: true, createdAt: new Date().toISOString() };
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
        <p style={{color:"#94a3b8",fontSize:12}}>{"Tiene 5 cr\u00e9ditos de prueba (Plan Demo). Ingresando..."}</p>
      </div>
    </div>
  );
  return (
    <div style={{width:"100vw",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(145deg,#0a3d2f,#0d7363)",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <div style={{background:"rgba(255,255,255,.97)",borderRadius:16,padding:"44px 36px",width:420,maxWidth:"92vw",boxShadow:"0 20px 50px rgba(0,0,0,.3)"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:40,marginBottom:8}}>{"\ud83d\udcdd"}</div>
          <h2 style={{fontSize:20,fontWeight:700,color:"#0a3d2f"}}>Complete su perfil</h2>
          <p style={{color:"#64748b",fontSize:13,marginTop:4}}>{email}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom:14}}><label style={{fontSize:12,fontWeight:600,color:"#64748b",display:"block",marginBottom:5}}>Nombre</label><input value={nombre} onChange={e=>setNombre(e.target.value)} style={I} placeholder="Nombre del profesional" required/></div>
          <div style={{marginBottom:14}}><label style={{fontSize:12,fontWeight:600,color:"#64748b",display:"block",marginBottom:5}}>Apellido</label><input value={apellido} onChange={e=>setApellido(e.target.value)} style={I} placeholder="Apellido" required/></div>
          <div style={{marginBottom:22}}><label style={{fontSize:12,fontWeight:600,color:"#64748b",display:"block",marginBottom:5}}>DNI</label><input value={dni} onChange={e=>setDni(e.target.value)} style={I} placeholder={"N\u00famero de documento"} required/></div>
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
  const cards = [
    { ic: "\ud83d\udccb", label: "Eval. ELDI", value: es.length },
    { ic: "\ud83d\udd0a", label: "Eval. PEFF", value: pe.length },
    { ic: "\ud83d\udc66\ud83d\udc67", label: "Pacientes", value: new Set([...es.map(e=>e.paciente),...pe.map(e=>e.paciente)]).size },
    { ic: "\ud83d\udcb3", label: "Cr\u00e9ditos", value: isAdmin?"\u221e":(profile?.creditos||0) }
  ];
  return (
    <div style={{animation:"fi .3s ease",width:"100%"}}>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>{"\ud83e\udded Panel Principal"}</h1>
      <p style={{color:K.mt,fontSize:14,marginBottom:24}}>Bienvenido/a, {profile?.nombre || profile?.username}{ld?" \u2014 cargando...":""}</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:16,marginBottom:28}}>
        {cards.map((c,i)=>
          <div key={i} style={{background:"#fff",borderRadius:12,padding:22,border:"1px solid #e2e8f0"}}>
            <div style={{fontSize:28,marginBottom:6}}>{c.ic}</div>
            <div style={{fontSize:28,fontWeight:700}}>{c.value}</div>
            <div style={{fontSize:13,color:K.mt,marginTop:2}}>{c.label}</div>
          </div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <button onClick={onT} style={{background:"linear-gradient(135deg,#0a3d2f,#0d9488)",color:"#fff",border:"none",borderRadius:14,padding:"28px 24px",cursor:"pointer",display:"flex",alignItems:"center",gap:16,textAlign:"left"}}>
          <div style={{width:52,height:52,borderRadius:12,background:"rgba(255,255,255,.14)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{"\ud83e\uddf0"}</div>
          <div><div style={{fontSize:18,fontWeight:700}}>Herramientas</div><div style={{fontSize:13,opacity:.8,marginTop:4}}>{"Nueva evaluaci\u00f3n"}</div></div>
        </button>
        <div style={{background:"#fff",borderRadius:14,padding:22,border:"1px solid #e2e8f0"}}>
          <h3 style={{fontSize:15,fontWeight:600,marginBottom:14}}>Recientes</h3>
          {rc.length===0?<p style={{color:K.mt,fontSize:13}}>{"Sin evaluaciones a\u00fan."}</p>:rc.map(ev=>{const isP=!!ev.seccionData;return(
            <div key={ev._fbId||ev.id} onClick={()=>isP?onVP(ev):onV(ev)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #e2e8f0",cursor:"pointer"}}>
              <div><div style={{fontWeight:600,fontSize:14}}>{ev.paciente}</div><div style={{fontSize:11,color:K.mt}}>{isP?"PEFF":"ELDI"} {"\u00b7"} {new Date(ev.fechaGuardado).toLocaleDateString("es-CL")}</div></div>
              <span style={{color:K.mt}}>{"\u2192"}</span>
            </div>)})}        </div>
      </div>
    </div>
  );
}

function Tools({ onSel, credits }) {
  const noCredits = credits < 1;
  const tools = [
    { id: "newELDI", icon: "\ud83d\udccb", name: "ELDI", full: "Evaluaci\u00f3n del Lenguaje y Desarrollo Infantil", desc: "Comprensi\u00f3n auditiva y comunicaci\u00f3n expresiva (55+55 \u00edtems) de 0 a 7 a\u00f1os.", age: "0-7;11", time: "~30-45 min", color: "#0d9488" },
    { id: "newPEFF", icon: "\ud83d\udd0a", name: "PEFF", full: "Protocolo Fon\u00e9tico-Fonol\u00f3gico", desc: "OFA, diadococinesis, s\u00edlabas, discriminaci\u00f3n y reconocimiento fonol\u00f3gico.", age: "2;6-6;11", time: "~45-60 min", color: "#7c3aed" }
  ];
  return (
    <div style={{animation:"fi .3s ease",width:"100%"}}>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>{"\ud83e\uddf0 Herramientas"}</h1>
      <p style={{color:K.mt,fontSize:14,marginBottom:8}}>{"Seleccione evaluaci\u00f3n"}</p>
      {noCredits&&<div style={{background:"#fef3c7",border:"1px solid #fde68a",borderRadius:10,padding:14,marginBottom:16,fontSize:13,color:"#92400e",fontWeight:600}}>{"\u26a0 Sin cr\u00e9ditos disponibles. Actualice su plan para continuar."}</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        {tools.map(t=><div key={t.id} style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden",opacity:noCredits?0.5:1}}>
          <div style={{background:`linear-gradient(135deg,${t.color},${t.color}aa)`,padding:"24px 24px 20px",color:"#fff"}}>
            <div style={{fontSize:36,marginBottom:8}}>{t.icon}</div><div style={{fontSize:22,fontWeight:700}}>{t.name}</div>
            <div style={{fontSize:12,opacity:.85,marginTop:2}}>{t.full}</div>
          </div>
          <div style={{padding:"20px 24px"}}>
            <p style={{fontSize:13,color:"#475569",lineHeight:1.6,marginBottom:16}}>{t.desc}</p>
            <div style={{display:"flex",gap:16,fontSize:12,color:K.mt}}><span>{"\ud83d\udc66\ud83d\udc67 "}{t.age}</span><span>{"\u23f1 "}{t.time}</span></div>
            <button onClick={()=>{if(!noCredits)onSel(t.id)}} disabled={noCredits} style={{marginTop:16,width:"100%",padding:"11px",background:noCredits?"#94a3b8":t.color,color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:noCredits?"not-allowed":"pointer"}}>{noCredits?"Sin cr\u00e9ditos":"Iniciar \u2192"}</button>
          </div>
        </div>)}
      </div>
    </div>
  );
}
