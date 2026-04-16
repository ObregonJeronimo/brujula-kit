import "../styles/RptRECO.css";
import { useState, useRef } from "react";
import { RECO_GROUPS, computeRecoResults } from "../data/recoFonData.js";
import AIReportPanel from "./AIReportPanel.jsx";
import { ageLabel } from "../lib/fb.js";

export default function RptRECO({ ev, onD, therapistInfo }){
  var _cd = useState(false), cd = _cd[0], sCD = _cd[1];
  var _showTech = useState(false), showTech = _showTech[0], setShowTech = _showTech[1];
  var printRef = useRef(null);
  var rawResponses = ev.responses || {};

  // Recompute results from raw responses for consistency
  var res = computeRecoResults(rawResponses);

  var handlePDF = function(){
    if(!printRef.current) return;
    var w = window.open("","_blank");
    w.document.write("<html><head><title>RECO "+ev.paciente+"</title><style>body{font-family:system-ui,sans-serif;padding:20px;font-size:12px;color:#1e293b}table{width:100%;border-collapse:collapse}th,td{padding:5px 8px;border:1px solid #ddd;text-align:left;font-size:11px}th{background:#f1f5f9;font-weight:700}h3{margin:16px 0 8px}@media print{body{padding:0}}</style></head><body>");
    w.document.write(printRef.current.innerHTML);
    w.document.write("</body></html>");
    w.document.close();
    setTimeout(function(){ w.print(); }, 300);
  };

  var sevColor = res.severity==="Adecuado"?"#059669":res.severity==="Leve"?"#d97706":"#dc2626";
  var sevBg = res.severity==="Adecuado"?"#f0fdf4":res.severity==="Leve"?"#fffbeb":"#fef2f2";
  var sevStyle = { "--rpt-reco-sev-bg": sevBg, "--rpt-reco-sev-color": sevColor };

  return (
    <div className="rpt-reco">
      <div className="rpt-reco-head">
        <h1 className="rpt-reco-title">{"\ud83e\udde0 Reconocimiento Fonológico"}</h1>
        <div className="rpt-reco-actions">
          {cd
            ?<div className="rpt-reco-del-confirm">
              <div className="rpt-reco-del-title">{"¿Está seguro que desea eliminar?"}</div>
              <div className="rpt-reco-del-sub">{"Esta acción es irreversible"}</div>
              <div className="rpt-reco-del-actions">
                <button onClick={function(){onD(ev._fbId)}} className="rpt-reco-del-confirm-btn">{"Sí, eliminar"}</button>
                <button onClick={function(){sCD(false)}} className="rpt-reco-del-cancel-btn">Cancelar</button>
              </div>
            </div>
            :<button onClick={function(){sCD(true)}} className="rpt-reco-del-btn">{"Eliminar"}</button>
          }
        </div>
      </div>

      <AIReportPanel ev={ev} evalType="reco" collectionName="evaluaciones" evalLabel="Reconocimiento Fonológico" therapistInfo={therapistInfo} />

      <button onClick={function(){ setShowTech(!showTech); }} className={"rpt-reco-tech-toggle"+(showTech?" is-open":"")}>
        {showTech ? "\u25b2 Ocultar datos técnicos" : "\u25bc Ver datos técnicos de la evaluación"}
      </button>

      {showTech && <div ref={printRef} className="rpt-reco-tech">
        <div className="rpt-reco-pdf-row">
          <button onClick={handlePDF} className="rpt-reco-pdf-btn">{"\ud83d\udcc4 PDF datos técnicos"}</button>
        </div>
        <div className="rpt-reco-meta">
          <div>
            <div className="rpt-reco-meta-eyebrow">{"Reconocimiento Fonológico"}</div>
            <div className="rpt-reco-meta-name">{ev.paciente}</div>
            <div className="rpt-reco-meta-sub">{"DNI: "+(ev.pacienteDni||"N/A")+" · Edad: "+ageLabel(ev.edadMeses||0)}</div>
            {ev.derivadoPor && <div className="rpt-reco-meta-line">{"Derivado por: "+ev.derivadoPor}</div>}
          </div>
          <div className="rpt-reco-meta-right">
            <div className="rpt-reco-meta-line">{"Fecha: "+ev.fechaEvaluacion}</div>
            {ev.evaluador && <div className="rpt-reco-meta-line">{"Evaluador: "+ev.evaluador}</div>}
          </div>
        </div>

        {/* Summary cards */}
        <div className="rpt-reco-stats" style={sevStyle}>
          <div className="rpt-reco-stat rpt-reco-stat--pct">
            <div className="rpt-reco-stat-big">{res.pct+"%"}</div>
            <div className="rpt-reco-stat-lbl">{"Aciertos globales"}</div>
          </div>
          <div className="rpt-reco-stat rpt-reco-stat--sev">
            <div className="rpt-reco-stat-md rpt-reco-stat-md--sev">{res.severity||"-"}</div>
            <div className="rpt-reco-stat-lbl">{"Severidad"}</div>
          </div>
          <div className="rpt-reco-stat rpt-reco-stat--correct">
            <div className="rpt-reco-stat-md rpt-reco-stat-md--correct">{res.correct+"/"+res.total}</div>
            <div className="rpt-reco-stat-lbl">{"Contrastes reconocidos"}</div>
          </div>
        </div>

        {/* Detail table */}
        <h3 className="rpt-reco-h3">{"Detalle por grupo de contraste"}</h3>
        <table className="rpt-reco-table">
          <thead><tr>
            <th className="rpt-reco-th-gr">{"Gr."}</th>
            <th className="rpt-reco-th-left">{"Tipo de contraste"}</th>
            <th className="rpt-reco-th-lam">{"Lám."}</th>
            <th className="rpt-reco-th-left">{"Par de palabras"}</th>
            <th className="rpt-reco-th-word">{"Palabra dicha"}</th>
            <th className="rpt-reco-th-word">{"Señaló"}</th>
            <th className="rpt-reco-th-res">{"Resultado"}</th>
          </tr></thead>
          <tbody>
            {RECO_GROUPS.map(function(group){
              return group.items.map(function(item, idx){
                var r = rawResponses[item.lam];
                var hasResponse = r && r.objetivo && r.seleccion;
                var isCorrect = hasResponse && r.objetivo === r.seleccion;
                var palabraObjetivo = hasResponse ? (r.objetivo === "w1" ? item.w1 : item.w2) : null;
                var palabraSeleccion = hasResponse ? (r.seleccion === "w1" ? item.w1 : item.w2) : null;
                var rowClass = !hasResponse ? "is-warn-row" : isCorrect ? "is-ok-row" : "is-err-row";
                return <tr key={item.lam} className={rowClass}>
                  {idx === 0 && <td rowSpan={group.items.length} className="rpt-reco-td-group">{group.id}</td>}
                  {idx === 0 && <td rowSpan={group.items.length} className="rpt-reco-td-left rpt-reco-td-group-label">{group.label}</td>}
                  <td className="rpt-reco-td-lam">{item.lam}</td>
                  <td className="rpt-reco-td-left rpt-reco-td-pair">{item.w1+" / "+item.w2}</td>
                  <td className="rpt-reco-word">{palabraObjetivo ? <span className="rpt-reco-word-val">{"\""+palabraObjetivo+"\""}</span> : <span className="rpt-reco-word-empty">-</span>}</td>
                  <td className="rpt-reco-word">{palabraSeleccion ? <span className="rpt-reco-word-val">{"\""+palabraSeleccion+"\""}</span> : <span className="rpt-reco-word-empty">-</span>}</td>
                  <td>
                    {!hasResponse && <span className="rpt-reco-res rpt-reco-res--none">{"Sin resp."}</span>}
                    {hasResponse && isCorrect && <span className="rpt-reco-res rpt-reco-res--ok">{"\u2714 Correcto"}</span>}
                    {hasResponse && !isCorrect && <span className="rpt-reco-res rpt-reco-res--err">{"\u2718 Error"}</span>}
                  </td>
                </tr>;
              });
            })}
          </tbody>
        </table>

        {/* Group summary */}
        {res.groupResults && <div className="rpt-reco-groups">
          <h3 className="rpt-reco-h3 rpt-reco-h3--accent">{"Resumen por grupo"}</h3>
          <div className="rpt-reco-groups-grid">
            {res.groupResults.map(function(g){
              var isOk = g.correct === g.total && g.total > 0;
              return <div key={g.id} className={"rpt-reco-group"+(isOk?" is-ok":"")}>
                <div>
                  <span className="rpt-reco-group-id">{g.id}</span>
                  <span className="rpt-reco-group-label">{g.label}</span>
                </div>
                <span className="rpt-reco-group-count">{g.correct+"/"+g.total}</span>
              </div>;
            })}
          </div>
        </div>}

        {/* Error details */}
        {res.errorGroups && res.errorGroups.length > 0 && <div className="rpt-reco-err-block">
          <h3 className="rpt-reco-h3 rpt-reco-h3--err">{"\u26a0 Grupos con dificultades"}</h3>
          {res.errorGroups.map(function(g){
            var failedItems = g.items.filter(function(it){ return it.reconoce === false; });
            return <div key={g.id} className="rpt-reco-err-group">
              <div className="rpt-reco-err-group-title">{g.id+" - "+g.label}</div>
              {failedItems.map(function(it){
                return <div key={it.lam} className="rpt-reco-err-item">{"Lám. "+it.lam+": Se dijo \""+it.palabraObjetivo+"\" — Señaló \""+it.palabraSeleccionada+"\""}</div>;
              })}
            </div>;
          })}
        </div>}

        {res.errorGroups && res.errorGroups.length === 0 && <div className="rpt-reco-all-ok">
          <span className="rpt-reco-all-ok-icon">{"\u2705"}</span>
          <p className="rpt-reco-all-ok-text">{"Reconocimiento fonológico adecuado."}</p>
        </div>}

        <div className="rpt-reco-criteria">
          <strong>{"\u2139\ufe0f Criterios de clasificación:"}</strong><br/>
          {"Adecuado: \u226595% \u00b7 Leve: 80-94% \u00b7 Moderado: 60-79% \u00b7 Severo: <60%"}
        </div>

        {ev.observaciones && <div className="rpt-reco-obs">
          <strong className="rpt-reco-obs-label">Observaciones:</strong>
          <p className="rpt-reco-obs-text">{ev.observaciones}</p>
        </div>}

        <div className="rpt-reco-foot">
          {"Brújula KIT — Reconocimiento Fonológico — Generado el "+new Date().toLocaleDateString("es-AR")}
        </div>
      </div>}
    </div>
  );
}
