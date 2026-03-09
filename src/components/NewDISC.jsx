import { useState, useCallback, useEffect, useRef } from "react";
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

function renderReportText(text){
  if(!text) return null;
  return text.split("\n").map(function(line, i){
    var trimmed = line.trim();
    if(!trimmed) return <div key={i} style={{height:8}} />;
    var isTitle = /^[A-Z\u00c0-\u00dc\s\d\.\:\-]{6,}:?\s*$/.test(trimmed) || /^\d+[\.\)]\s*[A-Z]/.test(trimmed);
    if(isTitle) return <div key={i} style={{fontSize:14,fontWeight:700,color:K.sd,marginTop:14,marginBottom:4}}>{trimmed}</div>;
    return <div key={i} style={{fontSize:13,color:"#334155",lineHeight:1.7,marginBottom:1}}>{trimmed}</div>;
  });
}

export default function NewDISC({ onS, nfy, userId }){
  var _st = useState(0), step = _st[0], setStep = _st[1];
  var _pat = useState(null), patient = _pat[0], setPatient = _pat[1];
  var _ed = useState(""), evalDate = _ed[0], setEvalDate = _ed[1];
  var _ref = useState(""), derivado = _ref[0], setDerivado = _ref[1];
  var _rsp = useState({}), responses = _rsp[0], setResponses = _rsp[1];
  var _obsMap = useState({}), obsMap = _obsMap[0], setObsMap = _obsMap[1];
  var _obs = useState(""), obs = _obs[0], setObs = _obs[1];
  // Step 2 states
  var _saved = useState(false), saved = _saved[0], setSaved = _saved[1];
  var _report = useState(null), report = _report[0], setReport = _report[1];
  var _generating = useState(false), generating = _generating[0], setGenerating = _generating[1];
  var _genError = useState(null), genError = _genError[0], setGenError = _genError[1];
  var _showTech = useState(false), showTech = _showTech[0], setShowTech = _showTech[1];
  var reportRef = useRef(null);

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

  // Auto-save + auto-generate when entering step 2
  useEffect(function(){
    if(step === 2 && !saved){
      handleSave();
      setSaved(true);
    }
  }, [step]);

  useEffect(function(){
    if(step === 2 && saved && !report && !generating && !genError){
      setGenerating(true);
      var res = computeDiscResults(responses, obsMap);
      var evalData = {
        paciente: patient ? patient.nombre : "",
        pacienteDni: patient ? (patient.dni || "") : "",
        edadMeses: patientAge || 0,
        fechaEvaluacion: evalDate || "",
        derivadoPor: derivado || "",
        observaciones: obs || "",
        resultados: res
      };
      fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evalData: evalData, evalType: "disc", reportMode: "clinico" })
      })
      .then(function(r){ return r.json(); })
      .then(function(data){
        if(data.success && data.report) setReport(data.report);
        else setGenError(data.error || "Error al generar informe.");
        setGenerating(false);
      })
      .catch(function(e){
        setGenError("Error de conexi\u00f3n: " + e.message);
        setGenerating(false);
      });
    }
  }, [step, saved]);

  var handlePDFReport = function(){
    if(!reportRef.current) return;
    reportRef.current.style.paddingBottom = "40px";
    import("html2canvas").then(function(mod){
      return mod.default(reportRef.current,{scale:2,useCORS:true,backgroundColor:"#ffffff",scrollY:-window.scrollY,height:reportRef.current.scrollHeight,windowHeight:reportRef.current.scrollHeight+100});
    }).then(function(canvas){
      reportRef.current.style.paddingBottom = "";
      return import("jspdf").then(function(mod){
        var jsPDF = mod.jsPDF;
        var pdf = new jsPDF("p","mm","a4");
        var pW=210,pH=297,margin=10,imgW=pW-margin*2;
        var imgH=(canvas.height*imgW)/canvas.width;
        var usableH=pH-margin*2,pos=0,page=0;
        while(pos<imgH){
          if(page>0) pdf.addPage();
          var srcY=Math.round((pos/imgH)*canvas.height);
          var srcH=Math.round((Math.min(usableH,imgH-pos)/imgH)*canvas.height);
          if(srcH<=0)break;
          var sc=document.createElement("canvas");sc.width=canvas.width;sc.height=srcH;
          sc.getContext("2d").drawImage(canvas,0,srcY,canvas.width,srcH,0,0,canvas.width,srcH);
          pdf.addImage(sc.toDataURL("image/png"),"PNG",margin,margin,imgW,(srcH*imgW)/canvas.width);
          pos+=usableH;page++;
        }
        pdf.save("Informe_DISC_"+((patient?patient.nombre:"").replace(/\s/g,"_"))+"_"+(evalDate||"")+".pdf");
      });
    }).catch(function(e){ reportRef.current.style.paddingBottom=""; console.error(e); });
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
          <div style={{display:"grid",gridTemplateColumns:"44px 1fr 100px 100px 1fr",gap:0,background:K.sd,color:"#fff",padding:"10px 16px",fontSize:12,fontWeight:700}}>
            <span>{"N\u00b0"}</span><span>{"Oposici\u00f3n"}</span><span style={{textAlign:"center"}}>{"Clave"}</span><span style={{textAlign:"center"}}>{"Respuesta"}</span><span>{"Observaciones"}</span>
          </div>
          {DISC_PAIRS.map(function(pair){
            var r = responses[pair.id];
            var isCorrect = r === pair.clave;
            var isIncorrect = r !== undefined && r !== pair.clave;
            var bgRow = r === undefined ? "#fff" : isCorrect ? "#f0fdf4" : "#fef2f2";
            return <div key={pair.id} style={{display:"grid",gridTemplateColumns:"44px 1fr 100px 100px 1fr",gap:0,padding:"10px 16px",borderTop:"1px solid #f1f5f9",background:bgRow,alignItems:"center"}}>
              <span style={{fontSize:13,fontWeight:700,color:K.mt}}>{pair.id}</span>
              <span style={{fontSize:14,fontWeight:500}}>{pair.word1}{" \u2014 "}{pair.word2}</span>
              <span style={{textAlign:"center"}}><span style={{padding:"3px 12px",borderRadius:6,fontSize:12,fontWeight:700,background:pair.clave==="I"?"#dbeafe":"#fce7f3",color:pair.clave==="I"?"#2563eb":"#be185d"}}>{pair.clave}</span></span>
              <div style={{display:"flex",gap:4,justifyContent:"center"}}>
                <button onClick={function(){setResponse(pair.id,"I")}} style={{width:36,height:32,borderRadius:6,border:r==="I"?"2px solid #2563eb":"1px solid "+K.bd,background:r==="I"?"#dbeafe":"#fff",color:r==="I"?"#2563eb":K.mt,fontSize:12,fontWeight:700,cursor:"pointer"}}>I</button>
                <button onClick={function(){setResponse(pair.id,"D")}} style={{width:36,height:32,borderRadius:6,border:r==="D"?"2px solid #be185d":"1px solid "+K.bd,background:r==="D"?"#fce7f3":"#fff",color:r==="D"?"#be185d":K.mt,fontSize:12,fontWeight:700,cursor:"pointer"}}>D</button>
              </div>
              <input value={obsMap[pair.id]||""} onChange={function(e){setOb(pair.id, e.target.value)}} placeholder="..." style={{padding:"5px 8px",border:"1px solid "+K.bd,borderRadius:6,fontSize:11,background:"#fff",width:"100%"}} />
              {r !== undefined && <div style={{gridColumn:"1/-1",paddingTop:4}}>
                {isCorrect && <span style={{fontSize:10,color:"#059669",fontWeight:600}}>{"\u2714 Correcto"}</span>}
                {isIncorrect && <span style={{fontSize:10,color:"#dc2626",fontWeight:600}}>{"\u2718 Incorrecto \u2014 Clave: "+pair.clave+", Respuesta: "+r}</span>}
              </div>}
            </div>;
          })}
        </div>

        <div style={{marginTop:16}}>
          <label style={{fontSize:12,fontWeight:600,color:K.mt}}>Observaciones generales</label>
          <textarea value={obs} onChange={function(e){setObs(e.target.value)}} rows={3} placeholder="Notas adicionales..."
            style={{width:"100%",padding:"10px 12px",border:"1px solid "+K.bd,borderRadius:8,fontSize:13,marginTop:4,resize:"vertical",fontFamily:"inherit"}} />
        </div>

        <div style={{display:"flex",gap:10,marginTop:20}}>
          <button onClick={function(){setStep(0);scrollTop();}} style={{flex:1,padding:"12px",background:"#f1f5f9",border:"1px solid "+K.bd,borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",color:K.mt}}>{"\u2190 Volver"}</button>
          <button onClick={function(){setStep(2);scrollTop();}} style={{flex:2,padding:"12px",background:"#059669",border:"none",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",color:"#fff"}}>{"Ver Resultados \u2192"}</button>
        </div>
      </div>}

      {step===2 && <div>
        {/* Saved confirmation */}
        <div style={{background:"#dcfce7",borderRadius:10,padding:"12px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:18}}>{"\u2705"}</span>
          <span style={{fontSize:13,fontWeight:600,color:"#059669"}}>{"Evaluaci\u00f3n guardada correctamente."}</span>
        </div>

        {/* AI Report - Loading */}
        {generating && <div style={{background:"#fff",borderRadius:14,border:"1px solid "+K.bd,padding:40,textAlign:"center",marginBottom:20}}>
          <div style={{display:"inline-block",width:40,height:40,border:"4px solid #e2e8f0",borderTopColor:"#9333ea",borderRadius:"50%",animation:"spin 1s linear infinite",marginBottom:16}} />
          <div style={{fontSize:15,fontWeight:600,color:K.sd}}>{"Generando informe con IA..."}</div>
          <div style={{fontSize:12,color:K.mt,marginTop:6}}>{"Esto puede tardar unos segundos."}</div>
          <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
        </div>}

        {/* AI Report - Error */}
        {genError && !report && <div style={{background:"#fff",borderRadius:14,border:"1px solid "+K.bd,padding:28,textAlign:"center",marginBottom:20}}>
          <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#dc2626"}}>{genError}</div>
          <button onClick={function(){ setGenError(null); }} style={{padding:"10px 24px",background:"#9333ea",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>{"Reintentar"}</button>
        </div>}

        {/* AI Report - Content */}
        {report && <div style={{marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
            <div style={{fontSize:15,fontWeight:700,color:K.sd}}>{"Informe Fonoaudiol\u00f3gico"}</div>
            <button onClick={handlePDFReport} style={{padding:"7px 14px",background:"#9333ea",color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>{"\ud83d\udda8 Imprimir informe"}</button>
          </div>
          <div ref={reportRef} style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:24}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,paddingBottom:12,borderBottom:"2px solid "+K.bd}}>
              <div>
                <div style={{fontSize:10,color:K.mt,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>{"Informe Fonoaudiol\u00f3gico \u2014 Disc. Fonol\u00f3gica (PEFF-R 3.4)"}</div>
                <div style={{fontSize:17,fontWeight:700,marginTop:3}}>{patient ? patient.nombre : ""}</div>
                <div style={{fontSize:12,color:K.mt,marginTop:2}}>{"DNI: "+(patient?patient.dni||"N/A":"N/A")+" \u00b7 Edad: "+(patientAge ? ageLabel(patientAge) : "")}</div>
              </div>
              <div style={{textAlign:"right"}}><div style={{fontSize:11,color:K.mt}}>{"Fecha: "+(evalDate||"")}</div></div>
            </div>
            <div>{renderReportText(report)}</div>
            <div style={{marginTop:20,background:"linear-gradient(135deg,#f3e8ff,#ede9fe)",borderRadius:10,padding:"14px 18px",border:"1px solid #d8b4fe"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:18}}>{"\ud83e\udde0"}</span><span style={{fontSize:11,fontWeight:700,color:"#6b21a8"}}>{"Generado con IA"}</span></div>
                <div style={{width:1,height:16,background:"#c4b5fd"}} />
                <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:18}}>{"\u2705"}</span><span style={{fontSize:11,fontWeight:700,color:"#059669"}}>{"Comprobado por profesionales en fonoaudiolog\u00eda de C\u00f3rdoba"}</span></div>
              </div>
              <div style={{fontSize:10,color:"#7c3aed",marginTop:6}}>{"Este informe fue generado con asistencia de IA. Validado por profesionales fonoaudi\u00f3logos de C\u00f3rdoba, Argentina. Debe ser revisado por el profesional tratante."}</div>
            </div>
            <div style={{marginTop:14,paddingTop:8,borderTop:"1px solid "+K.bd,fontSize:9,color:"#94a3b8",textAlign:"center"}}>{"Br\u00fajula KIT \u2014 Disc. Fonol\u00f3gica (PEFF-R 3.4) \u2014 "+new Date().toLocaleDateString("es-AR")}</div>
          </div>
        </div>}

        {/* Technical data toggle */}
        <button onClick={function(){ setShowTech(!showTech); }} style={{width:"100%",padding:"14px",background:showTech?"#f1f5f9":"#0a3d2f",color:showTech?"#1e293b":"#fff",border:"1px solid #e2e8f0",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",marginBottom:showTech?16:20}}>
          {showTech ? "\u25b2 Ocultar datos t\u00e9cnicos" : "\u25bc Ver datos t\u00e9cnicos de la evaluaci\u00f3n"}
        </button>

        {showTech && results && <div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
            <div style={{background:"#f0fdf4",borderRadius:10,padding:16,textAlign:"center"}}><div style={{fontSize:28,fontWeight:800,color:K.ac}}>{results.pct+"%"}</div><div style={{fontSize:11,color:K.mt,fontWeight:600}}>{"Aciertos"}</div></div>
            <div style={{background:results.severity==="Adecuado"?"#f0fdf4":results.severity==="Leve"?"#fffbeb":"#fef2f2",borderRadius:10,padding:16,textAlign:"center"}}><div style={{fontSize:20,fontWeight:700,color:results.severity==="Adecuado"?"#059669":results.severity==="Leve"?"#d97706":"#dc2626"}}>{results.severity}</div><div style={{fontSize:11,color:K.mt,fontWeight:600}}>{"Severidad"}</div></div>
            <div style={{background:"#f8fafc",borderRadius:10,padding:16,textAlign:"center"}}><div style={{fontSize:20,fontWeight:700,color:K.sd}}>{results.correct+"/"+results.evaluated}</div><div style={{fontSize:11,color:K.mt,fontWeight:600}}>{"Correctos"}</div><div style={{fontSize:10,color:K.mt}}>{results.incorrect+" errores"}</div></div>
          </div>
          {results.errors.length > 0 && <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,marginBottom:20}}>
            <h3 style={{fontSize:15,fontWeight:700,color:"#dc2626",marginBottom:12}}>{"\u26a0 Errores ("+results.errors.length+")"}</h3>
            {results.errors.map(function(e){ return <div key={e.id} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 12px",background:"#fef2f2",borderRadius:8,marginBottom:6,flexWrap:"wrap"}}>
              <span style={{fontWeight:700,color:K.mt,fontSize:12}}>{"#"+e.id}</span>
              <span style={{fontSize:13,fontWeight:500}}>{e.word1+" \u2014 "+e.word2}</span>
              <span style={{fontSize:11,color:"#dc2626",fontWeight:600}}>{"Clave: "+e.clave+" \u2192 Resp: "+e.respuesta}</span>
              {e.contrast && <span style={{fontSize:10,color:K.mt}}>{e.contrast.f1+" vs "+e.contrast.f2}</span>}
            </div>; })}
          </div>}
          {Object.keys(results.errorsByContrast).length > 0 && <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,marginBottom:20}}>
            <h3 style={{fontSize:15,fontWeight:700,color:"#7c3aed",marginBottom:12}}>{"Perfil perceptivo-fonol\u00f3gico"}</h3>
            {Object.entries(results.errorsByContrast).map(function(entry){ return <div key={entry[0]} style={{padding:"10px 14px",background:"#ede9fe",borderRadius:8,marginBottom:8}}>
              <div style={{fontSize:13,fontWeight:700,color:"#5b21b6"}}>{entry[0]}</div>
              <div style={{fontSize:11,color:"#6b21a8"}}>{entry[1].contrast.desc+" \u2014 "+entry[1].pairs.length+" error"+(entry[1].pairs.length>1?"es":"")}</div>
            </div>; })}
          </div>}
          {results.errors.length === 0 && <div style={{background:"#dcfce7",borderRadius:12,padding:24,textAlign:"center",marginBottom:20}}><span style={{fontSize:28}}>{"\u2705"}</span><p style={{fontSize:14,fontWeight:600,color:"#059669",marginTop:8}}>{"Discriminaci\u00f3n fonol\u00f3gica adecuada."}</p></div>}
          <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:10,padding:14,marginBottom:20,fontSize:12,color:"#0369a1"}}><strong>{"\u2139\ufe0f Criterios:"}</strong>{" Adecuado: \u226595% \u00b7 Leve: 80-94% \u00b7 Moderado: 60-79% \u00b7 Severo: <60%"}</div>
        </div>}

        <button onClick={function(){setStep(1);scrollTop();}} style={{width:"100%",padding:"14px",background:"#f1f5f9",border:"1px solid "+K.bd,borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",color:K.mt,marginTop:4}}>{"\u2190 Volver a editar evaluaci\u00f3n"}</button>
      </div>}
    </div>
  );
}
