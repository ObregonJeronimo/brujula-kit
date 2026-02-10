import { useState } from "react";
import { REC, EXP } from "../data/eldiItems.js";
const K = { mt: "#64748b" };
const fa=m=>`${Math.floor(m/12)} a\u00f1os, ${m%12} meses`;

const BANDS=[
  {min:0,max:5,label:"0;0\u20130;5"},
  {min:6,max:11,label:"0;6\u20130;11"},
  {min:12,max:17,label:"1;0\u20131;5"},
  {min:18,max:23,label:"1;6\u20131;11"},
  {min:24,max:29,label:"2;0\u20132;5"},
  {min:30,max:35,label:"2;6\u20132;11"},
  {min:36,max:41,label:"3;0\u20133;5"},
  {min:42,max:47,label:"3;6\u20133;11"},
  {min:48,max:59,label:"4;0\u20134;11"},
  {min:60,max:71,label:"5;0\u20135;11"},
  {min:72,max:95,label:"6;0\u20137;11"}
];

function getBandIndex(ageMo){for(let i=BANDS.length-1;i>=0;i--){if(ageMo>=BANDS[i].min)return i;}return 0;}

function recalcScoring(items, rsp, ageMo){
  const bandIdx=getBandIndex(ageMo);
  const expectedCount=(bandIdx+1)*5;
  const expectedItems=items.slice(0,expectedCount);
  let logrado=0,noLogrado=0,noEvaluado=[];
  items.forEach(i=>{const v=rsp[i.id];if(v===true)logrado++;else if(v===false)noLogrado++;else noEvaluado.push(i.id);});
  let logradoExpected=0;
  expectedItems.forEach(i=>{if(rsp[i.id]===true)logradoExpected++;});
  let devAgeBandIdx=-1;
  for(let b=0;b<BANDS.length;b++){
    const bandItems=items.slice(b*5,b*5+5);
    const passed=bandItems.filter(i=>rsp[i.id]===true).length;
    if(passed>=4)devAgeBandIdx=b;else break;
  }
  const pctExpected=expectedCount>0?Math.round(logradoExpected/expectedCount*100):null;
  let classification=null,classColor=null;
  if(pctExpected!==null){
    if(pctExpected>=90){classification="Dentro de L\u00edmites Normales";classColor="#059669";}
    else if(pctExpected>=75){classification="En Riesgo / Retraso Leve";classColor="#f59e0b";}
    else if(pctExpected>=50){classification="Retraso Moderado";classColor="#ea580c";}
    else{classification="Retraso Significativo";classColor="#dc2626";}
  }
  return{logrado,noLogrado,noEvaluado,total:items.length,evaluados:logrado+noLogrado,
    pctLogrado:(logrado+noLogrado)>0?Math.round(logrado/(logrado+noLogrado)*100):null,
    expectedCount,logradoExpected,pctExpected,
    devAgeBandIdx,devAgeLabel:devAgeBandIdx>=0?BANDS[devAgeBandIdx].label:null,
    classification,classColor};
}

function noEvalGrouped(noEvalIds,items){
  const groups={};
  noEvalIds.forEach(id=>{const item=items.find(i=>i.id===id);if(item){if(!groups[item.a])groups[item.a]=[];groups[item.a].push(item);}});
  return groups;
}

