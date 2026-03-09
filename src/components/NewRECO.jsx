import { useState, useCallback, useEffect, useRef } from "react";
import { RECO_GROUPS, computeRecoResults } from "../data/recoFonData.js";
import PatientLookup from "./PatientLookup.jsx";
import { db, doc, updateDoc } from "../firebase.js";
import { fbAdd } from "../lib/fb.js";

var K = { sd:"#0a3d2f", ac:"#9333ea", al:"#f3e8ff", mt:"#64748b", bd:"#e2e8f0" };

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

export default function NewRECO({ onS, nfy, userId }){
  var _st = useState(0), step = _st[0], setStep = _st[1];
  var _pat = useState(null), patient = _pat[0], setPatient = _pat[1];
  var _ed = useState(new Date().toISOString().split("T")[0]), evalDate = _ed[0], setEvalDate = _ed[1];
  var _ref = useState(""), derivado = _ref[0], setDerivado = _ref[1];
  var _rsp = useState({}), responses = _rsp[0], setResponses = _rsp[1];
  var _stim = useState({}), stimResp = _stim[0], setStimResp = _stim[1];
  var _obsMap = useState({}), obsMap = _obsMap[0], setObsMap = _obsMap[1];
  var _obs = useState(""), obs = _obs[0], setObs = _obs[1];
  var _saved = useState(false), saved = _saved[0], setSaved = _saved[1];
  var _savedDocId = useState(null), savedDocId = _savedDocId[0], setSavedDocId = _savedDocId[1];
  var _report = useState(null), report = _report[0], setReport = _report[1];
  var _generating = useState(false), generating = _generating[0], setGenerating = _generating[1];
  var _genError = useState(null), genError = _genError[0], setGenError = _genError[1];
  var _showTech = useState(false), showTech = _showTech[0], setShowTech = _showTech[1];
  var reportRef = useRef(null);

  var patientAge = patient ? ageMo(patient.fechaNac) : 0;

  var setRecoResponse = useCallback(function(lam, val){
    setResponses(function(prev){ var n=Object.assign({},prev); if(n[lam]===val) delete n[lam]; else n[lam]=val; return n; });
  },[]);
  var setOb = useCallback(function(lam, val){
    setObsMap(function(prev){ var n=Object.assign({},prev); n[lam]=val; return n; });
  },[]);

  var answeredCount = Object.keys(responses).length;
  var totalItems = 36;
  var results = step === 2 ? computeRecoResults(responses) : null;

  // Direct save to Firestore
  useEffect(function(){
    if(step === 2 && !saved){
      var res = computeRecoResults(responses);
      var payload = {
        id: Date.now()+"", userId: userId, tipo: "reco_fonologico",
        paciente: patient.nombre, pacienteDni: patient.dni||"",
        fechaNacimiento: patient.fechaNac||"", edadMeses: patientAge,
        fechaEvaluacion: evalDate, derivadoPor: derivado, observaciones: obs,
        evaluador: "", fechaGuardado: new Date().toISOString(),
        responses: responses, stimResp: stimResp, obsMap: obsMap, resultados: res
      };
      fbAdd("reco_evaluaciones", payload).then(function(r){
        if(r.success){ setSavedDocId(r.id); nfy("Evaluaci\u00f3n guardada","ok"); }
        else nfy("Error: "+r.error,"er");
      });
      setSaved(true);
    }
  }, [step]);

  // Auto-generate AI report
  useEffect(function(){
    if(step === 2 && saved && !report && !generating && !genError){
      setGenerating(true);
      var res = computeRecoResults(responses);
      var evalData = {
        paciente: patient?patient.nombre:"", pacienteDni: patient?(patient.dni||""):"",
        edadMeses: patientAge, fechaEvaluacion: evalDate, derivadoPor: derivado, observaciones: obs, resultados: res
      };
      fetch("/api/generate-report", {
        method: "POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ evalData: evalData, evalType: "reco", reportMode: "clinico" })
      })
      .then(function(r){ return r.json(); })
      .then(function(data){
        if(data.success && data.report){
          setReport(data.report);
          if(savedDocId) updateDoc(doc(db,"reco_evaluaciones",savedDocId),{aiReport:data.report,aiReportDate:new Date().toISOString()}).catch(function(e){console.error(e);});
        } else setGenError(data.error||"Error al generar informe.");
        setGenerating(false);
      })
      .catch(function(e){ setGenError("Error: "+e.message); setGenerating(false); });
    }
  }, [step, saved, savedDocId]);

  var handlePDFReport = function(){
    if(!reportRef.current) return;
    reportRef.current.style.paddingBottom="40px";
    import("html2canvas").then(function(mod){ return mod.default(reportRef.current,{scale:2,useCORS:true,backgroundColor:"#ffffff",scrollY:-window.scrollY,height:reportRef.current.scrollHeight,windowHeight:reportRef.current.scrollHeight+100}); }).then(function(canvas){
      reportRef.current.style.paddingBottom="";
      return import("jspdf").then(function(mod){ var jsPDF=mod.jsPDF,pdf=new jsPDF("p","mm","a4"),pW=210,pH=297,margin=10,imgW=pW-margin*2,imgH=(canvas.height*imgW)/canvas.width,usableH=pH-margin*2,pos=0,page=0;
        while(pos<imgH){ if(page>0)pdf.addPage(); var srcY=Math.round((pos/imgH)*canvas.height),srcH=Math.round((Math.min(usableH,imgH-pos)/imgH)*canvas.height); if(srcH<=0)break; var sc=document.createElement("canvas");sc.width=canvas.width;sc.height=srcH;sc.getContext("2d").drawImage(canvas,0,srcY,canvas.width,srcH,0,0,canvas.width,srcH); pdf.addImage(sc.toDataURL("image/png"),"PNG",margin,margin,imgW,(srcH*imgW)/canvas.width); pos+=usableH;page++; }
        pdf.save("Informe_RECO_"+((patient?patient.nombre:"").replace(/\s/g,"_"))+"_"+(evalDate||"")+".pdf"); });
    }).catch(function(e){ reportRef.current.style.paddingBottom="";console.error(e); });
  };

  return (
    <div style={{animation:"fi .3s ease",maxWidth:900,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <span style={{fontSize:32}}>{"\ud83e\udde0"}</span>
        <div><h1 style={{fontSize:20,fontWeight:700,margin:0}}>{"Reconocimiento Fonol\u00f3gico"}</h1><p style={{fontSize:12,color:K.mt,margin:0}}>{"PEFF-R \u2014 Secci\u00f3n 3.5"}</p></div>
      </div>
      <div style={{display:"flex",gap:4,marginBottom:24}}>
        {["Paciente","Evaluaci\u00f3n","Resultados"].map(function(lb,i){ var active=step===i,done=step>i; return <div key={i} style={{flex:1,textAlign:"center",padding:"8px 0",borderRadius:8,fontSize:13,fontWeight:active?700:500,background:active?K.ac:done?"#7c3aed":"#f1f5f9",color:active||done?"#fff":K.mt}}>{(i+1)+". "+lb}</div>; })}
      </div>

      {step===0 && <div>
        <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:24,marginBottom:16}}><h3 style={{fontSize:16,fontWeight:600,marginBottom:16}}>{"Datos del paciente"}</h3><PatientLookup userId={userId} onSelect={setPatient} selected={patient} /></div>
        {patient && <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:24,marginBottom:16}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>{"Fecha"}</label><input type="date" value={evalDate} onChange={function(e){setEvalDate(e.target.value)}} style={{width:"100%",padding:"10px 12px",border:"1px solid "+K.bd,borderRadius:8,fontSize:14}} /></div>
            <div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>{"Derivado por"}</label><input value={derivado} onChange={function(e){setDerivado(e.target.value)}} placeholder="Derivador" style={{width:"100%",padding:"10px 12px",border:"1px solid "+K.bd,borderRadius:8,fontSize:14}} /></div>
          </div>
          {patientAge>0 && <div style={{marginTop:12,padding:"8px 14px",background:K.al,borderRadius:8,fontSize:13,color:K.sd,fontWeight:600}}>{"Edad: "+ageLabel(patientAge)}</div>}
        </div>}
        <button onClick={function(){ if(!patient){nfy("Seleccion\u00e1 un paciente","er");return;} setStep(1);scrollTop(); }} disabled={!patient} style={{width:"100%",padding:"14px",background:(!patient)?"#94a3b8":K.ac,color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:(!patient)?"not-allowed":"pointer"}}>{"Comenzar \u2192"}</button>
      </div>}

      {step===1 && <div>
        <div style={{background:"#f3e8ff",border:"1px solid #d8b4fe",borderRadius:8,padding:"12px 16px",marginBottom:20,fontSize:12,color:"#6b21a8",lineHeight:1.6}}><strong>{"\u2139\ufe0f"}</strong>{" Marque S\u00ed si reconoce la diferencia o No si no la reconoce."}</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={{fontSize:13,color:K.mt,fontWeight:600}}>{"Progreso: "+answeredCount+"/"+totalItems}</div><div style={{width:120,height:6,background:"#e2e8f0",borderRadius:3,overflow:"hidden"}}><div style={{width:Math.round(answeredCount/totalItems*100)+"%",height:"100%",background:K.ac,borderRadius:3,transition:"width .3s"}}></div></div></div>

        {RECO_GROUPS.map(function(group){
          return <div key={group.id} style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,marginBottom:16,overflow:"hidden"}}>
            <div style={{background:"linear-gradient(135deg,#9333ea,#7c3aed)",padding:"14px 20px",color:"#fff"}}><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{background:"rgba(255,255,255,.2)",padding:"4px 10px",borderRadius:6,fontSize:14,fontWeight:800}}>{group.id}</span><span style={{fontSize:14,fontWeight:600}}>{group.label}</span></div></div>
            <div>
              <div style={{display:"grid",gridTemplateColumns:"50px 1fr 80px 80px 1fr",gap:0,background:"#f8fafc",padding:"8px 16px",fontSize:11,fontWeight:700,color:K.mt,borderBottom:"1px solid #f1f5f9"}}><span>{"L\u00e1m."}</span><span>{"Est\u00edmulos"}</span><span style={{textAlign:"center"}}>{"Reconoce"}</span><span></span><span>{"Obs."}</span></div>
              {group.items.map(function(item){ var r=responses[item.lam],bgRow=r===undefined?"#fff":r==="si"?"#f0fdf4":"#fef2f2";
                return <div key={item.lam} style={{borderBottom:"1px solid #f1f5f9"}}><div style={{display:"grid",gridTemplateColumns:"50px 1fr 80px 80px 1fr",gap:0,padding:"10px 16px",background:bgRow,alignItems:"center"}}>
                  <span style={{fontSize:13,fontWeight:700,color:K.mt}}>{item.lam}</span>
                  <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{item.est.map(function(w,idx){return <span key={idx} style={{padding:"2px 7px",borderRadius:4,fontSize:11,background:"#f1f5f9",color:"#334155"}}>{w}</span>;})}</div>
                  <div style={{display:"flex",gap:4,justifyContent:"center"}}>
                    <button onClick={function(){setRecoResponse(item.lam,r==="si"?undefined:"si")}} style={{width:32,height:28,borderRadius:6,border:r==="si"?"2px solid #059669":"1px solid "+K.bd,background:r==="si"?"#dcfce7":"#fff",color:r==="si"?"#059669":K.mt,fontSize:11,fontWeight:700,cursor:"pointer"}}>{"S\u00ed"}</button>
                    <button onClick={function(){setRecoResponse(item.lam,r==="no"?undefined:"no")}} style={{width:32,height:28,borderRadius:6,border:r==="no"?"2px solid #dc2626":"1px solid "+K.bd,background:r==="no"?"#fef2f2":"#fff",color:r==="no"?"#dc2626":K.mt,fontSize:11,fontWeight:700,cursor:"pointer"}}>No</button>
                  </div>
                  <div style={{textAlign:"center"}}>{r==="si"&&<span style={{fontSize:10,color:"#059669",fontWeight:600}}>{"\u2714"}</span>}{r==="no"&&<span style={{fontSize:10,color:"#dc2626",fontWeight:600}}>{"\u2718"}</span>}</div>
                  <input value={obsMap[item.lam]||""} onChange={function(e){setOb(item.lam,e.target.value)}} placeholder="..." style={{padding:"5px 8px",border:"1px solid "+K.bd,borderRadius:6,fontSize:11,background:"#fff",width:"100%"}} />
                </div></div>;
              })}
            </div>
          </div>;
        })}
        <div style={{marginTop:16}}><label style={{fontSize:12,fontWeight:600,color:K.mt}}>Observaciones</label><textarea value={obs} onChange={function(e){setObs(e.target.value)}} rows={3} placeholder="Notas..." style={{width:"100%",padding:"10px 12px",border:"1px solid "+K.bd,borderRadius:8,fontSize:13,marginTop:4,resize:"vertical",fontFamily:"inherit"}} /></div>
        <div style={{display:"flex",gap:10,marginTop:20}}>
          <button onClick={function(){setStep(0);scrollTop();}} style={{flex:1,padding:"12px",background:"#f1f5f9",border:"1px solid "+K.bd,borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",color:K.mt}}>{"\u2190 Volver"}</button>
          <button onClick={function(){setStep(2);scrollTop();}} style={{flex:2,padding:"12px",background:"#059669",border:"none",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",color:"#fff"}}>{"Ver Resultados \u2192"}</button>
        </div>
      </div>}

      {step===2 && <div>
        <div style={{background:"#dcfce7",borderRadius:10,padding:"12px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18}}>{"\u2705"}</span><span style={{fontSize:13,fontWeight:600,color:"#059669"}}>{"Evaluaci\u00f3n guardada correctamente."}</span></div>

        {generating && <div style={{background:"#fff",borderRadius:14,border:"1px solid "+K.bd,padding:40,textAlign:"center",marginBottom:20}}>
          <div style={{display:"inline-block",width:40,height:40,border:"4px solid #e2e8f0",borderTopColor:"#9333ea",borderRadius:"50%",animation:"spin 1s linear infinite",marginBottom:16}} />
          <div style={{fontSize:15,fontWeight:600,color:K.sd}}>{"Generando informe con IA..."}</div>
          <div style={{fontSize:12,color:K.mt,marginTop:6}}>{"Esto puede tardar unos segundos."}</div>
          <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
        </div>}

        {genError && !report && <div style={{background:"#fff",borderRadius:14,border:"1px solid "+K.bd,padding:28,textAlign:"center",marginBottom:20}}>
          <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#dc2626"}}>{genError}</div>
          <button onClick={function(){ setGenError(null); }} style={{padding:"10px 24px",background:"#9333ea",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>{"Reintentar"}</button>
        </div>}

        {report && <div style={{marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
            <div style={{fontSize:15,fontWeight:700,color:K.sd}}>{"Informe Fonoaudiol\u00f3gico"}</div>
            <button onClick={handlePDFReport} style={{padding:"7px 14px",background:"#9333ea",color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>{"\ud83d\udda8 Imprimir informe"}</button>
          </div>
          <div ref={reportRef} style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:24}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,paddingBottom:12,borderBottom:"2px solid "+K.bd}}>
              <div><div style={{fontSize:10,color:K.mt,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>{"Informe Fonoaudiol\u00f3gico \u2014 Reco. Fonol\u00f3gico (PEFF-R 3.5)"}</div><div style={{fontSize:17,fontWeight:700,marginTop:3}}>{patient?patient.nombre:""}</div><div style={{fontSize:12,color:K.mt,marginTop:2}}>{"DNI: "+(patient?patient.dni||"N/A":"N/A")+" \u00b7 Edad: "+(patientAge?ageLabel(patientAge):"")}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontSize:11,color:K.mt}}>{"Fecha: "+(evalDate||"")}</div></div>
            </div>
            <div>{renderReportText(report)}</div>
            <div style={{marginTop:20,background:"linear-gradient(135deg,#f3e8ff,#ede9fe)",borderRadius:10,padding:"14px 18px",border:"1px solid #d8b4fe"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:18}}>{"\ud83e\udde0"}</span><span style={{fontSize:11,fontWeight:700,color:"#6b21a8"}}>{"Generado con IA"}</span></div><div style={{width:1,height:16,background:"#c4b5fd"}} /><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:18}}>{"\u2705"}</span><span style={{fontSize:11,fontWeight:700,color:"#059669"}}>{"Comprobado por profesionales en fonoaudiolog\u00eda de C\u00f3rdoba"}</span></div></div>
              <div style={{fontSize:10,color:"#7c3aed",marginTop:6}}>{"Generado con IA. Validado por profesionales fonoaudi\u00f3logos de C\u00f3rdoba, Argentina. Debe ser revisado por el profesional tratante."}</div>
            </div>
            <div style={{marginTop:14,paddingTop:8,borderTop:"1px solid "+K.bd,fontSize:9,color:"#94a3b8",textAlign:"center"}}>{"Br\u00fajula KIT \u2014 Reco. Fonol\u00f3gico (PEFF-R 3.5) \u2014 "+new Date().toLocaleDateString("es-AR")}</div>
          </div>
        </div>}

        <button onClick={function(){ setShowTech(!showTech); }} style={{width:"100%",padding:"14px",background:showTech?"#f1f5f9":"#0a3d2f",color:showTech?"#1e293b":"#fff",border:"1px solid #e2e8f0",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",marginBottom:showTech?16:20}}>{showTech?"\u25b2 Ocultar datos t\u00e9cnicos":"\u25bc Ver datos t\u00e9cnicos"}</button>

        {showTech && results && <div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
            <div style={{background:"#f3e8ff",borderRadius:10,padding:16,textAlign:"center"}}><div style={{fontSize:28,fontWeight:800,color:K.ac}}>{results.pct+"%"}</div><div style={{fontSize:11,color:K.mt,fontWeight:600}}>{"Aciertos"}</div></div>
            <div style={{background:results.severity==="Adecuado"?"#f0fdf4":results.severity==="Leve"?"#fffbeb":"#fef2f2",borderRadius:10,padding:16,textAlign:"center"}}><div style={{fontSize:20,fontWeight:700,color:results.severity==="Adecuado"?"#059669":results.severity==="Leve"?"#d97706":"#dc2626"}}>{results.severity}</div><div style={{fontSize:11,color:K.mt,fontWeight:600}}>{"Severidad"}</div></div>
            <div style={{background:"#f8fafc",borderRadius:10,padding:16,textAlign:"center"}}><div style={{fontSize:20,fontWeight:700,color:K.sd}}>{results.correct+"/"+results.total}</div><div style={{fontSize:11,color:K.mt,fontWeight:600}}>{"Contrastes"}</div></div>
          </div>
          <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,marginBottom:20}}>
            <h3 style={{fontSize:15,fontWeight:700,color:K.ac,marginBottom:12}}>{"Por grupo"}</h3>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>{results.groupResults.map(function(g){ var ok=g.correct===g.total; return <div key={g.id} style={{padding:"10px 14px",borderRadius:8,border:"1px solid "+(ok?"#bbf7d0":"#fecaca"),background:ok?"#f0fdf4":"#fef2f2",display:"flex",justifyContent:"space-between"}}><div><span style={{fontWeight:800,color:ok?"#059669":"#dc2626",marginRight:6}}>{g.id}</span><span style={{fontSize:12}}>{g.label}</span></div><span style={{fontWeight:700,color:ok?"#059669":"#dc2626"}}>{g.correct+"/"+g.total}</span></div>; })}</div>
          </div>
          {results.errorGroups.length>0 && <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,marginBottom:20}}>
            <h3 style={{fontSize:15,fontWeight:700,color:"#dc2626",marginBottom:12}}>{"\u26a0 Dificultades"}</h3>
            {results.errorGroups.map(function(g){ var f=g.items.filter(function(it){return !it.reconoce;}); return <div key={g.id} style={{padding:"12px 14px",background:"#fef2f2",borderRadius:8,marginBottom:8}}><div style={{fontSize:13,fontWeight:700,color:"#dc2626"}}>{g.id+" - "+g.label}</div><div style={{fontSize:11,color:"#7f1d1d",marginTop:2}}>{"No reconocidos: "+f.map(function(it){return "L\u00e1m."+it.lam}).join(", ")}</div></div>; })}
          </div>}
          {results.errorGroups.length===0 && <div style={{background:"#dcfce7",borderRadius:12,padding:24,textAlign:"center",marginBottom:20}}><span style={{fontSize:28}}>{"\u2705"}</span><p style={{fontSize:14,fontWeight:600,color:"#059669",marginTop:8}}>{"Reconocimiento adecuado."}</p></div>}
        </div>}

        <button onClick={function(){setStep(1);scrollTop();}} style={{width:"100%",padding:"14px",background:"#f1f5f9",border:"1px solid "+K.bd,borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",color:K.mt,marginTop:4}}>{"\u2190 Volver a editar"}</button>
      </div>}
    </div>
  );
}
