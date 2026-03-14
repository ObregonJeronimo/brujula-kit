import { useState, useEffect } from "react";
import { K } from "../lib/fb.js";
import { ALL_EVAL_TYPES, EVAL_AREAS, EVAL_TYPES, getEvalType } from "../config/evalTypes.js";
import { loadDrafts, deleteDraft } from "../lib/drafts.js";

export default function Tools({ onSel, credits, onBuy, enabledTools, userId, onResumeDraft }) {
  var _drafts = useState([]), drafts = _drafts[0], setDrafts = _drafts[1];
  var _openArea = useState(null), openArea = _openArea[0], setOpenArea = _openArea[1];
  var _info = useState(null), showInfo = _info[0], setShowInfo = _info[1];
  var noCredits = credits < 1;

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

  var isEnabled = function(toolId){ return !enabledTools || enabledTools[toolId] !== false; };

  return (
    <div style={{animation:"fi .3s ease",width:"100%"}}>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>{"Herramientas"}</h1>
      <p style={{color:K.mt,fontSize:14,marginBottom:16}}>Seleccione un area de evaluacion</p>

      {/* Pending drafts */}
      {drafts.length > 0 && <div style={{marginBottom:20}}>
        <div style={{background:"linear-gradient(135deg,#fef3c7,#fde68a)",border:"1px solid #f59e0b",borderRadius:12,padding:"18px 20px"}}>
          <div style={{fontSize:14,fontWeight:700,color:"#92400e",marginBottom:12}}>{"Evaluaciones en progreso"}</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {drafts.map(function(d){
              var evalConfig = getEvalType(d.evalType);
              var data = d.data || {};
              var patientName = data.patient ? data.patient.nombre : (data.selectedPatient ? data.selectedPatient.nombre : (data.pd ? data.pd.pN : "Sin paciente"));
              return <div key={d._fbId} style={{background:"#fff",borderRadius:10,padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,flexWrap:"wrap"}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:24}}>{evalConfig ? evalConfig.icon : ""}</span>
                  <div>
                    <div style={{fontWeight:600,fontSize:14}}>{evalConfig ? evalConfig.fullName : d.evalType}</div>
                    <div style={{fontSize:12,color:K.mt}}>{patientName}</div>
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
        <button onClick={onBuy} style={{padding:"10px 24px",background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer"}}>COMPRAR CREDITOS</button>
      </div>}

      {/* Areas */}
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        {EVAL_AREAS.map(function(area){
          var areaTools = area.tools.map(function(tid){ return EVAL_TYPES[tid]; }).filter(function(t){ return t && isEnabled(t.id); });
          if(areaTools.length === 0) return null;
          var isOpen = openArea === area.id;

          return <div key={area.id} style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden"}}>
            {/* Area header — clickable */}
            <div onClick={function(){ setOpenArea(isOpen ? null : area.id); }} style={{background:"linear-gradient(135deg,"+area.color+","+area.color+"cc)",padding:"20px 24px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",color:"#fff"}}>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <span style={{fontSize:36}}>{area.icon}</span>
                <div>
                  <div style={{fontSize:18,fontWeight:700}}>{area.name}</div>
                  <div style={{fontSize:13,opacity:.85,marginTop:2}}>{area.desc}</div>
                </div>
              </div>
              <div style={{fontSize:24,fontWeight:300,transition:"transform .2s",transform:isOpen?"rotate(180deg)":"rotate(0)"}}>{"v"}</div>
            </div>

            {/* Tools inside area */}
            {isOpen && <div style={{padding:20}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                {areaTools.map(function(t){
                  var infoOpen = showInfo === t.newView;
                  var info = t.info;
                  return <div key={t.id} style={{background:"#f8faf9",borderRadius:12,border:"1px solid #e2e8f0",overflow:"hidden",opacity:noCredits?0.5:1}}>
                    <div style={{padding:"16px 20px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                        <span style={{fontSize:28}}>{t.icon}</span>
                        <div style={{fontSize:16,fontWeight:700,color:t.color}}>{t.fullName}</div>
                      </div>
                      <p style={{fontSize:13,color:"#475569",lineHeight:1.6,marginBottom:12}}>{t.desc}</p>
                      <div style={{fontSize:12,color:K.mt,marginBottom:14}}>{"Tiempo: "+t.time}</div>
                      {noCredits
                        ? <button onClick={onBuy} style={{width:"100%",padding:"10px",background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer"}}>COMPRAR CREDITOS</button>
                        : <button onClick={function(){onSel(t.newView)}} style={{width:"100%",padding:"10px",background:t.color,color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{"Iniciar"}</button>}
                      {info && <button onClick={function(){ setShowInfo(infoOpen ? null : t.newView); }}
                        style={{marginTop:8,width:"100%",padding:"8px",background:"transparent",border:"1px solid "+t.color+"44",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",color:t.color}}>
                        {infoOpen ? "Ocultar informacion" : "Ver informacion"}
                      </button>}
                      {infoOpen && info && <div style={{marginTop:10,background:"linear-gradient(135deg,"+t.color+"08,"+t.color+"12)",border:"1px solid "+t.color+"30",borderRadius:10,padding:"14px 16px",animation:"fi .3s ease"}}>
                        <div style={{fontSize:13,fontWeight:700,color:t.color,marginBottom:10}}>{info.title}</div>
                        {info.sections.map(function(sec, i){
                          return <div key={i} style={{marginBottom:i < info.sections.length-1 ? 10 : 0}}>
                            <div style={{fontSize:11,fontWeight:700,color:t.color,textTransform:"uppercase",letterSpacing:".5px",marginBottom:3}}>{sec.label}</div>
                            <div style={{fontSize:12,color:"#475569",lineHeight:1.7}}>{sec.text}</div>
                          </div>;
                        })}
                      </div>}
                    </div>
                  </div>;
                })}
              </div>
            </div>}
          </div>;
        })}
      </div>
    </div>
  );
}
