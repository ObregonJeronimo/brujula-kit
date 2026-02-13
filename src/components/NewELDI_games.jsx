// NewELDI — Interactive mini-games (SequenceGame, ShapesGame)
import { useState } from "react";

export function SequenceGame(){
  var imgs = [
    {id:1,label:"Corre hacia la pelota",emoji:"\ud83c\udfc3\u200d\u2642\ufe0f\u27a1\ufe0f\u26bd"},
    {id:2,label:"Patea la pelota",emoji:"\ud83e\uddb5\u26bd"},
    {id:3,label:"La pelota vuela",emoji:"\u26bd\ud83d\udca8"}
  ];
  var _o = useState([3,1,2]), order = _o[0], setOrder = _o[1];
  var _d = useState(null), dragging = _d[0], setDragging = _d[1];
  var correct = order[0]===1 && order[1]===2 && order[2]===3;
  var swap = function(from,to){ var n=[].concat(order); var t=n[from]; n[from]=n[to]; n[to]=t; setOrder(n); };
  return <div style={{padding:16,background:"#f8faf9",borderRadius:10,border:"1px solid #e2e8f0"}}>
    <div style={{fontSize:13,fontWeight:600,color:"#0a3d2f",marginBottom:10}}>{"Orden\u00e1 las im\u00e1genes en secuencia correcta:"}</div>
    <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
      {order.map(function(imgId,idx){
        var img = imgs.find(function(i){ return i.id===imgId; });
        return <div key={idx} draggable onDragStart={function(){setDragging(idx)}} onDragOver={function(e){e.preventDefault()}}
          onDrop={function(){if(dragging!==null){swap(dragging,idx);setDragging(null)}}}
          style={{width:120,padding:12,background:"#fff",border:"2px solid "+(correct?"#059669":"#e2e8f0"),borderRadius:10,textAlign:"center",cursor:"grab",userSelect:"none"}}>
          <div style={{fontSize:32}}>{img.emoji}</div>
          <div style={{fontSize:11,color:"#475569",marginTop:4}}>{img.label}</div>
          <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{"Paso "+(idx+1)}</div>
        </div>;
      })}
    </div>
    {correct && <div style={{marginTop:10,textAlign:"center",color:"#059669",fontWeight:700,fontSize:13}}>{"Orden correcto!"}</div>}
    {!correct && <div style={{marginTop:8,textAlign:"center",fontSize:11,color:"#94a3b8"}}>{"Arrastr\u00e1 y solt\u00e1 para reordenar"}</div>}
  </div>;
}

export function ShapesGame(){
  var shapes = [
    {id:"circle",filled:"\ud83d\udd34",empty:"\u2b55",label:"C\u00edrculo"},
    {id:"square",filled:"\ud83d\udfe6",empty:"\u2b1c",label:"Cuadrado"},
    {id:"triangle",filled:"\ud83d\udd3a",empty:"\u25b3",label:"Tri\u00e1ngulo"}
  ];
  var _m = useState({}), matched = _m[0], setMatched = _m[1];
  var _ds = useState(null), draggingShape = _ds[0], setDraggingShape = _ds[1];
  var allDone = Object.keys(matched).length===3 && Object.entries(matched).every(function(e){ return e[0]===e[1]; });
  return <div style={{padding:16,background:"#f8faf9",borderRadius:10,border:"1px solid #e2e8f0"}}>
    <div style={{fontSize:13,fontWeight:600,color:"#0a3d2f",marginBottom:10}}>{"Arrastr\u00e1 cada forma a su lugar:"}</div>
    <div style={{display:"flex",gap:24,justifyContent:"center",flexWrap:"wrap"}}>
      <div>
        <div style={{fontSize:11,color:"#94a3b8",marginBottom:6,textAlign:"center"}}>Formas</div>
        {shapes.filter(function(s){ return !Object.values(matched).includes(s.id); }).map(function(s){
          return <div key={s.id} draggable onDragStart={function(){setDraggingShape(s.id)}}
            style={{padding:"8px 16px",margin:4,background:"#fff",border:"1px solid #e2e8f0",borderRadius:8,cursor:"grab",textAlign:"center",fontSize:24,userSelect:"none"}}>
            {s.filled} <span style={{fontSize:11}}>{s.label}</span>
          </div>;
        })}
      </div>
      <div>
        <div style={{fontSize:11,color:"#94a3b8",marginBottom:6,textAlign:"center"}}>Espacios</div>
        {shapes.map(function(s){
          return <div key={s.id} onDragOver={function(e){e.preventDefault()}}
            onDrop={function(){if(draggingShape){setMatched(function(p){var n=Object.assign({},p);n[s.id]=draggingShape;return n});setDraggingShape(null)}}}
            style={{padding:"8px 16px",margin:4,background:matched[s.id]===s.id?"#ecfdf5":matched[s.id]?"#fef2f2":"#f1f5f9",border:"2px dashed "+(matched[s.id]===s.id?"#059669":matched[s.id]?"#dc2626":"#cbd5e1"),borderRadius:8,textAlign:"center",fontSize:24,minWidth:100}}>
            {matched[s.id] ? shapes.find(function(x){return x.id===matched[s.id]}).filled : s.empty}
            <span style={{fontSize:11,display:"block",color:"#94a3b8"}}>{s.label}</span>
          </div>;
        })}
      </div>
    </div>
    {allDone && <div style={{marginTop:10,textAlign:"center",color:"#059669",fontWeight:700,fontSize:13}}>{"Todas en su lugar!"}</div>}
    {Object.keys(matched).length>0 && !allDone && <button onClick={function(){setMatched({})}} style={{display:"block",margin:"8px auto 0",background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:6,padding:"4px 12px",fontSize:11,cursor:"pointer"}}>Reiniciar</button>}
  </div>;
}
