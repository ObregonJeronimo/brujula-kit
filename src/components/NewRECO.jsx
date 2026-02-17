import { useState, useCallback } from "react";
import { RECO_GROUPS, TOTAL_ITEMS, computeRecoResults } from "../data/recoFonData.js";
import PatientLookup from "./PatientLookup.jsx";

var K = { sd:"#0a3d2f", ac:"#0d9488", al:"#ccfbf1", mt:"#64748b", bd:"#e2e8f0" };

function ageMo(birth){
  if(!birth) return 0;
  var b=new Date(birth), n=new Date();
  return (n.getFullYear()-b.getFullYear())*12+(n.getMonth()-b.getMonth())-(n.getDate()<b.getDate()?1:0);
}
function ageLabel(m){ return Math.floor(m/12)+" a\u00f1os, "+(m%12)+" meses"; }
function scrollTop(){ var el=document.getElementById("main-scroll"); if(el) el.scrollTo({top:0,behavior:"smooth"}); }

var COLOR = "#9333ea";

export default function NewRECO({ onS, nfy, userId }){
  var _st = useState(0), step = _st[0], setStep = _st[1];
  var _pat = useState(null), patient = _pat[0], setPatient = _pat[1];
  var _ed = useState(""), evalDate = _ed[0], setEvalDate = _ed[1];
  var _ref = useState(""), derivado = _ref[0], setDerivado = _ref[1];
  var _rsp = useState({}), responses = _rsp[0], setResponses = _rsp[1];
  var _estRsp = useState({}), estResponses = _estRsp[0], setEstResponses = _estRsp[1];
  var _obsMap = useState({}), obsMap = _obsMap[0], setObsMap = _obsMap[1];
  var _obs = useState(""), obs = _obs[0], setObs = _obs[1];
  var _expandedGroup = useState(null), expandedGroup = _expandedGroup[0], setExpandedGroup = _expandedGroup[1];

  var patientAge = patient ? ageMo(patient.fechaNac) : 0;

  var setResponse = useCallback(function(lam, val){
    setResponses(function(prev){
      var n = Object.assign({}, prev);
      if(n[lam] === val) delete n[lam]; else n[lam] = val;
      return n;
    });
  },[]);

  var setEstResponse = useCallback(function(lam, estIdx, val){
    setEstResponses(function(prev){
      var n = Object.assign({}, prev);
      var key = lam + "_" + estIdx;
      if(n[key] === val) delete n[key]; else n[key] = val;
      return n;
    });
  },[]);

  var setOb = useCallback(function(lam, val){
    setObsMap(function(prev){
      var n = Object.assign({}, prev);
      n[lam] = val;
      return n;
    });
  },[]);

  var answeredCount = Object.keys(responses).length;
  var results = step === 2 ? computeRecoResults(responses) : null;

  var handleSave = function(){
    var res = computeRecoResults(responses);
    onS({
      tipo: "reco_fonologico",
      paciente: patient.nombre,
      pacienteDni: patient.dni || "",
      fechaNacimiento: patient.fechaNac || "",
      edadMeses: patientAge,
      fechaEvaluacion: evalDate,
      derivadoPor: derivado,
      observaciones: obs,
      responses: responses,
      estResponses: estResponses,
      obsMap: obsMap,
      resultados: res
    });
  };

  return (
    <div style={{animation:"fi .3s ease",maxWidth:900,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <span style={{fontSize:32}}>{"\ud83c\udfaf"}</span>
        <div>
          <h1 style={{fontSize:20,fontWeight:700,margin:0}}>{"Reconocimiento Fonol\u00f3gico"}</h1>
          <p style={{fontSize:12,color:K.mt,margin:0}}>{"PEFF-R \u2014 Secci\u00f3n 3.5"}</p>
        </div>
      </div>

      <div style={{display:"flex",gap:4,marginBottom:24}}>
        {["Paciente","Evaluaci\u00f3n","Resultados"].map(function(lb,i){
          var active = step === i;
          var done = step > i;
          return <div key={i} style={{flex:1,textAlign:"center",padding:"8px 0",borderRadius:8,fontSize:13,fontWeight:active?700:500,
            background:active?COLOR:done?"#059669":"#f1f5f9",color:active||done?"#fff":K.mt}}>{(i+1)+". "+lb}</div>;
        })}
      </div>

      {step===0 && <div>
        <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:24,marginBottom:16}}>
          <h3 style={{fontSize:16,fontWeight:600,marginBottom:16}}>{"Datos del paciente"}</h3>
          <PatientLookup userId={userId} onSelect={setPatient} selected={patient} />
        </div>
        {patient && <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:24,marginBottom:16}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>{"Fecha de evaluaci\u00f3n"}</label>
              <input type="date" value={evalDate} onChange={function(e){setEvalDate(e.target.value)}}
                style={{width:"100%",padding:"10px 12px",border:"1px solid "+K.bd,borderRadius:8,fontSize:14}} />
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>{"Derivado por"}</label>
              <input value={derivado} onChange={function(e){setDerivado(e.target.value)}} placeholder="Nombre del derivador"
                style={{width:"100%",padding:"10px 12px",border:"1px solid "+K.bd,borderRadius:8,fontSize:14}} />
            </div>
          </div>
          {patientAge > 0 && <div style={{marginTop:12,padding:"8px 14px",background:"#f3e8ff",borderRadius:8,fontSize:13,color:"#6b21a8",fontWeight:600}}>
            {"Edad: "+ageLabel(patientAge)}
          </div>}
        </div>}
        <button onClick={function(){ if(!patient){nfy("Seleccion\u00e1 un paciente","er");return;} if(!evalDate){nfy("Ingres\u00e1 la fecha","er");return;} setStep(1); scrollTop(); }}
          disabled={!patient||!evalDate}
          style={{width:"100%",padding:"14px",background:(!patient||!evalDate)?"#94a3b8":COLOR,color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:(!patient||!evalDate)?"not-allowed":"pointer"}}>
          {"Comenzar evaluaci\u00f3n \u2192"}
        </button>
      </div>}

      {step===1 && <div>
        <div style={{background:"#faf5ff",border:"1px solid #e9d5ff",borderRadius:8,padding:"12px 16px",marginBottom:20,fontSize:12,color:"#6b21a8",lineHeight:1.6}}>
          <strong>{"\u2139\ufe0f Instrucciones:"}</strong>{" Presente los est\u00edmulos de cada grupo al paciente. Puede registrar respuestas individuales por est\u00edmulo (expandiendo el grupo) o marcar directamente si reconoci\u00f3 o no el contraste. Marque "}
          <strong>{"S\u00ed"}</strong>{" si el paciente reconoce la diferencia, o "}<strong>{"No"}</strong>{" si no la reconoce."}
        </div>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontSize:13,color:K.mt,fontWeight:600}}>{"Progreso: "+answeredCount+"/"+TOTAL_ITEMS}</div>
          <div style={{width:120,height:6,background:"#e2e8f0",borderRadius:3,overflow:"hidden"}}>
            <div style={{width:Math.round(answeredCount/TOTAL_ITEMS*100)+"%",height:"100%",background:COLOR,borderRadius:3,transition:"width .3s"}}></div>
          </div>
        </div>

        {RECO_GROUPS.map(function(group){
          var isExpanded = expandedGroup === group.id;
          var groupAnswered = group.items.filter(function(it){ return responses[it.lam] !== undefined; }).length;
          var groupCorrect = group.items.filter(function(it){ return responses[it.lam] === "si"; }).length;
          var allAnswered = groupAnswered === group.items.length;

          return <div key={group.id} style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,marginBottom:10,overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:allAnswered?"#faf5ff":"#fff",borderBottom:"1px solid #f1f5f9",cursor:"pointer"}}
              onClick={function(){ setExpandedGroup(isExpanded ? null : group.id); }}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{width:28,height:28,borderRadius:8,background:COLOR+"18",color:COLOR,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800}}>{group.id}</span>
                <div>
                  <div style={{fontSize:13,fontWeight:600}}>{group.label}</div>
                  <div style={{fontSize:11,color:K.mt}}>{groupAnswered+"/"+group.items.length+" respondidos"}{allAnswered ? " \u2014 "+groupCorrect+"/"+group.items.length+" reconocidos" : ""}</div>
                </div>
              </div>
              <span style={{fontSize:16,color:K.mt,transition:"transform .2s",transform:isExpanded?"rotate(180deg)":"rotate(0)"}}>{"\u25bc"}</span>
            </div>

            <div style={{padding:"0 16px 12px"}}>
              {group.items.map(function(item){
                var r = responses[item.lam];
                var bgRow = r === undefined ? "#fff" : r === "si" ? "#f0fdf4" : "#fef2f2";

                return <div key={item.lam} style={{padding:"10px 0",borderBottom:"1px solid #f8fafc"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <span style={{width:28,fontSize:12,fontWeight:700,color:K.mt,textAlign:"center",flexShrink:0}}>{"#"+item.lam}</span>
                    <div style={{flex:1,display:"flex",gap:4,flexWrap:"wrap"}}>
                      {item.est.map(function(word, ei){
                        var estKey = item.lam + "_" + ei;
                        var eR = estResponses[estKey];
                        return <span key={ei} style={{padding:"3px 8px",borderRadius:5,fontSize:12,fontWeight:500,
                          background:eR==="ok"?"#dcfce7":eR==="err"?"#fecaca":"#f1f5f9",
                          color:eR==="ok"?"#166534":eR==="err"?"#991b1b":"#475569",
                          cursor:isExpanded?"pointer":"default",
                          border:"1px solid "+(eR==="ok"?"#bbf7d0":eR==="err"?"#fca5a5":"#e2e8f0"),
                          transition:"all .15s"}}
                          onClick={isExpanded ? function(e){
                            e.stopPropagation();
                            var next = eR === "ok" ? "err" : eR === "err" ? undefined : "ok";
                            setEstResponse(item.lam, ei, next);
                          } : undefined}
                          title={isExpanded ? "Click para marcar: correcto/incorrecto/limpiar" : ""}
                        >{word}</span>;
                      })}
                    </div>
                    <div style={{display:"flex",gap:4,flexShrink:0}}>
                      <button onClick={function(e){e.stopPropagation();setResponse(item.lam,"si")}}
                        style={{padding:"5px 12px",borderRadius:6,border:r==="si"?"2px solid #059669":"1px solid "+K.bd,
                          background:r==="si"?"#dcfce7":"#fff",color:r==="si"?"#059669":K.mt,
                          fontSize:12,fontWeight:700,cursor:"pointer"}}>{"S\u00ed"}</button>
                      <button onClick={function(e){e.stopPropagation();setResponse(item.lam,"no")}}
                        style={{padding:"5px 12px",borderRadius:6,border:r==="no"?"2px solid #dc2626":"1px solid "+K.bd,
                          background:r==="no"?"#fef2f2":"#fff",color:r==="no"?"#dc2626":K.mt,
                          fontSize:12,fontWeight:700,cursor:"pointer"}}>{"No"}</button>
                    </div>
                  </div>
                  {isExpanded && <div style={{marginTop:6,marginLeft:40}}>
                    <input value={obsMap[item.lam]||""} onChange={function(e){setOb(item.lam, e.target.value)}}
                      placeholder="Observaciones..." style={{width:"100%",padding:"5px 8px",border:"1px solid "+K.bd,borderRadius:6,fontSize:11,background:"#fafafa"}} />
                  </div>}
                </div>;
              })}
            </div>
          </div>;
        })}

        <div style={{marginTop:16}}>
          <label style={{fontSize:12,fontWeight:600,color:K.mt}}>Observaciones generales</label>
          <textarea value={obs} onChange={function(e){setObs(e.target.value)}} rows={3} placeholder="Notas adicionales sobre el reconocimiento..."
            style={{width:"100%",padding:"10px 12px",border:"1px solid "+K.bd,borderRadius:8,fontSize:13,marginTop:4,resize:"vertical",fontFamily:"inherit"}} />
        </div>

        <div style={{display:"flex",gap:10,marginTop:20}}>
          <button onClick={function(){setStep(0);scrollTop();}}
            style={{flex:1,padding:"12px",background:"#f1f5f9",border:"1px solid "+K.bd,borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",color:K.mt}}>
            {"\u2190 Volver"}
          </button>
          <button onClick={function(){setStep(2);scrollTop();}}
            style={{flex:2,padding:"12px",background:"#059669",border:"none",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",color:"#fff"}}>
            {"Ver Resultados \u2192"}
          </button>
        </div>
      </div>}

      {step===2 && results && <div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
          <div style={{background:"#f0fdf4",borderRadius:10,padding:16,textAlign:"center"}}>
            <div style={{fontSize:28,fontWeight:800,color:COLOR}}>{results.pct+"%"}</div>
            <div style={{fontSize:11,color:K.mt,fontWeight:600}}>{"Aciertos"}</div>
          </div>
          <div style={{background:results.severity==="Adecuado"?"#f0fdf4":results.severity==="Leve"?"#fffbeb":"#fef2f2",borderRadius:10,padding:16,textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:700,color:results.severity==="Adecuado"?"#059669":results.severity==="Leve"?"#d97706":"#dc2626"}}>{results.severity}</div>
            <div style={{fontSize:11,color:K.mt,fontWeight:600}}>{"Severidad"}</div>
          </div>
          <div style={{background:"#f8fafc",borderRadius:10,padding:16,textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:700,color:K.sd}}>{results.correct+"/"+results.evaluated}</div>
            <div style={{fontSize:11,color:K.mt,fontWeight:600}}>{"Reconocidos"}</div>
            <div style={{fontSize:10,color:K.mt}}>{results.incorrect+" no reconocidos"}</div>
          </div>
        </div>

        <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,marginBottom:20}}>
          <h3 style={{fontSize:15,fontWeight:700,color:COLOR,marginBottom:14}}>{"Resultados por grupo de contraste"}</h3>
          {RECO_GROUPS.map(function(group){
            var gr = results.groupResults[group.id];
            if(!gr) return null;
            var barColor = gr.pct >= 95 ? "#059669" : gr.pct >= 80 ? "#d97706" : gr.pct >= 60 ? "#ea580c" : "#dc2626";
            return <div key={group.id} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{width:22,height:22,borderRadius:6,background:COLOR+"18",color:COLOR,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800}}>{group.id}</span>
                  <span style={{fontSize:12,fontWeight:600}}>{group.label}</span>
                </div>
                <span style={{fontSize:12,fontWeight:700,color:barColor}}>{gr.pct+"%"}</span>
              </div>
              <div style={{width:"100%",height:8,background:"#f1f5f9",borderRadius:4,overflow:"hidden"}}>
                <div style={{width:gr.pct+"%",height:"100%",background:barColor,borderRadius:4,transition:"width .4s"}}></div>
              </div>
              <div style={{fontSize:10,color:K.mt,marginTop:2}}>{gr.correct+"/"+gr.evaluated+" reconocidos"}{gr.incorrect > 0 ? " \u2014 "+gr.incorrect+" error"+(gr.incorrect>1?"es":"") : ""}</div>
            </div>;
          })}
        </div>

        {results.problematicGroups.length > 0 && <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,marginBottom:20}}>
          <h3 style={{fontSize:15,fontWeight:700,color:"#dc2626",marginBottom:12}}>{"\u26a0 Grupos con dificultades"}</h3>
          {results.problematicGroups.map(function(pg){
            return <div key={pg.id} style={{padding:"10px 14px",background:"#fef2f2",borderRadius:8,marginBottom:6,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div>
                <span style={{fontWeight:700,color:"#dc2626",fontSize:13}}>{pg.id+". "+pg.label}</span>
              </div>
              <span style={{fontSize:12,fontWeight:600,color:"#dc2626"}}>{pg.pct+"% \u2014 "+pg.incorrect+" error"+(pg.incorrect>1?"es":"")}</span>
            </div>;
          })}
        </div>}

        {results.problematicGroups.length === 0 && <div style={{background:"#dcfce7",borderRadius:12,padding:24,textAlign:"center",marginBottom:20}}>
          <span style={{fontSize:28}}>{"\u2705"}</span>
          <p style={{fontSize:14,fontWeight:600,color:"#059669",marginTop:8}}>{"Reconocimiento fonol\u00f3gico adecuado. Todos los contrastes reconocidos."}</p>
        </div>}

        <div style={{background:"#faf5ff",border:"1px solid #e9d5ff",borderRadius:10,padding:14,marginBottom:20,fontSize:12,color:"#6b21a8",lineHeight:1.6}}>
          <strong>{"\u2139\ufe0f Criterios:"}</strong>{" Adecuado: \u226595% \u00b7 Leve: 80-94% \u00b7 Moderado: 60-79% \u00b7 Severo: <60%"}
        </div>

        <div style={{display:"flex",gap:10}}>
          <button onClick={function(){setStep(1);scrollTop();}}
            style={{flex:1,padding:"12px",background:"#f1f5f9",border:"1px solid "+K.bd,borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",color:K.mt}}>
            {"\u2190 Volver"}
          </button>
          <button onClick={handleSave}
            style={{flex:2,padding:"14px",background:"linear-gradient(135deg,#6b21a8,"+COLOR+")",color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 16px rgba(147,51,234,.3)"}}>
            {"\ud83d\udcbe Guardar evaluaci\u00f3n"}
          </button>
        </div>
      </div>}
    </div>
  );
}