export default function RptELDI({ev,isA,onD}){
  const[cd,sCD]=useState(false);
  const[showDetail,setShowDetail]=useState(false);
  const rsp=ev.respuestas||{};
  const ageMo=ev.edadMeses||0;

  /* Recalculate scoring from raw responses */
  const recScoring=ev.evalRec!==false?recalcScoring(REC,rsp,ageMo):null;
  const expScoring=ev.evalExp!==false?recalcScoring(EXP,rsp,ageMo):null;

  const recRes=ev.evalRec!==false?{label:"Comprensi\u00f3n Auditiva",evaluated:true,...(recScoring||{})}:
    {label:"Comprensi\u00f3n Auditiva",evaluated:false,logrado:0,noLogrado:0,noEvaluado:REC.map(i=>i.id),total:55};
  const expRes=ev.evalExp!==false?{label:"Comunicaci\u00f3n Expresiva",evaluated:true,...(expScoring||{})}:
    {label:"Comunicaci\u00f3n Expresiva",evaluated:false,logrado:0,noLogrado:0,noEvaluado:EXP.map(i=>i.id),total:55};
  const allNoEval=[...(recRes.evaluated?(recRes.noEvaluado||[]):[]),...(expRes.evaluated?(expRes.noEvaluado||[]):[])];

  const detailPdf=()=>{const w=window.open("","_blank");if(!w)return;
    const mkRows=(items,label)=>{
      let html=`<h2>${label}</h2><table><tr><th style="width:50px">ID</th><th>\u00cdtem</th><th style="width:120px">Resultado</th></tr>`;
      items.forEach(item=>{
        const v=rsp[item.id];
        const res=v===true?"\u2714 Logrado":v===false?"\u2718 No logrado":"\u2014 Sin evaluar";
        const bg=v===true?"#ecfdf5":v===false?"#fef2f2":"#fffbeb";
        const clr=v===true?"#059669":v===false?"#dc2626":"#92400e";
        html+=`<tr style="background:${bg}"><td style="font-weight:600">${item.id}</td><td>${item.l}</td><td style="color:${clr};font-weight:600">${res}</td></tr>`;
      });
      html+="</table>";return html;
    };
    w.document.write(`<!DOCTYPE html><html><head><title>ELDI Detalle ${ev.paciente}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:sans-serif;color:#1e293b;padding:24px 36px;max-width:900px;margin:0 auto;line-height:1.5}h1{font-size:22px;color:#0a3d2f;border-bottom:3px solid #0d9488;padding-bottom:8px;margin-bottom:18px}h2{font-size:14px;color:#0a3d2f;margin:16px 0 8px;text-transform:uppercase}table{width:100%;border-collapse:collapse;margin:8px 0 20px}th,td{border:1px solid #e2e8f0;padding:8px 12px;font-size:12px;text-align:left}th{background:#0a3d2f;color:white}@media print{body{padding:12px 20px}}</style></head><body>`);
    w.document.write(`<div style="text-align:center;margin-bottom:28px"><h1 style="border:none;font-size:24px">INFORME DETALLADO ELDI</h1><p style="color:#64748b;font-size:13px">${ev.paciente} \u2014 ${fa(ev.edadMeses)} \u2014 ${ev.fechaEvaluacion}</p></div>`);
    if(ev.evalRec!==false)w.document.write(mkRows(REC,"\ud83d\udd0a Comprensi\u00f3n Auditiva (Receptivo)"));
    if(ev.evalExp!==false)w.document.write(mkRows(EXP,"\ud83d\udde3\ufe0f Comunicaci\u00f3n Expresiva"));
    w.document.write(`</body></html>`);w.document.close();setTimeout(()=>w.print(),500);
  };

  const pdf=()=>{const w=window.open("","_blank");if(!w)return;
    const classHTML=(sc,label)=>{
      if(!sc||sc.pctExpected===null||sc.evaluados===0)return"";
      const devAge=sc.devAgeLabel?`<div style="margin-top:8px"><strong>Edad de desarrollo estimada:</strong> ${sc.devAgeLabel}</div>`:"";
      return`<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:14px;margin:10px 0">
        <div style="font-weight:700;font-size:13px;color:#0a3d2f;margin-bottom:8px">\ud83c\udfaf An\u00e1lisis Criterial \u2014 ${label}</div>
        <div style="display:flex;gap:20px;flex-wrap:wrap">
          <div><strong>Rendimiento seg\u00fan edad:</strong> <span style="color:${sc.classColor};font-weight:700;font-size:16px">${sc.pctExpected}%</span> <span style="font-size:11px;color:#64748b">(${sc.logradoExpected}/${sc.expectedCount} \u00edtems esperados)</span></div>
          <div><strong>Clasificaci\u00f3n:</strong> <span style="color:${sc.classColor};font-weight:700">${sc.classification}</span></div>
        </div>${devAge}</div>`;
    };

    const noEvalHTML=(noEvalIds,items)=>{
      if(noEvalIds.length===0)return"";
      const groups=noEvalGrouped(noEvalIds,items);
      let html=`<div style="margin-top:8px;padding:10px;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;font-size:11px"><strong style="color:#92400e">\u00cdtems no evaluados:</strong>`;
      Object.entries(groups).forEach(([band,gItems])=>{
        html+=`<div style="margin-top:4px"><strong>Edad ${band}:</strong> `;
        html+=gItems.map(it=>`${it.l} (${it.id})`).join(", ");
        html+=`</div>`;
      });
      html+=`</div>`;return html;
    };

    const areaHTML=(area,items,icon)=>{
      if(!area||!area.evaluated)return`<div style="background:#f1f5f9;padding:16px;border-radius:8px;margin:8px 0"><strong>${icon} ${area?.label||"\u2014"}</strong>: No evaluado</div>`;
      return`<div style="background:#f8faf9;padding:16px;border-radius:8px;border:1px solid #e2e8f0;margin:8px 0">
        <div style="font-weight:700;margin-bottom:10px">${icon} ${area.label}</div>
        <table style="width:100%"><tr><th>\u00cdtems logrados</th><th>No logrados</th><th>Sin evaluar</th><th>% Logro</th></tr>
        <tr><td style="color:#059669;font-weight:700;font-size:18px">${area.logrado}/${area.total}</td><td style="color:#dc2626;font-weight:700">${area.noLogrado}</td><td style="color:#f59e0b;font-weight:700">${area.noEvaluado.length}</td><td style="font-weight:700;font-size:18px">${area.pctLogrado!==null?area.pctLogrado+"%":"\u2014"}</td></tr></table>
        ${noEvalHTML(area.noEvaluado,items)}</div>`;
    };

    w.document.write(`<!DOCTYPE html><html><head><title>ELDI ${ev.paciente}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:sans-serif;color:#1e293b;padding:24px 36px;max-width:800px;margin:0 auto;line-height:1.5}h1{font-size:22px;color:#0a3d2f;border-bottom:3px solid #0d9488;padding-bottom:8px;margin-bottom:18px}h2{font-size:14px;color:#0a3d2f;margin:16px 0 8px;text-transform:uppercase}table{width:100%;border-collapse:collapse;margin:8px 0}th,td{border:1px solid #e2e8f0;padding:10px 14px;text-align:center;font-size:13px}th{background:#0a3d2f;color:white}.g{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px}.f{font-size:13px;padding:6px 0;border-bottom:1px solid #f1f5f9}.f strong{color:#475569}.ob{background:#f8faf9;padding:10px;border-radius:6px;border:1px solid #e2e8f0;font-size:13px;min-height:50px;margin:8px 0}.ft{margin-top:20px;border-top:1px solid #e2e8f0;padding-top:20px;display:flex;justify-content:space-between}.sg{text-align:center;width:44%}.sg .ln{border-top:1px solid #1e293b;margin-top:30px;padding-top:4px;font-size:12px}@media print{body{padding:12px 20px;font-size:12px}h1{font-size:18px}table th,table td{padding:6px 8px;font-size:11px}}</style></head><body>`);
    w.document.write(`<div style="text-align:center;margin-bottom:28px"><h1 style="border:none;font-size:24px">INFORME ELDI</h1><p style="color:#64748b;font-size:13px">Evaluaci\u00f3n del Lenguaje y Desarrollo Infantil \u2014 Br\u00fajula KIT</p></div>`);
    w.document.write(`<h2>1. Identificaci\u00f3n</h2><div class="g"><div class="f"><strong>Nombre:</strong> ${ev.paciente}</div><div class="f"><strong>Edad:</strong> ${fa(ev.edadMeses)}</div><div class="f"><strong>F.nac:</strong> ${ev.fechaNacimiento}</div><div class="f"><strong>F.eval:</strong> ${ev.fechaEvaluacion}</div><div class="f"><strong>Establ:</strong> ${ev.establecimiento||"\u2014"}</div><div class="f"><strong>Derivado:</strong> ${ev.derivadoPor||"\u2014"}</div><div class="f"><strong>Evaluador:</strong> ${ev.evaluador||"\u2014"}</div></div>`);

    w.document.write(`<h2>2. An\u00e1lisis Criterial</h2>`);
    w.document.write(classHTML(recScoring,"Comprensi\u00f3n Auditiva"));
    w.document.write(classHTML(expScoring,"Comunicaci\u00f3n Expresiva"));
    w.document.write(`<div style="font-size:10px;color:#64748b;margin:8px 0;padding:8px;background:#f8faf9;border-radius:6px"><strong>Criterios:</strong> \u226590% = Dentro de L\u00edmites Normales | 75-89% = En Riesgo / Retraso Leve | 50-74% = Retraso Moderado | <50% = Retraso Significativo. Basado en \u00edtems esperados para la edad cronol\u00f3gica.</div>`);

    w.document.write(`<h2>3. Resultados \u2014 Puntajes Brutos</h2>`);
    w.document.write(areaHTML(recRes,REC,"\ud83d\udd0a"));
    w.document.write(areaHTML(expRes,EXP,"\ud83d\udde3\ufe0f"));
    if(allNoEval.length>0)w.document.write(`<div style="background:#fef3c7;border:1px solid #fde68a;padding:10px;border-radius:8px;font-size:12px;color:#78350f;margin:8px 0">\u26a0 ${allNoEval.length} \u00edtems sin evaluar. Resultados parciales.</div>`);

    w.document.write(`<h2>4. Observaciones</h2><div class="ob">${ev.observaciones||"Sin observaciones."}</div>`);
    w.document.write(`<div class="ft"><div class="sg"><div class="ln">Firma Profesional</div></div><div class="sg"><div class="ln">Fecha</div><p style="font-size:11px">${new Date(ev.fechaGuardado).toLocaleDateString("es-CL")}</p></div></div></body></html>`);
    w.document.close();setTimeout(()=>w.print(),500)};

  const renderClassification=(sc,label)=>{
    if(!sc||sc.pctExpected===null||sc.evaluados===0)return null;
    return <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:18,marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:14,color:"#0a3d2f",marginBottom:12}}>{"\ud83c\udfaf An\u00e1lisis Criterial \u2014 "}{label}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div style={{background:"#f0f9ff",padding:12,borderRadius:8}}>
          <div style={{fontSize:10,color:K.mt,marginBottom:4}}>{"Rendimiento seg\u00fan edad"}</div>
          <div style={{fontSize:22,fontWeight:700,color:sc.classColor}}>{sc.pctExpected}{"%"}</div>
          <div style={{fontSize:11,color:K.mt}}>{"("}{sc.logradoExpected}{"/"}{sc.expectedCount}{" \u00edtems esperados logrados)"}</div>
        </div>
        <div style={{background:"#f0f9ff",padding:12,borderRadius:8}}>
          <div style={{fontSize:10,color:K.mt,marginBottom:4}}>{"Clasificaci\u00f3n"}</div>
          <div style={{fontSize:16,fontWeight:700,color:sc.classColor}}>{sc.classification}</div>
        </div>
        {sc.devAgeLabel&&<div style={{background:"#f0f9ff",padding:12,borderRadius:8,gridColumn:"1/-1"}}>
          <div style={{fontSize:10,color:K.mt,marginBottom:4}}>{"Edad de desarrollo estimada"}</div>
          <div style={{fontSize:18,fontWeight:700,color:"#0d9488"}}>{sc.devAgeLabel}</div>
          <div style={{fontSize:11,color:K.mt}}>{"(banda m\u00e1xima con \u226580% de \u00edtems logrados)"}</div>
        </div>}
      </div>
    </div>;
  };

  const renderNoEval=(noEvalIds,items)=>{
    if(!noEvalIds||noEvalIds.length===0)return null;
    const groups=noEvalGrouped(noEvalIds,items);
    return <div style={{marginTop:12,padding:12,background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8}}>
      <div style={{fontSize:12,fontWeight:600,color:"#92400e",marginBottom:8}}>{"\u00cdtems no evaluados:"}</div>
      {Object.entries(groups).map(([band,gItems])=><div key={band} style={{marginBottom:6}}>
        <div style={{fontSize:11,fontWeight:600,color:"#78350f",marginBottom:2}}>{"Edad "}{band}{":"}</div>
        {gItems.map(it=><div key={it.id} style={{fontSize:11,color:"#78350f",paddingLeft:8,lineHeight:1.6}}>{"\u2022 "}{it.l}{" ("}{it.id}{")"}</div>)}
      </div>)}
    </div>;
  };

  const renderArea=(area,items,icon)=>{
    if(!area||!area.evaluated)return<div style={{background:"#f1f5f9",borderRadius:10,padding:20,border:"1px solid #e2e8f0",marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:15}}>{icon}{" "}{area?.label||"\u2014"}</div>
      <div style={{fontSize:14,color:K.mt,fontStyle:"italic",marginTop:6}}>{"No evaluado en esta sesi\u00f3n"}</div>
    </div>;
    return<div style={{background:"#f8faf9",borderRadius:10,padding:20,border:"1px solid #e2e8f0",marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>{icon}{" "}{area.label}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        <div><div style={{fontSize:10,color:K.mt,marginBottom:2}}>{"\u00cdtems logrados"}</div><div style={{fontSize:24,fontWeight:700,color:"#059669"}}>{area.logrado}<span style={{fontSize:14,color:K.mt}}>{"/"}{area.total}</span></div></div>
        <div><div style={{fontSize:10,color:K.mt,marginBottom:2}}>{"No logrados"}</div><div style={{fontSize:24,fontWeight:700,color:"#dc2626"}}>{area.noLogrado}</div></div>
        <div><div style={{fontSize:10,color:K.mt,marginBottom:2}}>{"Sin evaluar"}</div><div style={{fontSize:24,fontWeight:700,color:"#f59e0b"}}>{(area.noEvaluado||[]).length}</div></div>
      </div>
      {area.evaluados>0&&<div style={{marginTop:12}}>
        <div style={{fontSize:10,color:K.mt,marginBottom:4}}>{"% logro (sobre evaluados)"}</div>
        <div style={{background:"#e2e8f0",borderRadius:6,height:24,overflow:"hidden",position:"relative"}}>
          <div style={{background:area.pctLogrado>=80?"#059669":area.pctLogrado>=50?"#f59e0b":"#dc2626",height:"100%",width:`${area.pctLogrado}%`,borderRadius:6}}/>
          <span style={{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",fontSize:12,fontWeight:700}}>{area.pctLogrado}{"%"}</span>
        </div>
      </div>}
      {renderNoEval(area.noEvaluado,items)}
    </div>;
  };

  const renderDetailView=()=>{
    const mkTable=(items,label,icon,evaluated)=>{
      if(evaluated===false)return<div style={{marginBottom:20}}><h3 style={{fontSize:15,fontWeight:700,color:"#0a3d2f",marginBottom:8}}>{icon}{" "}{label}</h3><div style={{color:K.mt,fontStyle:"italic"}}>{"No evaluado"}</div></div>;
      return<div style={{marginBottom:20}}>
        <h3 style={{fontSize:15,fontWeight:700,color:"#0a3d2f",marginBottom:8}}>{icon}{" "}{label}</h3>
        <div style={{border:"1px solid #e2e8f0",borderRadius:8,overflow:"hidden"}}>
          <div style={{display:"grid",gridTemplateColumns:"60px 1fr 120px",background:"#0a3d2f",color:"#fff",padding:"8px 12px",fontSize:12,fontWeight:600}}>
            <span>{"ID"}</span><span>{"\u00cdtem"}</span><span>{"Resultado"}</span>
          </div>
          {items.map(item=>{const v=rsp[item.id];
            return<div key={item.id} style={{display:"grid",gridTemplateColumns:"60px 1fr 120px",padding:"6px 12px",fontSize:13,borderTop:"1px solid #f1f5f9",background:v===true?"#ecfdf5":v===false?"#fef2f2":"#fffbeb"}}>
              <span style={{fontWeight:600}}>{item.id}</span>
              <span>{item.l}</span>
              <span style={{fontWeight:600,color:v===true?"#059669":v===false?"#dc2626":"#92400e"}}>{v===true?"\u2714 Logrado":v===false?"\u2718 No logrado":"\u2014 Sin evaluar"}</span>
            </div>})}
        </div>
      </div>;
    };
    return<div style={{marginTop:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <h3 style={{fontSize:16,fontWeight:700,color:"#0a3d2f"}}>{"Detalle de Respuestas"}</h3>
        <button onClick={detailPdf} style={{background:"#059669",color:"#fff",border:"none",padding:"8px 18px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>{"\ud83d\udda8 Imprimir detalle"}</button>
      </div>
      {mkTable(REC,"Comprensi\u00f3n Auditiva","\ud83d\udd0a",ev.evalRec)}
      {mkTable(EXP,"Comunicaci\u00f3n Expresiva","\ud83d\udde3\ufe0f",ev.evalExp)}
    </div>;
  };

  return(<div style={{width:"100%",maxWidth:900,animation:"fi .3s ease"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
      <div><h1 style={{fontSize:24,fontWeight:700}}>{"Informe ELDI"}</h1><p style={{color:K.mt,fontSize:15,marginTop:2}}>{ev.paciente}{" \u2014 "}{fa(ev.edadMeses)}</p></div>
      <div style={{display:"flex",gap:8}}>
        {isA&&(cd?<div style={{display:"flex",gap:4}}><button onClick={()=>{onD(ev._fbId,"evaluaciones");sCD(false)}} style={{background:"#dc2626",color:"#fff",border:"none",padding:"8px 16px",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer"}}>{"S\u00ed"}</button><button onClick={()=>sCD(false)} style={{background:"#f1f5f9",border:"none",padding:"8px 16px",borderRadius:6,fontSize:12,cursor:"pointer"}}>{"No"}</button></div>:<button onClick={()=>sCD(true)} style={{background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",padding:"8px 16px",borderRadius:8,fontSize:13,cursor:"pointer"}}>{"\ud83d\uddd1 Eliminar"}</button>)}
        <button onClick={pdf} style={{background:"#dc2626",color:"#fff",border:"none",padding:"11px 22px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{"\ud83d\udcc4 PDF"}</button>
      </div>
    </div>
    <div style={{background:"#fff",borderRadius:14,padding:32,border:"1px solid #e2e8f0"}}>
      <h3 style={{fontSize:16,fontWeight:700,color:"#0a3d2f",marginBottom:14,paddingBottom:8,borderBottom:"2px solid #ccfbf1"}}>{"Datos del Paciente"}</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px 32px",marginBottom:28}}>{[["Nombre",ev.paciente],["Edad",fa(ev.edadMeses)],["F. nacimiento",ev.fechaNacimiento],["F. evaluaci\u00f3n",ev.fechaEvaluacion],["Establecimiento",ev.establecimiento||"\u2014"],["Derivado por",ev.derivadoPor||"\u2014"],["Evaluador",ev.evaluador||"\u2014"]].map(([l,v],i)=><div key={i} style={{padding:"8px 0",borderBottom:"1px solid #f1f5f9"}}><div style={{fontSize:11,color:K.mt,marginBottom:3,textTransform:"uppercase"}}>{l}</div><div style={{fontSize:15,fontWeight:600}}>{v}</div></div>)}</div>

      <h3 style={{fontSize:16,fontWeight:700,color:"#0a3d2f",marginBottom:14,paddingBottom:8,borderBottom:"2px solid #ccfbf1"}}>{"An\u00e1lisis Criterial"}</h3>
      {renderClassification(recScoring,"Comprensi\u00f3n Auditiva")}
      {renderClassification(expScoring,"Comunicaci\u00f3n Expresiva")}
      <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:10,padding:14,marginBottom:20,fontSize:12,color:"#0369a1"}}>
        <strong>{"\u2139\ufe0f Nota:"}</strong>{" La clasificaci\u00f3n se basa en un an\u00e1lisis criterial (comparaci\u00f3n con hitos esperados por edad), no en baremos normativos. Cortes: \u226590% Normal, 75-89% En Riesgo, 50-74% Retraso Moderado, <50% Retraso Significativo."}
      </div>

      <h3 style={{fontSize:16,fontWeight:700,color:"#0a3d2f",marginBottom:14,paddingBottom:8,borderBottom:"2px solid #ccfbf1"}}>{"Resultados \u2014 Puntajes Brutos"}</h3>
      {renderArea(recRes,REC,"\ud83d\udd0a")}
      {renderArea(expRes,EXP,"\ud83d\udde3\ufe0f")}

      <div style={{background:"linear-gradient(135deg,#0a3d2f,#0d9488)",borderRadius:10,padding:24,color:"#fff",marginBottom:28}}>
        <div style={{fontSize:13,opacity:.8,marginBottom:8}}>{"Resumen"}</div>
        <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
          {recRes.evaluated&&<div><span style={{fontSize:36,fontWeight:700}}>{recRes.logrado}</span><span style={{fontSize:14,opacity:.7}}>{"/"}{recRes.evaluados||recRes.total}{" Receptivo"}</span></div>}
          {expRes.evaluated&&<div><span style={{fontSize:36,fontWeight:700}}>{expRes.logrado}</span><span style={{fontSize:14,opacity:.7}}>{"/"}{expRes.evaluados||expRes.total}{" Expresivo"}</span></div>}
        </div>
        {allNoEval.length>0&&<div style={{marginTop:12,padding:"8px 12px",background:"rgba(255,255,255,.12)",borderRadius:8,fontSize:12}}>{"\u26a0 "}{allNoEval.length}{" \u00edtems sin evaluar \u2014 parcial"}</div>}
      </div>

      <button onClick={()=>setShowDetail(!showDetail)} style={{width:"100%",padding:"14px",background:showDetail?"#f1f5f9":"#0a3d2f",color:showDetail?"#1e293b":"#fff",border:"1px solid #e2e8f0",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",marginBottom:showDetail?0:20}}>{showDetail?"\u25b2 Ocultar detalle":"\u25bc Ver detalle de cada respuesta"}</button>
      {showDetail&&renderDetailView()}

      <h3 style={{fontSize:16,fontWeight:700,color:"#0a3d2f",marginBottom:10,paddingBottom:8,borderBottom:"2px solid #ccfbf1",marginTop:20}}>{"Observaciones Cl\u00ednicas"}</h3>
      <div style={{background:"#f8faf9",padding:18,borderRadius:10,fontSize:14,border:"1px solid #e2e8f0",lineHeight:1.7,minHeight:60}}>{ev.observaciones||"Sin observaciones."}</div>
    </div>
  </div>);
}
