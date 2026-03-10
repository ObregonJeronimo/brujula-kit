import { useState, useEffect, useRef } from "react";
import { REC, EXP } from "../data/eldiItems.js";
import { ELDI_IMAGES } from "../data/eldiImages.js";
import PatientLookup from "./PatientLookup.jsx";
import { calcScoring, gm, fa, scrollTop } from "./NewELDI_scoring.js";
import { SequenceGame, ShapesGame } from "./NewELDI_games.jsx";
import { db, doc, updateDoc } from "../firebase.js";
import { fbAdd } from "../lib/fb.js";

var K = { mt: "#64748b" };

function renderReportText(text){
  if(!text) return null;
  return text.split("\n").map(function(line, i){
    var trimmed = line.trim();
    if(!trimmed) return <div key={i} style={{height:8}} />;
    var isTitle = /^[A-Z\u00c0-\u00dc\s\d\.\:\-]{6,}:?\s*$/.test(trimmed) || /^\d+[\.\)]\s*[A-Z]/.test(trimmed);
    if(isTitle) return <div key={i} style={{fontSize:14,fontWeight:700,color:"#0a3d2f",marginTop:14,marginBottom:4}}>{trimmed}</div>;
    return <div key={i} style={{fontSize:13,color:"#334155",lineHeight:1.7,marginBottom:1}}>{trimmed}</div>;
  });
}

function saveReportToDoc(colName, docIdRef, report) {
  var tryUpdate = function(retries) {
    var id = docIdRef.current;
    if (id) {
      updateDoc(doc(db, colName, id), { aiReport: report, aiReportDate: new Date().toISOString() }).catch(function(e) { console.error("Error saving aiReport:", e); });
    } else if (retries > 0) {
      setTimeout(function() { tryUpdate(retries - 1); }, 1500);
    } else {
      console.error("Could not save aiReport: docId never arrived");
    }
  };
  tryUpdate(5);
}

