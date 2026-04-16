import "../styles/RptPEFF.css";
import { useState } from "react";
import { ALL_PROCESSES } from "../data/peffProcesos.js";
import { PEFF_SECTIONS } from "../data/peffSections.js";
import { openDetailPdf, openSummaryPdf } from "./RptPEFF_pdf.js";
import AIReportPanel from "./AIReportPanel.jsx";
import { ageLabel } from "../lib/fb.js";

var sevDesc = {
  "Adecuado":"El ni\u00f1o/a produce correctamente todos o casi todos los fonemas esperados para su edad.",
  "Leve":"Se observan errores articulatorios aislados que no comprometen significativamente la inteligibilidad del habla.",
  "Moderado":"Se observan m\u00faltiples errores articulatorios que afectan parcialmente la inteligibilidad.",
  "Moderado-Severo":"Se observan errores articulatorios frecuentes que comprometen la inteligibilidad del habla.",
  "Severo":"Se observan errores articulatorios generalizados que comprometen severamente la inteligibilidad."
};
var sevColor = {"Adecuado":"#059669","Leve":"#f59e0b","Moderado":"#ea580c","Moderado-Severo":"#dc2626","Severo":"#dc2626"};

export default function RptPEFF({ev,onD,therapistInfo}){
  var _cd = useState(false), cd = _cd[0], sCD = _cd[1];
  var _showTech = useState(false), showTech = _showTech[0], setShowTech = _showTech[1];
  var r = ev.resultados||{};
  var pa = r.procAnalysis||null;
  var catNames = {sust:"Sustituciones",asim:"Asimilaciones",estr:"Estructuraci\u00f3n sil\u00e1bica"};
  var catColors = {sust:"#f59e0b",asim:"#7c3aed",estr:"#dc2626"};
  var sd = ev.seccionData||{};
  var sev = r.severity||"\u2014";
  var sc = sevColor[sev]||"#7c3aed";

  var renderProcSection = function(){
    if(!pa||pa.total===0) return <div className="rpt-peff-proc-empty">
      <div className="rpt-peff-proc-empty-text">{"\u2713 Sin procesos fonol\u00f3gicos registrados"}</div>
    </div>;
    var ageExpected = pa.errors ? pa.errors.filter(function(e){return ev.edadMeses>0 && e.expectedAge<ev.edadMeses}) : [];
    return <div className="rpt-peff-proc">
      <h3 className="rpt-peff-proc-h3">{"Procesos Fonol\u00f3gicos ("+pa.total+")"}</h3>
      <div className="rpt-peff-cat-grid">
        {Object.entries(catNames).map(function(entry){
          var id=entry[0],name=entry[1]; var c=(pa.byCategory&&pa.byCategory[id])||0;
          var catStyle = c>0 ? { "--rpt-peff-cat-color": catColors[id] } : undefined;
          return <div key={id} className={"rpt-peff-cat"+(c>0?" is-active":"")} style={catStyle}>
            <div className="rpt-peff-cat-val">{c}</div>
            <div className="rpt-peff-cat-name">{name}</div>
          </div>;
        })}
      </div>
      {pa.errors&&pa.errors.length>0&&<div className="rpt-peff-proc-table">
        <div className="rpt-peff-proc-thead">
          <span>{"S\u00edlaba"}</span><span>{"Producc."}</span><span>{"Proceso"}</span><span>{"Cat."}</span>
        </div>
        {pa.errors.map(function(e,i){
          var isUnexpected = ev.edadMeses>0 && e.expectedAge<ev.edadMeses;
          var catStyle = { "--rpt-peff-proc-cat-color": catColors[e.category] };
          return <div key={i} className={"rpt-peff-proc-row"+(isUnexpected?" is-unexpected":"")}>
            <span className="rpt-peff-proc-sil">{e.word}</span>
            <span className="rpt-peff-proc-prod">{e.produccion||"\u2014"}</span>
            <span className="rpt-peff-proc-name">{e.procesoName}</span>
            <span className="rpt-peff-proc-cat" style={catStyle}>{e.categoryTitle}</span>
          </div>;
        })}
      </div>}
      {ageExpected.length>0&&<div className="rpt-peff-unexp">
        <div className="rpt-peff-unexp-title">{"\u26a0 No esperados ("+ageLabel(ev.edadMeses)+")"}</div>
        <div className="rpt-peff-unexp-text">{ageExpected.map(function(e){return e.procesoName+" (esperable hasta "+ageLabel(e.expectedAge)+")"}).filter(function(v,i,a){return a.indexOf(v)===i}).join("; ")}</div>
      </div>}
      {pa.byProcess&&(function(){
        var sorted = Object.entries(pa.byProcess).sort(function(a,b){return b[1]-a[1]});
        if(sorted.length===0) return null;
        var top = sorted.slice(0,3).map(function(entry){var p=ALL_PROCESSES.find(function(x){return x.id===entry[0]});return(p?p.name:entry[0])+" ("+entry[1]+")"});
        return <div className="rpt-peff-predom">
          <div className="rpt-peff-predom-title">{"Predominantes"}</div>
          <div className="rpt-peff-predom-text">{top.join(", ")}</div>
        </div>;
      })()}
    </div>;
  };

  var RC = function(props){
    var rcStyle = props.color ? { "--rpt-peff-rc-color": props.color } : undefined;
    return <div className="rpt-peff-rc" style={rcStyle}>
      <div className="rpt-peff-rc-title">{props.title}</div>
      <div className="rpt-peff-rc-desc">{props.desc}</div>
      <div className="rpt-peff-rc-val">{props.ok}<span className="rpt-peff-rc-frac">{"/"+props.total}</span></div>
      {props.pct!==undefined&&props.pct>0&&<div className="rpt-peff-rc-pct">{props.pct+"% correcto"}</div>}
    </div>;
  };

  var sevStyle = { "--rpt-peff-sev-color": sc, "--rpt-peff-sev-color-dd": sc+"dd" };

  return <div className="rpt-peff">
    <div className="rpt-peff-head">
      <div>
        <h1 className="rpt-peff-title">{"Informe PEFF"}</h1>
        <p className="rpt-peff-subtitle">{ev.paciente+" \u2014 "+ageLabel(ev.edadMeses)}</p>
      </div>
      <div className="rpt-peff-actions">
        {cd
          ?<div className="rpt-peff-del-confirm">
            <div className="rpt-peff-del-title">{"\u00bfEst\u00e1 seguro que desea eliminar?"}</div>
            <div className="rpt-peff-del-sub">{"Esta acci\u00f3n es irreversible"}</div>
            <div className="rpt-peff-del-actions">
              <button onClick={function(){onD(ev._fbId);sCD(false)}} className="rpt-peff-del-confirm-btn">{"S\u00ed, eliminar"}</button>
              <button onClick={function(){sCD(false)}} className="rpt-peff-del-cancel-btn">Cancelar</button>
            </div>
          </div>
          :<button onClick={function(){sCD(true)}} className="rpt-peff-del-btn">{"Eliminar"}</button>
        }
      </div>
    </div>

    {/* AI Report Panel */}
    <AIReportPanel ev={ev} evalType="peff" collectionName="evaluaciones" evalLabel="Protocolo Fonético-Fonológico" therapistInfo={therapistInfo} />

    {/* Technical Data Toggle */}
    <button onClick={function(){ setShowTech(!showTech); }} className={"rpt-peff-tech-toggle"+(showTech?" is-open":"")}>
      {showTech ? "\u25b2 Ocultar datos t\u00e9cnicos" : "\u25bc Ver datos t\u00e9cnicos de la evaluaci\u00f3n"}
    </button>

    {showTech && <div className="rpt-peff-tech">
      <div className="rpt-peff-pdf-row">
        <button onClick={function(){openSummaryPdf(ev)}} className="rpt-peff-pdf-btn">{"\ud83d\udcc4 PDF datos t\u00e9cnicos"}</button>
      </div>

      <div className="rpt-peff-scores">
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

      <div className="rpt-peff-sev" style={sevStyle}>
        <div className="rpt-peff-sev-lbl">{"Severidad del trastorno fon\u00e9tico-fonol\u00f3gico"}</div>
        <div className="rpt-peff-sev-val">{sev}</div>
        <div className="rpt-peff-sev-desc">{sevDesc[sev]||""}</div>
      </div>

      <div className="rpt-peff-note">
        <strong>{"\u2139\ufe0f Criterios de clasificaci\u00f3n:"}</strong><br/>
        {"Adecuado: \u226598% \u00b7 Leve: 85-97% \u00b7 Moderado: 65-84% \u00b7 Moderado-Severo: 50-64% \u00b7 Severo: <50%"}
      </div>

      {r.unevalTotal>0&&<div className="rpt-peff-uneval">
        <div className="rpt-peff-uneval-title">{"\u26a0 \u00cdtems sin evaluar ("+r.unevalTotal+")"}</div>
        <div className="rpt-peff-uneval-grid">
          {r.unevalSelects>0&&<div>{"Examen Cl\u00ednico OFA: "}<b>{r.unevalSelects}</b></div>}
          {r.unevalPhon>0&&<div>{"Producci\u00f3n de S\u00edlabas: "}<b>{r.unevalPhon}</b></div>}
          {r.unevalDisc>0&&<div>{"Discriminaci\u00f3n Auditiva: "}<b>{r.unevalDisc}</b></div>}
          {r.unevalRec>0&&<div>{"Reconocimiento Fonol\u00f3gico: "}<b>{r.unevalRec}</b></div>}
        </div>
      </div>}

      {renderProcSection()}

      <button onClick={function(){ var el=document.getElementById("peff-detail-toggle"); if(el) el.style.display=el.style.display==="none"?"block":"none"; }} className="rpt-peff-detail-toggle">
        {"\u25bc Ver detalle de cada respuesta"}
      </button>

      <div id="peff-detail-toggle" className="rpt-peff-detail-hidden">
        <div className="rpt-peff-detail-print-row">
          <button onClick={function(){openDetailPdf(ev,sd)}} className="rpt-peff-detail-print-btn">{"\ud83d\udda8 Imprimir detalle"}</button>
        </div>
        <div className="rpt-peff-detail-box">
          <div className="rpt-peff-detail-thead">
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
            var isNone = row.val.indexOf("Sin")>=0;
            var rowClass = row.ok ? "rpt-peff-detail-row--ok" : isNone ? "rpt-peff-detail-row--none" : "rpt-peff-detail-row--err";
            var resClass = row.ok ? "rpt-peff-detail-result--ok" : isNone ? "rpt-peff-detail-result--none" : "rpt-peff-detail-result--err";
            return <div key={i} className={"rpt-peff-detail-row "+rowClass}>
              <span className="rpt-peff-detail-sec">{row.sec}</span>
              <span>{row.item}</span>
              <span className={"rpt-peff-detail-result "+resClass}>{row.val}</span>
            </div>;
          })}
        </div>
      </div>

      <h3 className="rpt-peff-obs-h3">{"Observaciones Cl\u00ednicas"}</h3>
      <div className="rpt-peff-obs">{ev.observaciones||"Sin observaciones."}</div>
    </div>}
  </div>;
}
