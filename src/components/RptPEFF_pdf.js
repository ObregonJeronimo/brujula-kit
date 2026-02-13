// RptPEFF — PDF generation (extracted from RptPEFF.jsx)
import { PEFF_SECTIONS } from "../data/peffSections.js";

var fa = function(m){ return Math.floor(m/12)+" a\u00f1os, "+(m%12)+" meses"; };

var sevDesc = {
  "Adecuado":"El ni\u00f1o/a produce correctamente todos o casi todos los fonemas esperados para su edad.",
  "Leve":"Se observan errores articulatorios aislados que no comprometen significativamente la inteligibilidad del habla.",
  "Moderado":"Se observan m\u00faltiples errores articulatorios que afectan parcialmente la inteligibilidad.",
  "Moderado-Severo":"Se observan errores articulatorios frecuentes que comprometen la inteligibilidad del habla.",
  "Severo":"Se observan errores articulatorios generalizados que comprometen severamente la inteligibilidad."
};
var sevColor = {"Adecuado":"#059669","Leve":"#f59e0b","Moderado":"#ea580c","Moderado-Severo":"#dc2626","Severo":"#dc2626"};

export function openDetailPdf(ev, sd){
  var w = window.open("","_blank"); if(!w) return;
  var mkFieldRows = function(){
    var html = "";
    PEFF_SECTIONS.forEach(function(sec){
      sec.subsections.forEach(function(sub){
        if(sub.fields){ sub.fields.forEach(function(f){
          if(f.type==="select"){
            var v = sd[f.id]||"";
            var bg = v?"#ecfdf5":"#fffbeb";
            var clr = v?"#059669":"#92400e";
            html += "<tr style=\"background:"+bg+"\"><td>"+sec.title+"</td><td>"+f.label+"</td><td style=\"color:"+clr+";font-weight:600\">"+(v||"\u2014 Sin evaluar")+"</td></tr>";
          }
        }); }
        if(sub.items){ sub.items.forEach(function(item){
          var v = sd[item.id]||"";
          var res = v==="ok"?"\u2714 Correcto":v==="D"?"D \u2014 Distorsi\u00f3n":v==="O"?"O \u2014 Omisi\u00f3n":v==="S"?"S \u2014 Sustituci\u00f3n":"\u2014 Sin evaluar";
          var bg = v==="ok"?"#ecfdf5":v?"#fef2f2":"#fffbeb";
          var clr = v==="ok"?"#059669":v?"#dc2626":"#92400e";
          html += "<tr style=\"background:"+bg+"\"><td>S\u00edlaba</td><td style=\"font-weight:700;color:#7c3aed\">"+item.word+" <span style=\"font-weight:400;color:#64748b\">("+item.target+")</span></td><td style=\"color:"+clr+";font-weight:600\">"+res+"</td></tr>";
        }); }
        if(sub.discItems){ sub.discItems.forEach(function(item){
          var v = sd[item.id]||"";
          var res = v==="correcto"?"\u2714 Correcto":v==="incorrecto"?"\u2718 Incorrecto":"\u2014 Sin evaluar";
          var bg = v==="correcto"?"#ecfdf5":v?"#fef2f2":"#fffbeb";
          var clr = v==="correcto"?"#059669":v?"#dc2626":"#92400e";
          html += "<tr style=\"background:"+bg+"\"><td>Discriminaci\u00f3n</td><td>"+item.pair+"</td><td style=\"color:"+clr+";font-weight:600\">"+res+"</td></tr>";
        }); }
        if(sub.recItems){ sub.recItems.forEach(function(item){
          var v = sd[item.id]||"";
          var res = v==="reconoce"?"\u2714 Reconoce":v==="no"?"\u2718 No reconoce":"\u2014 Sin evaluar";
          var bg = v==="reconoce"?"#ecfdf5":v?"#fef2f2":"#fffbeb";
          var clr = v==="reconoce"?"#059669":v?"#dc2626":"#92400e";
          html += "<tr style=\"background:"+bg+"\"><td>Reconocimiento</td><td>"+item.target+" ("+item.contrast+")</td><td style=\"color:"+clr+";font-weight:600\">"+res+"</td></tr>";
        }); }
      });
    });
    return html;
  };
  w.document.write("<!DOCTYPE html><html><head><title>PEFF Detalle "+ev.paciente+"</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:sans-serif;color:#1e293b;padding:24px 36px;max-width:900px;margin:0 auto;line-height:1.5}h1{font-size:22px;color:#5b21b6;border-bottom:3px solid #7c3aed;padding-bottom:8px;margin-bottom:18px}table{width:100%;border-collapse:collapse;margin:8px 0 20px}th,td{border:1px solid #e2e8f0;padding:8px 12px;font-size:12px;text-align:left}th{background:#5b21b6;color:white}@media print{body{padding:12px}}</style></head><body>");
  w.document.write("<div style=\"text-align:center;margin-bottom:28px\"><h1 style=\"border:none;font-size:24px\">INFORME DETALLADO PEFF</h1><p style=\"color:#64748b;font-size:13px\">"+ev.paciente+" \u2014 "+fa(ev.edadMeses)+" \u2014 "+ev.fechaEvaluacion+"</p></div>");
  w.document.write("<table><tr><th>Secci\u00f3n</th><th>\u00cdtem</th><th>Resultado</th></tr>"+mkFieldRows()+"</table>");
  w.document.write("</body></html>"); w.document.close(); setTimeout(function(){w.print()},500);
}

