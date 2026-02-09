import { useState } from "react";
import { ALL_PROCESSES, PF_CATEGORIES } from "../data/peffProcesos.js";
const K = { mt: "#64748b" };
const fa=m=>`${Math.floor(m/12)} años, ${m%12} meses`;

export default function RptPEFF({ev,isA,onD}){
  const[cd,sCD]=useState(false);const r=ev.resultados||{};
  const pa=r.procAnalysis||null;
  const catNames={sust:"Sustituciones",asim:"Asimilaciones",estr:"Estructuración silábica"};
  const catColors={sust:"#f59e0b",asim:"#7c3aed",estr:"#dc2626"};

  const pdf=()=>{const w=window.open("","_blank");if(!w)return;const d=ev.seccionData||{};
    const ofaFields=[["Labios postura",d.lab_postura],["Labios simetría",d.lab_simetria],["Tonicidad",d.lab_tonicidad],["ATM postura",d.atm_postura],["ATM apertura",d.atm_apertura],["Lengua postura",d.len_postura],["Lengua tamaño",d.len_tamano],["Frenillo",d.len_frenillo],["Dentición",d.die_denticion],["Angle Der.",d.die_angle_der],["Angle Izq.",d.die_angle_izq],["Mordida",d.die_mordida],["Paladar",d.pal_altura],["Integridad",d.pal_integridad],["Velo",d.vel_simetria],["Úvula",d.vel_uvula],["Escape nasal",d.vel_escape]].filter(([,v])=>v);
    const ofaHTML=ofaFields.map(([l,v])=>`<tr><td style="text-align:left;font-weight:600">${l}</td><td>${v}</td></tr>`).join("");
    let procHTML="";
    if(pa&&pa.total>0){
      const catSummary=Object.entries(catNames).map(([id,name])=>`${name}: ${pa.byCategory[id]||0}`).join(" | ");
      const errRows=(pa.errors||[]).map(e=>{
        const isLate=ev.edadMeses>0&&e.expectedAge<ev.edadMeses;
        return`<tr style="background:${isLate?"#fef2f2":"#fff"}"><td style="font-weight:700;color:#5b21b6">${e.word}</td><td style="color:#dc2626;font-weight:600">${e.produccion||"—"}</td><td>${e.procesoName}</td><td style="font-size:11px">${e.categoryTitle}</td>${isLate?'<td style="color:#dc2626;font-size:11px">⚠ No esperable</td>':"<td>—</td>"}</tr>`}).join("");
      const topProcs=Object.entries(pa.byProcess||{}).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([id,count])=>{const p=ALL_PROCESSES.find(x=>x.id===id);return`${p?.name||id} (${count})`}).join(", ");
      const lateProcs=(pa.errors||[]).filter(e=>ev.edadMeses>0&&e.expectedAge<ev.edadMeses).map(e=>`${e.procesoName} (esperable hasta ${fa(e.expectedAge)})`).filter((v,i,a)=>a.indexOf(v)===i);
      procHTML=`<h2>Procesos Fonológicos de Simplificación (${pa.total})</h2><div class="res"><strong>Resumen:</strong> ${catSummary}</div><table><tr><th>Sílaba</th><th>Producción</th><th>Proceso</th><th>Categoría</th><th>Obs</th></tr>${errRows}</table>${topProcs?`<div class="res"><strong>Procesos predominantes:</strong> ${topProcs}</div>`:""}${lateProcs.length>0?`<div style="background:#fef3c7;border:1px solid #fde68a;padding:10px;border-radius:6px;margin:8px 0"><strong style="color:#92400e">⚠ No esperados para la edad (${fa(ev.edadMeses)}):</strong><br><span style="font-size:12px;color:#78350f">${lateProcs.join("; ")}</span></div>`:""}`;
    }else{
      procHTML=`<h2>Procesos Fonológicos de Simplificación</h2><div class="res" style="color:#059669">✓ No se registraron procesos fonológicos de simplificación.</div>`;
    }
    w.document.write(`<!DOCTYPE html><html><head><title>PEFF ${ev.paciente}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:sans-serif;color:#1e293b;padding:24px 36px;max-width:800px;margin:0 auto;line-height:1.5}h1{font-size:22px;color:#5b21b6;border-bottom:3px solid #7c3aed;padding-bottom:8px;margin-bottom:18px}h2{font-size:14px;color:#5b21b6;margin:16px 0 8px;text-transform:uppercase}table{width:100%;border-collapse:collapse;margin:8px 0}th,td{border:1px solid #e2e8f0;padding:8px 12px;font-size:13px}th{background:#5b21b6;color:white}.res{background:#ede9fe;padding:12px;border-radius:8px;margin:8px 0;font-size:13px}.ob{background:#f8faf9;padding:10px;border-radius:6px;border:1px solid #e2e8f0;font-size:13px;min-height:40px;margin:8px 0}.ft{margin-top:20px;border-top:1px solid #e2e8f0;padding-top:20px;display:flex;justify-content:space-between}.sg{text-align:center;width:44%}.sg .ln{border-top:1px solid #1e293b;margin-top:30px;padding-top:4px;font-size:12px}</style></head><body>`);
    w.document.write(`<div style="text-align:center;margin-bottom:28px"><h1 style="border:none;font-size:24px">INFORME PEFF</h1><p style="color:#64748b;font-size:13px">Brújula KIT — Protocolo Fonético-Fonológico</p></div>`);
    w.document.write(`<h2>Identificación</h2><table><tr><th>Nombre</th><td>${ev.paciente}</td><th>Edad</th><td>${fa(ev.edadMeses)}</td></tr><tr><th>F.nac</th><td>${ev.fechaNacimiento}</td><th>F.eval</th><td>${ev.fechaEvaluacion}</td></tr></table>`);
    w.document.write(`<h2>Examen OFA</h2><table><tr><th>Estructura</th><th>Hallazgo</th></tr>${ofaHTML||"<tr><td colspan=2>—</td></tr>"}</table>`);
    w.document.write(`<h2>Resultados Cuantitativos</h2><div class="res"><strong>Sílabas:</strong> ${r.silOk||0}/${r.silTotal||0} (${r.silPct||0}%)<br><strong>Discriminación:</strong> ${r.discOk||0}/${r.discTotal||0}<br><strong>Reconocimiento:</strong> ${r.recOk||0}/${r.recTotal||0}</div>`);
    w.document.write(`<h2>Severidad</h2><div class="res" style="font-size:18px;font-weight:700;color:#5b21b6">${r.severity||"—"}</div>`);
    w.document.write(procHTML);
    w.document.write(`<h2>Observaciones</h2><div class="ob">${ev.observaciones||"Sin observaciones."}</div>`);
    w.document.write(`<div class="ft"><div class="sg"><div class="ln">Firma Profesional</div></div><div class="sg"><div class="ln">Fecha</div><p style="font-size:11px">${new Date(ev.fechaGuardado).toLocaleDateString("es-CL")}</p></div></div></body></html>`);
    w.document.close();setTimeout(()=>w.print(),500)};

  const renderProcSection=()=>{
    if(!pa||pa.total===0)return<div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:10,padding:20,marginBottom:20}}><div style={{fontSize:14,fontWeight:600,color:"#059669"}}>✓ No se registraron procesos fonológicos de simplificación</div></div>;
    const ageExpected=pa.errors?pa.errors.filter(e=>ev.edadMeses>0&&e.expectedAge<ev.edadMeses):[];
    return<div style={{marginTop:28}}>
      <h3 style={{fontSize:16,fontWeight:700,color:"#5b21b6",marginBottom:12}}>Procesos Fonológicos de Simplificación ({pa.total})</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:16}}>
        {Object.entries(catNames).map(([id,name])=>{const c=pa.byCategory?.[id]||0;return<div key={id} style={{background:"#f8faf9",borderRadius:10,padding:16,border:`2px solid ${c>0?catColors[id]:"#e2e8f0"}`,textAlign:"center"}}><div style={{fontSize:28,fontWeight:700,color:c>0?catColors[id]:"#cbd5e1"}}>{c}</div><div style={{fontSize:11,color:K.mt,marginTop:2}}>{name}</div></div>})}
      </div>
      {pa.errors&&pa.errors.length>0&&<div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,overflow:"hidden",marginBottom:16}}>
        <div style={{background:"#f8faf9",padding:"10px 16px",fontSize:12,fontWeight:700,color:K.mt,display:"grid",gridTemplateColumns:"60px 80px 1fr 1fr",gap:8}}>
          <span>Sílaba</span><span>Producción</span><span>Proceso</span><span>Categoría</span>
        </div>
        {pa.errors.map((e,i)=><div key={i} style={{padding:"8px 16px",fontSize:13,display:"grid",gridTemplateColumns:"60px 80px 1fr 1fr",gap:8,borderTop:"1px solid #f1f5f9",alignItems:"center",background:ev.edadMeses>0&&e.expectedAge<ev.edadMeses?"#fef2f2":"#fff"}}>
          <span style={{fontWeight:700,color:"#7c3aed"}}>{e.word}</span>
          <span style={{color:"#dc2626",fontWeight:600}}>{e.produccion||"—"}</span>
          <span style={{fontSize:12}}>{e.procesoName}</span>
          <span style={{fontSize:11,color:catColors[e.category],fontWeight:600}}>{e.categoryTitle}</span>
        </div>)}
      </div>}
      {ageExpected.length>0&&<div style={{background:"#fef3c7",border:"1px solid #fde68a",borderRadius:10,padding:16,marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:700,color:"#92400e",marginBottom:6}}>⚠ Procesos no esperados para la edad ({fa(ev.edadMeses)})</div>
        <div style={{fontSize:12,color:"#78350f"}}>{ageExpected.map(e=>`${e.procesoName} (esperable hasta ${fa(e.expectedAge)})`).filter((v,i,a)=>a.indexOf(v)===i).join("; ")}</div>
      </div>}
      {pa.byProcess&&(()=>{const sorted=Object.entries(pa.byProcess).sort((a,b)=>b[1]-a[1]);if(sorted.length===0)return null;
        const top=sorted.slice(0,3).map(([id,count])=>{const p=ALL_PROCESSES.find(x=>x.id===id);return`${p?.name||id} (${count})`});
        return<div style={{background:"#ede9fe",borderRadius:10,padding:16}}>
          <div style={{fontSize:13,fontWeight:700,color:"#5b21b6",marginBottom:4}}>Procesos predominantes</div>
          <div style={{fontSize:13,color:"#3b0764"}}>{top.join(", ")}</div>
        </div>})()}
    </div>;
  };

  return(<div style={{width:"100%",maxWidth:900,animation:"fi .3s ease"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
      <div><h1 style={{fontSize:24,fontWeight:700,color:"#7c3aed"}}>Informe PEFF</h1><p style={{color:K.mt,fontSize:15,marginTop:2}}>{ev.paciente} — {fa(ev.edadMeses)}</p></div>
      <div style={{display:"flex",gap:8}}>
        {isA&&(cd?<div style={{display:"flex",gap:4}}><button onClick={()=>{onD(ev._fbId,"peff_evaluaciones");sCD(false)}} style={{background:"#dc2626",color:"#fff",border:"none",padding:"8px 16px",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer"}}>Sí</button><button onClick={()=>sCD(false)} style={{background:"#f1f5f9",border:"none",padding:"8px 16px",borderRadius:6,fontSize:12,cursor:"pointer"}}>No</button></div>:<button onClick={()=>sCD(true)} style={{background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",padding:"8px 16px",borderRadius:8,fontSize:13,cursor:"pointer"}}>🗑</button>)}
        <button onClick={pdf} style={{background:"#7c3aed",color:"#fff",border:"none",padding:"11px 22px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>📄 PDF</button>
      </div>
    </div>
    <div style={{background:"#fff",borderRadius:14,padding:32,border:"1px solid #e2e8f0"}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:20}}>{[["Sílabas",`${r.silOk||0}/${r.silTotal||0}`,`${r.silPct||0}%`],["Discriminación",`${r.discOk||0}/${r.discTotal||0}`,""],["Reconocimiento",`${r.recOk||0}/${r.recTotal||0}`,""]].map(([l,v,v2],i)=><div key={i} style={{background:"#f8faf9",borderRadius:10,padding:20,border:"1px solid #e2e8f0",textAlign:"center"}}><div style={{fontSize:11,color:K.mt,marginBottom:4}}>{l}</div><div style={{fontSize:28,fontWeight:700,color:"#7c3aed"}}>{v}</div>{v2&&<div style={{fontSize:13,color:K.mt}}>{v2}</div>}</div>)}</div>
      <div style={{background:"linear-gradient(135deg,#5b21b6,#7c3aed)",borderRadius:10,padding:24,color:"#fff",marginBottom:28}}><div style={{fontSize:13,opacity:.8,marginBottom:8}}>Severidad</div><div style={{fontSize:36,fontWeight:700}}>{r.severity||"—"}</div></div>
      {renderProcSection()}
      <h3 style={{fontSize:16,fontWeight:700,color:"#5b21b6",marginBottom:10,marginTop:28}}>Observaciones</h3>
      <div style={{background:"#f8faf9",padding:18,borderRadius:10,fontSize:14,border:"1px solid #e2e8f0",lineHeight:1.7,minHeight:60}}>{ev.observaciones||"Sin observaciones."}</div>
    </div>
  </div>);
}
