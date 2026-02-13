// RptELDI — PDF generation (extracted from RptELDI.jsx)
import { REC, EXP } from "../data/eldiItems.js";
import { fa, noEvalGrouped } from "./NewELDI_scoring.js";

export function openDetailPdf(ev, rsp){
  var w = window.open("","_blank"); if(!w) return;
  var mkRows = function(items, label){
    var html = "<h2>"+label+"</h2><table><tr><th style=\"width:50px\">ID</th><th>\u00cdtem</th><th style=\"width:120px\">Resultado</th></tr>";
    items.forEach(function(item){
      var v = rsp[item.id];
      var res = v===true?"\u2714 Logrado":v===false?"\u2718 No logrado":"\u2014 Sin evaluar";
      var bg = v===true?"#ecfdf5":v===false?"#fef2f2":"#fffbeb";
      var clr = v===true?"#059669":v===false?"#dc2626":"#92400e";
      html += "<tr style=\"background:"+bg+"\"><td style=\"font-weight:600\">"+item.id+"</td><td>"+item.l+"</td><td style=\"color:"+clr+";font-weight:600\">"+res+"</td></tr>";
    });
    html += "</table>"; return html;
  };
  w.document.write("<!DOCTYPE html><html><head><title>ELDI Detalle "+ev.paciente+"</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:sans-serif;color:#1e293b;padding:24px 36px;max-width:900px;margin:0 auto;line-height:1.5}h1{font-size:22px;color:#0a3d2f;border-bottom:3px solid #0d9488;padding-bottom:8px;margin-bottom:18px}h2{font-size:14px;color:#0a3d2f;margin:16px 0 8px;text-transform:uppercase}table{width:100%;border-collapse:collapse;margin:8px 0 20px}th,td{border:1px solid #e2e8f0;padding:8px 12px;font-size:12px;text-align:left}th{background:#0a3d2f;color:white}@media print{body{padding:12px 20px}}</style></head><body>");
  w.document.write("<div style=\"text-align:center;margin-bottom:28px\"><h1 style=\"border:none;font-size:24px\">INFORME DETALLADO ELDI</h1><p style=\"color:#64748b;font-size:13px\">"+ev.paciente+" \u2014 "+fa(ev.edadMeses)+" \u2014 "+ev.fechaEvaluacion+"</p></div>");
  if(ev.evalRec!==false) w.document.write(mkRows(REC,"\ud83d\udd0a Comprensi\u00f3n Auditiva (Receptivo)"));
  if(ev.evalExp!==false) w.document.write(mkRows(EXP,"\ud83d\udde3\ufe0f Comunicaci\u00f3n Expresiva"));
  w.document.write("</body></html>"); w.document.close(); setTimeout(function(){w.print()},500);
}

