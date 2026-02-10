/* HelpTip tooltip component and grouped coordination renderer */
import { useState } from "react";

export function HelpTip({text}){
  const[open,setOpen]=useState(false);
  if(!text)return null;
  return<span style={{position:"relative",display:"inline-flex",marginLeft:6,verticalAlign:"middle"}}>
    <button onClick={e=>{e.stopPropagation();setOpen(!open)}} style={{width:20,height:20,borderRadius:"50%",border:"1.5px solid #c4b5fd",background:open?"#7c3aed":"#ede9fe",color:open?"#fff":"#7c3aed",fontSize:11,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,lineHeight:1}}>?</button>
    {open&&<>
      <div onClick={()=>setOpen(false)} style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:98}}/>
      <div style={{position:"absolute",bottom:"calc(100% + 8px)",left:"50%",transform:"translateX(-50%)",background:"#1e1b4b",color:"#e0e7ff",padding:"12px 16px",borderRadius:10,fontSize:12,lineHeight:1.6,width:340,maxWidth:"85vw",zIndex:99,boxShadow:"0 8px 24px rgba(0,0,0,.3)",whiteSpace:"pre-line"}}>
        {text}
        <div style={{position:"absolute",bottom:-6,left:"50%",transform:"translateX(-50%)",width:12,height:12,background:"#1e1b4b",rotate:"45deg"}}/>
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
