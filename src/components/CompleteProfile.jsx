import { useState, useEffect } from "react";
import { db, doc, setDoc } from "../firebase.js";
import { fbGetAll, getUserProfile, generateUsername, ADMIN_EMAIL } from "../lib/fb.js";
import "../styles/CompleteProfile.css";

export default function CompleteProfileScreen({ uid, email, onDone, themeColor }) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [dni, setDni] = useState("");
  const [ld, setLd] = useState(false);
  const [err, setErr] = useState("");
  const [genUser, setGenUser] = useState("");
  const [existingProvider, setExistingProvider] = useState(null);
  const screenStyle = themeColor ? {"--cps-bg": themeColor} : undefined;
  useEffect(() => { (async () => {
    const existing = await getUserProfile(uid);
    if (existing && existing.profileComplete) { onDone(existing); return; }
    // Pre-fill from existing partial profile (Google users get nombre/apellido)
    if (existing) {
      if (existing.nombre) setNombre(existing.nombre);
      if (existing.apellido) setApellido(existing.apellido);
      if (existing.authProvider) setExistingProvider(existing.authProvider);
    }
  })(); }, [uid]);
  const handleSubmit = async (ev) => {
    ev.preventDefault(); setLd(true); setErr("");
    if (!nombre.trim() || !apellido.trim() || !dni.trim()) { setErr("Complete todos los campos."); setLd(false); return; }
    const allUsers = await fbGetAll("usuarios");
    const dniDup = allUsers.find(u => u.dni === dni.trim());
    if (dniDup) { setErr("Ya existe una cuenta registrada con ese DNI. Si es tu cuenta, inici\u00e1 sesi\u00f3n con tu email."); setLd(false); return; }
    try {
      const isAdminUser = email === ADMIN_EMAIL;
      let username = isAdminUser ? "CalaAdmin976" : await generateUsername(nombre.trim(), apellido.trim());
      const profileData = { uid, email, nombre: nombre.trim(), apellido: apellido.trim(), dni: dni.trim(), username, creditos: 5, plan: "Plan Demo", role: isAdminUser ? "admin" : "user", profileComplete: true, authProvider: existingProvider || "email", createdAt: new Date().toISOString() };
      await setDoc(doc(db, "usuarios", uid), profileData);
      setGenUser(username);
      setTimeout(() => onDone(profileData), 2500);
    } catch (e) { setErr("Error: " + e.message); }
    setLd(false);
  };
  if (genUser) return (
    <div className="cps-screen" style={screenStyle}>
      <div className="cps-card cps-card--center">
        <div className="cps-icon">{"\u2705"}</div>
        <h2 className="cps-title">Cuenta creada</h2>
        <p className="cps-success-desc">Su nombre de usuario es:</p>
        <div className="cps-username">{genUser}</div>
        <p className="cps-success-hint">{"Tiene 5 cr\u00e9ditos de prueba (Plan Demo). Ingresando..."}</p>
      </div>
    </div>
  );
  return (
    <div className="cps-screen" style={screenStyle}>
      <div className="cps-card">
        <div className="cps-header">
          <div className="cps-header-icon">{"\ud83d\udcdd"}</div>
          <h2 className="cps-header-title">Complete su perfil</h2>
          <p className="cps-header-email">{email}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="cps-field"><label className="cps-label">Nombre</label><input value={nombre} onChange={e=>setNombre(e.target.value)} className="cps-input" placeholder="Nombre del profesional" required/></div>
          <div className="cps-field"><label className="cps-label">Apellido</label><input value={apellido} onChange={e=>setApellido(e.target.value)} className="cps-input" placeholder="Apellido" required/></div>
          <div className="cps-field cps-field--last"><label className="cps-label">DNI</label><input value={dni} onChange={e=>setDni(e.target.value)} className="cps-input" placeholder={"N\u00famero de documento"} required/></div>
          {err&&<div className="cps-error">{err}</div>}
          <button type="submit" disabled={ld} className="cps-submit">{ld?"Creando perfil...":"Completar registro"}</button>
        </form>
      </div>
    </div>
  );
}
