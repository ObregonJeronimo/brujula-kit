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
import Admin from "./components/Admin.jsx";
import AdminStats from "./components/AdminStats.jsx";
import NewELDI from "./components/NewELDI.jsx";
import NewPEFF from "./components/NewPEFF.jsx";
import CalendarPage from "./components/CalendarPage.jsx";

var isMobile = function(){ return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && window.innerWidth < 900; };

export default function App() {
  var _au = useState(undefined), authUser = _au[0], setAuthUser = _au[1];
  var _pr = useState(null), profile = _pr[0], setProfile = _pr[1];
  var _vw = useState("dash"), view = _vw[0], sV = _vw[1];
  var _ev = useState([]), evals = _ev[0], sE = _ev[1];
  var _pe = useState([]), peffEvals = _pe[0], sPE = _pe[1];
  var _sl = useState(null), sel = _sl[0], sS = _sl[1];
  var _tt = useState(null), toast = _tt[0], sT = _tt[1];
  var _ld = useState(false), loading = _ld[0], sL = _ld[1];
  var _mb = useState(isMobile()), mobile = _mb[0];
  var _sb = useState(false), sessionBlocked = _sb[0], setSessionBlocked = _sb[1];
  var _nc = useState(false), showNoCredits = _nc[0], setShowNoCredits = _nc[1];
  var nfy = useCallback(function(m,t){ sT({m:m,t:t}); setTimeout(function(){sT(null)},3500); },[]);
  var isAdmin = profile?.role === "admin";
  useSessionHeartbeat(authUser?.uid, isAdmin);

  useEffect(function(){
    var params = new URLSearchParams(window.location.search);
    var payment = params.get("payment");
    if(payment==="success"){
      nfy("\u2705 \u00a1Pago aprobado! Tus cr\u00e9ditos se acreditar\u00e1n en unos segundos.","ok");
      window.history.replaceState({},"",window.location.pathname);
      setTimeout(function(){
        if(authUser?.uid){
          getUserProfile(authUser.uid).then(function(prof){
            if(prof) setProfile(prof);
          });
        }
      },3000);
    } else if(payment==="failure"){
      nfy("El pago no se complet\u00f3. Intent\u00e1 nuevamente.","er");
      window.history.replaceState({},"",window.location.pathname);
    } else if(payment==="pending"){
      nfy("\u23f3 Pago pendiente. Los cr\u00e9ditos se acreditar\u00e1n cuando se confirme.","ok");
      window.history.replaceState({},"",window.location.pathname);
    }
  },[authUser]);

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
      var p1, p2;
      if(profile.role==="admin"){ p1=fbGetAll("evaluaciones"); p2=fbGetAll("peff_evaluaciones"); }
      else { p1=fbGetFiltered("evaluaciones",authUser.uid); p2=fbGetFiltered("peff_evaluaciones",authUser.uid); }
      return Promise.all([p1,p2]);
    };
    doLoad().then(function(res){
      sE(res[0].sort(function(a,b){return(b.fechaGuardado||"").localeCompare(a.fechaGuardado||"")}));
      sPE(res[1].sort(function(a,b){return(b.fechaGuardado||"").localeCompare(a.fechaGuardado||"")}));
    }).catch(function(e){console.error(e)}).finally(function(){sL(false)});
  },[profile,authUser]);

  useEffect(function(){ if(profile && !sessionBlocked) loadEvals(); },[profile,loadEvals,sessionBlocked]);

  var navTo = function(v){
    if((view==="newELDI"||view==="newPEFF") && v!==view){
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
    if(!profile || profile.role==="admin") return Promise.resolve();
    var userRef = doc(db,"usuarios",authUser.uid);
    return updateDoc(userRef,{creditos:increment(-1)}).then(function(){
      return getDoc(userRef);
    }).then(function(fresh){
      if(fresh.exists()) setProfile(function(p){return Object.assign({},p,{creditos:fresh.data().creditos})});
    }).catch(function(e){console.error("deductCredit error:",e)});
  };

  var startEval = function(toolId){
    if(!checkCredits()) return;
    if(!isAdmin){
      var ok = window.confirm("\u00bfIniciar evaluaci\u00f3n?\n\nSe consumir\u00e1 1 cr\u00e9dito de tu cuenta. Esta acci\u00f3n no se puede deshacer.");
      if(!ok) return;
      deductCredit().then(function(){ sV(toolId); });
    } else {
      sV(toolId);
    }
  };

  var saveEval = function(ev){
    var rspClean = {};
    if(ev.rsp){ Object.entries(ev.rsp).forEach(function(e){ if(e[1]===true)rspClean[e[0]]=true; else if(e[1]===false)rspClean[e[0]]=false; }); }
    var newEv = {
      id:Date.now()+"", userId:authUser.uid, paciente:ev.pN, fechaNacimiento:ev.birth,
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
    var payload = Object.assign({
      id:Date.now()+"", userId:authUser.uid,
      evaluador:profile?.nombre?(profile.nombre+" "+profile.apellido):(profile?.username||""),
      fechaGuardado:new Date().toISOString()
    }, data);
    fbAdd("peff_evaluaciones",payload).then(function(res){
      if(res.success){ nfy("PEFF guardada","ok"); loadEvals(); } else nfy("Error: "+res.error,"er");
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
        <h2 style={{fontSize:20,fontWeight:700,color:"#0a3d2f",marginBottom:12}}>{"Sesi\u00f3n ocupada"}</h2>
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
    ["dash","\u229e","Panel"],
    ["tools","\ud83e\uddf0","Herramientas"],
    ["hist","\u23f1","Historial"],
    ["calendario","\ud83d\udcc5","Calendario"],
    ["profile","\ud83d\udc64","Perfil"]
  ];
  if(isAdmin){
    nav.push(["stats","\ud83d\udcca","Estad\u00edsticas"]);
    nav.push(["adm","\u2699","Usuarios"]);
  }

  return (
    <div style={{display:"flex",height:"100vh",width:"100vw",fontFamily:"'DM Sans',system-ui,sans-serif",background:K.bg,color:"#1e293b",overflow:"hidden"}}>
      {showNoCredits && <NoCreditsModal onClose={function(){setShowNoCredits(false);sV("dash")}} onUpgrade={function(){setShowNoCredits(false);sV("premium")}} />}
      <aside style={{width:mobile?60:230,minWidth:mobile?60:230,background:K.sd,color:"#fff",display:"flex",flexDirection:"column",padding:"18px 0",flexShrink:0,height:"100vh"}}>
        <div style={{padding:"0 14px",marginBottom:26,display:"flex",alignItems:"center",gap:9}}>
          <span style={{fontSize:28}}>{"\ud83e\udded"}</span>
          {!mobile&&<div><div style={{fontSize:17,fontWeight:700}}>{"Br\u00fajula KIT"}</div><div style={{fontSize:9,color:"#5eead4",fontWeight:600,letterSpacing:"1px"}}>{"FONOAUDIOLOG\u00cdA"}</div></div>}
        </div>
        <nav style={{flex:1}}>{nav.map(function(n){
          var id=n[0],ic=n[1],lb=n[2];
          return <button key={id} onClick={function(){navTo(id)}} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:mobile?"13px 0":"11px 18px",background:view===id?"rgba(94,234,212,.12)":"transparent",border:"none",color:view===id?"#5eead4":"rgba(255,255,255,.6)",cursor:"pointer",fontSize:14,fontWeight:view===id?600:400,borderLeft:view===id?"3px solid #5eead4":"3px solid transparent",textAlign:"left",justifyContent:mobile?"center":"flex-start"}}><span>{ic}</span>{!mobile&&<span>{lb}</span>}</button>;
        })}</nav>
        <div style={{padding:"0 14px",borderTop:"1px solid rgba(255,255,255,.1)",paddingTop:12}}>
          {!mobile&&<div style={{fontSize:10,color:"rgba(255,255,255,.45)",marginBottom:3}}>{"Sesi\u00f3n: "}<b style={{color:"#5eead4"}}>{profile.username}</b>{isAdmin&&<span style={{background:"#5eead4",color:K.sd,padding:"1px 5px",borderRadius:3,fontSize:8,marginLeft:6,fontWeight:700}}>ADMIN</span>}</div>}
          {!mobile&&<div style={{fontSize:10,color:"rgba(255,255,255,.35)",marginBottom:8}}>{"Cr\u00e9ditos: "}<b style={{color:profile.creditos>0?"#5eead4":"#f87171"}}>{isAdmin?"\u221e":(profile.creditos||0)}</b></div>}
          <button onClick={handleLogout} style={{background:"rgba(255,255,255,.08)",border:"none",color:"rgba(255,255,255,.6)",padding:"7px 12px",borderRadius:6,cursor:"pointer",fontSize:mobile?16:12,width:"100%"}}>{mobile?"\u21a9":"\u21a9 Cerrar sesi\u00f3n"}</button>
        </div>
      </aside>
      <main id="main-scroll" style={{flex:1,overflowY:"auto",overflowX:"hidden",padding:mobile?"16px":"28px 36px",height:"100vh"}}>
        {toast&&<div style={{position:"fixed",top:16,right:16,zIndex:999,background:toast.t==="ok"?"#059669":"#dc2626",color:"#fff",padding:"10px 18px",borderRadius:8,fontSize:13,fontWeight:500,boxShadow:"0 4px 16px rgba(0,0,0,.15)",animation:"fi .3s ease"}}>{toast.m}</div>}
        {view==="dash"&&<Dashboard es={evals} pe={peffEvals} onT={function(){navTo("tools")}} onV={function(e){sS(e);sV("rpt")}} onVP={function(e){sS(e);sV("rptP")}} ld={loading} profile={profile} isAdmin={isAdmin} userId={authUser?.uid} nfy={nfy} onCalendar={function(){navTo("calendario")}} />}
        {view==="tools"&&<Tools onSel={startEval} credits={isAdmin?999:(profile.creditos||0)} />}
        {view==="newELDI"&&<NewELDI onS={saveEval} nfy={nfy} />}
        {view==="newPEFF"&&<NewPEFF onS={savePeff} nfy={nfy} />}
        {view==="hist"&&<Hist es={evals} pe={peffEvals} onV={function(e){sS(e);sV("rpt")}} onVP={function(e){sS(e);sV("rptP")}} isA={isAdmin} onD={deleteEval} />}
        {view==="rpt"&&sel&&<RptELDI ev={sel} isA={isAdmin} onD={deleteEval} />}
        {view==="rptP"&&sel&&<RptPEFF ev={sel} isA={isAdmin} onD={deleteEval} />}
        {view==="profile"&&<ProfilePage profile={profile} authUser={authUser} nfy={nfy} />}
        {view==="calendario"&&<CalendarPage userId={authUser?.uid} nfy={nfy} />}
        {view==="premium"&&<PremiumPage profile={profile} authUser={authUser} nfy={nfy} onBack={function(){sV("dash")}} />}
        {view==="adm"&&isAdmin&&<Admin nfy={nfy} />}
        {view==="stats"&&isAdmin&&<AdminStats nfy={nfy} />}
      </main>
    </div>
  );
}
