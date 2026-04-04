// Vercel Serverless Function — generate AI fonoaudiological report using Groq
// POST /api/generate-report
// Body: { evalData, evalType }
// evalType: "eldi" | "peff" | "rep" | "disc" | "reco" | "ofa" | "fon"

function buildEvalSummary(ev, evalType) {
  var edadAnios = Math.floor((ev.edadMeses || 0) / 12);
  var edadMesesResto = (ev.edadMeses || 0) % 12;
  var edadStr = edadAnios + " anios y " + edadMesesResto + " meses";
  var res = ev.resultados || {};

  var header = "PACIENTE: " + (ev.paciente || "N/D") + " | DNI: " + (ev.pacienteDni || "N/D") + " | Edad: " + edadStr + "\n"
    + "Fecha: " + (ev.fechaEvaluacion || "N/D") + " | Establecimiento: " + (ev.establecimiento || "N/D") + "\n"
    + "Derivado por: " + (ev.derivadoPor || "N/E") + " | Evaluador: " + (ev.evaluador || "N/D") + "\n"
    + (ev.therapistName ? "Profesional: " + ev.therapistName + (ev.therapistLicense ? " | Mat: " + ev.therapistLicense : "") + "\n" : "");

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

  } else if (evalType === "ofa") {
    var ofaData = ev.seccionData || {};
    data = "Evaluacion: Examen Clinico de Organos Fonoarticulatorios (EOF)\n";
    data += "Campos completados: " + (res.answered || 0) + "/" + (res.total || 0) + " (" + (res.pct || 0) + "%)\n\n";
    var ofaSections = { lab: "LABIOS", atm: "ATM/MANDIBULA", len: "LENGUA", die: "DIENTES Y OCLUSION", pal: "PALADAR DURO", vel: "ESFINTER VELOFARINGEO" };
    Object.keys(ofaSections).forEach(function(prefix) {
      var sectionEntries = Object.entries(ofaData).filter(function(e) { return e[0].startsWith(prefix + "_") && e[1]; });
      if (sectionEntries.length > 0) {
        data += ofaSections[prefix] + ":\n";
        sectionEntries.forEach(function(e) { data += "  " + e[0] + ": " + e[1] + "\n"; });
      }
    });
    // Include coordination fields
    var coordEntries = Object.entries(ofaData).filter(function(e) { return (e[0].startsWith("pa_") || e[0].startsWith("ta_") || e[0].startsWith("ka_") || e[0].startsWith("ere_") || e[0].startsWith("rra_") || e[0].startsWith("vowel_") || e[0].startsWith("pataka_")) && e[1]; });
    if (coordEntries.length > 0) {
      data += "COORDINACION FONOARTICULATORIA (DIADOCOCINESIAS):\n";
      coordEntries.forEach(function(e) { data += "  " + e[0] + ": " + e[1] + "\n"; });
    }

  } else if (evalType === "fon") {
    var fonData = ev.seccionData || {};
    var fonProc = ev.procesosData || {};
    data = "Evaluacion: Evaluacion Fonetica (Repeticion de Silabas)\n";
    data += "PCC: " + (res.pct || 0) + "%, Correctos: " + (res.ok || 0) + "/" + (res.evaluated || 0) + ", Severidad: " + (res.severity || "N/C") + "\n\n";
    // Count by error type
    var distCount = 0, omisCount = 0, sustCount = 0, okCount = 0;
    Object.values(fonData).forEach(function(v) {
      if (v === "ok") okCount++;
      else if (v === "D") distCount++;
      else if (v === "O") omisCount++;
      else if (v === "S") sustCount++;
    });
    data += "DISTRIBUCION: Correctos=" + okCount + " Distorsiones=" + distCount + " Omisiones=" + omisCount + " Sustituciones=" + sustCount + "\n\n";
    // Process errors
    var procErrors = (res.procErrors || []);
    if (procErrors.length > 0) {
      data += "ERRORES CON PROCESOS FONOLOGICOS (" + procErrors.length + "):\n";
      procErrors.slice(0, 30).forEach(function(e) {
        data += "  " + e.word + " (" + e.target + ") -> " + (e.produccion || "?") + " | Proceso: " + (e.procesoName || "sin clasificar") + "\n";
      });
    }
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

    var systemPrompt = "Eres un/a fonoaudi\u00f3logo/a cl\u00ednico/a profesional argentino/a. Gener\u00e1s informes cl\u00ednicos de alta calidad.\n\nREGLAS ESTRICTAS:\n- Informe BREVE: m\u00e1ximo 15-25 l\u00edneas.\n- NO incluyas porcentajes ni n\u00fameros de resultados.\n- NO incluyas tablas ni estad\u00edsticas.\n- Solo us\u00e1 los datos para redactar CONCLUSIONES CL\u00cdNICAS.\n- Lenguaje profesional fonoaudiol\u00f3gico.\n- F\u00e1cil de leer, adecuado para escuela, obra social o expediente.\n- Espa\u00f1ol rioplatense profesional.\n- Sin markdown, sin asteriscos, sin s\u00edmbolos especiales.\n- T\u00edtulos de secci\u00f3n en MAY\u00daSCULAS seguidos de dos puntos.\n- TODO en prosa fluida, NUNCA listas con guiones ni vi\u00f1etas.\n- ORTOGRAF\u00cdA PERFECTA: cada palabra con su tilde correcta. Esto es fundamental para la credibilidad profesional del informe.\n- VOCABULARIO ARGENTINO: NO usar palabras que no se usen en Argentina. Prohibidas: mota, carro, computador, celular (usar tel\u00e9fono m\u00f3vil), platicar, enojarse (usar enojar). Usar vocabulario com\u00fan en C\u00f3rdoba/Buenos Aires.";

    var userPrompt = "";

    if (reportMode === "consolidado") {
      userPrompt = "Sos una fonoaudi\u00f3loga con m\u00e1s de 20 a\u00f1os de experiencia cl\u00ednica en trastornos de los sonidos del habla y del lenguaje infantil. "
        + "Con los siguientes datos de M\u00daLTIPLES evaluaciones fonoaudiol\u00f3gicas del mismo paciente, redact\u00e1 un INFORME FONOAUDIOL\u00d3GICO COMPLEMENTARIO de nivel profesional.\n\n"
        + "Estructura EXACTA (usar estos t\u00edtulos tal cual):\n\n"
        + "INFORME FONOAUDIOL\u00d3GICO COMPLEMENTARIO\n\n"
        + "DESCRIPCI\u00d3N GENERAL:\n"
        + "Breve contexto cl\u00ednico, motivo de la bater\u00eda de evaluaciones y objetivo cl\u00ednico. "
        + "NO repetir datos del paciente (nombre, DNI, edad, fecha) porque ya figuran en el encabezado.\n\n"
        + "INSTRUMENTOS DE EVALUACI\u00d3N APLICADOS:\n"
        + "Mencionar cada prueba aplicada con su nombre completo en prosa fluida. No usar guiones.\n\n"
        + "AN\u00c1LISIS E INTERPRETACI\u00d3N DE RESULTADOS:\n"
        + "N\u00facleo del informe. Integrar los hallazgos de TODAS las evaluaciones en una narrativa cl\u00ednica cohesiva. "
        + "Describir: nivel fon\u00e9tico (producci\u00f3n de fonemas, tipos de errores articulatorios, consistencia), "
        + "nivel fonol\u00f3gico (procesos fonol\u00f3gicos activos, patrones sistem\u00e1ticos, contrastes afectados), "
        + "percepci\u00f3n auditiva (discriminaci\u00f3n y reconocimiento fonol\u00f3gico), "
        + "funciones orofaciales si se evaluaron (tono, movilidad, estructura de OFA). "
        + "Relacionar los hallazgos entre s\u00ed. "
        + "Usar terminolog\u00eda t\u00e9cnica apropiada pero sin incluir porcentajes num\u00e9ricos.\n\n"
        + "DIAGN\u00d3STICO FONOAUDIOL\u00d3GICO:\n"
        + "Diagn\u00f3stico cl\u00ednico preciso con nomenclatura actualizada y grado de severidad justificado.\n\n"
        + "IMPACTO FUNCIONAL:\n"
        + "Describir c\u00f3mo las dificultades impactan en inteligibilidad, comunicaci\u00f3n funcional, participaci\u00f3n escolar/social y lectoescritura.\n\n"
        + "PLAN TERAP\u00c9UTICO SUGERIDO:\n"
        + "Objetivos terap\u00e9uticos priorizados, enfoque recomendado, frecuencia estimada. Orientaciones para familia y escuela. Todo en prosa.\n\n"
        + "PRON\u00d3STICO:\n"
        + "Pron\u00f3stico cl\u00ednico fundamentado.\n\n"
        + "DIRECTRICES OBLIGATORIAS:\n"
        + "- Tercera persona, tiempo presente. Tono cl\u00ednico formal pero accesible.\n"
        + "- TODO en prosa fluida. NUNCA listas con guiones ni vi\u00f1etas.\n"
        + "- NO incluir porcentajes num\u00e9ricos.\n"
        + "- NO repetir el nombre del paciente m\u00e1s de 1 vez. Usar 'el/la paciente', 'el/la ni\u00f1o/a'.\n"
        + "- NO incluir secci\u00f3n de 'Datos del paciente'.\n"
        + "- Espa\u00f1ol rioplatense profesional.\n"
        + "- ORTOGRAF\u00cdA PERFECTA: usar SIEMPRE acentos y tildes correctos en TODAS las palabras. "
        + "Ejemplos: evaluaci\u00f3n, fonol\u00f3gico, articulaci\u00f3n, discriminaci\u00f3n, producci\u00f3n, cronol\u00f3gica, diagn\u00f3stico, cl\u00ednico, "
        + "intervenci\u00f3n, comprensi\u00f3n, expresi\u00f3n, comunicaci\u00f3n, atenci\u00f3n, observaci\u00f3n, ni\u00f1o/a, a\u00f1os, \u00e1rea, s\u00edlaba. "
        + "Cada palabra SIN su acento correcto es un error grave.\n"
        + "- Extensi\u00f3n: entre 35 y 50 l\u00edneas.\n\n"
        + summary.header + "\n" + summary.data + "\nOBS: " + summary.obs;
    } else {
      userPrompt = "Sos una fonoaudi\u00f3loga con m\u00e1s de 20 a\u00f1os de experiencia cl\u00ednica. "
        + "Con los siguientes datos de una evaluaci\u00f3n fonoaudiol\u00f3gica, redact\u00e1 un INFORME FONOAUDIOL\u00d3GICO profesional.\n\n"
        + "Estructura EXACTA (usar estos t\u00edtulos tal cual, en may\u00fasculas seguidos de dos puntos):\n\n"
        + "INFORME FONOAUDIOL\u00d3GICO\n\n"
        + "DESCRIPCI\u00d3N GENERAL:\n"
        + "Breve contexto cl\u00ednico del paciente, motivo de consulta o derivaci\u00f3n, e instrumento de evaluaci\u00f3n aplicado. "
        + "NO repetir datos del paciente (nombre, DNI, edad, fecha) porque ya figuran en el encabezado del informe.\n\n"
        + "HALLAZGOS CL\u00cdNICOS:\n"
        + "Describir en prosa fluida los resultados observados: qu\u00e9 aspectos se encuentran conservados y cu\u00e1les presentan dificultades. "
        + "Usar terminolog\u00eda t\u00e9cnica apropiada (fonemas, posiciones sil\u00e1bicas, procesos fonol\u00f3gicos, rasgos distintivos, etc.). "
        + "Relacionar los hallazgos con lo esperado para la edad cronol\u00f3gica del paciente.\n\n"
        + "DIAGN\u00d3STICO FONOAUDIOL\u00d3GICO:\n"
        + "Diagn\u00f3stico cl\u00ednico preciso con nomenclatura actualizada y grado de severidad justificado.\n\n"
        + "ORIENTACIONES:\n"
        + "Recomendaciones cl\u00ednicas breves en prosa fluida: necesidad de intervenci\u00f3n, enfoque sugerido, orientaciones para familia/escuela. "
        + "NO usar guiones ni listas con vi\u00f1etas, todo en prosa.\n\n"
        + "DIRECTRICES OBLIGATORIAS:\n"
        + "- Tercera persona, tiempo presente. Tono cl\u00ednico formal pero legible.\n"
        + "- TODO en prosa fluida. NUNCA usar guiones, vi\u00f1etas, asteriscos ni listas.\n"
        + "- NO incluir porcentajes ni n\u00fameros de resultados crudos.\n"
        + "- NO repetir el nombre del paciente m\u00e1s de 1 vez en todo el informe. Usar 'el/la paciente', 'el/la ni\u00f1o/a'.\n"
        + "- NO incluir secci\u00f3n de 'Datos del paciente' porque ya figuran en el encabezado.\n"
        + "- Espa\u00f1ol rioplatense profesional.\n"
        + "- ORTOGRAF\u00cdA: usar SIEMPRE acentos y tildes correctos en TODAS las palabras que lo requieran. "
        + "Ejemplos obligatorios: evaluaci\u00f3n, fonol\u00f3gico, articulaci\u00f3n, discriminaci\u00f3n, producci\u00f3n, repetici\u00f3n, "
        + "cronol\u00f3gica, diagn\u00f3stico, cl\u00ednico, ling\u00fc\u00edstico, auditivo/a, \u00e1rea, a\u00f1os, ni\u00f1o/a, d\u00e9ficit, caracter\u00edsticas, s\u00edlaba, est\u00edmulo, "
        + "intervenci\u00f3n, sesi\u00f3n, atenci\u00f3n, comprensi\u00f3n, expresi\u00f3n, comunicaci\u00f3n, informaci\u00f3n, observaci\u00f3n. "
        + "Cada palabra SIN acento es un error grave.\n"
        + "- Extensi\u00f3n: entre 15 y 25 l\u00edneas.\n\n"
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
