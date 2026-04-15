// Vercel serverless function — Edge TTS (Microsoft Neural Voices)
// Free, unlimited, no API key needed
import { EdgeTTS } from "@andresaya/edge-tts";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  var text = req.body && req.body.text;
  if (!text) return res.status(400).json({ error: "text required" });

  var voice = req.body.v || "es-AR-TomasNeural";
  var rate = req.body.r || "0%";

  try {
    var tts = new EdgeTTS();
    await tts.synthesize(text, voice, { rate: rate });
    var audioBuffer = await tts.toBuffer();
    
    // Convert to base64 data URI
    var base64 = audioBuffer.toString("base64");
    var mimeType = "audio/mp3";
    var dataUri = "data:" + mimeType + ";base64," + base64;

    res.status(200).json({ success: true, audio: dataUri });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
