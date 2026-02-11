import { useState, useCallback, useEffect, useRef } from "react";
import { PEFF_SECTIONS } from "../data/peffSections.js";
import { PF_CATEGORIES, ALL_PROCESSES } from "../data/peffProcesos.js";
import { HelpTip, renderGroupedCoord } from "./NewPEFF_helpers.jsx";
const K={mt:"#64748b"};
const gm=(b,e)=>{const B=new Date(b),E=new Date(e);let m=(E.getFullYear()-B.getFullYear())*12+E.getMonth()-B.getMonth();if(E.getDate()&lt;B.getDate())m--;return Math.max(0,m)};
const fa=m=>`${Math.floor(m/12)} a\u00f1os, ${m%12} meses`;

const sevDesc={
  "Adecuado":"PCC = 100%: El ni\u00f1o/a produce correctamente todos los fonemas evaluados. No se observan dificultades articulatorias.",
  "Leve":"PCC 85\u201399%: Se observan errores articulatorios aislados que no comprometen significativamente la inteligibilidad del habla. Puede requerir seguimiento.",
  "Leve-Moderado":"PCC 65\u201384%: Se observan errores articulatorios m\u00faltiples que afectan parcialmente la inteligibilidad. Se recomienda evaluaci\u00f3n e intervenci\u00f3n fonoaudiol\u00f3gica.",
  "Moderado-Severo":"PCC 50\u201364%: Se observan errores articulatorios frecuentes que comprometen la inteligibilidad del habla. Se requiere intervenci\u00f3n fonoaudiol\u00f3gica.",
  "Severo":"PCC &lt;50%: Se observan errores articulatorios generalizados que comprometen severamente la inteligibilidad. Se requiere intervenci\u00f3n fonoaudiol\u00f3gica intensiva."
};
