// Reconocimiento Fonologico - PEFF-R seccion 3.5
// 12 grupos (A-L), cada uno con 3 items (laminas)
// Cada item tiene un par de palabras contrastivas

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
    id: "B", label: "Oclusivas (orales) y nasales",
    items: [
      { lam: 4, w1: "bota", w2: "mota" },
      { lam: 5, w1: "codo", w2: "cono" },
      { lam: 6, w1: "capa", w2: "cama" }
    ]
  },
  {
    id: "C", label: "Oclusivas y liquidas",
    items: [
      { lam: 7, w1: "duna", w2: "luna" },
      { lam: 8, w1: "boda", w2: "borra" },
      { lam: 9, w1: "lodo", w2: "loro" }
    ]
  },
  {
    id: "D", label: "Oclusiva sonora y oclusiva sorda",
    items: [
      { lam: 10, w1: "vaso", w2: "paso" },
      { lam: 11, w1: "duna", w2: "tuna" },
      { lam: 12, w1: "gasa", w2: "casa" }
    ]
  },
  {
    id: "E", label: "Oclusivas frontales y posteriores",
    items: [
      { lam: 13, w1: "taza", w2: "casa" },
      { lam: 14, w1: "soda", w2: "soga" },
      { lam: 15, w1: "pato", w2: "gato" }
    ]
  },
  {
    id: "F", label: "Fricativas y nasales",
    items: [
      { lam: 16, w1: "foto", w2: "moto" },
      { lam: 17, w1: "casa", w2: "cana" },
      { lam: 18, w1: "callo", w2: "cano" }
    ]
  },
  {
    id: "G", label: "Nasales y liquidas",
    items: [
      { lam: 19, w1: "nana", w2: "lana" },
      { lam: 20, w1: "mono", w2: "morro" },
      { lam: 21, w1: "cana", w2: "cara" }
    ]
  },
  {
    id: "H", label: "Nasales frontales y posteriores",
    items: [
      { lam: 22, w1: "rama", w2: "rana" },
      { lam: 23, w1: "mono", w2: "moño" },
      { lam: 24, w1: "cama", w2: "cana" }
    ]
  },
  {
    id: "I", label: "Fricativas y liquidas",
    items: [
      { lam: 25, w1: "pollo", w2: "polo" },
      { lam: 26, w1: "llama", w2: "rama" },
      { lam: 27, w1: "sello", w2: "cero" }
    ]
  },
  {
    id: "J", label: "Africadas y fricativas",
    items: [
      { lam: 28, w1: "ocho", w2: "oso" },
      { lam: 29, w1: "ocho", w2: "hoyo" },
      { lam: 30, w1: "hacha", w2: "asa" }
    ]
  },
  {
    id: "K", label: "Fricativas frontales y posteriores",
    items: [
      { lam: 31, w1: "fuego", w2: "juego" },
      { lam: 32, w1: "casa", w2: "caja" },
      { lam: 33, w1: "fiesta", w2: "siesta" }
    ]
  },
  {
    id: "L", label: "Liquidas",
    items: [
      { lam: 34, w1: "ola", w2: "hora" },
      { lam: 35, w1: "cero", w2: "cerro" },
      { lam: 36, w1: "rata", w2: "lata" }
    ]
  }
];

export var TOTAL_ITEMS = 36;

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
