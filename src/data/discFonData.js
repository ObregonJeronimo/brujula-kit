// Discriminación Fonológica — PEFF-R sección 3.4
// 14 pares fijos. Clave: "I" = iguales, "D" = diferentes

export var DISC_PAIRS = [
  { id: 1, word1: "Pena",  word2: "Pena",  clave: "I" },
  { id: 2, word1: "Capa",  word2: "Cava",  clave: "D" },
  { id: 3, word1: "Voto",  word2: "Voto",  clave: "I" },
  { id: 4, word1: "Coma",  word2: "Coma",  clave: "I" },
  { id: 5, word1: "Calo",  word2: "Galo",  clave: "D" },
  { id: 6, word1: "Todo",  word2: "Todo",  clave: "I" },
  { id: 7, word1: "Nato",  word2: "Nato",  clave: "I" },
  { id: 8, word1: "Sapo",  word2: "Chapo", clave: "D" },
  { id: 9, word1: "Ala",   word2: "Ara",   clave: "D" },
  { id: 10, word1: "Saco", word2: "Taco",  clave: "D" },
  { id: 11, word1: "Foca", word2: "Poca",  clave: "D" },
  { id: 12, word1: "Carro",word2: "Cayo",  clave: "D" },
  { id: 13, word1: "Tema", word2: "Tema",  clave: "I" },
  { id: 14, word1: "Rapa", word2: "Iapa",  clave: "D" }
];

export var TOTAL_PAIRS = DISC_PAIRS.length;

// Fonemas contrastados en pares diferentes
export var CONTRASTS = {
  2:  { f1: "/p/", f2: "/b/",  desc: "oclusiva bilabial sorda vs sonora" },
  5:  { f1: "/k/", f2: "/g/",  desc: "oclusiva velar sorda vs sonora" },
  8:  { f1: "/s/", f2: "/ch/", desc: "fricativa alveolar vs africada" },
  9:  { f1: "/l/", f2: "/r/",  desc: "lateral vs vibrante" },
  10: { f1: "/s/", f2: "/t/",  desc: "fricativa vs oclusiva" },
  11: { f1: "/f/", f2: "/p/",  desc: "fricativa labiodental vs oclusiva bilabial" },
  12: { f1: "/rr/",f2: "/y/",  desc: "vibrante m\u00faltiple vs aproximante palatal" },
  14: { f1: "/r/", f2: "/y/",  desc: "vibrante vs aproximante palatal" }
};

export function computeDiscResults(responses, observations) {
  var correct = 0;
  var incorrect = 0;
  var unanswered = 0;
  var errors = [];

  DISC_PAIRS.forEach(function(pair) {
    var r = responses[pair.id];
    if (r === undefined || r === null || r === "") {
      unanswered++;
    } else if (r === pair.clave) {
      correct++;
    } else {
      incorrect++;
      var contrast = CONTRASTS[pair.id] || null;
      errors.push({
        id: pair.id,
        word1: pair.word1,
        word2: pair.word2,
        clave: pair.clave,
        respuesta: r,
        contrast: contrast
      });
    }
  });

  var evaluated = correct + incorrect;
  var pct = evaluated > 0 ? Math.round((correct / evaluated) * 100) : 0;

  // Severity based on percentage
  var severity;
  if (pct >= 95) severity = "Adecuado";
  else if (pct >= 80) severity = "Leve";
  else if (pct >= 60) severity = "Moderado";
  else severity = "Severo";

  // Group errors by contrast type
  var errorsByContrast = {};
  errors.forEach(function(e) {
    if (e.contrast) {
      var key = e.contrast.f1 + " vs " + e.contrast.f2;
      if (!errorsByContrast[key]) errorsByContrast[key] = { contrast: e.contrast, pairs: [] };
      errorsByContrast[key].pairs.push(e);
    }
  });

  return {
    correct: correct,
    incorrect: incorrect,
    unanswered: unanswered,
    evaluated: evaluated,
    total: TOTAL_PAIRS,
    pct: pct,
    severity: severity,
    errors: errors,
    errorsByContrast: errorsByContrast
  };
}
