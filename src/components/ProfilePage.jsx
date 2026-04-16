import { useState } from "react";
import { auth, sendPasswordResetEmail } from "../firebase.js";
import "../styles/ProfilePage.css";

export default function ProfilePage({ TC, profile, authUser, nfy, onBuyCredits }) {
  const [resetSending, setResetSending] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const handlePasswordReset = async () => {
    setResetSending(true);
    try { await sendPasswordResetEmail(auth, authUser.email); setResetSent(true); nfy("Email de recuperacion enviado", "ok"); } catch (e) { nfy("Error: " + e.message, "er"); }
    setResetSending(false);
  };
  const isAdm = profile?.role === "admin";
  const credits = isAdm ? "\u221e" : (profile?.creditos || 0);
  const InfoRow = ({ label, value, icon }) => (
    <div className="profile-row">
      <div className="profile-row-icon">{icon}</div>
      <div className="profile-row-content">
        <div className="profile-row-label">{label}</div>
        <div className="profile-row-value">{value}</div>
      </div>
    </div>
  );
  return (
    <div className="profile-page">
      <h1 className="profile-title">{"\ud83d\udc64 Mi Perfil"}</h1>
      <p className="profile-subtitle">{"Informaci\u00f3n de tu cuenta"}</p>

      <div className="profile-credits-banner">
        <div className="profile-credits-info">
          <div className="profile-credits-label">{"Cr\u00e9ditos restantes"}</div>
          <div className="profile-credits-value">{credits}</div>
        </div>
        {!isAdm && <button onClick={onBuyCredits} className="profile-buy-btn">
          {"+ Agregar cr\u00e9ditos"}
        </button>}
      </div>

      <div className="profile-card">
        <InfoRow icon={"\ud83d\udce7"} label="Email" value={profile?.email || authUser?.email || "\u2014"} />
        <InfoRow icon={"\ud83d\udc64"} label="Nombre de usuario" value={profile?.username || "\u2014"} />
        <InfoRow icon={"\ud83e\udeaa"} label="DNI" value={profile?.dni || "\u2014"} />
        <InfoRow icon={"\ud83d\udcdd"} label="Nombre completo" value={profile?.nombre && profile?.apellido ? profile.nombre + " " + profile.apellido : "\u2014"} />
        <InfoRow icon={"\ud83c\udf38"} label="Cr\u00e9ditos restantes" value={isAdm ? "Ilimitados" : (profile?.creditos || 0) + " evaluaciones"} />
        <InfoRow icon={"\ud83d\udcc5"} label="Miembro desde" value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString("es-AR",{year:"numeric",month:"long",day:"numeric"}) : "\u2014"} />
      </div>

      {profile?.authProvider !== "google" && <div className="profile-security">
        <div className="profile-security-title">Seguridad</div>
        <p className="profile-security-desc">{"Se enviar\u00e1 un enlace a tu email para establecer una nueva contrase\u00f1a."}</p>
        <button onClick={handlePasswordReset} disabled={resetSending||resetSent} className={"profile-reset-btn"+(resetSent?" profile-reset-btn--sent":"")}>
          {resetSent?"Email enviado":(resetSending?"Enviando...":"Cambiar contrase\u00f1a")}
        </button>
      </div>}
    </div>
  );
}
