import "../styles/RptDISC.css";
import { useState, useRef } from "react";
import { DISC_PAIRS } from "../data/discFonData.js";
import AIReportPanel from "./AIReportPanel.jsx";
import { ageLabel } from "../lib/fb.js";

export default function RptDISC({ ev, onD, therapistInfo }){
  var _cd = useState(false), cd = _cd[0], sCD = _cd[1];
  var _showTech = useState(false), showTech = _showTech[0], setShowTech = _showTech[1];
  var printRef = useRef(null);
  var res = ev.resultados || {};
  var responses = ev.responses || {};
  var obsMap = ev.obsMap || {};

  var handlePDF = function(){
    if(!printRef.current) return;
    var w = window.open("","_blank");
    w.document.write("<html><head><title>DISC "+ev.paciente+"</title><style>body{font-family:system-ui,sans-serif;padding:20px;font-size:12px;color:#1e293b}table{width:100%;border-collapse:collapse}th,td{padding:5px 8px;border:1px solid #ddd;text-align:left;font-size:11px}th{background:#f1f5f9;font-weight:700}h3{margin:16px 0 8px}@media print{body{padding:0}}</style></head><body>");
    w.document.write(printRef.current.innerHTML);
    w.document.write("</body></html>");
    w.document.close();
    setTimeout(function(){ w.print(); }, 300);
  };

  var sevColor = res.severity==="Adecuado"?"#059669":res.severity==="Leve"?"#d97706":"#dc2626";
  var sevBg = res.severity==="Adecuado"?"#f0fdf4":res.severity==="Leve"?"#fffbeb":"#fef2f2";
  var sevStyle = { "--rpt-disc-sev-bg": sevBg, "--rpt-disc-sev-color": sevColor };

  var keyClass = function(k){
    if(k==="I") return "rpt-disc-td-key--i";
    if(k==="D") return "rpt-disc-td-key--d";
    return "rpt-disc-td-key--none";
  };

  return (
    <div className="rpt-disc">
      <div className="rpt-disc-head">
        <h1 className="rpt-disc-title">{"\ud83d\udc42 Discriminación Fonológica"}</h1>
        <div className="rpt-disc-actions">
          {cd
            ?<div className="rpt-disc-del-confirm">
              <div className="rpt-disc-del-title">{"¿Está seguro que desea eliminar?"}</div>
              <div className="rpt-disc-del-sub">{"Esta acción es irreversible"}</div>
              <div className="rpt-disc-del-actions">
                <button onClick={function(){onD(ev._fbId)}} className="rpt-disc-del-confirm-btn">{"Sí, eliminar"}</button>
                <button onClick={function(){sCD(false)}} className="rpt-disc-del-cancel-btn">Cancelar</button>
              </div>
            </div>
            :<button onClick={function(){sCD(true)}} className="rpt-disc-del-btn">{"Eliminar"}</button>
          }
        </div>
      </div>

      {/* AI Report Panel */}
      <AIReportPanel ev={ev} evalType="disc" collectionName="evaluaciones" evalLabel="Discriminación Fonológica" therapistInfo={therapistInfo} />

      {/* Technical Data Toggle */}
      <button onClick={function(){ setShowTech(!showTech); }} className={"rpt-disc-tech-toggle"+(showTech?" is-open":"")}>
        {showTech ? "\u25b2 Ocultar datos técnicos" : "\u25bc Ver datos técnicos de la evaluación"}
      </button>

      {showTech && <div ref={printRef} className="rpt-disc-tech">
        <div className="rpt-disc-pdf-row">
          <button onClick={handlePDF} className="rpt-disc-pdf-btn">{"\ud83d\udcc4 PDF datos técnicos"}</button>
        </div>
        {/* Patient info */}
        <div className="rpt-disc-meta">
          <div>
            <div className="rpt-disc-meta-eyebrow">{"Discriminación Fonológica"}</div>
            <div className="rpt-disc-meta-name">{ev.paciente}</div>
            <div className="rpt-disc-meta-sub">{"DNI: "+(ev.pacienteDni||"N/A")+" · Edad: "+ageLabel(ev.edadMeses||0)}</div>
            {ev.derivadoPor && <div className="rpt-disc-meta-line">{"Derivado por: "+ev.derivadoPor}</div>}
          </div>
          <div className="rpt-disc-meta-right">
            <div className="rpt-disc-meta-line">{"Fecha: "+ev.fechaEvaluacion}</div>
            {ev.evaluador && <div className="rpt-disc-meta-line">{"Evaluador: "+ev.evaluador}</div>}
          </div>
        </div>

        {/* Summary cards */}
        <div className="rpt-disc-stats" style={sevStyle}>
          <div className="rpt-disc-stat rpt-disc-stat--pct">
            <div className="rpt-disc-stat-big">{(res.pct||0)+"%"}</div>
            <div className="rpt-disc-stat-lbl">{"Aciertos"}</div>
          </div>
          <div className="rpt-disc-stat rpt-disc-stat--sev">
            <div className="rpt-disc-stat-md rpt-disc-stat-md--sev">{res.severity||"-"}</div>
            <div className="rpt-disc-stat-lbl">{"Severidad"}</div>
          </div>
          <div className="rpt-disc-stat rpt-disc-stat--correct">
            <div className="rpt-disc-stat-md rpt-disc-stat-md--correct">{(res.correct||0)+"/"+(res.evaluated||0)}</div>
            <div className="rpt-disc-stat-lbl">{"Correctos"}</div>
            <div className="rpt-disc-stat-extra">{(res.incorrect||0)+" errores"}</div>
          </div>
        </div>

        {/* Full detail table */}
        <h3 className="rpt-disc-h3">{"Detalle de respuestas"}</h3>
        <table className="rpt-disc-table rpt-disc-table--main">
          <thead><tr>
            <th className="rpt-disc-th-n">{"N°"}</th>
            <th className="rpt-disc-th-left">{"Oposición"}</th>
            <th className="rpt-disc-th-clave">{"Clave"}</th>
            <th className="rpt-disc-th-resp">{"Resp."}</th>
            <th className="rpt-disc-th-res">{"Resultado"}</th>
            <th className="rpt-disc-th-left">{"Obs."}</th>
          </tr></thead>
          <tbody>
            {DISC_PAIRS.map(function(pair){
              var r = responses[pair.id];
              var isCorrect = r === pair.clave;
              var isIncorrect = r !== undefined && r !== pair.clave;
              var noResp = r === undefined;
              var rowClass = noResp ? "is-warn-row" : isCorrect ? "is-ok-row" : "is-err-row";
              return <tr key={pair.id} className={rowClass}>
                <td className="rpt-disc-td-num">{pair.id}</td>
                <td className="rpt-disc-td-left rpt-disc-td-pair">{pair.word1+" — "+pair.word2}</td>
                <td className={"rpt-disc-td-key "+keyClass(pair.clave)}>{pair.clave}</td>
                <td className={"rpt-disc-td-key "+keyClass(r)}>{r||"\u2014"}</td>
                <td>
                  {noResp && <span className="rpt-disc-res rpt-disc-res--none">{"Sin resp."}</span>}
                  {isCorrect && <span className="rpt-disc-res rpt-disc-res--ok">{"\u2714"}</span>}
                  {isIncorrect && <span className="rpt-disc-res rpt-disc-res--err">{"\u2718"}</span>}
                </td>
                <td className="rpt-disc-td-left rpt-disc-td-obs">{obsMap[pair.id]||""}</td>
              </tr>;
            })}
          </tbody>
        </table>

        {/* Error analysis */}
        {res.errors && res.errors.length > 0 && <div className="rpt-disc-err-block">
          <h3 className="rpt-disc-h3 rpt-disc-h3--err">{"\u26a0 Análisis de errores ("+res.errors.length+")"}</h3>
          <table className="rpt-disc-table rpt-disc-table--errs">
            <thead><tr className="is-err">
              <th className="rpt-disc-th-left">{"Par"}</th>
              <th>{"Clave"}</th>
              <th>{"Resp."}</th>
              <th className="rpt-disc-th-left">{"Contraste"}</th>
            </tr></thead>
            <tbody>
              {res.errors.map(function(e){
                return <tr key={e.id}>
                  <td className="rpt-disc-td-left rpt-disc-td-pair-strong">{e.word1+" — "+e.word2}</td>
                  <td className="rpt-disc-td-key">{e.clave}</td>
                  <td className="rpt-disc-td-resp-err">{e.respuesta}</td>
                  <td className="rpt-disc-td-left rpt-disc-td-contrast">{e.contrast ? e.contrast.f1+" vs "+e.contrast.f2+" ("+e.contrast.desc+")" : "\u2014"}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>}

        {/* Perceptive-phonological profile */}
        {res.errorsByContrast && Object.keys(res.errorsByContrast).length > 0 && <div className="rpt-disc-profile">
          <h3 className="rpt-disc-h3 rpt-disc-h3--purple">{"Perfil perceptivo-fonológico"}</h3>
          <div className="rpt-disc-profile-list">
            {Object.entries(res.errorsByContrast).map(function(entry){
              var key=entry[0], data=entry[1];
              return <div key={key} className="rpt-disc-profile-chip">
                <span className="rpt-disc-profile-chip-key">{key}</span>
                <span className="rpt-disc-profile-chip-count">{data.pairs.length+" error"+(data.pairs.length>1?"es":"")}</span>
              </div>;
            })}
          </div>
        </div>}

        {res.errors && res.errors.length === 0 && <div className="rpt-disc-all-ok">
          <span className="rpt-disc-all-ok-icon">{"\u2705"}</span>
          <p className="rpt-disc-all-ok-text">{"Discriminación fonológica adecuada."}</p>
        </div>}

        {/* Clinical interpretation */}
        <div className="rpt-disc-criteria">
          <strong>{"\u2139\ufe0f Criterios de clasificación:"}</strong><br/>
          {"Adecuado: \u226595% \u00b7 Leve: 80-94% \u00b7 Moderado: 60-79% \u00b7 Severo: <60%"}
        </div>

        {ev.observaciones && <div className="rpt-disc-obs">
          <strong className="rpt-disc-obs-label">Observaciones:</strong>
          <p className="rpt-disc-obs-text">{ev.observaciones}</p>
        </div>}

        <div className="rpt-disc-foot">
          {"Brújula KIT — Discriminación Fonológica — Generado el "+new Date().toLocaleDateString("es-AR")}
        </div>
      </div>}
    </div>
  );
}
