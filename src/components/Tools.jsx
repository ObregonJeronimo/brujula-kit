import { useState } from "react";
import { K } from "../lib/fb.js";

var infoTexts = {
  newPEFF: {
    title: "PEFF \u2014 Protocolo Fon\u00e9tico-Fonol\u00f3gico",
    sections: [
      { label: "Qu\u00e9 eval\u00faa", text: "El PEFF es un protocolo cl\u00ednico estandarizado que integra varias pruebas para evaluar los Trastornos de los Sonidos del Habla. Incluye repetici\u00f3n de palabras, denominaci\u00f3n de im\u00e1genes y discriminaci\u00f3n fonol\u00f3gica." },
      { label: "C\u00f3mo funciona", text: "Cada secci\u00f3n aporta informaci\u00f3n complementaria: producci\u00f3n espont\u00e1nea, imitaci\u00f3n y percepci\u00f3n auditiva. El sistema de registro permite calcular porcentajes de aciertos, distribuci\u00f3n de errores y perfiles fon\u00e9tico-fonol\u00f3gicos." },
      { label: "Interpretaci\u00f3n", text: "La interpretaci\u00f3n cl\u00ednica se hace comparando los resultados con normas de edad y desarrollo, lo que orienta el diagn\u00f3stico y la planificaci\u00f3n terap\u00e9utica." },
      { label: "Poblaci\u00f3n objetivo", text: "Ni\u00f1os de 2;6 a 6;11 a\u00f1os con sospecha de trastornos fon\u00e9tico-fonol\u00f3gicos o dificultades en la producci\u00f3n del habla." }
    ]
  },
  newREP: {
    title: "Rep. Palabras \u2014 PEFF 3.2",
    sections: [
      { label: "Qu\u00e9 eval\u00faa", text: "Esta evaluaci\u00f3n mide la producci\u00f3n fon\u00e9tica y fonol\u00f3gica mediante repetici\u00f3n de palabras. El profesional presenta una lista organizada por segmentos contrastivos (ej. /p/, /t/, /k/), y el paciente debe repetirlas." },
      { label: "C\u00f3mo se registra", text: "La respuesta se registra en una tabla con cuatro columnas: ISPP, ISIP, CSIP y CSFP, seg\u00fan el tipo de error observado. Si la palabra es correcta, se marca \u2713 o se deja vac\u00edo." },
      { label: "Resultados", text: "Los resultados se obtienen calculando el porcentaje de aciertos y la distribuci\u00f3n de errores por tipo. El an\u00e1lisis muestra qu\u00e9 fonemas presentan dificultades y si los errores son sistem\u00e1ticos o aislados." },
      { label: "Utilidad cl\u00ednica", text: "Permite identificar patrones de error espec\u00edficos para orientar el tratamiento fonoaudiol\u00f3gico y establecer objetivos terap\u00e9uticos concretos." }
    ]
  },
  newDISC: {
    title: "Disc. Fonol\u00f3gica \u2014 PEFF-R 3.4",
    sections: [
      { label: "Qu\u00e9 eval\u00faa", text: "Esta prueba eval\u00faa la capacidad del paciente para discriminar auditivamente fonemas. Se presentan pares de palabras, algunas iguales y otras diferentes (pares m\u00ednimos). El paciente debe indicar si las palabras son iguales o diferentes." },
      { label: "C\u00f3mo se registra", text: "El registro se hace marcando si la respuesta fue correcta o incorrecta, y anotando observaciones sobre patrones de error." },
      { label: "Resultados", text: "Los resultados se calculan con el porcentaje de aciertos y el an\u00e1lisis de qu\u00e9 fonemas o contrastes generan m\u00e1s confusi\u00f3n." },
      { label: "Utilidad cl\u00ednica", text: "Esto permite identificar dificultades perceptivas que pueden afectar la producci\u00f3n del habla y la lectoescritura. Es clave para diferenciar trastornos de percepci\u00f3n de los de producci\u00f3n." }
    ]
  },
  newRECO: {
    title: "Reco. Fonol\u00f3gico \u2014 PEFF-R 3.5",
    sections: [
      { label: "Qu\u00e9 eval\u00faa", text: "Esta prueba mide la capacidad del paciente para reconocer contrastes fonol\u00f3gicos entre distintos grupos de sonidos (oclusivas, fricativas, nasales, l\u00edquidas, etc.). Se presentan secuencias de palabras que difieren en un rasgo fonol\u00f3gico." },
      { label: "C\u00f3mo se registra", text: "El profesional presenta los 5 est\u00edmulos de cada \u00edtem y registra la respuesta del paciente. En la columna final se marca si el paciente reconoci\u00f3 o no el contraste. Se pueden anotar observaciones por \u00edtem." },
      { label: "Resultados", text: "Se calcula el porcentaje de aciertos globales y la distribuci\u00f3n de errores por grupo de contraste (12 grupos, 36 \u00edtems). El an\u00e1lisis muestra qu\u00e9 rasgos fonol\u00f3gicos son m\u00e1s problem\u00e1ticos." },
      { label: "Utilidad cl\u00ednica", text: "Permite identificar el perfil perceptivo-fonol\u00f3gico del paciente, diferenciando dificultades seg\u00fan tipo de contraste. Orienta el diagn\u00f3stico y la planificaci\u00f3n terap\u00e9utica comparando con normas de edad y desarrollo." }
    ]
  }
};

