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

// Teeth diagram component for dental section — adapts to patient age
// ageMo: age in months. <72m (6y) = primary, 72-143m (6-11y) = mixed, >=144m (12y+) = permanent
var DENTITION = {
  primary: {
    upper: { teeth:["55","54","53","52","51","61","62","63","64","65"], names:["2\u00b0M","1\u00b0M","C","IL","IC","IC","IL","C","1\u00b0M","2\u00b0M"], shapes:["M","M","C","I","I","I","I","C","M","M"] },
    lower: { teeth:["85","84","83","82","81","71","72","73","74","75"], names:["2\u00b0M","1\u00b0M","C","IL","IC","IC","IL","C","1\u00b0M","2\u00b0M"], shapes:["M","M","C","I","I","I","I","C","M","M"] },
    label: "Primaria (20 piezas)", total: 10,
    legend: "IC=Incisivo Central  IL=Incisivo Lateral  C=Canino  1\u00b0M=1er Molar  2\u00b0M=2do Molar"
  },
  permanent: {
    upper: { teeth:["18","17","16","15","14","13","12","11","21","22","23","24","25","26","27","28"], names:["3\u00b0M","2\u00b0M","1\u00b0M","2\u00b0PM","1\u00b0PM","C","IL","IC","IC","IL","C","1\u00b0PM","2\u00b0PM","1\u00b0M","2\u00b0M","3\u00b0M"], shapes:["M","M","M","P","P","C","I","I","I","I","C","P","P","M","M","M"] },
    lower: { teeth:["48","47","46","45","44","43","42","41","31","32","33","34","35","36","37","38"], names:["3\u00b0M","2\u00b0M","1\u00b0M","2\u00b0PM","1\u00b0PM","C","IL","IC","IC","IL","C","1\u00b0PM","2\u00b0PM","1\u00b0M","2\u00b0M","3\u00b0M"], shapes:["M","M","M","P","P","C","I","I","I","I","C","P","P","M","M","M"] },
    label: "Permanente (32 piezas)", total: 16,
    legend: "IC=Incisivo Central  IL=Lateral  C=Canino  PM=Premolar  M=Molar"
  }
};

