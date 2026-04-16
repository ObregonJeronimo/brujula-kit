import "../styles/RptELDI.css";
import { useState } from "react";
import { REC, EXP } from "../data/eldiItems.js";
import { calcScoring, fa, noEvalGrouped } from "./NewELDI_scoring.js";
import { openDetailPdf, openSummaryPdf } from "./RptELDI_pdf.js";
import AIReportPanel from "./AIReportPanel.jsx";

export default function RptELDI({ev,onD,therapistInfo}){
  var _cd = useState(false), cd = _cd[0], sCD = _cd[1];
  var _showTech = useState(false), showTech = _showTech[0], setShowTech = _showTech[1];
  var rsp = ev.respuestas || {};
  var ageMo = ev.edadMeses || 0;

  var recScoring = ev.evalRec!==false ? calcScoring(REC,rsp,ageMo) : null;
  var expScoring = ev.evalExp!==false ? calcScoring(EXP,rsp,ageMo) : null;

  var recRes = ev.evalRec!==false ? Object.assign({label:"Comprensi\u00f3n Auditiva",evaluated:true},recScoring||{}) :
    {label:"Comprensi\u00f3n Auditiva",evaluated:false,logrado:0,noLogrado:0,noEvaluado:REC.map(function(i){return i.id}),total:55};
  var expRes = ev.evalExp!==false ? Object.assign({label:"Comunicaci\u00f3n Expresiva",evaluated:true},expScoring||{}) :
    {label:"Comunicaci\u00f3n Expresiva",evaluated:false,logrado:0,noLogrado:0,noEvaluado:EXP.map(function(i){return i.id}),total:55};
  var allNoEval = [].concat(recRes.evaluated?(recRes.noEvaluado||[]):[]).concat(expRes.evaluated?(expRes.noEvaluado||[]):[]);

  var renderClassification = function(sc,label){
    if(!sc||sc.pctExpected===null||sc.evaluados===0) return null;
    var classStyle = { "--rpt-eldi-class-color": sc.classColor };
    return <div className="rpt-eldi-class" style={classStyle}>
      <div className="rpt-eldi-class-title">{"\ud83c\udfaf An\u00e1lisis Criterial \u2014 "+label}</div>
      <div className="rpt-eldi-class-grid">
        <div className="rpt-eldi-class-card">
          <div className="rpt-eldi-class-lbl">{"Rendimiento seg\u00fan edad"}</div>
          <div className="rpt-eldi-class-val">{sc.pctExpected+"%"}</div>
          <div className="rpt-eldi-class-sub">{"("+sc.logradoExpected+"/"+sc.expectedCount+" \u00edtems esperados logrados)"}</div>
        </div>
        <div className="rpt-eldi-class-card">
          <div className="rpt-eldi-class-lbl">{"Clasificaci\u00f3n"}</div>
          <div className="rpt-eldi-class-val--md">{sc.classification}</div>
        </div>
        {sc.devAgeLabel&&<div className="rpt-eldi-class-card rpt-eldi-class-card--full">
          <div className="rpt-eldi-class-lbl">{"Edad de desarrollo estimada"}</div>
          <div className="rpt-eldi-class-val--dev">{sc.devAgeLabel}</div>
          <div className="rpt-eldi-class-sub">{"(banda m\u00e1xima con \u226580% de \u00edtems logrados)"}</div>
        </div>}
      </div>
    </div>;
  };

  var renderNoEval = function(noEvalIds,items){
    if(!noEvalIds||noEvalIds.length===0) return null;
    var groups = noEvalGrouped(noEvalIds,items);
    return <div className="rpt-eldi-noeval">
      <div className="rpt-eldi-noeval-title">{"\u00cdtems no evaluados:"}</div>
      {Object.entries(groups).map(function(e){return <div key={e[0]} className="rpt-eldi-noeval-group">
        <div className="rpt-eldi-noeval-group-lbl">{"Edad "+e[0]+":"}</div>
        {e[1].map(function(it){return <div key={it.id} className="rpt-eldi-noeval-item">{"\u2022 "+it.l+" ("+it.id+")"}</div>})}
      </div>})}
    </div>;
  };

  var renderArea = function(area,items,icon){
    if(!area||!area.evaluated) return <div className="rpt-eldi-area rpt-eldi-area--inactive">
      <div className="rpt-eldi-area-title">{icon+" "+(area?area.label:"\u2014")}</div>
      <div className="rpt-eldi-area-inactive-msg">{"No evaluado en esta sesi\u00f3n"}</div>
    </div>;
    var barColor = area.pctLogrado>=80?"var(--c-success)":area.pctLogrado>=50?"var(--c-warning)":"var(--c-error)";
    var barStyle = { "--rpt-eldi-bar-pct": area.pctLogrado+"%", "--rpt-eldi-bar-color": barColor };
    return <div className="rpt-eldi-area">
      <div className="rpt-eldi-area-title">{icon+" "+area.label}</div>
      <div className="rpt-eldi-area-stats">
        <div>
          <div className="rpt-eldi-area-stat-lbl">{"\u00cdtems logrados"}</div>
          <div className="rpt-eldi-area-stat-val rpt-eldi-area-stat-val--ok">{area.logrado}<span className="rpt-eldi-area-stat-fraction">{"/"+area.total}</span></div>
        </div>
        <div>
          <div className="rpt-eldi-area-stat-lbl">{"No logrados"}</div>
          <div className="rpt-eldi-area-stat-val rpt-eldi-area-stat-val--err">{area.noLogrado}</div>
        </div>
        <div>
          <div className="rpt-eldi-area-stat-lbl">{"Sin evaluar"}</div>
          <div className="rpt-eldi-area-stat-val rpt-eldi-area-stat-val--warn">{(area.noEvaluado||[]).length}</div>
        </div>
      </div>
      {area.evaluados>0&&<div className="rpt-eldi-area-bar-wrap">
        <div className="rpt-eldi-area-bar-lbl">{"% logro (sobre evaluados)"}</div>
        <div className="rpt-eldi-area-bar" style={barStyle}>
          <div className="rpt-eldi-area-bar-fill"/>
          <span className="rpt-eldi-area-bar-pct">{area.pctLogrado+"%"}</span>
        </div>
      </div>}
      {renderNoEval(area.noEvaluado,items)}
    </div>;
  };

  var renderDetailView = function(){
    var mkTable = function(items,label,icon,evaluated){
      if(evaluated===false) return <div className="rpt-eldi-detail-section">
        <h3 className="rpt-eldi-detail-h3">{icon+" "+label}</h3>
        <div className="rpt-eldi-detail-empty">{"No evaluado"}</div>
      </div>;
      return <div className="rpt-eldi-detail-section">
        <h3 className="rpt-eldi-detail-h3">{icon+" "+label}</h3>
        <div className="rpt-eldi-detail-table">
          <div className="rpt-eldi-detail-thead">
            <span>{"ID"}</span><span>{"\u00cdtem"}</span><span>{"Resultado"}</span>
          </div>
          {items.map(function(item){
            var v=rsp[item.id];
            var rowClass = v===true?"rpt-eldi-detail-row--ok":v===false?"rpt-eldi-detail-row--err":"rpt-eldi-detail-row--none";
            var resClass = v===true?"rpt-eldi-detail-result--ok":v===false?"rpt-eldi-detail-result--err":"rpt-eldi-detail-result--none";
            return <div key={item.id} className={"rpt-eldi-detail-row "+rowClass}>
              <span className="rpt-eldi-detail-id">{item.id}</span>
              <span>{item.l}</span>
              <span className={"rpt-eldi-detail-result "+resClass}>{v===true?"\u2714 Logrado":v===false?"\u2718 No logrado":"\u2014 Sin evaluar"}</span>
            </div>;
          })}
        </div>
      </div>;
    };
    return <div className="rpt-eldi-detail-wrap">
      <div className="rpt-eldi-detail-head">
        <h3 className="rpt-eldi-detail-title">{"Detalle de Respuestas"}</h3>
        <button onClick={function(){openDetailPdf(ev,rsp)}} className="rpt-eldi-detail-print-btn">{"\ud83d\udda8 Imprimir detalle"}</button>
      </div>
      {mkTable(REC,"Comprensi\u00f3n Auditiva","\ud83d\udd0a",ev.evalRec)}
      {mkTable(EXP,"Comunicaci\u00f3n Expresiva","\ud83d\udde3\ufe0f",ev.evalExp)}
    </div>;
  };

  return <div className="rpt-eldi">
    <div className="rpt-eldi-head">
      <div>
        <h1 className="rpt-eldi-title">{"Informe ELDI"}</h1>
        <p className="rpt-eldi-subtitle">{ev.paciente+" \u2014 "+fa(ev.edadMeses)}</p>
      </div>
      <div className="rpt-eldi-actions">
        {cd
          ?<div className="rpt-eldi-del-confirm">
            <div className="rpt-eldi-del-title">{"\u00bfEst\u00e1 seguro que desea eliminar?"}</div>
            <div className="rpt-eldi-del-sub">{"Esta acci\u00f3n es irreversible"}</div>
            <div className="rpt-eldi-del-actions">
              <button onClick={function(){onD(ev._fbId,"evaluaciones");sCD(false)}} className="rpt-eldi-del-confirm-btn">{"S\u00ed, eliminar"}</button>
              <button onClick={function(){sCD(false)}} className="rpt-eldi-del-cancel-btn">Cancelar</button>
            </div>
          </div>
          :<button onClick={function(){sCD(true)}} className="rpt-eldi-del-btn">{"Eliminar"}</button>
        }
      </div>
    </div>

    {/* AI Report Panel */}
    <AIReportPanel ev={ev} evalType="eldi" collectionName="evaluaciones" evalLabel="Evaluación del Lenguaje (ELDI)" therapistInfo={therapistInfo} />

    {/* Technical Data Toggle */}
    <button onClick={function(){ setShowTech(!showTech); }} className={"rpt-eldi-tech-toggle"+(showTech?" is-open":"")}>
      {showTech ? "\u25b2 Ocultar datos t\u00e9cnicos" : "\u25bc Ver datos t\u00e9cnicos de la evaluaci\u00f3n"}
    </button>

    {showTech && <div className="rpt-eldi-tech">
      <div className="rpt-eldi-pdf-row">
        <button onClick={function(){openSummaryPdf(ev,recScoring,expScoring,recRes,expRes,allNoEval)}} className="rpt-eldi-pdf-btn">{"\ud83d\udcc4 PDF datos t\u00e9cnicos"}</button>
      </div>
      <h3 className="rpt-eldi-h2">{"Datos del Paciente"}</h3>
      <div className="rpt-eldi-patient-grid">{[["Nombre",ev.paciente],["Edad",fa(ev.edadMeses)],["F. nacimiento",ev.fechaNacimiento],["F. evaluaci\u00f3n",ev.fechaEvaluacion],["Establecimiento",ev.establecimiento||"\u2014"],["Derivado por",ev.derivadoPor||"\u2014"],["Evaluador",ev.evaluador||"\u2014"]].map(function(pair,i){return <div key={i} className="rpt-eldi-patient-field"><div className="rpt-eldi-patient-label">{pair[0]}</div><div className="rpt-eldi-patient-value">{pair[1]}</div></div>})}</div>

      <h3 className="rpt-eldi-h2">{"An\u00e1lisis Criterial"}</h3>
      {renderClassification(recScoring,"Comprensi\u00f3n Auditiva")}
      {renderClassification(expScoring,"Comunicaci\u00f3n Expresiva")}
      <div className="rpt-eldi-note">
        <strong>{"\u2139\ufe0f Nota:"}</strong>{" La clasificaci\u00f3n se basa en un an\u00e1lisis criterial (comparaci\u00f3n con hitos esperados por edad), no en baremos normativos. Cortes: \u226590% Normal, 75-89% En Riesgo, 50-74% Retraso Moderado, <50% Retraso Significativo."}
      </div>

      <h3 className="rpt-eldi-h2">{"Resultados \u2014 Puntajes Brutos"}</h3>
      {renderArea(recRes,REC,"\ud83d\udd0a")}
      {renderArea(expRes,EXP,"\ud83d\udde3\ufe0f")}

      <div className="rpt-eldi-hero">
        <div className="rpt-eldi-hero-lbl">{"Resumen"}</div>
        <div className="rpt-eldi-hero-stats">
          {recRes.evaluated&&<div><span className="rpt-eldi-hero-big">{recRes.logrado}</span><span className="rpt-eldi-hero-small">{"/"+(recRes.evaluados||recRes.total)+" Receptivo"}</span></div>}
          {expRes.evaluated&&<div><span className="rpt-eldi-hero-big">{expRes.logrado}</span><span className="rpt-eldi-hero-small">{"/"+(expRes.evaluados||expRes.total)+" Expresivo"}</span></div>}
        </div>
        {allNoEval.length>0&&<div className="rpt-eldi-hero-warn">{"\u26a0 "+allNoEval.length+" \u00edtems sin evaluar \u2014 parcial"}</div>}
      </div>

      <button onClick={function(){ var el=document.getElementById("eldi-detail-toggle"); if(el) el.style.display=el.style.display==="none"?"block":"none"; }} className="rpt-eldi-detail-toggle">{"\u25bc Ver detalle de cada respuesta"}</button>
      <div id="eldi-detail-toggle" className="rpt-eldi-detail-hidden">{renderDetailView()}</div>

      <h3 className="rpt-eldi-h2 rpt-eldi-h2--spaced">{"Observaciones Cl\u00ednicas"}</h3>
      <div className="rpt-eldi-obs">{ev.observaciones||"Sin observaciones."}</div>
    </div>}
  </div>;
}