export function openSummaryPdf(ev, recScoring, expScoring, recRes, expRes, allNoEval){
  var w = window.open("","_blank"); if(!w) return;

  var classHTML = function(sc, label){
    if(!sc||sc.pctExpected===null||sc.evaluados===0) return "";
    var devAge = sc.devAgeLabel ? "<div style=\"margin-top:8px\"><strong>Edad de desarrollo estimada:</strong> "+sc.devAgeLabel+"</div>" : "";
    return "<div style=\"background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:14px;margin:10px 0\"><div style=\"font-weight:700;font-size:13px;color:#0a3d2f;margin-bottom:8px\">\ud83c\udfaf An\u00e1lisis Criterial \u2014 "+label+"</div><div style=\"display:flex;gap:20px;flex-wrap:wrap\"><div><strong>Rendimiento seg\u00fan edad:</strong> <span style=\"color:"+sc.classColor+";font-weight:700;font-size:16px\">"+sc.pctExpected+"%</span> <span style=\"font-size:11px;color:#64748b\">("+sc.logradoExpected+"/"+sc.expectedCount+" \u00edtems esperados)</span></div><div><strong>Clasificaci\u00f3n:</strong> <span style=\"color:"+sc.classColor+";font-weight:700\">"+sc.classification+"</span></div></div>"+devAge+"</div>";
  };

  var noEvalHTML = function(noEvalIds, items){
    if(noEvalIds.length===0) return "";
    var groups = noEvalGrouped(noEvalIds, items);
    var html = "<div style=\"margin-top:8px;padding:10px;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;font-size:11px\"><strong style=\"color:#92400e\">\u00cdtems no evaluados:</strong>";
    Object.entries(groups).forEach(function(entry){
      html += "<div style=\"margin-top:4px\"><strong>Edad "+entry[0]+":</strong> ";
      html += entry[1].map(function(it){return it.l+" ("+it.id+")"}).join(", ");
      html += "</div>";
    });
    html += "</div>"; return html;
  };

  var areaHTML = function(area, items, icon){
    if(!area||!area.evaluated) return "<div style=\"background:#f1f5f9;padding:16px;border-radius:8px;margin:8px 0\"><strong>"+icon+" "+(area?area.label:"\u2014")+"</strong>: No evaluado</div>";
    return "<div style=\"background:#f8faf9;padding:16px;border-radius:8px;border:1px solid #e2e8f0;margin:8px 0\"><div style=\"font-weight:700;margin-bottom:10px\">"+icon+" "+area.label+"</div><table style=\"width:100%\"><tr><th>\u00cdtems logrados</th><th>No logrados</th><th>Sin evaluar</th><th>% Logro</th></tr><tr><td style=\"color:#059669;font-weight:700;font-size:18px\">"+area.logrado+"/"+area.total+"</td><td style=\"color:#dc2626;font-weight:700\">"+area.noLogrado+"</td><td style=\"color:#f59e0b;font-weight:700\">"+area.noEvaluado.length+"</td><td style=\"font-weight:700;font-size:18px\">"+(area.pctLogrado!==null?area.pctLogrado+"%":"\u2014")+"</td></tr></table>"+noEvalHTML(area.noEvaluado,items)+"</div>";
  };

  w.document.write("<!DOCTYPE html><html><head><title>ELDI "+ev.paciente+"</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:sans-serif;color:#1e293b;padding:24px 36px;max-width:800px;margin:0 auto;line-height:1.5}h1{font-size:22px;color:#0a3d2f;border-bottom:3px solid #0d9488;padding-bottom:8px;margin-bottom:18px}h2{font-size:14px;color:#0a3d2f;margin:16px 0 8px;text-transform:uppercase}table{width:100%;border-collapse:collapse;margin:8px 0}th,td{border:1px solid #e2e8f0;padding:10px 14px;text-align:center;font-size:13px}th{background:#0a3d2f;color:white}.g{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px}.f{font-size:13px;padding:6px 0;border-bottom:1px solid #f1f5f9}.f strong{color:#475569}.ob{background:#f8faf9;padding:10px;border-radius:6px;border:1px solid #e2e8f0;font-size:13px;min-height:50px;margin:8px 0}.ft{margin-top:20px;border-top:1px solid #e2e8f0;padding-top:20px;display:flex;justify-content:space-between}.sg{text-align:center;width:44%}.sg .ln{border-top:1px solid #1e293b;margin-top:30px;padding-top:4px;font-size:12px}@media print{body{padding:12px 20px;font-size:12px}h1{font-size:18px}table th,table td{padding:6px 8px;font-size:11px}}</style></head><body>");
  w.document.write("<div style=\"text-align:center;margin-bottom:28px\"><h1 style=\"border:none;font-size:24px\">INFORME ELDI</h1><p style=\"color:#64748b;font-size:13px\">Evaluaci\u00f3n del Lenguaje y Desarrollo Infantil \u2014 Br\u00fajula KIT</p></div>");
  w.document.write("<h2>1. Identificaci\u00f3n</h2><div class=\"g\"><div class=\"f\"><strong>Nombre:</strong> "+ev.paciente+"</div><div class=\"f\"><strong>Edad:</strong> "+fa(ev.edadMeses)+"</div><div class=\"f\"><strong>F.nac:</strong> "+ev.fechaNacimiento+"</div><div class=\"f\"><strong>F.eval:</strong> "+ev.fechaEvaluacion+"</div><div class=\"f\"><strong>Establ:</strong> "+(ev.establecimiento||"\u2014")+"</div><div class=\"f\"><strong>Derivado:</strong> "+(ev.derivadoPor||"\u2014")+"</div><div class=\"f\"><strong>Evaluador:</strong> "+(ev.evaluador||"\u2014")+"</div></div>");
  w.document.write("<h2>2. An\u00e1lisis Criterial</h2>");
  w.document.write(classHTML(recScoring,"Comprensi\u00f3n Auditiva"));
  w.document.write(classHTML(expScoring,"Comunicaci\u00f3n Expresiva"));
  w.document.write("<div style=\"font-size:10px;color:#64748b;margin:8px 0;padding:8px;background:#f8faf9;border-radius:6px\"><strong>Criterios:</strong> \u226590% = Dentro de L\u00edmites Normales | 75-89% = En Riesgo / Retraso Leve | 50-74% = Retraso Moderado | <50% = Retraso Significativo. Basado en \u00edtems esperados para la edad cronol\u00f3gica.</div>");
  w.document.write("<h2>3. Resultados \u2014 Puntajes Brutos</h2>");
  w.document.write(areaHTML(recRes,REC,"\ud83d\udd0a"));
  w.document.write(areaHTML(expRes,EXP,"\ud83d\udde3\ufe0f"));
  if(allNoEval.length>0) w.document.write("<div style=\"background:#fef3c7;border:1px solid #fde68a;padding:10px;border-radius:8px;font-size:12px;color:#78350f;margin:8px 0\">\u26a0 "+allNoEval.length+" \u00edtems sin evaluar. Resultados parciales.</div>");
  w.document.write("<h2>4. Observaciones</h2><div class=\"ob\">"+(ev.observaciones||"Sin observaciones.")+"</div>");
  w.document.write("<div class=\"ft\"><div class=\"sg\"><div class=\"ln\">Firma Profesional</div></div><div class=\"sg\"><div class=\"ln\">Fecha</div><p style=\"font-size:11px\">"+new Date(ev.fechaGuardado).toLocaleDateString("es-CL")+"</p></div></div></body></html>");
  w.document.close(); setTimeout(function(){w.print()},500);
}
