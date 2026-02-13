import { useState, useRef } from "react";

var K = { sd:"#0a3d2f", ac:"#0d9488", mt:"#64748b", bd:"#e2e8f0" };
function ageLabel(m){ return Math.floor(m/12)+" a\u00f1os, "+(m%12)+" meses"; }
var posLabels = {ISPP:"ISPP",ISIP:"ISIP",CSIP:"CSIP",CSFP:"CSFP"};
var posFull = {ISPP:"Inicio s\u00edl. \u2014 Pos. palabra",ISIP:"Inicio s\u00edl. \u2014 Int. palabra",CSIP:"Coda s\u00edl. \u2014 Int. palabra",CSFP:"Coda s\u00edl. \u2014 Final palabra"};

export default function RptREP({ ev, isA, onD }){
  var _cf = useState(false), confirmDel = _cf[0], sCf = _cf[1];
  var printRef = useRef(null);
  var res = ev.resultados || {};
  var byPhoneme = res.byPhoneme || {};
  var byCat = res.byCat || {};
  var byPosition = res.byPosition || {};
  var errorList = res.errorList || [];
  var patientAge = ev.edadMeses || 0;

  var handlePDF = function(){
    if(!printRef.current) return;
    import("html2canvas").then(function(mod){
      return mod.default(printRef.current,{scale:2,useCORS:true,backgroundColor:"#ffffff",scrollY:-window.scrollY,windowHeight:printRef.current.scrollHeight});
    }).then(function(canvas){
      return import("jspdf").then(function(mod){
        var jsPDF = mod.jsPDF;
        var pdf = new jsPDF("p","mm","a4");
        var pW = 210, pH = 297, margin = 10;
        var imgW = pW - margin*2;
        var imgH = (canvas.height * imgW) / canvas.width;
        var usableH = pH - margin*2;
        var pos = 0;
        var page = 0;
        while(pos < imgH){
          if(page > 0) pdf.addPage();
          var srcY = Math.round((pos / imgH) * canvas.height);
          var srcH = Math.round((Math.min(usableH, imgH - pos) / imgH) * canvas.height);
          var sliceCanvas = document.createElement("canvas");
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = srcH;
          var ctx = sliceCanvas.getContext("2d");
          ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
          var sliceH = (srcH * imgW) / canvas.width;
          pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", margin, margin, imgW, sliceH);
          pos += usableH;
          page++;
        }
        pdf.save("REP_"+((ev.paciente||"").replace(/\s/g,"_"))+"_"+ev.fechaEvaluacion+".pdf");
      });
    });
  };

  var sevColor = res.pcc===100?"#059669":res.pcc>=85?"#059669":res.pcc>=65?"#d97706":"#dc2626";
  var sevBg = res.pcc===100?"#f0fdf4":res.pcc>=85?"#f0fdf4":res.pcc>=65?"#fffbeb":"#fef2f2";

  return (
    <div style={{animation:"fi .3s ease",maxWidth:900,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h1 style={{fontSize:20,fontWeight:700}}>{"\ud83d\udcdd Reporte Rep. Palabras"}</h1>
        <div style={{display:"flex",gap:8}}>
          <button onClick={handlePDF} style={{padding:"8px 16px",background:K.ac,color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>{"\ud83d\udcc4 Exportar PDF"}</button>
          {isA && !confirmDel && <button onClick={function(){sCf(true)}} style={{padding:"8px 16px",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:8,fontSize:13,cursor:"pointer"}}>{"\ud83d\uddd1 Eliminar"}</button>}
          {isA && confirmDel && <div style={{display:"flex",gap:4}}>
            <button onClick={function(){onD(ev._fbId,"rep_evaluaciones")}} style={{padding:"8px 12px",background:"#dc2626",color:"#fff",border:"none",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer"}}>{"\u00bfEliminar?"}</button>
            <button onClick={function(){sCf(false)}} style={{padding:"8px 12px",background:"#f1f5f9",border:"none",borderRadius:6,fontSize:12,cursor:"pointer"}}>No</button>
          </div>}
        </div>
      </div>

      <div ref={printRef} style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:28}}>
        {/* Patient info */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,paddingBottom:16,borderBottom:"2px solid "+K.bd}}>
          <div>
            <div style={{fontSize:10,color:K.mt,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>{"Repetici\u00f3n de Palabras \u2014 PEFF 3.2"}</div>
            <div style={{fontSize:18,fontWeight:700,marginTop:4}}>{ev.paciente}</div>
            <div style={{fontSize:13,color:K.mt,marginTop:2}}>{"DNI: "+(ev.pacienteDni||"N/A")+" \u00b7 Edad: "+ageLabel(patientAge)}</div>
            {ev.derivadoPor && <div style={{fontSize:12,color:K.mt,marginTop:2}}>{"Derivado por: "+ev.derivadoPor}</div>}
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:12,color:K.mt}}>{"Fecha: "+ev.fechaEvaluacion}</div>
            {ev.evaluador && <div style={{fontSize:12,color:K.mt}}>{"Evaluador: "+ev.evaluador}</div>}
          </div>
        </div>

        {/* Summary cards */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:24}}>
          <div style={{background:"#f0fdf4",borderRadius:10,padding:16,textAlign:"center"}}>
            <div style={{fontSize:28,fontWeight:800,color:K.ac}}>{(res.pcc||0)+"%"}</div>
            <div style={{fontSize:11,color:K.mt,fontWeight:600}}>PCC</div>
          </div>
          <div style={{background:sevBg,borderRadius:10,padding:16,textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:700,color:sevColor}}>{res.severity||"-"}</div>
            <div style={{fontSize:11,color:K.mt,fontWeight:600}}>Severidad</div>
          </div>
          <div style={{background:"#f8fafc",borderRadius:10,padding:16,textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:700,color:K.sd}}>{(res.totalCorrect||0)+"/"+(res.totalEvaluated||0)}</div>
            <div style={{fontSize:11,color:K.mt,fontWeight:600}}>Correctos</div>
            <div style={{fontSize:10,color:K.mt}}>{(res.totalErrors||0)+" errores"}</div>
          </div>
        </div>

        {/* Distribution by position */}
        <h3 style={{fontSize:14,fontWeight:700,marginBottom:8}}>{"Distribuci\u00f3n por posici\u00f3n"}</h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:20}}>
          {["ISPP","ISIP","CSIP","CSFP"].map(function(posId){
            var p = byPosition[posId] || {ok:0,err:0,total:0};
            var pct = p.total > 0 ? Math.round((p.ok/p.total)*100) : 0;
            var clr = p.total===0?"#cbd5e1":pct>=85?"#059669":pct>=65?"#d97706":"#dc2626";
            return <div key={posId} style={{background:"#f8faf9",borderRadius:8,padding:12,textAlign:"center",border:"1px solid "+K.bd}}>
              <div style={{fontSize:12,fontWeight:700,color:K.ac}}>{posLabels[posId]}</div>
              <div style={{fontSize:9,color:K.mt,marginBottom:4}}>{posFull[posId]}</div>
              {p.total > 0 ? <div>
                <div style={{fontSize:18,fontWeight:700,color:clr}}>{pct+"%"}</div>
                <div style={{fontSize:10,color:K.mt}}>{p.ok+"/"+p.total}</div>
              </div> : <div style={{fontSize:10,color:"#cbd5e1"}}>{"Sin \u00edtems"}</div>}
            </div>;
          })}
        </div>

        {/* Category summary */}
        <h3 style={{fontSize:14,fontWeight:700,marginBottom:8}}>{"Resumen por categor\u00eda"}</h3>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,marginBottom:20}}>
          <thead><tr style={{borderBottom:"2px solid "+K.bd,background:"#f8fafc"}}>
            <th style={{textAlign:"left",padding:"6px 8px",color:K.mt}}>{"Categor\u00eda"}</th>
            <th style={{textAlign:"center",padding:"6px",color:K.mt}}>{"\u2713"}</th>
            <th style={{textAlign:"center",padding:"6px",color:K.mt}}>Errores</th>
            <th style={{textAlign:"center",padding:"6px",color:K.mt}}>Total</th>
            <th style={{textAlign:"center",padding:"6px",color:K.mt}}>%</th>
          </tr></thead>
          <tbody>
            {Object.values(byCat).map(function(c){
              var pct = c.total > 0 ? Math.round((c.ok/c.total)*100) : 0;
              return <tr key={c.title} style={{borderBottom:"1px solid #f1f5f9"}}>
                <td style={{padding:"6px 8px",fontWeight:600}}>{c.title}</td>
                <td style={{textAlign:"center",padding:"6px",color:"#059669",fontWeight:600}}>{c.ok}</td>
                <td style={{textAlign:"center",padding:"6px",color:c.errors>0?"#dc2626":"#059669",fontWeight:600}}>{c.errors}</td>
                <td style={{textAlign:"center",padding:"6px"}}>{c.total}</td>
                <td style={{textAlign:"center",padding:"6px"}}><span style={{padding:"2px 8px",borderRadius:10,fontSize:11,fontWeight:600,
                  background:pct>=85?"#dcfce7":pct>=65?"#fef3c7":"#fef2f2",
                  color:pct>=85?"#059669":pct>=65?"#d97706":"#dc2626"}}>{pct+"%"}</span></td>
              </tr>;
            })}
          </tbody>
        </table>

        {/* Phoneme detail */}
        <h3 style={{fontSize:14,fontWeight:700,marginBottom:8}}>{"Detalle por fonema"}</h3>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:11,marginBottom:20}}>
          <thead><tr style={{borderBottom:"2px solid "+K.bd,background:"#f8fafc"}}>
            <th style={{textAlign:"left",padding:"5px 8px",color:K.mt}}>Fonema</th>
            <th style={{textAlign:"center",padding:"5px",color:K.mt}}>Edad</th>
            <th style={{textAlign:"center",padding:"5px",color:"#059669"}}>{"\u2713"}</th>
            <th style={{textAlign:"center",padding:"5px",color:"#dc2626"}}>Err.</th>
            <th style={{textAlign:"center",padding:"5px",color:K.mt}}>Total</th>
            <th style={{textAlign:"center",padding:"5px",color:K.mt}}>Estado</th>
          </tr></thead>
          <tbody>
            {Object.entries(byPhoneme).map(function(e){
              var id = e[0], ph = e[1];
              var hasErr = ph.errors > 0;
              var expected = (patientAge/12) >= ph.age;
              return <tr key={id} style={{borderBottom:"1px solid #f1f5f9",background:hasErr&&expected?"#fef2f2":"transparent"}}>
                <td style={{padding:"5px 8px",fontWeight:700}}>{ph.phoneme}</td>
                <td style={{textAlign:"center",padding:"5px"}}>{ph.age+"a"}</td>
                <td style={{textAlign:"center",padding:"5px",color:"#059669",fontWeight:600}}>{ph.ok||"-"}</td>
                <td style={{textAlign:"center",padding:"5px",color:ph.errors>0?"#dc2626":"#d1d5db",fontWeight:600}}>{ph.errors||"-"}</td>
                <td style={{textAlign:"center",padding:"5px"}}>{ph.total}</td>
                <td style={{textAlign:"center",padding:"5px"}}>
                  {hasErr&&expected&&<span style={{padding:"1px 6px",borderRadius:8,background:"#fef2f2",color:"#dc2626",fontSize:9,fontWeight:700}}>ALTERADO</span>}
                  {hasErr&&!expected&&<span style={{padding:"1px 6px",borderRadius:8,background:"#fef3c7",color:"#d97706",fontSize:9,fontWeight:700}}>EN DESARROLLO</span>}
                  {!hasErr&&<span style={{padding:"1px 6px",borderRadius:8,background:"#dcfce7",color:"#059669",fontSize:9,fontWeight:700}}>ADECUADO</span>}
                </td>
              </tr>;
            })}
          </tbody>
        </table>

        {/* Error list */}
        {errorList.length > 0 && <div style={{marginBottom:20}}>
          <h3 style={{fontSize:14,fontWeight:700,color:"#dc2626",marginBottom:8}}>{"\u26a0 Detalle de errores ("+errorList.length+")"}</h3>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
            <thead><tr style={{borderBottom:"2px solid "+K.bd,background:"#fef2f2"}}>
              <th style={{textAlign:"left",padding:"5px 8px",color:K.mt}}>Fonema</th>
              <th style={{textAlign:"left",padding:"5px 8px",color:K.mt}}>Palabra</th>
              <th style={{textAlign:"center",padding:"5px",color:K.mt}}>Pos.</th>
              <th style={{textAlign:"left",padding:"5px 8px",color:K.mt}}>{"Producci\u00f3n"}</th>
            </tr></thead>
            <tbody>
              {errorList.map(function(err,i){
                var expected = (patientAge/12) >= err.age;
                return <tr key={i} style={{borderBottom:"1px solid #f1f5f9",background:expected?"#fef2f2":"#fffbeb"}}>
                  <td style={{padding:"5px 8px",fontWeight:700,color:K.ac}}>{err.phoneme}</td>
                  <td style={{padding:"5px 8px"}}>{err.word}</td>
                  <td style={{textAlign:"center",padding:"5px",fontSize:10,fontWeight:600,color:K.mt}}>{err.posId}</td>
                  <td style={{padding:"5px 8px",color:"#dc2626",fontWeight:600}}>{err.produccion}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>}

        {/* Altered phonemes */}
        {(function(){
          var alt = Object.entries(byPhoneme).filter(function(e){ var ph=e[1]; return ph.errors>0&&(patientAge/12)>=ph.age; });
          if(alt.length===0) return <div style={{background:"#dcfce7",borderRadius:12,padding:20,marginBottom:16,textAlign:"center"}}>
            <span style={{fontSize:24}}>{"\u2705"}</span>
            <p style={{fontSize:14,fontWeight:600,color:"#059669",marginTop:8}}>{"Todos los fonemas esperados est\u00e1n adecuados."}</p>
          </div>;
          return <div style={{background:"#fef2f2",borderRadius:12,border:"1px solid #fecaca",padding:20,marginBottom:16}}>
            <h3 style={{fontSize:15,fontWeight:700,color:"#dc2626",marginBottom:8}}>{"\u26a0 Fonemas alterados (esperados para la edad)"}</h3>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {alt.map(function(e){ var ph=e[1];
                return <div key={e[0]} style={{background:"#fff",borderRadius:8,padding:"8px 14px",border:"1px solid #fecaca"}}>
                  <span style={{fontWeight:700,fontSize:16}}>{ph.phoneme}</span>
                  <span style={{fontSize:11,color:"#dc2626",marginLeft:6}}>{ph.errors+" err."}</span>
                  {ph.errorWords && ph.errorWords.length>0 && <div style={{fontSize:10,color:K.mt,marginTop:2}}>
                    {ph.errorWords.map(function(ew){return ew.word+"\u2192"+ew.produccion}).join(", ")}
                  </div>}
                </div>;
              })}
            </div>
          </div>;
        })()}

        {ev.observaciones && <div style={{marginTop:12,padding:12,background:"#f8fafc",borderRadius:8}}>
          <strong style={{fontSize:12}}>Observaciones:</strong>
          <p style={{fontSize:12,color:K.mt,marginTop:4}}>{ev.observaciones}</p>
        </div>}

        <div style={{marginTop:24,paddingTop:12,borderTop:"1px solid "+K.bd,fontSize:10,color:"#94a3b8",textAlign:"center"}}>
          {"Br\u00fajula KIT \u2014 Rep. Palabras (PEFF 3.2) \u2014 Generado el "+new Date().toLocaleDateString("es-AR")}
        </div>
      </div>
    </div>
  );
}