// SVG tooth shape paths (centered at 0,0 — scale with transform)
var TOOTH_SVG = {
  // Incisivo: rectangular redondeado, raíz simple
  I: function(x, y, w, h, isUpper){
    var rh = h * 0.45; // root height
    var ch = h * 0.55; // crown height
    var ry = isUpper ? y + rh : y;
    var rootY = isUpper ? y : y + ch;
    var rootDir = isUpper ? -1 : 1;
    return '<rect x="'+(x+w*0.1)+'" y="'+ry+'" width="'+(w*0.8)+'" height="'+ch+'" rx="'+(w*0.15)+'" fill="#fff" stroke="#8b5cf6" stroke-width="1.2"/>' +
      '<line x1="'+(x+w*0.5)+'" y1="'+rootY+'" x2="'+(x+w*0.5)+'" y2="'+(rootY+rh*rootDir)+'" stroke="#a78bfa" stroke-width="1.5" stroke-linecap="round"/>';
  },
  // Canino: más puntiagudo
  C: function(x, y, w, h, isUpper){
    var rh = h * 0.45; var ch = h * 0.55;
    var ry = isUpper ? y + rh : y;
    var rootY = isUpper ? y : y + ch;
    var rootDir = isUpper ? -1 : 1;
    var tipY = isUpper ? ry + ch : ry;
    var baseY = isUpper ? ry : ry + ch;
    return '<path d="M'+(x+w*0.1)+' '+baseY+' L'+(x+w*0.5)+' '+tipY+' L'+(x+w*0.9)+' '+baseY+' Z" fill="#fff" stroke="#8b5cf6" stroke-width="1.2" stroke-linejoin="round"/>' +
      '<line x1="'+(x+w*0.5)+'" y1="'+rootY+'" x2="'+(x+w*0.5)+'" y2="'+(rootY+rh*rootDir*1.1)+'" stroke="#a78bfa" stroke-width="1.5" stroke-linecap="round"/>';
  },
  // Premolar: cuadrado con dos cúspides
  P: function(x, y, w, h, isUpper){
    var rh = h * 0.4; var ch = h * 0.6;
    var ry = isUpper ? y + rh : y;
    var rootY = isUpper ? y : y + ch;
    var rootDir = isUpper ? -1 : 1;
    return '<rect x="'+(x+w*0.05)+'" y="'+ry+'" width="'+(w*0.9)+'" height="'+ch+'" rx="'+(w*0.12)+'" fill="#fff" stroke="#8b5cf6" stroke-width="1.2"/>' +
      '<line x1="'+(x+w*0.5)+'" y1="'+(ry+(isUpper?0:ch*0.3))+'" x2="'+(x+w*0.5)+'" y2="'+(ry+(isUpper?ch*0.7:ch))+'" stroke="#ddd6fe" stroke-width="0.5"/>' +
      '<line x1="'+(x+w*0.35)+'" y1="'+rootY+'" x2="'+(x+w*0.35)+'" y2="'+(rootY+rh*rootDir*0.8)+'" stroke="#a78bfa" stroke-width="1.2" stroke-linecap="round"/>' +
      '<line x1="'+(x+w*0.65)+'" y1="'+rootY+'" x2="'+(x+w*0.65)+'" y2="'+(rootY+rh*rootDir*0.8)+'" stroke="#a78bfa" stroke-width="1.2" stroke-linecap="round"/>';
  },
  // Molar: ancho con 2-3 raíces
  M: function(x, y, w, h, isUpper){
    var rh = h * 0.38; var ch = h * 0.62;
    var ry = isUpper ? y + rh : y;
    var rootY = isUpper ? y : y + ch;
    var rootDir = isUpper ? -1 : 1;
    return '<rect x="'+x+'" y="'+ry+'" width="'+w+'" height="'+ch+'" rx="'+(w*0.15)+'" fill="#fff" stroke="#8b5cf6" stroke-width="1.2"/>' +
      '<line x1="'+(x+w*0.33)+'" y1="'+(ry+(isUpper?0:ch*0.3))+'" x2="'+(x+w*0.33)+'" y2="'+(ry+(isUpper?ch*0.7:ch))+'" stroke="#ddd6fe" stroke-width="0.5"/>' +
      '<line x1="'+(x+w*0.66)+'" y1="'+(ry+(isUpper?0:ch*0.3))+'" x2="'+(x+w*0.66)+'" y2="'+(ry+(isUpper?ch*0.7:ch))+'" stroke="#ddd6fe" stroke-width="0.5"/>' +
      '<line x1="'+(x+w*0.25)+'" y1="'+rootY+'" x2="'+(x+w*0.2)+'" y2="'+(rootY+rh*rootDir)+'" stroke="#a78bfa" stroke-width="1.2" stroke-linecap="round"/>' +
      '<line x1="'+(x+w*0.5)+'" y1="'+rootY+'" x2="'+(x+w*0.5)+'" y2="'+(rootY+rh*rootDir*0.7)+'" stroke="#a78bfa" stroke-width="1" stroke-linecap="round"/>' +
      '<line x1="'+(x+w*0.75)+'" y1="'+rootY+'" x2="'+(x+w*0.8)+'" y2="'+(rootY+rh*rootDir)+'" stroke="#a78bfa" stroke-width="1.2" stroke-linecap="round"/>';
  }
};

function TeethSVG({archData, isUpper, isPerm}){
  var count = archData.teeth.length;
  var tw = isPerm ? 22 : 30;  // tooth width
  var gap = isPerm ? 2 : 3;
  var midGap = 8;
  var totalW = count * tw + (count - 1) * gap + midGap;
  var th = 48; // tooth height
  var svgH = th + 20; // extra for labels
  var svgW = totalW + 10;
  var startX = 5;

  var paths = "";
  var labels = "";
  archData.teeth.forEach(function(t, i){
    var isMiddle = (i === count / 2);
    var xOff = startX + i * (tw + gap) + (i >= count / 2 ? midGap : 0);
    var shape = archData.shapes[i];
    var drawFn = TOOTH_SVG[shape] || TOOTH_SVG.I;
    paths += drawFn(xOff, isUpper ? 0 : 12, tw, th, isUpper);
    // Number label
    var lblY = isUpper ? th + 12 : 10;
    labels += '<text x="'+(xOff + tw/2)+'" y="'+lblY+'" text-anchor="middle" font-size="'+(isPerm?7:8)+'" font-weight="700" fill="#5b21b6" font-family="system-ui,sans-serif">'+t+'</text>';
    // Name label
    var nameY = isUpper ? th + 20 : 2;
    if(!isUpper) nameY = 4;
    // Put name below number for upper, skip for lower (too crowded)
  });

  return {__html: '<svg viewBox="0 0 '+svgW+' '+(svgH)+'" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:'+(svgW*1.2)+'px;height:auto">' + paths + labels + '</svg>'};
}

