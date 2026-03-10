import { useState } from "react";
var K = { mt: "#64748b" };
var fa = function(m){ return Math.floor(m/12)+" años, "+(m%12)+" meses"; };

export default function Hist({ allEvals, onView, isA, onD }) {
  var _q = useState(""), q = _q[0], sQ = _q[1];
  var _tab = useState("all"), tab = _tab[0], sTab = _tab[1];
  var _cf = useState(null), cf = _cf[0], sC = _cf[1];

  // Filter out ELDI (hidden) and sort
  var all = (allEvals || []).filter(function(e){ return e.tipo && e.tipo !== "eldi"; })
    .sort(function(a, b){ return (b.fechaGuardado || "").localeCompare(a.fechaGuardado || ""); });

  var f = all.filter(function(e){
    if(q && !(e.paciente || "").toLowerCase().includes(q.toLowerCase())) return false;
    if(tab !== "all" && e.tipo !== tab) return false;
    return true;
  });

  var typeStyle = function(tipo){
    if(tipo==="reco") return { b:"#f3e8ff", c:"#9333ea", l:"RECO" };
    if(tipo==="disc") return { b:"#fef3c7", c:"#d97706", l:"DISC" };
    if(tipo==="rep") return { b:"#dbeafe", c:"#2563eb", l:"REP" };
    return { b:"#ede9fe", c:"#7c3aed", l:"PEFF" };
  };

  return (
    <div style={{width:"100%",animation:"fi .3s ease"}}>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>Historial</h1>
      <p style={{color:K.mt,fontSize:14,marginBottom:14}}>{all.length+" evaluaciones"}</p>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        {[["all","Todas"],["peff","PEFF"],["rep","Rep.Palabras"],["disc","Disc.Fonol."],["reco","Reco.Fonol."]].map(function(x){
          var id=x[0], lb=x[1];
          return <button key={id} onClick={function(){sTab(id)}} style={{padding:"6px 14px",borderRadius:6,border:tab===id?"2px solid #0d9488":"1px solid #e2e8f0",background:tab===id?"#ccfbf1":"#fff",color:tab===id?"#0d9488":"#64748b",fontSize:13,fontWeight:600,cursor:"pointer"}}>{lb}</button>;
        })}
      </div>
      <input value={q} onChange={function(e){sQ(e.target.value)}} placeholder="Buscar paciente..." style={{width:"100%",maxWidth:400,padding:"10px 14px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,marginBottom:18,background:"#fff"}} />
      {f.length === 0 ? <div style={{background:"#fff",borderRadius:12,padding:40,textAlign:"center",border:"1px solid #e2e8f0",color:K.mt}}>Sin resultados.</div> :
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {f.map(function(ev){
            var bg = typeStyle(ev.tipo);
            return (
              <div key={ev._fbId||ev.id} style={{background:"#fff",borderRadius:10,padding:"14px 20px",border:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div onClick={function(){if(onView)onView(ev)}} style={{cursor:"pointer",flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{padding:"2px 8px",borderRadius:4,background:bg.b,color:bg.c,fontSize:10,fontWeight:700}}>{bg.l}</span>
                    <span style={{fontWeight:600,fontSize:15}}>{ev.paciente}</span>
                  </div>
                  <div style={{fontSize:12,color:K.mt,marginTop:2}}>
                    {new Date(ev.fechaGuardado).toLocaleDateString("es-CL")+" · "+fa(ev.edadMeses)}{ev.evaluador?(" · "+ev.evaluador):""}
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  {ev.resultados && <span style={{padding:"3px 10px",borderRadius:14,background:bg.b,color:bg.c,fontSize:12,fontWeight:600}}>{ev.resultados.severity||(ev.resultados.pct+"%")}</span>}
                  {isA && (cf === (ev._fbId||ev.id) ?
                    <div style={{display:"flex",gap:4}}>
                      <button onClick={function(){onD(ev._fbId); sC(null);}} style={{background:"#dc2626",color:"#fff",border:"none",padding:"5px 10px",borderRadius:5,fontSize:11,cursor:"pointer",fontWeight:600}}>¿Sí?</button>
                      <button onClick={function(){sC(null)}} style={{background:"#f1f5f9",border:"none",padding:"5px 10px",borderRadius:5,fontSize:11,cursor:"pointer"}}>No</button>
                    </div> :
                    <button onClick={function(){sC(ev._fbId||ev.id)}} style={{background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",padding:"5px 10px",borderRadius:6,cursor:"pointer",fontSize:11}}>🗑</button>)}
                  <span onClick={function(){if(onView)onView(ev)}} style={{color:"#94a3b8",cursor:"pointer"}}>→</span>
                </div>
              </div>);
          })}
        </div>}
    </div>
  );
}
