import { useState } from "react";
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from "../firebase.js";
import { getUserProfile } from "../lib/fb.js";
import { acquireSessionLock } from "../lib/sessionLock.js";

export default function AuthScreen({ onDone }) {
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
        <p style={{textAlign:"center",marginTop:20,fontSize:10,color:"#94a3b8"}}>{"Br\u00fajula KIT v5.6"}</p>
      </div>
    </div>
  );
}
