import { useState, useRef } from "react";
import { RECO_GROUPS } from "../data/recoFonData.js";

var K = { sd:"#0a3d2f", ac:"#9333ea", mt:"#64748b", bd:"#e2e8f0" };
function ageLabel(m){ return Math.floor(m/12)+" a\u00f1os, "+(m%12)+" meses"; }

export default function RptRECO({ ev, onD }){
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
          var sliceCanvas=document.createElement("canvas");
          sliceCanvas.width=canvas.width; sliceCanvas.height=srcH;
          var ctx=sliceCanvas.getContext("2d");
          ctx.drawImage(canvas,0,srcY,canvas.width,srcH,0,0,canvas.width,srcH);
          var sliceH=(srcH*imgW)/canvas.width;
          pdf.addImage(sliceCanvas.toDataURL("image/png"),"PNG",margin,margin,imgW,sliceH);
          pos+=usableH; page++;
        }
        pdf.save("RECO_"+((ev.paciente||"").replace(/\s/g,"_"))+"_"+ev.fechaEvaluacion+".pdf");
      });
    });
  };

  var sevColor = res.severity==="Adecuado"?"#059669":res.severity==="Leve"?"#d97706":"#dc2626";
  var sevBg = res.severity==="Adecuado"?"#f0fdf4":res.severity==="Leve"?"#fffbeb":"#fef2f2";

  return (
    <div style={{animation:"fi .3s ease",maxWidth:900,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <h1 style={{fontSize:20,fontWeight:700}}>{"\ud83e\udde0 Reconocimiento Fonol\u00f3gico"}</h1>
        <div style={{display:"flex",gap:8}}>
          {cd
            ?<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"14px 20px",display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
              <div style={{fontSize:13,fontWeight:600,color:"#dc2626",textAlign:"center"}}>{"\u00bfEst\u00e1 seguro que desea eliminar?"}</div>
              <div style={{fontSize:12,color:"#64748b",textAlign:"center"}}>{"Esta acci\u00f3n es irreversible"}</div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={function(){onD(ev._fbId,"reco_evaluaciones")}} style={{background:"#dc2626",color:"#fff",border:"none",padding:"8px 20px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>{"S\u00ed, eliminar"}</button>
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
            <div style={{fontSize:10,color:K.mt,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>{"Reconocimiento Fonol\u00f3gico \u2014 PEFF-R 3.5"}</div>
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
          <div style={{background:"#f3e8ff",borderRadius:10,padding:16,textAlign:"center"}}>
            <div style={{fontSize:28,fontWeight:800,color:K.ac}}>{(res.pct||0)+"%"}</div>
            <div style={{fontSize:11,color:K.mt,fontWeight:600}}>{"Aciertos globales"}</div>
          </div>
          <div style={{background:sevBg,borderRadius:10,padding:16,textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:700,color:sevColor}}>{res.severity||"-"}</div>
            <div style={{fontSize:11,color:K.mt,fontWeight:600}}>{"Severidad"}</div>
          </div>
          <div style={{background:"#f8fafc",borderRadius:10,padding:16,textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:700,color:K.sd}}>{(res.correct||0)+"/"+(res.total||0)}</div>
            <div style={{fontSize:11,color:K.mt,fontWeight:600}}>{"Contrastes reconocidos"}</div>
          </div>
        </div>

        {/* Full detail table by group */}
        <h3 style={{fontSize:14,fontWeight:700,marginBottom:8}}>{"Detalle por grupo de contraste"}</h3>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,marginBottom:20}}>
          <thead><tr style={{borderBottom:"2px solid "+K.bd,background:"#f8fafc"}}>
            <th style={{textAlign:"center",padding:"6px 8px",color:K.mt,width:36}}>{"Gr."}</th>
            <th style={{textAlign:"left",padding:"6px 8px",color:K.mt}}>{"Tipo de contraste"}</th>
            <th style={{textAlign:"center",padding:"6px",color:K.mt,width:50}}>{"L\u00e1m."}</th>
            <th style={{textAlign:"left",padding:"6px 8px",color:K.mt}}>{"Est\u00edmulos"}</th>
            <th style={{textAlign:"center",padding:"6px",color:K.mt,width:70}}>{"Reconoce"}</th>
            <th style={{textAlign:"left",padding:"6px 8px",color:K.mt}}>{"Obs."}</th>
          </tr></thead>
          <tbody>
            {RECO_GROUPS.map(function(group){
              return group.items.map(function(item, idx){
                var r = responses[item.lam];
                var reconoce = r === "si" || r === true;
                var noReconoce = r === "no" || r === false;
                var noResp = r === undefined || r === null;
                var bgRow = noResp ? "#fffbeb" : reconoce ? "#f0fdf4" : "#fef2f2";
                return <tr key={item.lam} style={{borderBottom:"1px solid #f1f5f9",background:bgRow}}>
                  {idx === 0 && <td rowSpan={group.items.length} style={{textAlign:"center",padding:"6px 8px",fontWeight:800,color:K.ac,verticalAlign:"top",borderRight:"1px solid #f1f5f9"}}>{group.id}</td>}
                  {idx === 0 && <td rowSpan={group.items.length} style={{padding:"6px 8px",fontSize:11,color:"#334155",verticalAlign:"top",borderRight:"1px solid #f1f5f9"}}>{group.label}</td>}
                  <td style={{textAlign:"center",padding:"6px 8px",fontWeight:700,color:K.mt}}>{item.lam}</td>
                  <td style={{padding:"6px 8px",fontSize:11}}>{item.est.join(", ")}</td>
                  <td style={{textAlign:"center",padding:"6px"}}>
                    {noResp && <span style={{fontSize:10,color:"#92400e",fontWeight:600}}>{"Sin resp."}</span>}
                    {reconoce && <span style={{fontSize:10,color:"#059669",fontWeight:700}}>{"\u2714 S\u00ed"}</span>}
                    {noReconoce && <span style={{fontSize:10,color:"#dc2626",fontWeight:700}}>{"\u2718 No"}</span>}
                  </td>
                  <td style={{padding:"6px 8px",fontSize:11,color:K.mt}}>{obsMap[item.lam]||""}</td>
                </tr>;
              });
            })}
          </tbody>
        </table>

        {/* Group summary */}
        {res.groupResults && <div style={{marginBottom:20}}>
          <h3 style={{fontSize:14,fontWeight:700,color:K.ac,marginBottom:8}}>{"Resumen por grupo"}</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            {res.groupResults.map(function(g){
              var isOk = g.correct === g.total;
              return <div key={g.id} style={{padding:"8px 12px",borderRadius:8,border:"1px solid "+(isOk?"#bbf7d0":"#fecaca"),background:isOk?"#f0fdf4":"#fef2f2",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <span style={{fontWeight:800,color:isOk?"#059669":"#dc2626",marginRight:6,fontSize:13}}>{g.id}</span>
                  <span style={{fontSize:11,color:"#334155"}}>{g.label}</span>
                </div>
                <span style={{fontSize:12,fontWeight:700,color:isOk?"#059669":"#dc2626"}}>{g.correct+"/"+g.total}</span>
              </div>;
            })}
          </div>
        </div>}

        {/* Error groups */}
        {res.errorGroups && res.errorGroups.length > 0 && <div style={{marginBottom:20}}>
          <h3 style={{fontSize:14,fontWeight:700,color:"#dc2626",marginBottom:8}}>{"\u26a0 Grupos con dificultades"}</h3>
          {res.errorGroups.map(function(g){
            var failedItems = g.items.filter(function(it){ return !it.reconoce; });
            return <div key={g.id} style={{padding:"10px 14px",background:"#fef2f2",borderRadius:8,marginBottom:6,border:"1px solid #fecaca"}}>
              <div style={{fontSize:12,fontWeight:700,color:"#dc2626"}}>{g.id+" - "+g.label}</div>
              <div style={{fontSize:11,color:"#7f1d1d",marginTop:2}}>
                {"Items no reconocidos: "+failedItems.map(function(it){return "L\u00e1m. "+it.lam}).join(", ")}
              </div>
            </div>;
          })}
        </div>}

        {res.errorGroups && res.errorGroups.length === 0 && <div style={{background:"#dcfce7",borderRadius:12,padding:20,marginBottom:16,textAlign:"center"}}>
          <span style={{fontSize:24}}>{"\u2705"}</span>
          <p style={{fontSize:14,fontWeight:600,color:"#059669",marginTop:8}}>{"Reconocimiento fonol\u00f3gico adecuado."}</p>
        </div>}

        {/* Criteria */}
        <div style={{background:"#f3e8ff",border:"1px solid #d8b4fe",borderRadius:10,padding:14,marginBottom:20,fontSize:12,color:"#6b21a8",lineHeight:1.6}}>
          <strong>{"\u2139\ufe0f Criterios de clasificaci\u00f3n:"}</strong><br/>
          {"Adecuado: \u226595% \u00b7 Leve: 80-94% \u00b7 Moderado: 60-79% \u00b7 Severo: <60%"}
        </div>

        {ev.observaciones && <div style={{marginTop:12,padding:12,background:"#f8fafc",borderRadius:8}}>
          <strong style={{fontSize:12}}>Observaciones:</strong>
          <p style={{fontSize:12,color:K.mt,marginTop:4}}>{ev.observaciones}</p>
        </div>}

        <div style={{marginTop:24,paddingTop:12,borderTop:"1px solid "+K.bd,fontSize:10,color:"#94a3b8",textAlign:"center"}}>
          {"Br\u00fajula KIT \u2014 Reco. Fonol\u00f3gico (PEFF-R 3.5) \u2014 Generado el "+new Date().toLocaleDateString("es-AR")}
        </div>
      </div>
    </div>
  );
}
