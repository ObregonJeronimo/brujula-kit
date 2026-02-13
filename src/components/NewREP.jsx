import { useState, useEffect, useCallback, useRef } from "react";
import { REP_CATEGORIES, POSITIONS, ERROR_TYPES } from "../data/repWordsData.js";
import PatientLookup from "./PatientLookup.jsx";

var K = { sd:"#0a3d2f", ac:"#0d9488", al:"#ccfbf1", mt:"#64748b", bd:"#e2e8f0", bg:"#f0f5f3" };

function ageMo(birth){
  if(!birth) return 0;
  var b = new Date(birth), n = new Date();
  return (n.getFullYear()-b.getFullYear())*12+(n.getMonth()-b.getMonth());
}
function ageLabel(m){ return Math.floor(m/12)+" a\u00f1os, "+(m%12)+" meses"; }

function buildAllItems(){
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

var ALL_ITEMS = buildAllItems();

function computeResults(responses){
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

export default function NewREP({ onS, nfy, userId }){
  var _st = useState(0), step = _st[0], setStep = _st[1];
  var _pat = useState(null), patient = _pat[0], setPatient = _pat[1];
  var _ed = useState(""), evalDate = _ed[0], setEvalDate = _ed[1];
  var _ref = useState(""), derivado = _ref[0], setDerivado = _ref[1];
  var _rsp = useState({}), responses = _rsp[0], setResponses = _rsp[1];
  var _obs = useState(""), obs = _obs[0], setObs = _obs[1];
  var _ci = useState(0), catIdx = _ci[0], setCatIdx = _ci[1];
  var mainRef = useRef(null);

  var patientAge = patient ? ageMo(patient.fechaNacimiento) : 0;

  var catGroups = REP_CATEGORIES.map(function(cat){
    var catItems = ALL_ITEMS.filter(function(it){ return it.catId === cat.id; });
    var phonGroups = {};
    catItems.forEach(function(it){
      if(!phonGroups[it.phonId]) phonGroups[it.phonId] = { phoneme:it.phoneme, age:it.age, items:[] };
      phonGroups[it.phonId].items.push(it);
    });
    return { id:cat.id, title:cat.title, phonGroups:Object.values(phonGroups), allItems:catItems };
  });

  var setResponse = useCallback(function(key, val){
    setResponses(function(prev){
      var n = Object.assign({}, prev);
      if(n[key] === val) delete n[key];
      else n[key] = val;
      return n;
    });
  },[]);

  var markAllCat = useCallback(function(catId, val){
    setResponses(function(prev){
      var n = Object.assign({}, prev);
      ALL_ITEMS.filter(function(it){ return it.catId === catId; }).forEach(function(it){ n[it.key] = val; });
      return n;
    });
  },[]);

  var scrollTop = function(){ window.scrollTo({top:0,behavior:"smooth"}); var el=document.getElementById("main-scroll"); if(el) el.scrollTo({top:0,behavior:"smooth"}); };

  var catProgress = function(catId){
    var catItems = ALL_ITEMS.filter(function(it){ return it.catId === catId; });
    var answered = catItems.filter(function(it){ return responses[it.key]; }).length;
    return { answered:answered, total:catItems.length };
  };

  var handleSave = function(){
    var res = computeResults(responses);
    var payload = {
      tipo: "rep_palabras",
      paciente: patient.nombre,
      pacienteDni: patient.dni || "",
      fechaNacimiento: patient.fechaNacimiento || "",
      edadMeses: patientAge,
      fechaEvaluacion: evalDate,
      derivadoPor: derivado,
      observaciones: obs,
      responses: responses,
      resultados: res
    };
    onS(payload);
  };

  var results = step === 2 ? computeResults(responses) : null;

  return (
    <div ref={mainRef} style={{animation:"fi .3s ease",maxWidth:900,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <span style={{fontSize:32}}>{"\ud83d\udcdd"}</span>
        <div>
          <h1 style={{fontSize:20,fontWeight:700,margin:0}}>{"Repetici\u00f3n de Palabras"}</h1>
          <p style={{fontSize:12,color:K.mt,margin:0}}>{"PEFF 3.2 \u2014 An\u00e1lisis fon\u00e9tico-fonol\u00f3gico"}</p>
        </div>
      </div>

      <div style={{display:"flex",gap:4,marginBottom:24}}>
        {["Paciente","Evaluaci\u00f3n","Resultados"].map(function(lb,i){
          var active = step === i;
          var done = step > i;
          return <div key={i} style={{flex:1,textAlign:"center",padding:"8px 0",borderRadius:8,fontSize:13,fontWeight:active?700:500,
            background:active?K.ac:done?"#059669":"#f1f5f9",color:active||done?"#fff":K.mt}}>{(i+1)+". "+lb}</div>;
        })}
      </div>

      {step===0 && <div>
        <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:24,marginBottom:16}}>
          <h3 style={{fontSize:16,fontWeight:600,marginBottom:16}}>{"Datos del paciente"}</h3>
          <PatientLookup userId={userId} onSelect={setPatient} selected={patient} />
        </div>
        {patient && <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:24,marginBottom:16}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>{"Fecha de evaluaci\u00f3n"}</label>
              <input type="date" value={evalDate} onChange={function(e){setEvalDate(e.target.value)}}
                style={{width:"100%",padding:"10px 12px",border:"1px solid "+K.bd,borderRadius:8,fontSize:14}} />
            </div>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>{"Derivado por"}</label>
              <input value={derivado} onChange={function(e){setDerivado(e.target.value)}} placeholder="Nombre del derivador"
                style={{width:"100%",padding:"10px 12px",border:"1px solid "+K.bd,borderRadius:8,fontSize:14}} />
            </div>
          </div>
          {patientAge > 0 && <div style={{marginTop:12,padding:"8px 14px",background:K.al,borderRadius:8,fontSize:13,color:K.sd,fontWeight:600}}>
            {"Edad: "+ageLabel(patientAge)}
          </div>}
        </div>}
        <button onClick={function(){ if(!patient){nfy("Seleccion\u00e1 un paciente","er");return;} if(!evalDate){nfy("Ingres\u00e1 la fecha","er");return;} setStep(1); scrollTop(); }}
          disabled={!patient||!evalDate}
          style={{width:"100%",padding:"14px",background:(!patient||!evalDate)?"#94a3b8":K.ac,color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:(!patient||!evalDate)?"not-allowed":"pointer"}}>
          {"Comenzar evaluaci\u00f3n \u2192"}
        </button>
      </div>}

      {step===1 && <div>
        <div style={{display:"flex",gap:4,marginBottom:16,overflowX:"auto",paddingBottom:4}}>
          {catGroups.map(function(cg,i){
            var prog = catProgress(cg.id);
            var active = catIdx === i;
            var complete = prog.answered === prog.total && prog.total > 0;
            return <button key={cg.id} onClick={function(){setCatIdx(i);scrollTop();}}
              style={{padding:"8px 12px",borderRadius:8,border:active?"2px solid "+K.ac:"1px solid "+K.bd,
                background:active?K.al:complete?"#dcfce7":"#fff",color:active?K.sd:complete?"#059669":K.mt,
                fontSize:11,fontWeight:active?700:500,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>
              {cg.title}
              {prog.total>0 && <span style={{display:"block",fontSize:9,marginTop:2}}>{prog.answered+"/"+prog.total}</span>}
            </button>;
          })}
        </div>

        {(function(){
          var cg = catGroups[catIdx];
          if(!cg) return null;
          return <div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <h2 style={{fontSize:17,fontWeight:700,margin:0}}>{cg.title}</h2>
              <div style={{display:"flex",gap:6}}>
                <button onClick={function(){markAllCat(cg.id,"ok")}}
                  style={{padding:"6px 12px",borderRadius:6,border:"1px solid #059669",background:"#dcfce7",color:"#059669",fontSize:11,fontWeight:600,cursor:"pointer"}}>
                  {"\u2713 Todo correcto"}</button>
                <button onClick={function(){markAllCat(cg.id,"NE")}}
                  style={{padding:"6px 12px",borderRadius:6,border:"1px solid "+K.bd,background:"#f8fafc",color:K.mt,fontSize:11,fontWeight:600,cursor:"pointer"}}>
                  {"No evaluado"}</button>
              </div>
            </div>

            <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
              {ERROR_TYPES.map(function(et){
                return <span key={et.id} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:K.mt}}>
                  <span style={{width:20,height:20,borderRadius:4,background:et.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}}>{et.label}</span>
                  {et.desc}
                </span>;
              })}
              <span style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:K.mt}}>
                <span style={{width:20,height:20,borderRadius:4,background:"#94a3b8",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700}}>NE</span>
                No evaluado
              </span>
            </div>

            {cg.phonGroups.map(function(pg){
              var isExpected = (patientAge/12) >= pg.age;
              return <div key={pg.phoneme} style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,marginBottom:12,overflow:"hidden"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",
                  background:isExpected?"#f0fdf4":"#fffbeb",borderBottom:"1px solid "+K.bd}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <span style={{fontSize:18,fontWeight:700,color:K.sd}}>{pg.phoneme}</span>
                    <span style={{fontSize:11,color:K.mt,background:"#f1f5f9",padding:"2px 8px",borderRadius:10}}>
                      {"Adquisici\u00f3n: "+pg.age+" a\u00f1os"}
                    </span>
                    {!isExpected && <span style={{fontSize:10,color:"#d97706",background:"#fef3c7",padding:"2px 8px",borderRadius:10,fontWeight:600}}>
                      {"No esperado a\u00fan"}
                    </span>}
                  </div>
                </div>
                <div style={{padding:"12px 16px"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                    <thead>
                      <tr>
                        <th style={{textAlign:"left",padding:"4px 8px",color:K.mt,fontSize:11,fontWeight:600,borderBottom:"1px solid "+K.bd}}>Palabra</th>
                        <th style={{textAlign:"center",padding:"4px 4px",color:K.mt,fontSize:10,fontWeight:600,borderBottom:"1px solid "+K.bd,width:40}}>Pos.</th>
                        {ERROR_TYPES.map(function(et){
                          return <th key={et.id} style={{textAlign:"center",padding:"4px 2px",width:36,borderBottom:"1px solid "+K.bd}}>
                            <span style={{width:24,height:24,borderRadius:4,background:et.color,color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}}>{et.label}</span>
                          </th>;
                        })}
                        <th style={{textAlign:"center",padding:"4px 2px",width:36,borderBottom:"1px solid "+K.bd}}>
                          <span style={{width:24,height:24,borderRadius:4,background:"#94a3b8",color:"#fff",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700}}>NE</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pg.items.map(function(it){
                        var current = responses[it.key] || "";
                        return <tr key={it.key} style={{borderBottom:"1px solid #f1f5f9"}}>
                          <td style={{padding:"6px 8px",fontWeight:500}}>{it.word}</td>
                          <td style={{textAlign:"center",padding:"6px 4px",fontSize:10,color:K.mt,fontWeight:600}}>{it.posLabel}</td>
                          {ERROR_TYPES.map(function(et){
                            var sel = current === et.id;
                            return <td key={et.id} style={{textAlign:"center",padding:"3px 2px"}}>
                              <button onClick={function(){setResponse(it.key, et.id)}}
                                style={{width:32,height:32,borderRadius:6,border:sel?"2px solid "+et.color:"1px solid #e2e8f0",
                                  background:sel?et.color+"22":"#fff",color:sel?et.color:K.mt,
                                  fontSize:12,fontWeight:700,cursor:"pointer",transition:"all .15s"}}>
                                {et.label}
                              </button>
                            </td>;
                          })}
                          <td style={{textAlign:"center",padding:"3px 2px"}}>
                            <button onClick={function(){setResponse(it.key, "NE")}}
                              style={{width:32,height:32,borderRadius:6,border:current==="NE"?"2px solid #94a3b8":"1px solid #e2e8f0",
                                background:current==="NE"?"#94a3b822":"#fff",color:current==="NE"?"#94a3b8":K.mt,
                                fontSize:8,fontWeight:700,cursor:"pointer",transition:"all .15s"}}>
                              NE
                            </button>
                          </td>
                        </tr>;
                      })}
                    </tbody>
                  </table>
                </div>
              </div>;
            })}

            <div style={{display:"flex",gap:10,marginTop:16}}>
              {catIdx > 0 && <button onClick={function(){setCatIdx(catIdx-1);scrollTop();}}
                style={{flex:1,padding:"12px",background:"#f1f5f9",border:"1px solid "+K.bd,borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",color:K.mt}}>
                {"\u2190 Anterior"}</button>}
              {catIdx < catGroups.length-1 && <button onClick={function(){setCatIdx(catIdx+1);scrollTop();}}
                style={{flex:1,padding:"12px",background:K.ac,border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",color:"#fff"}}>
                {"Siguiente \u2192"}</button>}
              {catIdx === catGroups.length-1 && <button onClick={function(){setStep(2);scrollTop();}}
                style={{flex:1,padding:"12px",background:"#059669",border:"none",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer",color:"#fff"}}>
                {"Ver Resultados \u2192"}</button>}
            </div>

            <div style={{marginTop:16}}>
              <label style={{fontSize:12,fontWeight:600,color:K.mt}}>Observaciones generales</label>
              <textarea value={obs} onChange={function(e){setObs(e.target.value)}} rows={3} placeholder="Notas adicionales..."
                style={{width:"100%",padding:"10px 12px",border:"1px solid "+K.bd,borderRadius:8,fontSize:13,marginTop:4,resize:"vertical",fontFamily:"inherit"}} />
            </div>
          </div>;
        })()}
      </div>}

      {step===2 && results && <div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
          <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,textAlign:"center"}}>
            <div style={{fontSize:32,fontWeight:800,color:K.ac}}>{results.pcc+"%"}</div>
            <div style={{fontSize:12,color:K.mt,fontWeight:600}}>PCC</div>
            <div style={{fontSize:11,color:K.mt}}>{"Porcentaje de Consonantes Correctas"}</div>
          </div>
          <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,textAlign:"center"}}>
            <div style={{fontSize:24,fontWeight:700,color:results.totalErrors===0?"#059669":results.pcc>=85?"#059669":results.pcc>=65?"#d97706":results.pcc>=50?"#ea580c":"#dc2626"}}>{results.severity}</div>
            <div style={{fontSize:12,color:K.mt,fontWeight:600}}>Severidad</div>
          </div>
          <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,textAlign:"center"}}>
            <div style={{fontSize:24,fontWeight:700,color:K.sd}}>{results.totalCorrect+"/"+results.totalEvaluated}</div>
            <div style={{fontSize:12,color:K.mt,fontWeight:600}}>Correctos</div>
            <div style={{fontSize:11,color:K.mt}}>{results.totalErrors+" errores (D:"+results.errorDetail.D+" O:"+results.errorDetail.O+" S:"+results.errorDetail.S+")"}</div>
          </div>
        </div>

        <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,marginBottom:16}}>
          <h3 style={{fontSize:15,fontWeight:700,marginBottom:12}}>{"Resumen por categor\u00eda"}</h3>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{borderBottom:"2px solid "+K.bd}}>
              <th style={{textAlign:"left",padding:"8px",color:K.mt,fontSize:11}}>{"Categor\u00eda"}</th>
              <th style={{textAlign:"center",padding:"8px",color:K.mt,fontSize:11}}>Correctos</th>
              <th style={{textAlign:"center",padding:"8px",color:K.mt,fontSize:11}}>Errores</th>
              <th style={{textAlign:"center",padding:"8px",color:K.mt,fontSize:11}}>Total</th>
              <th style={{textAlign:"center",padding:"8px",color:K.mt,fontSize:11}}>%</th>
            </tr></thead>
            <tbody>
              {Object.values(results.byCat).map(function(c){
                var pct = c.total > 0 ? Math.round((c.ok/c.total)*100) : 0;
                return <tr key={c.title} style={{borderBottom:"1px solid #f1f5f9"}}>
                  <td style={{padding:"8px",fontWeight:600}}>{c.title}</td>
                  <td style={{textAlign:"center",padding:"8px",color:"#059669",fontWeight:600}}>{c.ok}</td>
                  <td style={{textAlign:"center",padding:"8px",color:c.errors>0?"#dc2626":"#059669",fontWeight:600}}>{c.errors}</td>
                  <td style={{textAlign:"center",padding:"8px"}}>{c.total}</td>
                  <td style={{textAlign:"center",padding:"8px"}}><span style={{padding:"2px 8px",borderRadius:10,fontSize:12,fontWeight:600,
                    background:pct>=85?"#dcfce7":pct>=65?"#fef3c7":pct>=50?"#ffedd5":"#fef2f2",
                    color:pct>=85?"#059669":pct>=65?"#d97706":pct>=50?"#ea580c":"#dc2626"}}>{pct+"%"}</span></td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>

        <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,marginBottom:16}}>
          <h3 style={{fontSize:15,fontWeight:700,marginBottom:12}}>{"Detalle por fonema"}</h3>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead><tr style={{borderBottom:"2px solid "+K.bd}}>
              <th style={{textAlign:"left",padding:"6px 8px",color:K.mt,fontSize:11}}>Fonema</th>
              <th style={{textAlign:"center",padding:"6px",color:K.mt,fontSize:11}}>Edad adq.</th>
              <th style={{textAlign:"center",padding:"6px",color:"#059669",fontSize:11}}>{"\u2713"}</th>
              <th style={{textAlign:"center",padding:"6px",color:"#f59e0b",fontSize:11}}>D</th>
              <th style={{textAlign:"center",padding:"6px",color:"#dc2626",fontSize:11}}>O</th>
              <th style={{textAlign:"center",padding:"6px",color:"#7c3aed",fontSize:11}}>S</th>
              <th style={{textAlign:"center",padding:"6px",color:K.mt,fontSize:11}}>Estado</th>
            </tr></thead>
            <tbody>
              {Object.entries(results.byPhoneme).map(function(e){
                var id = e[0], ph = e[1];
                var hasErrors = ph.D > 0 || ph.O > 0 || ph.S > 0;
                var isExpected = (patientAge/12) >= ph.age;
                return <tr key={id} style={{borderBottom:"1px solid #f1f5f9",background:hasErrors && isExpected?"#fef2f2":"transparent"}}>
                  <td style={{padding:"6px 8px",fontWeight:700}}>{ph.phoneme}</td>
                  <td style={{textAlign:"center",padding:"6px",fontSize:11}}>{ph.age+" a."}</td>
                  <td style={{textAlign:"center",padding:"6px",color:"#059669",fontWeight:600}}>{ph.ok||"-"}</td>
                  <td style={{textAlign:"center",padding:"6px",color:ph.D>0?"#f59e0b":"#d1d5db",fontWeight:600}}>{ph.D||"-"}</td>
                  <td style={{textAlign:"center",padding:"6px",color:ph.O>0?"#dc2626":"#d1d5db",fontWeight:600}}>{ph.O||"-"}</td>
                  <td style={{textAlign:"center",padding:"6px",color:ph.S>0?"#7c3aed":"#d1d5db",fontWeight:600}}>{ph.S||"-"}</td>
                  <td style={{textAlign:"center",padding:"6px"}}>
                    {hasErrors && isExpected && <span style={{padding:"2px 8px",borderRadius:10,background:"#fef2f2",color:"#dc2626",fontSize:10,fontWeight:700}}>ALTERADO</span>}
                    {hasErrors && !isExpected && <span style={{padding:"2px 8px",borderRadius:10,background:"#fef3c7",color:"#d97706",fontSize:10,fontWeight:700}}>EN DESARROLLO</span>}
                    {!hasErrors && <span style={{padding:"2px 8px",borderRadius:10,background:"#dcfce7",color:"#059669",fontSize:10,fontWeight:700}}>ADECUADO</span>}
                  </td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>

        {(function(){
          var altered = Object.entries(results.byPhoneme).filter(function(e){
            var ph = e[1]; return (ph.D > 0 || ph.O > 0 || ph.S > 0) && (patientAge/12) >= ph.age;
          });
          if(altered.length === 0) return <div style={{background:"#dcfce7",borderRadius:12,padding:20,marginBottom:16,textAlign:"center"}}>
            <span style={{fontSize:24}}>{"\u2705"}</span>
            <p style={{fontSize:14,fontWeight:600,color:"#059669",marginTop:8}}>{"Todos los fonemas esperados para la edad est\u00e1n adecuados."}</p>
          </div>;
          return <div style={{background:"#fef2f2",borderRadius:12,border:"1px solid #fecaca",padding:20,marginBottom:16}}>
            <h3 style={{fontSize:15,fontWeight:700,color:"#dc2626",marginBottom:8}}>{"\u26a0 Fonemas alterados (esperados para la edad)"}</h3>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {altered.map(function(e){
                var ph = e[1]; var errors = [];
                if(ph.D > 0) errors.push(ph.D+"D"); if(ph.O > 0) errors.push(ph.O+"O"); if(ph.S > 0) errors.push(ph.S+"S");
                return <div key={e[0]} style={{background:"#fff",borderRadius:8,padding:"8px 14px",border:"1px solid #fecaca"}}>
                  <span style={{fontWeight:700,fontSize:16}}>{ph.phoneme}</span>
                  <span style={{fontSize:11,color:"#dc2626",marginLeft:6}}>{errors.join(", ")}</span>
                </div>;
              })}
            </div>
          </div>;
        })()}

        {obs && <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,marginBottom:16}}>
          <h3 style={{fontSize:14,fontWeight:600,marginBottom:6}}>Observaciones</h3>
          <p style={{fontSize:13,color:K.mt}}>{obs}</p>
        </div>}

        <div style={{display:"flex",gap:10,marginTop:20}}>
          <button onClick={function(){setStep(1);scrollTop();}}
            style={{flex:1,padding:"14px",background:"#f1f5f9",border:"1px solid "+K.bd,borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",color:K.mt}}>
            {"\u2190 Volver a editar"}</button>
          <button onClick={handleSave}
            style={{flex:2,padding:"14px",background:"#059669",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer",color:"#fff"}}>
            {"\ud83d\udcbe Guardar evaluaci\u00f3n"}</button>
        </div>
      </div>}
    </div>
  );
}
