import { useState } from "react";
import { ALL_PROCESSES } from "../data/peffProcesos.js";
import { PEFF_SECTIONS } from "../data/peffSections.js";
import { openDetailPdf, openSummaryPdf } from "./RptPEFF_pdf.js";

var K = { mt: "#64748b" };
var fa = function(m){ return Math.floor(m/12)+" a\u00f1os, "+(m%12)+" meses"; };

var sevDesc = {
  "Adecuado":"El ni\u00f1o/a produce correctamente todos o casi todos los fonemas esperados para su edad.",
  "Leve":"Se observan errores articulatorios aislados que no comprometen significativamente la inteligibilidad del habla.",
  "Moderado":"Se observan m\u00faltiples errores articulatorios que afectan parcialmente la inteligibilidad.",
  "Moderado-Severo":"Se observan errores articulatorios frecuentes que comprometen la inteligibilidad del habla.",
  "Severo":"Se observan errores articulatorios generalizados que comprometen severamente la inteligibilidad."
};
var sevColor = {"Adecuado":"#059669","Leve":"#f59e0b","Moderado":"#ea580c","Moderado-Severo":"#dc2626","Severo":"#dc2626"};

export default function RptPEFF({ev,isA,onD}){
  var _cd = useState(false), cd = _cd[0], sCD = _cd[1];
  var _sd2 = useState(false), showDetail = _sd2[0], setShowDetail = _sd2[1];
  var r = ev.resultados||{};
  var pa = r.procAnalysis||null;
  var catNames = {sust:"Sustituciones",asim:"Asimilaciones",estr:"Estructuraci\u00f3n sil\u00e1bica"};
  var catColors = {sust:"#f59e0b",asim:"#7c3aed",estr:"#dc2626"};
  var sd = ev.seccionData||{};
  var sev = r.severity||"\u2014";
  var sc = sevColor[sev]||"#7c3aed";

  var renderProcSection = function(){
    if(!pa||pa.total===0) return <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,padding:20,marginBottom:20}}>
      <div style={{fontSize:14,fontWeight:600,color:"#059669"}}>{"\u2713 Sin procesos fonol\u00f3gicos registrados"}</div>
    </div>;
    var ageExpected = pa.errors ? pa.errors.filter(function(e){return ev.edadMeses>0 && e.expectedAge<ev.edadMeses}) : [];
    return <div style={{marginTop:28}}>
      <h3 style={{fontSize:16,fontWeight:700,color:"#5b21b6",marginBottom:12}}>{"Procesos Fonol\u00f3gicos ("+pa.total+")"}</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
        {Object.entries(catNames).map(function(entry){
          var id=entry[0],name=entry[1]; var c=(pa.byCategory&&pa.byCategory[id])||0;
          return <div key={id} style={{background:"#f8faf9",borderRadius:10,padding:16,border:"2px solid "+(c>0?catColors[id]:"#e2e8f0"),textAlign:"center"}}>
            <div style={{fontSize:28,fontWeight:700,color:c>0?catColors[id]:"#cbd5e1"}}>{c}</div>
            <div style={{fontSize:11,color:K.mt,marginTop:2}}>{name}</div>
          </div>;
        })}
      </div>
      {pa.errors&&pa.errors.length>0&&<div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,overflow:"hidden",marginBottom:16}}>
        <div style={{background:"#f8faf9",padding:"10px 16px",fontSize:12,fontWeight:700,color:K.mt,display:"grid",gridTemplateColumns:"60px 80px 1fr 1fr",gap:8}}>
          <span>{"S\u00edlaba"}</span><span>{"Producc."}</span><span>{"Proceso"}</span><span>{"Cat."}</span>
        </div>
        {pa.errors.map(function(e,i){
          return <div key={i} style={{padding:"8px 16px",fontSize:13,display:"grid",gridTemplateColumns:"60px 80px 1fr 1fr",gap:8,borderTop:"1px solid #f1f5f9",background:ev.edadMeses>0&&e.expectedAge<ev.edadMeses?"#fef2f2":"#fff"}}>
            <span style={{fontWeight:700,color:"#7c3aed"}}>{e.word}</span>
            <span style={{color:"#dc2626",fontWeight:600}}>{e.produccion||"\u2014"}</span>
            <span style={{fontSize:12}}>{e.procesoName}</span>
            <span style={{fontSize:11,color:catColors[e.category],fontWeight:600}}>{e.categoryTitle}</span>
          </div>;
        })}
      </div>}
      {ageExpected.length>0&&<div style={{background:"#fef3c7",border:"1px solid #fde68a",borderRadius:10,padding:16,marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:700,color:"#92400e",marginBottom:6}}>{"\u26a0 No esperados ("+fa(ev.edadMeses)+")"}</div>
        <div style={{fontSize:12,color:"#78350f"}}>{ageExpected.map(function(e){return e.procesoName+" (esperable hasta "+fa(e.expectedAge)+")"}).filter(function(v,i,a){return a.indexOf(v)===i}).join("; ")}</div>
      </div>}
      {pa.byProcess&&(function(){
        var sorted = Object.entries(pa.byProcess).sort(function(a,b){return b[1]-a[1]});
        if(sorted.length===0) return null;
        var top = sorted.slice(0,3).map(function(entry){var p=ALL_PROCESSES.find(function(x){return x.id===entry[0]});return(p?p.name:entry[0])+" ("+entry[1]+")"});
        return <div style={{background:"#ede9fe",borderRadius:10,padding:16}}>
          <div style={{fontSize:13,fontWeight:700,color:"#5b21b6",marginBottom:4}}>{"Predominantes"}</div>
          <div style={{fontSize:13,color:"#3b0764"}}>{top.join(", ")}</div>
        </div>;
      })()}
    </div>;
  };

  var RC = function(props){
    return <div style={{background:"#f8faf9",borderRadius:12,padding:20,border:"1px solid #e2e8f0"}}>
      <div style={{fontSize:13,fontWeight:700,color:"#1e293b",marginBottom:4}}>{props.title}</div>
      <div style={{fontSize:11,color:K.mt,marginBottom:10,lineHeight:1.5}}>{props.desc}</div>
      <div style={{fontSize:30,fontWeight:700,color:props.color||"#7c3aed",textAlign:"center"}}>{props.ok}<span style={{fontSize:15,color:K.mt}}>{"/"+props.total}</span></div>
      {props.pct!==undefined&&props.pct>0&&<div style={{textAlign:"center",fontSize:12,color:K.mt,marginTop:4}}>{props.pct+"% correcto"}</div>}
    </div>;
  };

  return <div style={{width:"100%",maxWidth:900,animation:"fi .3s ease"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
      <div>
        <h1 style={{fontSize:24,fontWeight:700,color:"#7c3aed"}}>{"Informe PEFF"}</h1>
        <p style={{color:K.mt,fontSize:15,marginTop:2}}>{ev.paciente+" \u2014 "+fa(ev.edadMeses)}</p>
      </div>
      <div style={{display:"flex",gap:8}}>
        {isA&&(cd?<div style={{display:"flex",gap:4}}>
          <button onClick={function(){onD(ev._fbId,"peff_evaluaciones");sCD(false)}} style={{background:"#dc2626",color:"#fff",border:"none",padding:"8px 16px",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer"}}>{"S\u00ed"}</button>
          <button onClick={function(){sCD(false)}} style={{background:"#f1f5f9",border:"none",padding:"8px 16px",borderRadius:6,fontSize:12,cursor:"pointer"}}>{"No"}</button>
        </div>:<button onClick={function(){sCD(true)}} style={{background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",padding:"8px 16px",borderRadius:8,fontSize:13,cursor:"pointer"}}>{"\ud83d\uddd1 Eliminar"}</button>)}
        <button onClick={function(){openSummaryPdf(ev)}} style={{background:"#7c3aed",color:"#fff",border:"none",padding:"11px 22px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{"\ud83d\udcc4 PDF"}</button>
      </div>
    </div>

    <div style={{background:"#fff",borderRadius:14,padding:32,border:"1px solid #e2e8f0"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:20}}>
        <RC title="Producci\u00f3n de S\u00edlabas" desc="S\u00edlabas producidas correctamente al repetir est\u00edmulos fon\u00e9ticos."
          ok={r.silOk||0} total={r.silTotal||0} pct={r.silPct||0}
          color={(r.silPct||0)>=85?"#059669":(r.silPct||0)>=50?"#f59e0b":"#dc2626"}/>
        <RC title="Discriminaci\u00f3n Auditiva" desc="Pares de palabras diferenciados correctamente (igual vs diferente)."
          ok={r.discOk||0} total={r.discTotal||0} pct={r.discEval>0?Math.round((r.discOk||0)/r.discEval*100):0}
          color={(r.discOk||0)>=(r.discTotal||1)*0.85?"#059669":(r.discOk||0)>=(r.discTotal||1)*0.5?"#f59e0b":"#dc2626"}/>
        <RC title="Reconocimiento Fonol\u00f3gico" desc="Palabras identificadas correctamente entre opciones fonol\u00f3gicamente similares."
          ok={r.recOk||0} total={r.recTotal||0} pct={r.recEval>0?Math.round((r.recOk||0)/r.recEval*100):0}
          color={(r.recOk||0)>=(r.recTotal||1)*0.85?"#059669":(r.recOk||0)>=(r.recTotal||1)*0.5?"#f59e0b":"#dc2626"}/>
      </div>

      <div style={{background:"linear-gradient(135deg,"+sc+"dd,"+sc+")",borderRadius:12,padding:24,color:"#fff",marginBottom:20}}>
        <div style={{fontSize:13,opacity:.8,marginBottom:4}}>{"Severidad del trastorno fon\u00e9tico-fonol\u00f3gico"}</div>
        <div style={{fontSize:36,fontWeight:700,marginBottom:8}}>{sev}</div>
        <div style={{fontSize:13,opacity:.9,lineHeight:1.6}}>{sevDesc[sev]||""}</div>
      </div>

      <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:10,padding:14,marginBottom:20,fontSize:12,color:"#0369a1",lineHeight:1.6}}>
        <strong>{"\u2139\ufe0f Criterios de clasificaci\u00f3n:"}</strong><br/>
        {"Adecuado: \u226598% \u00b7 Leve: 85-97% \u00b7 Moderado: 65-84% \u00b7 Moderado-Severo: 50-64% \u00b7 Severo: <50%"}
      </div>

      {r.unevalTotal>0&&<div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:16,marginBottom:20}}>
        <div style={{fontSize:13,fontWeight:700,color:"#92400e",marginBottom:8}}>{"\u26a0 \u00cdtems sin evaluar ("+r.unevalTotal+")"}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,fontSize:12,color:"#78350f"}}>
          {r.unevalSelects>0&&<div>{"Examen Cl\u00ednico OFA / Coordinaci\u00f3n: "}<b>{r.unevalSelects}</b></div>}
          {r.unevalPhon>0&&<div>{"Producci\u00f3n de S\u00edlabas: "}<b>{r.unevalPhon}</b></div>}
          {r.unevalDisc>0&&<div>{"Discriminaci\u00f3n Auditiva: "}<b>{r.unevalDisc}</b></div>}
          {r.unevalRec>0&&<div>{"Reconocimiento Fonol\u00f3gico: "}<b>{r.unevalRec}</b></div>}
        </div>
      </div>}

      {renderProcSection()}

      <button onClick={function(){setShowDetail(!showDetail)}} style={{width:"100%",padding:"14px",background:showDetail?"#f1f5f9":"#5b21b6",color:showDetail?"#1e293b":"#fff",border:"1px solid #e2e8f0",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",marginTop:20,marginBottom:showDetail?0:20}}>
        {showDetail?"\u25b2 Ocultar detalle":"\u25bc Ver detalle de cada respuesta"}
      </button>

      {showDetail&&<div style={{marginTop:12}}>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
          <button onClick={function(){openDetailPdf(ev,sd)}} style={{background:"#059669",color:"#fff",border:"none",padding:"8px 18px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>{"\ud83d\udda8 Imprimir detalle"}</button>
        </div>
        <div style={{border:"1px solid #e2e8f0",borderRadius:8,overflow:"hidden",maxHeight:500,overflowY:"auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"120px 1fr 140px",background:"#5b21b6",color:"#fff",padding:"8px 12px",fontSize:12,fontWeight:600,position:"sticky",top:0}}>
            <span>{"Secci\u00f3n"}</span><span>{"\u00cdtem"}</span><span>{"Resultado"}</span>
          </div>
          {PEFF_SECTIONS.flatMap(function(sec){return sec.subsections.flatMap(function(sub){
            var rows = [];
            if(sub.fields) sub.fields.forEach(function(f){if(f.type==="select"){var v=sd[f.id]||"";rows.push({sec:sec.title.substring(0,20),item:f.label,val:v||"\u2014 Sin evaluar",ok:!!v})}});
            if(sub.items) sub.items.forEach(function(item){var v=sd[item.id]||"";var res=v==="ok"?"\u2714 Correcto":v==="D"?"D":v==="O"?"O":v==="S"?"S":"\u2014 Sin evaluar";rows.push({sec:"S\u00edlaba",item:item.word+" ("+item.target+")",val:res,ok:v==="ok"})});
            if(sub.discItems) sub.discItems.forEach(function(item){var v=sd[item.id]||"";rows.push({sec:"Discriminaci\u00f3n",item:item.pair,val:v==="correcto"?"\u2714":v==="incorrecto"?"\u2718":"\u2014 Sin evaluar",ok:v==="correcto"})});
            if(sub.recItems) sub.recItems.forEach(function(item){var v=sd[item.id]||"";rows.push({sec:"Reconocimiento",item:item.target,val:v==="reconoce"?"\u2714":v==="no"?"\u2718":"\u2014 Sin evaluar",ok:v==="reconoce"})});
            return rows;
          })}).map(function(row,i){
            return <div key={i} style={{display:"grid",gridTemplateColumns:"120px 1fr 140px",padding:"6px 12px",fontSize:12,borderTop:"1px solid #f1f5f9",background:row.ok?"#ecfdf5":row.val.indexOf("Sin")>=0?"#fffbeb":"#fef2f2"}}>
              <span style={{color:K.mt,fontSize:11}}>{row.sec}</span>
              <span>{row.item}</span>
              <span style={{fontWeight:600,color:row.ok?"#059669":row.val.indexOf("Sin")>=0?"#92400e":"#dc2626"}}>{row.val}</span>
            </div>;
          })}
        </div>
      </div>}

      <h3 style={{fontSize:16,fontWeight:700,color:"#5b21b6",marginBottom:10,marginTop:28}}>{"Observaciones Cl\u00ednicas"}</h3>
      <div style={{background:"#f8faf9",padding:18,borderRadius:10,fontSize:14,border:"1px solid #e2e8f0",lineHeight:1.7,minHeight:60}}>{ev.observaciones||"Sin observaciones."}</div>
    </div>
  </div>;
}
