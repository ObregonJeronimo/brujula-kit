import { useState } from "react";
import { ALL_PROCESSES, PF_CATEGORIES } from "../data/peffProcesos.js";
import { PEFF_SECTIONS } from "../data/peffSections.js";
const K = { mt: "#64748b" };
const fa=m=>`${Math.floor(m/12)} a\u00f1os, ${m%12} meses`;

const sevDesc={
  "Adecuado":"El ni\u00f1o/a produce correctamente todos o casi todos los fonemas esperados para su edad.",
  "Leve":"Se observan errores articulatorios aislados que no comprometen significativamente la inteligibilidad del habla.",
  "Moderado":"Se observan m\u00faltiples errores articulatorios que afectan parcialmente la inteligibilidad.",
  "Moderado-Severo":"Se observan errores articulatorios frecuentes que comprometen la inteligibilidad del habla.",
  "Severo":"Se observan errores articulatorios generalizados que comprometen severamente la inteligibilidad."
};
const sevColor={"Adecuado":"#059669","Leve":"#f59e0b","Moderado":"#ea580c","Moderado-Severo":"#dc2626","Severo":"#dc2626"};

export default function RptPEFF({ev,isA,onD}){
  const[cd,sCD]=useState(false);
  const[showDetail,setShowDetail]=useState(false);
  const r=ev.resultados||{};
  const pa=r.procAnalysis||null;
  const catNames={sust:"Sustituciones",asim:"Asimilaciones",estr:"Estructuraci\u00f3n sil\u00e1bica"};
  const catColors={sust:"#f59e0b",asim:"#7c3aed",estr:"#dc2626"};
  const sd=ev.seccionData||{};
  const sev=r.severity||"\u2014";
  const sc=sevColor[sev]||"#7c3aed";

  const detailPdf=()=>{const w=window.open("","_blank");if(!w)return;
    const mkFieldRows=()=>{let html="";PEFF_SECTIONS.forEach(sec=>{sec.subsections.forEach(sub=>{if(sub.fields){sub.fields.forEach(f=>{if(f.type==="select"){const v=sd[f.id]||"";const bg=v?"#ecfdf5":"#fffbeb";const clr=v?"#059669":"#92400e";html+=`<tr style="background:${bg}"><td>${sec.title}</td><td>${f.label}</td><td style="color:${clr};font-weight:600">${v||"\u2014 Sin evaluar"}</td></tr>`;}});}if(sub.items){sub.items.forEach(item=>{const v=sd[item.id]||"";const res=v==="ok"?"\u2714 Correcto":v==="D"?"D \u2014 Distorsi\u00f3n":v==="O"?"O \u2014 Omisi\u00f3n":v==="S"?"S \u2014 Sustituci\u00f3n":"\u2014 Sin evaluar";const bg=v==="ok"?"#ecfdf5":v?"#fef2f2":"#fffbeb";const clr=v==="ok"?"#059669":v?"#dc2626":"#92400e";html+=`<tr style="background:${bg}"><td>S\u00edlaba</td><td style="font-weight:700;color:#7c3aed">${item.word} <span style="font-weight:400;color:#64748b">(${item.target})</span></td><td style="color:${clr};font-weight:600">${res}</td></tr>`;});}if(sub.discItems){sub.discItems.forEach(item=>{const v=sd[item.id]||"";const res=v==="correcto"?"\u2714 Correcto":v==="incorrecto"?"\u2718 Incorrecto":"\u2014 Sin evaluar";const bg=v==="correcto"?"#ecfdf5":v?"#fef2f2":"#fffbeb";const clr=v==="correcto"?"#059669":v?"#dc2626":"#92400e";html+=`<tr style="background:${bg}"><td>Discriminaci\u00f3n</td><td>${item.pair}</td><td style="color:${clr};font-weight:600">${res}</td></tr>`;});}if(sub.recItems){sub.recItems.forEach(item=>{const v=sd[item.id]||"";const res=v==="reconoce"?"\u2714 Reconoce":v==="no"?"\u2718 No reconoce":"\u2014 Sin evaluar";const bg=v==="reconoce"?"#ecfdf5":v?"#fef2f2":"#fffbeb";const clr=v==="reconoce"?"#059669":v?"#dc2626":"#92400e";html+=`<tr style="background:${bg}"><td>Reconocimiento</td><td>${item.target} (${item.contrast})</td><td style="color:${clr};font-weight:600">${res}</td></tr>`;});}});});return html;};
    w.document.write(`<!DOCTYPE html><html><head><title>PEFF Detalle ${ev.paciente}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:sans-serif;color:#1e293b;padding:24px 36px;max-width:900px;margin:0 auto;line-height:1.5}h1{font-size:22px;color:#5b21b6;border-bottom:3px solid #7c3aed;padding-bottom:8px;margin-bottom:18px}table{width:100%;border-collapse:collapse;margin:8px 0 20px}th,td{border:1px solid #e2e8f0;padding:8px 12px;font-size:12px;text-align:left}th{background:#5b21b6;color:white}@media print{body{padding:12px}}</style></head><body>`);
    w.document.write(`<div style="text-align:center;margin-bottom:28px"><h1 style="border:none;font-size:24px">INFORME DETALLADO PEFF</h1><p style="color:#64748b;font-size:13px">${ev.paciente} \u2014 ${fa(ev.edadMeses)} \u2014 ${ev.fechaEvaluacion}</p></div>`);
    w.document.write(`<table><tr><th>Secci\u00f3n</th><th>\u00cdtem</th><th>Resultado</th></tr>${mkFieldRows()}</table>`);
    w.document.write(`</body></html>`);w.document.close();setTimeout(()=>w.print(),500);};

  const pdf=()=>{const w=window.open("","_blank");if(!w)return;
    const ofaFields=[["Labios postura",sd.lab_postura],["Labios simetr\u00eda",sd.lab_simetria],["Tonicidad",sd.lab_tonicidad],["ATM postura",sd.atm_postura],["ATM apertura",sd.atm_apertura],["Lengua postura",sd.len_postura],["Lengua tama\u00f1o",sd.len_tamano],["Frenillo lingual",sd.len_frenillo],["Dentici\u00f3n",sd.die_denticion],["Angle Der.",sd.die_angle_der],["Angle Izq.",sd.die_angle_izq],["Mordida",sd.die_mordida],["Paladar altura",sd.pal_altura],["Paladar integridad",sd.pal_integridad],["Velo simetr\u00eda",sd.vel_simetria],["\u00davula",sd.vel_uvula],["Escape nasal",sd.vel_escape]].filter(([,v])=>v);
    const ofaHTML=ofaFields.map(([l,v])=>`<tr><td style="text-align:left;font-weight:600">${l}</td><td>${v}</td></tr>`).join("");

    /* Process errors for PDF */
    let procHTML="";
    if(pa&&pa.total>0&&pa.errors){
      procHTML=`<h2>Procesos Fonol\u00f3gicos (${pa.total})</h2><table><tr><th>S\u00edlaba</th><th>Producci\u00f3n</th><th>Proceso</th><th>Categor\u00eda</th></tr>`;
      pa.errors.forEach(e=>{procHTML+=`<tr><td style="font-weight:700;color:#7c3aed">${e.word}</td><td style="color:#dc2626">${e.produccion||"\u2014"}</td><td>${e.procesoName}</td><td>${e.categoryTitle}</td></tr>`;});
      procHTML+=`</table>`;
    }

    const silPctEval=r.silEval>0?Math.round((r.silOk||0)/(r.silEval)*100):r.silPct||0;
    const discPctEval=r.discEval>0?Math.round((r.discOk||0)/(r.discEval)*100):0;
    const recPctEval=r.recEval>0?Math.round((r.recOk||0)/(r.recEval)*100):0;

    w.document.write(`<!DOCTYPE html><html><head><title>PEFF ${ev.paciente}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:sans-serif;color:#1e293b;padding:24px 36px;max-width:800px;margin:0 auto;line-height:1.5}h1{font-size:22px;color:#5b21b6;border-bottom:3px solid #7c3aed;padding-bottom:8px;margin-bottom:18px}h2{font-size:14px;color:#5b21b6;margin:16px 0 8px;text-transform:uppercase}table{width:100%;border-collapse:collapse;margin:8px 0}th,td{border:1px solid #e2e8f0;padding:8px 12px;font-size:13px}th{background:#5b21b6;color:white}.res{background:#ede9fe;padding:16px;border-radius:8px;margin:8px 0;font-size:13px;line-height:1.7}.ob{background:#f8faf9;padding:10px;border-radius:6px;border:1px solid #e2e8f0;font-size:13px;min-height:40px;margin:8px 0}.ft{margin-top:20px;border-top:1px solid #e2e8f0;padding-top:20px;display:flex;justify-content:space-between}.sg{text-align:center;width:44%}.sg .ln{border-top:1px solid #1e293b;margin-top:30px;padding-top:4px;font-size:12px}.sev{padding:16px;border-radius:8px;margin:12px 0;color:white;font-size:14px}.crit{background:#f0f9ff;border:1px solid #bae6fd;padding:12px;border-radius:8px;margin:12px 0;font-size:11px;color:#0369a1;line-height:1.6}@media print{body{padding:12px}}</style></head><body>`);
    w.document.write(`<div style="text-align:center;margin-bottom:28px"><h1 style="border:none;font-size:24px">INFORME PEFF</h1><p style="color:#64748b;font-size:13px">Br\u00fajula KIT \u2014 Protocolo de Evaluaci\u00f3n Fon\u00e9tico-Fonol\u00f3gica</p></div>`);
    w.document.write(`<h2>1. Identificaci\u00f3n del Paciente</h2><table><tr><th>Nombre</th><td>${ev.paciente}</td><th>Edad</th><td>${fa(ev.edadMeses)}</td></tr><tr><th>F. Nacimiento</th><td>${ev.fechaNacimiento}</td><th>F. Evaluaci\u00f3n</th><td>${ev.fechaEvaluacion}</td></tr>${ev.establecimiento?`<tr><th>Establecimiento</th><td>${ev.establecimiento}</td><th>Derivado por</th><td>${ev.derivadoPor||"\u2014"}</td></tr>`:""}</table>`);
    w.document.write(`<h2>2. Examen Cl\u00ednico OFA</h2><table><tr><th>Estructura</th><th>Hallazgo</th></tr>${ofaHTML||"<tr><td colspan=2>\u2014 Sin hallazgos registrados</td></tr>"}</table>`);

    /* Descriptive results */
    w.document.write(`<h2>3. Resultados de la Evaluaci\u00f3n</h2><div class="res">
      <strong>Producci\u00f3n de S\u00edlabas:</strong> ${r.silOk||0} de ${r.silTotal||0} s\u00edlabas producidas correctamente (${silPctEval}%)<br>
      <em style="color:#64748b;font-size:12px">Cantidad de s\u00edlabas que el ni\u00f1o/a produce correctamente al repetir los est\u00edmulos fon\u00e9ticos.</em><br><br>
      <strong>Discriminaci\u00f3n Auditiva:</strong> ${r.discOk||0} de ${r.discTotal||0} pares discriminados correctamente (${discPctEval}%)<br>
      <em style="color:#64748b;font-size:12px">Capacidad para diferenciar si dos palabras suenan igual o diferente.</em><br><br>
      <strong>Reconocimiento Fonol\u00f3gico:</strong> ${r.recOk||0} de ${r.recTotal||0} palabras reconocidas correctamente (${recPctEval}%)<br>
      <em style="color:#64748b;font-size:12px">Capacidad para identificar la palabra correcta entre dos opciones fonol\u00f3gicamente similares.</em>
    </div>`);

    w.document.write(`<h2>4. Severidad</h2><div class="sev" style="background:${sc}">${sev}</div><p style="font-size:12px;color:#64748b;margin:6px 0 12px;line-height:1.5">${sevDesc[sev]||""}</p>`);
    w.document.write(`<div class="crit"><strong>\u2139\ufe0f Criterios de clasificaci\u00f3n:</strong><br>Adecuado: \u226598% \u00b7 Leve: 85-97% \u00b7 Moderado: 65-84% \u00b7 Moderado-Severo: 50-64% \u00b7 Severo: <50%<br>La severidad se calcula sobre el total de s\u00edlabas del protocolo.</div>`);

    if(procHTML) w.document.write(procHTML);

    if(r.unevalTotal>0)w.document.write(`<div style="background:#fffbeb;border:1px solid #fde68a;padding:12px;border-radius:6px;margin:12px 0;font-size:12px;color:#78350f"><strong>\u26a0 ${r.unevalTotal} \u00edtems sin evaluar:</strong> ${r.unevalSelects>0?`Examen Cl\u00ednico OFA/Coordinaci\u00f3n: ${r.unevalSelects}. `:""}${r.unevalPhon>0?`Producci\u00f3n de S\u00edlabas: ${r.unevalPhon}. `:""}${r.unevalDisc>0?`Discriminaci\u00f3n: ${r.unevalDisc}. `:""}${r.unevalRec>0?`Reconocimiento: ${r.unevalRec}.`:""}</div>`);

    w.document.write(`<h2>5. Observaciones Cl\u00ednicas</h2><div class="ob">${ev.observaciones||"Sin observaciones."}</div>`);
    w.document.write(`<div class="ft"><div class="sg"><div class="ln">Firma Profesional</div></div><div class="sg"><div class="ln">Fecha</div><p style="font-size:11px">${new Date(ev.fechaGuardado).toLocaleDateString("es-CL")}</p></div></div></body></html>`);
    w.document.close();setTimeout(()=>w.print(),500)};

  const renderProcSection=()=>{
    if(!pa||pa.total===0)return<div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,padding:20,marginBottom:20}}>
      <div style={{fontSize:14,fontWeight:600,color:"#059669"}}>{"\u2713 Sin procesos fonol\u00f3gicos registrados"}</div>
    </div>;
    const ageExpected=pa.errors?pa.errors.filter(e=>ev.edadMeses>0&&e.expectedAge<ev.edadMeses):[];
    return<div style={{marginTop:28}}>
      <h3 style={{fontSize:16,fontWeight:700,color:"#5b21b6",marginBottom:12}}>{"Procesos Fonol\u00f3gicos ("}{pa.total}{")"}</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
        {Object.entries(catNames).map(([id,name])=>{const c=pa.byCategory?.[id]||0;
          return<div key={id} style={{background:"#f8faf9",borderRadius:10,padding:16,border:`2px solid ${c>0?catColors[id]:"#e2e8f0"}`,textAlign:"center"}}>
            <div style={{fontSize:28,fontWeight:700,color:c>0?catColors[id]:"#cbd5e1"}}>{c}</div>
            <div style={{fontSize:11,color:K.mt,marginTop:2}}>{name}</div>
          </div>})}
      </div>
      {pa.errors&&pa.errors.length>0&&<div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,overflow:"hidden",marginBottom:16}}>
        <div style={{background:"#f8faf9",padding:"10px 16px",fontSize:12,fontWeight:700,color:K.mt,display:"grid",gridTemplateColumns:"60px 80px 1fr 1fr",gap:8}}>
          <span>S\u00edlaba</span><span>Producc.</span><span>Proceso</span><span>Cat.</span>
        </div>
        {pa.errors.map((e,i)=><div key={i} style={{padding:"8px 16px",fontSize:13,display:"grid",gridTemplateColumns:"60px 80px 1fr 1fr",gap:8,borderTop:"1px solid #f1f5f9",background:ev.edadMeses>0&&e.expectedAge<ev.edadMeses?"#fef2f2":"#fff"}}>
          <span style={{fontWeight:700,color:"#7c3aed"}}>{e.word}</span>
          <span style={{color:"#dc2626",fontWeight:600}}>{e.produccion||"\u2014"}</span>
          <span style={{fontSize:12}}>{e.procesoName}</span>
          <span style={{fontSize:11,color:catColors[e.category],fontWeight:600}}>{e.categoryTitle}</span>
        </div>)}
      </div>}
      {ageExpected.length>0&&<div style={{background:"#fef3c7",border:"1px solid #fde68a",borderRadius:10,padding:16,marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:700,color:"#92400e",marginBottom:6}}>{"\u26a0 No esperados ("}{fa(ev.edadMeses)}{")"}</div>
        <div style={{fontSize:12,color:"#78350f"}}>{ageExpected.map(e=>`${e.procesoName} (esperable hasta ${fa(e.expectedAge)})`).filter((v,i,a)=>a.indexOf(v)===i).join("; ")}</div>
      </div>}
      {pa.byProcess&&(()=>{const sorted=Object.entries(pa.byProcess).sort((a,b)=>b[1]-a[1]);if(sorted.length===0)return null;const top=sorted.slice(0,3).map(([id,count])=>{const p=ALL_PROCESSES.find(x=>x.id===id);return`${p?.name||id} (${count})`});
        return<div style={{background:"#ede9fe",borderRadius:10,padding:16}}>
          <div style={{fontSize:13,fontWeight:700,color:"#5b21b6",marginBottom:4}}>Predominantes</div>
          <div style={{fontSize:13,color:"#3b0764"}}>{top.join(", ")}</div>
        </div>})()}
    </div>;
  };

  /* Result card */
  const RC=({title,desc,ok,total,pct,color})=>
    <div style={{background:"#f8faf9",borderRadius:12,padding:20,border:"1px solid #e2e8f0"}}>
      <div style={{fontSize:13,fontWeight:700,color:"#1e293b",marginBottom:4}}>{title}</div>
      <div style={{fontSize:11,color:K.mt,marginBottom:10,lineHeight:1.5}}>{desc}</div>
      <div style={{fontSize:30,fontWeight:700,color:color||"#7c3aed",textAlign:"center"}}>{ok}<span style={{fontSize:15,color:K.mt}}>{"/"}{total}</span></div>
      {pct!==undefined&&pct>0&&<div style={{textAlign:"center",fontSize:12,color:K.mt,marginTop:4}}>{pct}{"% correcto"}</div>}
    </div>;

  return(<div style={{width:"100%",maxWidth:900,animation:"fi .3s ease"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
      <div>
        <h1 style={{fontSize:24,fontWeight:700,color:"#7c3aed"}}>Informe PEFF</h1>
        <p style={{color:K.mt,fontSize:15,marginTop:2}}>{ev.paciente}{" \u2014 "}{fa(ev.edadMeses)}</p>
      </div>
      <div style={{display:"flex",gap:8}}>
        {isA&&(cd?<div style={{display:"flex",gap:4}}>
          <button onClick={()=>{onD(ev._fbId,"peff_evaluaciones");sCD(false)}} style={{background:"#dc2626",color:"#fff",border:"none",padding:"8px 16px",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer"}}>S\u00ed</button>
          <button onClick={()=>sCD(false)} style={{background:"#f1f5f9",border:"none",padding:"8px 16px",borderRadius:6,fontSize:12,cursor:"pointer"}}>No</button>
        </div>:<button onClick={()=>sCD(true)} style={{background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",padding:"8px 16px",borderRadius:8,fontSize:13,cursor:"pointer"}}>{"\ud83d\uddd1 Eliminar"}</button>)}
        <button onClick={pdf} style={{background:"#7c3aed",color:"#fff",border:"none",padding:"11px 22px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{"\ud83d\udcc4 PDF"}</button>
      </div>
    </div>

    <div style={{background:"#fff",borderRadius:14,padding:32,border:"1px solid #e2e8f0"}}>
      {/* ── Descriptive result cards ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:20}}>
        <RC title="Producci\u00f3n de S\u00edlabas" desc="S\u00edlabas producidas correctamente al repetir est\u00edmulos fon\u00e9ticos."
          ok={r.silOk||0} total={r.silTotal||0} pct={r.silPct||0}
          color={(r.silPct||0)>=85?"#059669":(r.silPct||0)>=50?"#f59e0b":"#dc2626"}/>
        <RC title="Discriminaci\u00f3n Auditiva" desc="Pares de palabras diferenciados correctamente (igual vs diferente)."
          ok={r.discOk||0} total={r.discTotal||0} pct={r.discEval>0?Math.round((r.discOk||0)/r.discEval*100):0}
          color={(r.discOk||0)>=r.discTotal*0.85?"#059669":(r.discOk||0)>=r.discTotal*0.5?"#f59e0b":"#dc2626"}/>
        <RC title="Reconocimiento Fonol\u00f3gico" desc="Palabras identificadas correctamente entre opciones fonol\u00f3gicamente similares."
          ok={r.recOk||0} total={r.recTotal||0} pct={r.recEval>0?Math.round((r.recOk||0)/r.recEval*100):0}
          color={(r.recOk||0)>=r.recTotal*0.85?"#059669":(r.recOk||0)>=r.recTotal*0.5?"#f59e0b":"#dc2626"}/>
      </div>

      {/* ── Severity with description ── */}
      <div style={{background:`linear-gradient(135deg,${sc}dd,${sc})`,borderRadius:12,padding:24,color:"#fff",marginBottom:20}}>
        <div style={{fontSize:13,opacity:.8,marginBottom:4}}>{"Severidad del trastorno fon\u00e9tico-fonol\u00f3gico"}</div>
        <div style={{fontSize:36,fontWeight:700,marginBottom:8}}>{sev}</div>
        <div style={{fontSize:13,opacity:.9,lineHeight:1.6}}>{sevDesc[sev]||""}</div>
      </div>

      {/* ── Scoring criteria ── */}
      <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:10,padding:14,marginBottom:20,fontSize:12,color:"#0369a1",lineHeight:1.6}}>
        <strong>{"\u2139\ufe0f Criterios de clasificaci\u00f3n:"}</strong><br/>
        {"Adecuado: \u226598% \u00b7 Leve: 85-97% \u00b7 Moderado: 65-84% \u00b7 Moderado-Severo: 50-64% \u00b7 Severo: <50%"}
      </div>

      {/* ── Unevaluated ── */}
      {r.unevalTotal>0&&<div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:16,marginBottom:20}}>
        <div style={{fontSize:13,fontWeight:700,color:"#92400e",marginBottom:8}}>{"\u26a0 \u00cdtems sin evaluar ("}{r.unevalTotal}{")"}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,fontSize:12,color:"#78350f"}}>
          {r.unevalSelects>0&&<div>{"Examen Cl\u00ednico OFA / Coordinaci\u00f3n: "}<b>{r.unevalSelects}</b></div>}
          {r.unevalPhon>0&&<div>{"Producci\u00f3n de S\u00edlabas: "}<b>{r.unevalPhon}</b></div>}
          {r.unevalDisc>0&&<div>{"Discriminaci\u00f3n Auditiva: "}<b>{r.unevalDisc}</b></div>}
          {r.unevalRec>0&&<div>{"Reconocimiento Fonol\u00f3gico: "}<b>{r.unevalRec}</b></div>}
        </div>
      </div>}

      {renderProcSection()}

      <button onClick={()=>setShowDetail(!showDetail)} style={{width:"100%",padding:"14px",background:showDetail?"#f1f5f9":"#5b21b6",color:showDetail?"#1e293b":"#fff",border:"1px solid #e2e8f0",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",marginTop:20,marginBottom:showDetail?0:20}}>
        {showDetail?"\u25b2 Ocultar detalle":"\u25bc Ver detalle de cada respuesta"}
      </button>

      {showDetail&&<div style={{marginTop:12}}>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
          <button onClick={detailPdf} style={{background:"#059669",color:"#fff",border:"none",padding:"8px 18px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>{"\ud83d\udda8 Imprimir detalle"}</button>
        </div>
        <div style={{border:"1px solid #e2e8f0",borderRadius:8,overflow:"hidden",maxHeight:500,overflowY:"auto"}}>
          <div style={{display:"grid",gridTemplateColumns:"120px 1fr 140px",background:"#5b21b6",color:"#fff",padding:"8px 12px",fontSize:12,fontWeight:600,position:"sticky",top:0}}>
            <span>Secci\u00f3n</span><span>\u00cdtem</span><span>Resultado</span>
          </div>
          {PEFF_SECTIONS.flatMap(sec=>sec.subsections.flatMap(sub=>{
            const rows=[];
            if(sub.fields)sub.fields.forEach(f=>{if(f.type==="select"){const v=sd[f.id]||"";rows.push({sec:sec.title.substring(0,20),item:f.label,val:v||"\u2014 Sin evaluar",ok:!!v})}});
            if(sub.items)sub.items.forEach(item=>{const v=sd[item.id]||"";const res=v==="ok"?"\u2714 Correcto":v==="D"?"D":v==="O"?"O":v==="S"?"S":"\u2014 Sin evaluar";rows.push({sec:"S\u00edlaba",item:`${item.word} (${item.target})`,val:res,ok:v==="ok"})});
            if(sub.discItems)sub.discItems.forEach(item=>{const v=sd[item.id]||"";rows.push({sec:"Discriminaci\u00f3n",item:item.pair,val:v==="correcto"?"\u2714":v==="incorrecto"?"\u2718":"\u2014 Sin evaluar",ok:v==="correcto"})});
            if(sub.recItems)sub.recItems.forEach(item=>{const v=sd[item.id]||"";rows.push({sec:"Reconocimiento",item:`${item.target}`,val:v==="reconoce"?"\u2714":v==="no"?"\u2718":"\u2014 Sin evaluar",ok:v==="reconoce"})});
            return rows;
          })).map((row,i)=><div key={i} style={{display:"grid",gridTemplateColumns:"120px 1fr 140px",padding:"6px 12px",fontSize:12,borderTop:"1px solid #f1f5f9",background:row.ok?"#ecfdf5":row.val.includes("Sin")?"#fffbeb":"#fef2f2"}}>
            <span style={{color:K.mt,fontSize:11}}>{row.sec}</span>
            <span>{row.item}</span>
            <span style={{fontWeight:600,color:row.ok?"#059669":row.val.includes("Sin")?"#92400e":"#dc2626"}}>{row.val}</span>
          </div>)}
        </div>
      </div>}

      <h3 style={{fontSize:16,fontWeight:700,color:"#5b21b6",marginBottom:10,marginTop:28}}>Observaciones Cl\u00ednicas</h3>
      <div style={{background:"#f8faf9",padding:18,borderRadius:10,fontSize:14,border:"1px solid #e2e8f0",lineHeight:1.7,minHeight:60}}>{ev.observaciones||"Sin observaciones."}</div>
    </div>
  </div>);
}
