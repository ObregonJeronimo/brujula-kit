import { useState, useEffect, useCallback, useRef, lazy, Suspense, Component } from "react";
import { db, auth, doc, updateDoc, getDoc, getDocs, collection, query, where, increment, onAuthStateChanged, signOut } from "./firebase.js";
import { fbGetAll, fbGetFiltered, fbAdd, fbDelete, getUserProfile, K } from "./lib/fb.js";
import { acquireSessionLock, releaseSessionLock, useSessionHeartbeat } from "./lib/sessionLock.js";
import { VISIBLE_TYPES, EVAL_TYPES, rptViewFor } from "./config/evalTypes.js";
import { applyThemeToCSS } from "./styles/themeBridge.js";
import "./styles/evalkit.css";

import AuthScreen from "./components/AuthScreen.jsx";
import VerifyEmailScreen from "./components/VerifyEmail.jsx";
import CompleteProfileScreen from "./components/CompleteProfile.jsx";
import Dashboard from "./components/Dashboard.jsx";
import Tools from "./components/Tools.jsx";
import NoCreditsModal from "./components/NoCreditsModal.jsx";
import ChangelogModal from "./components/ChangelogModal.jsx";
import SupportWidget from "./components/SupportWidget.jsx";

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

var OnboardingTourLazy = lazyRetry(function(){ return import("./components/OnboardingTour.jsx"); });
var Hist = lazyRetry(function(){ return import("./components/Hist.jsx"); });
var ProfilePage = lazyRetry(function(){ return import("./components/ProfilePage.jsx"); });
var PremiumPage = lazyRetry(function(){ return import("./components/PremiumPage.jsx"); });
var CalendarPage = lazyRetry(function(){ return import("./components/CalendarPage.jsx"); });
var PacientesPage = lazyRetry(function(){ return import("./components/PacientesPage.jsx"); });
var AdminPanel = lazyRetry(function(){ return import("./components/AdminPanel.jsx"); });
var AdminStats = lazyRetry(function(){ return import("./components/AdminStats.jsx"); });
var SettingsPage = lazyRetry(function(){ return import("./components/SettingsPage.jsx"); });
var SupportPanel = lazyRetry(function(){ return import("./components/SupportPanel.jsx"); });
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

var LazyFallback = <div className="ek-lazy-fallback">Cargando...</div>;

class ErrorBoundary extends Component {
  constructor(props){ super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error){ return { hasError: true, error: error }; }
  componentDidCatch(error, info){ console.error("ErrorBoundary caught:", error, info); }
  render(){
    if(this.state.hasError){
      var self = this;
      return <div className="ek-err"><div className="ek-err-icon">{"⚠️"}</div><h2 className="ek-err-title">{"Algo salió mal"}</h2><p className="ek-err-msg">{this.state.error ? this.state.error.message : "Error inesperado"}</p><button onClick={function(){ self.setState({hasError:false,error:null}); if(self.props.onReset) self.props.onReset(); }} className="ek-err-btn">{"Volver al Panel"}</button></div>;
    }
    return this.props.children;
  }
}

var NEW_COMPONENTS = { newPEFF: NewPEFF, newELDI: NewELDI, newOFA: NewOFA, newFON: NewFON, newREP: NewREP, newDISC: NewDISC, newRECO: NewRECO };
var RPT_COMPONENTS = { rptP: RptPEFF, rptR: RptREP, rptD: RptDISC, rptRC: RptRECO, rptEL: RptELDI, rptGen: RptGeneric };
var ALL_NEW_VIEWS = Object.keys(NEW_COMPONENTS);
var isMobile = function(){ return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && window.innerWidth < 900; };
var AGENT_ROLES = ["agent", "agent_senior"];

