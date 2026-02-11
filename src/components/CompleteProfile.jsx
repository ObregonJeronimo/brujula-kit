import { useState, useEffect } from "react";
import { db, doc, setDoc } from "../firebase.js";
import { fbGetAll, getUserProfile, generateUsername, ADMIN_EMAIL } from "../lib/fb.js";

export default function CompleteProfileScreen({ uid, email, onDone }) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [dni, setDni] = useState("");
  const [ld, setLd] = useState(false);
  const [err, setErr] = useState("");
  const [genUser, setGenUser] = useState("");
  const I = { width: "100%", padding: "12px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, background: "#f8faf9" };
  useEffect(() => { (async () => { const existing = await getUserProfile(uid); if (existing && existing.profileComplete) onDone(existing); })(); }, [uid]);
  const handleSubmit = async (ev) => {
    ev.preventDefault(); setLd(true); setErr("");
    if (!nombre.trim() || !apellido.trim() || !dni.trim()) { setErr("Complete todos los campos."); setLd(false); return; }
    const allUsers = await fbGetAll("usuarios");
    const dniDup = allUsers.find(u => u.dni === dni.trim());
    if (dniDup) { setErr("Ya existe una cuenta registrada con ese DNI. Si es tu cuenta, inici\u00e1 sesi\u00f3n con tu email."); setLd(false); return; }
    try {
      const isAdminUser = email === ADMIN_EMAIL;
      let username = isAdminUser ? "CalaAdmin976" : await generateUsername(nombre.trim(), apellido.trim());
      const profileData = { uid, email, nombre: nombre.trim(), apellido: apellido.trim(), dni: dni.trim(), username, creditos: 5, plan: "Plan Demo", role: isAdminUser ? "admin" : "user", profileComplete: true, createdAt: new Date().toISOString() };
      await setDoc(doc(db, "usuarios", uid), profileData);
      setGenUser(username);
      setTimeout(() => onDone(profileData), 2500);
    } catch (e) { setErr("Error: " + e.message); }
    setLd(false);
  };
  if (genUser) return (
    <div style={{width:"100vw",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(145deg,#0a3d2f,#0d7363)",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <div style={{background:"rgba(255,255,255,.97)",borderRadius:16,padding:"44px 36px",width:420,maxWidth:"92vw",textAlign:"center",boxShadow:"0 20px 50px rgba(0,0,0,.3)"}}>
        <div style={{fontSize:48,marginBottom:16}}>{"\u2705"}</div>
        <h2 style={{fontSize:20,fontWeight:700,color:"#0a3d2f",marginBottom:10}}>Cuenta creada</h2>
        <p style={{color:"#64748b",fontSize:14,marginBottom:20}}>Su nombre de usuario es:</p>
        <div style={{background:"#ccfbf1",borderRadius:10,padding:"16px 24px",fontSize:24,fontWeight:700,color:"#0d9488",marginBottom:16}}>{genUser}</div>
        <p style={{color:"#94a3b8",fontSize:12}}>{"Tiene 5 cr\u00e9ditos de prueba (Plan Demo). Ingresando..."}</p>
      </div>
    </div>
  );
  return (
    <div style={{width:"100vw",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(145deg,#0a3d2f,#0d7363)",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
      <div style={{background:"rgba(255,255,255,.97)",borderRadius:16,padding:"44px 36px",width:420,maxWidth:"92vw",boxShadow:"0 20px 50px rgba(0,0,0,.3)"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{fontSize:40,marginBottom:8}}>{"\ud83d\udcdd"}</div>
          <h2 style={{fontSize:20,fontWeight:700,color:"#0a3d2f"}}>Complete su perfil</h2>
          <p style={{color:"#64748b",fontSize:13,marginTop:4}}>{email}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom:14}}><label style={{fontSize:12,fontWeight:600,color:"#64748b",display:"block",marginBottom:5}}>Nombre</label><input value={nombre} onChange={e=>setNombre(e.target.value)} style={I} placeholder="Nombre del profesional" required/></div>
          <div style={{marginBottom:14}}><label style={{fontSize:12,fontWeight:600,color:"#64748b",display:"block",marginBottom:5}}>Apellido</label><input value={apellido} onChange={e=>setApellido(e.target.value)} style={I} placeholder="Apellido" required/></div>
          <div style={{marginBottom:22}}><label style={{fontSize:12,fontWeight:600,color:"#64748b",display:"block",marginBottom:5}}>DNI</label><input value={dni} onChange={e=>setDni(e.target.value)} style={I} placeholder={"N\u00famero de documento"} required/></div>
          {err&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626",padding:"10px 12px",borderRadius:8,fontSize:12,marginBottom:14}}>{err}</div>}
          <button type="submit" disabled={ld} style={{width:"100%",padding:"13px",background:"#0d9488",color:"#fff",border:"none",borderRadius:8,fontSize:15,fontWeight:600,cursor:ld?"wait":"pointer",opacity:ld?.7:1}}>{ld?"Creando perfil...":"Completar registro"}</button>
        </form>
      </div>
    </div>
  );
}
