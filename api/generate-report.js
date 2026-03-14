// Vercel Serverless Function — generate AI fonoaudiological report using Groq
// POST /api/generate-report
// Body: { evalData, evalType }
// evalType: "eldi" | "peff" | "rep" | "disc" | "reco"

function buildEvalSummary(ev, evalType) {
  var edadAnios = Math.floor((ev.edadMeses || 0) / 12);
  var edadMesesResto = (ev.edadMeses || 0) % 12;
  var edadStr = edadAnios + " anios y " + edadMesesResto + " meses";
  var res = ev.resultados || {};

  var header = "PACIENTE: " + (ev.paciente || "N/D") + " | DNI: " + (ev.pacienteDni || "N/D") + " | Edad: " + edadStr + "\n"
    + "Fecha: " + (ev.fechaEvaluacion || "N/D") + " | Establecimiento: " + (ev.establecimiento || "N/D") + "\n"
    + "Derivado por: " + (ev.derivadoPor || "N/E") + " | Evaluador: " + (ev.evaluador || "N/D") + "\n";

  var obs = ev.observaciones || "Sin observaciones.";
  var data = "";

  if (evalType === "reco") {
    var groupResults = res.groupResults || [];
    var errorGroups = res.errorGroups || [];
    data = "Evaluacion: Reconocimiento Fonologico (PEFF-R 3.5)\n"
      + "Aciertos: " + (res.pct || 0) + "%, Contrastes: " + (res.correct || 0) + "/" + (res.total || 0) + ", Severidad: " + (res.severity || "N/C") + "\n"
      + "Criterios: Adecuado>=95%, Leve 80-94%, Moderado 60-79%, Severo<60%\n\n"
      + "GRUPOS:\n" + groupResults.map(function(g) { return g.id + " (" + g.label + "): " + g.correct + "/" + g.total; }).join("\n")
      + "\n\nGRUPOS CON DIFICULTADES:\n" + (errorGroups.length > 0 ? errorGroups.map(function(g) {
        var failed = (g.items || []).filter(function(it) { return !it.reconoce; });
        return g.id + " (" + g.label + "): " + failed.map(function(it) { return "Lam." + it.lam; }).join(", ");
      }).join("\n") : "Ninguno");

  } else if (evalType === "disc") {
    var errors = res.errors || [];
    var errorsByContrast = res.errorsByContrast || {};
    data = "Evaluacion: Discriminacion Fonologica (PEFF-R 3.4)\n"
      + "Aciertos: " + (res.pct || 0) + "%, Correctos: " + (res.correct || 0) + "/" + (res.evaluated || 0) + ", Severidad: " + (res.severity || "N/C") + "\n"
      + "Criterios: Adecuado>=95%, Leve 80-94%, Moderado 60-79%, Severo<60%\n\n"
      + "ERRORES (" + errors.length + "):\n" + errors.map(function(e) { return e.word1 + "-" + e.word2 + " (clave:" + e.clave + " resp:" + e.respuesta + ")"; }).join("\n")
      + "\n\nCONTRASTES AFECTADOS:\n" + Object.keys(errorsByContrast).join(", ");

  } else if (evalType === "rep") {
    var byPhoneme = res.byPhoneme || {};
    var errorList = res.errorList || [];
    var byCat = res.byCat || {};
    var byPosition = res.byPosition || {};
    var alteredPhonemes = Object.entries(byPhoneme).filter(function(e) { return e[1].errors > 0 && (ev.edadMeses/12) >= e[1].age; });
    data = "Evaluacion: Repeticion de Palabras (PEFF 3.2)\n"
      + "PCC: " + (res.pcc || 0) + "%, Correctos: " + (res.totalCorrect || 0) + "/" + (res.totalEvaluated || 0) + ", Errores: " + (res.totalErrors || 0) + ", Severidad: " + (res.severity || "N/C") + "\n\n"
      + "POSICIONES:\n" + ["ISPP","ISIP","CSIP","CSFP"].map(function(p) { var d = byPosition[p] || {ok:0,total:0}; return p + ": " + d.ok + "/" + d.total; }).join(", ") + "\n\n"
      + "CATEGORIAS:\n" + Object.values(byCat).map(function(c) { var pct = c.total > 0 ? Math.round((c.ok/c.total)*100) : 0; return c.title + ": " + pct + "% (" + c.ok + "/" + c.total + ")"; }).join("\n") + "\n\n"
      + "FONEMAS ALTERADOS (esperados para edad):\n" + (alteredPhonemes.length > 0 ? alteredPhonemes.map(function(e) { var ph = e[1]; return ph.phoneme + " (" + ph.errors + " err)"; }).join(", ") : "Ninguno") + "\n\n"
      + "ERRORES (" + errorList.length + "):\n" + errorList.slice(0, 20).map(function(err) { return err.phoneme + ": " + err.word + " -> " + err.produccion + " (" + err.posId + ")"; }).join("\n");

  } else if (evalType === "eldi") {
    var recRes = ev.recRes || res.recRes || {};
    var expRes = ev.expRes || res.expRes || {};
    data = "Evaluacion: ELDI (Evaluacion del Lenguaje y Desarrollo Infantil)\n"
      + "Comprension Auditiva: " + (ev.brutoReceptivo || 0) + " items logrados" + (recRes.classification ? ", Clasificacion: " + recRes.classification : "") + "\n"
      + "Comunicacion Expresiva: " + (ev.brutoExpresivo || 0) + " items logrados" + (expRes.classification ? ", Clasificacion: " + expRes.classification : "") + "\n"
      + "Evaluado receptivo: " + (ev.evalRec !== false ? "Si" : "No") + ", Evaluado expresivo: " + (ev.evalExp !== false ? "Si" : "No") + "\n"
      + (recRes.devAgeLabel ? "Edad desarrollo receptivo: " + recRes.devAgeLabel + "\n" : "")
      + (expRes.devAgeLabel ? "Edad desarrollo expresivo: " + expRes.devAgeLabel + "\n" : "");

  } else if (evalType === "peff") {
    var seccionData = ev.seccionData || {};
    data = "Evaluacion: PEFF (Protocolo Fonetico-Fonologico)\n";
    Object.keys(seccionData).forEach(function(secKey) {
      var sec = seccionData[secKey];
      if (sec && sec.label) {
        data += sec.label + ": " + (sec.summary || JSON.stringify(sec.results || {}).substring(0, 100)) + "\n";
      }
    });
  }

  return { header: header, data: data, obs: obs };
}

