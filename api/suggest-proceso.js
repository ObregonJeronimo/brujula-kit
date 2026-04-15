// Vercel serverless — IA sugiere proceso fonológico
// Usa Groq (llama-3.1-8b-instant)

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  var { word, production, errorType } = req.body;
  if (!word || !production) return res.status(400).json({ error: "word and production required" });

  var errorLabel = { D: "Distorsion", O: "Omision", S: "Sustitucion" }[errorType] || errorType;

  var systemPrompt = "Sos un experto en fonologia del habla infantil y procesos fonologicos de simplificacion. " +
    "Analiza el error fonetico y sugeri el proceso fonologico mas probable. " +
    "Responde SOLO en formato JSON con esta estructura exacta, sin markdown ni backticks:\n" +
    '{"proceso":"nombre_del_proceso","explicacion":"explicacion breve de por que es ese proceso","confianza":"alta|media|baja"}\n\n' +
    "Los procesos fonologicos posibles son:\n" +
    "SUSTITUCIONES: Oclusivizacion, Fricativizacion, Frontalizacion, Posteriorizacion, Nasalizacion, Desnasalizacion, Indiferenciacion l-r-d\n" +
    "ASIMILACIONES: Asimilacion vocalica, Asimilacion consonantica total, Asimilacion parcial - modo, Asimilacion parcial - punto, Asimilacion parcial - sonoridad\n" +
    "ESTRUCTURACION SILABICA: Reduccion grupo consonantico, Reduccion grupo vocalico, Omision consonante final, Omision consonante inicial, Omision silaba atona, Metatesisis, Coalescencia, Epentesis, Reduplicacion silabica";

  var userPrompt = "Silaba objetivo: " + word + "\n" +
    "Produccion del paciente: " + production + "\n" +
    "Tipo de error: " + errorLabel + "\n" +
    "Cual es el proceso fonologico?";

  try {
    var groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.GROQ_API_KEY
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 200
      })
    });

    var data = await groqRes.json();
    var text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    
    if (!text) return res.status(500).json({ error: "No response from AI" });

    // Parse JSON response
    var clean = text.replace(/```json|```/g, "").trim();
    var parsed = JSON.parse(clean);
    
    res.status(200).json({ success: true, suggestion: parsed });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
