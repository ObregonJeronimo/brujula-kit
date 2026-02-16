import { useState } from "react";
import { REC, EXP } from "../data/eldiItems.js";
import { calcScoring, fa, noEvalGrouped } from "./NewELDI_scoring.js";
import { openDetailPdf, openSummaryPdf } from "./RptELDI_pdf.js";

var K = { mt: "#64748b" };

export default function RptELDI({ev,onD}){
  var _cd = useState(false), cd = _cd[0], sCD = _cd[1];
  var _sd = useState(false), showDetail = _sd[0], setShowDetail = _sd[1];
  var rsp = ev.respuestas || {};
  var ageMo = ev.edadMeses || 0;

  var recScoring = ev.evalRec!==false ? calcScoring(REC,rsp,ageMo) : null;
  var expScoring = ev.evalExp!==false ? calcScoring(EXP,rsp,ageMo) : null;

  var recRes = ev.evalRec!==false ? Object.assign({label:"Comprensi\u00f3n Auditiva",evaluated:true},recScoring||{}) :
    {label:"Comprensi\u00f3n Auditiva",evaluated:false,logrado:0,noLogrado:0,noEvaluado:REC.map(function(i){return i.id}),total:55};
  var expRes = ev.evalExp!==false ? Object.assign({label:"Comunicaci\u00f3n Expresiva",evaluated:true},expScoring||{}) :
    {label:"Comunicaci\u00f3n Expresiva",evaluated:false,logrado:0,noLogrado:0,noEvaluado:EXP.map(function(i){return i.id}),total:55};
  var allNoEval = [].concat(recRes.evaluated?(recRes.noEvaluado||[]):[]).concat(expRes.evaluated?(expRes.noEvaluado||[]):[]);

  var renderClassification = function(sc,label){
    if(!sc||sc.pctExpected===null||sc.evaluados===0) return null;
    return <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:18,marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:14,color:"#0a3d2f",marginBottom:12}}>{"\ud83c\udfaf An\u00e1lisis Criterial \u2014 "+label}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div style={{background:"#f0f9ff",padding:12,borderRadius:8}}>
          <div style={{fontSize:10,color:K.mt,marginBottom:4}}>{"Rendimiento seg\u00fan edad"}</div>
          <div style={{fontSize:22,fontWeight:700,color:sc.classColor}}>{sc.pctExpected+"%"}</div>
          <div style={{fontSize:11,color:K.mt}}>{"("+sc.logradoExpected+"/"+sc.expectedCount+" \u00edtems esperados logrados)"}</div>
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

  var renderNoEval = function(noEvalIds,items){
    if(!noEvalIds||noEvalIds.length===0) return null;
    var groups = noEvalGrouped(noEvalIds,items);
    return <div style={{marginTop:12,padding:12,background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8}}>
      <div style={{fontSize:12,fontWeight:600,color:"#92400e",marginBottom:8}}>{"\u00cdtems no evaluados:"}</div>
      {Object.entries(groups).map(function(e){return <div key={e[0]} style={{marginBottom:6}}>
        <div style={{fontSize:11,fontWeight:600,color:"#78350f",marginBottom:2}}>{"Edad "+e[0]+":"}</div>
        {e[1].map(function(it){return <div key={it.id} style={{fontSize:11,color:"#78350f",paddingLeft:8,lineHeight:1.6}}>{"\u2022 "+it.l+" ("+it.id+")"}</div>})}
      </div>})}
    </div>;
  };

  var renderArea = function(area,items,icon){
    if(!area||!area.evaluated) return <div style={{background:"#f1f5f9",borderRadius:10,padding:20,border:"1px solid #e2e8f0",marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:15}}>{icon+" "+(area?area.label:"\u2014")}</div>
      <div style={{fontSize:14,color:K.mt,fontStyle:"italic",marginTop:6}}>{"No evaluado en esta sesi\u00f3n"}</div>
    </div>;
    return <div style={{background:"#f8faf9",borderRadius:10,padding:20,border:"1px solid #e2e8f0",marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>{icon+" "+area.label}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
        <div><div style={{fontSize:10,color:K.mt,marginBottom:2}}>{"\u00cdtems logrados"}</div><div style={{fontSize:24,fontWeight:700,color:"#059669"}}>{area.logrado}<span style={{fontSize:14,color:K.mt}}>{"/"+area.total}</span></div></div>
        <div><div style={{fontSize:10,color:K.mt,marginBottom:2}}>{"No logrados"}</div><div style={{fontSize:24,fontWeight:700,color:"#dc2626"}}>{area.noLogrado}</div></div>
        <div><div style={{fontSize:10,color:K.mt,marginBottom:2}}>{"Sin evaluar"}</div><div style={{fontSize:24,fontWeight:700,color:"#f59e0b"}}>{(area.noEvaluado||[]).length}</div></div>
      </div>
      {area.evaluados>0&&<div style={{marginTop:12}}>
        <div style={{fontSize:10,color:K.mt,marginBottom:4}}>{"% logro (sobre evaluados)"}</div>
        <div style={{background:"#e2e8f0",borderRadius:6,height:24,overflow:"hidden",position:"relative"}}>
          <div style={{background:area.pctLogrado>=80?"#059669":area.pctLogrado>=50?"#f59e0b":"#dc2626",height:"100%",width:area.pctLogrado+"%",borderRadius:6}}/>
          <span style={{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",fontSize:12,fontWeight:700}}>{area.pctLogrado+"%"}</span>
        </div>
      </div>}
      {renderNoEval(area.noEvaluado,items)}
    </div>;
  };

  var renderDetailView = function(){
    var mkTable = function(items,label,icon,evaluated){
      if(evaluated===false) return <div style={{marginBottom:20}}><h3 style={{fontSize:15,fontWeight:700,color:"#0a3d2f",marginBottom:8}}>{icon+" "+label}</h3><div style={{color:K.mt,fontStyle:"italic"}}>{"No evaluado"}</div></div>;
      return <div style={{marginBottom:20}}>
        <h3 style={{fontSize:15,fontWeight:700,color:"#0a3d2f",marginBottom:8}}>{icon+" "+label}</h3>
        <div style={{border:"1px solid #e2e8f0",borderRadius:8,overflow:"hidden"}}>
          <div style={{display:"grid",gridTemplateColumns:"60px 1fr 120px",background:"#0a3d2f",color:"#fff",padding:"8px 12px",fontSize:12,fontWeight:600}}>
            <span>{"ID"}</span><span>{"\u00cdtem"}</span><span>{"Resultado"}</span>
          </div>
          {items.map(function(item){var v=rsp[item.id];
            return <div key={item.id} style={{display:"grid",gridTemplateColumns:"60px 1fr 120px",padding:"6px 12px",fontSize:13,borderTop:"1px solid #f1f5f9",background:v===true?"#ecfdf5":v===false?"#fef2f2":"#fffbeb"}}>
              <span style={{fontWeight:600}}>{item.id}</span>
              <span>{item.l}</span>
              <span style={{fontWeight:600,color:v===true?"#059669":v===false?"#dc2626":"#92400e"}}>{v===true?"\u2714 Logrado":v===false?"\u2718 No logrado":"\u2014 Sin evaluar"}</span>
            </div>})}
        </div>
      </div>;
    };
    return <div style={{marginTop:20}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <h3 style={{fontSize:16,fontWeight:700,color:"#0a3d2f"}}>{"Detalle de Respuestas"}</h3>
        <button onClick={function(){openDetailPdf(ev,rsp)}} style={{background:"#059669",color:"#fff",border:"none",padding:"8px 18px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>{"\ud83d\udda8 Imprimir detalle"}</button>
      </div>
      {mkTable(REC,"Comprensi\u00f3n Auditiva","\ud83d\udd0a",ev.evalRec)}
      {mkTable(EXP,"Comunicaci\u00f3n Expresiva","\ud83d\udde3\ufe0f",ev.evalExp)}
    </div>;
  };

  return <div style={{width:"100%",maxWidth:900,animation:"fi .3s ease"}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
      <div><h1 style={{fontSize:24,fontWeight:700}}>{"Informe ELDI"}</h1><p style={{color:K.mt,fontSize:15,marginTop:2}}>{ev.paciente+" \u2014 "+fa(ev.edadMeses)}</p></div>
      <div style={{display:"flex",gap:8}}>
        {cd
          ?<div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"14px 20px",display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
            <div style={{fontSize:13,fontWeight:600,color:"#dc2626",textAlign:"center"}}>{"\u00bfEst\u00e1 seguro que desea eliminar?"}</div>
            <div style={{fontSize:12,color:"#64748b",textAlign:"center"}}>{"Esta acci\u00f3n es irreversible"}</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={function(){onD(ev._fbId,"evaluaciones");sCD(false)}} style={{background:"#dc2626",color:"#fff",border:"none",padding:"8px 20px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>{"S\u00ed, eliminar"}</button>
              <button onClick={function(){sCD(false)}} style={{background:"#f1f5f9",border:"1px solid #e2e8f0",padding:"8px 20px",borderRadius:8,fontSize:13,cursor:"pointer",color:"#64748b"}}>Cancelar</button>
            </div>
          </div>
          :<><button onClick={function(){openSummaryPdf(ev,recScoring,expScoring,recRes,expRes,allNoEval)}} style={{background:"#dc2626",color:"#fff",border:"none",padding:"11px 22px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{"\ud83d\udcc4 PDF"}</button>
            <button onClick={function(){sCD(true)}} style={{background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",padding:"11px 22px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{"Eliminar"}</button>
          </>
        }
      </div>
    </div>
    <div style={{background:"#fff",borderRadius:14,padding:32,border:"1px solid #e2e8f0"}}>
      <h3 style={{fontSize:16,fontWeight:700,color:"#0a3d2f",marginBottom:14,paddingBottom:8,borderBottom:"2px solid #ccfbf1"}}>{"Datos del Paciente"}</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px 32px",marginBottom:28}}>{[["Nombre",ev.paciente],["Edad",fa(ev.edadMeses)],["F. nacimiento",ev.fechaNacimiento],["F. evaluaci\u00f3n",ev.fechaEvaluacion],["Establecimiento",ev.establecimiento||"\u2014"],["Derivado por",ev.derivadoPor||"\u2014"],["Evaluador",ev.evaluador||"\u2014"]].map(function(pair,i){return <div key={i} style={{padding:"8px 0",borderBottom:"1px solid #f1f5f9"}}><div style={{fontSize:11,color:K.mt,marginBottom:3,textTransform:"uppercase"}}>{pair[0]}</div><div style={{fontSize:15,fontWeight:600}}>{pair[1]}</div></div>})}</div>

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
          {recRes.evaluated&&<div><span style={{fontSize:36,fontWeight:700}}>{recRes.logrado}</span><span style={{fontSize:14,opacity:.7}}>{"/"+(recRes.evaluados||recRes.total)+" Receptivo"}</span></div>}
          {expRes.evaluated&&<div><span style={{fontSize:36,fontWeight:700}}>{expRes.logrado}</span><span style={{fontSize:14,opacity:.7}}>{"/"+(expRes.evaluados||expRes.total)+" Expresivo"}</span></div>}
        </div>
        {allNoEval.length>0&&<div style={{marginTop:12,padding:"8px 12px",background:"rgba(255,255,255,.12)",borderRadius:8,fontSize:12}}>{"\u26a0 "+allNoEval.length+" \u00edtems sin evaluar \u2014 parcial"}</div>}
      </div>

      <button onClick={function(){setShowDetail(!showDetail)}} style={{width:"100%",padding:"14px",background:showDetail?"#f1f5f9":"#0a3d2f",color:showDetail?"#1e293b":"#fff",border:"1px solid #e2e8f0",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",marginBottom:showDetail?0:20}}>{showDetail?"\u25b2 Ocultar detalle":"\u25bc Ver detalle de cada respuesta"}</button>
      {showDetail&&renderDetailView()}

      <h3 style={{fontSize:16,fontWeight:700,color:"#0a3d2f",marginBottom:10,paddingBottom:8,borderBottom:"2px solid #ccfbf1",marginTop:20}}>{"Observaciones Cl\u00ednicas"}</h3>
      <div style={{background:"#f8faf9",padding:18,borderRadius:10,fontSize:14,border:"1px solid #e2e8f0",lineHeight:1.7,minHeight:60}}>{ev.observaciones||"Sin observaciones."}</div>
    </div>
  </div>;
}
