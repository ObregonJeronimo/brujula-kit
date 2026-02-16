export default function NoCreditsModal({ onClose, onUpgrade }) {
  return (
    <div style={{position:"fixed",inset:0,zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.5)",backdropFilter:"blur(4px)",animation:"fi .25s ease"}}>
      <div style={{background:"#fff",borderRadius:20,padding:"40px 36px",width:440,maxWidth:"92vw",boxShadow:"0 25px 60px rgba(0,0,0,.25)",textAlign:"center",position:"relative"}}>
        <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"none",border:"none",fontSize:20,color:"#94a3b8",cursor:"pointer",lineHeight:1}}>{"\u00d7"}</button>
        <div style={{width:72,height:72,borderRadius:"50%",background:"linear-gradient(135deg,#fef3c7,#fde68a)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",fontSize:36}}>{"\ud83d\udcb3"}</div>
        <h2 style={{fontSize:22,fontWeight:700,color:"#0a3d2f",marginBottom:8}}>{"Sin cr\u00e9ditos restantes"}</h2>
        <p style={{color:"#64748b",fontSize:14,lineHeight:1.7,marginBottom:8}}>{"Has utilizado todas las evaluaciones disponibles."}</p>
        <p style={{color:"#94a3b8",fontSize:13,lineHeight:1.6,marginBottom:28}}>{"Para continuar realizando evaluaciones profesionales, compr\u00e1 m\u00e1s cr\u00e9ditos."}</p>
        <button onClick={onUpgrade} style={{width:"100%",padding:"14px 24px",background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",border:"none",borderRadius:12,fontSize:16,fontWeight:800,cursor:"pointer",marginBottom:12,boxShadow:"0 4px 16px rgba(245,158,11,.3)",letterSpacing:".3px"}}>{"COMPRAR CR\u00c9DITOS \u2192"}</button>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#94a3b8",fontSize:13,cursor:"pointer",padding:8}}>Volver al panel</button>
      </div>
    </div>
  );
}
