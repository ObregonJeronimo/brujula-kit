// NewPEFF — Results view (RESULT_STEP)
import { ALL_PROCESSES } from "../data/peffProcesos.js";

var K = { mt: "#64748b" };

var sevDesc = {
  "Adecuado":"PCC = 100%: El ni\u00f1o/a produce correctamente todos los fonemas evaluados. No se observan dificultades articulatorias.",
  "Leve":"PCC 85\u201399%: Se observan errores articulatorios aislados que no comprometen significativamente la inteligibilidad del habla. Puede requerir seguimiento.",
  "Leve-Moderado":"PCC 65\u201384%: Se observan errores articulatorios m\u00faltiples que afectan parcialmente la inteligibilidad. Se recomienda evaluaci\u00f3n e intervenci\u00f3n fonoaudiol\u00f3gica.",
  "Moderado-Severo":"PCC 50\u201364%: Se observan errores articulatorios frecuentes que comprometen la inteligibilidad del habla. Se requiere intervenci\u00f3n fonoaudiol\u00f3gica.",
  "Severo":"PCC <50%: Se observan errores articulatorios generalizados que comprometen severamente la inteligibilidad. Se requiere intervenci\u00f3n fonoaudiol\u00f3gica intensiva."
};
var sevColor = {"Adecuado":"#059669","Leve":"#84cc16","Leve-Moderado":"#f59e0b","Moderado-Severo":"#ea580c","Severo":"#dc2626"};

function ResultCard(props){
  var title=props.title,desc=props.desc,ok=props.ok,total=props.total,evaluated=props.evaluated,pct=props.pct,color=props.color;
  return <div style={{background:"#f8faf9",borderRadius:12,padding:20,border:"1px solid #e2e8f0"}}>
    <div style={{fontSize:14,fontWeight:700,color:"#1e293b",marginBottom:4}}>{title}</div>
    <div style={{fontSize:11,color:K.mt,marginBottom:12,lineHeight:1.5}}>{desc}</div>
    <div style={{fontSize:36,fontWeight:700,color:color||"#7c3aed",textAlign:"center"}}>{ok}<span style={{fontSize:16,color:K.mt}}>{"/"}{total}</span></div>
    {pct!==undefined&&<div style={{textAlign:"center",fontSize:13,color:K.mt,marginTop:4}}>{pct}{"% correcto"}</div>}
    {evaluated!==undefined&&evaluated<total&&<div style={{textAlign:"center",fontSize:11,color:"#f59e0b",marginTop:4}}>{"("}{evaluated}{" evaluados de "}{total}{")"}</div>}
  </div>;
}

