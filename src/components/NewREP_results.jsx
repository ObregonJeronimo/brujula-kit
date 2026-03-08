// NewREP — Results view (step 2) — PEFF-R protocol
// Auto-saves, shows AI report first, technical data expandable below
import { useState, useEffect, useRef } from "react";
import { ageLabel } from "./NewREP_logic.js";

var K = { sd:"#0a3d2f", ac:"#0d9488", mt:"#64748b", bd:"#e2e8f0" };
var posLabels = {ISPP:"ISPP",ISIP:"ISIP",CSIP:"CSIP",CSFP:"CSFP"};
var posFull = {ISPP:"Inicio s\u00edl. \u2014 Pos. palabra",ISIP:"Inicio s\u00edl. \u2014 Int. palabra",CSIP:"Coda s\u00edl. \u2014 Int. palabra",CSFP:"Coda s\u00edl. \u2014 Final palabra"};

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

export default function NewREPResults({ results, patientAge, obs, onBack, onSave, patient, evalDate, derivado }){
  var _saved = useState(false), saved = _saved[0], setSaved = _saved[1];
  var _report = useState(null), report = _report[0], setReport = _report[1];
  var _generating = useState(false), generating = _generating[0], setGenerating = _generating[1];
  var _genError = useState(null), genError = _genError[0], setGenError = _genError[1];
  var _showTech = useState(false), showTech = _showTech[0], setShowTech = _showTech[1];
  var reportRef = useRef(null);

  if(!results) return null;

  // Auto-save on mount
  useEffect(function(){
    if(!saved && onSave){
      onSave();
      setSaved(true);
    }
  }, []);

  // Auto-generate AI report on mount
  useEffect(function(){
    if(!report && !generating && !genError){
      setGenerating(true);
      var evalData = {
        paciente: patient ? patient.nombre : "",
        pacienteDni: patient ? (patient.dni || "") : "",
        edadMeses: patientAge || 0,
        fechaEvaluacion: evalDate || "",
        derivadoPor: derivado || "",
        observaciones: obs || "",
        resultados: results
      };
      fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evalData: evalData, evalType: "rep", reportMode: "clinico" })
      })
      .then(function(r){ return r.json(); })
      .then(function(data){
        if(data.success && data.report){
          setReport(data.report);
        } else {
          setGenError(data.error || "Error al generar informe.");
        }
        setGenerating(false);
      })
      .catch(function(e){
        setGenError("Error de conexi\u00f3n: " + e.message);
        setGenerating(false);
      });
    }
  }, []);

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
        pdf.save("Informe_REP_"+((patient?patient.nombre:"").replace(/\s/g,"_"))+"_"+(evalDate||"")+".pdf");
      });
    }).catch(function(e){ reportRef.current.style.paddingBottom=""; console.error(e); });
  };

  var sevColor = results.pcc===100?"#059669":results.pcc>=85?"#059669":results.pcc>=65?"#d97706":results.pcc>=50?"#ea580c":"#dc2626";

  return (
    <div>
      {/* SAVED CONFIRMATION */}
      <div style={{background:"#dcfce7",borderRadius:10,padding:"12px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:18}}>{"\u2705"}</span>
        <span style={{fontSize:13,fontWeight:600,color:"#059669"}}>{"Evaluaci\u00f3n guardada correctamente."}</span>
      </div>

      {/* AI REPORT - LOADING */}
      {generating && <div style={{background:"#fff",borderRadius:14,border:"1px solid "+K.bd,padding:40,textAlign:"center",marginBottom:20}}>
        <div style={{display:"inline-block",width:40,height:40,border:"4px solid #e2e8f0",borderTopColor:"#9333ea",borderRadius:"50%",animation:"spin 1s linear infinite",marginBottom:16}} />
        <div style={{fontSize:15,fontWeight:600,color:K.sd}}>{"Generando informe con IA..."}</div>
        <div style={{fontSize:12,color:K.mt,marginTop:6}}>{"Esto puede tardar unos segundos."}</div>
        <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
      </div>}

      {/* AI REPORT - ERROR */}
      {genError && !report && <div style={{background:"#fff",borderRadius:14,border:"1px solid "+K.bd,padding:28,textAlign:"center",marginBottom:20}}>
        <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#dc2626"}}>{genError}</div>
        <button onClick={function(){ setGenError(null); setGenerating(false); }} style={{padding:"10px 24px",background:"#9333ea",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>{"Reintentar"}</button>
      </div>}

      {/* AI REPORT - CONTENT */}
      {report && <div style={{marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
          <div style={{fontSize:15,fontWeight:700,color:K.sd}}>{"Informe Fonoaudiol\u00f3gico"}</div>
          <button onClick={handlePDFReport} style={{padding:"7px 14px",background:"#9333ea",color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>{"\ud83d\udda8 Imprimir informe"}</button>
        </div>
        <div ref={reportRef} style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:24}}>
          {/* Header */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,paddingBottom:12,borderBottom:"2px solid "+K.bd}}>
            <div>
              <div style={{fontSize:10,color:K.mt,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>{"Informe Fonoaudiol\u00f3gico \u2014 Rep. Palabras (PEFF 3.2)"}</div>
              <div style={{fontSize:17,fontWeight:700,marginTop:3}}>{patient ? patient.nombre : ""}</div>
              <div style={{fontSize:12,color:K.mt,marginTop:2}}>{"DNI: "+(patient?patient.dni||"N/A":"N/A")+" \u00b7 Edad: "+(patientAge ? Math.floor(patientAge/12)+" a\u00f1os, "+(patientAge%12)+" meses" : "")}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:11,color:K.mt}}>{"Fecha: "+(evalDate||"")}</div>
            </div>
          </div>

          {/* Report text */}
          <div>{renderReportText(report)}</div>

          {/* AI + Professionals badge */}
          <div style={{marginTop:20,background:"linear-gradient(135deg,#f3e8ff,#ede9fe)",borderRadius:10,padding:"14px 18px",border:"1px solid #d8b4fe"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:18}}>{"\ud83e\udde0"}</span>
                <span style={{fontSize:11,fontWeight:700,color:"#6b21a8"}}>{"Generado con IA"}</span>
              </div>
              <div style={{width:1,height:16,background:"#c4b5fd"}} />
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:18}}>{"\u2705"}</span>
                <span style={{fontSize:11,fontWeight:700,color:"#059669"}}>{"Comprobado por profesionales en fonoaudiolog\u00eda de C\u00f3rdoba"}</span>
              </div>
            </div>
            <div style={{fontSize:10,color:"#7c3aed",marginTop:6}}>{"Este informe fue generado con asistencia de inteligencia artificial. Los resultados y la estructura del informe han sido validados por profesionales fonoaudi\u00f3logos de la provincia de C\u00f3rdoba, Argentina. Debe ser revisado por el profesional tratante antes de su uso cl\u00ednico."}</div>
          </div>

          {/* Footer */}
          <div style={{marginTop:14,paddingTop:8,borderTop:"1px solid "+K.bd,fontSize:9,color:"#94a3b8",textAlign:"center"}}>
            {"Br\u00fajula KIT \u2014 Rep. Palabras (PEFF 3.2) \u2014 "+new Date().toLocaleDateString("es-AR")}
          </div>
        </div>
      </div>}

      {/* TECHNICAL DATA TOGGLE */}
      <button onClick={function(){ setShowTech(!showTech); }} style={{width:"100%",padding:"14px",background:showTech?"#f1f5f9":"#0a3d2f",color:showTech?"#1e293b":"#fff",border:"1px solid #e2e8f0",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",marginBottom:showTech?16:20}}>
        {showTech ? "\u25b2 Ocultar datos t\u00e9cnicos" : "\u25bc Ver datos t\u00e9cnicos de la evaluaci\u00f3n"}
      </button>

      {showTech && <div>
        {/* Summary cards */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
          <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,textAlign:"center"}}>
            <div style={{fontSize:32,fontWeight:800,color:K.ac}}>{results.pcc+"%"}</div>
            <div style={{fontSize:12,color:K.mt,fontWeight:600}}>PCC</div>
          </div>
          <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,textAlign:"center"}}>
            <div style={{fontSize:24,fontWeight:700,color:sevColor}}>{results.severity}</div>
            <div style={{fontSize:12,color:K.mt,fontWeight:600}}>Severidad</div>
          </div>
          <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,textAlign:"center"}}>
            <div style={{fontSize:24,fontWeight:700,color:K.sd}}>{results.totalCorrect+"/"+results.totalEvaluated}</div>
            <div style={{fontSize:12,color:K.mt,fontWeight:600}}>Correctos</div>
            <div style={{fontSize:11,color:K.mt}}>{results.totalErrors+" errores"}</div>
          </div>
        </div>

        {/* Distribution by position */}
        <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,marginBottom:16}}>
          <h3 style={{fontSize:15,fontWeight:700,marginBottom:12}}>{"Distribuci\u00f3n por posici\u00f3n"}</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10}}>
            {["ISPP","ISIP","CSIP","CSFP"].map(function(posId){
              var p = results.byPosition[posId] || {ok:0,err:0,total:0};
              var pct = p.total > 0 ? Math.round((p.ok/p.total)*100) : 0;
              var clr = p.total===0?"#cbd5e1":pct>=85?"#059669":pct>=65?"#d97706":"#dc2626";
              return <div key={posId} style={{background:"#f8faf9",borderRadius:10,padding:14,textAlign:"center",border:"1px solid "+K.bd}}>
                <div style={{fontSize:13,fontWeight:700,color:K.ac,marginBottom:4}}>{posLabels[posId]}</div>
                <div style={{fontSize:9,color:K.mt,marginBottom:8,lineHeight:1.3}}>{posFull[posId]}</div>
                {p.total > 0 ? <div><div style={{fontSize:22,fontWeight:700,color:clr}}>{pct+"%"}</div><div style={{fontSize:11,color:K.mt}}>{p.ok+"/"+p.total}</div></div> : <div style={{fontSize:11,color:"#cbd5e1"}}>{"Sin \u00edtems"}</div>}
              </div>;
            })}
          </div>
        </div>

        {/* Category summary */}
        <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,marginBottom:16}}>
          <h3 style={{fontSize:15,fontWeight:700,marginBottom:12}}>{"Resumen por categor\u00eda"}</h3>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{borderBottom:"2px solid "+K.bd}}>
              <th style={{textAlign:"left",padding:"8px",color:K.mt,fontSize:11}}>{"Categor\u00eda"}</th>
              <th style={{textAlign:"center",padding:"8px",color:K.mt,fontSize:11}}>Correctos</th>
              <th style={{textAlign:"center",padding:"8px",color:K.mt,fontSize:11}}>Errores</th>
              <th style={{textAlign:"center",padding:"8px",color:K.mt,fontSize:11}}>Total</th>
              <th style={{textAlign:"center",padding:"8px",color:K.mt,fontSize:11}}>%</th>
            </tr></thead>
            <tbody>
              {Object.values(results.byCat).map(function(c){
                var pct = c.total > 0 ? Math.round((c.ok/c.total)*100) : 0;
                return <tr key={c.title} style={{borderBottom:"1px solid #f1f5f9"}}>
                  <td style={{padding:"8px",fontWeight:600}}>{c.title}</td>
                  <td style={{textAlign:"center",padding:"8px",color:"#059669",fontWeight:600}}>{c.ok}</td>
                  <td style={{textAlign:"center",padding:"8px",color:c.errors>0?"#dc2626":"#059669",fontWeight:600}}>{c.errors}</td>
                  <td style={{textAlign:"center",padding:"8px"}}>{c.total}</td>
                  <td style={{textAlign:"center",padding:"8px"}}><span style={{padding:"2px 8px",borderRadius:10,fontSize:12,fontWeight:600,background:pct>=85?"#dcfce7":pct>=65?"#fef3c7":"#fef2f2",color:pct>=85?"#059669":pct>=65?"#d97706":"#dc2626"}}>{pct+"%"}</span></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>

        {/* Phoneme detail */}
        <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,marginBottom:16}}>
          <h3 style={{fontSize:15,fontWeight:700,marginBottom:12}}>{"Detalle por fonema"}</h3>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{borderBottom:"2px solid "+K.bd}}>
              <th style={{textAlign:"left",padding:"6px 8px",color:K.mt,fontSize:11}}>Fonema</th>
              <th style={{textAlign:"center",padding:"6px",color:K.mt,fontSize:11}}>Edad</th>
              <th style={{textAlign:"center",padding:"6px",color:"#059669",fontSize:11}}>{"\u2713"}</th>
              <th style={{textAlign:"center",padding:"6px",color:"#dc2626",fontSize:11}}>Err.</th>
              <th style={{textAlign:"center",padding:"6px",color:K.mt,fontSize:11}}>Total</th>
              <th style={{textAlign:"center",padding:"6px",color:K.mt,fontSize:11}}>Estado</th>
            </tr></thead>
            <tbody>
              {Object.entries(results.byPhoneme).map(function(e){
                var id = e[0], ph = e[1];
                var hasErrors = ph.errors > 0;
                var isExpected = (patientAge/12) >= ph.age;
                return <tr key={id} style={{borderBottom:"1px solid #f1f5f9",background:hasErrors && isExpected?"#fef2f2":"transparent"}}>
                  <td style={{padding:"6px 8px",fontWeight:700}}>{ph.phoneme}</td>
                  <td style={{textAlign:"center",padding:"6px",fontSize:11}}>{ph.age+" a."}</td>
                  <td style={{textAlign:"center",padding:"6px",color:"#059669",fontWeight:600}}>{ph.ok||"-"}</td>
                  <td style={{textAlign:"center",padding:"6px",color:ph.errors>0?"#dc2626":"#d1d5db",fontWeight:600}}>{ph.errors||"-"}</td>
                  <td style={{textAlign:"center",padding:"6px"}}>{ph.total}</td>
                  <td style={{textAlign:"center",padding:"6px"}}>
                    {hasErrors && isExpected && <span style={{padding:"2px 8px",borderRadius:10,background:"#fef2f2",color:"#dc2626",fontSize:10,fontWeight:700}}>ALTERADO</span>}
                    {hasErrors && !isExpected && <span style={{padding:"2px 8px",borderRadius:10,background:"#fef3c7",color:"#d97706",fontSize:10,fontWeight:700}}>EN DESARROLLO</span>}
                    {!hasErrors && <span style={{padding:"2px 8px",borderRadius:10,background:"#dcfce7",color:"#059669",fontSize:10,fontWeight:700}}>ADECUADO</span>}
                  </td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>

        {/* Error details */}
        {results.errorList.length > 0 && <div style={{background:"#fff",borderRadius:12,border:"1px solid #fecaca",padding:20,marginBottom:16}}>
          <h3 style={{fontSize:15,fontWeight:700,color:"#dc2626",marginBottom:12}}>{"\u26a0 Detalle de errores ("+results.errorList.length+")"}</h3>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{borderBottom:"2px solid "+K.bd,background:"#fef2f2"}}>
              <th style={{textAlign:"left",padding:"6px 8px",color:K.mt,fontSize:11}}>Fonema</th>
              <th style={{textAlign:"left",padding:"6px 8px",color:K.mt,fontSize:11}}>Palabra</th>
              <th style={{textAlign:"center",padding:"6px",color:K.mt,fontSize:11}}>Pos.</th>
              <th style={{textAlign:"left",padding:"6px 8px",color:K.mt,fontSize:11}}>{"Producci\u00f3n"}</th>
            </tr></thead>
            <tbody>
              {results.errorList.map(function(err, i){
                var isExpected = (patientAge/12) >= err.age;
                return <tr key={i} style={{borderBottom:"1px solid #f1f5f9",background:isExpected?"#fef2f2":"#fffbeb"}}>
                  <td style={{padding:"6px 8px",fontWeight:700,color:K.ac}}>{err.phoneme}</td>
                  <td style={{padding:"6px 8px",fontWeight:500}}>{err.word}</td>
                  <td style={{textAlign:"center",padding:"6px",fontSize:11,fontWeight:600,color:K.mt}}>{err.posId}</td>
                  <td style={{padding:"6px 8px",color:"#dc2626",fontWeight:600}}>{err.produccion}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>}

        {/* Altered phonemes */}
        {(function(){
          var altered = Object.entries(results.byPhoneme).filter(function(e){ var ph = e[1]; return ph.errors > 0 && (patientAge/12) >= ph.age; });
          if(altered.length === 0) return <div style={{background:"#dcfce7",borderRadius:12,padding:20,marginBottom:16,textAlign:"center"}}>
            <span style={{fontSize:24}}>{"\u2705"}</span>
            <p style={{fontSize:14,fontWeight:600,color:"#059669",marginTop:8}}>{"Todos los fonemas esperados est\u00e1n adecuados."}</p>
          </div>;
          return <div style={{background:"#fef2f2",borderRadius:12,border:"1px solid #fecaca",padding:20,marginBottom:16}}>
            <h3 style={{fontSize:15,fontWeight:700,color:"#dc2626",marginBottom:8}}>{"\u26a0 Fonemas alterados (esperados para la edad)"}</h3>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {altered.map(function(e){ var ph = e[1];
                return <div key={e[0]} style={{background:"#fff",borderRadius:8,padding:"8px 14px",border:"1px solid #fecaca"}}>
                  <span style={{fontWeight:700,fontSize:16}}>{ph.phoneme}</span>
                  <span style={{fontSize:11,color:"#dc2626",marginLeft:6}}>{ph.errors+" err."}</span>
                  {ph.errorWords.length > 0 && <div style={{fontSize:10,color:K.mt,marginTop:2}}>
                    {ph.errorWords.map(function(ew){return ew.word+"\u2192"+ew.produccion}).join(", ")}
                  </div>}
                </div>;
              })}
            </div>
          </div>;
        })()}

        {obs && <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,marginBottom:16}}>
          <h3 style={{fontSize:14,fontWeight:600,marginBottom:6}}>Observaciones</h3>
          <p style={{fontSize:13,color:K.mt}}>{obs}</p>
        </div>}
      </div>}

      {/* BACK BUTTON */}
      <button onClick={onBack} style={{width:"100%",padding:"14px",background:"#f1f5f9",border:"1px solid "+K.bd,borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",color:K.mt,marginTop:4}}>
        {"\u2190 Volver a editar evaluaci\u00f3n"}
      </button>
    </div>
  );
}
