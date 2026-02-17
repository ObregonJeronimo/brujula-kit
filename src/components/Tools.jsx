import { K } from "../lib/fb.js";

export default function Tools({ onSel, credits, onBuy }) {
  const noCredits = credits < 1;
  const tools = [
    { id: "newELDI", icon: "\ud83d\udccb", name: "ELDI", full: "Evaluaci\u00f3n del Lenguaje y Desarrollo Infantil", desc: "Comprensi\u00f3n auditiva y comunicaci\u00f3n expresiva (55+55 \u00edtems) de 0 a 7 a\u00f1os.", age: "0-7;11", time: "~30-45 min", color: "#0d9488" },
    { id: "newPEFF", icon: "\ud83d\udd0a", name: "PEFF", full: "Protocolo Fon\u00e9tico-Fonol\u00f3gico", desc: "OFA, diadococinesis, s\u00edlabas, discriminaci\u00f3n y reconocimiento fonol\u00f3gico.", age: "2;6-6;11", time: "~45-60 min", color: "#7c3aed" },
    { id: "newREP", icon: "\ud83d\udcdd", name: "Rep. Palabras", full: "Repetici\u00f3n de Palabras (PEFF 3.2)", desc: "An\u00e1lisis fon\u00e9tico-fonol\u00f3gico: oclusivas, fricativas, nasales, vibrantes, grupos y diptongos.", age: "3-5+", time: "~20-30 min", color: "#2563eb" },
    { id: "newDISC", icon: "\ud83d\udc42", name: "Disc. Fonol\u00f3gica", full: "Discriminaci\u00f3n Fonol\u00f3gica (PEFF-R 3.4)", desc: "Evaluaci\u00f3n de la capacidad para discriminar auditivamente fonemas mediante 14 pares de palabras.", age: "3-6+", time: "~10-15 min", color: "#d97706" }
  ];
  return (
    <div style={{animation:"fi .3s ease",width:"100%"}}>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>{"\ud83e\uddf0 Herramientas"}</h1>
      <p style={{color:K.mt,fontSize:14,marginBottom:8}}>{"Seleccione evaluaci\u00f3n"}</p>
      {noCredits&&<div style={{background:"linear-gradient(135deg,#fef3c7,#fde68a)",border:"1px solid #f59e0b",borderRadius:12,padding:"18px 20px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:"#92400e"}}>{"\u26a0 Sin cr\u00e9ditos restantes"}</div>
          <div style={{fontSize:12,color:"#a16207",marginTop:2}}>{"Necesit\u00e1s cr\u00e9ditos para realizar evaluaciones"}</div>
        </div>
        <button onClick={onBuy} style={{padding:"10px 24px",background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 12px rgba(245,158,11,.3)",letterSpacing:".3px",whiteSpace:"nowrap"}}>{"COMPRAR CR\u00c9DITOS \u2192"}</button>
      </div>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        {tools.map(t=><div key={t.id} style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden",opacity:noCredits?0.5:1,transition:"opacity .2s"}}>
          <div style={{background:`linear-gradient(135deg,${t.color},${t.color}aa)`,padding:"24px 24px 20px",color:"#fff"}}>
            <div style={{fontSize:36,marginBottom:8}}>{t.icon}</div><div style={{fontSize:22,fontWeight:700}}>{t.name}</div>
            <div style={{fontSize:12,opacity:.85,marginTop:2}}>{t.full}</div>
          </div>
          <div style={{padding:"20px 24px"}}>
            <p style={{fontSize:13,color:"#475569",lineHeight:1.6,marginBottom:16}}>{t.desc}</p>
            <div style={{display:"flex",gap:16,fontSize:12,color:K.mt}}><span>{"\ud83d\udc66\ud83d\udc67 "}{t.age}</span><span>{"\u23f1 "}{t.time}</span></div>
            {noCredits
              ? <button onClick={onBuy} style={{marginTop:16,width:"100%",padding:"11px",background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:700,cursor:"pointer",letterSpacing:".2px"}}>{"COMPRAR CR\u00c9DITOS"}</button>
              : <button onClick={()=>onSel(t.id)} style={{marginTop:16,width:"100%",padding:"11px",background:t.color,color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{"Iniciar \u2192"}</button>}
          </div>
        </div>)}
      </div>
    </div>
  );
}
