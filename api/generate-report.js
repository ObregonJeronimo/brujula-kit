// Vercel Serverless Function — generate AI fonoaudiological report
// POST /api/generate-report
// Body: { evalData, evalType }

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  var OPENAI_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) {
    return res.status(500).json({ error: "OPENAI_API_KEY no est\u00e1 configurada en las variables de entorno de Vercel." });
  }

  try {
    var body = req.body;
    if (!body || !body.evalData) {
      return res.status(400).json({ error: "Missing evalData" });
    }

    var ev = body.evalData;
    var evalType = body.evalType || "reco";

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

    var systemPrompt = "Eres un fonoaudi\u00f3logo cl\u00ednico profesional especializado en evaluaci\u00f3n infantil y trastornos de los sonidos del habla. Tu rol es generar informes fonoaudiol\u00f3gicos claros, profesionales y estructurados a partir de los datos de evaluaciones cl\u00ednicas.\n\nReglas importantes:\n- NO inventes datos que no est\u00e9n presentes en la evaluaci\u00f3n. Si alg\u00fan dato no est\u00e1 disponible, ind\u00edcalo expl\u00edcitamente.\n- Usa terminolog\u00eda cl\u00ednica apropiada pero comprensible.\n- S\u00e9 objetivo y preciso en el an\u00e1lisis.\n- El informe debe ser \u00fatil para otros profesionales de salud y educaci\u00f3n.\n- Redacta en espa\u00f1ol rioplatense profesional.\n- No uses markdown ni formato especial, solo texto plano con saltos de l\u00ednea para separar secciones.\n- Cada secci\u00f3n debe tener un t\u00edtulo en may\u00fasculas seguido de dos puntos.";

    var userPrompt = "Genera un informe fonoaudiol\u00f3gico profesional basado en los siguientes datos de la evaluaci\u00f3n de Reconocimiento Fonol\u00f3gico (PEFF-R 3.5):\n\n"
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
      + "\n\nGenera el informe con las siguientes secciones:\n"
      + "1. DESCRIPCION GENERAL DEL DESEMPE\u00d1O\n"
      + "2. ANALISIS DE RESULTADOS\n"
      + "3. FONEMAS ALTERADOS Y PROCESOS FONOLOGICOS DETECTADOS\n"
      + "4. INTERPRETACION CLINICA\n"
      + "5. CONCLUSION PROFESIONAL\n"
      + "6. RECOMENDACIONES";

    // Try primary model, fallback to gpt-3.5-turbo if rate limited
    var models = ["gpt-4o-mini", "gpt-3.5-turbo"];
    var openaiData = null;
    var lastError = null;

    for (var i = 0; i < models.length; i++) {
      var model = models[i];
      console.log("[generate-report] Trying model:", model);

      var openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + OPENAI_KEY
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          max_tokens: 2500,
          temperature: 0.4
        })
      });

      if (openaiRes.ok) {
        openaiData = await openaiRes.json();
        break;
      }

      var errBody = await openaiRes.text();
      var statusCode = openaiRes.status;
      console.error("[generate-report] Model " + model + " failed:", statusCode, errBody);

      // Parse error for better messages
      var parsedErr = null;
      try { parsedErr = JSON.parse(errBody); } catch(e) {}

      if (statusCode === 429) {
        var errMsg = (parsedErr && parsedErr.error && parsedErr.error.message) || "";
        if (errMsg.indexOf("insufficient_quota") !== -1 || errMsg.indexOf("exceeded") !== -1) {
          lastError = "Tu cuenta de OpenAI no tiene saldo suficiente. Verific\u00e1 tu billing en platform.openai.com > Settings > Billing.";
          // Don't try fallback model if it's a billing issue
          break;
        }
        lastError = "L\u00edmite de solicitudes excedido (429). Esper\u00e1 unos segundos e intent\u00e1 de nuevo.";
        // Try next model
        continue;
      } else if (statusCode === 401) {
        lastError = "API Key de OpenAI inv\u00e1lida o expirada. Verific\u00e1 la variable OPENAI_API_KEY en Vercel.";
        break;
      } else {
        lastError = "Error de OpenAI (c\u00f3digo " + statusCode + "). Intent\u00e1 nuevamente en unos minutos.";
        break;
      }
    }

    if (!openaiData) {
      return res.status(502).json({ error: lastError || "No se pudo conectar con OpenAI." });
    }

    var reportText = "";
    if (openaiData.choices && openaiData.choices.length > 0 && openaiData.choices[0].message) {
      reportText = openaiData.choices[0].message.content || "";
    }

    if (!reportText) {
      return res.status(500).json({ error: "OpenAI devolvi\u00f3 una respuesta vac\u00eda. Intent\u00e1 de nuevo." });
    }

    console.log("[generate-report] Report generated for " + (ev.paciente || "unknown") + ", model: " + (openaiData.model || "?") + ", length: " + reportText.length);

    return res.status(200).json({
      success: true,
      report: reportText,
      model: openaiData.model || "unknown",
      tokens: openaiData.usage || null
    });
  } catch (err) {
    console.error("[generate-report] Error:", err);
    return res.status(500).json({ error: "Error interno del servidor: " + err.message });
  }
}
