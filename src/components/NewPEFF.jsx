import { useState, useCallback, useEffect } from "react";
import { PEFF_SECTIONS } from "../data/peffSections.js";
import { PF_CATEGORIES, ALL_PROCESSES } from "../data/peffProcesos.js";
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
const sevColor={"Adecuado":"#059669","Leve":"#84cc16","Leve-Moderado":"#f59e0b","Moderado-Severo":"#ea580c","Severo":"#dc2626"};

const speak=(text)=>{
  if(!window.speechSynthesis)return;
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);
  u.lang="es-AR";u.rate=0.68;u.pitch=1.08;u.volume=1;
  const voices=window.speechSynthesis.getVoices();
  const pick=voices.find(v=>/es[-_]AR/i.test(v.lang)&amp;&amp;/female|Google|Microsoft/i.test(v.name))
    ||voices.find(v=>/es[-_]AR/i.test(v.lang))
    ||voices.find(v=>/es[-_]MX/i.test(v.lang)&amp;&amp;/female|Google|Microsoft/i.test(v.name))
    ||voices.find(v=>/es[-_]MX/i.test(v.lang))
    ||voices.find(v=>/es[-_]ES/i.test(v.lang)&amp;&amp;/female|Google|Microsoft/i.test(v.name))
    ||voices.find(v=>/es[-_]ES/i.test(v.lang))
    ||voices.find(v=>v.lang.startsWith("es"));
  if(pick)u.voice=pick;
  window.speechSynthesis.speak(u);
};

const scrollTop=()=>{const el=document.getElementById("main-scroll");if(el)el.scrollTo({top:0,behavior:"smooth"});else window.scrollTo({top:0,behavior:"smooth"});};

function HelpTip({text}){
  const[open,setOpen]=useState(false);
  if(!text)return null;
  return&lt;span style={{position:"relative",display:"inline-flex",marginLeft:6,verticalAlign:"middle"}}>
    &lt;button onClick={e=>{e.stopPropagation();setOpen(!open)}} style={{width:20,height:20,borderRadius:"50%",border:"1.5px solid #c4b5fd",background:open?"#7c3aed":"#ede9fe",color:open?"#fff":"#7c3aed",fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,lineHeight:1}}>?&lt;/button>
    {open&amp;&amp;&lt;>
      &lt;div onClick={()=>setOpen(false)} style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:98}}/>
      &lt;div style={{position:"absolute",bottom:"calc(100% + 8px)",left:"50%",transform:"translateX(-50%)",background:"#1e1b4b",color:"#e0e7ff",padding:"12px 16px",borderRadius:10,fontSize:12,lineHeight:1.6,width:340,maxWidth:"85vw",zIndex:99,boxShadow:"0 8px 24px rgba(0,0,0,.3)",whiteSpace:"pre-line"}}>
        {text}
        &lt;div style={{position:"absolute",bottom:-6,left:"50%",transform:"translateX(-50%)",width:12,height:12,background:"#1e1b4b",rotate:"45deg"}}/>
      &lt;/div>
    &lt;/>}
  &lt;/span>;
}
