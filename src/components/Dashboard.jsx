import { K } from "../lib/fb.js";

export default function Dashboard({ es, pe, onT, onV, onVP, ld, profile, isAdmin }) {
  const all = [...es, ...pe].sort((a, b) => (b.fechaGuardado || "").localeCompare(a.fechaGuardado || ""));
  const rc = all.slice(0, 5);
  const cards = [
    { ic: "\ud83d\udccb", label: "Eval. ELDI", value: es.length },
    { ic: "\ud83d\udd0a", label: "Eval. PEFF", value: pe.length },
    { ic: "\ud83d\udc66\ud83d\udc67", label: "Pacientes", value: new Set([...es.map(e=>e.paciente),...pe.map(e=>e.paciente)]).size },
    { ic: "\ud83c\udf38", label: "Cr\u00e9ditos", value: isAdmin?"\u221e":(profile?.creditos||0) }
  ];
  return (
    <div style={{animation:"fi .3s ease",width:"100%"}}>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>{"\ud83e\udded Panel Principal"}</h1>
      <p style={{color:K.mt,fontSize:14,marginBottom:24}}>Bienvenido/a, {profile?.nombre || profile?.username}{ld?" \u2014 cargando...":""}</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:16,marginBottom:28}}>
        {cards.map((c,i)=>
          <div key={i} style={{background:"#fff",borderRadius:12,padding:22,border:"1px solid #e2e8f0"}}>
            <div style={{fontSize:28,marginBottom:6}}>{c.ic}</div>
            <div style={{fontSize:28,fontWeight:700}}>{c.value}</div>
            <div style={{fontSize:13,color:K.mt,marginTop:2}}>{c.label}</div>
          </div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <button onClick={onT} style={{background:"linear-gradient(135deg,#0a3d2f,#0d9488)",color:"#fff",border:"none",borderRadius:14,padding:"28px 24px",cursor:"pointer",display:"flex",alignItems:"center",gap:16,textAlign:"left"}}>
          <div style={{width:52,height:52,borderRadius:12,background:"rgba(255,255,255,.14)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>{"\ud83e\uddf0"}</div>
          <div><div style={{fontSize:18,fontWeight:700}}>Herramientas</div><div style={{fontSize:13,opacity:.8,marginTop:4}}>{"Nueva evaluaci\u00f3n"}</div></div>
        </button>
        <div style={{background:"#fff",borderRadius:14,padding:22,border:"1px solid #e2e8f0"}}>
          <h3 style={{fontSize:15,fontWeight:600,marginBottom:14}}>Recientes</h3>
          {rc.length===0?<p style={{color:K.mt,fontSize:13}}>{"Sin evaluaciones a\u00fan."}</p>:rc.map(ev=>{const isP=!!ev.seccionData;return(
            <div key={ev._fbId||ev.id} onClick={()=>isP?onVP(ev):onV(ev)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #e2e8f0",cursor:"pointer"}}>
              <div><div style={{fontWeight:600,fontSize:14}}>{ev.paciente}</div><div style={{fontSize:11,color:K.mt}}>{isP?"PEFF":"ELDI"} {"\u00b7"} {new Date(ev.fechaGuardado).toLocaleDateString("es-CL")}</div></div>
              <span style={{color:K.mt}}>{"\u2192"}</span>
            </div>)})}
        </div>
      </div>
    </div>
  );
}
