// NewREP — Logic: buildAllItems, computeResults, helpers
import { REP_CATEGORIES, POSITIONS } from "../data/repWordsData.js";

export function ageMo(birth){
  if(!birth) return 0;
  var b = new Date(birth), n = new Date();
  return (n.getFullYear()-b.getFullYear())*12+(n.getMonth()-b.getMonth());
}

export function ageLabel(m){ return Math.floor(m/12)+" a\u00f1os, "+(m%12)+" meses"; }

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

export function computeResults(responses){
  var byPhoneme = {};
  var byCat = {};
  var totalCorrect = 0, totalEvaluated = 0, totalErrors = 0;
  var errorDetail = { D:0, O:0, S:0 };

  ALL_ITEMS.forEach(function(it){
    var r = responses[it.key];
    if(!r || r === "NE") return;
    totalEvaluated++;
    if(r === "ok") totalCorrect++;
    else { totalErrors++; errorDetail[r] = (errorDetail[r]||0)+1; }

    if(!byPhoneme[it.phonId]) byPhoneme[it.phonId] = { phoneme:it.phoneme, age:it.age, catId:it.catId, catTitle:it.catTitle, ok:0, D:0, O:0, S:0, total:0 };
    byPhoneme[it.phonId].total++;
    if(r==="ok") byPhoneme[it.phonId].ok++;
    else byPhoneme[it.phonId][r]++;

    if(!byCat[it.catId]) byCat[it.catId] = { title:it.catTitle, ok:0, errors:0, total:0 };
    byCat[it.catId].total++;
    if(r==="ok") byCat[it.catId].ok++;
    else byCat[it.catId].errors++;
  });

  var pcc = totalEvaluated > 0 ? Math.round((totalCorrect/totalEvaluated)*100) : 0;
  var severity = totalErrors === 0 ? "Adecuado" : pcc >= 85 ? "Leve" : pcc >= 65 ? "Leve-Moderado" : pcc >= 50 ? "Moderado-Severo" : "Severo";

  return { byPhoneme:byPhoneme, byCat:byCat, totalCorrect:totalCorrect, totalEvaluated:totalEvaluated, totalErrors:totalErrors, errorDetail:errorDetail, pcc:pcc, severity:severity };
}

export function buildCatGroups(){
  return REP_CATEGORIES.map(function(cat){
    var catItems = ALL_ITEMS.filter(function(it){ return it.catId === cat.id; });
    var phonGroups = {};
    catItems.forEach(function(it){
      if(!phonGroups[it.phonId]) phonGroups[it.phonId] = { phoneme:it.phoneme, age:it.age, items:[] };
      phonGroups[it.phonId].items.push(it);
    });
    return { id:cat.id, title:cat.title, phonGroups:Object.values(phonGroups), allItems:catItems };
  });
}

export function catProgress(catId, responses){
  var catItems = ALL_ITEMS.filter(function(it){ return it.catId === catId; });
  var answered = catItems.filter(function(it){ return responses[it.key]; }).length;
  return { answered:answered, total:catItems.length };
}

export function scrollTop(){
  window.scrollTo({top:0,behavior:"smooth"});
  var el = document.getElementById("main-scroll");
  if(el) el.scrollTo({top:0,behavior:"smooth"});
}
