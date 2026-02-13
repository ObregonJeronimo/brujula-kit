import { useState, useRef } from "react";
import { REP_CATEGORIES, POSITIONS, ERROR_TYPES } from "../data/repWordsData.js";

var K = { sd:"#0a3d2f", ac:"#0d9488", mt:"#64748b", bd:"#e2e8f0" };

function ageLabel(m){ return Math.floor(m/12)+" a\u00f1os, "+(m%12)+" meses"; }

export default function RptREP({ ev, isA, onD }){
  var _cf = useState(false), confirmDel = _cf[0], sCf = _cf[1];
  var printRef = useRef(null);
  var res = ev.resultados || {};
  var byPhoneme = res.byPhoneme || {};
  var byCat = res.byCat || {};

  var handlePDF = function(){
    if(!printRef.current) return;
    import("html2canvas").then(function(mod){
      var html2canvas = mod.default;
      return html2canvas(printRef.current,{scale:2,useCORS:true,backgroundColor:"#ffffff"});
    }).then(function(canvas){
      return import("jspdf").then(function(mod){
        var jsPDF = mod.jsPDF;
        var pdf = new jsPDF("p","mm","a4");
        var imgW = 190, imgH = (canvas.height*imgW)/canvas.width;
        var pages = Math.ceil(imgH/277);
        for(var i=0;i<pages;i++){
          if(i>0) pdf.addPage();
          pdf.addImage(canvas.toDataURL("image/png"),"PNG",10,10-(i*277),imgW,imgH);
        }
        pdf.save("REP_"+((ev.paciente||"").replace(/\s/g,"_"))+"_"+ev.fechaEvaluacion+".pdf");
      });
    });
  };

  var patientAge = ev.edadMeses || 0;

  return (
    <div style={{animation:"fi .3s ease",maxWidth:900,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h1 style={{fontSize:20,fontWeight:700}}>{"\ud83d\udcdd Reporte Rep. Palabras"}</h1>
        <div style={{display:"flex",gap:8}}>
          <button onClick={handlePDF} style={{padding:"8px 16px",background:K.ac,color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>{"\ud83d\udcc4 Exportar PDF"}</button>
          {isA && !confirmDel && <button onClick={function(){sCf(true)}} style={{padding:"8px 16px",background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",borderRadius:8,fontSize:13,cursor:"pointer"}}>{"\ud83d\uddd1 Eliminar"}</button>}
          {isA && confirmDel && <div style={{display:"flex",gap:4}}>
            <button onClick={function(){onD(ev._fbId,"rep_evaluaciones")}} style={{padding:"8px 12px",background:"#dc2626",color:"#fff",border:"none",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer"}}>{"S\u00ed, eliminar"}</button>
            <button onClick={function(){sCf(false)}} style={{padding:"8px 12px",background:"#f1f5f9",border:"none",border