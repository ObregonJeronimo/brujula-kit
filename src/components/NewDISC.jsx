import { useState, useCallback } from "react";
import { DISC_PAIRS, computeDiscResults } from "../data/discFonData.js";
import PatientLookup from "./PatientLookup.jsx";

var K = { sd:"#0a3d2f", ac:"#0d9488", al:"#ccfbf1", mt:"#64748b", bd:"#e2e8f0" };

function ageMo(birth){
  if(!birth) return 0;
  var b=new Date(birth), n=new Date();
  return (n.getFullYear()-b.getFullYear())*12+(n.getMonth()-b.getMonth())-(n.getDate()<b.getDate()?1:0);
}
function ageLabel(m){ return Math.floor(m/12)+" a\u00f1os, "+(m%12)+" meses"; }
function scrollTop(){ var el=document.getElementById("main-scroll"); if(el) el.scrollTo({top:0,behavior:"smooth"}); }

export default function NewDISC({ onS, nfy, userId }){
  var _st = useState(0), step = _st[0], setStep = _st[1];
  var _pat = useState(null), patient = _pat[0], setPatient = _pat[1];
  var _ed = useState(""), evalDate = _ed[0], setEvalDate = _ed[1];
  var _ref = useState(""), derivado = _ref[0], setDerivado = _ref[1];
  var _rsp = useState({}), responses = _rsp[0], setResponses = _rsp[1];
  var _obsMap = useState({}), obsMap = _obsMap[0], setObsMap = _obsMap[1];
  var _obs = useState(""), obs = _obs[0], setObs = _obs[1];

  var patientAge = patient ? ageMo(patient.fechaNac) : 0;

  var setResponse = useCallback(function(id, val){
    setResponses(function(prev){
      var n = Object.assign({}, prev);
      if(n[id] === val) delete n[id]; else n[id] = val;
      return n;
    });
  },[]);

  var setOb = useCallback(function(id, val){
    setObsMap(function(prev){
      var n = Object.assign({}, prev);
      n[id] = val;
      return n;
    });
  },[]);

  var answeredCount = Object.keys(responses).length;
  var results = step === 2 ? computeDiscResults(responses, obsMap) : null;

  var handleSave = function(){
    var res = computeDiscResults(responses, obsMap);
    onS({
      tipo: "disc_fonologica",
      paciente: patient.nombre,
      pacienteDni: patient.dni || "",
      fechaNacimiento: patient.fechaNac || "",
      edadMeses: patientAge,
      fechaEvaluacion: evalDate,
      derivadoPor: derivado,
      observaciones: obs,
      responses: responses,
      obsMap: obsMap,
      resultados: res
    });
  };

  return (
    <div style={{animation:"fi .3s ease",maxWidth:800,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <span style={{fontSize:32}}>{"\ud83d\udc42"}</span>
        <div>
          <h1 style={{fontSize:20,fontWeight:700,margin:0}}>{"Discriminaci\u00f3n Fonol\u00f3gica"}</h1>
          <p style={{fontSize:12,color:K.mt,margin:0}}>{"PEFF-R \u2014 Secci\u00f3n 3.4"}</p>
        </div>
      </div>

      <div style={{display:"flex",gap:4,marginBottom:24}}>
        {["Paciente","Evaluaci\u00f3n","Resultados"].map(function(lb,i){
          var active = step === i;
          var done = step > i;
          return <div key={i} style={{flex:1,textAlign:"center",padding:"8px 0",borderRadius:8,fontSize:13,fontWeight:active?700:500,
            background:active?K.ac:done?"#059669":"#f1f5f9",color:active||done?"#fff":K.mt}}>{(i+1)+". "+lb}</div>;
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
        <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:8,padding:"12px 16px",marginBottom:20,fontSize:12,color:"#0369a1",lineHeight:1.6}}>
          <strong>{"\u2139\ufe0f Instrucciones:"}</strong>{" Presente cada par de palabras al paciente. El paciente indica si son "}
          <strong>{"iguales (I)"}</strong>{" o "}<strong>{"diferentes (D)"}</strong>
          {". Marque la respuesta del paciente para cada par."}
        </div>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontSize:13,color:K.mt,fontWeight:600}}>{"Progreso: "+answeredCount+"/"+DISC_PAIRS.length}</div>
          <div style={{width:120,height:6,background:"#e2e8f0",borderRadius:3,overflow:"hidden"}}>
            <div style={{width:Math.round(answeredCount/DISC_PAIRS.length*100)+"%",height:"100%",background:K.ac,borderRadius:3,transition:"width .3s"}}></div>
          </div>
        </div>

        <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,overflow:"hidden"}}>
          {/* Header */}
          <div style={{display:"grid",gridTemplateColumns:"44px 1fr 100px 100px 1fr",gap:0,background:K.sd,color:"#fff",padding:"10px 16px",fontSize:12,fontWeight:700}}>
            <span>{"N\u00b0"}</span>
            <span>{"Oposici\u00f3n"}</span>
            <span style={{textAlign:"center"}}>{"Clave"}</span>
            <span style={{textAlign:"center"}}>{"Respuesta"}</span>
            <span>{"Observaciones"}</span>
          </div>

          {DISC_PAIRS.map(function(pair){
            var r = responses[pair.id];
            var isCorrect = r === pair.clave;
            var isIncorrect = r !== undefined && r !== pair.clave;
            var bgRow = r === undefined ? "#fff" : isCorrect ? "#f0fdf4" : "#fef2f2";

            return <div key={pair.id} style={{display:"grid",gridTemplateColumns:"44px 1fr 100px 100px 1fr",gap:0,padding:"10px 16px",borderTop:"1px solid #f1f5f9",background:bgRow,alignItems:"center"}}>
              <span style={{fontSize:13,fontWeight:700,color:K.mt}}>{pair.id}</span>
              <span style={{fontSize:14,fontWeight:500}}>
                {pair.word1}{" \u2014 "}{pair.word2}
              </span>
              <span style={{textAlign:"center"}}>
                <span style={{padding:"3px 12px",borderRadius:6,fontSize:12,fontWeight:700,
                  background:pair.clave==="I"?"#dbeafe":"#fce7f3",
                  color:pair.clave==="I"?"#2563eb":"#be185d"}}>{pair.clave}</span>
              </span>
              <div style={{display:"flex",gap:4,justifyContent:"center"}}>
                <button onClick={function(){setResponse(pair.id,"I")}}
                  style={{width:36,height:32,borderRadius:6,border:r==="I"?"2px solid #2563eb":"1px solid "+K.bd,
                    background:r==="I"?"#dbeafe":"#fff",color:r==="I"?"#2563eb":K.mt,
                    fontSize:12,fontWeight:700,cursor:"pointer"}}>I</button>
                <button onClick={function(){setResponse(pair.id,"D")}}
                  style={{width:36,height:32,borderRadius:6,border:r==="D"?"2px solid #be185d":"1px solid "+K.bd,
                    background:r==="D"?"#fce7f3":"#fff",color:r==="D"?"#be185d":K.mt,
                    fontSize:12,fontWeight:700,cursor:"pointer"}}>D</button>
              </div>
              <input value={obsMap[pair.id]||""} onChange={function(e){setOb(pair.id, e.target.value)}}
                placeholder="..." style={{padding:"5px 8px",border:"1px solid "+K.bd,borderRadius:6,fontSize:11,background:"#fff",width:"100%"}} />
              {r !== undefined && <div style={{gridColumn:"1/-1",paddingTop:4}}>
                {isCorrect && <span style={{fontSize:10,color:"#059669",fontWeight:600}}>{"\u2714 Correcto"}</span>}
                {isIncorrect && <span style={{fontSize:10,color:"#dc2626",fontWeight:600}}>{"\u2718 Incorrecto \u2014 Clave: "+pair.clave+", Respuesta: "+r}</span>}
              </div>}
            </div>;
          })}
        </div>

        <div style={{marginTop:16}}>
          <label style={{fontSize:12,fontWeight:600,color:K.mt}}>Observaciones generales</label>
          <textarea value={obs} onChange={function(e){setObs(e.target.value)}} rows={3} placeholder="Notas adicionales sobre la discriminaci\u00f3n..."
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
        {/* Results summary */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
          <div style={{background:"#f0fdf4",borderRadius:10,padding:16,textAlign:"center"}}>
            <div style={{fontSize:28,fontWeight:800,color:K.ac}}>{results.pct+"%"}</div>
            <div style={{fontSize:11,color:K.mt,fontWeight:600}}>{"Aciertos"}</div>
          </div>
          <div style={{background:results.severity==="Adecuado"?"#f0fdf4":results.severity==="Leve"?"#fffbeb":"#fef2f2",borderRadius:10,padding:16,textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:700,color:results.severity==="Adecuado"?"#059669":results.severity==="Leve"?"#d97706":"#dc2626"}}>{results.severity}</div>
            <div style={{fontSize:11,color:K.mt,fontWeight:600}}>{"Severidad"}</div>
          </div>
          <div style={{background:"#f8fafc",borderRadius:10,padding:16,textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:700,color:K.sd}}>{results.correct+"/"+results.evaluated}</div>
            <div style={{fontSize:11,color:K.mt,fontWeight:600}}>{"Correctos"}</div>
            <div style={{fontSize:10,color:K.mt}}>{results.incorrect+" errores"}</div>
          </div>
        </div>

        {/* Errors detail */}
        {results.errors.length > 0 && <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,marginBottom:20}}>
          <h3 style={{fontSize:15,fontWeight:700,color:"#dc2626",marginBottom:12}}>{"\u26a0 Errores ("+results.errors.length+")"}</h3>
          {results.errors.map(function(e){
            return <div key={e.id} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 12px",background:"#fef2f2",borderRadius:8,marginBottom:6}}>
              <span style={{fontWeight:700,color:K.mt,fontSize:12}}>{"#"+e.id}</span>
              <span style={{fontSize:13,fontWeight:500}}>{e.word1+" \u2014 "+e.word2}</span>
              <span style={{fontSize:11,color:"#dc2626",fontWeight:600}}>{"Clave: "+e.clave+" \u2192 Resp: "+e.respuesta}</span>
              {e.contrast && <span style={{fontSize:10,color:K.mt,marginLeft:"auto"}}>{e.contrast.f1+" vs "+e.contrast.f2}</span>}
            </div>;
          })}
        </div>}

        {/* Error patterns */}
        {Object.keys(results.errorsByContrast).length > 0 && <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,marginBottom:20}}>
          <h3 style={{fontSize:15,fontWeight:700,color:"#7c3aed",marginBottom:12}}>{"Perfil perceptivo-fonol\u00f3gico"}</h3>
          {Object.entries(results.errorsByContrast).map(function(entry){
            var key = entry[0], data = entry[1];
            return <div key={key} style={{padding:"10px 14px",background:"#ede9fe",borderRadius:8,marginBottom:8}}>
              <div style={{fontSize:13,fontWeight:700,color:"#5b21b6"}}>{key}</div>
              <div style={{fontSize:11,color:"#6b21a8"}}>{data.contrast.desc+" \u2014 "+data.pairs.length+" error"+(data.pairs.length>1?"es":"")}</div>
            </div>;
          })}
        </div>}

        {results.errors.length === 0 && <div style={{background:"#dcfce7",borderRadius:12,padding:24,textAlign:"center",marginBottom:20}}>
          <span style={{fontSize:28}}>{"\u2705"}</span>
          <p style={{fontSize:14,fontWeight:600,color:"#059669",marginTop:8}}>{"Discriminaci\u00f3n fonol\u00f3gica adecuada. Sin errores."}</p>
        </div>}

        {/* Criteria info */}
        <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:10,padding:14,marginBottom:20,fontSize:12,color:"#0369a1",lineHeight:1.6}}>
          <strong>{"\u2139\ufe0f Criterios:"}</strong>{" Adecuado: \u226595% \u00b7 Leve: 80-94% \u00b7 Moderado: 60-79% \u00b7 Severo: <60%"}
        </div>

        <div style={{display:"flex",gap:10}}>
          <button onClick={function(){setStep(1);scrollTop();}}
            style={{flex:1,padding:"12px",background:"#f1f5f9",border:"1px solid "+K.bd,borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",color:K.mt}}>
            {"\u2190 Volver"}
          </button>
          <button onClick={handleSave}
            style={{flex:2,padding:"14px",background:"linear-gradient(135deg,#0a3d2f,#0d9488)",color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 16px rgba(13,148,136,.3)"}}>
            {"\ud83d\udcbe Guardar evaluaci\u00f3n"}
          </button>
        </div>
      </div>}
    </div>
  );
}
