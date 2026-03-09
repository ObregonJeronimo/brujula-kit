import { useState } from "react";
import { K } from "../lib/fb.js";

var infoTexts = {
  newPEFF: {
    title: "PEFF — Protocolo Fonético-Fonológico",
    sections: [
      { label: "Qué evalúa", text: "El PEFF es un protocolo clínico estandarizado que integra varias pruebas para evaluar los Trastornos de los Sonidos del Habla. Incluye examen clínico OFA, repetición de sílabas, discriminación y reconocimiento fonológico." },
      { label: "Cómo funciona", text: "Cada sección aporta información complementaria: examen clínico de órganos fonoarticulatorios, producción fonética, percepción y reconocimiento auditivo. El sistema calcula porcentajes de aciertos y perfiles." },
      { label: "Interpretación", text: "La interpretación clínica se hace comparando los resultados con normas de edad y desarrollo, lo que orienta el diagnóstico y la planificación terapéutica." },
      { label: "Población objetivo", text: "Niños de 2;6 a 6;11 años con sospecha de trastornos fonético-fonológicos o dificultades en la producción del habla." }
    ]
  },
  newREP: {
    title: "Rep. Palabras — PEFF 3.2",
    sections: [
      { label: "Qué evalúa", text: "Esta evaluación mide la producción fonética y fonológica mediante repetición de palabras. El profesional presenta una lista organizada por segmentos contrastivos (ej. /p/, /t/, /k/), y el paciente debe repetirlas." },
      { label: "Cómo se registra", text: "La respuesta se registra en una tabla con cuatro columnas: ISPP, ISIP, CSIP y CSFP, según el tipo de error observado. Si la palabra es correcta, se marca ✓ o se deja vacío." },
      { label: "Resultados", text: "Los resultados se obtienen calculando el porcentaje de aciertos y la distribución de errores por tipo. El análisis muestra qué fonemas presentan dificultades y si los errores son sistemáticos o aislados." },
      { label: "Utilidad clínica", text: "Permite identificar patrones de error específicos para orientar el tratamiento fonoaudiológico y establecer objetivos terapéuticos concretos." }
    ]
  },
  newDISC: {
    title: "Disc. Fonológica — PEFF-R 3.4",
    sections: [
      { label: "Qué evalúa", text: "Esta prueba evalúa la capacidad del paciente para discriminar auditivamente fonemas. Se presentan pares de palabras, algunas iguales y otras diferentes (pares mínimos). El paciente debe indicar si las palabras son iguales o diferentes." },
      { label: "Cómo se registra", text: "El registro se hace marcando si la respuesta fue correcta o incorrecta, y anotando observaciones sobre patrones de error." },
      { label: "Resultados", text: "Los resultados se calculan con el porcentaje de aciertos y el análisis de qué fonemas o contrastes generan más confusión." },
      { label: "Utilidad clínica", text: "Esto permite identificar dificultades perceptivas que pueden afectar la producción del habla y la lectoescritura. Es clave para diferenciar trastornos de percepción de los de producción." }
    ]
  },
  newRECO: {
    title: "Reco. Fonológico — PEFF-R 3.5",
    sections: [
      { label: "Qué evalúa", text: "Esta prueba mide la capacidad del paciente para reconocer contrastes fonológicos entre distintos grupos de sonidos (oclusivas, fricativas, nasales, líquidas, etc.). Se presentan secuencias de palabras que difieren en un rasgo fonológico." },
      { label: "Cómo se registra", text: "El profesional presenta los 5 estímulos de cada ítem y registra la respuesta del paciente. En la columna final se marca si el paciente reconoció o no el contraste. Se pueden anotar observaciones por ítem." },
      { label: "Resultados", text: "Se calcula el porcentaje de aciertos globales y la distribución de errores por grupo de contraste (12 grupos, 36 ítems). El análisis muestra qué rasgos fonológicos son más problemáticos." },
      { label: "Utilidad clínica", text: "Permite identificar el perfil perceptivo-fonológico del paciente, diferenciando dificultades según tipo de contraste. Orienta el diagnóstico y la planificación terapéutica comparando con normas de edad y desarrollo." }
    ]
  }
};

