import { useState, useEffect } from "react";
import { K } from "../lib/fb.js";
import { ALL_EVAL_TYPES, getEvalType } from "../config/evalTypes.js";
import { loadDrafts, deleteDraft } from "../lib/drafts.js";

export default function Tools({ onSel, credits, onBuy, enabledTools, userId, onResumeDraft }) {
  var _info = useState(null), showInfo = _info[0], setShowInfo = _info[1];
  var _drafts = useState([]), drafts = _drafts[0], setDrafts = _drafts[1];
  var noCredits = credits < 1;
  var tools = ALL_EVAL_TYPES.filter(function(t){ return !enabledTools || enabledTools[t.id] !== false; });

  // Load drafts
  useEffect(function(){
    if(!userId) return;
    loadDrafts(userId).then(setDrafts);
  }, [userId]);

  var handleDeleteDraft = function(draftId){
    if(!window.confirm("Eliminar evaluacion pausada?")) return;
    deleteDraft(draftId).then(function(){
      setDrafts(function(prev){ return prev.filter(function(d){ return d._fbId !== draftId; }); });
    });
  };

  return (
    <div style={{animation:"fi .3s ease",width:"100%"}}>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>{"Herramientas"}</h1>
      <p style={{color:K.mt,fontSize:14,marginBottom:8}}>Seleccione evaluacion</p>

      {/* Pending drafts */}
      {drafts.length > 0 && <div style={{marginBottom:20}}>
        <div style={{background:"linear-gradient(135deg,#fef3c7,#fde68a)",border:"1px solid #f59e0b",borderRadius:12,padding:"18px 20px"}}>
          <div style={{fontSize:14,fontWeight:700,color:"#92400e",marginBottom:12}}>{"Evaluaciones en progreso"}</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {drafts.map(function(d){
              var evalConfig = getEvalType(d.evalType);
              var data = d.data || {};
              var patientName = data.patient ? data.patient.nombre : "Sin paciente";
              return <div key={d._fbId} style={{background:"#fff",borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:24}}>{evalConfig ? evalConfig.icon : ""}</span>
                  <div>
                    <div style={{fontWeight:600,fontSize:14}}>{evalConfig ? evalConfig.fullName : d.evalType}</div>
                    <div style={{fontSize:12,color:K.mt}}>{patientName+" - Paso "+(data.step||1)}</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:6}}>
                  <button onClick={function(){ if(onResumeDraft) onResumeDraft(d); }} style={{padding:"8px 16px",background:"#059669",color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>Continuar</button>
                  <button onClick={function(){ handleDeleteDraft(d._fbId); }} style={{padding:"8px 16px",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>Descartar</button>
                </div>
              </div>;
            })}
          </div>
        </div>
      </div>}

      {noCredits&&<div style={{background:"linear-gradient(135deg,#fef3c7,#fde68a)",border:"1px solid #f59e0b",borderRadius:12,padding:"18px 20px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:"#92400e"}}>{"Sin creditos restantes"}</div>
          <div style={{fontSize:12,color:"#a16207",marginTop:2}}>Necesitas creditos para realizar evaluaciones</div>
        </div>
        <button onClick={onBuy} style={{padding:"10px 24px",background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 12px rgba(245,158,11,.3)",letterSpacing:".3px",whiteSpace:"nowrap"}}>COMPRAR CREDITOS</button>
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        {tools.map(function(t){
          var infoOpen = showInfo === t.newView;
          var info = t.info;
          return <div key={t.id} style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden",opacity:noCredits?0.5:1,transition:"opacity .2s"}}>
            <div style={{background:"linear-gradient(135deg,"+t.color+","+t.color+"aa)",padding:"24px 24px 20px",color:"#fff"}}>
              <div style={{fontSize:36,marginBottom:8}}>{t.icon}</div><div style={{fontSize:18,fontWeight:700}}>{t.fullName}</div>
            </div>
            <div style={{padding:"20px 24px"}}>
              <p style={{fontSize:13,color:"#475569",lineHeight:1.6,marginBottom:16}}>{t.desc}</p>
              <div style={{display:"flex",gap:16,fontSize:12,color:K.mt}}><span>{"Tiempo: "+t.time}</span></div>
              {noCredits
                ? <button onClick={onBuy} style={{marginTop:16,width:"100%",padding:"11px",background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",letterSpacing:".2px"}}>COMPRAR CREDITOS</button>
                : <button onClick={function(){onSel(t.newView)}} style={{marginTop:16,width:"100%",padding:"11px",background:t.color,color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{"Iniciar"}</button>}
              {info && <button onClick={function(){ setShowInfo(infoOpen ? null : t.newView); }}
                style={{marginTop:8,width:"100%",padding:"9px",background:"transparent",border:"1px solid "+t.color+"44",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",color:t.color,display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all .2s"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                {infoOpen ? "Ocultar informacion" : "Ver informacion de la evaluacion"}
              </button>}
              {infoOpen && info && <div style={{marginTop:12,background:"linear-gradient(135deg,"+t.color+"08,"+t.color+"12)",border:"1px solid "+t.color+"30",borderRadius:10,padding:"18px 20px",animation:"fi .3s ease"}}>
                <div style={{fontSize:14,fontWeight:700,color:t.color,marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  {info.title}
                </div>
                {info.sections.map(function(sec, i){
                  return <div key={i} style={{marginBottom:i < info.sections.length-1 ? 12 : 0}}>
                    <div style={{fontSize:11,fontWeight:700,color:t.color,textTransform:"uppercase",letterSpacing:".5px",marginBottom:4}}>{sec.label}</div>
                    <div style={{fontSize:12,color:"#475569",lineHeight:1.7}}>{sec.text}</div>
                  </div>;
                })}
              </div>}
            </div>
          </div>;
        })}
      </div>
    </div>
  );
}
