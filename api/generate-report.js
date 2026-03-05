// Vercel Serverless Function — generate AI fonoaudiological report using Gemini
// POST /api/generate-report
// Body: { evalData, evalType }

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  var GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY no est\u00e1 configurada en las variables de entorno de Vercel." });
  }

  try {
    var body = req.body;
    if (!body || !body.evalData) {
      return res.status(400).json({ error: "Missing evalData" });
    }

    var ev = body.evalData;

    var edadAnios = Math.floor((ev.edadMeses || 0) / 12);
    var edadMesesResto = (ev.edadMeses || 0) % 12;
    var edadStr = edadAnios + " a\u00f1os y " + edadMesesResto + " meses";

    var resultados = ev.resultados || {};
    var groupResults = resultados.groupResults || [];
    var errorGroups = resultados.errorGroups || [];

    var groupDetail = groupResults.map(function(g) {
      return "Grupo " + g.id + " (" + g.label + "): " + g.correct + "/" + g.total + " (" + g.pct + "%)";
    }).join("\n");

    var errorDetail = "";
    if (errorGroups.length > 0) {
      errorDetail = errorGroups.map(function(g) {
        var failedItems = (g.items || []).filter(function(it) { return !it.reconoce; });
        var failedLams = failedItems.map(function(it) { return "Lam. " + it.lam; }).join(", ");
        return "Grupo " + g.id + " (" + g.label + "): items no reconocidos: " + failedLams;
      }).join("\n");
    } else {
      errorDetail = "No se detectaron grupos con dificultades.";
    }

    var observaciones = ev.observaciones || "No se registraron observaciones.";

    var prompt = "Eres un fonoaudi\u00f3logo cl\u00ednico profesional especializado en evaluaci\u00f3n infantil y trastornos de los sonidos del habla. Tu rol es generar informes fonoaudiol\u00f3gicos claros, profesionales y estructurados a partir de los datos de evaluaciones cl\u00ednicas.\n\n"
      + "Reglas importantes:\n"
      + "- NO inventes datos que no est\u00e9n presentes en la evaluaci\u00f3n. Si alg\u00fan dato no est\u00e1 disponible, indic\u00e1lo expl\u00edcitamente.\n"
      + "- Us\u00e1 terminolog\u00eda cl\u00ednica apropiada pero comprensible.\n"
      + "- S\u00e9 objetivo y preciso en el an\u00e1lisis.\n"
      + "- El informe debe ser \u00fatil para otros profesionales de salud y educaci\u00f3n.\n"
      + "- Redact\u00e1 en espa\u00f1ol rioplatense profesional.\n"
      + "- No uses markdown ni formato especial, solo texto plano con saltos de l\u00ednea para separar secciones.\n"
      + "- Cada secci\u00f3n debe tener un t\u00edtulo en MAY\u00daSCULAS seguido de dos puntos.\n\n"
      + "Gener\u00e1 un informe fonoaudiol\u00f3gico profesional basado en los siguientes datos de la evaluaci\u00f3n de Reconocimiento Fonol\u00f3gico (PEFF-R 3.5):\n\n"
      + "DATOS DEL PACIENTE:\n"
      + "- Nombre: " + (ev.paciente || "No disponible") + "\n"
      + "- DNI: " + (ev.pacienteDni || "No disponible") + "\n"
      + "- Edad: " + edadStr + "\n"
      + "- Fecha de evaluaci\u00f3n: " + (ev.fechaEvaluacion || "No disponible") + "\n"
      + "- Establecimiento: " + (ev.establecimiento || "No disponible") + "\n"
      + "- Derivado por: " + (ev.derivadoPor || "No especificado") + "\n"
      + "- Evaluador: " + (ev.evaluador || "No disponible") + "\n"
      + "\nRESULTADOS GLOBALES:\n"
      + "- Porcentaje de aciertos: " + (resultados.pct || 0) + "%\n"
      + "- Contrastes reconocidos: " + (resultados.correct || 0) + " de " + (resultados.total || 0) + "\n"
      + "- Clasificaci\u00f3n de severidad: " + (resultados.severity || "No calculada") + "\n"
      + "- Criterios: Adecuado >= 95%, Leve 80-94%, Moderado 60-79%, Severo < 60%\n"
      + "\nDETALLE POR GRUPO DE CONTRASTE:\n" + groupDetail
      + "\n\nGRUPOS CON DIFICULTADES:\n" + errorDetail
      + "\n\nOBSERVACIONES DEL PROFESIONAL:\n" + observaciones
      + "\n\nGener\u00e1 el informe con las siguientes secciones:\n"
      + "1. DESCRIPCION GENERAL DEL DESEMPE\u00d1O\n"
      + "2. ANALISIS DE RESULTADOS\n"
      + "3. FONEMAS ALTERADOS Y PROCESOS FONOLOGICOS DETECTADOS\n"
      + "4. INTERPRETACION CLINICA\n"
      + "5. CONCLUSION PROFESIONAL\n"
      + "6. RECOMENDACIONES";

    // Single request to Gemini using v1 API
    var geminiUrl = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" + GEMINI_KEY;

    console.log("[generate-report] Calling gemini-1.5-flash (v1) for patient:", ev.paciente || "unknown");

    var geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 3000 }
      })
    });

    if (!geminiRes.ok) {
      var errBody = await geminiRes.text();
      var statusCode = geminiRes.status;
      console.error("[generate-report] Gemini error:", statusCode, errBody.substring(0, 400));

      var parsedErr = null;
      try { parsedErr = JSON.parse(errBody); } catch(e) {}
      var errMsg = (parsedErr && parsedErr.error && parsedErr.error.message) || errBody.substring(0, 200);

      if (statusCode === 429) {
        return res.status(502).json({ error: "L\u00edmite de solicitudes de Gemini excedido. Esper\u00e1 1-2 minutos e intent\u00e1 de nuevo." });
      } else if (statusCode === 403) {
        return res.status(502).json({ error: "API Key sin permisos. Verific\u00e1 en Google AI Studio que la key est\u00e9 activa. Detalle: " + errMsg });
      } else {
        return res.status(502).json({ error: "Error de Gemini [" + statusCode + "]: " + errMsg });
      }
    }

    var geminiData = await geminiRes.json();
    var reportText = "";

    if (geminiData.candidates && geminiData.candidates.length > 0) {
      var candidate = geminiData.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        reportText = candidate.content.parts[0].text || "";
      }
    }

    if (!reportText) {
      console.error("[generate-report] Empty response:", JSON.stringify(geminiData).substring(0, 500));
      return res.status(500).json({ error: "Gemini devolvi\u00f3 respuesta vac\u00eda. Intent\u00e1 de nuevo." });
    }

    // Clean markdown
    reportText = reportText.replace(/\*\*/g, "").replace(/^#+\s*/gm, "").replace(/^[-*]\s+/gm, "- ");

    console.log("[generate-report] OK - patient:", ev.paciente || "?", "chars:", reportText.length);

    return res.status(200).json({
      success: true,
      report: reportText,
      model: "gemini-1.5-flash",
      tokens: geminiData.usageMetadata || null
    });
  } catch (err) {
    console.error("[generate-report] EXCEPTION:", err);
    return res.status(500).json({ error: "Error interno: " + err.message });
  }
}