var mixColor = function(hex, alpha){ if(!hex || alpha >= 100) return hex; var r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16); var a = Math.max(30, Math.min(100, alpha)) / 100; var mr = Math.round(r * a + 255 * (1-a)), mg = Math.round(g * a + 255 * (1-a)), mb = Math.round(b * a + 255 * (1-a)); return "#" + ((1<<24)+(mr<<16)+(mg<<8)+mb).toString(16).slice(1); };

var _cachedBg = (function(){ try { var t = JSON.parse(localStorage.getItem("bk_theme")||"null"); if(t && t.primary) return mixColor(t.primary, t.primaryAlpha != null ? t.primaryAlpha : 100); } catch(e){} return "#0a3d2f"; })();

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
  support: I(<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>),
  logout: I(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>)
};

var DINO_BG = "/img/dino_bg_opt.jpg";
var NAV_TOUR_IDS = { dash:"nav-dash", tools:"nav-tools", hist:"nav-hist", pacientes:"nav-pacientes", calendario:"nav-calendario", premium:"nav-premium", profile:"nav-profile", config:"nav-config", stats:"nav-stats", adm:"nav-adm", support:"nav-support" };

var _urlParams = new URLSearchParams(window.location.search);
var _paymentFlag = _urlParams.get("payment") || (_urlParams.get("collection_status") === "approved" ? "success" : null);
var _paymentId = _urlParams.get("payment_id") || _urlParams.get("collection_id");
if(_paymentFlag || _paymentId){ window.history.replaceState({},"",window.location.pathname); }

function UnsavedChangesModal({ onDiscard, onCancel, onSave, saving }){
  return <div className="ek-modal-backdrop"><div className="ek-unsaved-card"><div className="ek-unsaved-head"><div className="ek-unsaved-icon">{"⚠️"}</div><div><div className="ek-unsaved-title">Cambios sin guardar</div><div className="ek-unsaved-sub">{"Realizaste cambios en la configuración que no fueron guardados."}</div></div></div><div className="ek-unsaved-actions"><button onClick={onDiscard} className="ek-unsaved-btn ek-unsaved-btn--discard">Descartar</button><button onClick={onCancel} className="ek-unsaved-btn ek-unsaved-btn--cancel">Cancelar</button><button onClick={onSave} disabled={saving} className={"ek-unsaved-btn ek-unsaved-btn--save"+(saving?" is-saving":"")}>{saving?"Guardando...":"Guardar"}</button></div></div></div>;
}

function NoPacientesModal({ onClose, onGoPacientes }){
  return <div className="ek-modal-backdrop"><div className="ek-nopac-card"><div className="ek-nopac-head"><div className="ek-nopac-icon">{"\ud83d\udc64"}</div><div><div className="ek-nopac-title">{"Sin pacientes registrados"}</div><div className="ek-nopac-sub">{"No se puede continuar con la evaluación porque no hay pacientes registrados. Por favor, registre un paciente para continuar."}</div></div></div><div className="ek-nopac-actions"><button onClick={onClose} className="ek-nopac-btn ek-nopac-btn--close">Aceptar</button><button onClick={onGoPacientes} className="ek-nopac-btn ek-nopac-btn--go">{"Ir a Pacientes"}</button></div></div></div>;
}