function renderProcResults(r, a, fa, data){
  var pa = r.procAnalysis;
  if(!pa||pa.total===0) return <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,padding:20,marginBottom:20}}>
    <div style={{fontSize:14,fontWeight:600,color:"#059669"}}>{"\u2713 No se registraron procesos fonologicos"}</div>
  </div>;
  var catNames2 = {sust:"Sustituciones",asim:"Asimilaciones",estr:"Estructuracion silabica"};
  var catColors2 = {sust:"#f59e0b",asim:"#7c3aed",estr:"#dc2626"};
  var ageExpected = pa.errors.filter(function(e){ return a>0 && e.expectedAge<a; });
  return <div style={{marginBottom:20}}>
    <h3 style={{fontSize:16,fontWeight:700,color:"#7c3aed",marginBottom:12}}>{"Procesos Fonologicos ("}{pa.total}{")"}</h3>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
      {Object.entries(catNames2).map(function(entry){
        var id=entry[0],name=entry[1]; var c=pa.byCategory[id]||0;
        return <div key={id} style={{background:"#f8faf9",borderRadius:10,padding:16,border:"2px solid "+(c>0?catColors2[id]:"#e2e8f0"),textAlign:"center"}}>
          <div style={{fontSize:28,fontWeight:700,color:c>0?catColors2[id]:"#cbd5e1"}}>{c}</div>
          <div style={{fontSize:11,color:K.mt,marginTop:2}}>{name}</div>
        </div>;
      })}
    </div>
    <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,overflow:"hidden",marginBottom:16}}>
      <div style={{background:"#f8faf9",padding:"10px 16px",fontSize:12,fontWeight:700,color:K.mt,display:"grid",gridTemplateColumns:"60px 80px 80px 1fr 1fr",gap:8}}>
        <span>Silaba</span><span>Producc.</span><span>Tipo</span><span>Proceso</span><span>Cat.</span>
      </div>
      {pa.errors.map(function(e,i){
        return <div key={i} style={{padding:"8px 16px",fontSize:13,display:"grid",gridTemplateColumns:"60px 80px 80px 1fr 1fr",gap:8,borderTop:"1px solid #f1f5f9",alignItems:"center",background:a>0&&e.expectedAge<a?"#fef2f2":"#fff"}}>
          <span style={{fontWeight:700,color:"#7c3aed"}}>{e.word}</span>
          <span style={{color:"#dc2626",fontWeight:600}}>{e.produccion||"\u2014"}</span>
          <span style={{fontSize:11}}>{data[e.itemId]||""}</span>
          <span style={{fontSize:12}}>{e.procesoName}</span>
          <span style={{fontSize:11,color:catColors2[e.category],fontWeight:600}}>{e.categoryTitle}</span>
        </div>;
      })}
    </div>
    {ageExpected.length>0&&<div style={{background:"#fef3c7",border:"1px solid #fde68a",borderRadius:10,padding:16,marginBottom:16}}>
      <div style={{fontSize:13,fontWeight:700,color:"#92400e",marginBottom:6}}>{"No esperados para "}{fa(a)}</div>
      <div style={{fontSize:12,color:"#78350f"}}>{ageExpected.map(function(e){return e.procesoName+" (esperable hasta "+fa(e.expectedAge)+")"}).filter(function(v,i,arr){return arr.indexOf(v)===i}).join("; ")}</div>
    </div>}
    {(function(){
      var sorted=Object.entries(pa.byProcess).sort(function(a,b){return b[1]-a[1]});
      if(sorted.length===0)return null;
      var top=sorted.slice(0,3).map(function(entry){var p=ALL_PROCESSES.find(function(x){return x.id===entry[0]});return(p?p.name:entry[0])+" ("+entry[1]+")"});
      return <div style={{background:"#ede9fe",borderRadius:10,padding:16}}>
        <div style={{fontSize:13,fontWeight:700,color:"#5b21b6",marginBottom:4}}>Predominantes</div>
        <div style={{fontSize:13,color:"#3b0764"}}>{top.join(", ")}</div>
      </div>;
    })()}
  </div>;
}

