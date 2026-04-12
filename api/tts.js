// Vercel serverless function for VoiceRSS Text-to-Speech
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });
  
  var { text } = req.body;
  if (!text) return res.status(400).json({ error: "text required" });
  
  var apiKey = process.env.VOICERSS_API_KEY || "62a89bc58a174c9da9a30e7cde5af090";
  
  try {
    var url = "https://api.voicerss.org/?" + new URLSearchParams({
      key: apiKey,
      hl: "es-mx",  // Spanish Mexico (clear Latin American accent)
      src: text,
      r: "-2",      // Speed: slightly slower
      c: "MP3",
      f: "44khz_16bit_mono",
      b64: "true"   // Return base64
    }).toString();
    
    var response = await fetch(url);
    var data = await response.text();
    
    if (data.startsWith("ERROR")) {
      return res.status(500).json({ error: data });
    }
    
    // data is base64 audio
    res.status(200).json({ 
      success: true, 
      audio: "data:audio/mp3;base64," + data 
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
