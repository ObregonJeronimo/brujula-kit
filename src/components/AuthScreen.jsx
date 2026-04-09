import { useState, useEffect } from "react";
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from "../firebase.js";
import { getUserProfile } from "../lib/fb.js";
import { acquireSessionLock } from "../lib/sessionLock.js";
import { db, doc, setDoc, getDoc, getDocs, query, where, collection, orderBy, limit } from "../firebase.js";

var googleProvider = new GoogleAuthProvider();
var DEFAULT_VERSION = "1.0.0.0";

function getPasswordStrength(p) {
  if (!p || p.length < 6) return { level: 0, label: "", color: "#e2e8f0" };
  var hasUpper = /[A-Z]/.test(p);
  var hasLower = /[a-z]/.test(p);
  var hasNum = /\d/.test(p);
  var hasSpecial = /[^A-Za-z0-9]/.test(p);
  var allNum = /^\d+$/.test(p);
  if (allNum) return { level: 1, label: "Débil", color: "#dc2626" };
  if (hasUpper && hasLower && hasNum && hasSpecial) return { level: 4, label: "Muy alta", color: "#059669" };
  if (hasUpper && hasLower && hasNum) return { level: 3, label: "Alta", color: "#22c55e" };
  if ((hasLower || hasUpper) && hasNum) return { level: 2, label: "Moderada", color: "#f59e0b" };
  return { level: 1, label: "Débil", color: "#dc2626" };
}

function EyeIcon({ open }) {
  if (open) return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
}