export default function App() {
  var _au = useState(undefined), authUser = _au[0], setAuthUser = _au[1];
  var _pr = useState(null), profile = _pr[0], setProfile = _pr[1];
  var _vw = useState("dash"), view = _vw[0], sV = _vw[1];
  var _ae = useState([]), allEvals = _ae[0], setAllEvals = _ae[1];
  var _pac = useState([]), allPacientes = _pac[0], setAllPacientes = _pac[1];
  var _sl = useState(null), sel = _sl[0], sS = _sl[1];
  var _tt = useState(null), toast = _tt[0], sT = _tt[1];
  var _ld = useState(false), loading = _ld[0], sL = _ld[1];
  var _mb = useState(isMobile()), mobile = _mb[0];
  var _sb = useState(false), sessionBlocked = _sb[0], setSessionBlocked = _sb[1];
  var _nc = useState(false), showNoCredits = _nc[0], setShowNoCredits = _nc[1];
  var _np = useState(false), showNoPacientes = _np[0], setShowNoPacientes = _np[1];
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
  var _showChangelog = useState(true), showChangelog = _showChangelog[0], setShowChangelog = _showChangelog[1];
  var nfy = useCallback(function(m,t){ sT({m:m,t:t}); setTimeout(function(){sT(null)},4500); },[]);
  var isAdmin = profile?.role === "admin";
  var isUser = profile?.role === "user";
  var isAgent = profile?.role === "agent" || profile?.role === "agent_senior";
  var canSeeSupport = isAdmin || isAgent;
  useSessionHeartbeat(authUser?.uid, isAdmin);

  useEffect(function(){
    if(!authUser?.uid || !profile) return;
    var localKey = "bk_onboarding_" + authUser.uid;
    if(localStorage.getItem(localKey)) return;
    if(profile.onboardingDone) { localStorage.setItem(localKey, "done"); return; }
    setTimeout(function(){ setRunTour(true); }, 800);
  },[authUser, profile]);

  var handleTourFinish = function(){
    setRunTour(false);
    if(authUser?.uid){
      localStorage.setItem("bk_onboarding_" + authUser.uid, "done");
      updateDoc(doc(db, "usuarios", authUser.uid), { onboardingDone: true }).catch(function(){});
    }
  };
  var startTourManually = function(){ if(view !== "dash") doNav("dash"); setTimeout(function(){ setRunTour(true); }, 300); };

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
      if(u){
        setAuthUser(u);
        // For agents: skip email verification, load profile directly
        // For regular users: require email verification first
        var shouldLoadProfile = u.emailVerified;
        if(!shouldLoadProfile){
          // Check if this is an agent account (email not verified but has a profile with agent role)
          setProfileLoading(true);
          getUserProfile(u.uid).then(function(prof){
            if(prof && AGENT_ROLES.indexOf(prof.role) !== -1){
              // Agent account — skip email verification
              setProfile(prof);
              setSessionBlocked(false);
            } else {
              // Regular user without verified email — stay on verify screen
              setProfile(null);
            }
          }).finally(function(){ setProfileLoading(false); });
          return;
        }
        // Email is verified — normal flow
        setProfileLoading(true);
        getUserProfile(u.uid).then(function(prof){
          if(prof && prof.profileComplete){
            var _mob = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && window.innerWidth < 900;
            if(_mob){ setSessionBlocked(false); setProfile(prof); if(prof.settings) setUserSettings(prof.settings); }
            else { acquireSessionLock(u.uid, prof.role==="admin").then(function(canLogin){ if(!canLogin){ setSessionBlocked(true); setAuthUser(u); setProfile(prof); return; } setSessionBlocked(false); setProfile(prof); if(prof.settings) setUserSettings(prof.settings); }); }
          } else setProfile(null);
        }).finally(function(){ setProfileLoading(false); });
      } else { setAuthUser(null); setProfile(null); setProfileLoading(false); }
    }); return unsub;
  },[]);

  var loadEvals = useCallback(function(){
    if(!profile) return; sL(true);
    if(isAgent){ sL(false); return; }
    var p = profile.role==="admin" ? fbGetAll("evaluaciones") : fbGetFiltered("evaluaciones",authUser.uid);
    p.then(function(res){ if(profile.role==="admin") res.sort(function(a,b){return(b.fechaGuardado||"").localeCompare(a.fechaGuardado||"")}); setAllEvals(res); }).catch(function(e){console.error("loadEvals error:",e); setAllEvals([]);}).finally(function(){sL(false)});
    var pp = profile.role==="admin" ? fbGetAll("pacientes") : fbGetFiltered("pacientes",authUser.uid);
    pp.then(function(res){ setAllPacientes(res); }).catch(function(){ setAllPacientes([]); });
  },[profile,authUser]);

  useEffect(function(){ if(profile && !sessionBlocked) loadEvals(); },[profile,loadEvals,sessionBlocked]);
  useEffect(function(){ if(!profile || isAgent) return; getDoc(doc(db,"config","tools")).then(function(snap){ if(snap.exists()){ var cfg = snap.data(); setToolsConfig(cfg); var enabled = {}; Object.keys(cfg).forEach(function(k){ enabled[k] = cfg[k].enabled !== false; }); setEnabledTools(enabled); } }).catch(function(){}); getDoc(doc(db,"config","theme")).then(function(snap){ if(snap.exists()){ var td = snap.data(); setTheme(td); try { localStorage.setItem("bk_theme", JSON.stringify(td)); } catch(e){} } }).catch(function(){}); },[profile]);

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
  var startEval = function(toolId){ if(!isAdmin){ getDocs(query(collection(db,"pacientes"),where("userId","==",authUser.uid))).then(function(snap){ if(snap.empty){ setShowNoPacientes(true); return; } if(!checkCredits()) return; var showWarning = !userSettings || userSettings.creditWarning !== false; if(showWarning){ var ok = window.confirm("Comenzar evaluaci\u00f3n?\n\nSe consumir\u00e1 1 cr\u00e9dito de tu cuenta.\nEsta acci\u00f3n no se puede deshacer."); if(!ok) return; } deductCredit().then(function(success){ if(success){ prevViewRef.current=view; window.history.pushState({view:toolId},"",""); sV(toolId); } }); }).catch(function(e){ console.error("Error checking patients:",e); if(!checkCredits()) return; deductCredit().then(function(success){ if(success){ prevViewRef.current=view; window.history.pushState({view:toolId},"",""); sV(toolId); } }); }); } else { prevViewRef.current=view; window.history.pushState({view:toolId},"",""); sV(toolId); } };
  var onEvalDone = function(data){ if(data === "tools"){ setActiveDraft(null); sV("tools"); sS(null); loadEvals(); window.scrollTo({top:0,behavior:"smooth"}); return; } };
  var resumeDraft = function(draft){ var evalConfig = null; for(var k in EVAL_TYPES){ if(EVAL_TYPES[k].id === draft.evalType){ evalConfig = EVAL_TYPES[k]; break; } } if(!evalConfig){ return; } setActiveDraft(draft); prevViewRef.current = "tools"; window.history.pushState({view:evalConfig.newView},"",""); sV(evalConfig.newView); };
  var viewReport = function(ev){ sS(ev); var rv = rptViewFor(ev.tipo); if(rv){ prevViewRef.current=view; window.history.pushState({view:rv},"",""); sV(rv); } };
  var deleteEval = function(fbId){ fbDelete("evaluaciones",fbId).then(function(res){ if(res.success){ nfy("Evaluaci\u00f3n eliminada","ok"); loadEvals(); } else nfy("Error: "+res.error,"er"); sS(null); sV("hist"); }); };
  var handleLogout = function(){ var p = authUser?.uid ? releaseSessionLock(authUser.uid) : Promise.resolve(); p.then(function(){ return signOut(auth); }).then(function(){ setAuthUser(null); setProfile(null); setSessionBlocked(false); sV("dash"); sS(null); }); };

  var handleUnsavedDiscard = function(){ configDirtyRef.current = false; var dest = unsavedModal; setUnsavedModal(null); doNav(dest); };
  var handleUnsavedCancel = function(){ setUnsavedModal(null); };
  var handleUnsavedSave = function(){ if(settingsRef.current && settingsRef.current.save){ setSavingModal(true); settingsRef.current.save().then(function(ok){ setSavingModal(false); configDirtyRef.current = false; var dest = unsavedModal; setUnsavedModal(null); doNav(dest); }); } else { setUnsavedModal(null); } };

  var rh = profile && profile.reportHeader || {};
  var configIncomplete = profile && !isAdmin && !isAgent && (!rh.therapist || !rh.license || !rh.phone || !rh.clinic);
  var _forceConfig = useState(false), forceConfig = _forceConfig[0], setForceConfig = _forceConfig[1];
  useEffect(function(){
    if(!configIncomplete) return;
    var dismissed = localStorage.getItem("configDismissed");
    if(dismissed){
      var diff = Date.now() - parseInt(dismissed);
      if(diff < 24*60*60*1000) return;
    }
    setForceConfig(true);
  }, [configIncomplete]);

  if(authUser===undefined) return (<div className="ek-loading-screen" style={{"--ek-loading-bg":_cachedBg}}><div className="ek-loading-inner"><img src="/img/logo_96.png" alt="Br\u00fajula KIT" className="ek-loading-logo" /><div className="ek-loading-text">Cargando...</div></div></div>);
  if(!authUser) return <AuthScreen onDone={function(u,p){setAuthUser(u);setProfile(p)}} themeColor={_cachedBg} />;
  // Show verify email screen only for non-agent users without verified email
  if(authUser && !authUser.emailVerified && !profile) return <VerifyEmailScreen user={authUser} onLogout={handleLogout} themeColor={_cachedBg} />;
  if(authUser && profileLoading) return (<div className="ek-loading-screen" style={{"--ek-loading-bg":_cachedBg}}><div className="ek-loading-inner"><img src="/img/logo_96.png" alt="Br\u00fajula KIT" className="ek-loading-logo" /><div className="ek-loading-text">Cargando...</div></div></div>);
  if(authUser && (authUser.emailVerified || isAgent) && !profile) return <CompleteProfileScreen uid={authUser.uid} email={authUser.email} onDone={function(p){setProfile(p)}} themeColor={_cachedBg} />;

  if(sessionBlocked) return (<div className="ek-session-blocked" style={{"--ek-loading-bg":_cachedBg}}><div className="ek-session-card"><div className="ek-session-icon">{"🔒"}</div><h2 className="ek-session-title">{"¿Sesión ocupada?"}</h2><p className="ek-session-msg">{"Otro usuario ya está conectado en este momento."}</p><p className="ek-session-hint">{"Si cree que es un error, espere unos minutos e intente nuevamente."}</p><div className="ek-session-actions"><button onClick={function(){acquireSessionLock(authUser.uid,false).then(function(canLogin){if(canLogin){setSessionBlocked(false);window.location.reload()}else{nfy("La sesión sigue ocupada","er")}})}} className="ek-session-retry">Reintentar</button><button onClick={handleLogout} className="ek-session-logout">{"Cerrar sesión"}</button></div></div></div>);

  // Build navigation based on role
  var nav;
  if(isAgent){
    nav = [["support","support","Soporte"]];
    if(view === "dash") sV("support");
  } else {
    nav = [["dash","dash","Panel"],["tools","tools","Herramientas"],["hist","hist","Historial"],["pacientes","pacientes","Pacientes"],["calendario","calendario","Calendario"],["premium","premium","Cr\u00e9ditos"],["profile","profile","Perfil"],["config","config","Configuraci\u00f3n"]];
    if(isAdmin){ nav.push(["support","support","Soporte"]); nav.push(["stats","stats","Estad\u00edsticas"]); nav.push(["adm","adm","Administrar"]); }
    if(mobile){ nav = nav.filter(function(n){ return n[0] !== "tools" && n[0] !== "config"; }); }
  }

  var tSd = theme && theme.primary ? mixColor(theme.primary, theme.primaryAlpha != null ? theme.primaryAlpha : 100) : K.sd;
  var tAc = theme && theme.secondary ? mixColor(theme.secondary, theme.secondaryAlpha != null ? theme.secondaryAlpha : 100) : K.ac;
  var TC = {sd:tSd, ac:tAc};
  applyThemeToCSS(tSd, tAc);

  return (
    <div className="ek-layout">
      <Suspense fallback={null}>{runTour && !isAgent && <OnboardingTourLazy run={runTour} onFinish={handleTourFinish} />}</Suspense>
      {showNoCredits && <NoCreditsModal onClose={function(){setShowNoCredits(false);sV("dash")}} onUpgrade={function(){setShowNoCredits(false);goToPremium()}} />}
      {showNoPacientes && <NoPacientesModal onClose={function(){setShowNoPacientes(false)}} onGoPacientes={function(){setShowNoPacientes(false);doNav("pacientes")}} />}
      {unsavedModal !== null && <UnsavedChangesModal onDiscard={handleUnsavedDiscard} onCancel={handleUnsavedCancel} onSave={handleUnsavedSave} saving={savingModal} />}
      {showChangelog && authUser?.uid && profile && !isAgent && <ChangelogModal userId={authUser.uid} onClose={function(){ setShowChangelog(false); }} />}
      {forceConfig && !mobile && !isAgent && <div className="ek-force-backdrop">
        <div className="ek-force-card">
          <div className="ek-force-icon">{"\ud83d\udcdd"}</div>
          <div className="ek-force-title">{"Complet\u00e1 tus datos profesionales"}</div>
          <div className="ek-force-msg">{"Tus datos profesionales aparecen en el encabezado de cada informe que generes. Sin ellos, los informes se ver\u00e1n incompletos."}</div>
          <div className="ek-force-hint">{"Complet\u00e1: nombre del profesional, matr\u00edcula, tel\u00e9fono y nombre del consultorio en Configuraci\u00f3n."}</div>
          <button onClick={function(){ setForceConfig(false); doNav("config"); }} className="ek-force-cta">{"Ir a Configuraci\u00f3n"}</button>
          <button onClick={function(){ setForceConfig(false); localStorage.setItem("configDismissed",Date.now().toString()); }} className="ek-force-dismiss">{"Recordarme m\u00e1s tarde"}</button>
        </div>
      </div>}
      {isUser && authUser && <SupportWidget userId={authUser.uid} userName={profile?.username || profile?.nombre || ""} />}
      <aside className={"ek-sidebar"+(mobile?" is-mobile":"")}>
        <div data-tour="sidebar-logo" className="ek-sidebar-logo"><img src="/img/logo_96.png" alt="Logo" className="ek-sidebar-logo-img" />{!mobile&&<div><div className="ek-sidebar-logo-title">{"Brújula KIT"}</div><div className="ek-sidebar-logo-sub">{isAgent ? "SOPORTE" : "FONOAUDIOLOGÍA"}</div></div>}</div>
        <nav className="ek-sidebar-nav">{nav.map(function(n){ var id=n[0],iconKey=n[1],lb=n[2]; var active = view===id; return <button key={id} data-tour={NAV_TOUR_IDS[id]||""} onClick={function(){navTo(id)}} className={"ek-sidebar-btn"+(mobile?" is-mobile":"")+(active?" is-active":"")}><span className="ek-sidebar-btn-ico">{icons[iconKey]}</span>{!mobile&&<span>{lb}</span>}</button>; })}</nav>
        <div className="ek-sidebar-footer">{!mobile&&<div className="ek-sidebar-session">{"Sesión: "}<b className="ek-sidebar-session-name">{profile.username || profile.nombre || ""}</b>{isAdmin&&<span className="ek-sidebar-admin-badge">ADMIN</span>}{isAgent&&<span className="ek-sidebar-admin-badge" style={{background:"#7c3aed"}}>AGENTE</span>}</div>}{!mobile&&!isAgent&&<div className="ek-sidebar-credits">{"Créditos: "}<b className={"ek-sidebar-credits-value"+(profile.creditos>0?"":" is-empty")}>{isAdmin?"\u221e":(profile.creditos||0)}</b></div>}<button onClick={handleLogout} className={"ek-sidebar-logout"+(mobile?" is-mobile":"")}><span className="ek-sidebar-logout-ico">{icons.logout}</span>{!mobile&&<span>{"Cerrar sesión"}</span>}</button></div>
      </aside>
      <main id="main-scroll" className={"ek-main"+(mobile?" is-mobile":"")} style={{"--ek-main-bg":"url(\""+DINO_BG+"\")"}}>
        {toast&&<div className={"ek-toast"+(toast.t==="ok"?"":" is-err")}>{toast.m}</div>}
        <ErrorBoundary onReset={function(){ sV(isAgent?"support":"dash"); sS(null); }}>
        {view==="dash"&&!isAgent&&<Dashboard TC={TC} allEvals={allEvals} onT={function(){navTo("tools")}} onView={viewReport} ld={loading} profile={profile} isAdmin={isAdmin} userId={authUser?.uid} nfy={nfy} onCalendar={function(){navTo("calendario")}} onStartEval={startEval} onBuyCredits={goToPremium} userSettings={userSettings} />}
        {view==="tools"&&!isAgent&&<Tools TC={TC} onSel={startEval} credits={isAdmin?999:(profile.creditos||0)} onBuy={goToPremium} enabledTools={enabledTools} toolsConfig={toolsConfig} userId={authUser?.uid} onResumeDraft={resumeDraft} allEvals={allEvals} nfy={nfy} therapistInfo={profile?.reportHeader} deductCredit={deductCredit} isAdmin={isAdmin} onReload={loadEvals} />}
        <Suspense fallback={LazyFallback}>
          {NEW_COMPONENTS[view] && (function(){ var C = NEW_COMPONENTS[view]; return <C onS={onEvalDone} nfy={nfy} userId={authUser?.uid} draft={activeDraft} therapistInfo={profile?.reportHeader} deductCredit={deductCredit} isAdmin={isAdmin} userSettings={userSettings} />; })()}
          {view==="hist"&&!isAgent&&<Hist TC={TC} allEvals={allEvals} onView={viewReport} isA={isAdmin} onD={deleteEval} enabledTools={enabledTools} pacientes={allPacientes} />}
          {RPT_COMPONENTS[view] && sel && (function(){ var C = RPT_COMPONENTS[view]; return <C ev={sel} onD={deleteEval} userSettings={userSettings} therapistInfo={profile?.reportHeader} />; })()}
          {view==="profile"&&!isAgent&&<ProfilePage TC={TC} profile={profile} authUser={authUser} nfy={nfy} onBuyCredits={goToPremium} />}
          {view==="pacientes"&&!isAgent&&<PacientesPage TC={TC} userId={authUser?.uid} nfy={nfy} allEvals={allEvals} therapistInfo={profile?.reportHeader} />}
          {view==="calendario"&&!isAgent&&<CalendarPage userId={authUser?.uid} nfy={nfy} userSettings={userSettings} profesionalNombre={profile?.nombre || profile?.username || ""} />}
          {view==="premium"&&!isAgent&&<PremiumPage TC={TC} profile={profile} authUser={authUser} nfy={nfy} onBack={function(){sV("dash")}} />}
          {view==="config"&&!isAgent&&<SettingsPage ref={settingsRef} userId={authUser?.uid} nfy={nfy} profile={profile} onSettingsChange={function(s){ setUserSettings(s); }} onDirtyChange={function(d){ configDirtyRef.current = d; }} onStartTour={startTourManually} />}
          {view==="support"&&canSeeSupport&&<SupportPanel nfy={nfy} agentUid={authUser?.uid} agentName={profile?.username || profile?.nombre || ""} agentRole={profile?.role} />}
          {view==="adm"&&isAdmin&&<AdminPanel nfy={nfy} />}
          {view==="stats"&&isAdmin&&<AdminStats nfy={nfy} />}
        </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}