export default function Tools({ onSel, credits, onBuy }) {
  var _info = useState(null), showInfo = _info[0], setShowInfo = _info[1];
  var noCredits = credits < 1;
  var tools = [
    { id: "newPEFF", icon: "🔊", name: "PEFF", full: "Protocolo Fonético-Fonológico", desc: "Examen clínico OFA, evaluación fonética, discriminación y reconocimiento fonológico.", age: "2;6-6;11", time: "~45-60 min", color: "#7c3aed" },
    { id: "newREP", icon: "📝", name: "Rep. Palabras", full: "Repetición de Palabras (PEFF 3.2)", desc: "Análisis fonético-fonológico: oclusivas, fricativas, nasales, vibrantes, grupos y diptongos.", age: "3-5+", time: "~20-30 min", color: "#2563eb" },
    { id: "newDISC", icon: "👂", name: "Disc. Fonológica", full: "Discriminación Fonológica (PEFF-R 3.4)", desc: "Evaluación de la capacidad para discriminar auditivamente fonemas mediante 14 pares de palabras.", age: "3-6+", time: "~10-15 min", color: "#d97706" },
    { id: "newRECO", icon: "🎯", name: "Reco. Fonológico", full: "Reconocimiento Fonológico (PEFF-R 3.5)", desc: "Reconocimiento de contrastes fonológicos entre 12 grupos de rasgos (36 ítems con 5 estímulos cada uno).", age: "3-6+", time: "~15-25 min", color: "#9333ea" }
  ];

  var hasInfo = function(id){ return !!infoTexts[id]; };

  return (
    <div style={{animation:"fi .3s ease",width:"100%"}}>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>🧰 Herramientas</h1>
      <p style={{color:K.mt,fontSize:14,marginBottom:8}}>Seleccione evaluación</p>
      {noCredits&&<div style={{background:"linear-gradient(135deg,#fef3c7,#fde68a)",border:"1px solid #f59e0b",borderRadius:12,padding:"18px 20px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:"#92400e"}}>⚠ Sin créditos restantes</div>
          <div style={{fontSize:12,color:"#a16207",marginTop:2}}>Necesitás créditos para realizar evaluaciones</div>
        </div>
        <button onClick={onBuy} style={{padding:"10px 24px",background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 12px rgba(245,158,11,.3)",letterSpacing:".3px",whiteSpace:"nowrap"}}>COMPRAR CRÉDITOS →</button>
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        {tools.map(function(t){
          var infoOpen = showInfo === t.id;
          var info = infoTexts[t.id];
          return <div key={t.id} style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden",opacity:noCredits?0.5:1,transition:"opacity .2s"}}>
            <div style={{background:"linear-gradient(135deg,"+t.color+","+t.color+"aa)",padding:"24px 24px 20px",color:"#fff"}}>
              <div style={{fontSize:36,marginBottom:8}}>{t.icon}</div><div style={{fontSize:22,fontWeight:700}}>{t.name}</div>
              <div style={{fontSize:12,opacity:.85,marginTop:2}}>{t.full}</div>
            </div>
            <div style={{padding:"20px 24px"}}>
              <p style={{fontSize:13,color:"#475569",lineHeight:1.6,marginBottom:16}}>{t.desc}</p>
              <div style={{display:"flex",gap:16,fontSize:12,color:K.mt}}><span>👦👧 {t.age}</span><span>⏱ {t.time}</span></div>
              {noCredits
                ? <button onClick={onBuy} style={{marginTop:16,width:"100%",padding:"11px",background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",letterSpacing:".2px"}}>COMPRAR CRÉDITOS</button>
                : <button onClick={function(){onSel(t.id)}} style={{marginTop:16,width:"100%",padding:"11px",background:t.color,color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>Iniciar →</button>}
              {hasInfo(t.id) && <button onClick={function(){ setShowInfo(infoOpen ? null : t.id); }}
                style={{marginTop:8,width:"100%",padding:"9px",background:"transparent",border:"1px solid "+t.color+"44",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",color:t.color,display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all .2s"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                {infoOpen ? "Ocultar información" : "Ver información de la evaluación"}
              </button>}
              {infoOpen && info && <div style={{marginTop:12,background:"linear-gradient(135deg,"+t.color+"08,"+t.color+"12)",border:"1px solid "+t.color+"30",borderRadius:10,padding:"18px 20px",animation:"fi .3s ease"}}>
                <div style={{fontSize:14,fontWeight:700,color:t.color,marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  {info.title}
                </div>
                {info.sections.map(function(sec, i){
                  return <div key={i} style={{marginBottom:i < info.sections.length-1 ? 12 : 0}}>
                    <div style={{fontSize:11,fontWeight:700,color:t.color,textTransform:"uppercase",letterSpacing:".5px",marginBottom:4}}>{sec.label}</div>
                    <div style={{fontSize:12,color:"#475569",lineHeight:1.7}}>{sec.text}</div>
                  </div>;
                })}
              </div>}
            </div>
          </div>;
        })}
      </div>
    </div>
  );
}
