import { useState, useCallback, useEffect, useRef } from "react";
import { PEFF_SECTIONS } from "../data/peffSections.js";
import { PF_CATEGORIES, ALL_PROCESSES } from "../data/peffProcesos.js";
import { HelpTip, OptionHelpTip, renderGroupedCoord, TeethButton } from "./NewPEFF_helpers.jsx";
import PatientLookup from "./PatientLookup.jsx";
import AIReportPanel from "./AIReportPanel.jsx";
import { db, doc, updateDoc } from "../firebase.js";
import { fbAdd } from "../lib/fb.js";
import { saveDraft, deleteDraft } from "../lib/drafts.js";
import { detectProceso } from "../lib/detectProceso.js";
import "../styles/NewPEFF.css";

const gm = (b, e) => {
  const B = new Date(b), E = new Date(e);
  let m = (E.getFullYear() - B.getFullYear()) * 12 + E.getMonth() - B.getMonth();
  if (E.getDate() < B.getDate()) m--;
  return Math.max(0, m);
};
const fa = m => `${Math.floor(m/12)} a\u00f1os, ${m%12} meses`;

const sevDesc = {
  "Adecuado": "PCC = 100%: El ni\u00f1o/a produce correctamente todos los fonemas evaluados.",
  "Leve": "PCC 85\u201399%: Errores articulatorios aislados, inteligibilidad conservada.",
  "Leve-Moderado": "PCC 65\u201384%: M\u00faltiples errores, inteligibilidad parcialmente afectada.",
  "Moderado-Severo": "PCC 50\u201364%: Errores frecuentes, inteligibilidad comprometida.",
  "Severo": "PCC <50%: Errores generalizados, inteligibilidad severamente afectada."
};
const sevColor = { "Adecuado":"#059669", "Leve":"#84cc16", "Leve-Moderado":"#f59e0b", "Moderado-Severo":"#ea580c", "Severo":"#dc2626" };
const sevColorSoft = { "Adecuado":"#059669dd", "Leve":"#84cc16dd", "Leve-Moderado":"#f59e0bdd", "Moderado-Severo":"#ea580cdd", "Severo":"#dc2626dd" };

const speak = (text) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "es-AR"; u.rate = 0.68; u.pitch = 1.08; u.volume = 1;
  const voices = window.speechSynthesis.getVoices();
  const pick = voices.find(v => /es[-_]AR/i.test(v.lang) && /female|Google|Microsoft/i.test(v.name))
    || voices.find(v => /es[-_]AR/i.test(v.lang))
    || voices.find(v => /es[-_]MX/i.test(v.lang))
    || voices.find(v => /es[-_]ES/i.test(v.lang))
    || voices.find(v => v.lang.startsWith("es"));
  if (pick) u.voice = pick;
  window.speechSynthesis.speak(u);
};

const scrollTop = () => {
  const el = document.getElementById("main-scroll");
  if (el) el.scrollTo({top:0, behavior:"smooth"});
  else window.scrollTo({top:0, behavior:"smooth"});
};

const RESULT_STEP = PEFF_SECTIONS.length + 1;

