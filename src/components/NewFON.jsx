// NewFON — Evaluacion Fonetica (repeticion de silabas, seccion 2 del PEFF)
import { useState, useCallback, useEffect } from "react";
import { PEFF_SECTIONS } from "../data/peffSections.js";
import { PF_CATEGORIES, ALL_PROCESSES } from "../data/peffProcesos.js";
import EvalShell from "./EvalShell.jsx";
import { detectProceso } from "../lib/detectProceso.js";
import { db, doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "../firebase.js";

var FON_SECTION_RAW = PEFF_SECTIONS.find(function(s){ return s.id === "fon"; });
// Filter out Vocales and clean titles (remove "X años")
var FON_SECTION = {
  id: FON_SECTION_RAW.id,
  title: FON_SECTION_RAW.title,
  description: FON_SECTION_RAW.description,
  subsections: FON_SECTION_RAW.subsections.filter(function(sub){
    return sub.id !== "sil_2"; // Remove Vocales
  }).map(function(sub){
    return Object.assign({}, sub, {
      title: sub.title.replace(/\s*\d+\s*a\u00f1os?\s*/gi, " ").replace(/^\d+\.\d*\s*/, "").replace(/Fonemas\s*/, "Fonemas ").trim()
    });
  })
};
var I = {width:"100%",padding:"10px 14px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,background:"#f8faf9"};

// Preload voices
var _cachedVoice = null;
var _voicesLoaded = false;
var findBestVoice = function(){
  var voices = window.speechSynthesis.getVoices();
  if(!voices.length) return null;
  return voices.find(function(v){return /es[-_]AR/i.test(v.lang) && /Google|Microsoft/i.test(v.name)})
    || voices.find(function(v){return /es/i.test(v.lang) && /Google/i.test(v.name)})
    || voices.find(function(v){return /es/i.test(v.lang) && /Microsoft/i.test(v.name)})
    || voices.find(function(v){return /es[-_]AR/i.test(v.lang)})
    || voices.find(function(v){return /es[-_]MX/i.test(v.lang)})
    || voices.find(function(v){return /es[-_]ES/i.test(v.lang)})
    || voices.find(function(v){return v.lang.startsWith("es")});
};
if(window.speechSynthesis){
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = function(){
    _cachedVoice = findBestVoice();
    _voicesLoaded = true;
  };
  // Try immediately in case voices are already loaded
  var imm = findBestVoice();
  if(imm){ _cachedVoice = imm; _voicesLoaded = true; }
}

// Correcciones fonéticas para sílabas que el sintetizador pronuncia mal
var PHON_FIX = {
  // Estrategia: agregar punto al final fuerza al sintetizador a
  // tratar la sílaba como palabra completa sin deletrear.
  // Solo las que fallan sin corrección.
  
  // J - sin punto el sintetizador las lee como Y
  "ja":"jaa.","je":"jee.","ji":"jii.","jo":"joo.","ju":"juu.",
  // B - sin punto deletrea
  "ba":"baa.","be":"bee.","bi":"bii.","bo":"boo.","bu":"buu.",
  // CH
  "cha":"chaa.","che":"chee.","chi":"chii.","cho":"choo.","chu":"chuu.",
  // G - ga/go/gu normales, ge/gi suenan como je/ji
  "ga":"gaa.","ge":"jee.","gi":"jii.","go":"goo.","gu":"guu.",
  // Grupos consonánticos
  "bla":"blaa.","ble":"blee.","bli":"blii.","blo":"bloo.","blu":"bluu.",
  "bra":"braa.","bre":"bree.","bri":"brii.","bro":"broo.","bru":"bruu.",
  "cla":"claa.","cle":"clee.","cli":"clii.","clo":"cloo.","clu":"cluu.",
  "cra":"craa.","cre":"cree.","cri":"crii.","cro":"croo.","cru":"cruu.",
  "dra":"draa.","dre":"dree.","dri":"drii.","dro":"droo.","dru":"druu.",
  "fla":"flaa.","fle":"flee.","fli":"flii.","flo":"floo.","flu":"fluu.",
  "fra":"fraa.","fre":"free.","fri":"frii.","fro":"froo.","fru":"fruu.",
  "gla":"glaa.","gle":"glee.","gli":"glii.","glo":"gloo.","glu":"gluu.",
  "gra":"graa.","gre":"gree.","gri":"grii.","gro":"groo.","gru":"gruu.",
  "pla":"plaa.","ple":"plee.","pli":"plii.","plo":"ploo.","plu":"pluu.",
  "pra":"praa.","pre":"pree.","pri":"prii.","pro":"proo.","pru":"pruu.",
  "tra":"traa.","tre":"tree.","tri":"trii.","tro":"troo.","tru":"truu.",
  // RR
  "rra":"rraa.","rre":"rree.","rri":"rrii.","rro":"rroo.","rru":"rruu.",
  // Diptongos
  "au":"aau.","ei":"eei.","ou":"oou.",
  // ARE y similares
  "are":"aare.","ere":"eere.","ire":"iire.","ore":"oore.","ure":"uure."
};

var speak = function(text){
  if(!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  // Aplicar corrección fonética
  var fixed = PHON_FIX[text.toLowerCase()] || text;
  var u = new SpeechSynthesisUtterance(fixed);
  u.lang = "es-AR"; u.rate = 0.72; u.pitch = 1.05; u.volume = 1;
  if(!_cachedVoice && !_voicesLoaded){ _cachedVoice = findBestVoice(); }
  if(_cachedVoice) u.voice = _cachedVoice;
  window.speechSynthesis.speak(u);
};

var sevCalc = function(pct){
  if(pct >= 100) return "Adecuado";
  if(pct >= 85) return "Leve";
  if(pct >= 65) return "Leve-Moderado";
  if(pct >= 50) return "Moderado-Severo";
  return "Severo";
};
var sevColor = {"Adecuado":"#059669","Leve":"#84cc16","Leve-Moderado":"#f59e0b","Moderado-Severo":"#ea580c","Severo":"#dc2626"};


var config = {
  evalType: "fon",
  title: "Evaluacion Fonetica",
  subtitle: "Repeticion de silabas - produccion fonetica",
  icon: "\ud83d\udde3\ufe0f",
  color: "#6d28d9",
  steps: ["Paciente"].concat(FON_SECTION.subsections.map(function(s){ return s.title.replace(/^\d+\.\d*\s*/,""); })).concat(["Resultados"])
};

function computeResults(responses, obsMap){
  var allItems = FON_SECTION.subsections.flatMap(function(sub){ return sub.items || []; });
  var ok = allItems.filter(function(i){ return responses[i.id] === "ok"; }).length;
  var evaluated = allItems.filter(function(i){ return !!responses[i.id]; }).length;
  var pct = evaluated > 0 ? Math.round(ok / evaluated * 100) : 0;
  var sev = sevCalc(pct);
  // Process analysis from obsMap (proceso fonologico data)
  var procErrors = [];
  Object.keys(obsMap).forEach(function(itemId){
    var pd = obsMap[itemId];
    if(!pd || !pd.proceso) return;
    var proc = ALL_PROCESSES.find(function(p){ return p.id === pd.proceso; });
    var item = allItems.find(function(i){ return i.id === itemId; });
    procErrors.push({ word: item ? item.word : itemId, target: item ? item.target : "", produccion: pd.produccion || "", procesoName: proc ? proc.name : pd.proceso });
  });
  return { ok: ok, total: allItems.length, evaluated: evaluated, pct: pct, severity: sev, procErrors: procErrors };
}

function buildPayloadExtra(responses, obsMap){
  return { seccionData: responses, procesosData: obsMap };
}

export default function NewFON({ onS, nfy, userId, draft, therapistInfo, isAdmin }){
  var _procData = useState({}), procData = _procData[0], setProcData = _procData[1];
  var _savedAudios = useState({}), savedAudios = _savedAudios[0], setSavedAudios = _savedAudios[1];
  var _recording = useState(null), recording = _recording[0], setRecording = _recording[1];
  // Override temporal del texto que se pasa al sintetizador (editable por admin)
  var _overrideWords = useState({}), overrideWords = _overrideWords[0], setOverrideWords = _overrideWords[1];

  useEffect(function(){
    getDocs(collection(db,"fon_audios")).then(function(snap){
      var audios = {};
      snap.docs.forEach(function(d){ audios[d.id] = d.data().audio; });
      // Si la colección nueva está vacía, migrar del documento viejo
      if(Object.keys(audios).length === 0){
        getDoc(doc(db,"config","fon_audios")).then(function(oldSnap){
          if(oldSnap.exists()){
            var oldData = oldSnap.data();
            var keys = Object.keys(oldData);
            if(keys.length > 0){
              // Migrar cada audio a documento individual
              var promises = keys.map(function(k){
                return setDoc(doc(db,"fon_audios",k), {audio: oldData[k], updatedAt: new Date().toISOString()});
              });
              Promise.all(promises).then(function(){
                setSavedAudios(oldData);
              }).catch(function(){
                setSavedAudios(oldData); // usar en memoria aunque falle guardar
              });
              return;
            }
          }
          setSavedAudios({});
        }).catch(function(){ setSavedAudios({}); });
      } else {
        setSavedAudios(audios);
      }
    }).catch(function(){ setSavedAudios({}); });
  },[]);

  // Guardar audio individual en Firestore (1 doc por sílaba, sin límite de 1MB)
  var saveAudio = function(word, base64){
    var key = word.toLowerCase();
    setDoc(doc(db,"fon_audios",key), {audio: base64, updatedAt: new Date().toISOString()}).then(function(){
      setSavedAudios(function(prev){
        var next = Object.assign({}, prev);
        next[key] = base64;
        return next;
      });
    }).catch(function(e){ nfy("Error: "+e.message,"er"); });
    setRecording(null);
  };

  // Admin: reproducir sintetizador + grabar con micrófono al mismo tiempo
  var speakAndRecord = function(word){
    setRecording(word.toLowerCase());
    navigator.mediaDevices.getUserMedia({audio:true}).then(function(stream){
      var mr = new MediaRecorder(stream, {mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4"});
      var chunks = [];
      mr.ondataavailable = function(e){ if(e.data.size > 0) chunks.push(e.data); };
      mr.onstop = function(){
        stream.getTracks().forEach(function(t){t.stop()});
        if(chunks.length === 0){ setRecording(null); return; }
        var blob = new Blob(chunks, {type: mr.mimeType});
        var reader = new FileReader();
        reader.onloadend = function(){ saveAudio(word, reader.result); };
        reader.readAsDataURL(blob);
      };
      mr.start();
      // Reproducir sintetizador
      if(!window.speechSynthesis){ mr.stop(); return; }
      window.speechSynthesis.cancel();
      var key = word.toLowerCase();
      var textToSpeak = overrideWords[key] || PHON_FIX[key] || word;
      var u = new SpeechSynthesisUtterance(textToSpeak);
      u.lang = "es-AR"; u.rate = 0.72; u.pitch = 1.05; u.volume = 1;
      if(_cachedVoice) u.voice = _cachedVoice;
      // Cuando termina de hablar, parar grabación automáticamente
      u.onend = function(){
        setTimeout(function(){ if(mr.state === "recording") mr.stop(); }, 300);
      };
      u.onerror = function(){ if(mr.state === "recording") mr.stop(); };
      window.speechSynthesis.speak(u);
    }).catch(function(){
      setRecording(null);
      // Si no hay micrófono, solo reproducir
      speak(word);
    });
  };

  // Reproducir: audio guardado si existe, sino sintetizador (o grabar si admin)
  var playWord = function(word){
    var key = word.toLowerCase();
    if(savedAudios[key]){
      var audio = new Audio(savedAudios[key]);
      audio.play().catch(function(){ speak(word); });
    } else if(isAdmin) {
      // Admin sin audio guardado: reproducir + grabar
      speakAndRecord(word);
    } else {
      speak(word);
    }
  };

  var renderEval = useCallback(function(props){
    var subIdx = props.step - 1;
    if(subIdx < 0 || subIdx >= FON_SECTION.subsections.length) return null;
    var sub = FON_SECTION.subsections[subIdx];
    var items = sub.items || [];

    var spf = function(itemId, field, val){
      setProcData(function(prev){ var n = Object.assign({}, prev); if(!n[itemId]) n[itemId] = {}; n[itemId][field] = val; props.setOb(itemId, n[itemId]); return n; });
    };

    var legendItems = [
      {v:"\u2713",bg:"#059669",t:"Correcto"},{v:"D",bg:"#f59e0b",t:"Distorsion"},
      {v:"O",bg:"#dc2626",t:"Omision"},{v:"S",bg:"#7c3aed",t:"Sustitucion"}
    ];

    return <div>
      <h3 style={{fontSize:16,fontWeight:700,color:"#6d28d9",marginBottom:4}}>{sub.title}</h3>
      {sub.description && <p style={{fontSize:12,color:"#64748b",marginBottom:12}}>{sub.description}</p>}

      {/* Legend */}
      <div style={{background:"#ede9fe",border:"1px solid #c4b5fd",borderRadius:10,padding:12,marginBottom:16}}>
        <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          {legendItems.map(function(o){ return <div key={o.v} style={{display:"flex",alignItems:"center",gap:4}}>
            <div style={{width:22,height:22,borderRadius:5,background:o.bg,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}}>{o.v}</div>
            <span style={{fontSize:11}}>{o.t}</span>
          </div>; })}
        </div>
      </div>

      {items.map(function(item){
        var v = props.responses[item.id] || "";
        var isError = v==="D"||v==="O"||v==="S";
        var pd = procData[item.id] || {};
        return <div key={item.id} style={{marginBottom:isError?12:4}}>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",background:isError?"#fef2f2":v==="ok"?"#f0fdf4":"#fff",borderRadius:isError?"8px 8px 0 0":8,border:"1px solid "+(isError?"#fecaca":v==="ok"?"#bbf7d0":"#e2e8f0"),flexWrap:isAdmin?"wrap":"nowrap"}}>
            {savedAudios[item.word.toLowerCase()] ? <button onClick={function(){playWord(item.word)}} style={{background:"#059669",border:"none",borderRadius:6,padding:"4px 8px",fontSize:12,cursor:"pointer",color:"#fff"}}>{"\ud83d\udd0a Escuchar"}</button> : <button onClick={function(){playWord(item.word)}} disabled={recording===item.word.toLowerCase()} style={{background:recording===item.word.toLowerCase()?"#dc2626":"#ede9fe",border:"1px solid "+(recording===item.word.toLowerCase()?"#dc2626":"#c4b5fd"),borderRadius:6,padding:"4px 8px",fontSize:12,cursor:recording===item.word.toLowerCase()?"wait":"pointer",color:recording===item.word.toLowerCase()?"#fff":"#6d28d9"}}>{recording===item.word.toLowerCase()?"\ud83d\udd34 Grabando...":"Escuchar"}</button>}
            {isAdmin && savedAudios[item.word.toLowerCase()] && <button onClick={function(){ var next = Object.assign({},savedAudios); delete next[item.word.toLowerCase()]; setSavedAudios(next); setDoc(doc(db,"config","fon_audios"),next).catch(function(){}); }} style={{background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:6,padding:"4px 8px",fontSize:11,cursor:"pointer",color:"#64748b"}}>{"Reemplazar"}</button>}
            {isAdmin && savedAudios[item.word.toLowerCase()] && <span style={{fontSize:11,color:"#059669",fontWeight:600}}>{"\u2705 Guardado"}</span>}
            <span style={{fontWeight:700,fontSize:16,minWidth:50,color:"#6d28d9"}}>{item.word}</span>
            {isAdmin && !savedAudios[item.word.toLowerCase()] && <input value={overrideWords[item.word.toLowerCase()]||PHON_FIX[item.word.toLowerCase()]||item.word} onChange={function(e){ var w=item.word.toLowerCase(); setOverrideWords(function(p){ var n=Object.assign({},p); n[w]=e.target.value; return n; }); }} style={{width:80,padding:"2px 6px",border:"1px solid #e2e8f0",borderRadius:4,fontSize:11,color:"#475569",background:"#f8faf9"}} title={"Texto que se pasa al sintetizador"} />}
            <span style={{fontSize:12,color:"#64748b",flex:1}}>{item.target}</span>
            <div style={{display:"flex",gap:4}}>
              {[{v:"ok",l:"\u2713",bg:"#059669"},{v:"D",l:"D",bg:"#f59e0b"},{v:"O",l:"O",bg:"#dc2626"},{v:"S",l:"S",bg:"#7c3aed"}].map(function(o){
                return <button key={o.v} onClick={function(){props.setResponse(item.id, v===o.v ? "" : o.v); if(o.v==="ok") setProcData(function(p){var n=Object.assign({},p);delete n[item.id];return n})}} style={{width:30,height:30,borderRadius:6,border:v===o.v?"2px solid "+o.bg:"1px solid #e2e8f0",background:v===o.v?o.bg:"#fff",color:v===o.v?"#fff":"#64748b",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{o.l}</button>;
              })}
            </div>
          </div>
          {isError && <div style={{background:"#fff5f5",border:"1px solid #fecaca",borderTop:"none",borderRadius:"0 0 8px 8px",padding:"10px 14px"}}>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:180}}>
                <label style={{fontSize:10,fontWeight:700,color:"#dc2626",display:"block",marginBottom:3}}>{"Produccion del paciente"}</label>
                <input value={pd.produccion||""} onChange={function(e){
                  var val = e.target.value;
                  spf(item.id,"produccion",val);
                  // Auto-detect proceso fonológico
                  var detected = detectProceso(item.word, val, v);
                  if(detected && !(pd.proceso && pd.manualProceso)){
                    spf(item.id,"proceso",detected);
                    spf(item.id,"autoDetected",true);
                  }
                }} style={Object.assign({},I,{fontSize:13,padding:"6px 10px",background:"#fff"})} placeholder={"Que dijo en vez de "+item.word}/>
              </div>
              <div style={{flex:2,minWidth:220}}>
                <label style={{fontSize:10,fontWeight:700,color:"#dc2626",display:"block",marginBottom:3}}>
                  {"Proceso fonologico"}
                  {pd.autoDetected && !pd.manualProceso && <span style={{marginLeft:6,fontSize:9,color:"#7c3aed",background:"#ede9fe",padding:"1px 6px",borderRadius:4,fontWeight:600}}>{"auto-detectado"}</span>}
                </label>
                <select value={pd.proceso||""} onChange={function(e){spf(item.id,"proceso",e.target.value);spf(item.id,"manualProceso",true);spf(item.id,"autoDetected",false)}} style={Object.assign({},I,{fontSize:13,padding:"6px 10px",background:pd.autoDetected&&!pd.manualProceso?"#f5f3ff":"#fff",cursor:"pointer",borderColor:pd.autoDetected&&!pd.manualProceso?"#a78bfa":"#e2e8f0"})}>
                  <option value="">-- Clasificar --</option>
                  {PF_CATEGORIES.map(function(cat){ return <optgroup key={cat.id} label={cat.title}>
                    {cat.processes.map(function(pr){ return <option key={pr.id} value={pr.id}>{pr.name}</option>; })}
                  </optgroup>; })}
                </select>
              </div>
            </div>
          </div>}
        </div>;
      })}

      <div style={{display:"flex",justifyContent:"space-between",marginTop:20,paddingTop:14,borderTop:"1px solid #e2e8f0"}}>
        <button onClick={function(){ props.setStep(props.step-1); props.scrollTop(); }} style={{background:"#f1f5f9",border:"none",padding:"10px 22px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{"Atras"}</button>
        <button onClick={function(){ props.setStep(props.step+1); props.scrollTop(); }} style={{background:"#6d28d9",color:"#fff",border:"none",padding:"10px 22px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{props.step < props.RESULT_STEP - 1 ? "Siguiente" : "Ver Resultados"}</button>
      </div>
    </div>;
  },[procData, recording, savedAudios, isAdmin, overrideWords]);

  var renderTechDetails = function(results){
    var sc = sevColor[results.severity] || "#6d28d9";
    return <div style={{marginBottom:16}}>
      <div style={{background:"linear-gradient(135deg,"+sc+"dd,"+sc+")",borderRadius:12,padding:24,color:"#fff",marginBottom:16}}>
        <div style={{fontSize:13,opacity:.8,marginBottom:4}}>Severidad PCC</div>
        <div style={{fontSize:36,fontWeight:700}}>{results.severity}</div>
        <div style={{fontSize:13,opacity:.9}}>{results.ok + "/" + results.evaluated + " correctos (" + results.pct + "%)"}</div>
      </div>
      {results.procErrors.length > 0 && <div style={{background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:20}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:10}}>{"Errores identificados (" + results.procErrors.length + ")"}</div>
        {results.procErrors.map(function(e,i){
          return <div key={i} style={{padding:"8px 12px",background:"#fef2f2",borderRadius:8,marginBottom:4,fontSize:13}}>
            <b>{e.word}</b>{" (" + e.target + ") -> " + e.produccion + " | " + e.procesoName}
          </div>;
        })}
      </div>}
    </div>;
  };

  return <><style>{"@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}"}</style><EvalShell
    onS={onS} nfy={nfy} userId={userId}
    config={config}
    renderEval={renderEval}
    computeResults={computeResults}
    buildPayloadExtra={buildPayloadExtra}
    renderTechDetails={renderTechDetails}
    draft={draft} therapistInfo={therapistInfo}
    isAdmin={isAdmin}
  /></>;
}