export default function Tools({ onSel, credits, onBuy }) {
  var _info = useState(null), showInfo = _info[0], setShowInfo = _info[1];
  var noCredits = credits < 1;
  var tools = [
    { id: "newELDI", icon: "\ud83d\udccb", name: "ELDI", full: "Evaluaci\u00f3n del Lenguaje y Desarrollo Infantil", desc: "Comprensi\u00f3n auditiva y comunicaci\u00f3n expresiva (55+55 \u00edtems) de 0 a 7 a\u00f1os.", age: "0-7;11", time: "~30-45 min", color: "#0d9488" },
    { id: "newPEFF", icon: "\ud83d\udd0a", name: "PEFF", full: "Protocolo Fon\u00e9tico-Fonol\u00f3gico", desc: "OFA, diadococinesis, s\u00edlabas, discriminaci\u00f3n y reconocimiento fonol\u00f3gico.", age: "2;6-6;11", time: "~45-60 min", color: "#7c3aed" },
    { id: "newREP", icon: "\ud83d\udcdd", name: "Rep. Palabras", full: "Repetici\u00f3n de Palabras (PEFF 3.2)", desc: "An\u00e1lisis fon\u00e9tico-fonol\u00f3gico: oclusivas, fricativas, nasales, vibrantes, grupos y diptongos.", age: "3-5+", time: "~20-30 min", color: "#2563eb" },
    { id: "newDISC", icon: "\ud83d\udc42", name: "Disc. Fonol\u00f3gica", full: "Discriminaci\u00f3n Fonol\u00f3gica (PEFF-R 3.4)", desc: "Evaluaci\u00f3n de la capacidad para discriminar auditivamente fonemas mediante 14 pares de palabras.", age: "3-6+", time: "~10-15 min", color: "#d97706" },
    { id: "newRECO", icon: "\ud83c\udfaf", name: "Reco. Fonol\u00f3gico", full: "Reconocimiento Fonol\u00f3gico (PEFF-R 3.5)", desc: "Reconocimiento de contrastes fonol\u00f3gicos entre 12 grupos de rasgos (36 \u00edtems con 5 est\u00edmulos cada uno).", age: "3-6+", time: "~15-25 min", color: "#9333ea" }
  ];

  var hasInfo = function(id){ return !!infoTexts[id]; };

  return (
    <div style={{animation:"fi .3s ease",width:"100%"}}>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>{"\ud83e\uddf0 Herramientas"}</h1>
      <p style={{color:K.mt,fontSize:14,marginBottom:8}}>{"Seleccione evaluaci\u00f3n"}</p>
      {noCredits&&<div style={{background:"linear-gradient(135deg,#fef3c7,#fde68a)",border:"1px solid #f59e0b",borderRadius:12,padding:"18px 20px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:"#92400e"}}>{"\u26a0 Sin cr\u00e9ditos restantes"}</div>
          <div style={{fontSize:12,color:"#a16207",marginTop:2}}>{"Necesit\u00e1s cr\u00e9ditos para realizar evaluaciones"}</div>
        </div>
        <button onClick={onBuy} style={{padding:"10px 24px",background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 12px rgba(245,158,11,.3)",letterSpacing:".3px",whiteSpace:"nowrap"}}>{"COMPRAR CR\u00c9DITOS \u2192"}</button>
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
              <div style={{display:"flex",gap:16,fontSize:12,color:K.mt}}><span>{"\ud83d\udc66\ud83d\udc67 "}{t.age}</span><span>{"\u23f1 "}{t.time}</span></div>
              {noCredits
                ? <button onClick={onBuy} style={{marginTop:16,width:"100%",padding:"11px",background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",letterSpacing:".2px"}}>{"COMPRAR CR\u00c9DITOS"}</button>
                : <button onClick={function(){onSel(t.id)}} style={{marginTop:16,width:"100%",padding:"11px",background:t.color,color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{"Iniciar \u2192"}</button>}
              {hasInfo(t.id) && <button onClick={function(){ setShowInfo(infoOpen ? null : t.id); }}
                style={{marginTop:8,width:"100%",padding:"9px",background:"transparent",border:"1px solid "+t.color+"44",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",color:t.color,display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all .2s"}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                {infoOpen ? "Ocultar informaci\u00f3n" : "Ver informaci\u00f3n de la evaluaci\u00f3n"}
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
