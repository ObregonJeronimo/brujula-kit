import { useState, useEffect } from "react";
import { auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from "../firebase.js";
import { getUserProfile } from "../lib/fb.js";
import { acquireSessionLock } from "../lib/sessionLock.js";
import { db, doc, setDoc, getDoc, getDocs, query, where, collection, orderBy, limit } from "../firebase.js";
import "../styles/AuthScreen.css";

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

  useEffect(function(){
    var q2 = query(collection(db, "changelogs"), orderBy("createdAt", "desc"), limit(1));
    getDocs(q2).then(function(snap){
      if(!snap.empty){ setAppVersion(snap.docs[0].data().version || DEFAULT_VERSION); }
    }).catch(function(){});
  },[]);

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
      if (e.code === "auth/user-not-found" || e.code === "auth/invalid-credential" || e.code === "auth/wrong-password") {
        try {
          var snap = await getDocs(query(collection(db, "usuarios"), where("email", "==", email.trim())));
          if (!snap.empty) {
            var userData = snap.docs[0].data();
            if (userData.authProvider === "google") { setErr("google-hint"); setLd(false); return; }
          }
        } catch(e2){}
        setErr("Email o contraseña incorrectos.");
      } else { setErr("Error: " + e.message); }
      setLd(false);
    }
  };

  var handleRegister = async function(ev) {
    ev.preventDefault(); setLd(true); setErr(""); setInfo("");
    if (pass !== pass2) { setErr("Las contraseñas no coinciden."); setLd(false); return; }
    if (pass.length < 6) { setErr("La contraseña debe tener al menos 6 caracteres."); setLd(false); return; }
    try {
      var cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      await sendEmailVerification(cred.user);
      await setDoc(doc(db, "usuarios", cred.user.uid), { email: email.trim(), nombre: "", apellido: "", username: "", dni: "", creditos: 5, role: "user", profileComplete: false, authProvider: "email", createdAt: new Date().toISOString() });
      setInfo("Cuenta creada. Revisá tu email para verificar.");
    } catch (e) {
      if (e.code === "auth/email-already-in-use") setErr("Ya existe una cuenta con este email.");
      else if (e.code === "auth/weak-password") setErr("La contraseña es muy débil.");
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

  return (
    <div className="auth-wrapper" style={themeColor ? {background:themeColor} : undefined}>
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo"><img src="/img/logo_96.png" alt="logo" /><span className="auth-logo-text">{"Brújula KIT"}</span></div>
          <p className="auth-subtitle">{"Sistema Integral de Evaluación Fonoaudiológica"}</p>
        </div>

        <div className="auth-tabs">
          {[["login","Iniciar sesión"],["register","Crear cuenta"]].map(function(x){
            return <button key={x[0]} onClick={function(){setMode(x[0]);setErr("");setInfo("");setShowReset(false);setPass("");setPass2("");setShowPass(false);setShowPass2(false);}} className={"auth-tab "+(mode===x[0]?"auth-tab--active":"auth-tab--inactive")}>{x[1]}</button>;
          })}
        </div>

        <button onClick={handleGoogleSignIn} disabled={ld} className="auth-google-btn">
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          {mode === "login" ? "Continuar con Google" : "Registrarse con Google"}
        </button>

        <div className="auth-divider">
          <div className="auth-divider-line"></div>
          <span className="auth-divider-text">o con email</span>
          <div className="auth-divider-line"></div>
        </div>

        {showReset ? <div>
          <div className="auth-reset-title">{"Recuperar contraseña"}</div>
          <form onSubmit={handleResetPassword}>
            <div className="auth-field"><input type="email" value={resetEmail} onChange={function(e){setResetEmail(e.target.value)}} className="auth-input" placeholder="Tu email de registro" required/></div>
            {err && <div className="auth-error">{err}</div>}
            {info && <div className="auth-success">{info}</div>}
            <button type="submit" disabled={ld} className="auth-submit auth-submit--spaced">Enviar enlace de recuperación</button>
            <button type="button" onClick={function(){setShowReset(false);setErr("");setInfo("")}} className="auth-reset-back">Volver</button>
          </form>
        </div> : <form onSubmit={mode==="login"?handleLogin:handleRegister}>
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input type="email" value={email} onChange={function(e){setEmail(e.target.value)}} className="auth-input" placeholder="correo@ejemplo.com" required/>
          </div>
          <div className="auth-field">
            <label className="auth-label">{"Contraseña"}</label>
            <div className="auth-pass-wrapper">
              <input type={showPass?"text":"password"} value={pass} onChange={function(e){setPass(e.target.value)}} className="auth-input" placeholder={mode==="register"?"Mínimo 6 caracteres":"Tu contraseña"} required/>
              <button type="button" onClick={function(){ setShowPass(!showPass); }} className="auth-eye-btn"><EyeIcon open={showPass} /></button>
            </div>
          </div>
          {mode==="register" && pass.length > 0 && <div className="auth-strength">
            <div className="auth-strength-bars">
              {[1,2,3,4].map(function(i){ return <div key={i} className="auth-strength-bar" style={{background:strength.level>=i?strength.color:undefined}}></div>; })}
            </div>
            {strength.label && <div className="auth-strength-label" style={{color:strength.color}}>{strength.label}</div>}
          </div>}
          {mode==="register" && <div className="auth-field">
            <label className="auth-label">{"Confirmar contraseña"}</label>
            <div className="auth-pass-wrapper">
              <input type={showPass2?"text":"password"} value={pass2} onChange={function(e){setPass2(e.target.value)}} className={"auth-input"+(pass2.length>0&&pass!==pass2?" auth-input--error":"")} placeholder="Repetí tu contraseña" required/>
              <button type="button" onClick={function(){ setShowPass2(!showPass2); }} className="auth-eye-btn"><EyeIcon open={showPass2} /></button>
            </div>
            {pass2.length > 0 && pass !== pass2 && <div className="auth-match auth-match--err">{"Las contraseñas no coinciden"}</div>}
            {pass2.length > 0 && pass === pass2 && <div className="auth-match auth-match--ok">{"Las contraseñas coinciden \u2713"}</div>}
          </div>}
          {mode==="login" && <div className="auth-field"><button type="button" onClick={function(){setShowReset(true);setResetEmail(email);setErr("");setInfo("")}} className="auth-forgot">{"\u00bfOlvidaste tu contrase\u00f1a?"}</button></div>}
          {err && err === "google-hint" ? <div className="auth-google-hint">
            <div className="auth-google-hint-icon">{"\u2b06\ufe0f"}</div>
            <div className="auth-google-hint-title">{"Debe iniciar sesi\u00f3n con Google"}</div>
            <div className="auth-google-hint-text">{"Esta cuenta fue creada con Google. Us\u00e1 el bot\u00f3n de arriba."}</div>
          </div> : err && <div className="auth-error">{err}</div>}
          {info && <div className="auth-success">{info}</div>}
          <button type="submit" disabled={ld || (mode==="register" && pass !== pass2)} className="auth-submit" style={{opacity:(ld || (mode==="register" && pass2.length>0 && pass!==pass2))?.7:1}}>
            {ld?"Procesando...":mode==="login"?"Iniciar sesión":"Crear cuenta"}
          </button>
        </form>}

        <p className="auth-footer">
          {"Al registrarte, aceptás los "}
          <a href="/politicas.html" target="_blank" rel="noopener noreferrer">{"Términos y Condiciones"}</a>
          {" y la "}
          <a href="/politicas.html#privacidad" target="_blank" rel="noopener noreferrer">{"Política de Privacidad"}</a>
        </p>
        <p className="auth-version">{"Brújula KIT v" + appVersion}</p>
      </div>
    </div>
  );
}
