import { K } from "../lib/fb.js";

export default function Tools({ onSel, credits }) {
  const noCredits = credits < 1;
  const tools = [
    { id: "newELDI", icon: "\ud83d\udccb", name: "ELDI", full: "Evaluaci\u00f3n del Lenguaje y Desarrollo Infantil", desc: "Comprensi\u00f3n auditiva y comunicaci\u00f3n expresiva (55+55 \u00edtems) de 0 a 7 a\u00f1os.", age: "0-7;11", time: "~30-45 min", color: "#0d9488" },
    { id: "newPEFF", icon: "\ud83d\udd0a", name: "PEFF", full: "Protocolo Fon\u00e9tico-Fonol\u00f3gico", desc: "OFA, diadococinesis, s\u00edlabas, discriminaci\u00f3n y reconocimiento fonol\u00f3gico.", age: "2;6-6;11", time: "~45-60 min", color: "#7c3aed" }
  ];
  return (
    <div style={{animation:"fi .3s ease",width:"100%"}}>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>{"\ud83e\uddf0 Herramientas"}</h1>
      <p style={{color:K.mt,fontSize:14,marginBottom:8}}>{"Seleccione evaluaci\u00f3n"}</p>
      {noCredits&&<div style={{background:"#fef3c7",border:"1px solid #fde68a",borderRadius:10,padding:14,marginBottom:16,fontSize:13,color:"#92400e",fontWeight:600}}>{"\u26a0 Sin cr\u00e9ditos disponibles. Actualice su plan para continuar."}</div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        {tools.map(t=><div key={t.id} style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden",opacity:noCredits?0.5:1}}>
          <div style={{background:`linear-gradient(135deg,${t.color},${t.color}aa)`,padding:"24px 24px 20px",color:"#fff"}}>
            <div style={{fontSize:36,marginBottom:8}}>{t.icon}</div><div style={{fontSize:22,fontWeight:700}}>{t.name}</div>
            <div style={{fontSize:12,opacity:.85,marginTop:2}}>{t.full}</div>
          </div>
          <div style={{padding:"20px 24px"}}>
            <p style={{fontSize:13,color:"#475569",lineHeight:1.6,marginBottom:16}}>{t.desc}</p>
            <div style={{display:"flex",gap:16,fontSize:12,color:K.mt}}><span>{"\ud83d\udc66\ud83d\udc67 "}{t.age}</span><span>{"\u23f1 "}{t.time}</span></div>
            <button onClick={()=>{if(!noCredits)onSel(t.id)}} disabled={noCredits} style={{marginTop:16,width:"100%",padding:"11px",background:noCredits?"#94a3b8":t.color,color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:noCredits?"not-allowed":"pointer"}}>{noCredits?"Sin cr\u00e9ditos":"Iniciar \u2192"}</button>
          </div>
        </div>)}
      </div>
    </div>
  );
}