export function openSummaryPdf(ev){
  var w = window.open("","_blank"); if(!w) return;
  var r = ev.resultados||{};
  var pa = r.procAnalysis||null;
  var sd = ev.seccionData||{};
  var sev = r.severity||"\u2014";
  var sc = sevColor[sev]||"#7c3aed";

  var ofaFields = [["Labios postura",sd.lab_postura],["Labios simetr\u00eda",sd.lab_simetria],["Tonicidad",sd.lab_tonicidad],["ATM postura",sd.atm_postura],["ATM apertura",sd.atm_apertura],["Lengua postura",sd.len_postura],["Lengua tama\u00f1o",sd.len_tamano],["Frenillo lingual",sd.len_frenillo],["Dentici\u00f3n",sd.die_denticion],["Angle Der.",sd.die_angle_der],["Angle Izq.",sd.die_angle_izq],["Mordida",sd.die_mordida],["Paladar altura",sd.pal_altura],["Paladar integridad",sd.pal_integridad],["Velo simetr\u00eda",sd.vel_simetria],["\u00davula",sd.vel_uvula],["Escape nasal",sd.vel_escape]].filter(function(p){return p[1]});
  var ofaHTML = ofaFields.map(function(p){return "<tr><td style=\"text-align:left;font-weight:600\">"+p[0]+"</td><td>"+p[1]+"</td></tr>"}).join("");

  var procHTML = "";
  if(pa&&pa.total>0&&pa.errors){
    procHTML = "<h2>Procesos Fonol\u00f3gicos ("+pa.total+")</h2><table><tr><th>S\u00edlaba</th><th>Producci\u00f3n</th><th>Proceso</th><th>Categor\u00eda</th></tr>";
    pa.errors.forEach(function(e){ procHTML += "<tr><td style=\"font-weight:700;color:#7c3aed\">"+e.word+"</td><td style=\"color:#dc2626\">"+(e.produccion||"\u2014")+"</td><td>"+e.procesoName+"</td><td>"+e.categoryTitle+"</td></tr>"; });
    procHTML += "</table>";
  }

  var silPctEval = r.silEval>0?Math.round((r.silOk||0)/r.silEval*100):r.silPct||0;
  var discPctEval = r.discEval>0?Math.round((r.discOk||0)/r.discEval*100):0;
  var recPctEval = r.recEval>0?Math.round((r.recOk||0)/r.recEval*100):0;

  w.document.write("<!DOCTYPE html><html><head><title>PEFF "+ev.paciente+"</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:sans-serif;color:#1e293b;padding:24px 36px;max-width:800px;margin:0 auto;line-height:1.5}h1{font-size:22px;color:#5b21b6;border-bottom:3px solid #7c3aed;padding-bottom:8px;margin-bottom:18px}h2{font-size:14px;color:#5b21b6;margin:16px 0 8px;text-transform:uppercase}table{width:100%;border-collapse:collapse;margin:8px 0}th,td{border:1px solid #e2e8f0;padding:8px 12px;font-size:13px}th{background:#5b21b6;color:white}.res{background:#ede9fe;padding:16px;border-radius:8px;margin:8px 0;font-size:13px;line-height:1.7}.ob{background:#f8faf9;padding:10px;border-radius:6px;border:1px solid #e2e8f0;font-size:13px;min-height:40px;margin:8px 0}.ft{margin-top:20px;border-top:1px solid #e2e8f0;padding-top:20px;display:flex;justify-content:space-between}.sg{text-align:center;width:44%}.sg .ln{border-top:1px solid #1e293b;margin-top:30px;padding-top:4px;font-size:12px}.sev{padding:16px;border-radius:8px;margin:12px 0;color:white;font-size:14px}.crit{background:#f0f9ff;border:1px solid #bae6fd;padding:12px;border-radius:8px;margin:12px 0;font-size:11px;color:#0369a1;line-height:1.6}@media print{body{padding:12px}}</style></head><body>");
  w.document.write("<div style=\"text-align:center;margin-bottom:28px\"><h1 style=\"border:none;font-size:24px\">INFORME PEFF</h1><p style=\"color:#64748b;font-size:13px\">Br\u00fajula KIT \u2014 Protocolo de Evaluaci\u00f3n Fon\u00e9tico-Fonol\u00f3gica</p></div>");
  w.document.write("<h2>1. Identificaci\u00f3n del Paciente</h2><table><tr><th>Nombre</th><td>"+ev.paciente+"</td><th>Edad</th><td>"+fa(ev.edadMeses)+"</td></tr><tr><th>F. Nacimiento</th><td>"+ev.fechaNacimiento+"</td><th>F. Evaluaci\u00f3n</th><td>"+ev.fechaEvaluacion+"</td></tr>"+(ev.establecimiento?"<tr><th>Establecimiento</th><td>"+ev.establecimiento+"</td><th>Derivado por</th><td>"+(ev.derivadoPor||"\u2014")+"</td></tr>":"")+"</table>");
  w.document.write("<h2>2. Examen Cl\u00ednico OFA</h2><table><tr><th>Estructura</th><th>Hallazgo</th></tr>"+(ofaHTML||"<tr><td colspan=2>\u2014 Sin hallazgos registrados</td></tr>")+"</table>");
  w.document.write("<h2>3. Resultados de la Evaluaci\u00f3n</h2><div class=\"res\"><strong>Producci\u00f3n de S\u00edlabas:</strong> "+(r.silOk||0)+" de "+(r.silTotal||0)+" s\u00edlabas producidas correctamente ("+silPctEval+"%)<br><em style=\"color:#64748b;font-size:12px\">Cantidad de s\u00edlabas que el ni\u00f1o/a produce correctamente al repetir los est\u00edmulos fon\u00e9ticos.</em><br><br><strong>Discriminaci\u00f3n Auditiva:</strong> "+(r.discOk||0)+" de "+(r.discTotal||0)+" pares discriminados correctamente ("+discPctEval+"%)<br><em style=\"color:#64748b;font-size:12px\">Capacidad para diferenciar si dos palabras suenan igual o diferente.</em><br><br><strong>Reconocimiento Fonol\u00f3gico:</strong> "+(r.recOk||0)+" de "+(r.recTotal||0)+" palabras reconocidas correctamente ("+recPctEval+"%)<br><em style=\"color:#64748b;font-size:12px\">Capacidad para identificar la palabra correcta entre dos opciones fonol\u00f3gicamente similares.</em></div>");
  w.document.write("<h2>4. Severidad</h2><div class=\"sev\" style=\"background:"+sc+"\">"+sev+"</div><p style=\"font-size:12px;color:#64748b;margin:6px 0 12px;line-height:1.5\">"+(sevDesc[sev]||"")+"</p>");
  w.document.write("<div class=\"crit\"><strong>\u2139\ufe0f Criterios de clasificaci\u00f3n:</strong><br>Adecuado: \u226598% \u00b7 Leve: 85-97% \u00b7 Moderado: 65-84% \u00b7 Moderado-Severo: 50-64% \u00b7 Severo: <50%<br>La severidad se calcula sobre el total de s\u00edlabas del protocolo.</div>");
  if(procHTML) w.document.write(procHTML);
  if(r.unevalTotal>0) w.document.write("<div style=\"background:#fffbeb;border:1px solid #fde68a;padding:12px;border-radius:6px;margin:12px 0;font-size:12px;color:#78350f\"><strong>\u26a0 "+r.unevalTotal+" \u00edtems sin evaluar:</strong> "+(r.unevalSelects>0?"Examen Cl\u00ednico OFA/Coordinaci\u00f3n: "+r.unevalSelects+". ":"")+(r.unevalPhon>0?"Producci\u00f3n de S\u00edlabas: "+r.unevalPhon+". ":"")+(r.unevalDisc>0?"Discriminaci\u00f3n: "+r.unevalDisc+". ":"")+(r.unevalRec>0?"Reconocimiento: "+r.unevalRec+".":"")+"</div>");
  w.document.write("<h2>5. Observaciones Cl\u00ednicas</h2><div class=\"ob\">"+(ev.observaciones||"Sin observaciones.")+"</div>");
  w.document.write("<div class=\"ft\"><div class=\"sg\"><div class=\"ln\">Firma Profesional</div></div><div class=\"sg\"><div class=\"ln\">Fecha</div><p style=\"font-size:11px\">"+new Date(ev.fechaGuardado).toLocaleDateString("es-CL")+"</p></div></div></body></html>");
  w.document.close(); setTimeout(function(){w.print()},500);
}
