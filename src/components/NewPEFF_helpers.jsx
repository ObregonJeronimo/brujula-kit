/* HelpTip tooltip component and grouped coordination renderer */
import { useState } from "react";

export function HelpTip({text, searchTerm}){
  const[open,setOpen]=useState(false);
  if(!text)return null;
  var googleUrl = searchTerm ? "https://www.google.com/search?q=" + encodeURIComponent(searchTerm + " fonoaudiología") : null;
  return<span style={{position:"relative",display:"inline-flex",marginLeft:6,verticalAlign:"middle"}}>
    <button onClick={function(e){e.preventDefault();e.stopPropagation();setOpen(!open)}} style={{width:20,height:20,borderRadius:"50%",border:"1.5px solid #c4b5fd",background:open?"#7c3aed":"#ede9fe",color:open?"#fff":"#7c3aed",fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,lineHeight:1}}>?</button>
    {open&&<>
      <div onMouseDown={function(){setOpen(false)}} style={{position:"fixed",top:0,left:0,width:"100vw",height:"100vh",zIndex:98,cursor:"default"}}/>
      <div style={{position:"absolute",bottom:"calc(100% + 8px)",left:"50%",transform:"translateX(-50%)",background:"#1e1b4b",color:"#e0e7ff",padding:"12px 16px",borderRadius:10,fontSize:12,lineHeight:1.6,width:340,maxWidth:"85vw",zIndex:99,boxShadow:"0 8px 24px rgba(0,0,0,.3)",whiteSpace:"pre-line"}}>
        {text}
        {googleUrl && <div style={{marginTop:8,paddingTop:6,borderTop:"1px solid rgba(255,255,255,.15)"}}><a href={googleUrl} target="_blank" rel="noopener noreferrer" style={{color:"#a5b4fc",fontSize:11,textDecoration:"none"}} onClick={function(e){e.stopPropagation()}}>{"Buscar en Google \u2192"}</a></div>}
        <div style={{position:"absolute",bottom:-6,left:"50%",transform:"translateX(-50%)",width:12,height:12,background:"#1e1b4b",rotate:"45deg"}}/>
      </div>
    </>}
  </span>;
}

// Small inline help for individual options
export function OptionHelpTip({text, label}){
  const[open,setOpen]=useState(false);
  if(!text)return null;
  var googleUrl = "https://www.google.com/search?q=" + encodeURIComponent(label + " odontología fonoaudiología");
  return<span style={{position:"relative",display:"inline-flex",marginLeft:4,verticalAlign:"middle"}}>
    <button onClick={function(e){e.preventDefault();e.stopPropagation();setOpen(!open)}} style={{width:16,height:16,borderRadius:"50%",border:"1px solid #d4d4d8",background:open?"#6366f1":"#f4f4f5",color:open?"#fff":"#a1a1aa",fontSize:9,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,lineHeight:1}}>?</button>
    {open&&<>
      <div onMouseDown={function(){setOpen(false)}} style={{position:"fixed",top:0,left:0,width:"100vw",height:"100vh",zIndex:98,cursor:"default"}}/>
      <div style={{position:"absolute",bottom:"calc(100% + 6px)",left:"50%",transform:"translateX(-50%)",background:"#1e1b4b",color:"#e0e7ff",padding:"10px 14px",borderRadius:8,fontSize:11,lineHeight:1.5,width:280,maxWidth:"80vw",zIndex:99,boxShadow:"0 6px 20px rgba(0,0,0,.3)"}}>
        {text}
        <div style={{marginTop:6,paddingTop:4,borderTop:"1px solid rgba(255,255,255,.15)"}}><a href={googleUrl} target="_blank" rel="noopener noreferrer" style={{color:"#a5b4fc",fontSize:10,textDecoration:"none"}} onClick={function(e){e.stopPropagation()}}>{"Buscar en Google \u2192"}</a></div>
        <div style={{position:"absolute",bottom:-5,left:"50%",transform:"translateX(-50%)",width:10,height:10,background:"#1e1b4b",rotate:"45deg"}}/>
      </div>
    </>}
  </span>;
}

