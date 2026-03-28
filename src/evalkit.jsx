import { useState, useEffect, useCallback, useRef, lazy, Suspense, Component } from "react";
import { db, auth, doc, updateDoc, getDoc, increment, onAuthStateChanged, signOut } from "./firebase.js";
import { fbGetAll, fbGetFiltered, fbAdd, fbDelete, getUserProfile, K } from "./lib/fb.js";
import { acquireSessionLock, releaseSessionLock, useSessionHeartbeat } from "./lib/sessionLock.js";
import { VISIBLE_TYPES, EVAL_TYPES, rptViewFor } from "./config/evalTypes.js";

import AuthScreen from "./components/AuthScreen.jsx";
import VerifyEmailScreen from "./components/VerifyEmail.jsx";
import CompleteProfileScreen from "./components/CompleteProfile.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Tools from "./components/Tools.jsx";
import NoCreditsModal from "./components/NoCreditsModal.jsx";
var OnboardingTourLazy = lazyRetry(function(){ return import("./components/OnboardingTour.jsx"); });

function lazyRetry(fn){
  return lazy(function(){
    return fn().catch(function(err){
      var lastReload = parseInt(sessionStorage.getItem("lazyReload")||"0");
      var now = Date.now();
      if(now - lastReload > 10000){ sessionStorage.setItem("lazyReload", now+""); window.location.reload(); return new Promise(function(){}); }
      throw err;
    });
  });
}

var Hist = lazyRetry(function(){ return import("./components/Hist.jsx"); });
var ProfilePage = lazyRetry(function(){ return import("./components/ProfilePage.jsx"); });
var PremiumPage = lazyRetry(function(){ return import("./components/PremiumPage.jsx"); });
var CalendarPage = lazyRetry(function(){ return import("./components/CalendarPage.jsx"); });
var PacientesPage = lazyRetry(function(){ return import("./components/PacientesPage.jsx"); });
var AdminPanel = lazyRetry(function(){ return import("./components/AdminPanel.jsx"); });
var AdminStats = lazyRetry(function(){ return import("./components/AdminStats.jsx"); });
var SettingsPage = lazyRetry(function(){ return import("./components/SettingsPage.jsx"); });
var NewELDI = lazyRetry(function(){ return import("./components/NewELDI.jsx"); });
var NewOFA = lazyRetry(function(){ return import("./components/NewOFA.jsx"); });
var NewFON = lazyRetry(function(){ return import("./components/NewFON.jsx"); });
var NewREP = lazyRetry(function(){ return import("./components/NewREP.jsx"); });
var NewDISC = lazyRetry(function(){ return import("./components/NewDISC.jsx"); });
var NewRECO = lazyRetry(function(){ return import("./components/NewRECO.jsx"); });
var NewPEFF = lazyRetry(function(){ return import("./components/NewPEFF.jsx"); });
var RptPEFF = lazyRetry(function(){ return import("./components/RptPEFF.jsx"); });
var RptREP = lazyRetry(function(){ return import("./components/RptREP.jsx"); });
var RptDISC = lazyRetry(function(){ return import("./components/RptDISC.jsx"); });
var RptRECO = lazyRetry(function(){ return import("./components/RptRECO.jsx"); });
var RptGeneric = lazyRetry(function(){ return import("./components/RptGeneric.jsx"); });
var RptELDI = lazyRetry(function(){ return import("./components/RptELDI.jsx"); });

var LazyFallback = <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:60,color:"#64748b",fontSize:14,fontWeight:500}}>Cargando...</div>;