export default function NewPEFFResults({ r, pd, a, fa, data, obs, onObsChange, onBack, onSave }){
  var sc = sevColor[r.severity] || "#7c3aed";
  return <div>
    <h2 style={{fontSize:20,fontWeight:700,marginBottom:6,color:"#7c3aed"}}>{"Resultados PEFF \u2014 "}{pd.pN}</h2>
    <p style={{fontSize:12,color:K.mt,marginBottom:20}}>{"Edad: "}{fa(a)}{" \u00b7 Evaluacion: "}{pd.eD}{pd.dni ? " \u00b7 DNI: " + pd.dni : ""}</p>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:20}}>
      <ResultCard title="Produccion de Silabas" desc="Cantidad de silabas producidas correctamente por el ni\u00f1o/a al repetir los estimulos foneticos presentados." ok={r.silOk} total={r.silTotal} evaluated={r.silEval} pct={r.silPctEval} color={r.silPctEval>=85?"#059669":r.silPctEval>=50?"#f59e0b":"#dc2626"}/>
      <ResultCard title="Discriminacion Auditiva" desc="Capacidad del ni\u00f1o/a para diferenciar si dos palabras suenan igual o diferente (percepcion auditiva fonologica)." ok={r.discOk} total={r.discTotal} evaluated={r.discEval} pct={r.discPct} color={r.discPct>=85?"#059669":r.discPct>=50?"#f59e0b":"#dc2626"}/>
      <ResultCard title="Reconocimiento Fonologico" desc="Capacidad del ni\u00f1o/a para identificar la palabra correcta entre dos opciones cuando se le dice una palabra objetivo." ok={r.recOk} total={r.recTotal} evaluated={r.recEval} pct={r.recPct} color={r.recPct>=85?"#059669":r.recPct>=50?"#f59e0b":"#dc2626"}/>
    </div>

    <div style={{background:"linear-gradient(135deg,"+sc+"dd,"+sc+")",borderRadius:12,padding:24,color:"#fff",marginBottom:20}}>
      <div style={{fontSize:13,opacity:.8,marginBottom:4}}>{"Severidad \u2014 PCC (Percentage of Consonants Correct)"}</div>
      <div style={{display:"flex",alignItems:"baseline",gap:12,marginBottom:8}}>
        <div style={{fontSize:36,fontWeight:700}}>{r.severity}</div>
        <div style={{fontSize:22,fontWeight:600,opacity:.9}}>{"PCC: "}{r.pcc}{"%"}</div>
      </div>
      <div style={{fontSize:13,opacity:.9,lineHeight:1.6}}>{sevDesc[r.severity]}</div>
    </div>

    <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:10,padding:16,marginBottom:20,fontSize:12,color:"#0369a1",lineHeight:1.6}}>
      <strong>{"Clasificacion basada en PCC (Shriberg & Kwiatkowski, 1982):"}</strong><br/>
      {"Adecuado: PCC = 100% \u2014 produccion correcta de todos los fonemas evaluados"}<br/>
      {"Leve: PCC 85\u201399% \u2014 errores aislados, inteligibilidad conservada"}<br/>
      {"Leve-Moderado: PCC 65\u201384% \u2014 multiples errores, inteligibilidad parcialmente afectada"}<br/>
      {"Moderado-Severo: PCC 50\u201364% \u2014 errores frecuentes, inteligibilidad comprometida"}<br/>
      {"Severo: PCC <50% \u2014 errores generalizados, inteligibilidad severamente afectada"}<br/>
      <span style={{fontStyle:"italic",marginTop:6,display:"block"}}>{"El PCC es el indice estandar internacional para cuantificar la severidad de los trastornos de los sonidos del habla (Shriberg & Kwiatkowski, 1982). Se calcula como el porcentaje de fonemas producidos correctamente sobre el total evaluado."}</span>
    </div>

    {r.unevalTotal>0&&<div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:16,marginBottom:20}}>
      <div style={{fontSize:13,fontWeight:700,color:"#92400e",marginBottom:8}}>{"Items sin evaluar ("}{r.unevalTotal}{")"}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,fontSize:12,color:"#78350f"}}>
        {r.unevalSelects>0&&<div>{"Examen Clinico OFA / Coordinacion: "}<b>{r.unevalSelects}</b></div>}
        {r.unevalPhon>0&&<div>{"Produccion de Silabas: "}<b>{r.unevalPhon}</b></div>}
        {r.unevalDisc>0&&<div>{"Discriminacion Auditiva: "}<b>{r.unevalDisc}</b></div>}
        {r.unevalRec>0&&<div>{"Reconocimiento Fonologico: "}<b>{r.unevalRec}</b></div>}
      </div>
    </div>}

    {renderProcResults(r, a, fa, data)}

    <div style={{marginBottom:20}}>
      <label style={{fontSize:13,fontWeight:600,color:K.mt,display:"block",marginBottom:6}}>{"Observaciones clinicas"}</label>
      <textarea value={obs} onChange={onObsChange} rows={4} style={{width:"100%",padding:"12px 14px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,resize:"vertical",background:"#f8faf9"}} placeholder="Interpretacion profesional..."/>
    </div>
    <div style={{display:"flex",justifyContent:"space-between"}}>
      <button onClick={onBack} style={{background:"#f1f5f9",border:"none",padding:"10px 22px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{"\u2190 Atras"}</button>
      <button onClick={onSave} style={{background:"#7c3aed",color:"#fff",border:"none",padding:"12px 28px",borderRadius:8,fontSize:15,fontWeight:700,cursor:"pointer"}}>{"Guardar"}</button>
    </div>
  </div>;
}