export function TeethButton({arch, ageMo}){
  var age = typeof ageMo === "number" ? ageMo : 0;
  var isMixed = age >= 72 && age < 144;
  var showPermanent = age >= 72;
  var defaultTab = showPermanent ? "perm" : "prim";
  const[show,setShow]=useState(false);
  const[tab,setTab]=useState(defaultTab);
  var isUpper = arch === "upper";
  var dent = tab === "perm" ? DENTITION.permanent : DENTITION.primary;
  var archData = isUpper ? dent.upper : dent.lower;
  var isPerm = tab === "perm";
  var dentLabel = isMixed ? "Mixta" : (showPermanent ? "Permanente" : "Primaria");
  var title = (isUpper ? "Arco Superior" : "Arco Inferior") + " \u2014 Dentici\u00f3n " + (tab === "perm" ? "Permanente" : "Primaria");
  var sideNote = isUpper
    ? (isPerm ? "Der. paciente (18-11) | Izq. (21-28)" : "Der. paciente (55-51) | Izq. (61-65)")
    : (isPerm ? "Der. paciente (48-41) | Izq. (31-38)" : "Der. paciente (85-81) | Izq. (71-75)");

  var svgData = TeethSVG({archData: archData, isUpper: isUpper, isPerm: isPerm});

  return <>
    <button onClick={function(e){e.preventDefault();setShow(!show)}} style={{padding:"4px 10px",borderRadius:6,border:"1px solid #c4b5fd",background:show?"#7c3aed":"#ede9fe",color:show?"#fff":"#7c3aed",fontSize:10,fontWeight:600,cursor:"pointer",marginLeft:8}}>
      {show ? "Ocultar diagrama" : "\ud83e\uddb7 Ver diagrama dental"}
    </button>
    {show && <div style={{marginTop:8,background:"#f8faf9",border:"1px solid #e2e8f0",borderRadius:10,padding:16}}>
      {/* Age indicator */}
      {age > 0 && <div style={{fontSize:10,color:"#64748b",textAlign:"center",marginBottom:6}}>
        {"Edad: " + Math.floor(age/12) + "a " + (age%12) + "m \u2014 Dentici\u00f3n esperada: " + dentLabel}
      </div>}
      {/* Tabs to switch between primary and permanent */}
      <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:10}}>
        <button onClick={function(e){e.preventDefault();setTab("prim")}} style={{padding:"5px 14px",borderRadius:6,border:tab==="prim"?"2px solid #7c3aed":"1px solid #e2e8f0",background:tab==="prim"?"#ede9fe":"#fff",color:tab==="prim"?"#5b21b6":"#64748b",fontSize:10,fontWeight:600,cursor:"pointer"}}>{"Primaria (decidua)"}</button>
        <button onClick={function(e){e.preventDefault();setTab("perm")}} style={{padding:"5px 14px",borderRadius:6,border:tab==="perm"?"2px solid #7c3aed":"1px solid #e2e8f0",background:tab==="perm"?"#ede9fe":"#fff",color:tab==="perm"?"#5b21b6":"#64748b",fontSize:10,fontWeight:600,cursor:"pointer"}}>{"Permanente"}</button>
      </div>
      <div style={{fontSize:12,fontWeight:700,color:"#7c3aed",marginBottom:6,textAlign:"center"}}>{title}</div>
      {/* Visual SVG teeth */}
      <div style={{display:"flex",justifyContent:"center",overflow:"auto",padding:"4px 0"}} dangerouslySetInnerHTML={svgData} />
      {/* Names row */}
      <div style={{display:"flex",justifyContent:"center",gap:isPerm?2:3,marginTop:4,flexWrap:"wrap"}}>
        {archData.teeth.map(function(t,i){
          var isMiddleLast = (i === archData.teeth.length/2 - 1);
          return <div key={t} style={{width:isPerm?22:30,textAlign:"center",marginRight:isMiddleLast?8:0}}>
            <div style={{fontSize:isPerm?6:7,color:"#64748b",lineHeight:1.1}}>{archData.names[i]}</div>
          </div>;
        })}
      </div>
      <div style={{fontSize:8,color:"#64748b",marginTop:6,textAlign:"center"}}>{dent.legend}</div>
      <div style={{fontSize:8,color:"#7c3aed",marginTop:2,textAlign:"center"}}>{sideNote}</div>
      {isMixed && <div style={{fontSize:9,color:"#d97706",marginTop:6,textAlign:"center",background:"#fffbeb",padding:"4px 8px",borderRadius:6,border:"1px solid #fde68a"}}>
        {"Dentici\u00f3n mixta: el paciente puede tener piezas deciduas y permanentes coexistiendo."}
      </div>}
    </div>}
  </>;
}
