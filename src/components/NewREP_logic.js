// NewREP — Logic: buildAllItems, computeResults, helpers
// PEFF-R protocol: each word is evaluated per position (ISPP/ISIP/CSIP/CSFP)
// Response = "" (not evaluated), "ok" (correct), or transcription string (error)
import { REP_CATEGORIES, POSITIONS } from "../data/repWordsData.js";

export function ageMo(birth){
  if(!birth) return 0;
  var b = new Date(birth), n = new Date();
  return (n.getFullYear()-b.getFullYear())*12+(n.getMonth()-b.getMonth());
}

export function ageLabel(m){ return Math.floor(m/12)+" a\u00f1os, "+(m%12)+" meses"; }

// Build flat list of evaluable items: one per word per position
export function buildAllItems(){
  var items = [];
  REP_CATEGORIES.forEach(function(cat){
    cat.items.forEach(function(phon){
      POSITIONS.forEach(function(pos){
        var ws = phon.words[pos.id];
        if(ws && ws.length > 0){
          ws.forEach(function(w){
            items.push({
              catId: cat.id, catTitle: cat.title,
              phonId: phon.id, phoneme: phon.phoneme, age: phon.age,
              ageCSIP: phon.ageCSIP || phon.age,
              posId: pos.id, posLabel: pos.label,
              word: w, key: phon.id+"_"+pos.id+"_"+w.replace(/\s/g,"_")
            });
          });
        }
      });
    });
  });
  return items;
}

export var ALL_ITEMS = buildAllItems();

// Build phoneme groups for evaluation UI: each phoneme shows a table with ISPP/ISIP/CSIP/CSFP columns
export function buildPhonemeRows(){
  var rows = [];
  REP_CATEGORIES.forEach(function(cat){
    cat.items.forEach(function(phon){
      // Collect words per position
      var posWords = {};
      var maxRows = 0;
      POSITIONS.forEach(function(pos){
        var ws = phon.words[pos.id] || [];
        posWords[pos.id] = ws;
        if(ws.length > maxRows) maxRows = ws.length;
      });
      rows.push({
        catId: cat.id, catTitle: cat.title,
        phonId: phon.id, phoneme: phon.phoneme, age: phon.age,
        ageCSIP: phon.ageCSIP || phon.age,
        posWords: posWords, maxRows: maxRows
      });
    });
  });
  return rows;
}

// Build category groups (for navigation tabs)
export function buildCatGroups(){
  var groups = [];
  REP_CATEGORIES.forEach(function(cat){
    var phonRows = [];
    cat.items.forEach(function(phon){
      var posWords = {};
      var maxRows = 0;
      POSITIONS.forEach(function(pos){
        var ws = phon.words[pos.id] || [];
        posWords[pos.id] = ws;
        if(ws.length > maxRows) maxRows = ws.length;
      });
      phonRows.push({
        phonId: phon.id, phoneme: phon.phoneme, age: phon.age,
        ageCSIP: phon.ageCSIP || phon.age,
        posWords: posWords, maxRows: maxRows
      });
    });
    groups.push({ id: cat.id, title: cat.title, phonRows: phonRows });
  });
  return groups;
}

// Generate key for a word response
export function wordKey(phonId, posId, word){
  return phonId+"_"+posId+"_"+word.replace(/\s/g,"_");
}

// Count evaluated items in a category
export function catProgress(catId, responses){
  var catItems = ALL_ITEMS.filter(function(it){ return it.catId === catId; });
  var answered = catItems.filter(function(it){ return responses[it.key] && responses[it.key] !== ""; }).length;
  return { answered: answered, total: catItems.length };
}

// Compute results from responses
// responses[key] = "ok" | "" (empty/not evaluated) | "transcription" (error text)
export function computeResults(responses){
  var byPhoneme = {};
  var byCat = {};
  var byPosition = { ISPP:{ok:0,err:0,total:0}, ISIP:{ok:0,err:0,total:0}, CSIP:{ok:0,err:0,total:0}, CSFP:{ok:0,err:0,total:0} };
  var totalCorrect = 0, totalEvaluated = 0, totalErrors = 0;
  var errorList = []; // detailed list of each error

  ALL_ITEMS.forEach(function(it){
    var r = responses[it.key];
    if(!r || r === "") return; // not evaluated
    totalEvaluated++;

    var isOk = (r === "ok");
    if(isOk) totalCorrect++;
    else {
      totalErrors++;
      errorList.push({
        phonId: it.phonId, phoneme: it.phoneme, posId: it.posId,
        word: it.word, produccion: r, age: it.age, catId: it.catId, catTitle: it.catTitle
      });
    }

    // By position
    if(byPosition[it.posId]){
      byPosition[it.posId].total++;
      if(isOk) byPosition[it.posId].ok++; else byPosition[it.posId].err++;
    }

    // By phoneme
    if(!byPhoneme[it.phonId]) byPhoneme[it.phonId] = { phoneme:it.phoneme, age:it.age, catId:it.catId, catTitle:it.catTitle, ok:0, errors:0, total:0, errorWords:[] };
    byPhoneme[it.phonId].total++;
    if(isOk) byPhoneme[it.phonId].ok++;
    else {
      byPhoneme[it.phonId].errors++;
      byPhoneme[it.phonId].errorWords.push({ word:it.word, pos:it.posId, produccion:r });
    }

    // By category
    if(!byCat[it.catId]) byCat[it.catId] = { title:it.catTitle, ok:0, errors:0, total:0 };
    byCat[it.catId].total++;
    if(isOk) byCat[it.catId].ok++; else byCat[it.catId].errors++;
  });

  var pcc = totalEvaluated > 0 ? Math.round((totalCorrect/totalEvaluated)*100) : 0;
  var severity;
  if(totalEvaluated === 0) severity = "\u2014";
  else if(pcc === 100) severity = "Adecuado";
  else if(pcc >= 85) severity = "Leve";
  else if(pcc >= 65) severity = "Leve-Moderado";
  else if(pcc >= 50) severity = "Moderado-Severo";
  else severity = "Severo";

  return {
    byPhoneme: byPhoneme, byCat: byCat, byPosition: byPosition,
    totalCorrect: totalCorrect, totalEvaluated: totalEvaluated, totalErrors: totalErrors,
    errorList: errorList, pcc: pcc, severity: severity
  };
}

export function scrollTop(){
  window.scrollTo({top:0,behavior:"smooth"});
  var el = document.getElementById("main-scroll");
  if(el) el.scrollTo({top:0,behavior:"smooth"});
}
