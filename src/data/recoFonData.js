// Reconocimiento Fonologico Visual - 28 conjuntos
// Cada item tiene un par de palabras contrastivas y rutas de imagen

var IMG_BASE = "/img/img-RFV/";

// Map word -> image filename (exact case-sensitive names from repo)
var IMG_MAP = {
  "puente": "puente.png", "fuente": "fuente.png", "taco": "taco.jpg", "saco": "saco.png",
  "carro": "carro.png", "jarro": "jarro.png", "bota": "bota.png", "gota": "gota.png",
  "codo": "codo.png", "cono": "cono.png", "capa": "capa.png", "cama": "cama.png",
  "boda": "boda.png", "soda": "soda.png", "toro": "toro.png", "loro": "loro.png",
  "masa": "masa.png", "casa": "casa.avif", "taza": "taza.PNG", "soga": "soga.png",
  "pato": "pato.PNG", "gato": "gato.PNG", "roto": "roto.png", "moto": "moto.png",
  "rana": "rana.png", "lana": "lana.jpg", "rama": "RAMA.avif",
  "mono": "mono.jpg", "moño": "moño.jpg", "llama": "llama.jpg",
  "sapo": "sapo.png", "ocho": "ocho.jpg", "hoyo": "HOYO.jpg",
  "hacha": "hacha.avif", "fuego": "fuego.jpg", "huevo": "huevo.avif",
  "caja": "caja.avif", "fiesta": "fiesta.png", "cesta": "cesta.jfif",
  "ola": "ola.jpg", "hora": "hora.jfif", "cero": "cero.jpg", "cerro": "cerro.jpg",
  "rata": "rata.PNG", "lata": "lata.jpg"
};

export function getImageUrl(word) {
  var lower = word.toLowerCase();
  var filename = IMG_MAP[lower];
  if (!filename) return null;
  return IMG_BASE + filename;
}

export var RECO_GROUPS = [
  {
    id: "A", label: "Oclusivas y fricativas",
    items: [
      { lam: 1, w1: "puente", w2: "fuente" },
      { lam: 2, w1: "taco", w2: "saco" },
      { lam: 3, w1: "carro", w2: "jarro" }
    ]
  },
  {
    id: "B", label: "Oclusivas y nasales",
    items: [
      { lam: 4, w1: "bota", w2: "gota" },
      { lam: 5, w1: "codo", w2: "cono" },
      { lam: 6, w1: "capa", w2: "cama" }
    ]
  },
  {
    id: "C", label: "Oclusivas y liquidas",
    items: [
      { lam: 7, w1: "boda", w2: "soda" },
      { lam: 8, w1: "toro", w2: "loro" },
      { lam: 9, w1: "masa", w2: "casa" }
    ]
  },
  {
    id: "D", label: "Oclusivas frontales y posteriores",
    items: [
      { lam: 10, w1: "taza", w2: "casa" },
      { lam: 11, w1: "soda", w2: "soga" },
      { lam: 12, w1: "pato", w2: "gato" }
    ]
  },
  {
    id: "E", label: "Fricativas y nasales",
    items: [
      { lam: 13, w1: "roto", w2: "moto" },
      { lam: 14, w1: "casa", w2: "masa" },
      { lam: 15, w1: "rana", w2: "lana" }
    ]
  },
  {
    id: "F", label: "Nasales frontales y posteriores",
    items: [
      { lam: 16, w1: "rama", w2: "rana" },
      { lam: 17, w1: "mono", w2: "moño" },
      { lam: 18, w1: "cama", w2: "lana" }
    ]
  },
  {
    id: "G", label: "Fricativas y liquidas",
    items: [
      { lam: 19, w1: "sapo", w2: "gato" },
      { lam: 20, w1: "llama", w2: "rama" },
      { lam: 21, w1: "ocho", w2: "hoyo" }
    ]
  },
  {
    id: "H", label: "Africadas y fricativas",
    items: [
      { lam: 22, w1: "hacha", w2: "casa" },
      { lam: 23, w1: "fuego", w2: "huevo" },
      { lam: 24, w1: "casa", w2: "caja" }
    ]
  },
  {
    id: "I", label: "Fricativas frontales y posteriores",
    items: [
      { lam: 25, w1: "fiesta", w2: "cesta" },
      { lam: 26, w1: "ola", w2: "hora" },
      { lam: 27, w1: "cero", w2: "cerro" }
    ]
  },
  {
    id: "J", label: "Liquidas",
    items: [
      { lam: 28, w1: "rata", w2: "lata" }
    ]
  }
];

export var TOTAL_ITEMS = 28;

// responses format: { [lam]: { objetivo: "w1"|"w2", seleccion: "w1"|"w2" } }
// A response is correct when objetivo === seleccion

export function computeRecoResults(responses) {
  var groupResults = [];
  var totalCorrect = 0;
  var totalEvaluated = 0;
  var errorGroups = [];

  RECO_GROUPS.forEach(function(group) {
    var gCorrect = 0;
    var gTotal = 0;
    var gItems = [];

    group.items.forEach(function(item) {
      var r = responses[item.lam];
      if (r && r.objetivo && r.seleccion) {
        gTotal++;
        totalEvaluated++;
        var isCorrect = r.objetivo === r.seleccion;
        if (isCorrect) { gCorrect++; totalCorrect++; }
        gItems.push({ lam: item.lam, reconoce: isCorrect, objetivo: r.objetivo, seleccion: r.seleccion, palabraObjetivo: r.objetivo === "w1" ? item.w1 : item.w2, palabraSeleccionada: r.seleccion === "w1" ? item.w1 : item.w2 });
      } else {
        gItems.push({ lam: item.lam, reconoce: null, notEvaluated: true });
      }
    });

    var grp = { id: group.id, label: group.label, correct: gCorrect, total: gTotal, pct: gTotal > 0 ? Math.round((gCorrect / gTotal) * 100) : 0, items: gItems };
    groupResults.push(grp);
    if (gCorrect < gTotal) errorGroups.push(grp);
  });

  var globalPct = totalEvaluated > 0 ? Math.round((totalCorrect / totalEvaluated) * 100) : 0;
  var severity;
  if (globalPct >= 95) severity = "Adecuado";
  else if (globalPct >= 80) severity = "Leve";
  else if (globalPct >= 60) severity = "Moderado";
  else severity = "Severo";

  return { correct: totalCorrect, total: totalEvaluated, pct: globalPct, severity: severity, groupResults: groupResults, errorGroups: errorGroups };
}
