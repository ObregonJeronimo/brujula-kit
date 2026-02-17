import { useState, useCallback } from "react";
import { RECO_GROUPS, computeRecoResults } from "../data/recoFonData.js";
import PatientLookup from "./PatientLookup.jsx";

var K = { sd:"#0a3d2f", ac:"#9333ea", al:"#f3e8ff", mt:"#64748b", bd:"#e2e8f0" };

function ageMo(birth){
  if(!birth) return 0;
  var b=new Date(birth), n=new Date();
  return (n.getFullYear()-b.getFullYear())*12+(n.getMonth()-b.getMonth())-(n.getDate()<b.getDate()?1:0);
}
function ageLabel(m){ return Math.floor(m/12)+" a\u00f1os, "+(m%12)+" meses"; }
function scrollTop(){ var el=document.getElementById("main-scroll"); if(el) el.scrollTo({top:0,behavior:"smooth"}); }

export default function NewRECO({ onS, nfy, userId }){
  var _st = useState(0), step = _st[0], setStep = _st[1];
  var _pat = useState(null), patient = _pat[0], setPatient = _pat[1];
  var _ed = useState(""), evalDate = _ed[0], setEvalDate = _ed[1];
  var _ref = useState(""), derivado = _ref[0], setDerivado = _ref[1];
  var _rsp = useState({}), responses = _rsp[0], setResponses = _rsp[1];
  var _stim = useState({}), stimResp = _stim[0], setStimResp = _stim[1];
  var _obsMap = useState({}), obsMap = _obsMap[0], setObsMap = _obsMap[1];
  var _obs = useState(""), obs = _obs[0], setObs = _obs[1];

  var patientAge = patient ? ageMo(patient.fechaNac) : 0;

  var setRecoResponse = useCallback(function(lam, val){
    setResponses(function(prev){
      var n = Object.assign({}, prev);
      if(n[lam] === val) delete n[lam]; else n[lam] = val;
      return n;
    });
  },[]);

  var setStimResponse = useCallback(function(lam, estIdx, val){
    setStimResp(function(prev){
      var n = Object.assign({}, prev);
      var key = lam+"_"+estIdx;
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
  var totalItems = 36;
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
      stimResp: stimResp,
      obsMap: obsMap,
      resultados: res
    });
  };

  return (
    <div style={{animation:"fi .3s ease",maxWidth:900,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <span style={{fontSize:32}}>{"\ud83e\udde0"}</span>
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
            background:active?K.ac:done?"#7c3aed":"#f1f5f9",color:active||done?"#fff":K.mt}}>{(i+1)+". "+lb}</div>;
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
          {patientAge > 0 && <div style={{marginTop:12,padding:"8px 14px",background:K.al,borderRadius:8,fontSize:13,color:K.sd,fontWeight:600}}>
            {"Edad: "+ageLabel(patientAge)}
          </div>}
        </div>}
        <button onClick={function(){ if(!patient){nfy("Seleccion\u00e1 un paciente","er");return;} if(!evalDate){nfy("Ingres\u00e1 la fecha","er");return;} setStep(1); scrollTop(); }}
          disabled={!patient||!evalDate}
          style={{width:"100%",padding:"14px",background:(!patient||!evalDate)?"#94a3b8":K.ac,color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:(!patient||!evalDate)?"not-allowed":"pointer"}}>
          {"Comenzar evaluaci\u00f3n \u2192"}
        </button>
      </div>}

      {step===1 && <div>
        <div style={{background:"#f3e8ff",border:"1px solid #d8b4fe",borderRadius:8,padding:"12px 16px",marginBottom:20,fontSize:12,color:"#6b21a8",lineHeight:1.6}}>
          <strong>{"\u2139\ufe0f Instrucciones:"}</strong>{" Para cada grupo de contrastes, presente los est\u00edmulos al paciente. En la columna \"Reconoce\", marque "}
          <strong>{"S\u00ed"}</strong>{" si el paciente reconoce la diferencia entre los sonidos, o "}<strong>{"No"}</strong>{" si no la reconoce. Opcionalmente registre las respuestas a cada est\u00edmulo individual."}
        </div>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontSize:13,color:K.mt,fontWeight:600}}>{"Progreso: "+answeredCount+"/"+totalItems}</div>
          <div style={{width:120,height:6,background:"#e2e8f0",borderRadius:3,overflow:"hidden"}}>
            <div style={{width:Math.round(answeredCount/totalItems*100)+"%",height:"100%",background:K.ac,borderRadius:3,transition:"width .3s"}}></div>
          </div>
        </div>

        {RECO_GROUPS.map(function(group){
          return <div key={group.id} style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,marginBottom:16,overflow:"hidden"}}>
            <div style={{background:"linear-gradient(135deg,#9333ea,#7c3aed)",padding:"14px 20px",color:"#fff"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{background:"rgba(255,255,255,.2)",padding:"4px 10px",borderRadius:6,fontSize:14,fontWeight:800}}>{group.id}</span>
                <span style={{fontSize:14,fontWeight:600}}>{group.label}</span>
              </div>
            </div>
            <div style={{padding:0}}>
              <div style={{display:"grid",gridTemplateColumns:"50px 1fr 80px 80px 1fr",gap:0,background:"#f8fafc",padding:"8px 16px",fontSize:11,fontWeight:700,color:K.mt,borderBottom:"1px solid #f1f5f9"}}>
                <span>{"L\u00e1m."}</span>
                <span>{"Est\u00edmulos (1-5)"}</span>
                <span style={{textAlign:"center"}}>{"Reconoce"}</span>
                <span style={{textAlign:"center"}}></span>
                <span>{"Obs."}</span>
              </div>
              {group.items.map(function(item){
                var r = responses[item.lam];
                var bgRow = r === undefined ? "#fff" : r === "si" ? "#f0fdf4" : "#fef2f2";
                return <div key={item.lam} style={{borderBottom:"1px solid #f1f5f9"}}>
                  <div style={{display:"grid",gridTemplateColumns:"50px 1fr 80px 80px 1fr",gap:0,padding:"10px 16px",background:bgRow,alignItems:"center"}}>
                    <span style={{fontSize:13,fontWeight:700,color:K.mt}}>{item.lam}</span>
                    <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                      {item.est.map(function(word, idx){
                        return <span key={idx} style={{padding:"2px 7px",borderRadius:4,fontSize:11,background:"#f1f5f9",color:"#334155"}}>{word}</span>;
                      })}
                    </div>
                    <div style={{display:"flex",gap:4,justifyContent:"center"}}>
                      <button onClick={function(){setRecoResponse(item.lam, r==="si"?undefined:"si")}}
                        style={{width:32,height:28,borderRadius:6,border:r==="si"?"2px solid #059669":"1px solid "+K.bd,
                          background:r==="si"?"#dcfce7":"#fff",color:r==="si"?"#059669":K.mt,
                          fontSize:11,fontWeight:700,cursor:"pointer"}}>{"S\u00ed"}</button>
                      <button onClick={function(){setRecoResponse(item.lam, r==="no"?undefined:"no")}}
                        style={{width:32,height:28,borderRadius:6,border:r==="no"?"2px solid #dc2626":"1px solid "+K.bd,
                          background:r==="no"?"#fef2f2":"#fff",color:r==="no"?"#dc2626":K.mt,
                          fontSize:11,fontWeight:700,cursor:"pointer"}}>No</button>
                    </div>
                    <div style={{textAlign:"center"}}>
                      {r==="si" && <span style={{fontSize:10,color:"#059669",fontWeight:600}}>{"\u2714"}</span>}
                      {r==="no" && <span style={{fontSize:10,color:"#dc2626",fontWeight:600}}>{"\u2718"}</span>}
                    </div>
                    <input value={obsMap[item.lam]||""} onChange={function(e){setOb(item.lam, e.target.value)}}
                      placeholder="..." style={{padding:"5px 8px",border:"1px solid "+K.bd,borderRadius:6,fontSize:11,background:"#fff",width:"100%"}} />
                  </div>
                </div>;
              })}
            </div>
          </div>;
        })}

        <div style={{marginTop:16}}>
          <label style={{fontSize:12,fontWeight:600,color:K.mt}}>Observaciones generales</label>
          <textarea value={obs} onChange={function(e){setObs(e.target.value)}} rows={3} placeholder={"Notas adicionales sobre el reconocimiento fonol\u00f3gico..."}
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
          <div style={{background:"#f3e8ff",borderRadius:10,padding:16,textAlign:"center"}}>
            <div style={{fontSize:28,fontWeight:800,color:K.ac}}>{results.pct+"%"}</div>
            <div style={{fontSize:11,color:K.mt,fontWeight:600}}>{"Aciertos globales"}</div>
          </div>
          <div style={{background:results.severity==="Adecuado"?"#f0fdf4":results.severity==="Leve"?"#fffbeb":"#fef2f2",borderRadius:10,padding:16,textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:700,color:results.severity==="Adecuado"?"#059669":results.severity==="Leve"?"#d97706":"#dc2626"}}>{results.severity}</div>
            <div style={{fontSize:11,color:K.mt,fontWeight:600}}>{"Severidad"}</div>
          </div>
          <div style={{background:"#f8fafc",borderRadius:10,padding:16,textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:700,color:K.sd}}>{results.correct+"/"+results.total}</div>
            <div style={{fontSize:11,color:K.mt,fontWeight:600}}>{"Contrastes reconocidos"}</div>
          </div>
        </div>

        <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,marginBottom:20}}>
          <h3 style={{fontSize:15,fontWeight:700,color:K.ac,marginBottom:12}}>{"Resultados por grupo de contraste"}</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {results.groupResults.map(function(g){
              var isOk = g.correct === g.total;
              return <div key={g.id} style={{padding:"10px 14px",borderRadius:8,border:"1px solid "+(isOk?"#bbf7d0":"#fecaca"),background:isOk?"#f0fdf4":"#fef2f2",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <span style={{fontWeight:800,color:isOk?"#059669":"#dc2626",marginRight:6}}>{g.id}</span>
                  <span style={{fontSize:12,color:"#334155"}}>{g.label}</span>
                </div>
                <span style={{fontSize:13,fontWeight:700,color:isOk?"#059669":"#dc2626"}}>{g.correct+"/"+g.total}</span>
              </div>;
            })}
          </div>
        </div>

        {results.errorGroups.length > 0 && <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,marginBottom:20}}>
          <h3 style={{fontSize:15,fontWeight:700,color:"#dc2626",marginBottom:12}}>{"\u26a0 Grupos con dificultades ("+results.errorGroups.length+")"}</h3>
          {results.errorGroups.map(function(g){
            var failedItems = g.items.filter(function(it){ return !it.reconoce; });
            return <div key={g.id} style={{padding:"12px 14px",background:"#fef2f2",borderRadius:8,marginBottom:8}}>
              <div style={{fontSize:13,fontWeight:700,color:"#dc2626"}}>{g.id+" - "+g.label}</div>
              <div style={{fontSize:11,color:"#7f1d1d",marginTop:2}}>
                {"Items no reconocidos: "+failedItems.map(function(it){return "L\u00e1m. "+it.lam}).join(", ")}
              </div>
            </div>;
          })}
        </div>}

        {results.errorGroups.length === 0 && <div style={{background:"#dcfce7",borderRadius:12,padding:24,textAlign:"center",marginBottom:20}}>
          <span style={{fontSize:28}}>{"\u2705"}</span>
          <p style={{fontSize:14,fontWeight:600,color:"#059669",marginTop:8}}>{"Reconocimiento fonol\u00f3gico adecuado. Todos los contrastes fueron reconocidos."}</p>
        </div>}

        <div style={{background:"#f3e8ff",border:"1px solid #d8b4fe",borderRadius:10,padding:14,marginBottom:20,fontSize:12,color:"#6b21a8",lineHeight:1.6}}>
          <strong>{"\u2139\ufe0f Criterios:"}</strong>{" Adecuado: \u226595% \u00b7 Leve: 80-94% \u00b7 Moderado: 60-79% \u00b7 Severo: <60%"}
        </div>

        <div style={{display:"flex",gap:10}}>
          <button onClick={function(){setStep(1);scrollTop();}}
            style={{flex:1,padding:"12px",background:"#f1f5f9",border:"1px solid "+K.bd,borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",color:K.mt}}>
            {"\u2190 Volver"}
          </button>
          <button onClick={handleSave}
            style={{flex:2,padding:"14px",background:"linear-gradient(135deg,#7c3aed,#9333ea)",color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 16px rgba(147,51,234,.3)"}}>
            {"\ud83d\udcbe Guardar evaluaci\u00f3n"}
          </button>
        </div>
      </div>}
    </div>
  );
}