export default function AuthScreen({ onDone, themeColor }) {
  var _m = useState("login"), mode = _m[0], setMode = _m[1];
  var _e = useState(""), email = _e[0], setEmail = _e[1];
  var _p = useState(""), pass = _p[0], setPass = _p[1];
  var _p2 = useState(""), pass2 = _p2[0], setPass2 = _p2[1];
  var _sp = useState(false), showPass = _sp[0], setShowPass = _sp[1];
  var _sp2 = useState(false), showPass2 = _sp2[0], setShowPass2 = _sp2[1];
  var _ld = useState(false), ld = _ld[0], setLd = _ld[1];
  var _err = useState(""), err = _err[0], setErr = _err[1];
  var _info = useState(""), info = _info[0], setInfo = _info[1];
  var _showReset = useState(false), showReset = _showReset[0], setShowReset = _showReset[1];
  var _resetEmail = useState(""), resetEmail = _resetEmail[0], setResetEmail = _resetEmail[1];
  var _appVersion = useState(DEFAULT_VERSION), appVersion = _appVersion[0], setAppVersion = _appVersion[1];

  // Load latest version from changelogs
  useEffect(function(){
    var q2 = query(collection(db, "changelogs"), orderBy("createdAt", "desc"), limit(1));
    getDocs(q2).then(function(snap){
      if(!snap.empty){ setAppVersion(snap.docs[0].data().version || DEFAULT_VERSION); }
    }).catch(function(){});
  },[]);

  var I = { width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, background: "#f8faf9" };
  var strength = mode === "register" ? getPasswordStrength(pass) : null;

  var handleGoogleResult = async function(user, isRegisterMode) {
    var prof = await getUserProfile(user.uid);
    if (prof && prof.profileComplete) {
      if (prof.authProvider === "email") { setErr("Esta cuenta fue creada con email y contraseña. Iniciá sesión escribiendo tu email y contraseña."); setLd(false); return; }
      if (isRegisterMode) { setErr("Ya existe una cuenta con este email de Google. Usá 'Iniciar sesión' y luego 'Continuar con Google'."); setLd(false); return; }
      var canLogin = await acquireSessionLock(user.uid, prof.role === "admin");
      if (!canLogin) { setErr("Sesión ocupada. Intentá en unos minutos."); setLd(false); return; }
      onDone(user, prof);
    } else if (!prof) {
      if (!isRegisterMode) { setErr("No existe una cuenta con este email. Creá una cuenta primero con 'Crear cuenta' y 'Registrarse con Google'."); setLd(false); return; }
      await setDoc(doc(db, "usuarios", user.uid), { email: user.email, nombre: user.displayName ? user.displayName.split(" ")[0] : "", apellido: user.displayName ? user.displayName.split(" ").slice(1).join(" ") : "", username: "", dni: "", creditos: 5, role: "user", profileComplete: false, authProvider: "google", createdAt: new Date().toISOString() });
    }
    setLd(false);
  };

  var handleGoogleSignIn = async function() {
    setLd(true); setErr(""); setInfo("");
    try { var result = await signInWithPopup(auth, googleProvider); await handleGoogleResult(result.user, mode === "register"); }
    catch (e) { if (e.code === "auth/popup-closed-by-user") { setLd(false); return; } if (e.code === "auth/account-exists-with-different-credential") { setErr("Ya existe una cuenta con este email creada con email/contraseña. Iniciá sesión con tu contraseña."); } else { setErr("Error con Google: " + e.message); } setLd(false); }
  };

  var handleLogin = async function(ev) {
    ev.preventDefault(); setLd(true); setErr(""); setInfo("");
    try {
      var cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      var u = cred.user;
      if (!u.emailVerified) { setLd(false); return; }
      var prof = await getUserProfile(u.uid);
      if (prof && prof.authProvider === "google") { await auth.signOut(); setErr("Esta cuenta fue creada con Google. Usá el botón 'Continuar con Google' para iniciar sesión."); setLd(false); return; }
      if (prof && prof.profileComplete) { var canLogin = await acquireSessionLock(u.uid, prof.role === "admin"); if (!canLogin) { setErr("Sesión ocupada. Intentá en unos minutos."); setLd(false); return; } onDone(u, prof); }
    } catch (e) {
      if (e.code === "auth/user-not-found" || e.code === "auth/invalid-credential") setErr("Email o contraseña incorrectos.");
      else if (e.code === "auth/wrong-password") setErr("Contraseña incorrecta.");
      else if (e.code === "auth/too-many-requests") setErr("Demasiados intentos. Esperá unos minutos.");
      else setErr("Error: " + e.message);
    }
    setLd(false);
  };

  var handleRegister = async function(ev) {
    ev.preventDefault(); setLd(true); setErr(""); setInfo("");
    if (pass.length < 6) { setErr("La contraseña debe tener al menos 6 caracteres."); setLd(false); return; }
    if (pass !== pass2) { setErr("Las contraseñas no coinciden."); setLd(false); return; }
    try {
      var cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      await setDoc(doc(db, "usuarios", cred.user.uid), { email: email.trim(), authProvider: "email", creditos: 5, role: "user", profileComplete: false, createdAt: new Date().toISOString() });
      await sendEmailVerification(cred.user);
      setInfo("Se envió un email de verificación a " + email.trim() + ". Revisá tu bandeja (y spam).");
    } catch (e) {
      if (e.code === "auth/email-already-in-use") setErr("Ya existe una cuenta con ese email.");
      else if (e.code === "auth/invalid-email") setErr("Email inválido.");
      else setErr("Error: " + e.message);
    }
    setLd(false);
  };

  var handleResetPassword = async function(ev) {
    ev.preventDefault(); setErr(""); setInfo("");
    if (!resetEmail.trim()) { setErr("Ingresá tu email."); return; }
    setLd(true);
    try { await sendPasswordResetEmail(auth, resetEmail.trim()); setInfo("Se envió un enlace de recuperación a " + resetEmail.trim() + ". Revisá tu bandeja (y spam)."); setShowReset(false); }
    catch (e) { if (e.code === "auth/user-not-found") setErr("No existe una cuenta con ese email."); else setErr("Error: " + e.message); }
    setLd(false);
  };

  var eyeBtn = function(isVisible, toggle) {
    return <button type="button" onClick={function(){ toggle(!isVisible); }} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"#94a3b8",display:"flex",alignItems:"center",padding:2}}><EyeIcon open={isVisible} /></button>;
  };

  var versionText = "Brújula KIT v" + appVersion;

  return (
    <div style={{width:"100vw",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:themeColor||"#0a3d2f",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <div style={{background:"rgba(255,255,255,.97)",borderRadius:16,padding:"40px 36px",width:420,maxWidth:"92vw",boxShadow:"0 20px 50px rgba(0,0,0,.3)"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:9,marginBottom:6}}><img src="/img/logo_96.png" style={{width:36,height:36}} alt="logo" /><span style={{fontSize:26,fontWeight:700,color:"#0a3d2f"}}>{"Brújula KIT"}</span></div>
          <p style={{color:"#64748b",fontSize:13}}>{"Sistema Integral de Evaluación Fonoaudiológica"}</p>
        </div>

        <div style={{display:"flex",marginBottom:18,borderRadius:8,overflow:"hidden",border:"1px solid #e2e8f0"}}>
          {[["login","Iniciar sesión"],["register","Crear cuenta"]].map(function(x){
            return <button key={x[0]} onClick={function(){setMode(x[0]);setErr("");setInfo("");setShowReset(false);setPass("");setPass2("");setShowPass(false);setShowPass2(false);}} style={{flex:1,padding:"10px",border:"none",background:mode===x[0]?"#0d9488":"#f8faf9",color:mode===x[0]?"#fff":"#64748b",fontSize:13,fontWeight:600,cursor:"pointer"}}>{x[1]}</button>;
          })}
        </div>

        <button onClick={handleGoogleSignIn} disabled={ld} style={{width:"100%",padding:"12px",background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,fontWeight:600,cursor:ld?"wait":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:16,color:"#334155"}}>
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          {mode === "login" ? "Continuar con Google" : "Registrarse con Google"}
        </button>

        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
          <div style={{flex:1,height:1,background:"#e2e8f0"}}></div>
          <span style={{fontSize:11,color:"#94a3b8"}}>o con email</span>
          <div style={{flex:1,height:1,background:"#e2e8f0"}}></div>
        </div>

        {showReset ? <div>
          <div style={{fontSize:14,fontWeight:600,marginBottom:10,color:"#0a3d2f"}}>{"Recuperar contraseña"}</div>
          <form onSubmit={handleResetPassword}>
            <div style={{marginBottom:14}}><input type="email" value={resetEmail} onChange={function(e){setResetEmail(e.target.value)}} style={I} placeholder="Tu email de registro" required/></div>
            {err&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626",padding:"10px 12px",borderRadius:8,fontSize:12,marginBottom:14}}>{err}</div>}
            {info&&<div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",color:"#059669",padding:"10px 12px",borderRadius:8,fontSize:12,marginBottom:14}}>{info}</div>}
            <button type="submit" disabled={ld} style={{width:"100%",padding:"12px",background:"#0d9488",color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:ld?"wait":"pointer",marginBottom:10}}>Enviar enlace de recuperación</button>
            <button type="button" onClick={function(){setShowReset(false);setErr("");setInfo("")}} style={{width:"100%",padding:"10px",background:"#f1f5f9",border:"none",borderRadius:8,fontSize:13,cursor:"pointer",color:"#64748b"}}>Volver</button>
          </form>
        </div> : <form onSubmit={mode==="login"?handleLogin:handleRegister}>
          <div style={{marginBottom:14}}><label style={{fontSize:12,fontWeight:600,color:"#64748b",display:"block",marginBottom:5}}>Email</label><input type="email" value={email} onChange={function(e){setEmail(e.target.value)}} style={I} placeholder="correo@ejemplo.com" required/></div>
          <div style={{marginBottom:mode==="register"?8:8}}><label style={{fontSize:12,fontWeight:600,color:"#64748b",display:"block",marginBottom:5}}>{"Contraseña"}</label>
            <div style={{position:"relative"}}>
              <input type={showPass?"text":"password"} value={pass} onChange={function(e){setPass(e.target.value)}} style={Object.assign({},I,{paddingRight:42})} placeholder={mode==="register"?"Mínimo 6 caracteres":"Tu contraseña"} required/>
              {eyeBtn(showPass, setShowPass)}
            </div>
          </div>
          {mode==="register" && pass.length > 0 && <div style={{marginBottom:8}}>
            <div style={{display:"flex",gap:3,marginBottom:4}}>
              {[1,2,3,4].map(function(i){ return <div key={i} style={{flex:1,height:4,borderRadius:2,background:strength.level>=i?strength.color:"#e2e8f0",transition:"background .2s"}}></div>; })}
            </div>
            {strength.label && <div style={{fontSize:11,fontWeight:600,color:strength.color}}>{strength.label}</div>}
          </div>}
          {mode==="register" && <div style={{marginBottom:14}}><label style={{fontSize:12,fontWeight:600,color:"#64748b",display:"block",marginBottom:5}}>{"Confirmar contraseña"}</label>
            <div style={{position:"relative"}}>
              <input type={showPass2?"text":"password"} value={pass2} onChange={function(e){setPass2(e.target.value)}} style={Object.assign({},I,{paddingRight:42,borderColor:pass2.length>0&&pass!==pass2?"#dc2626":"#e2e8f0"})} placeholder="Repetí tu contraseña" required/>
              {eyeBtn(showPass2, setShowPass2)}
            </div>
            {pass2.length > 0 && pass !== pass2 && <div style={{fontSize:11,color:"#dc2626",marginTop:4,fontWeight:600}}>{"Las contraseñas no coinciden"}</div>}
            {pass2.length > 0 && pass === pass2 && <div style={{fontSize:11,color:"#059669",marginTop:4,fontWeight:600}}>{"Las contraseñas coinciden ✓"}</div>}
          </div>}
          {mode==="login" && <div style={{marginBottom:14}}><button type="button" onClick={function(){setShowReset(true);setResetEmail(email);setErr("");setInfo("")}} style={{background:"none",border:"none",color:"#0d9488",fontSize:12,fontWeight:600,cursor:"pointer",padding:0}}>{"¿Olvidaste tu contraseña?"}</button></div>}
          {err&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626",padding:"10px 12px",borderRadius:8,fontSize:12,marginBottom:14}}>{err}</div>}
          {info&&<div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",color:"#059669",padding:"10px 12px",borderRadius:8,fontSize:12,marginBottom:14}}>{info}</div>}
          <button type="submit" disabled={ld || (mode==="register" && pass !== pass2)} style={{width:"100%",padding:"13px",background:"#0d9488",color:"#fff",border:"none",borderRadius:8,fontSize:15,fontWeight:600,cursor:ld?"wait":"pointer",opacity:(ld || (mode==="register" && pass2.length>0 && pass!==pass2))?.7:1}}>
            {ld?"Procesando...":mode==="login"?"Iniciar sesión":"Crear cuenta"}
          </button>
        </form>}

        <p style={{textAlign:"center",marginTop:14,fontSize:10,color:"#94a3b8",lineHeight:1.6}}>
          {"Al registrarte, aceptás los "}
          <a href="/politicas.html" target="_blank" rel="noopener noreferrer" style={{color:"#0d9488",textDecoration:"none",fontWeight:600}}>{"Términos y Condiciones"}</a>
          {" y la "}
          <a href="/politicas.html#privacidad" target="_blank" rel="noopener noreferrer" style={{color:"#0d9488",textDecoration:"none",fontWeight:600}}>{"Política de Privacidad"}</a>
        </p>
        <p style={{textAlign:"center",marginTop:4,fontSize:10,color:"#cbd5e1"}}>{versionText}</p>
      </div>
    </div>
  );
}
