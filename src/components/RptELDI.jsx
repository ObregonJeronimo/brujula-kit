import { useState } from "react";
import { REC, EXP } from "../data/eldiItems.js";
const K = { mt: "#64748b" };
const fa=m=>`${Math.floor(m/12)} años, ${m%12} meses`;

export default function RptELDI({ev,isA,onD}){
  const[cd,sCD]=useState(false);
  const[showDetail,setShowDetail]=useState(false);
  const recRes=ev.recRes||null;
  const expRes=ev.expRes||null;
  const allNoEval=ev.allNoEval||[];

  const detailPdf=()=>{const w=window.open("","_blank");if(!w)return;
    const rsp=ev.respuestas||{};
    const mkRows=(items,label)=>{
      let html=`<h2>${label}</h2><table><tr><th>ID</th><th>Ítem</th><th>Resultado</th></tr>`;
      items.forEach(item=>{
        const v=rsp[item.id];
        const res=v===true?"✔ Logrado":v===false?"✘ No logrado":"— Sin evaluar";
        const bg=v===true?"#ecfdf5":v===false?"#fef2f2":"#fffbeb";
        const clr=v===true?"#059669":v===false?"#dc2626":"#92400e";
        html+=`<tr style="background:${bg}"><td style="font-weight:600">${item.id}</td><td>${item.l}</td><td style="color:${clr};font-weight:600">${res}</td></tr>`;
      });
      html+="</table>";return html;
    };
    w.document.write(`<!DOCTYPE html><html><head><title>ELDI Detalle ${ev.paciente}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:sans-serif;color:#1e293b;padding:24px 36px;max-width:900px;margin:0 auto;line-height:1.5}h1{font-size:22px;color:#0a3d2f;border-bottom:3px solid #0d9488;padding-bottom:8px;margin-bottom:18px}h2{font-size:14px;color:#0a3d2f;margin:16px 0 8px;text-transform:uppercase}table{width:100%;border-collapse:collapse;margin:8px 0 20px}th,td{border:1px solid #e2e8f0;padding:8px 12px;font-size:12px;text-align:left}th{background:#0a3d2f;color:white}</style></head><body>`);
    w.document.write(`<div style="text-align:center;margin-bottom:28px"><h1 style="border:none;font-size:24px">INFORME DETALLADO ELDI</h1><p style="color:#64748b;font-size:13px">${ev.paciente} — ${fa(ev.edadMeses)} — ${ev.fechaEvaluacion}</p></div>`);
    if(ev.evalRec!==false)w.document.write(mkRows(REC,"🔊 Comprensión Auditiva (Receptivo)"));
    if(ev.evalExp!==false)w.document.write(mkRows(EXP,"🗣️ Comunicación Expresiva"));
    w.document.write(`</body></html>`);
    w.document.close();setTimeout(()=>w.print(),500);
  };

  const pdf=()=>{const w=window.open("","_blank");if(!w)return;
    const areaHTML=(area,icon)=>{
      if(!area||!area.evaluated)return`<div style="background:#f1f5f9;padding:16px;border-radius:8px;margin:8px 0"><strong>${icon} ${area?.label||"—"}</strong>: No evaluado</div>`;
      return`<div style="background:#f8faf9;padding:16px;border-radius:8px;border:1px solid #e2e8f0;margin:8px 0"><div style="font-weight:700;margin-bottom:10px">${icon} ${area.label}</div><table style="width:100%"><tr><th>Ítems logrados</th><th>No logrados</th><th>Sin evaluar</th><th>% Logro</th></tr><tr><td style="color:#059669;font-weight:700;font-size:18px">${area.logrado}/${area.total}</td><td style="color:#dc2626;font-weight:700">${area.noLogrado}</td><td style="color:#f59e0b;font-weight:700">${area.noEvaluado.length}</td><td style="font-weight:700;font-size:18px">${area.pctLogrado!==null?area.pctLogrado+"%":"—"}</td></tr></table>${area.noEvaluado.length>0?`<div style="margin-top:8px;padding:8px;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;font-size:11px"><strong style="color:#92400e">No evaluados:</strong> ${area.noEvaluado.join(", ")}</div>`:""}</div>`;
    };
    w.document.write(`<!DOCTYPE html><html><head><title>ELDI ${ev.paciente}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:sans-serif;color:#1e293b;padding:24px 36px;max-width:800px;margin:0 auto;line-height:1.5}h1{font-size:22px;color:#0a3d2f;border-bottom:3px solid #0d9488;padding-bottom:8px;margin-bottom:18px}h2{font-size:14px;color:#0a3d2f;margin:16px 0 8px;text-transform:uppercase}table{width:100%;border-collapse:collapse;margin:8px 0}th,td{border:1px solid #e2e8f0;padding:10px 14px;text-align:center;font-size:13px}th{background:#0a3d2f;color:white}.g{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px}.f{font-size:13px;padding:6px 0;border-bottom:1px solid #f1f5f9}.f strong{color:#475569}.warn{background:#fef3c7;border:1px solid #fde68a;padding:12px;border-radius:8px;margin:12px 0;font-size:12px;color:#78350f}.ob{background:#f8faf9;padding:10px;border-radius:6px;border:1px solid #e2e8f0;font-size:13px;min-height:50px;margin:8px 0}.ft{margin-top:20px;border-top:1px solid #e2e8f0;padding-top:20px;display:flex;justify-content:space-between}.sg{text-align:center;width:44%}.sg .ln{border-top:1px solid #1e293b;margin-top:30px;padding-top:4px;font-size:12px}</style></head><body>`);
    w.document.write(`<div style="text-align:center;margin-bottom:28px"><h1 style="border:none;font-size:24px">INFORME ELDI</h1><p style="color:#64748b;font-size:13px">Evaluación del Lenguaje y Desarrollo Infantil — Brújula KIT</p></div>`);
    w.document.write(`<h2>1. Identificación</h2><div class="g"><div class="f"><strong>Nombre:</strong> ${ev.paciente}</div><div class="f"><strong>Edad:</strong> ${fa(ev.edadMeses)}</div><div class="f"><strong>F.nac:</strong> ${ev.fechaNacimiento}</div><div class="f"><strong>F.eval:</strong> ${ev.fechaEvaluacion}</div><div class="f"><strong>Establ:</strong> ${ev.establecimiento||"—"}</div><div class="f"><strong>Derivado:</strong> ${ev.derivadoPor||"—"}</div></div>`);
    w.document.write(`<h2>2. Resultados — Puntajes Brutos</h2><div class="warn"><strong>⚠ Nota:</strong> Sin baremo normativo publicado. Puntajes brutos (conteo directo). No se calculan puntajes estándar ni clasificaciones derivadas.</div>`);
    w.document.write(areaHTML(recRes,"🔊"));
    w.document.write(areaHTML(expRes,"🗣️"));
    if(allNoEval.length>0)w.document.write(`<div class="warn">⚠ ${allNoEval.length} ítems sin evaluar. Resultados parciales.</div>`);
    w.document.write(`<h2>3. Observaciones</h2><div class="ob">${ev.observaciones||"Sin observaciones."}</div>`);
    w.document.write(`<div class="ft"><div class="sg"><div class="ln">Firma Profesional</div></div><div class="sg"><div class="ln">Fecha</div><p style="font-size:11px">${new Date(ev.fechaGuardado).toLocaleDateString("es-CL")}</p></div></div></body></html>`);
    w.document.close();setTimeout(()=>w.print(),500)};

  const renderArea=(area,icon)=>{
    if(!area||!area.evaluated)return<div style={{background:"#f1f5f9",borderRadius:10,padding:20,border:"1px solid #e2e8f0",marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:15}}>{icon} {area?.label||"—"}</div>
      <div style={{fontSize:14,color:K.mt,fontStyle:"italic",marginTop:6}}>No evaluado en esta sesión</div>
    </div>;
    return<div style={{background:"#f8faf9",borderRadius:10,padding:20,border:"1px solid #e2e8f0",marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>{icon} {area.label}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        <div><div style={{fontSize:10,color:K.mt,marginBottom:2}}>Ítems logrados</div><div style={{fontSize:24,fontWeight:700,color:"#059669"}}>{area.logrado}<span style={{fontSize:14,color:K.mt}}>/{area.total}</span></div></div>
        <div><div style={{fontSize:10,color:K.mt,marginBottom:2}}>No logrados</div><div style={{fontSize:24,fontWeight:700,color:"#dc2626"}}>{area.noLogrado}</div></div>
        <div><div style={{fontSize:10,color:K.mt,marginBottom:2}}>Sin evaluar</div><div style={{fontSize:24,fontWeight:700,color:"#f59e0b"}}>{area.noEvaluado.length}</div></div>
      </div>
      {area.evaluados>0&&<div style={{marginTop:12}}>
        <div style={{fontSize:10,color:K.mt,marginBottom:4}}>% logro (sobre evaluados)</div>
        <div style={{background:"#e2e8f0",borderRadius:6,height:24,overflow:"hidden",position:"relative"}}>
          <div style={{background:area.pctLogrado>=80?"#059669":area.pctLogrado>=50?"#f59e0b":"#dc2626",height:"100%",width:`${area.pctLogrado}%`,borderRadius:6}}/>
          <span style={{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",fontSize:12,fontWeight:700}}>{area.pctLogrado}%</span>
        </div>
      </div>}
      {area.noEvaluado.length>0&&<div style={{marginTop:12,padding:10,background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8}}>
        <div style={{fontSize:11,fontWeight:600,color:"#92400e",marginBottom:4}}>No evaluados:</div>
        <div style={{fontSize:11,color:"#78350f",wordBreak:"break-all"}}>{area.noEvaluado.join(", ")}</div>
      </div>}
    </div>;
  };

  const renderDetailView=()=>{
    const rsp=ev.respuestas||{};
    const mkTable=(items,label,icon)=>{
      const evaluated=label==="Comprensión Auditiva"?ev.evalRec:ev.evalExp;
      if(evaluated===false)return<div style={{marginBottom:20}}><h3 style={{fontSize:15,fontWeight:700,color:"#0a3d2f",marginBottom:8}}>{icon} {label}</h3><div style={{color:K.mt,fontStyle:"italic"}}>No evaluado</div></div>;
      return<div style={{marginBottom:20}}>
        <h3 style={{fontSize:15,fontWeight:700,color:"#0a3d2f",marginBottom:8}}>{icon} {label}</h3>
        <div style={{border:"1px solid #e2e8f0",borderRadius:8,overflow:"hidden"}}>
          <div style={{display:"grid",gridTemplateColumns:"60px 1fr 120px",background:"#0a3d2f",color:"#fff",padding:"8px 12px",fontSize:12,fontWeight:600}}>
            <span>ID</span><span>Ítem</span><span>Resultado</span>
          </div>
          {items.map(item=>{const v=rsp[item.id];
            return<div key={item.id} style={{display:"grid",gridTemplateColumns:"60px 1fr 120px",padding:"6px 12px",fontSize:13,borderTop:"1px solid #f1f5f9",background:v===true?"#ecfdf5":v===false?"#fef2f2":"#fffbeb"}}>
              <span style={{fontWeight:600}}>{item.id}</span>
              <span>{item.l}</span>
              <span style={{fontWeight:600,color:v===true?"#059669":v===false?"#dc2626":"#92400e"}}>{v===true?"✔ Logrado":v===false?"✘ No logrado":"— Sin evaluar"}</span>
            </div>})}
        </div>
      </div>;
    };
    return<div style={{marginTop:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <h3 style={{fontSize:16,fontWeight:700,color:"#0a3d2f"}}>Detalle de Respuestas</h3>
        <button onClick={detailPdf} style={{background:"#059669",color:"#fff",border:"none",padding:"8px 18px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>🖨 Imprimir detalle</button>
      </div>
      {mkTable(REC,"Comprensión Auditiva","🔊")}
      {mkTable(EXP,"Comunicación Expresiva","🗣️")}
    </div>;
  };

  return(<div style={{width:"100%",maxWidth:900,animation:"fi .3s ease"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
      <div><h1 style={{fontSize:24,fontWeight:700}}>Informe ELDI</h1><p style={{color:K.mt,fontSize:15,marginTop:2}}>{ev.paciente} — {fa(ev.edadMeses)}</p></div>
      <div style={{display:"flex",gap:8}}>
        {isA&&(cd?<div style={{display:"flex",gap:4}}><button onClick={()=>{onD(ev._fbId,"evaluaciones");sCD(false)}} style={{background:"#dc2626",color:"#fff",border:"none",padding:"8px 16px",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer"}}>Sí</button><button onClick={()=>sCD(false)} style={{background:"#f1f5f9",border:"none",padding:"8px 16px",borderRadius:6,fontSize:12,cursor:"pointer"}}>No</button></div>:<button onClick={()=>sCD(true)} style={{background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",padding:"8px 16px",borderRadius:8,fontSize:13,cursor:"pointer"}}>🗑 Eliminar</button>)}
        <button onClick={pdf} style={{background:"#dc2626",color:"#fff",border:"none",padding:"11px 22px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>📄 PDF</button>
      </div>
    </div>
    <div style={{background:"#fff",borderRadius:14,padding:32,border:"1px solid #e2e8f0"}}>
      <h3 style={{fontSize:16,fontWeight:700,color:"#0a3d2f",marginBottom:14,paddingBottom:8,borderBottom:"2px solid #ccfbf1"}}>Datos del Paciente</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px 32px",marginBottom:28}}>{[["Nombre",ev.paciente],["Edad",fa(ev.edadMeses)],["F. nacimiento",ev.fechaNacimiento],["F. evaluación",ev.fechaEvaluacion],["Establecimiento",ev.establecimiento||"—"],["Derivado por",ev.derivadoPor||"—"]].map(([l,v],i)=><div key={i} style={{padding:"8px 0",borderBottom:"1px solid #f1f5f9"}}><div style={{fontSize:11,color:K.mt,marginBottom:3,textTransform:"uppercase"}}>{l}</div><div style={{fontSize:15,fontWeight:600}}>{v}</div></div>)}</div>
      <div style={{background:"#fef3c7",border:"1px solid #fde68a",borderRadius:10,padding:16,marginBottom:20}}>
        <div style={{fontSize:13,fontWeight:700,color:"#92400e",marginBottom:6}}>⚠ Nota sobre interpretación</div>
        <div style={{fontSize:12,color:"#78350f",lineHeight:1.6}}>Sin baremo normativo publicado. Puntajes brutos. No se calculan puntajes estándar, percentiles ni clasificaciones derivadas.</div>
      </div>
      <h3 style={{fontSize:16,fontWeight:700,color:"#0a3d2f",marginBottom:14,paddingBottom:8,borderBottom:"2px solid #ccfbf1"}}>Resultados — Puntajes Brutos</h3>
      {renderArea(recRes,"🔊")}
      {renderArea(expRes,"🗣️")}
      <div style={{background:"linear-gradient(135deg,#0a3d2f,#0d9488)",borderRadius:10,padding:24,color:"#fff",marginBottom:28}}>
        <div style={{fontSize:13,opacity:.8,marginBottom:8}}>Resumen de puntajes brutos</div>
        <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
          {recRes?.evaluated&&<div><span style={{fontSize:36,fontWeight:700}}>{recRes.logrado}</span><span style={{fontSize:14,opacity:.7}}>/{recRes.evaluados} Receptivo</span></div>}
          {expRes?.evaluated&&<div><span style={{fontSize:36,fontWeight:700}}>{expRes.logrado}</span><span style={{fontSize:14,opacity:.7}}>/{expRes.evaluados} Expresivo</span></div>}
        </div>
        {allNoEval.length>0&&<div style={{marginTop:12,padding:"8px 12px",background:"rgba(255,255,255,.12)",borderRadius:8,fontSize:12}}>⚠ {allNoEval.length} ítems sin evaluar — parcial</div>}
      </div>
      <button onClick={()=>setShowDetail(!showDetail)} style={{width:"100%",padding:"14px",background:showDetail?"#f1f5f9":"#0a3d2f",color:showDetail?"#1e293b":"#fff",border:"1px solid #e2e8f0",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",marginBottom:showDetail?0:20}}>{showDetail?"▲ Ocultar detalle":"▼ Ver detalle de cada respuesta"}</button>
      {showDetail&&renderDetailView()}
      <h3 style={{fontSize:16,fontWeight:700,color:"#0a3d2f",marginBottom:10,paddingBottom:8,borderBottom:"2px solid #ccfbf1",marginTop:20}}>Observaciones Clínicas</h3>
      <div style={{background:"#f8faf9",padding:18,borderRadius:10,fontSize:14,border:"1px solid #e2e8f0",lineHeight:1.7,minHeight:60}}>{ev.observaciones||"Sin observaciones."}</div>
    </div>
  </div>);
}
