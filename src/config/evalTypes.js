// =====================================================
// REGISTRO CENTRALIZADO DE TIPOS DE EVALUACIÓN
// =====================================================
// Para agregar una nueva evaluación:
// 1. Agregar entrada aquí
// 2. Crear componentes New[X].jsx y Rpt[X].jsx
// 3. Importarlos en evalkit.jsx (imports + COMPONENTS)
// Eso es todo. Tools, Hist, Dashboard, AdminStats leen de acá.
// =====================================================

export var EVAL_TYPES = {
  peff: {
    id: "peff",
    label: "PEFF",
    fullName: "Protocolo Fonético-Fonológico",
    icon: "🔊",
    color: "#7c3aed",
    badgeBg: "#ede9fe",
    age: "2;6-6;11",
    time: "~45-60 min",
    desc: "Examen clínico OFA, evaluación fonética, discriminación y reconocimiento fonológico.",
    newView: "newPEFF",
    rptView: "rptP",
    histTab: "PEFF",
    info: {
      title: "Protocolo Fonético-Fonológico",
      sections: [
        { label: "Qué evalúa", text: "Protocolo clínico estandarizado que integra varias pruebas para evaluar los Trastornos de los Sonidos del Habla. Incluye examen clínico OFA, repetición de sílabas, discriminación y reconocimiento fonológico." },
        { label: "Cómo funciona", text: "Cada sección aporta información complementaria: examen clínico de órganos fonoarticulatorios, producción fonética, percepción y reconocimiento auditivo. El sistema calcula porcentajes de aciertos y perfiles." },
        { label: "Interpretación", text: "La interpretación clínica se hace comparando los resultados con normas de edad y desarrollo, lo que orienta el diagnóstico y la planificación terapéutica." },
        { label: "Población objetivo", text: "Niños de 2;6 a 6;11 años con sospecha de trastornos fonético-fonológicos o dificultades en la producción del habla." }
      ]
    }
  },
  rep: {
    id: "rep",
    label: "REP",
    fullName: "Repetición de Palabras",
    icon: "📝",
    color: "#2563eb",
    badgeBg: "#dbeafe",
    age: "3-5+",
    time: "~20-30 min",
    desc: "Análisis fonético-fonológico: oclusivas, fricativas, nasales, vibrantes, grupos y diptongos.",
    newView: "newREP",
    rptView: "rptR",
    histTab: "Rep.Palabras",
    info: {
      title: "Repetición de Palabras",
      sections: [
        { label: "Qué evalúa", text: "Esta evaluación mide la producción fonética y fonológica mediante repetición de palabras. El profesional presenta una lista organizada por segmentos contrastivos (ej. /p/, /t/, /k/), y el paciente debe repetirlas." },
        { label: "Cómo se registra", text: "La respuesta se registra en una tabla con cuatro columnas: ISPP, ISIP, CSIP y CSFP, según el tipo de error observado. Si la palabra es correcta, se marca ✓ o se deja vacío." },
        { label: "Resultados", text: "Los resultados se obtienen calculando el porcentaje de aciertos y la distribución de errores por tipo. El análisis muestra qué fonemas presentan dificultades y si los errores son sistemáticos o aislados." },
        { label: "Utilidad clínica", text: "Permite identificar patrones de error específicos para orientar el tratamiento fonoaudiológico y establecer objetivos terapéuticos concretos." }
      ]
    }
  },
  disc: {
    id: "disc",
    label: "DISC",
    fullName: "Discriminación Fonológica",
    icon: "👂",
    color: "#d97706",
    badgeBg: "#fef3c7",
    age: "3-6+",
    time: "~10-15 min",
    desc: "Evaluación de la capacidad para discriminar auditivamente fonemas mediante 14 pares de palabras.",
    newView: "newDISC",
    rptView: "rptD",
    histTab: "Disc.Fonol.",
    info: {
      title: "Discriminación Fonológica",
      sections: [
        { label: "Qué evalúa", text: "Esta prueba evalúa la capacidad del paciente para discriminar auditivamente fonemas. Se presentan pares de palabras, algunas iguales y otras diferentes (pares mínimos). El paciente debe indicar si las palabras son iguales o diferentes." },
        { label: "Cómo se registra", text: "El registro se hace marcando si la respuesta fue correcta o incorrecta, y anotando observaciones sobre patrones de error." },
        { label: "Resultados", text: "Los resultados se calculan con el porcentaje de aciertos y el análisis de qué fonemas o contrastes generan más confusión." },
        { label: "Utilidad clínica", text: "Esto permite identificar dificultades perceptivas que pueden afectar la producción del habla y la lectoescritura. Es clave para diferenciar trastornos de percepción de los de producción." }
      ]
    }
  },
  reco: {
    id: "reco",
    label: "RECO",
    fullName: "Reconocimiento Fonológico",
    icon: "🎯",
    color: "#9333ea",
    badgeBg: "#f3e8ff",
    age: "3-6+",
    time: "~15-25 min",
    desc: "Reconocimiento de contrastes fonológicos entre 12 grupos de rasgos (36 ítems con 5 estímulos cada uno).",
    newView: "newRECO",
    rptView: "rptRC",
    histTab: "Reco.Fonol.",
    info: {
      title: "Reconocimiento Fonológico",
      sections: [
        { label: "Qué evalúa", text: "Esta prueba mide la capacidad del paciente para reconocer contrastes fonológicos entre distintos grupos de sonidos (oclusivas, fricativas, nasales, líquidas, etc.). Se presentan secuencias de palabras que difieren en un rasgo fonológico." },
        { label: "Cómo se registra", text: "El profesional presenta los 5 estímulos de cada ítem y registra la respuesta del paciente. En la columna final se marca si el paciente reconoció o no el contraste. Se pueden anotar observaciones por ítem." },
        { label: "Resultados", text: "Se calcula el porcentaje de aciertos globales y la distribución de errores por grupo de contraste (12 grupos, 36 ítems). El análisis muestra qué rasgos fonológicos son más problemáticos." },
        { label: "Utilidad clínica", text: "Permite identificar el perfil perceptivo-fonológico del paciente, diferenciando dificultades según tipo de contraste. Orienta el diagnóstico y la planificación terapéutica comparando con normas de edad y desarrollo." }
      ]
    }
  },
  eldi: {
    id: "eldi",
    label: "ELDI",
    fullName: "Escala de Lenguaje y Desarrollo Infantil",
    icon: "\ud83e\uddd2",
    color: "#0d9488",
    badgeBg: "#ccfbf1",
    age: "0-3 a\u00f1os",
    time: "~30-40 min",
    desc: "Evaluacion del desarrollo de comprension auditiva y comunicacion expresiva en infantes.",
    newView: "newELDI",
    rptView: "rptEL",
    histTab: "ELDI",
    info: {
      title: "Escala de Lenguaje y Desarrollo Infantil",
      sections: [
        { label: "Que evalua", text: "Evalua el desarrollo del lenguaje en ni\u00f1os de 0 a 3 a\u00f1os en dos areas: Comprension Auditiva y Comunicacion Expresiva. Basada en hitos evolutivos esperados por edad." },
        { label: "Como funciona", text: "El profesional presenta items organizados por mes de vida y registra si el ni\u00f1o logra, no logra, o no se evalua cada hito. Se puede evaluar una o ambas areas." },
        { label: "Resultados", text: "Se calcula un perfil criterial comparando los logros del ni\u00f1o con los hitos esperados para su edad, clasificando el rendimiento en categorias (adecuado, riesgo, retraso)." },
        { label: "Utilidad clinica", text: "Permite deteccion temprana de retrasos en el desarrollo del lenguaje y orienta la intervencion precoz." }
      ]
    }
  },
  ofa: {
    id: "ofa",
    label: "EOF",
    fullName: "Examen Clinico EOF",
    icon: "\ud83e\uddb7",
    color: "#0891b2",
    badgeBg: "#cffafe",
    age: "",
    time: "~15-20 min",
    desc: "Evaluacion de organos fonoarticulatorios: labios, ATM, lengua, dientes, paladar y velo.",
    newView: "newOFA",
    rptView: "rptGen",
    histTab: "EOF"
  },
  fon: {
    id: "fon",
    label: "FON",
    fullName: "Evaluacion Fonetica",
    icon: "\ud83d\udde3\ufe0f",
    color: "#6d28d9",
    badgeBg: "#ede9fe",
    age: "",
    time: "~20-30 min",
    desc: "Repeticion de silabas con clasificacion de errores y procesos fonologicos.",
    newView: "newFON",
    rptView: "rptGen",
    histTab: "FON"
  }
};

