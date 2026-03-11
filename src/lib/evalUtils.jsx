// Shared utilities for all evaluation components
// renderReportText, saveReportToDoc, handlePDFExport
import { db, doc, updateDoc } from "../firebase.js";
import { K } from "./fb.js";

export function renderReportText(text) {
  if (!text) return null;
  return text.split("\n").map(function(line, i) {
    var trimmed = line.trim();
    if (!trimmed) return <div key={i} style={{height:8}} />;
    var isTitle = /^[A-Z\u00c0-\u00dc\s\d\.\:\-]{6,}:?\s*$/.test(trimmed) || /^\d+[\.\)]\s*[A-Z]/.test(trimmed);
    if (isTitle) return <div key={i} style={{fontSize:14,fontWeight:700,color:K.sd,marginTop:14,marginBottom:4}}>{trimmed}</div>;
    return <div key={i} style={{fontSize:13,color:"#334155",lineHeight:1.7,marginBottom:1}}>{trimmed}</div>;
  });
}

export function saveReportToDoc(colName, docIdRef, report) {
  var tryUpdate = function(retries) {
    var id = docIdRef.current;
    if (id) {
      updateDoc(doc(db, colName, id), { aiReport: report, aiReportDate: new Date().toISOString() }).catch(function(e) { console.error("Error saving aiReport:", e); });
    } else if (retries > 0) {
      setTimeout(function() { tryUpdate(retries - 1); }, 1500);
    }
  };
  tryUpdate(5);
}

// Generate PDF from a ref element
// usage: handlePDFExport(reportRef, "DISC", "Juan Perez", "2026-03-11")
export function handlePDFExport(reportRef, evalType, patientName, evalDate) {
  if (!reportRef.current) return;
  reportRef.current.style.paddingBottom = "40px";
  import("html2canvas").then(function(mod) {
    return mod.default(reportRef.current, {scale:2, useCORS:true, backgroundColor:"#ffffff", scrollY:-window.scrollY, height:reportRef.current.scrollHeight, windowHeight:reportRef.current.scrollHeight+100});
  }).then(function(canvas) {
    reportRef.current.style.paddingBottom = "";
    return import("jspdf").then(function(mod) {
      var jsPDF = mod.jsPDF; var pdf = new jsPDF("p","mm","a4");
      var pW=210,pH=297,margin=10,imgW=pW-margin*2,imgH=(canvas.height*imgW)/canvas.width;
      var usableH=pH-margin*2,pos=0,page=0;
      while (pos < imgH) {
        if (page > 0) pdf.addPage();
        var srcY = Math.round((pos/imgH)*canvas.height);
        var srcH = Math.round((Math.min(usableH,imgH-pos)/imgH)*canvas.height);
        if (srcH <= 0) break;
        var sc = document.createElement("canvas"); sc.width = canvas.width; sc.height = srcH;
        sc.getContext("2d").drawImage(canvas,0,srcY,canvas.width,srcH,0,0,canvas.width,srcH);
        pdf.addImage(sc.toDataURL("image/png"),"PNG",margin,margin,imgW,(srcH*imgW)/canvas.width);
        pos += usableH; page++;
      }
      var name = (patientName || "").replace(/\s/g, "_");
      pdf.save("Informe_" + evalType.toUpperCase() + "_" + name + "_" + (evalDate || "") + ".pdf");
    });
  }).catch(function(e) { reportRef.current.style.paddingBottom = ""; console.error(e); });
}
