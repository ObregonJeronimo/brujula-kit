// Vercel Serverless Function — generate AI fonoaudiological report using Groq
// POST /api/generate-report
// Body: { evalData, evalType }

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

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

    var systemPrompt = "Eres un fonoaudi\u00f3logo cl\u00ednico profesional especializado en evaluaci\u00f3n infantil y trastornos de los sonidos del habla. Gener\u00e1 informes fonoaudiol\u00f3gicos claros, profesionales y estructurados.\n\nReglas:\n- NO inventes datos. Si algo no est\u00e1 disponible, indic\u00e1lo.\n- Terminolog\u00eda cl\u00ednica apropiada pero comprensible.\n- Espa\u00f1ol rioplatense profesional.\n- Solo texto plano, sin markdown. T\u00edtulos en MAY\u00daSCULAS seguidos de dos puntos.";

    var userPrompt = "Informe fonoaudiol\u00f3gico de Reconocimiento Fonol\u00f3gico (PEFF-R 3.5):\n\n"
      + "PACIENTE: " + (ev.paciente || "N/D") + " | DNI: " + (ev.pacienteDni || "N/D") + " | Edad: " + edadStr + "\n"
      + "Fecha: " + (ev.fechaEvaluacion || "N/D") + " | Establecimiento: " + (ev.establecimiento || "N/D") + "\n"
      + "Derivado por: " + (ev.derivadoPor || "N/E") + " | Evaluador: " + (ev.evaluador || "N/D") + "\n\n"
      + "RESULTADOS: " + (resultados.pct || 0) + "% aciertos, " + (resultados.correct || 0) + "/" + (resultados.total || 0) + " contrastes, Severidad: " + (resultados.severity || "N/C") + "\n"
      + "Criterios: Adecuado>=95%, Leve 80-94%, Moderado 60-79%, Severo<60%\n\n"
      + "GRUPOS:\n" + groupDetail + "\n\nDIFICULTADES:\n" + errorDetail + "\n\nOBS: " + observaciones
      + "\n\nSecciones: 1)DESCRIPCION GENERAL 2)ANALISIS DE RESULTADOS 3)FONEMAS ALTERADOS 4)INTERPRETACION CLINICA 5)CONCLUSION 6)RECOMENDACIONES";

    console.log("[generate-report] Calling Groq llama-3.1-8b for patient:", ev.paciente || "unknown");

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
        max_tokens: 2000,
        temperature: 0.4
      })
    });

    if (!groqRes.ok) {
      var errBody = await groqRes.text();
      var statusCode = groqRes.status;
      console.error("[generate-report] Groq error:", statusCode, errBody.substring(0, 400));

      var parsedErr = null;
      try { parsedErr = JSON.parse(errBody); } catch(e) {}
      var errMsg = (parsedErr && parsedErr.error && parsedErr.error.message) || errBody.substring(0, 300);

      if (statusCode === 429) {
        return res.status(502).json({ error: "L\u00edmite de Groq excedido. Esper\u00e1 unos segundos e intent\u00e1 de nuevo." });
      } else if (statusCode === 401) {
        return res.status(502).json({ error: "API Key de Groq inv\u00e1lida. Verific\u00e1 GROQ_API_KEY en Vercel." });
      } else {
        return res.status(502).json({ error: "Error de Groq [" + statusCode + "]: " + errMsg });
      }
    }

    var groqData = await groqRes.json();
    var reportText = "";

    if (groqData.choices && groqData.choices.length > 0 && groqData.choices[0].message) {
      reportText = groqData.choices[0].message.content || "";
    }

    if (!reportText) {
      console.error("[generate-report] Empty Groq response:", JSON.stringify(groqData).substring(0, 500));
      return res.status(500).json({ error: "Groq devolvi\u00f3 respuesta vac\u00eda. Intent\u00e1 de nuevo." });
    }

    reportText = reportText.replace(/\*\*/g, "").replace(/^#+\s*/gm, "").replace(/^[-*]\s+/gm, "- ");

    console.log("[generate-report] OK - model:", groqData.model || "llama-3.1-8b-instant", "tokens:", groqData.usage ? groqData.usage.total_tokens : "?");

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
