import { useState, useEffect } from "react";
import { db, collection, getDocs, doc, updateDoc, deleteDoc, increment } from "../firebase.js";
const K = { mt: "#64748b" };
async function fbGetAll(c) { const s = await getDocs(collection(db, c)); return s.docs.map(d => ({ _fbId: d.id, ...d.data() })); }

export default function Admin({ nfy }) {
  const [us, sUs] = useState([]);
  const [ld, sLd] = useState(true);
  const [busy, sBusy] = useState(false);
  const [creditAmounts, setCreditAmounts] = useState({});

  const load = async () => {
    sLd(true);
    try { const users = await fbGetAll("usuarios"); sUs(users.sort((a, b) => (a.username || "").localeCompare(b.username || ""))); }
    catch { nfy("Error cargando", "er"); }
    sLd(false);
  };

  useEffect(() => { load(); }, []);

  const modCredits = async (user, amount) => {
    if (!amount || isNaN(amount)) { nfy("Ingrese un número válido", "er"); return; }
    sBusy(true);
    try {
      await updateDoc(doc(db, "usuarios", user._fbId), { creditos: increment(Number(amount)) });
      nfy((amount > 0 ? "+" : "") + amount + " créditos a " + user.username, "ok");
      setCreditAmounts(p => ({ ...p, [user._fbId]: "" }));
      await load();
    } catch (e) { nfy("Error: " + e.message, "er"); }
    sBusy(false);
  };

  const delUser = async (user) => {
    if (user.role === "admin") { nfy("No se puede eliminar al admin", "er"); return; }
    if (!window.confirm("Eliminar a " + user.username + "? Sus evaluaciones se mantendrán.")) return;
    sBusy(true);
    try {
      await deleteDoc(doc(db, "usuarios", user._fbId));
      nfy(user.username + " eliminado", "ok");
      await load();
    } catch (e) { nfy("Error: " + e.message, "er"); }
    sBusy(false);
  };

  return (
    <div style={{ width: "100%", maxWidth: 800, animation: "fi .3s ease" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Administrar Usuarios</h1>
      <p style={{ color: K.mt, fontSize: 14, marginBottom: 22 }}>Gestión de accesos y créditos</p>
      <div style={{ background: "#fff", borderRadius: 12, padding: 22, border: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ fontSize: 15, fontWeight: 600 }}>Usuarios ({us.length})</h3>
          <button onClick={load} disabled={ld} style={{ background: "#f1f5f9", border: "none", padding: "6px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer" }}>🔄 Actualizar</button>
        </div>
        {ld ? <p style={{ color: K.mt }}>Cargando...</p> :
          us.map(u => (
            <div key={u._fbId} style={{ padding: "14px 0", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{u.username || u.email}</span>
                  {u.role === "admin" && <span style={{ fontSize: 10, background: "#ccfbf1", color: "#0d9488", padding: "2px 6px", borderRadius: 4, marginLeft: 8, fontWeight: 700 }}>ADMIN</span>}
                  <div style={{ fontSize: 12, color: K.mt, marginTop: 2 }}>
                    {u.nombre && (u.nombre + " " + u.apellido + " · ")}{u.email}{u.dni ? (" · DNI: " + u.dni) : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: u.role === "admin" ? "#0d9488" : (u.creditos || 0) > 0 ? "#059669" : "#dc2626" }}>
                    {u.role === "admin" ? "∞" : (u.creditos || 0)}
                  </div>
                  <div style={{ fontSize: 10, color: K.mt }}>créditos</div>
                </div>
              </div>
              {u.role !== "admin" && (
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  <input type="number" value={creditAmounts[u._fbId] || ""} placeholder="Cant." onChange={e => setCreditAmounts(p => ({ ...p, [u._fbId]: e.target.value }))} style={{ width: 70, padding: "6px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 13, textAlign: "center" }} />
                  <button onClick={() => modCredits(u, creditAmounts[u._fbId] || 0)} disabled={busy} style={{ background: "#059669", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ Agregar</button>
                  <button onClick={() => modCredits(u, -(creditAmounts[u._fbId] || 0))} disabled={busy} style={{ background: "#f59e0b", color: "#fff", border: "none", padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>- Quitar</button>
                  <button onClick={() => delUser(u)} disabled={busy} style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", padding: "6px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer", marginLeft: "auto" }}>🗑 Eliminar</button>
                </div>
              )}
            </div>
          ))}
      </div>
      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: 16, marginTop: 20, fontSize: 13, color: "#1e40af" }}>
        <strong>🔒 Seguridad:</strong> Los créditos se validan en las reglas de Firestore. Los usuarios no pueden modificar sus propios créditos.
      </div>
    </div>
  );
}
