import { useState } from "react";
import { sendEmailVerification } from "../firebase.js";

export default function VerifyEmailScreen({ user, onLogout }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const resend = async () => { setSending(true); try { await sendEmailVerification(user); setSent(true); } catch(e){} setSending(false); };
  return (
    <div style={{width:"100vw",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(145deg,#0a3d2f,#0d7363)",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <div style={{background:"rgba(255,255,255,.97)",borderRadius:16,padding:"44px 36px",width:420,maxWidth:"92vw",boxShadow:"0 20px 50px rgba(0,0,0,.3)",textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>{"\ud83d\udce7"}</div>
        <h2 style={{fontSize:20,fontWeight:700,color:"#0a3d2f",marginBottom:10}}>Verifique su email</h2>
        <p style={{color:"#64748b",fontSize:14,lineHeight:1.6,marginBottom:20}}>{"Enviamos un enlace de verificaci\u00f3n a "}<b style={{color:"#0d9488"}}>{user.email}</b>{". Haga clic en el enlace y vuelva aqu\u00ed."}</p>
        <p style={{color:"#94a3b8",fontSize:12,marginBottom:20}}>{"Revise tambi\u00e9n su carpeta de spam."}</p>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={()=>window.location.reload()} style={{background:"#0d9488",color:"#fff",border:"none",padding:"12px 24px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{"Ya verifiqu\u00e9 \u2192"}</button>
          <button onClick={resend} disabled={sending||sent} style={{background:"#f1f5f9",border:"none",padding:"12px 24px",borderRadius:8,fontSize:14,cursor:sending?"wait":"pointer",color:"#64748b"}}>{sent?"\u2713 Reenviado":sending?"Enviando...":"Reenviar email"}</button>
        </div>
        <button onClick={onLogout} style={{marginTop:20,background:"none",border:"none",color:"#94a3b8",fontSize:12,cursor:"pointer",textDecoration:"underline"}}>{"Cerrar sesi\u00f3n"}</button>
      </div>
    </div>
  );
}
