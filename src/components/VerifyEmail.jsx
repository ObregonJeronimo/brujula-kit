import { useState } from "react";
import { sendEmailVerification } from "../firebase.js";
import "../styles/VerifyEmail.css";

export default function VerifyEmailScreen({ user, onLogout, themeColor }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const resend = async () => { setSending(true); try { await sendEmailVerification(user); setSent(true); } catch(e){} setSending(false); };
  return (
    <div className="vem-screen" style={themeColor ? {"--vem-bg": themeColor} : undefined}>
      <div className="vem-card">
        <div className="vem-icon">{"\ud83d\udce7"}</div>
        <h2 className="vem-title">Verifique su email</h2>
        <p className="vem-desc">{"Enviamos un enlace de verificaci\u00f3n a "}<b className="vem-email">{user.email}</b>{". Haga clic en el enlace y vuelva aqu\u00ed."}</p>
        <p className="vem-spam-hint">{"Revise tambi\u00e9n su carpeta de spam."}</p>
        <div className="vem-actions">
          <button onClick={()=>window.location.reload()} className="vem-btn-verified">{"Ya verifiqu\u00e9 \u2192"}</button>
          <button onClick={resend} disabled={sending||sent} className="vem-btn-resend">{sent?"\u2713 Reenviado":sending?"Enviando...":"Reenviar email"}</button>
        </div>
        <button onClick={onLogout} className="vem-btn-logout">{"Cerrar sesi\u00f3n"}</button>
      </div>
    </div>
  );
}
