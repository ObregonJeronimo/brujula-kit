// RptGeneric — generic report viewer for evaluations without specific Rpt components
import { useState } from "react";
import AIReportPanel from "./AIReportPanel.jsx";
import { ageLabel } from "../lib/fb.js";
import { getEvalType } from "../config/evalTypes.js";
import "../styles/RptGeneric.css";

export default function RptGeneric({ ev, onD, therapistInfo }) {
  var _showTech = useState(false), showTech = _showTech[0], setShowTech = _showTech[1];
  var evalConfig = getEvalType(ev.tipo);
  var label = evalConfig ? evalConfig.fullName : (ev.tipo || "").toUpperCase();
  var icon = evalConfig ? evalConfig.icon : "";

  return <div className="rpt-gen">
    <div className="rpt-gen-head">
      <div className="rpt-gen-title-wrap">
        <span className="rpt-gen-icon">{icon}</span>
        <h2 className="rpt-gen-title">{label}</h2>
      </div>
      {onD && <button onClick={function(){if(window.confirm("Eliminar esta evaluacion?")) onD(ev._fbId||ev.id)}} className="rpt-gen-del-btn">Eliminar</button>}
    </div>

    <AIReportPanel
      ev={ev}
      evalType={ev.tipo}
      collectionName="evaluaciones"
      evalLabel={label} therapistInfo={therapistInfo}
    />

    <button onClick={function(){setShowTech(!showTech)}} className={"rpt-gen-tech-toggle"+(showTech?" is-open":"")}>{showTech ? "Ocultar datos tecnicos" : "Ver datos tecnicos de la evaluacion"}</button>

    {showTech && <div className="rpt-gen-tech">
      <div className="rpt-gen-tech-grid">
        <div><div className="rpt-gen-tech-label">Paciente</div><div className="rpt-gen-tech-value">{ev.paciente}</div></div>
        <div><div className="rpt-gen-tech-label">DNI</div><div className="rpt-gen-tech-value--plain">{ev.pacienteDni || "N/A"}</div></div>
        <div><div className="rpt-gen-tech-label">Edad</div><div className="rpt-gen-tech-value--plain">{ageLabel(ev.edadMeses||0)}</div></div>
        <div><div className="rpt-gen-tech-label">Fecha</div><div className="rpt-gen-tech-value--plain">{ev.fechaEvaluacion || ""}</div></div>
      </div>
      {ev.resultados && <div>
        <div className="rpt-gen-tech-results-label">Resultados</div>
        <pre className="rpt-gen-tech-results-pre">{JSON.stringify(ev.resultados, null, 2)}</pre>
      </div>}
    </div>}
  </div>;
}
