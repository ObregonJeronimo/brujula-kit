// NewPEFF — Results view (RESULT_STEP)
import { ALL_PROCESSES } from "../data/peffProcesos.js";
import "../styles/NewPEFF_results.css";

var sevDesc = {
  "Adecuado":"PCC = 100%: El ni\u00f1o/a produce correctamente todos los fonemas evaluados. No se observan dificultades articulatorias.",
  "Leve":"PCC 85\u201399%: Se observan errores articulatorios aislados que no comprometen significativamente la inteligibilidad del habla. Puede requerir seguimiento.",
  "Leve-Moderado":"PCC 65\u201384%: Se observan errores articulatorios m\u00faltiples que afectan parcialmente la inteligibilidad. Se recomienda evaluaci\u00f3n e intervenci\u00f3n fonoaudiol\u00f3gica.",
  "Moderado-Severo":"PCC 50\u201364%: Se observan errores articulatorios frecuentes que comprometen la inteligibilidad del habla. Se requiere intervenci\u00f3n fonoaudiol\u00f3gica.",
  "Severo":"PCC <50%: Se observan errores articulatorios generalizados que comprometen severamente la inteligibilidad. Se requiere intervenci\u00f3n fonoaudiol\u00f3gica intensiva."
};
var sevColor = {"Adecuado":"#059669","Leve":"#84cc16","Leve-Moderado":"#f59e0b","Moderado-Severo":"#ea580c","Severo":"#dc2626"};
var sevColorSoft = {"Adecuado":"#059669dd","Leve":"#84cc16dd","Leve-Moderado":"#f59e0bdd","Moderado-Severo":"#ea580cdd","Severo":"#dc2626dd"};

function ResultCard(props){
  var title=props.title, desc=props.desc, ok=props.ok, total=props.total, evaluated=props.evaluated, pct=props.pct, color=props.color;
  var bigStyle = color ? { color: color } : undefined;
  return <div className="peffr-card">
    <div className="peffr-card-title">{title}</div>
    <div className="peffr-card-desc">{desc}</div>
    <div className="peffr-card-big" style={bigStyle}>{ok}<span className="peffr-card-big-total">{"/"}{total}</span></div>
    {pct !== undefined && <div className="peffr-card-pct">{pct}{"% correcto"}</div>}
    {evaluated !== undefined && evaluated < total && <div className="peffr-card-warn">{"("}{evaluated}{" evaluados de "}{total}{")"}</div>}
  </div>;
}

function renderProcResults(r, a, fa, data){
  var pa = r.procAnalysis;
  if(!pa || pa.total === 0) return <div className="peffr-proc-empty">
    <div className="peffr-proc-empty-text">{"\u2713 No se registraron procesos fonologicos"}</div>
  </div>;

  var catNames2 = { sust:"Sustituciones", asim:"Asimilaciones", estr:"Estructuracion silabica" };
  var catColors2 = { sust:"#f59e0b", asim:"#7c3aed", estr:"#dc2626" };
  var ageExpected = pa.errors.filter(function(e){ return a > 0 && e.expectedAge < a; });

  return <div className="peffr-proc-wrap">
    <h3 className="peffr-proc-title">{"Procesos Fonologicos ("}{pa.total}{")"}</h3>

    <div className="peffr-cat-grid">
      {Object.entries(catNames2).map(function(entry){
        var id = entry[0], name = entry[1];
        var c = pa.byCategory[id] || 0;
        var cardCls = "peffr-cat-card" + (c > 0 ? " peffr-cat-card--active" : "");
        var cardStyle = c > 0 ? { "--peffr-cat-color": catColors2[id] } : undefined;
        var numStyle = c > 0 ? { color: catColors2[id] } : undefined;
        return <div key={id} className={cardCls} style={cardStyle}>
          <div className={"peffr-cat-num" + (c > 0 ? "" : " peffr-cat-num--zero")} style={numStyle}>{c}</div>
          <div className="peffr-cat-label">{name}</div>
        </div>;
      })}
    </div>

    <div className="peffr-errors">
      <div className="peffr-errors-head">
        <span>Silaba</span><span>Producc.</span><span>Tipo</span><span>Proceso</span><span>Cat.</span>
      </div>
      {pa.errors.map(function(e, i){
        var unexpected = a > 0 && e.expectedAge < a;
        var catStyle = { color: catColors2[e.category] };
        return <div key={i} className={"peffr-errors-row" + (unexpected ? " peffr-errors-row--unexpected" : "")}>
          <span className="peffr-err-word">{e.word}</span>
          <span className="peffr-err-prod">{e.produccion || "\u2014"}</span>
          <span className="peffr-err-type">{data[e.itemId] || ""}</span>
          <span className="peffr-err-proc">{e.procesoName}</span>
          <span className="peffr-err-cat" style={catStyle}>{e.categoryTitle}</span>
        </div>;
      })}
    </div>

    {ageExpected.length > 0 && <div className="peffr-age-warn">
      <div className="peffr-age-warn-title">{"No esperados para "}{fa(a)}</div>
      <div className="peffr-age-warn-body">{ageExpected.map(function(e){ return e.procesoName + " (esperable hasta " + fa(e.expectedAge) + ")"; }).filter(function(v, i, arr){ return arr.indexOf(v) === i; }).join("; ")}</div>
    </div>}

    {(function(){
      var sorted = Object.entries(pa.byProcess).sort(function(a, b){ return b[1] - a[1]; });
      if(sorted.length === 0) return null;
      var top = sorted.slice(0, 3).map(function(entry){
        var p = ALL_PROCESSES.find(function(x){ return x.id === entry[0]; });
        return (p ? p.name : entry[0]) + " (" + entry[1] + ")";
      });
      return <div className="peffr-top">
        <div className="peffr-top-title">Predominantes</div>
        <div className="peffr-top-body">{top.join(", ")}</div>
      </div>;
    })()}
  </div>;
}

