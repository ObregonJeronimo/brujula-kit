import { useState, useRef } from "react";
import { DISC_PAIRS, CONTRASTS } from "../data/discFonData.js";

var K = { sd:"#0a3d2f", ac:"#0d9488", mt:"#64748b", bd:"#e2e8f0" };
function ageLabel(m){ return Math.floor(m/12)+" a\u00f1os, "+(m%12)+" meses"; }

export default function RptDISC({ ev, onD }){
  var _cd = useState(false), cd = _cd[0], sCD = _cd[1];
  var printRef = useRef(null);
  var res = ev.resultados || {};
  var responses = ev.responses || {};
  var obsMap = ev.obsMap || {};

  var handlePDF = function(){
    if(!printRef.current) return;
    import("html2canvas").then(function(mod){
      return mod.default(printRef.current,{scale:2,useCORS:true,backgroundColor:"#ffffff",scrollY:-window.scrollY,windowHeight:printRef.current.scrollHeight});
    }).then(function(canvas){
      return import("jspdf").then(function(mod){
        var jsPDF = mod.jsPDF;
        var pdf = new jsPDF("p","mm","a4");
        var pW=210, pH=297, margin=10;
        var imgW=pW-margin*2;
        var imgH=(canvas.height*imgW)/canvas.width;
        var usableH=pH-margin*2;
        var pos=0, page=0;
        while(pos<imgH){
          if(page>0) pdf.addPage();
          var srcY=Math.round((pos/imgH)*canvas.height);
          var srcH=Math.round((Math.min(usableH,imgH-pos)/imgH)*canvas.height);
          if(srcH<=0) break;
          var sliceCanvas=document.createElement("canvas");
          sliceCanvas.width=canvas.width; sliceCanvas.height=srcH;
          var ctx=sliceCanvas.getContext("2d");
          ctx.drawImage(canvas,0,srcY,canvas.width,srcH,0,0,canvas.width,srcH);
          var sliceH=(srcH*imgW)/canvas.width;
          if(sliceH<1) break;
          pdf.addImage(sliceCanvas.toDataURL("image/png"),"PNG",margin,margin,imgW,sliceH);
          pos+=usableH; page++;
        }
        pdf.save("DISC_"+((ev.paciente||"").replace(/\s/g,"_"))+"_"+ev.fechaEvaluacion+".pdf");
      });
    });
  };

  var sevColor = res.severity==="Adecuado"?"#059669":res.severity==="Leve"?"#d97706":"#dc2626";
  var sevBg = res.severity==="Adecuado"?"#f0fdf4":res.severity==="Leve"?"#fffbeb":"#fef2f2";

  return (
    <div style={{animation:"fi .3s ease",maxWidth:900,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <h1 style={{fontSize:20,fontWeight:700}}>{"\ud83d\udc42 Discriminaci\u00f3n Fonol\u00f3gica"}</h1>
        <div style={{display:"flex",gap:8}}>
          {cd
            ?<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"14px 20px",display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
              <div style={{fontSize:13,fontWeight:600,color:"#dc2626",textAlign:"center"}}>{"\u00bfEst\u00e1 seguro que desea eliminar?"}</div>
              <div style={{fontSize:12,color:"#64748b",textAlign:"center"}}>{"Esta acci\u00f3n es irreversible"}</div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={function(){onD(ev._fbId,"disc_evaluaciones")}} style={{background:"#dc2626",color:"#fff",border:"none",padding:"8px 20px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>{"S\u00ed, eliminar"}</button>
                <button onClick={function(){sCD(false)}} style={{background:"#f1f5f9",border:"1px solid #e2e8f0",padding:"8px 20px",borderRadius:8,fontSize:13,cursor:"pointer",color:"#64748b"}}>Cancelar</button>
              </div>
            </div>
            :<><button onClick={handlePDF} style={{padding:"11px 22px",background:K.ac,color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{"\ud83d\udcc4 PDF"}</button>
              <button onClick={function(){sCD(true)}} style={{padding:"11px 22px",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{"Eliminar"}</button>
            </>
          }
        </div>
      </div>

      <div ref={printRef} style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:28}}>
        {/* Patient info */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,paddingBottom:16,borderBottom:"2px solid "+K.bd}}>
          <div>
            <div style={{fontSize:10,color:K.mt,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>{"Discriminaci\u00f3n Fonol\u00f3gica \u2014 PEFF-R 3.4"}</div>
            <div style={{fontSize:18,fontWeight:700,marginTop:4}}>{ev.paciente}</div>
            <div style={{fontSize:13,color:K.mt,marginTop:2}}>{"DNI: "+(ev.pacienteDni||"N/A")+" \u00b7 Edad: "+ageLabel(ev.edadMeses||0)}</div>
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
            <div style={{fontSize:28,fontWeight:800,color:K.ac}}>{(res.pct||0)+"%"}</div>
            <div style={{fontSize:11,color:K.mt,fontWeight:600}}>{"Aciertos"}</div>
          </div>
          <div style={{background:sevBg,borderRadius:10,padding:16,textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:700,color:sevColor}}>{res.severity||"-"}</div>
            <div style={{fontSize:11,color:K.mt,fontWeight:600}}>{"Severidad"}</div>
          </div>
          <div style={{background:"#f8fafc",borderRadius:10,padding:16,textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:700,color:K.sd}}>{(res.correct||0)+"/"+(res.evaluated||0)}</div>
            <div style={{fontSize:11,color:K.mt,fontWeight:600}}>{"Correctos"}</div>
            <div style={{fontSize:10,color:K.mt}}>{(res.incorrect||0)+" errores"}</div>
          </div>
        </div>

        {/* Full detail table */}
        <h3 style={{fontSize:14,fontWeight:700,marginBottom:8}}>{"Detalle de respuestas"}</h3>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,marginBottom:20}}>
          <thead><tr style={{borderBottom:"2px solid "+K.bd,background:"#f8fafc"}}>
            <th style={{textAlign:"center",padding:"6px 8px",color:K.mt,width:36}}>{"N\u00b0"}</th>
            <th style={{textAlign:"left",padding:"6px 8px",color:K.mt}}>{"Oposici\u00f3n"}</th>
            <th style={{textAlign:"center",padding:"6px",color:K.mt,width:50}}>{"Clave"}</th>
            <th style={{textAlign:"center",padding:"6px",color:K.mt,width:50}}>{"Resp."}</th>
            <th style={{textAlign:"center",padding:"6px",color:K.mt,width:70}}>{"Resultado"}</th>
            <th style={{textAlign:"left",padding:"6px 8px",color:K.mt}}>{"Obs."}</th>
          </tr></thead>
          <tbody>
            {DISC_PAIRS.map(function(pair){
              var r = responses[pair.id];
              var isCorrect = r === pair.clave;
              var isIncorrect = r !== undefined && r !== pair.clave;
              var noResp = r === undefined;
              return <tr key={pair.id} style={{borderBottom:"1px solid #f1f5f9",background:noResp?"#fffbeb":isCorrect?"#f0fdf4":"#fef2f2"}}>
                <td style={{textAlign:"center",padding:"6px 8px",fontWeight:700,color:K.mt}}>{pair.id}</td>
                <td style={{padding:"6px 8px",fontWeight:500}}>{pair.word1+" \u2014 "+pair.word2}</td>
                <td style={{textAlign:"center",padding:"6px",fontWeight:700,color:pair.clave==="I"?"#2563eb":"#be185d"}}>{pair.clave}</td>
                <td style={{textAlign:"center",padding:"6px",fontWeight:700,color:r==="I"?"#2563eb":r==="D"?"#be185d":"#94a3b8"}}>{r||"\u2014"}</td>
                <td style={{textAlign:"center",padding:"6px"}}>
                  {noResp && <span style={{fontSize:10,color:"#92400e",fontWeight:600}}>{"Sin resp."}</span>}
                  {isCorrect && <span style={{fontSize:10,color:"#059669",fontWeight:700}}>{"\u2714"}</span>}
                  {isIncorrect && <span style={{fontSize:10,color:"#dc2626",fontWeight:700}}>{"\u2718"}</span>}
                </td>
                <td style={{padding:"6px 8px",fontSize:11,color:K.mt}}>{obsMap[pair.id]||""}</td>
              </tr>;
            })}
          </tbody>
        </table>

        {/* Error analysis */}
        {res.errors && res.errors.length > 0 && <div style={{marginBottom:20}}>
          <h3 style={{fontSize:14,fontWeight:700,color:"#dc2626",marginBottom:8}}>{"\u26a0 An\u00e1lisis de errores ("+res.errors.length+")"}</h3>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
            <thead><tr style={{borderBottom:"2px solid "+K.bd,background:"#fef2f2"}}>
              <th style={{textAlign:"left",padding:"5px 8px",color:K.mt}}>{"Par"}</th>
              <th style={{textAlign:"center",padding:"5px",color:K.mt}}>{"Clave"}</th>
              <th style={{textAlign:"center",padding:"5px",color:K.mt}}>{"Resp."}</th>
              <th style={{textAlign:"left",padding:"5px 8px",color:K.mt}}>{"Contraste"}</th>
            </tr></thead>
            <tbody>
              {res.errors.map(function(e){
                return <tr key={e.id} style={{borderBottom:"1px solid #f1f5f9"}}>
                  <td style={{padding:"5px 8px",fontWeight:600}}>{e.word1+" \u2014 "+e.word2}</td>
                  <td style={{textAlign:"center",padding:"5px",fontWeight:700}}>{e.clave}</td>
                  <td style={{textAlign:"center",padding:"5px",fontWeight:700,color:"#dc2626"}}>{e.respuesta}</td>
                  <td style={{padding:"5px 8px",color:K.mt}}>{e.contrast ? e.contrast.f1+" vs "+e.contrast.f2+" ("+e.contrast.desc+")" : "\u2014"}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>}

        {/* Perceptive-phonological profile */}
        {res.errorsByContrast && Object.keys(res.errorsByContrast).length > 0 && <div style={{marginBottom:20}}>
          <h3 style={{fontSize:14,fontWeight:700,color:"#7c3aed",marginBottom:8}}>{"Perfil perceptivo-fonol\u00f3gico"}</h3>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {Object.entries(res.errorsByContrast).map(function(entry){
              var key=entry[0], data=entry[1];
              return <div key={key} style={{background:"#ede9fe",borderRadius:8,padding:"8px 14px",border:"1px solid #c4b5fd"}}>
                <span style={{fontWeight:700,fontSize:13,color:"#5b21b6"}}>{key}</span>
                <span style={{fontSize:11,color:"#6b21a8",marginLeft:8}}>{data.pairs.length+" error"+(data.pairs.length>1?"es":"")}</span>
              </div>;
            })}
          </div>
        </div>}

        {res.errors && res.errors.length === 0 && <div style={{background:"#dcfce7",borderRadius:12,padding:20,marginBottom:16,textAlign:"center"}}>
          <span style={{fontSize:24}}>{"\u2705"}</span>
          <p style={{fontSize:14,fontWeight:600,color:"#059669",marginTop:8}}>{"Discriminaci\u00f3n fonol\u00f3gica adecuada."}</p>
        </div>}

        {/* Clinical interpretation */}
        <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:10,padding:14,marginBottom:20,fontSize:12,color:"#0369a1",lineHeight:1.6}}>
          <strong>{"\u2139\ufe0f Criterios de clasificaci\u00f3n:"}</strong><br/>
          {"Adecuado: \u226595% \u00b7 Leve: 80-94% \u00b7 Moderado: 60-79% \u00b7 Severo: <60%"}
        </div>

        {ev.observaciones && <div style={{marginTop:12,padding:12,background:"#f8fafc",borderRadius:8}}>
          <strong style={{fontSize:12}}>Observaciones:</strong>
          <p style={{fontSize:12,color:K.mt,marginTop:4}}>{ev.observaciones}</p>
        </div>}

        <div style={{marginTop:24,paddingTop:12,borderTop:"1px solid "+K.bd,fontSize:10,color:"#94a3b8",textAlign:"center"}}>
          {"Br\u00fajula KIT \u2014 Disc. Fonol\u00f3gica (PEFF-R 3.4) \u2014 Generado el "+new Date().toLocaleDateString("es-AR")}
        </div>
      </div>
    </div>
  );
}