class ErrorBoundary extends Component {
  constructor(props){ super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error){ return { hasError: true, error: error }; }
  componentDidCatch(error, info){ console.error("ErrorBoundary caught:", error, info); }
  render(){
    if(this.state.hasError){
      var self = this;
      return <div style={{padding:40,textAlign:"center"}}><div style={{fontSize:48,marginBottom:16}}>{"⚠️"}</div><h2 style={{fontSize:18,fontWeight:700,color:"#0a3d2f",marginBottom:8}}>{"Algo salió mal"}</h2><p style={{fontSize:13,color:"#64748b",marginBottom:20}}>{this.state.error ? this.state.error.message : "Error inesperado"}</p><button onClick={function(){ self.setState({hasError:false,error:null}); if(self.props.onReset) self.props.onReset(); }} style={{padding:"12px 24px",background:"#0d9488",color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{"Volver al Panel"}</button></div>;
    }
    return this.props.children;
  }
}

var NEW_COMPONENTS = { newPEFF: NewPEFF, newELDI: NewELDI, newOFA: NewOFA, newFON: NewFON, newREP: NewREP, newDISC: NewDISC, newRECO: NewRECO };
var RPT_COMPONENTS = { rptP: RptPEFF, rptR: RptREP, rptD: RptDISC, rptRC: RptRECO, rptEL: RptELDI, rptGen: RptGeneric };
var ALL_NEW_VIEWS = Object.keys(NEW_COMPONENTS);
var isMobile = function(){ return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && window.innerWidth < 900; };

// Mix hex color with white by alpha (0-100). 100=pure color, 30=very washed out
var mixColor = function(hex, alpha){
  if(!hex || alpha >= 100) return hex;
  var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  var a = Math.max(30, Math.min(100, alpha)) / 100;
  var mr = Math.round(r * a + 255 * (1-a)), mg = Math.round(g * a + 255 * (1-a)), mb = Math.round(b * a + 255 * (1-a));
  return "#" + ((1<<24)+(mr<<16)+(mg<<8)+mb).toString(16).slice(1);
};

var I = function(d){ return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>; };
var icons = {
  dash: I(<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>),
  tools: I(<><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>),
  hist: I(<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>),
  pacientes: I(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>),
  calendario: I(<><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>),
  premium: I(<><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><line x1="12" y1="6" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="18"/></>),
  profile: I(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>),
  config: I(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>),
  stats: I(<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>),
  adm: I(<><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></>),
  logout: I(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>)
};

var DINO_BG = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#f0f5f3"/>'
  + '<g transform="translate(30,30)" opacity="0.07" stroke="#0a3d2f" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M10 18c0-6 4-10 10-10s8 3 8 7c2-1 4 0 4 2s-2 3-4 3h-2c-1 3-4 5-7 5l-1 6h-2l0-6-2 6h-2l1-7c-2-1-3-3-3-6z"/><circle cx="16" cy="11" r="1"/></g>'
  + '<g transform="translate(120,60)" opacity="0.06" stroke="#0a3d2f" stroke-width="1.2" fill="none"><ellipse cx="8" cy="12" rx="5" ry="7"/><circle cx="3" cy="3" r="2"/><circle cx="8" cy="1" r="2"/><circle cx="13" cy="3" r="2"/></g>'
  + '<g transform="translate(200,20)" opacity="0.06" stroke="#0a3d2f" stroke-width="1.3" fill="none"><path d="M12 24c0-12 6-20 12-22M12 24c0-10-6-18-10-20M12 24V28"/></g>'
  + '<g transform="translate(300,40)" opacity="0.06" stroke="#0a3d2f" stroke-width="1.3" fill="none"><ellipse cx="8" cy="10" rx="7" ry="9"/><path d="M4 8c2-1 4 1 4-1s2 2 4 1"/></g>'
  + '<g transform="translate(60,120)" opacity="0.06" stroke="#0a3d2f" stroke-width="1.5" fill="none"><path d="M5 20c0-3 2-5 5-5h12c3 0 5 2 5 4l8-10c1-1 3 0 2 2l-6 9c0 2-2 4-5 4H10c-3 0-5-2-5-4zM5 20v5M8 20v5M22 19v5M25 19v5"/><circle cx="32" cy="9" r="1"/></g>'
  + '<g transform="translate(180,100)" opacity="0.05" stroke="#0a3d2f" stroke-width="1.2" fill="none"><path d="M8 0l2 5h6l-5 4 2 5-5-3-5 3 2-5-5-4h6z"/></g>'
  + '<g transform="translate(280,110)" opacity="0.06" stroke="#0a3d2f" stroke-width="1.3" fill="none"><path d="M15 28L5 28 10 12h10l5 16zM12 12c-1-3 1-5 3-5s4 2 3 5M13 8c0-2 1-3 2-3"/></g>'
  + '<g transform="translate(350,160)" opacity="0.06" stroke="#0a3d2f" stroke-width="1.3" fill="none"><path d="M5 16h20c2 0 3-1 3-3l3-2c0 2-1 3-2 4 1 1 1 3-1 3H5c-2 0-3-2-3-4s1-3 3-3zM8 11l2-4 3 4M14 11l2-4 3 4M20 11l2-3"/><path d="M5 18v4M8 18v4M22 18v3M25 17v4"/><circle cx="27" cy="12" r="0.8"/></g>'
  + '<g transform="translate(30,200)" opacity="0.05" stroke="#0a3d2f" stroke-width="1.2" fill="none"><path d="M8 4C8 1 12 0 12 4c0-4 4-3 4 0 0 4-4 7-4 7S8 8 8 4z"/></g>'
  + '<g transform="translate(130,180)" opacity="0.05" stroke="#0a3d2f" stroke-width="1.2" fill="none"><path d="M8 16h16c3 0 5-2 5-5s-2-4-4-4c0-3-3-5-6-5s-6 2-6 5c-2 0-4 2-4 4s2 5 4 5h-5z"/></g>'
  + '<g transform="translate(240,200)" opacity="0.06" stroke="#0a3d2f" stroke-width="1.2" fill="none"><ellipse cx="8" cy="12" rx="5" ry="7"/><circle cx="3" cy="3" r="2"/><circle cx="8" cy="1" r="2"/><circle cx="13" cy="3" r="2"/></g>'
  + '<g transform="translate(320,230)" opacity="0.06" stroke="#0a3d2f" stroke-width="1.3" fill="none"><path d="M15 12L2 6c-1 0-1 2 0 3l10 5-10 3c-1 1-1 3 0 3l13-5 8 2c2 0 3-2 2-4zM28 11l3-4"/><circle cx="28" cy="10" r="1"/></g>'
  + '<g transform="translate(80,280)" opacity="0.05" stroke="#0a3d2f" stroke-width="1.2" fill="none"><path d="M5 20Q5 5 20 5Q5 5 5 20zM5 20l15-15"/></g>'
  + '<g transform="translate(180,270)" opacity="0.06" stroke="#0a3d2f" stroke-width="1.3" fill="none"><ellipse cx="8" cy="10" rx="7" ry="9"/><path d="M5 7c1 2 3 0 3 2s3-1 3 1"/></g>'
  + '<g transform="translate(270,290)" opacity="0.06" stroke="#0a3d2f" stroke-width="1.3" fill="none"><path d="M25 14c3-2 6-1 6 2s-3 4-6 3H8c-3 0-5-2-5-5s2-5 5-5h2l-2-3h4l1 3h7z"/><circle cx="10" cy="13" r="1"/><path d="M8 18v4M11 18v4M20 17v4M23 16v4"/></g>'
  + '<g transform="translate(370,50)" opacity="0.05" stroke="#0a3d2f" stroke-width="1" fill="none"><circle cx="8" cy="8" r="4"/><path d="M8 1v2M8 14v2M1 8h2M14 8h2M3 3l1.5 1.5M11.5 11.5l1.5 1.5M13 3l-1.5 1.5M4.5 11.5L3 13"/></g>'
  + '<g transform="translate(20,340)" opacity="0.05" stroke="#0a3d2f" stroke-width="1.2" fill="none"><path d="M10 24v-6M5 18l5-8 5 8zM7 14l3-5 3 5z"/></g>'
  + '<g transform="translate(160,340)" opacity="0.05" stroke="#0a3d2f" stroke-width="1" fill="none"><path d="M8 8C4 4 0 6 2 10s6 2 6-2zM8 8c4-4 8-2 6 2s-6 2-6-2zM8 8v6"/></g>'
  + '<g transform="translate(340,350)" opacity="0.06" stroke="#0a3d2f" stroke-width="1.2" fill="none"><ellipse cx="8" cy="12" rx="5" ry="7"/><circle cx="3" cy="3" r="2"/><circle cx="8" cy="1" r="2"/><circle cx="13" cy="3" r="2"/></g>'
  + '</svg>');

var NAV_TOUR_IDS = { dash:"nav-dash", tools:"nav-tools", hist:"nav-hist", pacientes:"nav-pacientes", calendario:"nav-calendario", premium:"nav-premium", profile:"nav-profile", config:"nav-config", stats:"nav-stats", adm:"nav-adm" };

var _urlParams = new URLSearchParams(window.location.search);
var _paymentFlag = _urlParams.get("payment") || (_urlParams.get("collection_status") === "approved" ? "success" : null);
var _paymentId = _urlParams.get("payment_id") || _urlParams.get("collection_id");
if(_paymentFlag || _paymentId){ window.history.replaceState({},"",window.location.pathname); }

function UnsavedChangesModal({ onDiscard, onCancel, onSave, saving }){
  return <div style={{position:"fixed",inset:0,zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.4)",backdropFilter:"blur(4px)",animation:"fi .15s ease"}}><div style={{background:"#fff",borderRadius:16,padding:"32px 28px",width:400,maxWidth:"90vw",boxShadow:"0 20px 60px rgba(0,0,0,.2)"}}><div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}><div style={{width:40,height:40,borderRadius:10,background:"#fff7ed",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{"⚠️"}</div><div><div style={{fontSize:16,fontWeight:700,color:"#0a3d2f"}}>Cambios sin guardar</div><div style={{fontSize:13,color:"#64748b",marginTop:2}}>{"Realizaste cambios en la configuración que no fueron guardados."}</div></div></div><div style={{display:"flex",gap:10,marginTop:20}}><button onClick={onDiscard} style={{flex:1,padding:"11px 0",background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer",color:"#64748b"}}>Descartar</button><button onClick={onCancel} style={{flex:1,padding:"11px 0",background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer",color:"#334155"}}>Cancelar</button><button onClick={onSave} disabled={saving} style={{flex:1,padding:"11px 0",background:"#0d9488",border:"none",borderRadius:10,fontSize:13,fontWeight:700,cursor:saving?"wait":"pointer",color:"#fff",opacity:saving?.7:1}}>{saving?"Guardando...":"Guardar"}</button></div></div></div>;
}

export default function App() {
  var _au = useState(undefined), authUser = _au[0], setAuthUser = _au[1];
  var _pr = useState(null), profile = _pr[0], setProfile = _pr[1];
  var _vw = useState("dash"), view = _vw[0], sV = _vw[1];
  var _ae = useState([]), allEvals = _ae[0], setAllEvals = _ae[1];
  var _sl = useState(null), sel = _sl[0], sS = _sl[1];
  var _tt = useState(null), toast = _tt[0], sT = _tt[1];
  var _ld = useState(false), loading = _ld[0], sL = _ld[1];
  var _mb = useState(isMobile()), mobile = _mb[0];
  var _sb = useState(false), sessionBlocked = _sb[0], setSessionBlocked = _sb[1];
  var _nc = useState(false), showNoCredits = _nc[0], setShowNoCredits = _nc[1];
  var _pp = useState(false), paymentProcessed = _pp[0], setPaymentProcessed = _pp[1];
  var _pl = useState(true), profileLoading = _pl[0], setProfileLoading = _pl[1];
  var _et = useState(null), enabledTools = _et[0], setEnabledTools = _et[1];
  var _tc = useState(null), toolsConfig = _tc[0], setToolsConfig = _tc[1];
  var _activeDraft = useState(null), activeDraft = _activeDraft[0], setActiveDraft = _activeDraft[1];
  var _userSettings = useState(null), userSettings = _userSettings[0], setUserSettings = _userSettings[1];
  var configDirtyRef = useRef(false); var settingsRef = useRef(null);
  var _unsavedModal = useState(null), unsavedModal = _unsavedModal[0], setUnsavedModal = _unsavedModal[1];
  var _savingModal = useState(false), savingModal = _savingModal[0], setSavingModal = _savingModal[1];
  var _runTour = useState(false), runTour = _runTour[0], setRunTour = _runTour[1];
  var _theme = useState(null), theme = _theme[0], setTheme = _theme[1];
  var nfy = useCallback(function(m,t){ sT({m:m,t:t}); setTimeout(function(){sT(null)},4500); },[]);
  var isAdmin = profile?.role === "admin";
  useSessionHeartbeat(authUser?.uid, isAdmin);

  // Auto-trigger tour for first-time users
  useEffect(function(){
    if(!authUser?.uid || !profile) return;
    var key = "bk_onboarding_" + authUser.uid;
    if(!localStorage.getItem(key)){
      setTimeout(function(){ setRunTour(true); }, 800);
    }
  },[authUser, profile]);

  var handleTourFinish = function(){
    setRunTour(false);
    if(authUser?.uid){
      localStorage.setItem("bk_onboarding_" + authUser.uid, "done");
    }
  };

  var startTourManually = function(){
    if(view !== "dash") doNav("dash");
    setTimeout(function(){ setRunTour(true); }, 300);
  };

  useEffect(function(){
    if(!authUser?.uid || paymentProcessed) return;
    if(!_paymentFlag) return;
    setPaymentProcessed(true);
    if(_paymentFlag === "success"){
      nfy("\u2705 \u00a1Pago aprobado! Acreditando cr\u00e9ditos...","ok");
      if(_paymentId){
        fetch("/api/verify-payment", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uid: authUser.uid, payment_id: _paymentId }) }).then(function(r){ return r.json(); }).then(function(data){
          if(data.success){ nfy("\u2705 \u00a1"+(data.credits_added||"")+" cr\u00e9ditos acreditados!","ok"); }
          else if(data.already_processed){ nfy("\u2705 Cr\u00e9ditos ya acreditados","ok"); }
          else { nfy("Error verificando pago: "+(data.error||data.status||"desconocido"),"er"); }
          getUserProfile(authUser.uid).then(function(prof){ if(prof) setProfile(prof); });
        }).catch(function(e){ nfy("Error de conexi\u00f3n al verificar pago","er"); setTimeout(function(){ getUserProfile(authUser.uid).then(function(prof){ if(prof) setProfile(prof); }); },5000); });
      } else { [3000, 8000, 15000].forEach(function(delay){ setTimeout(function(){ getUserProfile(authUser.uid).then(function(prof){ if(prof) setProfile(prof); }); }, delay); }); }
    } else if(_paymentFlag === "failure"){ nfy("El pago no se complet\u00f3. Intent\u00e1 nuevamente.","er"); }
    else if(_paymentFlag === "pending"){ nfy("\u23f3 Pago pendiente. Los cr\u00e9ditos se acreditar\u00e1n cuando se confirme.","ok"); }
  },[authUser, paymentProcessed]);

  useEffect(function(){
    var unsub = onAuthStateChanged(auth, function(u){
      if(u){ setAuthUser(u); if(u.emailVerified){ setProfileLoading(true); getUserProfile(u.uid).then(function(prof){ if(prof && prof.profileComplete){ acquireSessionLock(u.uid, prof.role==="admin").then(function(canLogin){ if(!canLogin){ setSessionBlocked(true); setAuthUser(u); setProfile(prof); return; } setSessionBlocked(false); setProfile(prof); if(prof.settings) setUserSettings(prof.settings); }); } else setProfile(null); }).finally(function(){ setProfileLoading(false); }); } else { setProfileLoading(false); } } else { setAuthUser(null); setProfile(null); setProfileLoading(false); }
    }); return unsub;
  },[]);

  var loadEvals = useCallback(function(){
    if(!profile) return; sL(true);
    var p = profile.role==="admin" ? fbGetAll("evaluaciones") : fbGetFiltered("evaluaciones",authUser.uid);
    p.then(function(res){ if(profile.role==="admin") res.sort(function(a,b){return(b.fechaGuardado||"").localeCompare(a.fechaGuardado||"")}); setAllEvals(res); }).catch(function(e){console.error("loadEvals error:",e); setAllEvals([]);}).finally(function(){sL(false)});
  },[profile,authUser]);

  useEffect(function(){ if(profile && !sessionBlocked) loadEvals(); },[profile,loadEvals,sessionBlocked]);
  useEffect(function(){ if(!profile) return; getDoc(doc(db,"config","tools")).then(function(snap){ if(snap.exists()){ var cfg = snap.data(); setToolsConfig(cfg); var enabled = {}; Object.keys(cfg).forEach(function(k){ enabled[k] = cfg[k].enabled !== false; }); setEnabledTools(enabled); } }).catch(function(){}); getDoc(doc(db,"config","theme")).then(function(snap){ if(snap.exists()) setTheme(snap.data()); }).catch(function(){}); },[profile]);

  var goToPremium = function(){ sV("premium"); sS(null); window.scrollTo({top:0,behavior:"smooth"}); };
  var prevViewRef = useRef("dash");
  var doNav = function(v){ prevViewRef.current = view; window.history.pushState({view:v}, "", ""); sV(v); sS(null); window.scrollTo({top:0,behavior:"smooth"}); };
  var navTo = function(v){
    if(ALL_NEW_VIEWS.indexOf(view) !== -1 && v!==view){ if(!window.confirm("Salir de la evaluacion?\n\nLa evaluacion no se guarda a medias y el credito consumido no se recupera.")) return; }
    if(view === "config" && v !== "config" && configDirtyRef.current){ setUnsavedModal(v); return; }
    doNav(v);
  };

  useEffect(function(){
    var onPop = function(e){
      if(ALL_NEW_VIEWS.indexOf(view) !== -1){ if(!window.confirm("Salir de la evaluacion?\n\nLa evaluacion no se guarda a medias.")) { window.history.pushState({view:view}, "", ""); return; } }
      if(view === "config" && configDirtyRef.current){ window.history.pushState({view:view}, "", ""); setUnsavedModal(prevViewRef.current || "dash"); return; }
      sV(prevViewRef.current || "dash"); sS(null);
    };
    window.addEventListener("popstate", onPop); window.history.replaceState({view:"dash"}, "", "");
    return function(){ window.removeEventListener("popstate", onPop); };
  },[view]);

  var checkCredits = function(){ if(!profile) return false; if(profile.role==="admin") return true; if((profile.creditos||0)<1){ setShowNoCredits(true); return false; } return true; };
  var deductCredit = function(){ if(!profile || profile.role==="admin") return Promise.resolve(true); var userRef = doc(db,"usuarios",authUser.uid); return updateDoc(userRef,{creditos:increment(-1)}).then(function(){ return getDoc(userRef); }).then(function(fresh){ if(fresh.exists()){ var newCredits = fresh.data().creditos; setProfile(function(p){return Object.assign({},p,{creditos:newCredits})}); } return true; }).catch(function(e){ nfy("Error al descontar cr\u00e9dito: " + e.message, "er"); return false; }); };
  var startEval = function(toolId){ if(!checkCredits()) return; if(!isAdmin){ var showWarning = !userSettings || userSettings.creditWarning !== false; if(showWarning){ var ok = window.confirm("Iniciar evaluacion?\n\nSe consumira 1 credito de tu cuenta. Esta accion no se puede deshacer.\n\nEste aviso se puede desactivar en Configuraci\u00f3n \u2192 General."); if(!ok) return; } deductCredit().then(function(success){ if(success){ prevViewRef.current=view; window.history.pushState({view:toolId},"",""); sV(toolId); } }); } else { prevViewRef.current=view; window.history.pushState({view:toolId},"",""); sV(toolId); } };
  var onEvalDone = function(data){ if(data === "tools"){ setActiveDraft(null); sV("tools"); sS(null); loadEvals(); window.scrollTo({top:0,behavior:"smooth"}); return; } };
  var resumeDraft = function(draft){ var evalConfig = null; for(var k in EVAL_TYPES){ if(EVAL_TYPES[k].id === draft.evalType){ evalConfig = EVAL_TYPES[k]; break; } } if(!evalConfig){ return; } setActiveDraft(draft); prevViewRef.current = "tools"; window.history.pushState({view:evalConfig.newView},"",""); sV(evalConfig.newView); };
  var viewReport = function(ev){ sS(ev); var rv = rptViewFor(ev.tipo); if(rv){ prevViewRef.current=view; window.history.pushState({view:rv},"",""); sV(rv); } };
  var deleteEval = function(fbId){ fbDelete("evaluaciones",fbId).then(function(res){ if(res.success){ nfy("Evaluaci\u00f3n eliminada","ok"); loadEvals(); } else nfy("Error: "+res.error,"er"); sS(null); sV("hist"); }); };
  var handleLogout = function(){ var p = authUser?.uid ? releaseSessionLock(authUser.uid) : Promise.resolve(); p.then(function(){ return signOut(auth); }).then(function(){ setAuthUser(null); setProfile(null); setSessionBlocked(false); sV("dash"); sS(null); }); };

  var handleUnsavedDiscard = function(){ configDirtyRef.current = false; var dest = unsavedModal; setUnsavedModal(null); doNav(dest); };
  var handleUnsavedCancel = function(){ setUnsavedModal(null); };
  var handleUnsavedSave = function(){ if(settingsRef.current && settingsRef.current.save){ setSavingModal(true); settingsRef.current.save().then(function(ok){ setSavingModal(false); configDirtyRef.current = false; var dest = unsavedModal; setUnsavedModal(null); doNav(dest); }); } else { setUnsavedModal(null); } };

  if(authUser===undefined) return (<div style={{width:"100vw",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0a3d2f",color:"#fff",fontFamily:"'DM Sans',system-ui,sans-serif"}}><div style={{textAlign:"center"}}><img src="/img/logo_96.png" alt="Br\u00fajula KIT" style={{width:48,height:48,marginBottom:16}} /><div style={{fontSize:20,fontWeight:700}}>Cargando...</div></div></div>);
  if(!authUser) return <AuthScreen onDone={function(u,p){setAuthUser(u);setProfile(p)}} />;
  if(authUser && !authUser.emailVerified) return <VerifyEmailScreen user={authUser} onLogout={handleLogout} />;
  if(authUser && authUser.emailVerified && profileLoading) return (<div style={{width:"100vw",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0a3d2f",color:"#fff",fontFamily:"'DM Sans',system-ui,sans-serif"}}><div style={{textAlign:"center"}}><img src="/img/logo_96.png" alt="Br\u00fajula KIT" style={{width:48,height:48,marginBottom:16}} /><div style={{fontSize:20,fontWeight:700}}>Cargando...</div></div></div>);
  if(authUser && authUser.emailVerified && !profile) return <CompleteProfileScreen uid={authUser.uid} email={authUser.email} onDone={function(p){setProfile(p)}} />;

  if(sessionBlocked) return (<div style={{width:"100vw",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(145deg,#0a3d2f,#0d7363)",fontFamily:"'DM Sans',system-ui,sans-serif"}}><div style={{background:"rgba(255,255,255,.97)",borderRadius:16,padding:"44px 36px",width:440,maxWidth:"92vw",boxShadow:"0 20px 50px rgba(0,0,0,.3)",textAlign:"center"}}><div style={{fontSize:48,marginBottom:16}}>{"🔒"}</div><h2 style={{fontSize:20,fontWeight:700,color:"#0a3d2f",marginBottom:12}}>{"¿Sesión ocupada?"}</h2><p style={{color:"#64748b",fontSize:14,lineHeight:1.7,marginBottom:20}}>{"Otro usuario ya está conectado en este momento."}</p><p style={{color:"#94a3b8",fontSize:12,marginBottom:24}}>{"Si cree que es un error, espere unos minutos e intente nuevamente."}</p><div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}><button onClick={function(){acquireSessionLock(authUser.uid,false).then(function(canLogin){if(canLogin){setSessionBlocked(false);window.location.reload()}else{nfy("La sesión sigue ocupada","er")}})}} style={{background:"#0d9488",color:"#fff",border:"none",padding:"12px 24px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>Reintentar</button><button onClick={handleLogout} style={{background:"#f1f5f9",border:"none",padding:"12px 24px",borderRadius:8,fontSize:14,cursor:"pointer",color:"#64748b"}}>{"Cerrar sesión"}</button></div></div></div>);

  var nav = [["dash","dash","Panel"],["tools","tools","Herramientas"],["hist","hist","Historial"],["pacientes","pacientes","Pacientes"],["calendario","calendario","Calendario"],["premium","premium","Créditos"],["profile","profile","Perfil"],["config","config","Configuración"]];
  if(isAdmin){ nav.push(["stats","stats","Estadísticas"]); nav.push(["adm","adm","Administrar"]); }
  var tSd = theme && theme.primary ? mixColor(theme.primary, theme.primaryAlpha != null ? theme.primaryAlpha : 100) : K.sd;
  var tAc = theme && theme.secondary ? mixColor(theme.secondary, theme.secondaryAlpha != null ? theme.secondaryAlpha : 100) : K.ac;
  var tSdAlpha = theme && theme.primaryAlpha != null ? theme.primaryAlpha/100 : 1;
  var tAcAlpha = theme && theme.secondaryAlpha != null ? theme.secondaryAlpha/100 : 1;

  return (
    <div style={{display:"flex",height:"100vh",width:"100vw",fontFamily:"'DM Sans',system-ui,sans-serif",background:K.bg,color:"#1e293b",overflow:"hidden"}}>
      <Suspense fallback={null}>{runTour && <OnboardingTourLazy run={runTour} onFinish={handleTourFinish} />}</Suspense>
      {showNoCredits && <NoCreditsModal onClose={function(){setShowNoCredits(false);sV("dash")}} onUpgrade={function(){setShowNoCredits(false);goToPremium()}} />}
      {unsavedModal !== null && <UnsavedChangesModal onDiscard={handleUnsavedDiscard} onCancel={handleUnsavedCancel} onSave={handleUnsavedSave} saving={savingModal} />}
      <aside style={{width:mobile?60:230,minWidth:mobile?60:230,background:tSd,color:"#fff",display:"flex",flexDirection:"column",padding:"18px 0",flexShrink:0,height:"100vh"}}>
        <div data-tour="sidebar-logo" style={{padding:"0 14px",marginBottom:26,display:"flex",alignItems:"center",gap:9}}><img src="/img/logo_96.png" alt="Logo" style={{width:28,height:28}} />{!mobile&&<div><div style={{fontSize:17,fontWeight:700}}>{"Brújula KIT"}</div><div style={{fontSize:9,color:"#5eead4",fontWeight:600,letterSpacing:"1px"}}>{"FONOAUDIOLOGÍA"}</div></div>}</div>
        <nav style={{flex:1}}>{nav.map(function(n){ var id=n[0],iconKey=n[1],lb=n[2]; var active = view===id; return <button key={id} data-tour={NAV_TOUR_IDS[id]||""} onClick={function(){navTo(id)}} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:mobile?"13px 0":"11px 18px",background:active?"rgba(94,234,212,.12)":"transparent",border:"none",color:active?"#5eead4":"rgba(255,255,255,.55)",cursor:"pointer",fontSize:14,fontWeight:active?600:400,borderLeft:active?"3px solid #5eead4":"3px solid transparent",textAlign:"left",justifyContent:mobile?"center":"flex-start",transition:"all .15s ease"}}><span style={{display:"flex",alignItems:"center",opacity:active?1:.7}}>{icons[iconKey]}</span>{!mobile&&<span>{lb}</span>}</button>; })}</nav>
        <div style={{padding:"0 14px",borderTop:"1px solid rgba(255,255,255,.1)",paddingTop:12}}>{!mobile&&<div style={{fontSize:10,color:"rgba(255,255,255,.45)",marginBottom:3}}>{"Sesión: "}<b style={{color:"#5eead4"}}>{profile.username}</b>{isAdmin&&<span style={{background:"#5eead4",color:K.sd,padding:"1px 5px",borderRadius:3,fontSize:8,marginLeft:6,fontWeight:700}}>ADMIN</span>}</div>}{!mobile&&<div style={{fontSize:10,color:"rgba(255,255,255,.35)",marginBottom:8}}>{"Créditos: "}<b style={{color:profile.creditos>0?"#5eead4":"#f87171"}}>{isAdmin?"\u221e":(profile.creditos||0)}</b></div>}<button onClick={handleLogout} style={{display:"flex",alignItems:"center",justifyContent:mobile?"center":"flex-start",gap:8,background:"rgba(255,255,255,.08)",border:"none",color:"rgba(255,255,255,.6)",padding:"9px 12px",borderRadius:8,cursor:"pointer",fontSize:12,width:"100%",transition:"all .15s ease"}}><span style={{display:"flex",alignItems:"center"}}>{icons.logout}</span>{!mobile&&<span>{"Cerrar sesión"}</span>}</button></div>
      </aside>
      <main id="main-scroll" style={{flex:1,overflowY:"auto",overflowX:"hidden",padding:mobile?"16px":"28px 36px",height:"100vh",backgroundImage:"url(\""+DINO_BG+"\")",backgroundRepeat:"repeat",backgroundSize:"400px 400px"}}>
        {toast&&<div style={{position:"fixed",top:16,right:16,zIndex:999,background:toast.t==="ok"?"#059669":"#dc2626",color:"#fff",padding:"10px 18px",borderRadius:8,fontSize:13,fontWeight:500,boxShadow:"0 4px 16px rgba(0,0,0,.15)",animation:"fi .3s ease"}}>{toast.m}</div>}
        <ErrorBoundary onReset={function(){ sV("dash"); sS(null); }}>
        {view==="dash"&&<Dashboard allEvals={allEvals} onT={function(){navTo("tools")}} onView={viewReport} ld={loading} profile={profile} isAdmin={isAdmin} userId={authUser?.uid} nfy={nfy} onCalendar={function(){navTo("calendario")}} onStartEval={startEval} onBuyCredits={goToPremium} userSettings={userSettings} />}
        {view==="tools"&&<Tools onSel={startEval} credits={isAdmin?999:(profile.creditos||0)} onBuy={goToPremium} enabledTools={enabledTools} toolsConfig={toolsConfig} userId={authUser?.uid} onResumeDraft={resumeDraft} allEvals={allEvals} nfy={nfy} />}
        <Suspense fallback={LazyFallback}>
          {NEW_COMPONENTS[view] && (function(){ var C = NEW_COMPONENTS[view]; return <C onS={onEvalDone} nfy={nfy} userId={authUser?.uid} draft={activeDraft} therapistInfo={profile?.reportHeader} />; })()}
          {view==="hist"&&<Hist allEvals={allEvals} onView={viewReport} isA={isAdmin} onD={deleteEval} enabledTools={enabledTools} />}
          {RPT_COMPONENTS[view] && sel && (function(){ var C = RPT_COMPONENTS[view]; return <C ev={sel} onD={deleteEval} userSettings={userSettings} therapistInfo={profile?.reportHeader} />; })()}
          {view==="profile"&&<ProfilePage profile={profile} authUser={authUser} nfy={nfy} onBuyCredits={goToPremium} />}
          {view==="pacientes"&&<PacientesPage userId={authUser?.uid} nfy={nfy} allEvals={allEvals} />}
          {view==="calendario"&&<CalendarPage userId={authUser?.uid} nfy={nfy} userSettings={userSettings} profesionalNombre={profile?.nombre || profile?.username || ""} />}
          {view==="premium"&&<PremiumPage profile={profile} authUser={authUser} nfy={nfy} onBack={function(){sV("dash")}} />}
          {view==="config"&&<SettingsPage ref={settingsRef} userId={authUser?.uid} nfy={nfy} profile={profile} onSettingsChange={function(s){ setUserSettings(s); }} onDirtyChange={function(d){ configDirtyRef.current = d; }} onStartTour={startTourManually} />}
          {view==="adm"&&isAdmin&&<AdminPanel nfy={nfy} />}
          {view==="stats"&&isAdmin&&<AdminStats nfy={nfy} />}
        </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}