export default function NewPEFF({ onS, nfy, userId, draft, therapistInfo, deductCredit, isAdmin, userSettings }) {
  var init = draft ? draft.data : null;
  const [step, setStep] = useState(init ? (init.step || 0) : 0);
  const [pd, sPd] = useState(init ? init.pd : { pN:"", birth:"", eD:new Date().toISOString().split("T")[0], sch:"", ref:"", obs:"", dni:"" });
  const [data, setD] = useState(init ? (init.data || {}) : {});
  const [procData, setProcData] = useState(init ? (init.procData || {}) : {});
  const [playingId, setPlayingId] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(init ? init.selectedPatient : null);
  const [saved, setSaved] = useState(false);
  const [savedDocId, setSavedDocId] = useState(null);
  const [report, setReport] = useState(null);
  const [showTech, setShowTech] = useState(false);
  const docIdRef = useRef(null);

  const a = pd.birth && pd.eD ? gm(pd.birth, pd.eD) : 0;

  const sf = (id, v) => setD(p => ({ ...p, [id]: v }));
  const spf = (itemId, field, v) => setProcData(p => ({ ...p, [itemId]: { ...(p[itemId] || {}), [field]: v } }));

  var handlePatientSelect = function(pac) {
    setSelectedPatient(pac);
    if (pac) {
      sPd(function(p) { return Object.assign({}, p, { pN: pac.nombre || "", birth: pac.fechaNac || "", sch: pac.colegio || "", dni: pac.dni || "" }); });
    } else {
      sPd(function(p) { return Object.assign({}, p, { pN: "", birth: "", sch: "", dni: "" }); });
    }
  };

  useEffect(() => { scrollTop(); }, [step]);
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, []);

  useEffect(function() {
    if (step === RESULT_STEP && !saved) {
      var r = calc();
      var payload = {
        id: Date.now()+"", userId: userId, tipo: "peff",
        paciente: pd.pN, pacienteDni: pd.dni || "",
        fechaNacimiento: pd.birth, fechaEvaluacion: pd.eD,
        establecimiento: pd.sch, derivadoPor: pd.ref,
        edadMeses: a, observaciones: pd.obs || "",
        evaluador: "", fechaGuardado: new Date().toISOString(),
        seccionData: data, procesosData: procData, resultados: r
      };
      fbAdd("evaluaciones", payload).then(function(res) {
        if (res.success) {
          docIdRef.current = res.id;
          setSavedDocId(res.id);
          nfy("PEFF guardada", "ok");
        } else nfy("Error: " + res.error, "er");
      });
      if (draft && draft._fbId) deleteDraft(draft._fbId);
      setSaved(true);
    }
  }, [step]);

  const goStep = (s) => { setStep(s); scrollTop(); };

  const handlePausePEFF = () => {
    var draftData = { step, pd, data, procData, selectedPatient, patientId: selectedPatient ? (selectedPatient._fbId || selectedPatient.dni || pd.pN) : "unknown" };
    saveDraft(userId, "peff", draftData).then(r => {
      if (r.success) nfy("Evaluacion pausada", "ok");
      onS("tools");
    });
  };

  const handleFinishEarlyPEFF = () => {
    if (!selectedPatient) { nfy("Selecciona un paciente", "er"); return; }
    if (Object.keys(data).length === 0) { nfy("Registra al menos una respuesta", "er"); return; }
    if (window.confirm("Finalizar evaluacion ahora?\n\nSe guardaran los datos registrados hasta el momento.")) goStep(RESULT_STEP);
  };

  // ============================================================
  // Render field (text/select)
  // ============================================================
  const rField = (f, opts) => {
    const hideHelp = opts?.hideHelp;
    if (f.type === "text") return <div key={f.id} className="peff-field">
      <label className="peff-label">
        {f.label}
        {!hideHelp && <HelpTip text={f.help} searchTerm={f.label} />}
        {f.showTeethImg && <TeethButton arch={f.showTeethImg} ageMo={a} />}
      </label>
      <input value={data[f.id] || ""} onChange={e => sf(f.id, e.target.value)} className="peff-input" />
    </div>;

    const cur = data[f.id] || "";
    return <div key={f.id} className="peff-field">
      <label className="peff-label peff-label--options">
        {f.label}
        {!hideHelp && <HelpTip text={f.help} searchTerm={f.label} />}
      </label>
      {f.desc && <div className="peff-desc">{f.desc}</div>}
      <div className="peff-opts">
        {f.options.map(o => <span key={o} className="peff-opt-wrap">
          <button
            onClick={() => sf(f.id, cur === o ? "" : o)}
            className={"peff-opt" + (cur === o ? " peff-opt--active" : "")}
          >{cur === o && "\u2713 "}{o}</button>
          {f.optionHelp && f.optionHelp[o] && <OptionHelpTip text={f.optionHelp[o]} label={o} />}
        </span>)}
      </div>
    </div>;
  };

  // ============================================================
  // Legend (fixed)
  // ============================================================
  const legendItems = [
    { v:"\u2713", cls:"peff-legend-badge peff-legend-badge--ok", t:"Correcto", d:"Producci\u00f3n adecuada" },
    { v:"D", cls:"peff-legend-badge peff-legend-badge--d", t:"Distorsi\u00f3n", d:"Sonido alterado" },
    { v:"O", cls:"peff-legend-badge peff-legend-badge--o", t:"Omisi\u00f3n", d:"No produce" },
    { v:"S", cls:"peff-legend-badge peff-legend-badge--s", t:"Sustituci\u00f3n", d:"Reemplaza" }
  ];
  const legendBox = <div className="peff-legend">
    <div className="peff-legend-title">Leyenda</div>
    <div className="peff-legend-list">
      {legendItems.map(o => <div key={o.v} className="peff-legend-item">
        <div className={o.cls}>{o.v}</div>
        <span className="peff-legend-text"><b>{o.t}</b> {"\u2014"} {o.d}</span>
      </div>)}
    </div>
  </div>;

  // ============================================================
  // Render phoneme (rPhon)
  // ============================================================
  const respBtnActiveClass = { "ok":"peff-resp-btn--ok-active", "D":"peff-resp-btn--d-active", "O":"peff-resp-btn--o-active", "S":"peff-resp-btn--s-active" };

  const rPhon = item => {
    const v = data[item.id] || "";
    const isError = v === "D" || v === "O" || v === "S";
    const pd2 = procData[item.id] || {};

    let headCls = "peff-phon-head";
    if (isError) headCls += " peff-phon-head--error";
    else if (v === "ok") headCls += " peff-phon-head--ok";

    return <div key={item.id} className={"peff-phon" + (isError ? " peff-phon--error" : "")}>
      <div className={headCls}>
        <span className="peff-phon-word">{item.word}</span>
        <span className="peff-phon-target">{item.target}</span>
        <div className="peff-resp-row">
          {[{v:"ok",l:"\u2713"},{v:"D",l:"D"},{v:"O",l:"O"},{v:"S",l:"S"}].map(o => {
            const btnCls = "peff-resp-btn" + (v === o.v ? " " + respBtnActiveClass[o.v] : "");
            return <button
              key={o.v}
              onClick={() => {
                sf(item.id, v === o.v ? "" : o.v);
                if (o.v === "ok") setProcData(p => { const n = {...p}; delete n[item.id]; return n; });
              }}
              className={btnCls}
            >{o.l}</button>;
          })}
        </div>
      </div>
      {isError && <div className="peff-err-panel">
        <div className="peff-err-row">
          <div className="peff-err-col-prod">
            <label className="peff-err-label">{"Producci\u00f3n del ni\u00f1o"}</label>
            <input
              value={pd2.produccion || ""}
              onChange={e => {
                var val = e.target.value;
                spf(item.id, "produccion", val);
                var detected = detectProceso(item.word, val, v);
                if (detected && !(pd2.proceso && pd2.manualProceso)) {
                  spf(item.id, "proceso", detected);
                  spf(item.id, "autoDetected", true);
                }
              }}
              className="peff-input-sm"
              placeholder={`Qu\u00e9 dijo en vez de "${item.word}"?`}
            />
          </div>
          <div className="peff-err-col-proc">
            <label className="peff-err-label">
              {"Proceso fonol\u00f3gico"}
              {pd2.autoDetected && !pd2.manualProceso && <span className="peff-auto-badge">{"auto"}</span>}
            </label>
            <select
              value={pd2.proceso || ""}
              onChange={e => {
                spf(item.id, "proceso", e.target.value);
                spf(item.id, "manualProceso", true);
                spf(item.id, "autoDetected", false);
              }}
              className={"peff-select-sm" + (pd2.autoDetected && !pd2.manualProceso ? " peff-select-sm--auto" : "")}
            >
              <option value="">-- Clasificar --</option>
              {PF_CATEGORIES.map(cat => <optgroup key={cat.id} label={cat.title}>
                {cat.processes.map(pr => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
              </optgroup>)}
            </select>
          </div>
        </div>
        {pd2.proceso && <div className="peff-proc-desc">{ALL_PROCESSES.find(p => p.id === pd2.proceso)?.desc || ""}</div>}
      </div>}
    </div>;
  };

  // ============================================================
  // Render discrimination (rDisc)
  // ============================================================
  const rDisc = item => {
    const v = data[item.id] || "";
    let cls = "peff-disc";
    if (v === "correcto") cls += " peff-disc--correct";
    else if (v === "incorrecto") cls += " peff-disc--incorrect";
    return <div key={item.id} className={cls}>
      <span className="peff-disc-pair">{item.pair}</span>
      {item.contrast && <span className="peff-disc-contrast">{item.contrast}</span>}
      <div className="peff-disc-btns">
        {["correcto","incorrecto"].map(o => {
          const isActive = v === o;
          let btnCls = "peff-disc-btn";
          if (isActive && o === "correcto") btnCls += " peff-disc-btn--ok-active";
          else if (isActive && o === "incorrecto") btnCls += " peff-disc-btn--ko-active";
          return <button
            key={o}
            onClick={() => sf(item.id, v === o ? "" : o)}
            className={btnCls}
          >{o === "correcto" ? "\u2714" : "\u2718"}</button>;
        })}
      </div>
    </div>;
  };

  // ============================================================
  // Render recognition (rRec)
  // ============================================================
  const rRec = item => {
    const v = data[item.id] || "";
    const parts = item.target.split("/");
    const word1 = (parts[0] || "").trim();
    const word2 = (parts[1] || "").trim();
    const correctWord = word1;
    const isPlaying = playingId === item.id;
    const handleSpeak = () => { setPlayingId(item.id); speak(correctWord); setTimeout(() => setPlayingId(null), 1500); };
    const handleSelect = (sw) => { sf(item.id, sw === correctWord ? "reconoce" : "no"); };
    const options = item.id.charCodeAt(item.id.length - 1) % 2 === 0 ? [word1, word2] : [word2, word1];

    let recCls = "peff-rec";
    if (v === "reconoce") recCls += " peff-rec--ok";
    else if (v === "no") recCls += " peff-rec--no";

    return <div key={item.id} className={recCls}>
      <div className={"peff-rec-row" + (v ? " peff-rec-row--has" : "")}>
        <button
          onClick={handleSpeak}
          className={"peff-btn-listen" + (isPlaying ? " peff-btn-listen--playing" : "")}
        >{isPlaying ? "\ud83d\udd0a ..." : "\ud83d\udd0a Escuchar"}</button>
        <span className="peff-rec-contrast">{item.contrast}</span>
        <div className="peff-rec-opts">
          {options.map(w => {
            const isSel = (v === "reconoce" && w === correctWord) || (v === "no" && w !== correctWord);
            const isCorr = v && w === correctWord;
            let btnCls = "peff-rec-opt";
            if (isSel && isCorr) btnCls += " peff-rec-opt--correct-active";
            else if (isSel && !isCorr) btnCls += " peff-rec-opt--wrong-active";
            if (v && !isSel) btnCls += " peff-rec-opt--dim";
            return <button key={w} onClick={() => handleSelect(w)} className={btnCls}>{w}</button>;
          })}
        </div>
        {v && <button
          onClick={() => { const n = {...data}; delete n[item.id]; setD(n); }}
          className="peff-rec-clear"
        >{"\u00d7"}</button>}
      </div>
      {v && <div className={"peff-rec-status " + (v === "reconoce" ? "peff-rec-status--ok" : "peff-rec-status--no")}>
        {v === "reconoce" ? "\u2713 Reconoce correctamente" : "\u2717 No reconoce"}
      </div>}
    </div>;
  };

  // ============================================================
  // Render section
  // ============================================================
  const rSec = sec => {
    const isFon = sec.id === "fon";
    const isCoord = sec.id === "cnm";
    const isRecFon = sec.id === "recfon";
    const mainContent = <div className={isFon ? "peff-fon-main" : ""}>
      <h2 className="peff-h2">{sec.title}</h2>
      {sec.description && <p className="peff-intro">{sec.description}</p>}
      {isRecFon && <div className="peff-info">
        <strong>{"\ud83c\udfa7 Instrucciones:"}</strong>
        {" Presione \"Escuchar\" para reproducir la palabra. El ni\u00f1o/a debe se\u00f1alar cu\u00e1l corresponde."}
      </div>}
      {sec.subsections.map(sub => <div key={sub.id} className="peff-subsec">
        <h3 className="peff-h3">{sub.title}</h3>
        {sub.fields && (isCoord ? renderGroupedCoord(sub.fields, rField) : sub.fields.map(f => rField(f)))}
        {sub.items && sub.items.map(i => rPhon(i))}
        {sub.discItems && sub.discItems.map(i => rDisc(i))}
        {sub.recItems && sub.recItems.map(i => rRec(i))}
      </div>)}
    </div>;
    if (!isFon) return mainContent;
    return <div className="peff-fon-wrap">
      {mainContent}
      <div className="peff-fon-legend-col">{legendBox}</div>
    </div>;
  };

  // ============================================================
  // Counters + calc
  // ============================================================
  const countUnevalSelects = () => {
    let c = 0;
    PEFF_SECTIONS.forEach(sec => {
      sec.subsections.forEach(sub => {
        if (sub.fields) sub.fields.forEach(f => { if (f.type === "select" && !data[f.id]) c++; });
      });
    });
    return c;
  };
  const countUnevalPhon = () => {
    let c = 0;
    const s = PEFF_SECTIONS.find(s => s.id === "fon");
    if (s) s.subsections.forEach(sub => { if (sub.items) sub.items.forEach(i => { if (!data[i.id]) c++; }); });
    return c;
  };
  const countUnevalDisc = () => {
    let c = 0;
    const s = PEFF_SECTIONS.find(s => s.id === "disc");
    if (s) s.subsections.forEach(sub => { if (sub.discItems) sub.discItems.forEach(i => { if (!data[i.id]) c++; }); });
    return c;
  };
  const countUnevalRec = () => {
    let c = 0;
    const s = PEFF_SECTIONS.find(s => s.id === "recfon");
    if (s) s.subsections.forEach(sub => { if (sub.recItems) sub.recItems.forEach(i => { if (!data[i.id]) c++; }); });
    return c;
  };

  const calc = () => {
    const sI = PEFF_SECTIONS.find(s => s.id === "fon")?.subsections.flatMap(sub => sub.items || []) || [];
    const sOk = sI.filter(i => data[i.id] === "ok").length;
    const sEvaluated = sI.filter(i => !!data[i.id]).length;
    const sPct = sI.length ? Math.round(sOk / sI.length * 100) : 0;
    const sPctEval = sEvaluated > 0 ? Math.round(sOk / sEvaluated * 100) : 0;
    const dI = PEFF_SECTIONS.find(s => s.id === "disc")?.subsections.flatMap(sub => sub.discItems || []) || [];
    const dOk = dI.filter(i => data[i.id] === "correcto").length;
    const dEval = dI.filter(i => !!data[i.id]).length;
    const dPct = dEval > 0 ? Math.round(dOk / dEval * 100) : 0;
    const rI = PEFF_SECTIONS.find(s => s.id === "recfon")?.subsections.flatMap(sub => sub.recItems || []) || [];
    const rOk = rI.filter(i => data[i.id] === "reconoce").length;
    const rEval = rI.filter(i => !!data[i.id]).length;
    const rPct = rEval > 0 ? Math.round(rOk / rEval * 100) : 0;
    let sev = "Adecuado";
    if (sPctEval < 50) sev = "Severo";
    else if (sPctEval < 65) sev = "Moderado-Severo";
    else if (sPctEval < 85) sev = "Leve-Moderado";
    else if (sPctEval < 100) sev = "Leve";
    const procAnalysis = { byCategory:{}, byProcess:{}, errors:[], total:0 };
    Object.entries(procData).forEach(([itemId, pd2]) => {
      if (!pd2.proceso) return;
      const proc = ALL_PROCESSES.find(p => p.id === pd2.proceso);
      if (!proc) return;
      procAnalysis.total++;
      procAnalysis.byCategory[proc.category] = (procAnalysis.byCategory[proc.category] || 0) + 1;
      procAnalysis.byProcess[proc.id] = (procAnalysis.byProcess[proc.id] || 0) + 1;
      const item = sI.find(i => i.id === itemId);
      procAnalysis.errors.push({
        itemId,
        word: item?.word || itemId,
        target: item?.target || "",
        produccion: pd2.produccion || "",
        proceso: proc.id,
        procesoName: proc.name,
        category: proc.category,
        categoryTitle: proc.categoryTitle,
        expectedAge: proc.expectedAge
      });
    });
    const us = countUnevalSelects(), up = countUnevalPhon(), ud = countUnevalDisc(), ur = countUnevalRec();
    return {
      silOk:sOk, silTotal:sI.length, silPct:sPct, silEval:sEvaluated, silPctEval:sPctEval,
      discOk:dOk, discTotal:dI.length, discEval:dEval, discPct:dPct,
      recOk:rOk, recTotal:rI.length, recEval:rEval, recPct:rPct,
      severity:sev, procAnalysis, pcc:sPctEval,
      unevalSelects:us, unevalPhon:up, unevalDisc:ud, unevalRec:ur,
      unevalTotal: us + up + ud + ur
    };
  };

  // ============================================================
  // Result sub-component
  // ============================================================
  const ResultCard = ({ title, desc, ok, total, evaluated, pct, color }) => {
    const bigStyle = color ? { color: color } : undefined;
    return <div className="peff-result-card">
      <div className="peff-result-card-title">{title}</div>
      <div className="peff-result-card-desc">{desc}</div>
      <div className="peff-result-card-big" style={bigStyle}>
        {ok}<span className="peff-result-card-big-total">{"/"}{total}</span>
      </div>
      {pct !== undefined && <div className="peff-result-card-pct">{pct}{"% correcto"}</div>}
      {evaluated !== undefined && evaluated < total && <div className="peff-result-card-warn">{"("}{evaluated}{" evaluados de "}{total}{")"}</div>}
    </div>;
  };

  // ============================================================
  // RENDER
  // ============================================================
  return <div className="peff">
    <div className="peff-progress">
      {["Datos", ...PEFF_SECTIONS.map((_, i) => `${i+1}`), "Result"].map((s, i) => {
        let barCls = "peff-progress-bar";
        if (step > i) barCls += " peff-progress-bar--done";
        else if (step === i) barCls += " peff-progress-bar--active";
        return <div key={i} className="peff-progress-item">
          <div className={barCls} />
          <span className={"peff-progress-label" + (step === i ? " peff-progress-label--active" : "")}>{s}</span>
        </div>;
      })}
    </div>

    <div className="peff-card">

      {step === 0 && <div>
        <h2 className="peff-h2">{"PEFF \u2014 Datos del Paciente"}</h2>
        <p className="peff-intro">{"Protocolo de Evaluaci\u00f3n Fon\u00e9tico-Fonol\u00f3gica"}</p>
        <PatientLookup userId={userId} onSelect={handlePatientSelect} selected={selectedPatient} color="#7c3aed" />
        {selectedPatient && <div className="peff-step0-fields">
          <div className="peff-grid-2">
            <div>
              <label className="peff-label">{"Fecha de evaluaci\u00f3n"}</label>
              <input type="date" value={pd.eD} onChange={e => sPd(p => ({...p, eD:e.target.value}))} className="peff-input" />
            </div>
            <div>
              <label className="peff-label">{"Derivado por"}</label>
              <input value={pd.ref} onChange={e => sPd(p => ({...p, ref:e.target.value}))} className="peff-input" />
            </div>
          </div>
        </div>}
        <div className="peff-cta-row">
          <button onClick={() => {
            if (!selectedPatient) { nfy("Busque y seleccione un paciente", "er"); return; }
            goStep(1);
          }} className="peff-btn-start">{"Comenzar evaluaci\u00f3n \u2192"}</button>
        </div>
      </div>}

      {step >= 1 && step <= PEFF_SECTIONS.length && rSec(PEFF_SECTIONS[step-1])}

      {step === RESULT_STEP && (() => {
        const r = calc();
        const sc = sevColor[r.severity] || "#7c3aed";
        const scSoft = sevColorSoft[r.severity] || "#7c3aeddd";
        const sevStyle = { "--peff-sev": sc, "--peff-sev-soft": scSoft };
        return <div>
          <div className="peff-result-ok">
            <span className="peff-result-ok-icon">{"\u2705"}</span>
            <span className="peff-result-ok-text">{"Evaluación guardada correctamente."}</span>
          </div>

          <AIReportPanel
            ev={{ _fbId:docIdRef.current, paciente:pd.pN, pacienteDni:pd.dni||"", edadMeses:a, fechaEvaluacion:pd.eD, derivadoPor:pd.ref, observaciones:pd.obs||"", resultados:calc(), aiReport:report }}
            evalType="peff" collectionName="evaluaciones" evalLabel="PEFF" autoGenerate={true}
            therapistInfo={therapistInfo}
          />

          <button
            onClick={function(){ setShowTech(!showTech); }}
            className={"peff-tech-toggle" + (showTech ? " peff-tech-toggle--open" : "")}
          >{showTech ? "\u25b2 Ocultar datos técnicos" : "\u25bc Ver datos técnicos"}</button>

          {showTech && <div>
            <div className="peff-result-grid">
              <ResultCard title="Producci\u00f3n de S\u00edlabas" desc="S\u00edlabas correctas." ok={r.silOk} total={r.silTotal} evaluated={r.silEval} pct={r.silPctEval} color={r.silPctEval>=85?"#059669":r.silPctEval>=50?"#f59e0b":"#dc2626"} />
              <ResultCard title="Discriminaci\u00f3n Auditiva" desc="Pares diferenciados." ok={r.discOk} total={r.discTotal} evaluated={r.discEval} pct={r.discPct} color={r.discPct>=85?"#059669":r.discPct>=50?"#f59e0b":"#dc2626"} />
              <ResultCard title="Reconocimiento Fonol\u00f3gico" desc="Palabras identificadas." ok={r.recOk} total={r.recTotal} evaluated={r.recEval} pct={r.recPct} color={r.recPct>=85?"#059669":r.recPct>=50?"#f59e0b":"#dc2626"} />
            </div>
            <div className="peff-severity" style={sevStyle}>
              <div className="peff-severity-label">{"Severidad \u2014 PCC"}</div>
              <div className="peff-severity-value">{r.severity}</div>
              <div className="peff-severity-desc">{sevDesc[r.severity]}</div>
            </div>
            {r.unevalTotal > 0 && <div className="peff-uneval">
              <div className="peff-uneval-title">{"Items sin evaluar ("}{r.unevalTotal}{")"}</div>
              <div className="peff-uneval-grid">
                {r.unevalSelects > 0 && <div>{"OFA/Coord: "}<b>{r.unevalSelects}</b></div>}
                {r.unevalPhon > 0 && <div>{"S\u00edlabas: "}<b>{r.unevalPhon}</b></div>}
                {r.unevalDisc > 0 && <div>{"Disc: "}<b>{r.unevalDisc}</b></div>}
                {r.unevalRec > 0 && <div>{"Reco: "}<b>{r.unevalRec}</b></div>}
              </div>
            </div>}
          </div>}

          <button onClick={() => onS("tools")} className="peff-btn-final">{"Finalizar \u2713"}</button>
        </div>;
      })()}

      {step >= 1 && step <= PEFF_SECTIONS.length && <div className="peff-nav">
        <button onClick={() => goStep(step-1)} className="peff-btn-back">{"Atras"}</button>
        <div className="peff-nav-right">
          <button onClick={handleFinishEarlyPEFF} className="peff-btn-finish">{"Finalizar ahora"}</button>
          <button onClick={handlePausePEFF} className="peff-btn-pause">{"Pausar"}</button>
          <button onClick={() => goStep(step+1)} className="peff-btn-next">{"Siguiente"}</button>
        </div>
      </div>}

    </div>
  </div>;
}
