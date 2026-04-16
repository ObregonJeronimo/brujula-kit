import "../styles/RptREP.css";
import { useState, useRef } from "react";
import AIReportPanel from "./AIReportPanel.jsx";
import { ageLabel } from "../lib/fb.js";
var posLabels = {ISPP:"ISPP",ISIP:"ISIP",CSIP:"CSIP",CSFP:"CSFP"};
var posFull = {ISPP:"Inicio síl. — Pos. palabra",ISIP:"Inicio síl. — Int. palabra",CSIP:"Coda síl. — Int. palabra",CSFP:"Coda síl. — Final palabra"};

export default function RptREP({ ev, onD, therapistInfo }){
  var _cf = useState(false), confirmDel = _cf[0], sCf = _cf[1];
  var _showTech = useState(false), showTech = _showTech[0], setShowTech = _showTech[1];
  var printRef = useRef(null);
  var res = ev.resultados || {};
  var byPhoneme = res.byPhoneme || {};
  var byCat = res.byCat || {};
  var byPosition = res.byPosition || {};
  var errorList = res.errorList || [];
  var patientAge = ev.edadMeses || 0;

  var handlePDF = function(){
    if(!printRef.current) return;
    var w = window.open("","_blank");
    w.document.write("<html><head><title>REP "+ev.paciente+"</title><style>body{font-family:system-ui,sans-serif;padding:20px;font-size:12px;color:#1e293b}table{width:100%;border-collapse:collapse}th,td{padding:5px 8px;border:1px solid #ddd;text-align:left;font-size:11px}th{background:#f1f5f9;font-weight:700}h3{margin:16px 0 8px}@media print{body{padding:0}}</style></head><body>");
    w.document.write(printRef.current.innerHTML);
    w.document.write("</body></html>");
    w.document.close();
    setTimeout(function(){ w.print(); }, 300);
  };

  var sevColor = res.pcc===100?"#059669":res.pcc>=85?"#059669":res.pcc>=65?"#d97706":"#dc2626";
  var sevBg = res.pcc===100?"#f0fdf4":res.pcc>=85?"#f0fdf4":res.pcc>=65?"#fffbeb":"#fef2f2";
  var sevStyle = { "--rpt-rep-sev-bg": sevBg, "--rpt-rep-sev-color": sevColor };

  var posPctClass = function(p, pct){
    if(p.total===0) return "";
    if(pct>=85) return "rpt-rep-pos-pct--ok";
    if(pct>=65) return "rpt-rep-pos-pct--warn";
    return "rpt-rep-pos-pct--err";
  };

  var pctBadgeClass = function(pct){
    if(pct>=85) return "rpt-rep-pct-badge--ok";
    if(pct>=65) return "rpt-rep-pct-badge--warn";
    return "rpt-rep-pct-badge--err";
  };

  return (
    <div className="rpt-rep">
      {/* HEADER */}
      <div className="rpt-rep-head">
        <h1 className="rpt-rep-title">{"\ud83d\udcdd Rep. Palabras"}</h1>
        <div className="rpt-rep-actions">
          {confirmDel
            ?<div className="rpt-rep-del-confirm">
              <div className="rpt-rep-del-title">{"¿Está seguro que desea eliminar?"}</div>
              <div className="rpt-rep-del-sub">{"Esta acción es irreversible"}</div>
              <div className="rpt-rep-del-actions">
                <button onClick={function(){onD(ev._fbId)}} className="rpt-rep-del-confirm-btn">{"Sí, eliminar"}</button>
                <button onClick={function(){sCf(false)}} className="rpt-rep-del-cancel-btn">Cancelar</button>
              </div>
            </div>
            :<button onClick={function(){sCf(true)}} className="rpt-rep-del-btn">{"Eliminar"}</button>
          }
        </div>
      </div>

      {/* AI REPORT (auto-generates) */}
      <AIReportPanel ev={ev} evalType="rep" collectionName="evaluaciones" evalLabel="Repetición de Palabras" therapistInfo={therapistInfo} />

      {/* TECHNICAL DATA TOGGLE */}
      <button onClick={function(){ setShowTech(!showTech); }} className={"rpt-rep-tech-toggle"+(showTech?" is-open":"")}>
        {showTech ? "\u25b2 Ocultar datos técnicos" : "\u25bc Ver datos técnicos de la evaluación"}
      </button>

      {/* TECHNICAL DETAILS */}
      {showTech && <div ref={printRef} className="rpt-rep-tech">
        <div className="rpt-rep-pdf-row">
          <button onClick={handlePDF} className="rpt-rep-pdf-btn">{"\ud83d\udcc4 PDF datos técnicos"}</button>
        </div>
        <div className="rpt-rep-meta">
          <div>
            <div className="rpt-rep-meta-eyebrow">{"Repetición de Palabras"}</div>
            <div className="rpt-rep-meta-name">{ev.paciente}</div>
            <div className="rpt-rep-meta-sub">{"DNI: "+(ev.pacienteDni||"N/A")+" · Edad: "+ageLabel(patientAge)}</div>
            {ev.derivadoPor && <div className="rpt-rep-meta-line">{"Derivado por: "+ev.derivadoPor}</div>}
          </div>
          <div className="rpt-rep-meta-right">
            <div className="rpt-rep-meta-line">{"Fecha: "+ev.fechaEvaluacion}</div>
            {ev.evaluador && <div className="rpt-rep-meta-line">{"Evaluador: "+ev.evaluador}</div>}
          </div>
        </div>

        <div className="rpt-rep-stats" style={sevStyle}>
          <div className="rpt-rep-stat rpt-rep-stat--pcc">
            <div className="rpt-rep-stat-big">{(res.pcc||0)+"%"}</div>
            <div className="rpt-rep-stat-lbl">PCC</div>
          </div>
          <div className="rpt-rep-stat rpt-rep-stat--sev">
            <div className="rpt-rep-stat-md rpt-rep-stat-md--sev">{res.severity||"-"}</div>
            <div className="rpt-rep-stat-lbl">Severidad</div>
          </div>
          <div className="rpt-rep-stat rpt-rep-stat--correct">
            <div className="rpt-rep-stat-md rpt-rep-stat-md--correct">{(res.totalCorrect||0)+"/"+(res.totalEvaluated||0)}</div>
            <div className="rpt-rep-stat-lbl">Correctos</div>
            <div className="rpt-rep-stat-extra">{(res.totalErrors||0)+" errores"}</div>
          </div>
        </div>

        <h3 className="rpt-rep-h3">{"Distribución por posición"}</h3>
        <div className="rpt-rep-pos-grid">
          {["ISPP","ISIP","CSIP","CSFP"].map(function(posId){
            var p = byPosition[posId] || {ok:0,err:0,total:0};
            var pct = p.total > 0 ? Math.round((p.ok/p.total)*100) : 0;
            return <div key={posId} className="rpt-rep-pos">
              <div className="rpt-rep-pos-code">{posLabels[posId]}</div>
              <div className="rpt-rep-pos-full">{posFull[posId]}</div>
              {p.total > 0
                ? <div>
                    <div className={"rpt-rep-pos-pct "+posPctClass(p,pct)}>{pct+"%"}</div>
                    <div className="rpt-rep-pos-fraction">{p.ok+"/"+p.total}</div>
                  </div>
                : <div className="rpt-rep-pos-empty">{"Sin ítems"}</div>}
            </div>;
          })}
        </div>

        <h3 className="rpt-rep-h3">{"Resumen por categoría"}</h3>
        <table className="rpt-rep-table rpt-rep-table--cat">
          <thead><tr>
            <th className="rpt-rep-th-left">{"Categoría"}</th>
            <th>{"\u2713"}</th>
            <th>Errores</th>
            <th>Total</th>
            <th>%</th>
          </tr></thead>
          <tbody>
            {Object.values(byCat).map(function(c){
              var pct = c.total > 0 ? Math.round((c.ok/c.total)*100) : 0;
              return <tr key={c.title}>
                <td className="rpt-rep-td-left rpt-rep-td-cat">{c.title}</td>
                <td className="rpt-rep-td-ok">{c.ok}</td>
                <td className={c.errors>0?"rpt-rep-td-err":"rpt-rep-td-neutral"}>{c.errors}</td>
                <td>{c.total}</td>
                <td><span className={"rpt-rep-pct-badge "+pctBadgeClass(pct)}>{pct+"%"}</span></td>
              </tr>;
            })}
          </tbody>
        </table>

        <h3 className="rpt-rep-h3">{"Detalle por fonema"}</h3>
        <table className="rpt-rep-table rpt-rep-table--ph">
          <thead><tr>
            <th className="rpt-rep-th-left">Fonema</th>
            <th>Edad</th>
            <th className="rpt-rep-th--ok">{"\u2713"}</th>
            <th className="rpt-rep-th--err">Err.</th>
            <th>Total</th>
            <th>Estado</th>
          </tr></thead>
          <tbody>
            {Object.entries(byPhoneme).map(function(e){
              var id = e[0], ph = e[1];
              var hasErr = ph.errors > 0;
              var expected = (patientAge/12) >= ph.age;
              var rowClass = hasErr && expected ? "is-err-row" : "";
              return <tr key={id} className={rowClass}>
                <td className="rpt-rep-td-left rpt-rep-ph-name">{ph.phoneme}</td>
                <td>{ph.age+"a"}</td>
                <td className="rpt-rep-td-ok">{ph.ok||"-"}</td>
                <td className={ph.errors>0?"rpt-rep-td-err":"rpt-rep-td-muted"}>{ph.errors||"-"}</td>
                <td>{ph.total}</td>
                <td>
                  {hasErr&&expected&&<span className="rpt-rep-status rpt-rep-status--alt">ALTERADO</span>}
                  {hasErr&&!expected&&<span className="rpt-rep-status rpt-rep-status--dev">EN DESARROLLO</span>}
                  {!hasErr&&<span className="rpt-rep-status rpt-rep-status--ok">ADECUADO</span>}
                </td>
              </tr>;
            })}
          </tbody>
        </table>

        {errorList.length > 0 && <div className="rpt-rep-err-block">
          <h3 className="rpt-rep-h3 rpt-rep-h3--err">{"\u26a0 Detalle de errores ("+errorList.length+")"}</h3>
          <table className="rpt-rep-table rpt-rep-table--err">
            <thead><tr className="is-err">
              <th className="rpt-rep-th-left">Fonema</th>
              <th className="rpt-rep-th-left">Palabra</th>
              <th>Pos.</th>
              <th className="rpt-rep-th-left">{"Producción"}</th>
            </tr></thead>
            <tbody>
              {errorList.map(function(err,i){
                var expected = (patientAge/12) >= err.age;
                return <tr key={i} className={expected?"is-err-row":"is-warn-row"}>
                  <td className="rpt-rep-td-phoneme-err">{err.phoneme}</td>
                  <td className="rpt-rep-td-left">{err.word}</td>
                  <td className="rpt-rep-td-pos">{err.posId}</td>
                  <td className="rpt-rep-td-prod">{err.produccion}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>}

        {(function(){
          var alt = Object.entries(byPhoneme).filter(function(e){ var ph=e[1]; return ph.errors>0&&(patientAge/12)>=ph.age; });
          if(alt.length===0) return <div className="rpt-rep-all-ok">
            <span className="rpt-rep-all-ok-icon">{"\u2705"}</span>
            <p className="rpt-rep-all-ok-text">{"Todos los fonemas esperados están adecuados."}</p>
          </div>;
          return <div className="rpt-rep-alt">
            <h3 className="rpt-rep-alt-title">{"\u26a0 Fonemas alterados (esperados para la edad)"}</h3>
            <div className="rpt-rep-alt-list">
              {alt.map(function(e){ var ph=e[1];
                return <div key={e[0]} className="rpt-rep-alt-chip">
                  <span className="rpt-rep-alt-chip-ph">{ph.phoneme}</span>
                  <span className="rpt-rep-alt-chip-count">{ph.errors+" err."}</span>
                  {ph.errorWords && ph.errorWords.length>0 && <div className="rpt-rep-alt-chip-words">
                    {ph.errorWords.map(function(ew){return ew.word+"\u2192"+ew.produccion}).join(", ")}
                  </div>}
                </div>;
              })}
            </div>
          </div>;
        })()}

        {ev.observaciones && <div className="rpt-rep-obs">
          <strong className="rpt-rep-obs-label">Observaciones:</strong>
          <p className="rpt-rep-obs-text">{ev.observaciones}</p>
        </div>}

        <div className="rpt-rep-foot">
          {"Brújula KIT — Repetición de Palabras — Generado el "+new Date().toLocaleDateString("es-AR")}
        </div>
      </div>}
    </div>
  );
}
