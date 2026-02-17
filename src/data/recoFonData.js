// Reconocimiento Fonologico - PEFF-R seccion 3.5
// 12 grupos (A-L), cada uno con 3 items y 5 estimulos por item

export var RECO_GROUPS = [
  {
    id: "A", label: "Oclusivas y fricativas",
    items: [
      { lam: 1, est: ["puente","puente","fuente","puente","fuente"] },
      { lam: 2, est: ["taco","saco","saco","taco","saco"] },
      { lam: 3, est: ["carro","jarro","carro","jarro","carro"] }
    ]
  },
  {
    id: "B", label: "Oclusivas (orales) y nasales",
    items: [
      { lam: 4, est: ["bota","bota","mota","mota","bota"] },
      { lam: 5, est: ["codo","codo","cono","codo","cono"] },
      { lam: 6, est: ["capa","cama","cama","cama","capa"] }
    ]
  },
  {
    id: "C", label: "Oclusivas y liquidas",
    items: [
      { lam: 7, est: ["duna","duna","luna","duna","luna"] },
      { lam: 8, est: ["boda","borra","boda","borra","borra"] },
      { lam: 9, est: ["lodo","loro","loro","loro","loro"] }
    ]
  },
  {
    id: "D", label: "Oclusiva sonora y oclusiva sorda",
    items: [
      { lam: 10, est: ["vaso","paso","vaso","vaso","paso"] },
      { lam: 11, est: ["duna","tuna","duna","duna","tuna"] },
      { lam: 12, est: ["gasa","gasa","casa","gasa","casa"] }
    ]
  },
  {
    id: "E", label: "Oclusivas frontales y posteriores",
    items: [
      { lam: 13, est: ["taza","casa","casa","casa","taza"] },
      { lam: 14, est: ["soda","soda","soga","soga","soga"] },
      { lam: 15, est: ["pato","gato","gato","pato","pato"] }
    ]
  },
  {
    id: "F", label: "Fricativas y nasales",
    items: [
      { lam: 16, est: ["foto","foto","moto","moto","moto"] },
      { lam: 17, est: ["casa","casa","cana","casa","casa"] },
      { lam: 18, est: ["callo","cano","callo","callo","cano"] }
    ]
  },
  {
    id: "G", label: "Nasales y liquidas",
    items: [
      { lam: 19, est: ["nana","nana","lana","lana","nana"] },
      { lam: 20, est: ["mono","mono","morro","mono","mono"] },
      { lam: 21, est: ["cana","cara","cara","cana","cana"] }
    ]
  },
  {
    id: "H", label: "Nasales frontales y posteriores",
    items: [
      { lam: 22, est: ["rama","rama","rana","rana","rana"] },
      { lam: 23, est: ["mono","mono","mono","mono","mono"] },
      { lam: 24, est: ["cama","cana","cana","cana","cama"] }
    ]
  },
  {
    id: "I", label: "Fricativas y liquidas",
    items: [
      { lam: 25, est: ["pollo","pollo","pollo","pollo","polo"] },
      { lam: 26, est: ["llama","rama","rama","llama","llama"] },
      { lam: 27, est: ["sello","cero","sello","cero","cero"] }
    ]
  },
  {
    id: "J", label: "Africadas y fricativas",
    items: [
      { lam: 28, est: ["ocho","ocho","oso","oso","oso"] },
      { lam: 29, est: ["ocho","ocho","hoyo","hoyo","hoyo"] },
      { lam: 30, est: ["hacha","asa","asa","asa","hacha"] }
    ]
  },
  {
    id: "K", label: "Fricativas frontales y posteriores",
    items: [
      { lam: 31, est: ["fuego","juego","fuego","juego","juego"] },
      { lam: 32, est: ["casa","caja","caja","caja","casa"] },
      { lam: 33, est: ["fiesta","siesta","siesta","fiesta","fiesta"] }
    ]
  },
  {
    id: "L", label: "Liquidas",
    items: [
      { lam: 34, est: ["ola","hora","ola","hora","ola"] },
      { lam: 35, est: ["cero","cerro","cerro","cero","cero"] },
      { lam: 36, est: ["rata","rata","lata","rata","rata"] }
    ]
  }
];

export var TOTAL_ITEMS = 36;
export var STIMULI_PER_ITEM = 5;

export function computeRecoResults(responses) {
  var totalGroups = RECO_GROUPS.length;
  var groupResults = [];
  var totalCorrect = 0;
  var totalEvaluated = 0;
  var errorGroups = [];

  RECO_GROUPS.forEach(function(group) {
    var gCorrect = 0;
    var gTotal = 0;
    var gItems = [];

    group.items.forEach(function(item) {
      var key = item.lam;
      var r = responses[key];
      gTotal++;
      totalEvaluated++;
      if (r === true || r === "si") {
        gCorrect++;
        totalCorrect++;
        gItems.push({ lam: key, reconoce: true });
      } else if (r === false || r === "no") {
        gItems.push({ lam: key, reconoce: false });
      } else {
        // Sin respuesta se cuenta como no reconocido
        gItems.push({ lam: key, reconoce: false });
      }
    });

    var gPct = gTotal > 0 ? Math.round((gCorrect / gTotal) * 100) : 0;
    var grp = {
      id: group.id,
      label: group.label,
      correct: gCorrect,
      total: gTotal,
      pct: gPct,
      items: gItems
    };
    groupResults.push(grp);
    if (gCorrect < gTotal) {
      errorGroups.push(grp);
    }
  });

  var globalPct = totalEvaluated > 0 ? Math.round((totalCorrect / totalEvaluated) * 100) : 0;

  var severity;
  if (globalPct >= 95) severity = "Adecuado";
  else if (globalPct >= 80) severity = "Leve";
  else if (globalPct >= 60) severity = "Moderado";
  else severity = "Severo";

  return {
    correct: totalCorrect,
    total: totalEvaluated,
    pct: globalPct,
    severity: severity,
    groupResults: groupResults,
    errorGroups: errorGroups
  };
}
