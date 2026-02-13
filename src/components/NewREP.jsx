import { useState, useCallback, useRef } from "react";
import { REP_CATEGORIES, POSITIONS } from "../data/repWordsData.js";
import PatientLookup from "./PatientLookup.jsx";
import { ageMo, ageLabel, ALL_ITEMS, buildCatGroups, wordKey, catProgress, computeResults, scrollTop } from "./NewREP_logic.js";
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
      n[key] = val;
      return n;
    });
  },[]);

  // Toggle OK for a word: if already "ok", clear it; if has text, switch to "ok"; if empty, set "ok"
  var toggleOk = useCallback(function(key){
    setResponses(function(prev){
      var n = Object.assign({}, prev);
      if(n[key] === "ok") delete n[key];
      else n[key] = "ok";
      return n;
    });
  },[]);

  // Mark all words in a phoneme row as OK
  var markPhonOk = useCallback(function(phonId, posWords){
    setResponses(function(prev){
      var n = Object.assign({}, prev);
      POSITIONS.forEach(function(pos){
        var ws = posWords[pos.id] || [];
        ws.forEach(function(w){
          n[wordKey(phonId, pos.id, w)] = "ok";
        });
      });
      return n;
    });
  },[]);

  // Mark all words in entire category as OK
  var markAllCatOk = useCallback(function(catId){
    setResponses(function(prev){
      var n = Object.assign({}, prev);
      ALL_ITEMS.filter(function(it){ return it.catId === catId; }).forEach(function(it){
        n[it.key] = "ok";
      });
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

  // Render a single word cell: checkmark toggle + text field for error transcription
  var renderWordCell = function(phonId, posId, word){
    if(!word) return <div style={{padding:4,color:"#cbd5e1",fontSize:11,textAlign:"center"}}>{"\u2014"}</div>;
    var key = wordKey(phonId, posId, word);
    var val = responses[key] || "";
    var isOk = val === "ok";
    var hasError = val !== "" && val !== "ok";

    return <div style={{marginBottom:6}}>
      <div style={{fontSize:12,color:K.sd,fontWeight:500,marginBottom:2}}>{word}</div>
      <div style={{display:"flex",gap:4,alignItems:"center"}}>
        <button onClick={function(){ toggleOk(key); }}
          style={{width:30,height:30,borderRadius:6,flexShrink:0,
            border:isOk?"2px solid #059669":"1px solid "+K.bd,
            background:isOk?"#dcfce7":"#fff",color:isOk?"#059669":K.mt,
            fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
          {isOk?"\u2713":""}
        </button>
        <input
          value={hasError ? val : ""}
          placeholder="error..."
          onChange={function(e){
            var v = e.target.value.trim();
            if(v === "") setResponse(key, "");
            else setResponse(key, v);
          }}
          onFocus={function(){
            // If was marked ok, clear to allow typing
            if(isOk) setResponse(key, "");
          }}
          style={{flex:1,padding:"5px 8px",border:"1px solid "+(hasError?"#fca5a5":K.bd),borderRadius:6,
            fontSize:12,background:hasError?"#fef2f2":"#fff",color:hasError?"#dc2626":"#1e293b",
            minWidth:0}}
        />
      </div>
    </div>;
  };

  return (
    <div ref={mainRef} style={{animation:"fi .3s ease",maxWidth:960,margin:"0 auto"}}>
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
        {/* Category tabs */}
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
              <button onClick={function(){markAllCatOk(cg.id)}}
                style={{padding:"6px 14px",borderRadius:6,border:"1px solid #059669",background:"#dcfce7",color:"#059669",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                {"\u2713 Todo correcto"}</button>
            </div>

            {/* Instructions */}
            <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:12,color:"#0369a1",lineHeight:1.6}}>
              <strong>{"\u2139\ufe0f Instrucciones:"}</strong>{" Marque \u2713 si el paciente repiti\u00f3 correctamente. Si hay error, escriba la producci\u00f3n del paciente en el campo de texto."}
            </div>

            {/* Phoneme tables */}
            {cg.phonRows.map(function(pr){
              var isExpected = (patientAge/12) >= pr.age;
              return <div key={pr.phonId} style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,marginBottom:14,overflow:"hidden"}}>
                {/* Header */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",
                  background:isExpected?"#f0fdf4":"#fffbeb",borderBottom:"1px solid "+K.bd}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:18,fontWeight:700,color:K.sd}}>{pr.phoneme}</span>
                    <span style={{fontSize:11,color:K.mt,background:"#f1f5f9",padding:"2px 8px",borderRadius:10}}>
                      {"Adq: "+pr.age+" a."}
                    </span>
                    {!isExpected && <span style={{fontSize:10,color:"#d97706",background:"#fef3c7",padding:"2px 8px",borderRadius:10,fontWeight:600}}>
                      {"No esperado a\u00fan"}</span>}
                  </div>
                  <button onClick={function(){markPhonOk(pr.phonId, pr.posWords)}}
                    style={{padding:"4px 10px",borderRadius:6,border:"1px solid #bbf7d0",background:"#dcfce7",color:"#059669",fontSize:10,fontWeight:600,cursor:"pointer"}}>
                    {"\u2713 Todo"}</button>
                </div>

                {/* Table: 4 position columns */}
                <div style={{padding:"12px 16px"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12}}>
                    {POSITIONS.map(function(pos){
                      var ws = pr.posWords[pos.id] || [];
                      var hasWords = ws.length > 0;
                      return <div key={pos.id}>
                        <div style={{fontSize:11,fontWeight:700,color:hasWords?K.ac:"#cbd5e1",textAlign:"center",
                          padding:"4px 0",borderBottom:"2px solid "+(hasWords?K.ac:"#f1f5f9"),marginBottom:8}}>
                          {pos.label}
                        </div>
                        {hasWords ? ws.map(function(w){
                          return <div key={w}>{renderWordCell(pr.phonId, pos.id, w)}</div>;
                        }) : <div style={{textAlign:"center",color:"#cbd5e1",fontSize:11,padding:8}}>{"\u2014"}</div>}
                      </div>;
                    })}
                  </div>
                </div>
              </div>;
            })}

            {/* Navigation */}
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
