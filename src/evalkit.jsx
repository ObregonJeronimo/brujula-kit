import { useState, useEffect, useCallback } from "react";
import { db, auth, doc, updateDoc, getDoc, increment, onAuthStateChanged, signOut } from "./firebase.js";
import { fbGetAll, fbGetFiltered, fbAdd, fbDelete, getUserProfile, K } from "./lib/fb.js";
import { acquireSessionLock, releaseSessionLock, useSessionHeartbeat } from "./lib/sessionLock.js";

import AuthScreen from "./components/AuthScreen.jsx";
import VerifyEmailScreen from "./components/VerifyEmail.jsx";
import CompleteProfileScreen from "./components/CompleteProfile.jsx";

import Dashboard from "./components/Dashboard.jsx";
import Tools from "./components/Tools.jsx";
import ProfilePage from "./components/ProfilePage.jsx";
import PremiumPage from "./components/PremiumPage.jsx";
import NoCreditsModal from "./components/NoCreditsModal.jsx";

import Hist from "./components/Hist.jsx";
import RptELDI from "./components/RptELDI.jsx";
import RptPEFF from "./components/RptPEFF.jsx";
import RptREP from "./components/RptREP.jsx";
import Admin from "./components/Admin.jsx";
import AdminStats from "./components/AdminStats.jsx";
import NewELDI from "./components/NewELDI.jsx";
import NewPEFF from "./components/NewPEFF.jsx";
import NewREP from "./components/NewREP.jsx";
import CalendarPage from "./components/CalendarPage.jsx";
import PacientesPage from "./components/PacientesPage.jsx";

var isMobile = function(){ return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && window.innerWidth < 900; };

// SVG icon components (Lucide/Feather style, 20x20, stroke-based)
var I = function(d){ return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{d}</svg>; };
var icons = {
  dash: I(<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>),
  tools: I(<><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>),
  hist: I(<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>),
  pacientes: I(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>),
  calendario: I(<><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>),
  premium: I(<><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><line x1="12" y1="6" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="18"/></>),
  profile: I(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>),
  stats: I(<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>),
  adm: I(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>),
  logout: I(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>)
};

// Read payment params from URL once at load time (before any replaceState)
var _urlParams = new URLSearchParams(window.location.search);
var _paymentFlag = _urlParams.get("payment") || (_urlParams.get("collection_status") === "approved" ? "success" : null);
var _paymentId = _urlParams.get("payment_id") || _urlParams.get("collection_id");
if(_paymentFlag || _paymentId){
  window.history.replaceState({},"",window.location.pathname);
}

