import { useState, useEffect, useRef } from "react";
import { REC, EXP } from "../data/eldiItems.js";
import { ELDI_IMAGES } from "../data/eldiImages.js";
import PatientLookup from "./PatientLookup.jsx";
import { calcScoring, gm, fa, scrollTop } from "./NewELDI_scoring.js";
import { SequenceGame, ShapesGame } from "./NewELDI_games.jsx";
import { fbAdd } from "../lib/fb.js";
import AIReportPanel from "./AIReportPanel.jsx";
import { saveDraft, deleteDraft } from "../lib/drafts.js";
import "../styles/NewELDI.css";

export default function NewELDI({onS,nfy,userId,draft,therapistInfo}){
  var init=draft?draft.data:null;
  var _s=useState(init?(init.step||1):1),step=_s[0],sS=_s[1];
  var _pd=useState(init?init.pd:{pN:"",birth:"",eD:new Date().toISOString().split("T")[0],sch:"",ref:"",obs:"",dni:""}),pd=_pd[0],sPd=_pd[1];
  var _rsp=useState(init?(init.rsp||{}):{}),rsp=_rsp[0],sR=_rsp[1];
  var _ex=useState({}),showEx=_ex[0],setEx=_ex[1];
  var _im=useState({}),showImg=_im[0],setImg=_im[1];
  var _st2=useState({}),showStory=_st2[0],setStory=_st2[1];
  var _er=useState(init?init.evalRec!==false:true),evalRec=_er[0],setEvalRec=_er[1];
  var _ee=useState(init?init.evalExp!==false:true),evalExp=_ee[0],setEvalExp=_ee[1];
  var _d=useState(false),dirty=_d[0],setDirty=_d[1];
  var _sp=useState(init?init.selectedPatient:null),selectedPatient=_sp[0],setSelectedPatient=_sp[1];
  var _saved = useState(false), saved = _saved[0], setSaved = _saved[1];
  var _savedDocId = useState(null), savedDocId = _savedDocId[0], setSavedDocId = _savedDocId[1];
  var docIdRef = useRef(null);
  var _report = useState(null), report = _report[0], setReport = _report[1];
  var _showTech = useState(false), showTech = _showTech[0], setShowTech = _showTech[1];
  var reportRef = useRef(null);

  useEffect(function(){scrollTop()},[step]);
  useEffect(function(){
    if(!dirty)return;
    var handler=function(e){e.preventDefault();e.returnValue="";};
    window.addEventListener("beforeunload",handler);
    return function(){window.removeEventListener("beforeunload",handler)};
  },[dirty]);

  var handlePatientSelect=function(pac){
    setSelectedPatient(pac);
    if(pac) sPd(function(p){return Object.assign({},p,{pN:pac.nombre||"",birth:pac.fechaNac||"",sch:pac.colegio||"",dni:pac.dni||""})});
    else sPd(function(p){return Object.assign({},p,{pN:"",birth:"",sch:"",dni:""})});
  };

  var a=pd.birth&&pd.eD?gm(pd.birth,pd.eD):0;
  var tog=function(id){
    setDirty(true);
    sR(function(p){
      var v=p[id];
      if(v===undefined)return Object.assign({},p,{[id]:true});
      if(v===true)return Object.assign({},p,{[id]:false});
      var n=Object.assign({},p);delete n[id];return n;
    });
  };
  var markSection=function(groupItems,value){
    setDirty(true);
    sR(function(p){
      var n=Object.assign({},p);
      groupItems.forEach(function(item){
        if(value==="clear")delete n[item.id];
        else n[item.id]=value;
      });
      return n;
    });
  };

  var rR=evalRec?calcScoring(REC,rsp,a):{logrado:0,noLogrado:0,noEvaluado:REC.map(function(i){return i.id}),total:55,evaluados:0,pctLogrado:null};
  var rE=evalExp?calcScoring(EXP,rsp,a):{logrado:0,noLogrado:0,noEvaluado:EXP.map(function(i){return i.id}),total:55,evaluados:0,pctLogrado:null};

  // ============================================================
  // Render items (RI)
  // ============================================================
  var RI=function(items,prefix){
    var gr={};
    items.forEach(function(i){if(!gr[i.a])gr[i.a]=[];gr[i.a].push(i)});

    return <div>
      <h2 className="eldi-h2">{prefix==="AC"?"\ud83d\udd0a Comprensi\u00f3n Auditiva":"\ud83d\udde3\ufe0f Comunicaci\u00f3n Expresiva"}</h2>
      <p className="eldi-items-intro">{"1 click = \u2714 Logrado \u00b7 2 clicks = \u2718 No logrado \u00b7 3 clicks = Sin evaluar"}</p>

      {Object.entries(gr).map(function(entry){
        var range=entry[0],gi=entry[1];
        var allOk=gi.every(function(i){return rsp[i.id]===true});
        var allNo=gi.every(function(i){return rsp[i.id]===false});
        var allClear=gi.every(function(i){return rsp[i.id]===undefined});

        return <div key={range} className="eldi-age-group">
          <div className="eldi-age-header">
            <span>{"Edad: "+range}</span>
            <div className="eldi-bulk-actions">
              <button
                onClick={function(){markSection(gi,true)}}
                className={"eldi-bulk-btn eldi-bulk-btn--ok" + (allOk ? " eldi-bulk-btn--ok-active" : "")}
              >{"\u2713 Todas"}</button>
              <button
                onClick={function(){markSection(gi,false)}}
                className={"eldi-bulk-btn eldi-bulk-btn--no" + (allNo ? " eldi-bulk-btn--no-active" : "")}
              >{"\u2717 Todas"}</button>
              <button
                onClick={function(){markSection(gi,"clear")}}
                className={"eldi-bulk-btn eldi-bulk-btn--clear" + (allClear ? " eldi-bulk-btn--clear-active" : "")}
              >{"\u25cb Limpiar"}</button>
            </div>
          </div>

          {gi.map(function(item){
            var v=rsp[item.id];
            var exO=showEx[item.id];
            var imgO=showImg[item.id];
            var hasImg=!!item.img||!!item.imgUrl;
            var hasGame=!!item.game;
            var hasStoryBtn=!!item.story;

            var rowCls = "eldi-item-row";
            if(v===true) rowCls += " eldi-item-row--ok";
            else if(v===false) rowCls += " eldi-item-row--no";
            if(exO || imgO) rowCls += " eldi-item-row--expanded";

            var statusCls = "eldi-item-status";
            if(v===true) statusCls += " eldi-item-status--ok";
            else if(v===false) statusCls += " eldi-item-status--no";

            return <div key={item.id} className="eldi-item">
              <div onClick={function(){tog(item.id)}} className={rowCls}>
                <div className={statusCls}>{v===true?"\u2713":v===false?"\u2717":"\u2014"}</div>
                <span className="eldi-item-id">{item.id}</span>
                <span className="eldi-item-label">{item.l}</span>
                <div className="eldi-item-actions">
                  {(hasImg||hasGame) && <button
                    onClick={function(e){
                      e.stopPropagation();
                      setImg(function(p){var n=Object.assign({},p);n[item.id]=!p[item.id];return n});
                      if(showEx[item.id])setEx(function(p){var n=Object.assign({},p);n[item.id]=false;return n});
                    }}
                    className={"eldi-btn-img" + (imgO ? " eldi-btn-img--open" : "")}
                  >{imgO?"Ocultar":"Ver imagen"}</button>}
                  <button
                    onClick={function(e){
                      e.stopPropagation();
                      setEx(function(p){var n=Object.assign({},p);n[item.id]=!p[item.id];return n});
                      if(showImg[item.id])setImg(function(p){var n=Object.assign({},p);n[item.id]=false;return n});
                    }}
                    className="eldi-btn-ex"
                  >{exO?"Ocultar":"Ejemplo"}</button>
                </div>
              </div>

              {exO && <div className={"eldi-ex-panel" + (imgO ? " eldi-ex-panel--no-round" : "")}>
                {item.ej}
                {hasStoryBtn && <div className="eldi-story-wrap">
                  <button
                    onClick={function(){setStory(function(p){var n=Object.assign({},p);n[item.id]=!p[item.id];return n})}}
                    className="eldi-btn-story"
                  >{showStory[item.id]?"Ocultar historia":"Ver historia"}</button>
                  {showStory[item.id] && <div className="eldi-story-body">{item.story}</div>}
                </div>}
              </div>}

              {imgO && <div className="eldi-img-panel">
                {item.game==="sequence" ? <SequenceGame/> :
                 item.game==="shapes" ? <ShapesGame/> :
                 item.imgUrl ? <img src={item.imgUrl} alt={item.l} className="eldi-img" loading="lazy"/> :
                 item.img && ELDI_IMAGES[item.img] ? <div dangerouslySetInnerHTML={{__html:ELDI_IMAGES[item.img]}} className="eldi-img-svg"/> :
                 <div className="eldi-img-empty">Imagen no disponible</div>}
              </div>}
            </div>;
          })}
        </div>;
      })}
    </div>;
  };

  var steps=["Paciente"];
  if(evalRec)steps.push("Receptivo");
  if(evalExp)steps.push("Expresivo");
  steps.push("Resultado");
  var getStepContent=function(){var label=steps[step-1];if(label==="Paciente")return"patient";if(label==="Receptivo")return"rec";if(label==="Expresivo")return"exp";return"result"};
  var content=getStepContent();

  // Auto-save to Firestore when entering result step
  useEffect(function(){
    if(content === "result" && !saved){
      var rspClean = {};
      if(rsp){ Object.entries(rsp).forEach(function(e){ if(e[1]===true) rspClean[e[0]]=true; else if(e[1]===false) rspClean[e[0]]=false; }); }
      var recRes = evalRec ? Object.assign({label:"Comprensi\u00f3n Auditiva",evaluated:true},rR) : {label:"Comprensi\u00f3n Auditiva",evaluated:false};
      var expRes = evalExp ? Object.assign({label:"Comunicaci\u00f3n Expresiva",evaluated:true},rE) : {label:"Comunicaci\u00f3n Expresiva",evaluated:false};
      var allNoEval = [].concat(evalRec?rR.noEvaluado:[]).concat(evalExp?rE.noEvaluado:[]);
      var payload = {
        id: Date.now()+"", userId: userId, tipo: "eldi", paciente: pd.pN, pacienteDni: pd.dni||"",
        fechaNacimiento: pd.birth, fechaEvaluacion: pd.eD, establecimiento: pd.sch,
        derivadoPor: pd.ref, edadMeses: a, evalRec: evalRec||false, evalExp: evalExp||false,
        brutoReceptivo: rR.logrado, brutoExpresivo: rE.logrado,
        recRes: recRes, expRes: expRes, allNoEval: allNoEval,
        observaciones: pd.obs||"", evaluador: "",
        fechaGuardado: new Date().toISOString(), respuestas: rspClean
      };
      fbAdd("evaluaciones", payload).then(function(r){
        if(r.success){ docIdRef.current = r.id; setSavedDocId(r.id); nfy("ELDI guardada","ok"); }
        else nfy("Error: "+r.error,"er");
      });
      if(draft&&draft._fbId)deleteDraft(draft._fbId);
      setSaved(true);
      setDirty(false);
    }
  }, [content]);

  var handlePauseELDI=function(){
    var draftData={step:step,pd:pd,rsp:rsp,evalRec:evalRec,evalExp:evalExp,selectedPatient:selectedPatient,patientId:selectedPatient?(selectedPatient._fbId||selectedPatient.dni||pd.pN):"unknown"};
    saveDraft(userId,"eldi",draftData).then(function(r){if(r.success)nfy("Evaluacion pausada","ok");onS("tools");});
  };
  var handleFinishEarlyELDI=function(){
    if(!selectedPatient){nfy("Selecciona un paciente","er");return;}
    if(Object.keys(rsp).length===0){nfy("Registra al menos una respuesta","er");return;}
    if(window.confirm("Finalizar evaluacion ahora?"))sS(evalRec&&evalExp?4:evalRec?3:3);
  };

  // ============================================================
  // Classification card (criterial analysis)
  // ============================================================
  var renderClassification=function(scoring,label){
    if(!scoring||scoring.pctExpected===null||scoring.evaluados===0)return null;
    var pctStyle = scoring.classColor ? { color: scoring.classColor } : undefined;
    return <div className="eldi-class">
      <div className="eldi-class-title">{"\ud83c\udfaf An\u00e1lisis Criterial \u2014 "+label}</div>
      <div className="eldi-class-grid">
        <div className="eldi-class-cell">
          <div className="eldi-class-cell-label">{"Rendimiento seg\u00fan edad"}</div>
          <div className="eldi-class-cell-value" style={pctStyle}>{scoring.pctExpected+"%"}</div>
          <div className="eldi-class-cell-sub">{"("+scoring.logradoExpected+"/"+scoring.expectedCount+" \u00edtems esperados logrados)"}</div>
        </div>
        <div className="eldi-class-cell">
          <div className="eldi-class-cell-label">{"Clasificaci\u00f3n"}</div>
          <div className="eldi-class-cell-class" style={pctStyle}>{scoring.classification}</div>
        </div>
        {scoring.devAgeLabel && <div className="eldi-class-cell eldi-class-cell--full">
          <div className="eldi-class-cell-label">{"Edad de desarrollo estimada"}</div>
          <div className="eldi-class-cell-age">{scoring.devAgeLabel}</div>
          <div className="eldi-class-cell-sub">{"(banda m\u00e1xima con \u226580% de \u00edtems logrados)"}</div>
        </div>}
      </div>
    </div>;
  };

  var renderNoEval=function(noEvalIds,items){
    if(noEvalIds.length===0)return null;
    var groups={};
    noEvalIds.forEach(function(id){
      var item=items.find(function(i){return i.id===id});
      if(item){if(!groups[item.a])groups[item.a]=[];groups[item.a].push(item)}
    });
    return <div className="eldi-noeval">
      <div className="eldi-noeval-title">{"\u00cdtems no evaluados:"}</div>
      {Object.entries(groups).map(function(e){return <div key={e[0]} className="eldi-noeval-group">
        <div className="eldi-noeval-group-label">{"Edad "+e[0]+":"}</div>
        {e[1].map(function(it){return <div key={it.id} className="eldi-noeval-item">{"\u2022 "+it.l+" ("+it.id+")"}</div>})}
      </div>})}
    </div>;
  };

  // ============================================================
  // RENDER
  // ============================================================
  return <div className="eldi">
    <div className="eldi-progress">
      {steps.map(function(s,i){
        var barCls = "eldi-progress-bar";
        if(step > i+1) barCls += " eldi-progress-bar--done";
        else if(step === i+1) barCls += " eldi-progress-bar--active";
        return <div key={i} className="eldi-progress-item">
          <div className={barCls}/>
          <span className={"eldi-progress-label" + (step === i+1 ? " eldi-progress-label--active" : "")}>{s}</span>
        </div>;
      })}
    </div>

    <div className="eldi-card">

      {content==="patient" && <div>
        <h2 className="eldi-h2">{"ELDI \u2014 Datos del Paciente"}</h2>
        <p className="eldi-intro">{"Evaluaci\u00f3n del Lenguaje y Desarrollo Infantil"}</p>
        <PatientLookup userId={userId} onSelect={handlePatientSelect} selected={selectedPatient} color="#0d9488" />
        {selectedPatient && <div className="eldi-step0-fields">
          <div className="eldi-grid-2">
            <div>
              <label className="eldi-label">{"Fecha de evaluaci\u00f3n"}</label>
              <input type="date" value={pd.eD} onChange={function(e){sPd(function(p){return Object.assign({},p,{eD:e.target.value})})}} className="eldi-input"/>
            </div>
            <div>
              <label className="eldi-label">Derivado por</label>
              <input value={pd.ref} onChange={function(e){sPd(function(p){return Object.assign({},p,{ref:e.target.value})})}} className="eldi-input" placeholder="Profesional"/>
            </div>
          </div>
        </div>}
        <div className="eldi-areas">
          <div className="eldi-areas-title">{"Qu\u00e9 \u00e1reas evaluar?"}</div>
          <div className="eldi-areas-row">
            <label className="eldi-areas-label">
              <input type="checkbox" checked={evalRec} onChange={function(e){setEvalRec(e.target.checked)}} className="eldi-areas-checkbox"/>
              {"\ud83d\udd0a Comprensi\u00f3n Auditiva (Receptivo)"}
            </label>
            <label className="eldi-areas-label">
              <input type="checkbox" checked={evalExp} onChange={function(e){setEvalExp(e.target.checked)}} className="eldi-areas-checkbox"/>
              {"\ud83d\udde3\ufe0f Comunicaci\u00f3n Expresiva"}
            </label>
          </div>
          {!evalRec && !evalExp && <div className="eldi-areas-error">{"Debe seleccionar al menos un \u00e1rea"}</div>}
        </div>
        <div className="eldi-cta-row">
          <button
            onClick={function(){
              if(!selectedPatient){nfy("Busque y seleccione un paciente","er");return}
              if(!evalRec&&!evalExp){nfy("Seleccione al menos un \u00e1rea","er");return}
              setDirty(true);sS(2);
            }}
            className="eldi-btn eldi-btn--primary"
          >{"Siguiente \u2192"}</button>
        </div>
      </div>}

      {content==="rec" && <div>
        {RI(REC,"AC")}
        <div className="eldi-nav">
          <span className="eldi-nav-count">{"Logrados: "}<b className="eldi-nav-count-num">{rR.logrado}</b>{"/55"}</span>
          <div className="eldi-nav-btns">
            <button onClick={function(){sS(step-1)}} className="eldi-btn">{"Atras"}</button>
            <button onClick={handleFinishEarlyELDI} className="eldi-btn-finish">{"Finalizar ahora"}</button>
            <button onClick={handlePauseELDI} className="eldi-btn-pause">{"Pausar"}</button>
            <button onClick={function(){sS(step+1)}} className="eldi-btn eldi-btn--primary">{"Siguiente"}</button>
          </div>
        </div>
      </div>}

      {content==="exp" && <div>
        {RI(EXP,"EC")}
        <div className="eldi-nav">
          <span className="eldi-nav-count">{"Logrados: "}<b className="eldi-nav-count-num">{rE.logrado}</b>{"/55"}</span>
          <div className="eldi-nav-btns">
            <button onClick={function(){sS(step-1)}} className="eldi-btn">{"Atras"}</button>
            <button onClick={handleFinishEarlyELDI} className="eldi-btn-finish">{"Finalizar ahora"}</button>
            <button onClick={handlePauseELDI} className="eldi-btn-pause">{"Pausar"}</button>
            <button onClick={function(){sS(step+1)}} className="eldi-btn eldi-btn--primary">{"Resultados"}</button>
          </div>
        </div>
      </div>}

      {content==="result" && (function(){
        var recRes={label:"Comprensi\u00f3n Auditiva",evaluated:evalRec};Object.assign(recRes,rR);
        var expRes={label:"Comunicaci\u00f3n Expresiva",evaluated:evalExp};Object.assign(expRes,rE);
        var allNoEval=[].concat(evalRec?rR.noEvaluado:[]).concat(evalExp?rE.noEvaluado:[]);

        return <div>
          <div className="eldi-result-ok">
            <span className="eldi-result-ok-icon">{"\u2705"}</span>
            <span className="eldi-result-ok-text">{"Evaluación guardada correctamente."}</span>
          </div>

          <AIReportPanel
            ev={{_fbId:docIdRef.current,paciente:pd.pN,pacienteDni:pd.dni||"",edadMeses:a,fechaEvaluacion:pd.eD,derivadoPor:pd.ref||"",observaciones:pd.obs||"",resultados:{recRes:rR,expRes:rE},evalRec:evalRec,evalExp:evalExp,aiReport:report}}
            evalType="eldi" collectionName="evaluaciones" evalLabel="ELDI" autoGenerate={true}
            therapistInfo={therapistInfo}
          />

          <button
            onClick={function(){ setShowTech(!showTech); }}
            className={"eldi-tech-toggle" + (showTech ? " eldi-tech-toggle--open" : "")}
          >{showTech ? "\u25b2 Ocultar datos técnicos" : "\u25bc Ver datos técnicos de la evaluación"}</button>

          {showTech && <div>
            <h2 className="eldi-result-title">{"Resultados ELDI \u2014 "+pd.pN}</h2>
            <p className="eldi-result-sub">{"Edad: "+fa(a)+" \u00b7 Evaluaci\u00f3n: "+pd.eD+(pd.dni?" \u00b7 DNI: "+pd.dni:"")}</p>

            {evalRec && rR.evaluados>0 && renderClassification(rR,"Comprensi\u00f3n Auditiva")}
            {evalExp && rE.evaluados>0 && renderClassification(rE,"Comunicaci\u00f3n Expresiva")}

            {[recRes,expRes].map(function(area,i){
              var items=i===0?REC:EXP;
              if(!area.evaluated) return <div key={i} className="eldi-area-card eldi-area-card--not-eval">
                <div className="eldi-area-card-title eldi-area-card-title--not-eval">{i===0?"\ud83d\udd0a":"\ud83d\udde3\ufe0f"}{" "+area.label}</div>
                <div className="eldi-area-card-not-eval-text">{"No evaluado en esta sesi\u00f3n"}</div>
              </div>;

              var fillCls = "eldi-pct-fill " + (area.pctLogrado>=80 ? "eldi-pct-fill--high" : area.pctLogrado>=50 ? "eldi-pct-fill--med" : "eldi-pct-fill--low");

              return <div key={i} className="eldi-area-card">
                <div className="eldi-area-card-title">{i===0?"\ud83d\udd0a":"\ud83d\udde3\ufe0f"}{" "+area.label}</div>
                <div className="eldi-area-stats">
                  <div>
                    <div className="eldi-area-stat-label">{"\u00cdtems logrados"}</div>
                    <div className="eldi-area-stat-value eldi-area-stat-value--ok">{area.logrado}<span className="eldi-area-stat-total">{"/"+area.total}</span></div>
                  </div>
                  <div>
                    <div className="eldi-area-stat-label">{"No logrados"}</div>
                    <div className="eldi-area-stat-value eldi-area-stat-value--no">{area.noLogrado}</div>
                  </div>
                  <div>
                    <div className="eldi-area-stat-label">{"Sin evaluar"}</div>
                    <div className="eldi-area-stat-value eldi-area-stat-value--pending">{area.noEvaluado.length}</div>
                  </div>
                </div>
                {area.evaluados>0 && <div className="eldi-pct-wrap">
                  <div className="eldi-pct-label">{"% logro (sobre evaluados)"}</div>
                  <div className="eldi-pct-bar">
                    <div className={fillCls} style={{width: area.pctLogrado+"%"}}/>
                    <span className="eldi-pct-text">{area.pctLogrado+"%"}</span>
                  </div>
                </div>}
                {renderNoEval(area.noEvaluado,items)}
              </div>;
            })}

            <div className="eldi-summary">
              <div className="eldi-summary-label">Resumen</div>
              <div className="eldi-summary-row">
                {evalRec && <div><span className="eldi-summary-big">{rR.logrado}</span><span className="eldi-summary-small">{"/"+rR.evaluados+" Receptivo"}</span></div>}
                {evalExp && <div><span className="eldi-summary-big">{rE.logrado}</span><span className="eldi-summary-small">{"/"+rE.evaluados+" Expresivo"}</span></div>}
              </div>
              {allNoEval.length>0 && <div className="eldi-summary-pending">{allNoEval.length+" \u00edtems sin evaluar \u2014 parcial"}</div>}
            </div>
          </div>}

          <button onClick={function(){onS("tools")}} className="eldi-btn-final">{"Finalizar \u2713"}</button>
        </div>;
      })()}
    </div>
  </div>;
}