export default function NewPEFFResults({ r, pd, a, fa, data, obs, onObsChange, onBack, onSave }){
  var sc = sevColor[r.severity] || "#7c3aed";
  var scSoft = sevColorSoft[r.severity] || "#7c3aeddd";
  var sevStyle = { "--peffr-sev": sc, "--peffr-sev-soft": scSoft };

  return <div className="peffr">
    <h2 className="peffr-title">{"Resultados PEFF \u2014 "}{pd.pN}</h2>
    <p className="peffr-sub">{"Edad: "}{fa(a)}{" \u00b7 Evaluacion: "}{pd.eD}{pd.dni ? " \u00b7 DNI: " + pd.dni : ""}</p>

    <div className="peffr-cards">
      <ResultCard title="Produccion de Silabas" desc="Cantidad de silabas producidas correctamente por el ni\u00f1o/a al repetir los estimulos foneticos presentados." ok={r.silOk} total={r.silTotal} evaluated={r.silEval} pct={r.silPctEval} color={r.silPctEval>=85?"#059669":r.silPctEval>=50?"#f59e0b":"#dc2626"}/>
      <ResultCard title="Discriminacion Auditiva" desc="Capacidad del ni\u00f1o/a para diferenciar si dos palabras suenan igual o diferente (percepcion auditiva fonologica)." ok={r.discOk} total={r.discTotal} evaluated={r.discEval} pct={r.discPct} color={r.discPct>=85?"#059669":r.discPct>=50?"#f59e0b":"#dc2626"}/>
      <ResultCard title="Reconocimiento Fonologico" desc="Capacidad del ni\u00f1o/a para identificar la palabra correcta entre dos opciones cuando se le dice una palabra objetivo." ok={r.recOk} total={r.recTotal} evaluated={r.recEval} pct={r.recPct} color={r.recPct>=85?"#059669":r.recPct>=50?"#f59e0b":"#dc2626"}/>
    </div>

    <div className="peffr-severity" style={sevStyle}>
      <div className="peffr-severity-label">{"Severidad \u2014 PCC (Percentage of Consonants Correct)"}</div>
      <div className="peffr-severity-row">
        <div className="peffr-severity-value">{r.severity}</div>
        <div className="peffr-severity-pcc">{"PCC: "}{r.pcc}{"%"}</div>
      </div>
      <div className="peffr-severity-desc">{sevDesc[r.severity]}</div>
    </div>

    <div className="peffr-info">
      <strong>{"Clasificacion basada en PCC (Shriberg & Kwiatkowski, 1982):"}</strong><br/>
      {"Adecuado: PCC = 100% \u2014 produccion correcta de todos los fonemas evaluados"}<br/>
      {"Leve: PCC 85\u201399% \u2014 errores aislados, inteligibilidad conservada"}<br/>
      {"Leve-Moderado: PCC 65\u201384% \u2014 multiples errores, inteligibilidad parcialmente afectada"}<br/>
      {"Moderado-Severo: PCC 50\u201364% \u2014 errores frecuentes, inteligibilidad comprometida"}<br/>
      {"Severo: PCC <50% \u2014 errores generalizados, inteligibilidad severamente afectada"}<br/>
      <span className="peffr-info-note">{"El PCC es el indice estandar internacional para cuantificar la severidad de los trastornos de los sonidos del habla (Shriberg & Kwiatkowski, 1982). Se calcula como el porcentaje de fonemas producidos correctamente sobre el total evaluado."}</span>
    </div>

    {r.unevalTotal > 0 && <div className="peffr-uneval">
      <div className="peffr-uneval-title">{"Items sin evaluar ("}{r.unevalTotal}{")"}</div>
      <div className="peffr-uneval-grid">
        {r.unevalSelects > 0 && <div>{"Examen Clinico OFA / Coordinacion: "}<b>{r.unevalSelects}</b></div>}
        {r.unevalPhon > 0 && <div>{"Produccion de Silabas: "}<b>{r.unevalPhon}</b></div>}
        {r.unevalDisc > 0 && <div>{"Discriminacion Auditiva: "}<b>{r.unevalDisc}</b></div>}
        {r.unevalRec > 0 && <div>{"Reconocimiento Fonologico: "}<b>{r.unevalRec}</b></div>}
      </div>
    </div>}

    {renderProcResults(r, a, fa, data)}

    <div className="peffr-obs-wrap">
      <label className="peffr-obs-label">{"Observaciones clinicas"}</label>
      <textarea
        value={obs}
        onChange={onObsChange}
        rows={4}
        className="peffr-obs-textarea"
        placeholder="Interpretacion profesional..."
      />
    </div>

    <div className="peffr-nav">
      <button onClick={onBack} className="peffr-btn-back">{"\u2190 Atras"}</button>
      <button onClick={onSave} className="peffr-btn-save">{"Guardar"}</button>
    </div>
  </div>;
}