export default function NewELDI({onS,nfy,userId}){
  var _s=useState(1),step=_s[0],sS=_s[1];
  var _pd=useState({pN:"",birth:"",eD:new Date().toISOString().split("T")[0],sch:"",ref:"",obs:"",dni:""}),pd=_pd[0],sPd=_pd[1];
  var _rsp=useState({}),rsp=_rsp[0],sR=_rsp[1];
  var _ex=useState({}),showEx=_ex[0],setEx=_ex[1];
  var _im=useState({}),showImg=_im[0],setImg=_im[1];
  var _st2=useState({}),showStory=_st2[0],setStory=_st2[1];
  var _er=useState(true),evalRec=_er[0],setEvalRec=_er[1];
  var _ee=useState(true),evalExp=_ee[0],setEvalExp=_ee[1];
  var _d=useState(false),dirty=_d[0],setDirty=_d[1];
  var _sp=useState(null),selectedPatient=_sp[0],setSelectedPatient=_sp[1];
  var _saved = useState(false), saved = _saved[0], setSaved = _saved[1];
  var _savedDocId = useState(null), savedDocId = _savedDocId[0], setSavedDocId = _savedDocId[1];
  var docIdRef = useRef(null);
  var _report = useState(null), report = _report[0], setReport = _report[1];
  var _generating = useState(false), generating = _generating[0], setGenerating = _generating[1];
  var _genError = useState(null), genError = _genError[0], setGenError = _genError[1];
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
  var tog=function(id){setDirty(true);sR(function(p){var v=p[id];if(v===undefined)return Object.assign({},p,{[id]:true});if(v===true)return Object.assign({},p,{[id]:false});var n=Object.assign({},p);delete n[id];return n})};
  var markSection=function(groupItems,value){
    setDirty(true);
    sR(function(p){var n=Object.assign({},p);groupItems.forEach(function(item){if(value==="clear")delete n[item.id];else n[item.id]=value});return n});
  };

  var rR=evalRec?calcScoring(REC,rsp,a):{logrado:0,noLogrado:0,noEvaluado:REC.map(function(i){return i.id}),total:55,evaluados:0,pctLogrado:null};
  var rE=evalExp?calcScoring(EXP,rsp,a):{logrado:0,noLogrado:0,noEvaluado:EXP.map(function(i){return i.id}),total:55,evaluados:0,pctLogrado:null};

  var I={width:"100%",padding:"10px 14px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,background:"#f8faf9"};
  var Bt=function(props){return <button onClick={props.onClick} style={{background:props.pr?"#0d9488":"#f1f5f9",color:props.pr?"#fff":"#1e293b",border:"none",padding:"10px 22px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{props.children}</button>};

  var RI=function(items,prefix){
    var gr={};items.forEach(function(i){if(!gr[i.a])gr[i.a]=[];gr[i.a].push(i)});
    return <div>
      <h2 style={{fontSize:18,fontWeight:700,marginBottom:4}}>{prefix==="AC"?"\ud83d\udd0a Comprensi\u00f3n Auditiva":"\ud83d\udde3\ufe0f Comunicaci\u00f3n Expresiva"}</h2>
      <p style={{color:K.mt,fontSize:13,marginBottom:16}}>{"1 click = \u2714 Logrado \u00b7 2 clicks = \u2718 No logrado \u00b7 3 clicks = Sin evaluar"}</p>
      {Object.entries(gr).map(function(entry){
        var range=entry[0],gi=entry[1];
        var allOk=gi.every(function(i){return rsp[i.id]===true});
        var allNo=gi.every(function(i){return rsp[i.id]===false});
        var allClear=gi.every(function(i){return rsp[i.id]===undefined});
        return <div key={range} style={{marginBottom:18}}>
          <div style={{background:"#ccfbf1",padding:"6px 12px",borderRadius:6,fontSize:12,fontWeight:600,color:"#0d9488",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:6}}>
            <span>{"Edad: "+range}</span>
            <div style={{display:"flex",gap:4}}>
              <button onClick={function(){markSection(gi,true)}} style={{background:allOk?"#059669":"#fff",color:allOk?"#fff":"#059669",border:"1px solid #059669",borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>{"\u2713 Todas"}</button>
              <button onClick={function(){markSection(gi,false)}} style={{background:allNo?"#dc2626":"#fff",color:allNo?"#fff":"#dc2626",border:"1px solid #dc2626",borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>{"\u2717 Todas"}</button>
              <button onClick={function(){markSection(gi,"clear")}} style={{background:allClear?"#94a3b8":"#fff",color:allClear?"#fff":"#94a3b8",border:"1px solid #94a3b8",borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>{"\u25cb Limpiar"}</button>
            </div>
          </div>
          {gi.map(function(item){
            var v=rsp[item.id];var exO=showEx[item.id];var imgO=showImg[item.id];
            var hasImg=!!item.img||!!item.imgUrl;var hasGame=!!item.game;var hasStoryBtn=!!item.story;
            return <div key={item.id} style={{marginBottom:3}}>
              <div onClick={function(){tog(item.id)}} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:(exO||imgO)?"8px 8px 0 0":8,cursor:"pointer",background:v===true?"#ecfdf5":v===false?"#fef2f2":"#fff",border:"1px solid "+(v===true?"#a7f3d0":v===false?"#fecaca":"#e2e8f0"),borderBottom:(exO||imgO)?"none":undefined}}>
                <div style={{width:28,height:28,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",background:v===true?"#059669":v===false?"#dc2626":"#e2e8f0",color:"#fff",fontSize:13,fontWeight:700,flexShrink:0}}>{v===true?"\u2713":v===false?"\u2717":"\u2014"}</div>
                <span style={{fontWeight:600,fontSize:12,color:"#64748b",minWidth:36}}>{item.id}</span>
                <span style={{fontSize:13,flex:1}}>{item.l}</span>
                <div style={{display:"flex",gap:4,flexShrink:0}}>
                  {(hasImg||hasGame)&&<button onClick={function(e){e.stopPropagation();setImg(function(p){var n=Object.assign({},p);n[item.id]=!p[item.id];return n});if(showEx[item.id])setEx(function(p){var n=Object.assign({},p);n[item.id]=false;return n})}}
                    style={{background:imgO?"#0d9488":"#f0fdf4",color:imgO?"#fff":"#0d9488",border:"1px solid #0d9488",borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:600,cursor:"pointer"}}>{imgO?"Ocultar":"Ver imagen"}</button>}
                  <button onClick={function(e){e.stopPropagation();setEx(function(p){var n=Object.assign({},p);n[item.id]=!p[item.id];return n});if(showImg[item.id])setImg(function(p){var n=Object.assign({},p);n[item.id]=false;return n})}}
                    style={{background:"none",border:"1px solid #e2e8f0",borderRadius:6,padding:"4px 10px",fontSize:11,color:"#64748b",cursor:"pointer"}}>{exO?"Ocultar":"Ejemplo"}</button>
                </div>
              </div>
              {exO&&<div style={{background:"#f0fdf4",padding:"8px 14px 8px 52px",borderRadius:imgO?"0":"0 0 8px 8px",border:"1px solid #e2e8f0",borderTop:"none",fontSize:12,color:"#16a34a",fontStyle:"italic"}}>
                {item.ej}
                {hasStoryBtn&&<div style={{marginTop:8}}>
                  <button onClick={function(){setStory(function(p){var n=Object.assign({},p);n[item.id]=!p[item.id];return n})}}
                    style={{background:"#0a3d2f",color:"#fff",border:"none",borderRadius:6,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                    {showStory[item.id]?"Ocultar historia":"Ver historia"}</button>
                  {showStory[item.id]&&<div style={{marginTop:8,padding:12,background:"#fff",border:"1px solid #d1fae5",borderRadius:8,fontStyle:"normal",color:"#1e293b",lineHeight:1.6}}>{item.story}</div>}
                </div>}
              </div>}
              {imgO&&<div style={{background:"#f8faf9",padding:12,borderRadius:"0 0 8px 8px",border:"1px solid #e2e8f0",borderTop:"none",textAlign:"center"}}>
                {item.game==="sequence"?<SequenceGame/>:
                 item.game==="shapes"?<ShapesGame/>:
                 item.imgUrl?<img src={item.imgUrl} alt={item.l} style={{maxWidth:340,maxHeight:340,borderRadius:10,margin:"0 auto",display:"block"}} loading="lazy"/>:
                 item.img&&ELDI_IMAGES[item.img]?<div dangerouslySetInnerHTML={{__html:ELDI_IMAGES[item.img]}} style={{maxWidth:300,margin:"0 auto"}}/>:
                 <div style={{color:"#94a3b8",fontSize:12,fontStyle:"italic"}}>Imagen no disponible</div>}
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
        id: Date.now()+"", userId: userId, paciente: pd.pN, pacienteDni: pd.dni||"",
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
      setSaved(true);
      setDirty(false);
    }
  }, [content]);

  // Auto-generate AI report
  useEffect(function(){
    if(content === "result" && saved && !report && !generating && !genError){
      setGenerating(true);
      var evalData = {
        paciente: pd.pN, pacienteDni: pd.dni||"", edadMeses: a,
        fechaEvaluacion: pd.eD, derivadoPor: pd.ref, observaciones: pd.obs||"",
        evalRec: evalRec, evalExp: evalExp,
        resultados: { recRes: Object.assign({label:"Comprensi\u00f3n Auditiva",evaluated:evalRec},rR), expRes: Object.assign({label:"Comunicaci\u00f3n Expresiva",evaluated:evalExp},rE) }
      };
      fetch("/api/generate-report", {
        method: "POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ evalData: evalData, evalType: "eldi", reportMode: "clinico" })
      })
      .then(function(r){ return r.json(); })
      .then(function(data){
        if(data.success && data.report){
          setReport(data.report);
          saveReportToDoc("evaluaciones", docIdRef, data.report);
        } else setGenError(data.error||"Error al generar informe.");
        setGenerating(false);
      })
      .catch(function(e){ setGenError("Error: "+e.message); setGenerating(false); });
    }
  }, [content, saved, savedDocId]);

  var handlePDFReport = function(){
    if(!reportRef.current) return;
    reportRef.current.style.paddingBottom = "40px";
    import("html2canvas").then(function(mod){
      return mod.default(reportRef.current,{scale:2,useCORS:true,backgroundColor:"#ffffff",scrollY:-window.scrollY,height:reportRef.current.scrollHeight,windowHeight:reportRef.current.scrollHeight+100});
    }).then(function(canvas){
      reportRef.current.style.paddingBottom = "";
      return import("jspdf").then(function(mod){
        var jsPDF=mod.jsPDF,pdf=new jsPDF("p","mm","a4"),pW=210,pH=297,margin=10,imgW=pW-margin*2,imgH=(canvas.height*imgW)/canvas.width,usableH=pH-margin*2,pos=0,page=0;
        while(pos<imgH){ if(page>0)pdf.addPage(); var srcY=Math.round((pos/imgH)*canvas.height),srcH=Math.round((Math.min(usableH,imgH-pos)/imgH)*canvas.height); if(srcH<=0)break; var sc=document.createElement("canvas");sc.width=canvas.width;sc.height=srcH;sc.getContext("2d").drawImage(canvas,0,srcY,canvas.width,srcH,0,0,canvas.width,srcH); pdf.addImage(sc.toDataURL("image/png"),"PNG",margin,margin,imgW,(srcH*imgW)/canvas.width); pos+=usableH;page++; }
        pdf.save("Informe_ELDI_"+((pd.pN||"").replace(/\s/g,"_"))+"_"+(pd.eD||"")+".pdf");
      });
    }).catch(function(e){ reportRef.current.style.paddingBottom=""; console.error(e); });
  };

  var renderClassification=function(scoring,label){
    if(!scoring||scoring.pctExpected===null||scoring.evaluados===0)return null;
    return <div style={{background:"#fff",border:"1px solid #e2e8f0",borderRadius:10,padding:18,marginBottom:14}}>
      <div style={{fontWeight:700,fontSize:14,color:"#0a3d2f",marginBottom:12}}>{"\ud83c\udfaf An\u00e1lisis Criterial \u2014 "+label}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div style={{background:"#f0f9ff",padding:12,borderRadius:8}}>
          <div style={{fontSize:10,color:K.mt,marginBottom:4}}>{"Rendimiento seg\u00fan edad"}</div>
          <div style={{fontSize:22,fontWeight:700,color:scoring.classColor}}>{scoring.pctExpected+"%"}</div>
          <div style={{fontSize:11,color:K.mt}}>{"("+scoring.logradoExpected+"/"+scoring.expectedCount+" \u00edtems esperados logrados)"}</div>
        </div>
        <div style={{background:"#f0f9ff",padding:12,borderRadius:8}}>
          <div style={{fontSize:10,color:K.mt,marginBottom:4}}>{"Clasificaci\u00f3n"}</div>
          <div style={{fontSize:16,fontWeight:700,color:scoring.classColor}}>{scoring.classification}</div>
        </div>
        {scoring.devAgeLabel&&<div style={{background:"#f0f9ff",padding:12,borderRadius:8,gridColumn:"1/-1"}}>
          <div style={{fontSize:10,color:K.mt,marginBottom:4}}>{"Edad de desarrollo estimada"}</div>
          <div style={{fontSize:18,fontWeight:700,color:"#0d9488"}}>{scoring.devAgeLabel}</div>
          <div style={{fontSize:11,color:K.mt}}>{"(banda m\u00e1xima con \u226580% de \u00edtems logrados)"}</div>
        </div>}
      </div>
    </div>;
  };

  var renderNoEval=function(noEvalIds,items){
    if(noEvalIds.length===0)return null;
    var groups={};noEvalIds.forEach(function(id){var item=items.find(function(i){return i.id===id});if(item){if(!groups[item.a])groups[item.a]=[];groups[item.a].push(item)}});
    return <div style={{marginTop:12,padding:12,background:"#fffbeb",border:"1px solid #fde68a",borderRadius:8}}>
      <div style={{fontSize:12,fontWeight:600,color:"#92400e",marginBottom:8}}>{"\u00cdtems no evaluados:"}</div>
      {Object.entries(groups).map(function(e){return <div key={e[0]} style={{marginBottom:6}}>
        <div style={{fontSize:11,fontWeight:600,color:"#78350f",marginBottom:2}}>{"Edad "+e[0]+":"}</div>
        {e[1].map(function(it){return <div key={it.id} style={{fontSize:11,color:"#78350f",paddingLeft:8,lineHeight:1.6}}>{"\u2022 "+it.l+" ("+it.id+")"}</div>})}
      </div>})}
    </div>;
  };

  return <div style={{width:"100%",maxWidth:800,animation:"fi .3s ease"}}>
    <div style={{display:"flex",gap:4,marginBottom:22}}>{steps.map(function(s,i){return <div key={i} style={{flex:1,textAlign:"center"}}><div style={{height:4,borderRadius:2,marginBottom:5,background:step>i+1?"#0d9488":step===i+1?"#b2dfdb":"#e2e8f0"}}/><span style={{fontSize:11,color:step===i+1?"#0d9488":"#64748b",fontWeight:step===i+1?600:400}}>{s}</span></div>})}</div>
    <div style={{background:"#fff",borderRadius:12,padding:28,border:"1px solid #e2e8f0"}}>

      {content==="patient"&&<div>
        <h2 style={{fontSize:18,fontWeight:700,marginBottom:4}}>{"ELDI \u2014 Datos del Paciente"}</h2>
        <p style={{color:K.mt,fontSize:13,marginBottom:20}}>{"Evaluaci\u00f3n del Lenguaje y Desarrollo Infantil"}</p>
        <PatientLookup userId={userId} onSelect={handlePatientSelect} selected={selectedPatient} color="#0d9488" />
        {selectedPatient && <div style={{marginTop:16}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>{"Fecha de evaluaci\u00f3n"}</label><input type="date" value={pd.eD} onChange={function(e){sPd(function(p){return Object.assign({},p,{eD:e.target.value})})}} style={I}/></div>
            <div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Derivado por</label><input value={pd.ref} onChange={function(e){sPd(function(p){return Object.assign({},p,{ref:e.target.value})})}} style={I} placeholder="Profesional"/></div>
          </div>
        </div>}
        <div style={{marginTop:20,padding:16,background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:10}}>
          <div style={{fontSize:13,fontWeight:700,color:"#0369a1",marginBottom:10}}>{"Qu\u00e9 \u00e1reas evaluar?"}</div>
          <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:14}}><input type="checkbox" checked={evalRec} onChange={function(e){setEvalRec(e.target.checked)}} style={{width:18,height:18,accentColor:"#0d9488"}}/>{"\ud83d\udd0a Comprensi\u00f3n Auditiva (Receptivo)"}</label>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:14}}><input type="checkbox" checked={evalExp} onChange={function(e){setEvalExp(e.target.checked)}} style={{width:18,height:18,accentColor:"#0d9488"}}/>{"\ud83d\udde3\ufe0f Comunicaci\u00f3n Expresiva"}</label>
          </div>
          {!evalRec&&!evalExp&&<div style={{marginTop:8,color:"#dc2626",fontSize:12,fontWeight:600}}>{"Debe seleccionar al menos un \u00e1rea"}</div>}
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:20}}><Bt pr={true} onClick={function(){if(!selectedPatient){nfy("Busque y seleccione un paciente","er");return}if(!evalRec&&!evalExp){nfy("Seleccione al menos un \u00e1rea","er");return}setDirty(true);sS(2)}}>{"Siguiente \u2192"}</Bt></div>
      </div>}

      {content==="rec"&&<div>{RI(REC,"AC")}<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14,paddingTop:14,borderTop:"1px solid #e2e8f0"}}><span style={{fontSize:13,color:K.mt}}>{"Logrados: "}<b style={{color:"#0d9488"}}>{rR.logrado}</b>{"/55 \u00b7 Sin evaluar: "}<b style={{color:"#f59e0b"}}>{rR.noEvaluado.length}</b></span><div style={{display:"flex",gap:8}}><Bt onClick={function(){sS(step-1)}}>{"\u2190 Atr\u00e1s"}</Bt><Bt pr={true} onClick={function(){sS(step+1)}}>{"Siguiente \u2192"}</Bt></div></div></div>}

      {content==="exp"&&<div>{RI(EXP,"EC")}<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14,paddingTop:14,borderTop:"1px solid #e2e8f0"}}><span style={{fontSize:13,color:K.mt}}>{"Logrados: "}<b style={{color:"#0d9488"}}>{rE.logrado}</b>{"/55 \u00b7 Sin evaluar: "}<b style={{color:"#f59e0b"}}>{rE.noEvaluado.length}</b></span><div style={{display:"flex",gap:8}}><Bt onClick={function(){sS(step-1)}}>{"\u2190 Atr\u00e1s"}</Bt><Bt pr={true} onClick={function(){sS(step+1)}}>{"Resultados \u2192"}</Bt></div></div></div>}

      {content==="result"&&(function(){
        var recRes={label:"Comprensi\u00f3n Auditiva",evaluated:evalRec};Object.assign(recRes,rR);
        var expRes={label:"Comunicaci\u00f3n Expresiva",evaluated:evalExp};Object.assign(expRes,rE);
        var allNoEval=[].concat(evalRec?rR.noEvaluado:[]).concat(evalExp?rE.noEvaluado:[]);

        return <div>
          <div style={{background:"#dcfce7",borderRadius:10,padding:"12px 18px",marginBottom:16,display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18}}>{"\u2705"}</span><span style={{fontSize:13,fontWeight:600,color:"#059669"}}>{"Evaluaci\u00f3n guardada correctamente."}</span></div>

          {generating && <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:40,textAlign:"center",marginBottom:20}}>
            <div style={{display:"inline-block",width:40,height:40,border:"4px solid #e2e8f0",borderTopColor:"#0d9488",borderRadius:"50%",animation:"spin 1s linear infinite",marginBottom:16}} />
            <div style={{fontSize:15,fontWeight:600,color:"#0a3d2f"}}>{"Generando informe con IA..."}</div>
            <div style={{fontSize:12,color:K.mt,marginTop:6}}>{"Esto puede tardar unos segundos."}</div>
            <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
          </div>}

          {genError && !report && <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:28,textAlign:"center",marginBottom:20}}>
            <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#dc2626"}}>{genError}</div>
            <button onClick={function(){ setGenError(null); }} style={{padding:"10px 24px",background:"#0d9488",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>{"Reintentar"}</button>
          </div>}

          {report && <div style={{marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}>
              <div style={{fontSize:15,fontWeight:700,color:"#0a3d2f"}}>{"Informe Fonoaudiol\u00f3gico"}</div>
              <button onClick={handlePDFReport} style={{padding:"7px 14px",background:"#0d9488",color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>{"\ud83d\udda8 Imprimir informe"}</button>
            </div>
            <div ref={reportRef} style={{background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:24}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16,paddingBottom:12,borderBottom:"2px solid #e2e8f0"}}>
                <div><div style={{fontSize:10,color:K.mt,fontWeight:600,textTransform:"uppercase",letterSpacing:1}}>{"Informe Fonoaudiol\u00f3gico \u2014 ELDI"}</div><div style={{fontSize:17,fontWeight:700,marginTop:3}}>{pd.pN}</div><div style={{fontSize:12,color:K.mt,marginTop:2}}>{"DNI: "+(pd.dni||"N/A")+" \u00b7 Edad: "+(a?fa(a):"")}</div></div>
                <div style={{textAlign:"right"}}><div style={{fontSize:11,color:K.mt}}>{"Fecha: "+(pd.eD||"")}</div></div>
              </div>
              <div>{renderReportText(report)}</div>
              <div style={{marginTop:20,background:"linear-gradient(135deg,#ccfbf1,#f0fdf4)",borderRadius:10,padding:"14px 18px",border:"1px solid #99f6e4"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:18}}>{"\ud83e\udde0"}</span><span style={{fontSize:11,fontWeight:700,color:"#0a3d2f"}}>{"Generado con IA"}</span></div><div style={{width:1,height:16,background:"#5eead4"}} /><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:18}}>{"\u2705"}</span><span style={{fontSize:11,fontWeight:700,color:"#059669"}}>{"Comprobado por profesionales en fonoaudiolog\u00eda de C\u00f3rdoba"}</span></div></div>
                <div style={{fontSize:10,color:"#0d9488",marginTop:6}}>{"Generado con IA. Validado por profesionales fonoaudi\u00f3logos de C\u00f3rdoba, Argentina. Debe ser revisado por el profesional tratante."}</div>
              </div>
              <div style={{marginTop:14,paddingTop:8,borderTop:"1px solid #e2e8f0",fontSize:9,color:"#94a3b8",textAlign:"center"}}>{"Br\u00fajula KIT \u2014 ELDI \u2014 "+new Date().toLocaleDateString("es-AR")}</div>
            </div>
          </div>}

          <button onClick={function(){ setShowTech(!showTech); }} style={{width:"100%",padding:"14px",background:showTech?"#f1f5f9":"#0a3d2f",color:showTech?"#1e293b":"#fff",border:"1px solid #e2e8f0",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",marginBottom:showTech?16:20}}>{showTech?"\u25b2 Ocultar datos t\u00e9cnicos":"\u25bc Ver datos t\u00e9cnicos de la evaluaci\u00f3n"}</button>

          {showTech && <div>
            <h2 style={{fontSize:20,fontWeight:700,marginBottom:8}}>{"Resultados ELDI \u2014 "+pd.pN}</h2>
            <p style={{fontSize:12,color:K.mt,marginBottom:20}}>{"Edad: "+fa(a)+" \u00b7 Evaluaci\u00f3n: "+pd.eD+(pd.dni?" \u00b7 DNI: "+pd.dni:"")}</p>

            {evalRec&&rR.evaluados>0&&renderClassification(rR,"Comprensi\u00f3n Auditiva")}
            {evalExp&&rE.evaluados>0&&renderClassification(rE,"Comunicaci\u00f3n Expresiva")}

            {[recRes,expRes].map(function(area,i){
              var items=i===0?REC:EXP;
              if(!area.evaluated)return <div key={i} style={{background:"#f1f5f9",borderRadius:10,padding:20,border:"1px solid #e2e8f0",marginBottom:14}}>
                <div style={{fontWeight:700,fontSize:15}}>{i===0?"\ud83d\udd0a":"\ud83d\udde3\ufe0f"}{" "+area.label}</div>
                <div style={{fontSize:14,color:"#64748b",fontStyle:"italic",marginTop:6}}>{"No evaluado en esta sesi\u00f3n"}</div>
              </div>;
              return <div key={i} style={{background:"#f8faf9",borderRadius:10,padding:20,border:"1px solid #e2e8f0",marginBottom:14}}>
                <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>{i===0?"\ud83d\udd0a":"\ud83d\udde3\ufe0f"}{" "+area.label}</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                  <div><div style={{fontSize:10,color:K.mt,marginBottom:2}}>{"\u00cdtems logrados"}</div><div style={{fontSize:24,fontWeight:700,color:"#059669"}}>{area.logrado}<span style={{fontSize:14,color:K.mt}}>{"/"+area.total}</span></div></div>
                  <div><div style={{fontSize:10,color:K.mt,marginBottom:2}}>{"No logrados"}</div><div style={{fontSize:24,fontWeight:700,color:"#dc2626"}}>{area.noLogrado}</div></div>
                  <div><div style={{fontSize:10,color:K.mt,marginBottom:2}}>{"Sin evaluar"}</div><div style={{fontSize:24,fontWeight:700,color:"#f59e0b"}}>{area.noEvaluado.length}</div></div>
                </div>
                {area.evaluados>0&&<div style={{marginTop:12}}>
                  <div style={{fontSize:10,color:K.mt,marginBottom:4}}>{"% logro (sobre evaluados)"}</div>
                  <div style={{background:"#e2e8f0",borderRadius:6,height:24,overflow:"hidden",position:"relative"}}>
                    <div style={{background:area.pctLogrado>=80?"#059669":area.pctLogrado>=50?"#f59e0b":"#dc2626",height:"100%",width:area.pctLogrado+"%",borderRadius:6,transition:"width .5s"}}/>
                    <span style={{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",fontSize:12,fontWeight:700}}>{area.pctLogrado+"%"}</span>
                  </div>
                </div>}
                {renderNoEval(area.noEvaluado,items)}
              </div>;
            })}

            <div style={{background:"linear-gradient(135deg,#0a3d2f,#0d9488)",borderRadius:10,padding:24,color:"#fff",marginBottom:24}}>
              <div style={{fontSize:13,opacity:.8,marginBottom:8}}>Resumen</div>
              <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
                {evalRec&&<div><span style={{fontSize:36,fontWeight:700}}>{rR.logrado}</span><span style={{fontSize:14,opacity:.7}}>{"/"+rR.evaluados+" Receptivo"}</span></div>}
                {evalExp&&<div><span style={{fontSize:36,fontWeight:700}}>{rE.logrado}</span><span style={{fontSize:14,opacity:.7}}>{"/"+rE.evaluados+" Expresivo"}</span></div>}
              </div>
              {allNoEval.length>0&&<div style={{marginTop:12,padding:"8px 12px",background:"rgba(255,255,255,.12)",borderRadius:8,fontSize:12}}>{allNoEval.length+" \u00edtems sin evaluar \u2014 parcial"}</div>}
            </div>
          </div>}

          <button onClick={function(){onS("tools")}} style={{width:"100%",padding:"14px",background:"#0d9488",color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer",marginTop:4}}>{"Finalizar \u2713"}</button>
        </div>;
      })()}
    </div>
  </div>;
}
