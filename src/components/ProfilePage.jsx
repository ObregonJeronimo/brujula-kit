import { useState } from "react";
import { auth, sendPasswordResetEmail } from "../firebase.js";
import { K } from "../lib/fb.js";

export default function ProfilePage({ profile, authUser, nfy, onBuyCredits }) {
  const [resetSending, setResetSending] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const handlePasswordReset = async () => {
    setResetSending(true);
    try { await sendPasswordResetEmail(auth, authUser.email); setResetSent(true); nfy("Email de recuperación enviado", "ok"); } catch (e) { nfy("Error al enviar email: " + e.message, "er"); }
    setResetSending(false);
  };
  const isAdm = profile?.role === "admin";
  const credits = isAdm ? "\u221e" : (profile?.creditos || 0);
  const InfoRow = ({ label, value, icon }) => (
    <div style={{display:"flex",alignItems:"center",gap:14,padding:"16px 0",borderBottom:"1px solid #f1f5f9"}}>
      <div style={{width:40,height:40,borderRadius:10,background:"#f0f5f3",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{icon}</div>
      <div style={{flex:1}}>
        <div style={{fontSize:11,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".5px",marginBottom:2}}>{label}</div>
        <div style={{fontSize:15,fontWeight:500,color:"#1e293b"}}>{value}</div>
      </div>
    </div>
  );
  return (
    <div style={{animation:"fi .3s ease",width:"100%",maxWidth:600}}>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>{"👤 Mi Perfil"}</h1>
      <p style={{color:K.mt,fontSize:14,marginBottom:24}}>{"Información de tu cuenta"}</p>

      {/* Credits banner */}
      <div style={{background:"linear-gradient(135deg,#0a3d2f,#0d9488)",borderRadius:16,padding:"24px 28px",color:"#fff",marginBottom:24,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{fontSize:12,opacity:.7}}>{"Créditos restantes"}</div>
          <div style={{fontSize:32,fontWeight:700}}>{credits}</div>
        </div>
        {!isAdm && <button onClick={onBuyCredits} style={{background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",border:"none",padding:"12px 22px",borderRadius:12,fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:8,boxShadow:"0 4px 16px rgba(245,158,11,.35)",transition:"all .2s",letterSpacing:".3px"}}>
          {"+ Agregar créditos"}
        </button>}
      </div>

      <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:"8px 24px",marginBottom:20}}>
        <InfoRow icon={"📧"} label="Email" value={profile?.email || authUser?.email || "\u2014"} />
        <InfoRow icon={"👤"} label="Nombre de usuario" value={profile?.username || "\u2014"} />
        <InfoRow icon={"🪪"} label="DNI" value={profile?.dni || "\u2014"} />
        <InfoRow icon={"📝"} label="Nombre completo" value={profile?.nombre && profile?.apellido ? `${profile.nombre} ${profile.apellido}` : "\u2014"} />
        <InfoRow icon={"🌸"} label={"Créditos restantes"} value={isAdm ? "Ilimitados" : `${profile?.creditos || 0} evaluaciones`} />
        <div style={{display:"flex",alignItems:"center",gap:14,padding:"16px 0"}}>
          <div style={{width:40,height:40,borderRadius:10,background:"#f0f5f3",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{"📅"}</div>
          <div style={{flex:1}}><div style={{fontSize:11,fontWeight:600,color:"#94a3b8",textTransform:"uppercase",letterSpacing:".5px",marginBottom:2}}>Miembro desde</div><div style={{fontSize:15,fontWeight:500,color:"#1e293b"}}>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("es-AR",{year:"numeric",month:"long",day:"numeric"}) : "\u2014"}</div></div>
        </div>
      </div>
      <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:"20px 24px"}}>
        <div style={{fontSize:14,fontWeight:600,color:"#1e293b",marginBottom:4}}>Seguridad</div>
        <p style={{fontSize:13,color:"#94a3b8",marginBottom:14}}>{"Se enviará un enlace a tu email para establecer una nueva contraseña."}</p>
        <button onClick={handlePasswordReset} disabled={resetSending||resetSent} style={{padding:"10px 20px",background:resetSent?"#ecfdf5":"#f8faf9",border:resetSent?"1px solid #a7f3d0":"1px solid #e2e8f0",borderRadius:10,fontSize:13,fontWeight:600,cursor:resetSending?"wait":resetSent?"default":"pointer",color:resetSent?"#059669":"#1e293b",display:"flex",alignItems:"center",gap:8,transition:"all .2s"}}>
          {resetSent?"✓ Email enviado":(resetSending?"Enviando...":"🔒 Cambiar contraseña")}
        </button>
      </div>
    </div>
  );
}
