// Reconocimiento Fonologico - PEFF-R seccion 3.5
// 12 grupos (A-L), 36 items, cada uno con 5 estimulos

export var RECO_GROUPS = [
  { id: "A", label: "Oclusivas y fricativas", items: [
    { lam: 1, est: ["puente","puente","fuente","puente","fuente"] },
    { lam: 2, est: ["taco","saco","saco","taco","saco"] },
    { lam: 3, est: ["carro","jarro","carro","jarro","carro"] }
  ]},
  { id: "B", label: "Oclusivas (orales) y nasales", items: [
    { lam: 4, est: ["bota","bota","mota","mota","bota"] },
    { lam: 5, est: ["codo","codo","cono","codo","cono"] },
    { lam: 6, est: ["capa","cama","cama","cama","capa"] }
  ]},
  { id: "C", label: "Oclusivas y liquidas", items: [
    { lam: 7, est: ["duna","duna","luna","duna","luna"] },
    { lam: 8, est: ["boda","borra","boda","borra","borra"] },
    { lam: 9, est: ["lodo","loro","loro","loro","loro"] }
  ]},
  { id: "D", label: "Oclusiva sonora y oclusiva sorda", items: [
    { lam: 10, est: ["vaso","paso","vaso","vaso","paso"] },
    { lam: 11, est: ["duna","tuna","duna","duna","tuna"] },
    { lam: 12, est: ["gasa","gasa","casa","gasa","casa"] }
  ]},
  { id: "E", label: "Oclusivas frontales y posteriores", items: [
    { lam: 13, est: ["taza","casa","casa","casa","taza"] },
    { lam: 14, est: ["soda","soda","soga","soga","soga"] },
    { lam: 15, est: ["pato","gato","gato","pato","pato"] }
  ]},
  { id: "F", label: "Fricativas y nasales", items: [
    { lam: 16, est: ["foto","foto","moto","moto","moto"] },
    { lam: 17, est: ["casa","casa","cana","casa","casa"] },
    { lam: 18, est: ["callo","cano","callo","callo","cano"] }
  ]},
  { id: "G", label: "Nasales y liquidas", items: [
    { lam: 19, est: ["nana","nana","lana","lana","nana"] },
    { lam: 20, est: ["mono","mono","morro","mono","mono"] },
    { lam: 21, est: ["cana","cara","cara","cana","cana"] }
  ]},
  { id: "H", label: "Nasales frontales y posteriores", items: [
    { lam: 22, est: ["rama","rama","rana","rana","rana"] },
    { lam: 23, est: ["mono","mono","mono","mono","mono"] },
    { lam: 24, est: ["cama","cana","cana","cama","cama"] }
  ]},
  { id: "I", label: "Fricativas y liquidas", items: [
    { lam: 25, est: ["pollo","pollo","pollo","pollo","polo"] },
    { lam: 26, est: ["llama","rama","rama","llama","llama"] },
    { lam: 27, est: ["sello","cero","sello","cero","cero"] }
  ]},
  { id: "J", label: "Africadas y fricativas", items: [
    { lam: 28, est: ["ocho","ocho","oso","oso","oso"] },
    { lam: 29, est: ["ocho","ocho","hoyo","hoyo","hoyo"] },
    { lam: 30, est: ["hacha","asa","asa","asa","hacha"] }
  ]},
  { id: "K", label: "Fricativas frontales y posteriores", items: [
    { lam: 31, est: ["fuego","juego","fuego","juego","juego"] },
    { lam: 32, est: ["casa","caja","caja","caja","casa"] },
    { lam: 33, est: ["fiesta","siesta","siesta","fiesta","fiesta"] }
  ]},
  { id: "L", label: "Liquidas", items: [
    { lam: 34, est: ["ola","hora","ola","hora","ola"] },
    { lam: 35, est: ["cero","cerro","cerro","cerro","cero"] },
    { lam: 36, est: ["rata","rata","lata","rata","rata"] }
  ]}
];

export var TOTAL_ITEMS = 36;
export var TOTAL_GROUPS = RECO_GROUPS.length;

export function computeRecoResults(responses) {
  var correct = 0;
  var incorrect = 0;
  var unanswered = 0;
  var groupResults = {};

  RECO_GROUPS.forEach(function(group) {
    var gCorrect = 0;
    var gIncorrect = 0;
    var gUnanswered = 0;

    group.items.forEach(function(item) {
      var r = responses[item.lam];
      if (r === "si") { correct++; gCorrect++; }
      else if (r === "no") { incorrect++; gIncorrect++; }
      else { unanswered++; gUnanswered++; }
    });

    var gTotal = gCorrect + gIncorrect;
    groupResults[group.id] = {
      label: group.label,
      correct: gCorrect,
      incorrect: gIncorrect,
      unanswered: gUnanswered,
      total: group.items.length,
      evaluated: gTotal,
      pct: gTotal > 0 ? Math.round((gCorrect / gTotal) * 100) : 0
    };
  });

  var evaluated = correct + incorrect;
  var pct = evaluated > 0 ? Math.round((correct / evaluated) * 100) : 0;

  var severity;
  if (pct >= 95) severity = "Adecuado";
  else if (pct >= 80) severity = "Leve";
  else if (pct >= 60) severity = "Moderado";
  else severity = "Severo";

  var problematicGroups = [];
  Object.keys(groupResults).forEach(function(gId) {
    var gr = groupResults[gId];
    if (gr.incorrect > 0) {
      problematicGroups.push({
        id: gId,
        label: gr.label,
        incorrect: gr.incorrect,
        pct: gr.pct
      });
    }
  });
  problematicGroups.sort(function(a, b) { return a.pct - b.pct; });

  return {
    correct: correct,
    incorrect: incorrect,
    unanswered: unanswered,
    evaluated: evaluated,
    total: TOTAL_ITEMS,
    pct: pct,
    severity: severity,
    groupResults: groupResults,
    problematicGroups: problematicGroups
  };
}
