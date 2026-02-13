// NewELDI — Scoring logic (shared with RptELDI)
export var BANDS = [
  {min:0,max:5,label:"0;0\u20130;5"},{min:6,max:11,label:"0;6\u20130;11"},
  {min:12,max:17,label:"1;0\u20131;5"},{min:18,max:23,label:"1;6\u20131;11"},
  {min:24,max:29,label:"2;0\u20132;5"},{min:30,max:35,label:"2;6\u20132;11"},
  {min:36,max:41,label:"3;0\u20133;5"},{min:42,max:47,label:"3;6\u20133;11"},
  {min:48,max:59,label:"4;0\u20134;11"},{min:60,max:71,label:"5;0\u20135;11"},
  {min:72,max:95,label:"6;0\u20137;11"}
];

export function getBandIndex(ageMo){
  for(var i=BANDS.length-1;i>=0;i--){ if(ageMo>=BANDS[i].min) return i; }
  return 0;
}

export function calcScoring(items, rsp, ageMo){
  var bandIdx = getBandIndex(ageMo);
  var expectedCount = (bandIdx+1)*5;
  var expectedItems = items.slice(0, expectedCount);
  var logrado=0, noLogrado=0, noEvaluado=[];
  items.forEach(function(i){
    var v = rsp[i.id];
    if(v===true) logrado++;
    else if(v===false) noLogrado++;
    else noEvaluado.push(i.id);
  });
  var logradoExpected = 0;
  expectedItems.forEach(function(i){ if(rsp[i.id]===true) logradoExpected++; });
  var devAgeBandIdx = -1;
  for(var b=0; b<BANDS.length; b++){
    var bandItems = items.slice(b*5, b*5+5);
    var passed = bandItems.filter(function(i){ return rsp[i.id]===true; }).length;
    if(passed>=4) devAgeBandIdx=b; else break;
  }
  var devAgeLabel = devAgeBandIdx>=0 ? BANDS[devAgeBandIdx].label : null;
  var pctExpected = expectedCount>0 ? Math.round(logradoExpected/expectedCount*100) : null;
  var classification=null, classColor=null;
  if(pctExpected!==null){
    if(pctExpected>=90){ classification="Dentro de L\u00edmites Normales"; classColor="#059669"; }
    else if(pctExpected>=75){ classification="En Riesgo / Retraso Leve"; classColor="#f59e0b"; }
    else if(pctExpected>=50){ classification="Retraso Moderado"; classColor="#ea580c"; }
    else{ classification="Retraso Significativo"; classColor="#dc2626"; }
  }
  return { logrado:logrado, noLogrado:noLogrado, noEvaluado:noEvaluado, total:items.length,
    evaluados:logrado+noLogrado,
    pctLogrado:(logrado+noLogrado)>0 ? Math.round(logrado/(logrado+noLogrado)*100) : null,
    expectedCount:expectedCount, logradoExpected:logradoExpected, pctExpected:pctExpected,
    devAgeBandIdx:devAgeBandIdx, devAgeLabel:devAgeLabel,
    classification:classification, classColor:classColor };
}

export function gm(b,e){
  var B=new Date(b), E=new Date(e);
  var m=(E.getFullYear()-B.getFullYear())*12+E.getMonth()-B.getMonth();
  if(E.getDate()<B.getDate()) m--;
  return Math.max(0,m);
}

export function fa(m){ return Math.floor(m/12)+" a\u00f1os, "+(m%12)+" meses"; }

export function scrollTop(){
  var el = document.getElementById("main-scroll");
  if(el) el.scrollTo({top:0,behavior:"smooth"});
  else window.scrollTo({top:0,behavior:"smooth"});
}

export function noEvalGrouped(noEvalIds, items){
  var groups = {};
  noEvalIds.forEach(function(id){
    var item = items.find(function(i){ return i.id===id; });
    if(item){ if(!groups[item.a]) groups[item.a]=[]; groups[item.a].push(item); }
  });
  return groups;
}