export function renderGroupedCoord(fields, rField){
  const groups={};const ungrouped=[];
  fields.forEach(f=>{if(f.group){if(!groups[f.group])groups[f.group]=[];groups[f.group].push(f)}else ungrouped.push(f)});
  const groupOrder=[...new Set(fields.filter(f=>f.group).map(f=>f.group))];
  const labels={pa:"/pa-pa-pa/",ta:"/ta-ta-ta/",ka:"/ka-ka-ka/",ere:"/ere/",rra:"/rra/",vowel:"/a-u-e-o-i/",pataka:"/pa-ta-ka/"};
  return<>{groupOrder.map(gk=>{
    const gF=groups[gk];const velF=gF.find(f=>f.id.includes('_vel'));const coordF=gF.find(f=>f.id.includes('_coord'));
    if(!velF||!coordF)return gF.map(f=>rField(f));
    return<div key={gk} style={{background:"#f8faf9",borderRadius:10,padding:"14px 16px",marginBottom:10,border:"1px solid #e2e8f0"}}>
      <div style={{fontSize:14,fontWeight:700,color:"#7c3aed",marginBottom:10,display:"flex",alignItems:"center",gap:6}}>
        <span style={{fontFamily:"monospace",background:"#ede9fe",padding:"3px 12px",borderRadius:6,fontSize:15}}>{labels[gk]||gk}</span>
        <HelpTip text={velF.help}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <div>{rField({...velF,help:null},{hideHelp:true})}</div>
        <div>{rField({...coordF,help:null},{hideHelp:true})}</div>
      </div>
    </div>;
  })}{ungrouped.map(f=>rField(f))}</>;
}

// Teeth diagram component for dental section
export function TeethButton({arch}){
  const[show,setShow]=useState(false);
  var isUpper = arch === "upper";
  var title = isUpper ? "Arco Superior — Dentición Primaria" : "Arco Inferior — Dentición Primaria";
  var teeth = isUpper
    ? ["55","54","53","52","51","61","62","63","64","65"]
    : ["85","84","83","82","81","71","72","73","74","75"];
  var names = isUpper
    ? ["2°M","1°M","C","IL","IC","IC","IL","C","1°M","2°M"]
    : ["2°M","1°M","C","IL","IC","IC","IL","C","1°M","2°M"];
  return <>
    <button onClick={function(e){e.preventDefault();setShow(!show)}} style={{padding:"4px 10px",borderRadius:6,border:"1px solid #c4b5fd",background:show?"#7c3aed":"#ede9fe",color:show?"#fff":"#7c3aed",fontSize:10,fontWeight:600,cursor:"pointer",marginLeft:8}}>
      {show ? "Ocultar diagrama" : "Ver diagrama"}
    </button>
    {show && <div style={{marginTop:8,background:"#f8faf9",border:"1px solid #e2e8f0",borderRadius:10,padding:16}}>
      <div style={{fontSize:12,fontWeight:700,color:"#7c3aed",marginBottom:8,textAlign:"center"}}>{title}</div>
      <div style={{display:"flex",justifyContent:"center",gap:4}}>
        {teeth.map(function(t,i){return <div key={t} style={{textAlign:"center"}}>
          <div style={{width:30,height:28,borderRadius:6,background:"#fff",border:"1.5px solid #a78bfa",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#5b21b6"}}>{t}</div>
          <div style={{fontSize:8,color:"#64748b",marginTop:2}}>{names[i]}</div>
        </div>})}
      </div>
      <div style={{fontSize:10,color:"#64748b",marginTop:8,textAlign:"center"}}>{"IC=Incisivo Central, IL=Incisivo Lateral, C=Canino, 1°M=1er Molar, 2°M=2do Molar"}</div>
      <div style={{fontSize:10,color:"#7c3aed",marginTop:4,textAlign:"center"}}>{isUpper ? "Derecha del paciente (55-54-53-52-51) | Izquierda (61-62-63-64-65)" : "Derecha del paciente (85-84-83-82-81) | Izquierda (71-72-73-74-75)"}</div>
    </div>}
  </>;
}