// Tipos ocultos por defecto (overridden by Firestore toolsConfig)
export var HIDDEN_TYPES = [];

// All types (including ELDI)
export var ALL_EVAL_TYPES = Object.values(EVAL_TYPES);

// Array ordenado de tipos visibles (for backward compat, excludes nothing by default)
export var VISIBLE_TYPES = ALL_EVAL_TYPES;

// Lookup: tipo string -> config object
export function getEvalType(tipo) {
  return EVAL_TYPES[tipo] || null;
}

// Label para mostrar: "peff" -> "PEFF"
export function typeLabel(tipo) {
  var t = EVAL_TYPES[tipo];
  return t ? t.label : (tipo || "").toUpperCase();
}

// Badge style para Hist/Dashboard: "peff" -> { b, c, l }
export function typeBadge(tipo) {
  var t = EVAL_TYPES[tipo];
  if (!t) return { b: "#f1f5f9", c: "#94a3b8", l: (tipo || "").toUpperCase() };
  return { b: t.badgeBg, c: t.color, l: t.label };
}

// Vista de reporte: "peff" -> "rptP"
export function rptViewFor(tipo) {
  var t = EVAL_TYPES[tipo];
  return t ? t.rptView : null;
}

// Es tipo visible? (filtra eldi y otros ocultos)
export function isVisibleType(tipo) {
  return tipo && HIDDEN_TYPES.indexOf(tipo) === -1;
}

// Tabs para historial: [["all","Todas"],["peff","PEFF"],...]
export var HIST_TABS = [["all", "Todas"]].concat(
  VISIBLE_TYPES.map(function(t) { return [t.id, t.histTab]; })
);

// Colors map para AdminStats: { PEFF: "#7c3aed", ... }
export var TYPE_COLORS = {};
VISIBLE_TYPES.forEach(function(t) { TYPE_COLORS[t.label] = t.color; });

// =====================================================
// AREAS DE EVALUACION — tree structure for Tools
// =====================================================
export var EVAL_AREAS = [
  {
    id: "fonetico_fonologico",
    name: "Fonetico-Fonologico",
    icon: "🔊",
    color: "#7c3aed",
    desc: "Evaluacion de la produccion, percepcion y reconocimiento de los sonidos del habla.",
    tools: ["ofa", "fon", "rep", "disc", "reco"]
  },
  {
    id: "lenguaje_desarrollo",
    name: "Lenguaje y Desarrollo",
    icon: "🧒",
    color: "#0d9488",
    desc: "Evaluacion del desarrollo del lenguaje comprensivo y expresivo.",
    tools: ["eldi"]
  }
];
