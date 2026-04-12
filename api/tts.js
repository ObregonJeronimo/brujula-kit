// Vercel serverless function for VoiceRSS Text-to-Speech
import https from "https";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  
  var text = req.body && req.body.text;
  if (!text) return res.status(400).json({ error: "text required" });
  
  var apiKey = process.env.VOICERSS_API_KEY || "62a89bc58a174c9da9a30e7cde5af090";
  
  var params = new URLSearchParams({
    key: apiKey,
    hl: "es-mx",
    src: text,
    r: "-2",
    c: "MP3",
    f: "44khz_16bit_mono",
    b64: "true"
  });

  try {
    var data = await new Promise(function(resolve, reject) {
      var url = "https://api.voicerss.org/?" + params.toString();
      https.get(url, function(response) {
        var chunks = [];
        response.on("data", function(chunk) { chunks.push(chunk); });
        response.on("end", function() { resolve(Buffer.concat(chunks).toString()); });
        response.on("error", reject);
      }).on("error", reject);
    });

    if (data.startsWith("ERROR")) {
      return res.status(500).json({ error: data });
    }

    res.status(200).json({
      success: true,
      audio: "data:audio/mp3;base64," + data
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