// Simple in-memory rate limiter (per serverless instance)
var rateLimitMap = {};
var RATE_LIMIT_WINDOW = 60000; // 1 minute
var RATE_LIMIT_MAX = 5; // max 5 requests per minute per IP

function checkRateLimit(ip) {
  var now = Date.now();
  if (!rateLimitMap[ip]) rateLimitMap[ip] = [];
  // Clean old entries
  rateLimitMap[ip] = rateLimitMap[ip].filter(function(t) { return now - t < RATE_LIMIT_WINDOW; });
  if (rateLimitMap[ip].length >= RATE_LIMIT_MAX) return false;
  rateLimitMap[ip].push(now);
  // Clean map periodically to prevent memory leak
  if (Object.keys(rateLimitMap).length > 1000) rateLimitMap = {};
  return true;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Rate limit check
  var clientIp = req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || "unknown";
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: "Demasiadas solicitudes. Esperá un momento antes de intentar de nuevo." });
  }

  var GROQ_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_KEY) {
    return res.status(500).json({ error: "GROQ_API_KEY no est\u00e1 configurada en las variables de entorno de Vercel." });
  }

  try {
    var body = req.body;
    if (!body || !body.evalData) {
      return res.status(400).json({ error: "Missing evalData" });
    }

    var ev = body.evalData;
    var evalType = body.evalType || "reco";
    var reportMode = body.reportMode || "clinico";

    var summary = buildEvalSummary(ev, evalType);

    var systemPrompt = "Eres un fonoaudiologo clinico profesional. Genera informes breves y clinicos.\n\nREGLAS ESTRICTAS:\n- Informe BREVE: maximo 15-20 lineas.\n- NO incluyas porcentajes ni numeros de resultados.\n- NO incluyas tablas ni estadisticas.\n- Solo usa los datos para redactar CONCLUSIONES CLINICAS.\n- Lenguaje profesional fonoaudiologico.\n- Facil de leer, adecuado para escuela, obra social o expediente.\n- Espanol rioplatense profesional.\n- Sin markdown, sin asteriscos, sin simbolos especiales.\n- Titulos de seccion en MAYUSCULAS seguidos de dos puntos.";

    var userPrompt = "";

    if (reportMode === "consolidado") {
      userPrompt = "Sos una fonoaudiologa con mas de 20 anos de experiencia clinica en trastornos de los sonidos del habla y del lenguaje infantil. "
        + "Con los siguientes datos de MULTIPLES evaluaciones fonoaudiologicas del mismo paciente, redacta un INFORME FONOAUDIOLOGICO CONSOLIDADO de nivel profesional.\n\n"
        + "Estructura EXACTA (usar estos titulos tal cual):\n\n"
        + "ANALISIS FONETICO-FONOLOGICO INTEGRAL\n"
        + "INFORME FONOAUDIOLOGICO CONSOLIDADO\n\n"
        + "DATOS DEL PACIENTE:\n"
        + "Nombre, DNI, edad cronologica en anos y meses, fecha del informe.\n\n"
        + "MOTIVO DE EVALUACION:\n"
        + "Describir por que se realizo la bateria de evaluaciones, contexto de derivacion y objetivo clinico.\n\n"
        + "INSTRUMENTOS DE EVALUACION APLICADOS:\n"
        + "Listar cada prueba aplicada con su nombre completo y fecha de administracion. No usar guiones, redactar en prosa.\n\n"
        + "ANALISIS E INTERPRETACION DE RESULTADOS:\n"
        + "Este es el nucleo del informe. Integrar los hallazgos de TODAS las evaluaciones en una narrativa clinica cohesiva. "
        + "Describir: nivel fonetico (produccion de fonemas, tipos de errores articulatorios observados, consistencia), "
        + "nivel fonologico (procesos fonologicos activos, patrones sistematicos, contrastes afectados), "
        + "percepcion auditiva (discriminacion y reconocimiento fonologico), "
        + "funciones orofaciales si se evaluaron (tono, movilidad, estructura de OFA). "
        + "Relacionar los hallazgos entre si: por ejemplo, si los errores de produccion se correlacionan con dificultades perceptivas. "
        + "Usar terminologia tecnica apropiada (procesos de simplificacion fonologica, PCC, pares minimos, rasgos distintivos, etc.) pero sin incluir porcentajes numericos.\n\n"
        + "DIAGNOSTICO FONOAUDIOLOGICO:\n"
        + "Diagnostico clinico preciso usando nomenclatura actualizada (ej: Trastorno de los Sonidos del Habla de origen fonologico, "
        + "Trastorno Fonetico, Trastorno Fonologico, Trastorno Mixto, Apraxia del Habla Infantil, Disartria, etc.). "
        + "Especificar grado de severidad con justificacion clinica. Si corresponde, mencionar diagnosticos diferenciales considerados.\n\n"
        + "IMPACTO FUNCIONAL:\n"
        + "Describir como las dificultades observadas impactan en la inteligibilidad del habla, la comunicacion funcional, "
        + "la participacion en actividades escolares y sociales, y el desarrollo de la lectoescritura.\n\n"
        + "PLAN TERAPEUTICO SUGERIDO:\n"
        + "Objetivos terapeuticos especificos y priorizados (corto, mediano y largo plazo). "
        + "Enfoque terapeutico recomendado (ej: enfoque fonologico contrastivo, terapia de complejidad, enfoque motor del habla). "
        + "Frecuencia y duracion estimada del tratamiento. Orientaciones para la familia y la escuela.\n\n"
        + "PRONOSTICO:\n"
        + "Pronostico clinico fundamentado en la evidencia recogida, considerando factores como edad del paciente, "
        + "estimulabilidad, consistencia de los errores, motivacion y entorno familiar.\n\n"
        + "DIRECTRICES DE REDACCION:\n"
        + "- Escribir en tercera persona, tiempo presente.\n"
        + "- Tono clinico formal pero accesible para otros profesionales de salud y educacion.\n"
        + "- NO usar markdown, asteriscos, ni formato especial. Solo texto plano con los titulos en mayusculas.\n"
        + "- NO incluir porcentajes numericos.\n"
        + "- NO usar guiones para listas, redactar todo en prosa fluida.\n"
        + "- Espanol rioplatense profesional.\n"
        + "- Extension: entre 35 y 50 lineas.\n\n"
        + summary.header + "\n" + summary.data + "\nOBS: " + summary.obs;
    } else {
      userPrompt = "Sos una fonoaudiologa con mas de 20 anos de experiencia clinica. "
        + "Con los siguientes datos de una evaluacion fonoaudiologica, redacta un INFORME FONOAUDIOLOGICO profesional.\n\n"
        + "Estructura EXACTA (usar estos titulos tal cual):\n\n"
        + "ANALISIS FONETICO-FONOLOGICO\n"
        + "INFORME FONOAUDIOLOGICO\n\n"
        + "DATOS DEL PACIENTE:\n"
        + "Nombre, DNI, edad cronologica, fecha de evaluacion, derivado por, evaluador.\n\n"
        + "INSTRUMENTO DE EVALUACION:\n"
        + "Nombre de la prueba aplicada y breve descripcion de que evalua.\n\n"
        + "HALLAZGOS CLINICOS:\n"
        + "Describir en prosa fluida los resultados observados: que aspectos se encuentran conservados y cuales presentan dificultades. "
        + "Usar terminologia tecnica apropiada (fonemas, posiciones silabicas, procesos fonologicos, rasgos distintivos, etc.). "
        + "Relacionar los hallazgos con lo esperado para la edad cronologica del paciente.\n\n"
        + "DIAGNOSTICO FONOAUDIOLOGICO:\n"
        + "Diagnostico clinico preciso con nomenclatura actualizada y grado de severidad justificado.\n\n"
        + "ORIENTACIONES:\n"
        + "Recomendaciones clinicas breves: necesidad de intervencion, enfoque sugerido, orientaciones para familia/escuela.\n\n"
        + "DIRECTRICES: Tercera persona, tiempo presente. Tono clinico formal. "
        + "NO usar markdown, asteriscos, guiones para listas. Todo en prosa fluida. "
        + "NO incluir porcentajes. Espanol rioplatense. Entre 15 y 25 lineas.\n\n"
        + summary.header + "\n" + summary.data + "\nOBS: " + summary.obs;
    }

    console.log("[generate-report] Calling Groq for", evalType, reportMode, "patient:", ev.paciente || "?");

    var groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + GROQ_KEY
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 1500,
        temperature: 0.3
      })
    });

    if (!groqRes.ok) {
      var errBody = await groqRes.text();
      var statusCode = groqRes.status;
      console.error("[generate-report] Groq error:", statusCode, errBody.substring(0, 400));
      var parsedErr = null;
      try { parsedErr = JSON.parse(errBody); } catch(e) {}
      var errMsg = (parsedErr && parsedErr.error && parsedErr.error.message) || errBody.substring(0, 300);
      if (statusCode === 429) return res.status(502).json({ error: "Limite de Groq excedido. Espera unos segundos e intenta de nuevo." });
      if (statusCode === 401) return res.status(502).json({ error: "API Key de Groq invalida." });
      return res.status(502).json({ error: "Error de Groq [" + statusCode + "]: " + errMsg });
    }

    var groqData = await groqRes.json();
    var reportText = "";
    if (groqData.choices && groqData.choices.length > 0 && groqData.choices[0].message) {
      reportText = groqData.choices[0].message.content || "";
    }
    if (!reportText) return res.status(500).json({ error: "Respuesta vacia. Intenta de nuevo." });

    reportText = reportText.replace(/\*\*/g, "").replace(/^#+\s*/gm, "").replace(/^[-*]\s+/gm, "- ");

    console.log("[generate-report] OK -", evalType, reportMode, "tokens:", groqData.usage ? groqData.usage.total_tokens : "?");

    return res.status(200).json({
      success: true,
      report: reportText,
      model: groqData.model || "llama-3.1-8b-instant",
      tokens: groqData.usage || null
    });
  } catch (err) {
    console.error("[generate-report] EXCEPTION:", err);
    return res.status(500).json({ error: "Error interno: " + err.message });
  }
}
