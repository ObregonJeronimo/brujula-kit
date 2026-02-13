import { useState, useCallback, useRef } from "react";
import { REP_CATEGORIES, ERROR_TYPES } from "../data/repWordsData.js";
import PatientLookup from "./PatientLookup.jsx";
import { ageMo, ageLabel, ALL_ITEMS, computeResults, buildCatGroups, catProgress, scrollTop } from "./NewREP_logic.js";
import NewREPResults from "./NewREP_results.jsx";

var K = { sd:"#0a3d2f", ac:"#0d9488", al:"#ccfbf1", mt:"#64748b", bd:"#e2e8f0", bg:"#f0f5f3" };
var catGroups = buildCatGroups();

export default function NewREP({ onS, nfy, userId }){
  var _st = useState(0), step = _st[0], setStep = _st[1];
  var _pat = useState(null), patient = _pat[0], setPatient = _pat[1];
  var _ed = useState(""), evalDate = _ed[0], setEvalDate = _ed[1];
  var _ref = useState(""), derivado = _ref[0], setDerivado = _ref[1];
  var _rsp = useState({}), responses = _rsp[0], setResponses = _rsp[1];
  var _obs = useState(""), obs = _obs[0], setObs = _obs[1];
  var _ci = useState(0), catIdx = _ci[0], setCatIdx = _ci[1];
  var mainRef = useRef(null);

  var patientAge = patient ? ageMo(patient.fechaNac) : 0;

  var setResponse = useCallback(function(key, val){
    setResponses(function(prev){
      var n = Object.assign({}, prev);
      if(n[key] === val) delete n[key];
      else n[key] = val;
      return n;
    });
  },[]);

  var markAllCat = useCallback(function(catId, val){
    setResponses(function(prev){
      var n = Object.assign({}, prev);
      ALL_ITEMS.filter(function(it){ return it.catId === catId; }).forEach(function(it){ n[it.key] = val; });
      return n;
    });
  },[]);

  var handleSave = function(){
    var res = computeResults(responses);
    onS({
      tipo: "rep_palabras", paciente: patient.nombre, pacienteDni: patient.dni || "",
      fechaNacimiento: patient.fechaNac || "", edadMeses: patientAge,
      fechaEvaluacion: evalDate, derivadoPor: derivado, observaciones: obs,
      responses: responses, resultados: res
    });
  };

  var results = step === 2 ? computeResults(responses) : null;

  return (
    <div ref={mainRef} style={{animation:"fi .3s ease",maxWidth:900,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <span style={{fontSize:32}}>{"\ud83d\udcdd"}</span>
        <div>
          <h1 style={{fontSize:20,fontWeight:700,margin:0}}>{"Repetici\u00f3n de Palabras"}</h1>
          <p style={{fontSize:12,color:K.mt,margin:0}}>{"PEFF 3.2 \u2014 An\u00e1lisis fon\u00e9tico-fonol\u00f3gico"}</p>
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
        <div style={{display:"flex",gap:4,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
          {catGroups.map(function(cg,i){
            var prog = catProgress(cg.id, responses);
            var active = catIdx === i;
            var complete = prog.answered === prog.total && prog.total > 0;
            return <button key={cg.id} onClick={function(){setCatIdx(i);scrollTop();}}
              style={{padding:"8px 12px",borderRadius:8,border:active?"2px solid "+K.ac:"1px solid "+K.bd,
                background:active?K.al:complete?"#dcfce7":"#fff",color:active?K.sd:complete?"#059669":K.mt,
                fontSize:11,fontWeight:active?700:500,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
              {cg.title}
              {prog.total>0 && <span style={{display:"block",fontSize:9,marginTop:2}}>{prog.answered+"/"+prog.total}</span>}
            </button>;
          })}
        </div>

        {(function(){
          var cg = catGroups[catIdx];
          if(!cg) return null;
          return <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <h2 style={{fontSize:17,fontWeight:700,margin:0}}>{cg.title}</h2>
              <div style={{display:"flex",gap:6}}>
                <button onClick={function(){markAllCat(cg.id,"ok")}}
                  style={{padding:"6px 12px",borderRadius:6,border:"1px solid #059669",background:"#dcfce7",color:"#059669",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                  {"\u2713 Todo correcto"}</button>
                <button onClick={function(){markAllCat(cg.id,"NE")}}
                  style={{padding:"6px 12px",borderRadius:6,border:"1px solid "+K.bd,background:"#f8fafc",color:K.mt,fontSize:11,fontWeight:600,cursor:"pointer"}}>
                  {"No evaluado"}</button>
              </div>
            </div>

            <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
              {ERROR_TYPES.map(function(et){
                return <span key={et.id} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:K.mt}}>
                  <span style={{width:20,height:20,borderRadius:4,background:et.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}}>{et.label}</span>
                  {et.desc}
                </span>;
              })}
              <span style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:K.mt}}>
                <span style={{width:20,height:20,borderRadius:4,background:"#94a3b8",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700}}>NE</span>
                No evaluado
              </span>
            </div>

            {cg.phonGroups.map(function(pg){
              var isExpected = (patientAge/12) >= pg.age;
              return <div key={pg.phoneme} style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,marginBottom:12,overflow:"hidden"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",
                  background:isExpected?"#f0fdf4":"#fffbeb",borderBottom:"1px solid "+K.bd}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:18,fontWeight:700,color:K.sd}}>{pg.phoneme}</span>
                    <span style={{fontSize:11,color:K.mt,background:"#f1f5f9",padding:"2px 8px",borderRadius:10}}>
                      {"Adquisici\u00f3n: "+pg.age+" a\u00f1os"}
                    </span>
                    {!isExpected && <span style={{fontSize:10,color:"#d97706",background:"#fef3c7",padding:"2px 8px",borderRadius:10,fontWeight:600}}>
                      {"No esperado a\u00fan"}
                    </span>}
                  </div>
                </div>
                <div style={{padding:"12px 16px"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                    <thead>
                      <tr>
                        <th style={{textAlign:"left",padding:"4px 8px",color:K.mt,fontSize:11,fontWeight:600,borderBottom:"1px solid "+K.bd}}>Palabra</th>
                        <th style={{textAlign:"center",padding:"4px 4px",color:K.mt,fontSize:10,fontWeight:600,borderBottom:"1px solid "+K.bd,width:40}}>Pos.</th>
                        {ERROR_TYPES.map(function(et){
                          return <th key={et.id} style={{textAlign:"center",padding:"4px 2px",width:36,borderBottom:"1px solid "+K.bd}}>
                            <span style={{width:24,height:24,borderRadius:4,background:et.color,color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}}>{et.label}</span>
                          </th>;
                        })}
                        <th style={{textAlign:"center",padding:"4px 2px",width:36,borderBottom:"1px solid "+K.bd}}>
                          <span style={{width:24,height:24,borderRadius:4,background:"#94a3b8",color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700}}>NE</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pg.items.map(function(it){
                        var current = responses[it.key] || "";
                        return <tr key={it.key} style={{borderBottom:"1px solid #f1f5f9"}}>
                          <td style={{padding:"6px 8px",fontWeight:500}}>{it.word}</td>
                          <td style={{textAlign:"center",padding:"6px 4px",fontSize:10,color:K.mt,fontWeight:600}}>{it.posLabel}</td>
                          {ERROR_TYPES.map(function(et){
                            var sel = current === et.id;
                            return <td key={et.id} style={{textAlign:"center",padding:"3px 2px"}}>
                              <button onClick={function(){setResponse(it.key, et.id)}}
                                style={{width:32,height:32,borderRadius:6,border:sel?"2px solid "+et.color:"1px solid #e2e8f0",
                                  background:sel?et.color+"22":"#fff",color:sel?et.color:K.mt,
                                  fontSize:12,fontWeight:700,cursor:"pointer",transition:"all .15s"}}>
                                {et.label}
                              </button>
                            </td>;
                          })}
                          <td style={{textAlign:"center",padding:"3px 2px"}}>
                            <button onClick={function(){setResponse(it.key, "NE")}}
                              style={{width:32,height:32,borderRadius:6,border:current==="NE"?"2px solid #94a3b8":"1px solid #e2e8f0",
                                background:current==="NE"?"#94a3b822":"#fff",color:current==="NE"?"#94a3b8":K.mt,
                                fontSize:8,fontWeight:700,cursor:"pointer",transition:"all .15s"}}>
                              NE
                            </button>
                          </td>
                        </tr>;
                      })}
                    </tbody>
                  </table>
                </div>
              </div>;
            })}

            <div style={{display:"flex",gap:10,marginTop:16}}>
              {catIdx > 0 && <button onClick={function(){setCatIdx(catIdx-1);scrollTop();}}
                style={{flex:1,padding:"12px",background:"#f1f5f9",border:"1px solid "+K.bd,borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",color:K.mt}}>
                {"\u2190 Anterior"}</button>}
              {catIdx < catGroups.length-1 && <button onClick={function(){setCatIdx(catIdx+1);scrollTop();}}
                style={{flex:1,padding:"12px",background:K.ac,border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",color:"#fff"}}>
                {"Siguiente \u2192"}</button>}
              {catIdx === catGroups.length-1 && <button onClick={function(){setStep(2);scrollTop();}}
                style={{flex:1,padding:"12px",background:"#059669",border:"none",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",color:"#fff"}}>
                {"Ver Resultados \u2192"}</button>}
            </div>

            <div style={{marginTop:16}}>
              <label style={{fontSize:12,fontWeight:600,color:K.mt}}>Observaciones generales</label>
              <textarea value={obs} onChange={function(e){setObs(e.target.value)}} rows={3} placeholder="Notas adicionales..."
                style={{width:"100%",padding:"10px 12px",border:"1px solid "+K.bd,borderRadius:8,fontSize:13,marginTop:4,resize:"vertical",fontFamily:"inherit"}} />
            </div>
          </div>;
        })()}
      </div>}

      {step===2 && <NewREPResults results={results} patientAge={patientAge} obs={obs}
        onBack={function(){setStep(1);scrollTop();}} onSave={handleSave} />}
    </div>
  );
}
