import { useState } from "react";
import { db, collection, getDocs, query, where, updateDoc, doc, increment } from "../firebase.js";

const K = { mt: "#64748b", ac: "#0d9488" };

export default function Admin({ nfy }) {
  const [search, setSearch] = useState("");
  const [foundUser, setFoundUser] = useState(null);
  const [searching, setSearching] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [amount, setAmount] = useState(5);

  const doSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    setFoundUser(null);
    setNotFound(false);
    try {
      const q = query(collection(db, "usuarios"), where("username", "==", search.trim().toLowerCase()));
      const snap = await getDocs(q);
      if (snap.empty) {
        setNotFound(true);
      } else {
        const d = snap.docs[0];
        setFoundUser({ _fbId: d.id, ...d.data() });
      }
    } catch (e) {
      nfy("Error: " + e.message, "er");
    }
    setSearching(false);
  };

  const addCredits = async () => {
    if (!foundUser) return;
    const qty = Math.min(Math.max(1, parseInt(amount) || 0), 20);
    if (qty < 1) { nfy("Cantidad inv\u00e1lida", "er"); return; }
    try {
      await updateDoc(doc(db, "usuarios", foundUser._fbId), { creditos: increment(qty) });
      setFoundUser(p => ({ ...p, creditos: (p.creditos || 0) + qty }));
      nfy("+" + qty + " cr\u00e9ditos agregados a " + foundUser.username, "ok");
    } catch (e) {
      nfy("Error: " + e.message, "er");
    }
  };

  const I = { padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, background: "#f8faf9" };

  return (
    <div style={{ animation: "fi .3s ease", width: "100%", maxWidth: 600 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{"\u2699\ufe0f Administraci\u00f3n de Usuarios"}</h1>
      <p style={{ color: K.mt, fontSize: 14, marginBottom: 24 }}>{"Busque un usuario por su nombre de usuario para gestionar cr\u00e9ditos."}</p>

      <div style={{ background: "#fff", borderRadius: 12, padding: 24, border: "1px solid #e2e8f0", marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{"\ud83d\udd0d Buscar usuario"}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") doSearch(); }}
            style={{ ...I, flex: 1 }}
            placeholder="Nombre de usuario (ej: jobregon)"
          />
          <button onClick={doSearch} disabled={searching} style={{ background: K.ac, color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: searching ? "wait" : "pointer" }}>
            {searching ? "Buscando..." : "Buscar"}
          </button>
        </div>

        {notFound && (
          <div style={{ marginTop: 14, padding: 14, background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 8, fontSize: 13, color: "#92400e" }}>
            {"\u26a0 No se encontr\u00f3 ning\u00fan usuario con ese nombre de usuario."}
          </div>
        )}

        {foundUser && (
          <div style={{ marginTop: 18 }}>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: 18, marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0a3d2f", marginBottom: 10 }}>
                {foundUser.username}
                {foundUser.role === "admin" && <span style={{ background: "#0d9488", color: "#fff", padding: "2px 8px", borderRadius: 4, fontSize: 10, marginLeft: 8, fontWeight: 700 }}>ADMIN</span>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13, color: "#475569" }}>
                <div><span style={{ color: K.mt }}>Nombre: </span><strong>{foundUser.nombre} {foundUser.apellido}</strong></div>
                <div><span style={{ color: K.mt }}>Email: </span>{foundUser.email}</div>
                <div><span style={{ color: K.mt }}>DNI: </span>{foundUser.dni}</div>
                <div>
                  <span style={{ color: K.mt }}>{"Cr\u00e9ditos: "}</span>
                  <strong style={{ color: foundUser.role === "admin" ? K.ac : (foundUser.creditos || 0) > 0 ? "#059669" : "#dc2626", fontSize: 16 }}>
                    {foundUser.role === "admin" ? "\u221e" : (foundUser.creditos || 0)}
                  </strong>
                </div>
              </div>
            </div>

            {foundUser.role !== "admin" && (
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: 18 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{"\ud83d\udcb3 Agregar cr\u00e9ditos"}</div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    style={{ ...I, width: 100, textAlign: "center" }}
                  />
                  <span style={{ fontSize: 12, color: K.mt }}>{"(m\u00e1ximo 20)"}</span>
                  <button onClick={addCredits} style={{ background: "#059669", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                    {"+ Agregar cr\u00e9ditos"}
                  </button>
                </div>
              </div>
            )}

            {foundUser.role === "admin" && (
              <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: 14, fontSize: 13, color: "#0369a1" }}>
                {"Los administradores tienen cr\u00e9ditos ilimitados."}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ background: "#f8faf9", borderRadius: 10, padding: 16, border: "1px solid #e2e8f0", fontSize: 12, color: K.mt }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>{"\ud83d\udd12 Seguridad"}</div>
        <p>{"Las reglas de Firestore impiden que usuarios no administradores modifiquen cr\u00e9ditos o roles. La seguridad real est\u00e1 en el servidor, no en el c\u00f3digo del navegador."}</p>
      </div>
    </div>
  );
}
