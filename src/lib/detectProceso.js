// Auto-detect proceso fonológico from target syllable vs patient production
var FONEMAS = {
  p:{punto:"labial",modo:"oclusivo",sonoro:false}, b:{punto:"labial",modo:"oclusivo",sonoro:true},
  m:{punto:"labial",modo:"nasal",sonoro:true}, f:{punto:"labiodental",modo:"fricativo",sonoro:false},
  t:{punto:"dental",modo:"oclusivo",sonoro:false}, d:{punto:"dental",modo:"oclusivo",sonoro:true},
  s:{punto:"alveolar",modo:"fricativo",sonoro:false}, n:{punto:"alveolar",modo:"nasal",sonoro:true},
  l:{punto:"alveolar",modo:"lateral",sonoro:true}, r:{punto:"alveolar",modo:"vibrante_simple",sonoro:true},
  rr:{punto:"alveolar",modo:"vibrante_multiple",sonoro:true},
  ch:{punto:"palatal",modo:"africado",sonoro:false},
  y:{punto:"palatal",modo:"fricativo",sonoro:true},
  k:{punto:"velar",modo:"oclusivo",sonoro:false}, g:{punto:"velar",modo:"oclusivo",sonoro:true},
  j:{punto:"velar",modo:"fricativo",sonoro:false},
  c:{punto:"velar",modo:"oclusivo",sonoro:false}, q:{punto:"velar",modo:"oclusivo",sonoro:false}
};

var toFonema = function(c){
  if(!c) return null;
  var cl = c.toLowerCase().replace(/\u00f1/g,"ny");
  if(cl==="ny") return {punto:"palatal",modo:"nasal",sonoro:true,id:"ny"};
  if(cl==="rr") return Object.assign({id:"rr"},FONEMAS["rr"]);
  if(cl==="ch") return Object.assign({id:"ch"},FONEMAS["ch"]);
  if(cl==="ll"||cl==="sh") return Object.assign({id:cl},{punto:"palatal",modo:"fricativo",sonoro:true});
  if(FONEMAS[cl]) return Object.assign({id:cl},FONEMAS[cl]);
  return null;
};

var extractConsonant = function(syl){
  if(!syl) return "";
  var s = syl.toLowerCase().replace(/\u00f1/g,"ny").trim();
  // Handle digraphs first
  if(s.startsWith("ch")||s.startsWith("rr")||s.startsWith("ll")||s.startsWith("ny")||s.startsWith("sh")) return s.slice(0,2);
  // Consonant groups (Cr, Cl) — return full group
  if(/^[bcdfgkptq]r[aeiou]/i.test(s)) return s.slice(0,2);
  if(/^[bcdfgkpt]l[aeiou]/i.test(s)) return s.slice(0,2);
  // Single or multiple consonants before vowel
  var m = s.match(/^([bcdfghjklmnpqrstvwxyz]+)/i);
  return m ? m[1] : "";
};

var OCLUSIVOS = ["p","b","t","d","k","g","c","q"];
var FRICATIVOS = ["f","s","j","y","sh"];
var LABIALES = ["p","b","m","f"];
var DENTALES = ["t","d"];
var ALVEOLARES = ["s","n","l","r","rr"];
var VELARES = ["k","g","j","c","q"];
var PALATALES = ["ch","y","ny","ll","sh"];

export function detectProceso(targetWord, produccion, errorType){
  if(!produccion || !targetWord) return "";
  var tw = targetWord.toLowerCase().trim();
  var pr = produccion.toLowerCase().trim();
  if(tw === pr) return "";

  var tCons = extractConsonant(tw);
  var pCons = extractConsonant(pr);
  // For phoneme comparison, use base consonant (first of group)
  var tBase = tCons.length === 2 && /^[bcdfgkptq][rl]$/.test(tCons) ? tCons[0] : tCons;
  var pBase = pCons.length === 2 && /^[bcdfgkptq][rl]$/.test(pCons) ? pCons[0] : pCons;
  var tF = toFonema(tBase);
  var pF = toFonema(pBase);

  if(errorType === "O"){
    if(tw.length > pr.length || tCons.length > pCons.length){
      if(tCons.length === 2 && pCons.length <= 1) return "red_grupo_cons";
      if(/[aeiou][mnlsrd]$/i.test(tw) && /[aeiou]$/i.test(pr)) return "omis_cons_final";
      if(pCons === "" && tCons !== "") return "omis_cons_inicial";
    }
    if(tw.length >= 4 && pr.length < tw.length - 1) return "omis_sil_atona";
    return "";
  }

  if(errorType === "S" && tF && pF){
    if(FRICATIVOS.indexOf(tCons)!==-1 && OCLUSIVOS.indexOf(pCons)!==-1) return "oclusivizacion";
    if(OCLUSIVOS.indexOf(tCons)!==-1 && FRICATIVOS.indexOf(pCons)!==-1) return "fricativizacion";
    if((VELARES.indexOf(tCons)!==-1||PALATALES.indexOf(tCons)!==-1) && (LABIALES.indexOf(pCons)!==-1||DENTALES.indexOf(pCons)!==-1)) return "frontalizacion";
    if((ALVEOLARES.indexOf(tCons)!==-1||DENTALES.indexOf(tCons)!==-1) && (VELARES.indexOf(pCons)!==-1||PALATALES.indexOf(pCons)!==-1)) return "posteriorizacion";
    if(tF.modo!=="nasal" && pF.modo==="nasal") return "nasalizacion";
    if(tF.modo==="nasal" && pF.modo!=="nasal") return "desnasalizacion";
    if(["l","r","d"].indexOf(tCons)!==-1 && ["l","r","d"].indexOf(pCons)!==-1 && tCons!==pCons) return "indif_lrd";
    if(tF.punto===pF.punto && tF.modo!==pF.modo) return "asim_cons_modo";
    if(tF.modo===pF.modo && tF.punto!==pF.punto) return "asim_cons_punto";
    if(tF.punto===pF.punto && tF.modo===pF.modo && tF.sonoro!==pF.sonoro) return "asim_cons_sonoridad";
  }

  return "";
}