export default function App() {
  var _au = useState(undefined), authUser = _au[0], setAuthUser = _au[1];
  var _pr = useState(null), profile = _pr[0], setProfile = _pr[1];
  var _vw = useState("dash"), view = _vw[0], sV = _vw[1];
  var _ev = useState([]), evals = _ev[0], sE = _ev[1];
  var _pe = useState([]), peffEvals = _pe[0], sPE = _pe[1];
  var _re = useState([]), repEvals = _re[0], sRE = _re[1];
  var _sl = useState(null), sel = _sl[0], sS = _sl[1];
  var _tt = useState(null), toast = _tt[0], sT = _tt[1];
  var _ld = useState(false), loading = _ld[0], sL = _ld[1];
  var _mb = useState(isMobile()), mobile = _mb[0];
  var _sb = useState(false), sessionBlocked = _sb[0], setSessionBlocked = _sb[1];
  var _nc = useState(false), showNoCredits = _nc[0], setShowNoCredits = _nc[1];
  var _pp = useState(false), paymentProcessed = _pp[0], setPaymentProcessed = _pp[1];
  var nfy = useCallback(function(m,t){ sT({m:m,t:t}); setTimeout(function(){sT(null)},4500); },[]);
  var isAdmin = profile?.role === "admin";
  useSessionHeartbeat(authUser?.uid, isAdmin);

  useEffect(function(){
    if(!authUser?.uid || paymentProcessed) return;
    if(!_paymentFlag) return;
    setPaymentProcessed(true);
    if(_paymentFlag === "success"){
      nfy("\u2705 \u00a1Pago aprobado! Acreditando cr\u00e9ditos...","ok");
      if(_paymentId){
        console.log("[payment] Verifying payment_id:", _paymentId, "for uid:", authUser.uid);
        fetch("/api/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: authUser.uid, payment_id: _paymentId })
        }).then(function(r){ return r.json(); }).then(function(data){
          console.log("[payment] verify-payment response:", data);
          if(data.success){ nfy("\u2705 \u00a1"+(data.credits_added||"")+" cr\u00e9ditos acreditados!","ok"); }
          else if(data.already_processed){ nfy("\u2705 Cr\u00e9ditos ya acreditados","ok"); }
          else { nfy("Error verificando pago: "+(data.error||data.status||"desconocido"),"er"); }
          getUserProfile(authUser.uid).then(function(prof){ if(prof) setProfile(prof); });
        }).catch(function(e){
          console.error("[payment] verify-payment error:", e);
          nfy("Error de conexi\u00f3n al verificar pago","er");
          setTimeout(function(){ getUserProfile(authUser.uid).then(function(prof){ if(prof) setProfile(prof); }); },5000);
        });
      } else {
        console.log("[payment] No payment_id in URL, waiting for webhook...");
        [3000, 8000, 15000].forEach(function(delay){ setTimeout(function(){ getUserProfile(authUser.uid).then(function(prof){ if(prof) setProfile(prof); }); }, delay); });
      }
    } else if(_paymentFlag === "failure"){ nfy("El pago no se complet\u00f3. Intent\u00e1 nuevamente.","er"); }
    else if(_paymentFlag === "pending"){ nfy("\u23f3 Pago pendiente. Los cr\u00e9ditos se acreditar\u00e1n cuando se confirme.","ok"); }
  },[authUser, paymentProcessed]);

  useEffect(function(){
    var unsub = onAuthStateChanged(auth, function(u){
      if(u){
        if(u.emailVerified){
          getUserProfile(u.uid).then(function(prof){
            if(prof && prof.profileComplete){
              acquireSessionLock(u.uid, prof.role==="admin").then(function(canLogin){
                if(!canLogin){ setSessionBlocked(true); setAuthUser(u); setProfile(prof); return; }
                setSessionBlocked(false); setProfile(prof);
              });
            } else setProfile(null);
          });
        }
        setAuthUser(u);
      } else { setAuthUser(null); setProfile(null); }
    });
    return unsub;
  },[]);

  var loadEvals = useCallback(function(){
    if(!profile) return;
    sL(true);
    var doLoad = function(){
      var p1, p2, p3;
      if(profile.role==="admin"){ p1=fbGetAll("evaluaciones"); p2=fbGetAll("peff_evaluaciones"); p3=fbGetAll("rep_evaluaciones"); }
      else { p1=fbGetFiltered("evaluaciones",authUser.uid); p2=fbGetFiltered("peff_evaluaciones",authUser.uid); p3=fbGetFiltered("rep_evaluaciones",authUser.uid); }
      return Promise.all([p1,p2,p3]);
    };
    doLoad().then(function(res){
      var sortFn = function(a,b){return(b.fechaGuardado||"").localeCompare(a.fechaGuardado||"")};
      sE(res[0].sort(sortFn)); sPE(res[1].sort(sortFn)); sRE(res[2].sort(sortFn));
    }).catch(function(e){console.error(e)}).finally(function(){sL(false)});
  },[profile,authUser]);

  useEffect(function(){ if(profile && !sessionBlocked) loadEvals(); },[profile,loadEvals,sessionBlocked]);

  var goToPremium = function(){ sV("premium"); sS(null); window.scrollTo({top:0,behavior:"smooth"}); };

  var navTo = function(v){
    if((view==="newELDI"||view==="newPEFF"||view==="newREP") && v!==view){
      if(!window.confirm("\u00bfSalir de la evaluaci\u00f3n?\n\nLa evaluaci\u00f3n no se guarda a medias y el cr\u00e9dito consumido no se recupera.")) return;
    }
    sV(v); sS(null); window.scrollTo({top:0,behavior:"smooth"});
  };

  var checkCredits = function(){
    if(!profile) return false;
    if(profile.role==="admin") return true;
    if((profile.creditos||0)<1){ setShowNoCredits(true); return false; }
    return true;
  };

  var deductCredit = function(){
    if(!profile || profile.role==="admin") return Promise.resolve(true);
    var userRef = doc(db,"usuarios",authUser.uid);
    return updateDoc(userRef,{creditos:increment(-1)}).then(function(){
      return getDoc(userRef);
    }).then(function(fresh){
      if(fresh.exists()){
        var newCredits = fresh.data().creditos;
        setProfile(function(p){return Object.assign({},p,{creditos:newCredits})});
        console.log("deductCredit OK: creditos ahora =", newCredits);
      }
      return true;
    }).catch(function(e){
      console.error("deductCredit FAILED:", e);
      nfy("Error al descontar cr\u00e9dito: " + e.message, "er");
      return false;
    });
  };

  var startEval = function(toolId){
    if(!checkCredits()) return;
    if(!isAdmin){
      var ok = window.confirm("\u00bfIniciar evaluaci\u00f3n?\n\nSe consumir\u00e1 1 cr\u00e9dito de tu cuenta. Esta acci\u00f3n no se puede deshacer.");
      if(!ok) return;
      deductCredit().then(function(success){ if(success){ sV(toolId); } });
    } else { sV(toolId); }
  };

  var saveEval = function(ev){
    var rspClean = {};
    if(ev.rsp){ Object.entries(ev.rsp).forEach(function(e){ if(e[1]===true)rspClean[e[0]]=true; else if(e[1]===false)rspClean[e[0]]=false; }); }
    var newEv = {
      id:Date.now()+"", userId:authUser.uid, paciente:ev.pN, pacienteDni:ev.dni||"", fechaNacimiento:ev.birth,
      fechaEvaluacion:ev.eD, establecimiento:ev.sch, derivadoPor:ev.ref, edadMeses:ev.a,
      evalRec:ev.evalRec||false, evalExp:ev.evalExp||false,
      brutoReceptivo:ev.rR, brutoExpresivo:ev.rE, recRes:ev.recRes||null, expRes:ev.expRes||null,
      allNoEval:ev.allNoEval||[], observaciones:ev.obs||"",
      evaluador:profile?.nombre?(profile.nombre+" "+profile.apellido):(profile?.username||""),
      fechaGuardado:new Date().toISOString(), respuestas:rspClean
    };
    fbAdd("evaluaciones",newEv).then(function(res){
      if(res.success){ nfy("ELDI guardada","ok"); loadEvals(); } else nfy("Error: "+res.error,"er");
      sV("dash");
    });
  };

  var savePeff = function(data){
    var payload = Object.assign({ id:Date.now()+"", userId:authUser.uid, evaluador:profile?.nombre?(profile.nombre+" "+profile.apellido):(profile?.username||""), fechaGuardado:new Date().toISOString() }, data);
    fbAdd("peff_evaluaciones",payload).then(function(res){
      if(res.success){ nfy("PEFF guardada","ok"); loadEvals(); } else nfy("Error: "+res.error,"er");
      sV("dash");
    });
  };

  var saveRep = function(data){
    var payload = Object.assign({ id:Date.now()+"", userId:authUser.uid, evaluador:profile?.nombre?(profile.nombre+" "+profile.apellido):(profile?.username||""), fechaGuardado:new Date().toISOString() }, data);
    fbAdd("rep_evaluaciones",payload).then(function(res){
      if(res.success){ nfy("Rep. Palabras guardada","ok"); loadEvals(); } else nfy("Error: "+res.error,"er");
      sV("dash");
    });
  };

  var deleteEval = function(fbId, colName){
    colName = colName || "evaluaciones";
    if(profile?.role!=="admin") return;
    fbDelete(colName,fbId).then(function(res){
      if(res.success){ nfy("Eliminada","ok"); loadEvals(); } else nfy("Error: "+res.error,"er");
      sS(null); sV("hist");
    });
  };

  var handleLogout = function(){
    var p = authUser?.uid ? releaseSessionLock(authUser.uid) : Promise.resolve();
    p.then(function(){ return signOut(auth); }).then(function(){
      setAuthUser(null); setProfile(null); setSessionBlocked(false); sV("dash"); sS(null);
    });
  };

  if(authUser===undefined) return (
    <div style={{width:"100vw",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#0a3d2f",color:"#fff",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>{"\ud83e\udded"}</div>
        <div style={{fontSize:20,fontWeight:700}}>Cargando...</div>
      </div>
    </div>
  );
  if(!authUser) return <AuthScreen onDone={function(u,p){setAuthUser(u);setProfile(p)}} />;
  if(authUser && !authUser.emailVerified) return <VerifyEmailScreen user={authUser} onLogout={handleLogout} />;
  if(authUser && authUser.emailVerified && !profile) return <CompleteProfileScreen uid={authUser.uid} email={authUser.email} onDone={function(p){setProfile(p)}} />;

  if(sessionBlocked) return (
    <div style={{width:"100vw",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(145deg,#0a3d2f,#0d7363)",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <div style={{background:"rgba(255,255,255,.97)",borderRadius:16,padding:"44px 36px",width:440,maxWidth:"92vw",boxShadow:"0 20px 50px rgba(0,0,0,.3)",textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>{"\ud83d\udd12"}</div>
        <h2 style={{fontSize:20,fontWeight:700,color:"#0a3d2f",marginBottom:12}}>{"\u00bfSesi\u00f3n ocupada?"}</h2>
        <p style={{color:"#64748b",fontSize:14,lineHeight:1.7,marginBottom:20}}>{"Otro usuario ya est\u00e1 conectado en este momento. Solo una persona puede usar la aplicaci\u00f3n a la vez."}</p>
        <p style={{color:"#94a3b8",fontSize:12,marginBottom:24}}>{"Si cree que es un error, espere unos minutos e intente nuevamente. La sesi\u00f3n se libera autom\u00e1ticamente despu\u00e9s de 2 horas de inactividad."}</p>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={function(){acquireSessionLock(authUser.uid,false).then(function(canLogin){if(canLogin){setSessionBlocked(false);window.location.reload()}else{nfy("La sesi\u00f3n sigue ocupada","er")}})}} style={{background:"#0d9488",color:"#fff",border:"none",padding:"12px 24px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>Reintentar</button>
          <button onClick={handleLogout} style={{background:"#f1f5f9",border:"none",padding:"12px 24px",borderRadius:8,fontSize:14,cursor:"pointer",color:"#64748b"}}>{"Cerrar sesi\u00f3n"}</button>
        </div>
      </div>
    </div>
  );

  var nav = [
    ["dash","dash","Panel"],
    ["tools","tools","Herramientas"],
    ["hist","hist","Historial"],
    ["pacientes","pacientes","Pacientes"],
    ["calendario","calendario","Calendario"],
    ["premium","premium","Cr\u00e9ditos"],
    ["profile","profile","Perfil"]
  ];
  if(isAdmin){
    nav.push(["stats","stats","Estad\u00edsticas"]);
    nav.push(["adm","adm","Usuarios"]);
  }

  return (
    <div style={{display:"flex",height:"100vh",width:"100vw",fontFamily:"'DM Sans',system-ui,sans-serif",background:K.bg,color:"#1e293b",overflow:"hidden"}}>
      {showNoCredits && <NoCreditsModal onClose={function(){setShowNoCredits(false);sV("dash")}} onUpgrade={function(){setShowNoCredits(false);goToPremium()}} />}
      <aside style={{width:mobile?60:230,minWidth:mobile?60:230,background:K.sd,color:"#fff",display:"flex",flexDirection:"column",padding:"18px 0",flexShrink:0,height:"100vh"}}>
        <div style={{padding:"0 14px",marginBottom:26,display:"flex",alignItems:"center",gap:9}}>
          <span style={{fontSize:28}}>{"\ud83e\udded"}</span>
          {!mobile&&<div><div style={{fontSize:17,fontWeight:700}}>{"Br\u00fajula KIT"}</div><div style={{fontSize:9,color:"#5eead4",fontWeight:600,letterSpacing:"1px"}}>{"FONOAUDIOLOG\u00cdA"}</div></div>}
        </div>
        <nav style={{flex:1}}>{nav.map(function(n){
          var id=n[0],iconKey=n[1],lb=n[2];
          var active = view===id;
          return <button key={id} onClick={function(){navTo(id)}} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:mobile?"13px 0":"11px 18px",background:active?"rgba(94,234,212,.12)":"transparent",border:"none",color:active?"#5eead4":"rgba(255,255,255,.55)",cursor:"pointer",fontSize:14,fontWeight:active?600:400,borderLeft:active?"3px solid #5eead4":"3px solid transparent",textAlign:"left",justifyContent:mobile?"center":"flex-start",transition:"all .15s ease"}}>
            <span style={{display:"flex",alignItems:"center",opacity:active?1:.7}}>{icons[iconKey]}</span>
            {!mobile&&<span>{lb}</span>}
          </button>;
        })}</nav>
        <div style={{padding:"0 14px",borderTop:"1px solid rgba(255,255,255,.1)",paddingTop:12}}>
          {!mobile&&<div style={{fontSize:10,color:"rgba(255,255,255,.45)",marginBottom:3}}>{"Sesi\u00f3n: "}<b style={{color:"#5eead4"}}>{profile.username}</b>{isAdmin&&<span style={{background:"#5eead4",color:K.sd,padding:"1px 5px",borderRadius:3,fontSize:8,marginLeft:6,fontWeight:700}}>ADMIN</span>}</div>}
          {!mobile&&<div style={{fontSize:10,color:"rgba(255,255,255,.35)",marginBottom:8}}>{"Cr\u00e9ditos: "}<b style={{color:profile.creditos>0?"#5eead4":"#f87171"}}>{isAdmin?"\u221e":(profile.creditos||0)}</b></div>}
          <button onClick={handleLogout} style={{display:"flex",alignItems:"center",justifyContent:mobile?"center":"flex-start",gap:8,background:"rgba(255,255,255,.08)",border:"none",color:"rgba(255,255,255,.6)",padding:"9px 12px",borderRadius:8,cursor:"pointer",fontSize:12,width:"100%",transition:"all .15s ease"}}>
            <span style={{display:"flex",alignItems:"center"}}>{icons.logout}</span>
            {!mobile&&<span>{"Cerrar sesi\u00f3n"}</span>}
          </button>
        </div>
      </aside>
      <main id="main-scroll" style={{flex:1,overflowY:"auto",overflowX:"hidden",padding:mobile?"16px":"28px 36px",height:"100vh"}}>
        {toast&&<div style={{position:"fixed",top:16,right:16,zIndex:999,background:toast.t==="ok"?"#059669":"#dc2626",color:"#fff",padding:"10px 18px",borderRadius:8,fontSize:13,fontWeight:500,boxShadow:"0 4px 16px rgba(0,0,0,.15)",animation:"fi .3s ease"}}>{toast.m}</div>}
        {view==="dash"&&<Dashboard es={evals} pe={peffEvals} onT={function(){navTo("tools")}} onV={function(e){sS(e);sV("rpt")}} onVP={function(e){sS(e);sV("rptP")}} ld={loading} profile={profile} isAdmin={isAdmin} userId={authUser?.uid} nfy={nfy} onCalendar={function(){navTo("calendario")}} />}
        {view==="tools"&&<Tools onSel={startEval} credits={isAdmin?999:(profile.creditos||0)} onBuy={goToPremium} />}
        {view==="newELDI"&&<NewELDI onS={saveEval} nfy={nfy} userId={authUser?.uid} />}
        {view==="newPEFF"&&<NewPEFF onS={savePeff} nfy={nfy} userId={authUser?.uid} />}
        {view==="newREP"&&<NewREP onS={saveRep} nfy={nfy} userId={authUser?.uid} />}
        {view==="hist"&&<Hist es={evals} pe={peffEvals} re={repEvals} onV={function(e){sS(e);sV("rpt")}} onVP={function(e){sS(e);sV("rptP")}} onVR={function(e){sS(e);sV("rptR")}} isA={isAdmin} onD={deleteEval} />}
        {view==="rpt"&&sel&&<RptELDI ev={sel} isA={isAdmin} onD={deleteEval} />}
        {view==="rptP"&&sel&&<RptPEFF ev={sel} isA={isAdmin} onD={deleteEval} />}
        {view==="rptR"&&sel&&<RptREP ev={sel} isA={isAdmin} onD={deleteEval} />}
        {view==="profile"&&<ProfilePage profile={profile} authUser={authUser} nfy={nfy} onBuyCredits={goToPremium} />}
        {view==="pacientes"&&<PacientesPage userId={authUser?.uid} nfy={nfy} evals={evals} peffEvals={peffEvals} repEvals={repEvals} />}
        {view==="calendario"&&<CalendarPage userId={authUser?.uid} nfy={nfy} />}
        {view==="premium"&&<PremiumPage profile={profile} authUser={authUser} nfy={nfy} onBack={function(){sV("dash")}} />}
        {view==="adm"&&isAdmin&&<Admin nfy={nfy} />}
        {view==="stats"&&isAdmin&&<AdminStats nfy={nfy} />}
      </main>
    </div>
  );
}
