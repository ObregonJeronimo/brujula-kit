import { useState, useEffect } from "react";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut as signOutSecondary } from "firebase/auth";
import { db, doc, setDoc, getDocs, collection, query, where, updateDoc, deleteDoc } from "../firebase.js";

var I = { width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, background: "#f8faf9", fontFamily: "inherit" };
var K = { sd: "#0a3d2f", ac: "#0d9488", mt: "#64748b" };

var ROLES = [
  { id: "agent", label: "Agente de Soporte", desc: "Tomar casos, responder y cerrar temporales" },
  { id: "agent_senior", label: "Agente Senior", desc: "Todo lo anterior + escalar, transferir, cambiar urgencia" }
];

// Create a secondary Firebase app instance for creating users
// This prevents the admin from being signed out when creating agent accounts
var secondaryApp = null;
function getSecondaryAuth() {
  if (!secondaryApp) {
    var config = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
    secondaryApp = initializeApp(config, "SecondaryApp");
  }
  return getAuth(secondaryApp);
}

export default function AgentManager({ nfy }) {
  var _agents = useState([]), agents = _agents[0], setAgents = _agents[1];
  var _loading = useState(true), loading = _loading[0], setLoading = _loading[1];
  var _showForm = useState(false), showForm = _showForm[0], setShowForm = _showForm[1];
  var _creating = useState(false), creating = _creating[0], setCreating = _creating[1];
  var _form = useState({ nombre: "", email: "", password: "", role: "agent" }), form = _form[0], setForm = _form[1];
  var _editingId = useState(null), editingId = _editingId[0], setEditingId = _editingId[1];
  var _editRole = useState(""), editRole = _editRole[0], setEditRole = _editRole[1];

  var loadAgents = function() {
    setLoading(true);
    var q = query(collection(db, "usuarios"), where("role", "in", ["agent", "agent_senior"]));
    getDocs(q).then(function(snap) {
      var arr = snap.docs.map(function(d) { return Object.assign({ _id: d.id }, d.data()); });
      arr.sort(function(a, b) { return (a.nombre || "").localeCompare(b.nombre || ""); });
      setAgents(arr);
    }).catch(function(e) { console.error("Error loading agents:", e); }).finally(function() { setLoading(false); });
  };

  useEffect(function() { loadAgents(); }, []);

  var handleCreate = async function() {
    if (!form.nombre.trim() || !form.email.trim() || !form.password.trim()) {
      nfy("Completa todos los campos", "er");
      return;
    }
    if (form.password.length < 6) {
      nfy("La contrasena debe tener al menos 6 caracteres", "er");
      return;
    }
    setCreating(true);
    try {
      var secondaryAuth = getSecondaryAuth();
      var cred = await createUserWithEmailAndPassword(secondaryAuth, form.email.trim(), form.password);
      var uid = cred.user.uid;

      // Sign out from secondary app immediately
      await signOutSecondary(secondaryAuth);

      // Create profile in Firestore
      await setDoc(doc(db, "usuarios", uid), {
        email: form.email.trim(),
        nombre: form.nombre.trim(),
        username: form.nombre.trim(),
        role: form.role,
        profileComplete: true,
        authProvider: "email",
        creditos: 0,
        createdAt: new Date().toISOString()
      });

      nfy("Agente " + form.nombre.trim() + " creado", "ok");
      setForm({ nombre: "", email: "", password: "", role: "agent" });
      setShowForm(false);
      loadAgents();
    } catch (e) {
      if (e.code === "auth/email-already-in-use") {
        nfy("Ya existe una cuenta con ese email", "er");
      } else if (e.code === "auth/invalid-email") {
        nfy("Email invalido", "er");
      } else {
        nfy("Error: " + e.message, "er");
      }
    }
    setCreating(false);
  };

  var handleUpdateRole = async function(agent) {
    try {
      await updateDoc(doc(db, "usuarios", agent._id), { role: editRole });
      nfy("Rol actualizado a " + (editRole === "agent_senior" ? "Agente Senior" : "Agente de Soporte"), "ok");
      setEditingId(null);
      loadAgents();
    } catch (e) {
      nfy("Error: " + e.message, "er");
    }
  };

  var handleDelete = async function(agent) {
    if (!window.confirm("Eliminar al agente " + (agent.nombre || agent.email) + "?\n\nEl usuario no podra acceder al sistema. Esta accion no elimina la cuenta de autenticacion, solo el perfil.")) return;
    try {
      await deleteDoc(doc(db, "usuarios", agent._id));
      nfy("Agente eliminado", "ok");
      loadAgents();
    } catch (e) {
      nfy("Error: " + e.message, "er");
    }
  };

  var roleLabel = function(r) {
    if (r === "agent_senior") return "Agente Senior";
    return "Agente de Soporte";
  };

  var roleBadge = function(r) {
    if (r === "agent_senior") return { color: "#7c3aed", bg: "#f5f3ff" };
    return { color: "#0d9488", bg: "#f0fdfa" };
  };

  return <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
      <p style={{ fontSize: 13, color: K.mt, margin: 0 }}>{"Crea y gestiona las cuentas de agentes de soporte."}</p>
      {!showForm && <button onClick={function() { setShowForm(true); }} style={{ padding: "10px 20px", background: K.ac, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>+ Nuevo agente</button>}
    </div>

    {/* Create form */}
    {showForm && <div style={{ padding: 20, background: "#f8faf9", borderRadius: 12, border: "1px solid #e2e8f0", marginBottom: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: K.sd, marginBottom: 14 }}>Crear nuevo agente</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ gridColumn: "1/-1" }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: K.mt, display: "block", marginBottom: 4 }}>Nombre completo</label>
          <input value={form.nombre} onChange={function(e) { setForm(function(p) { return Object.assign({}, p, { nombre: e.target.value }); }); }} style={I} placeholder="Ej: Juan Perez" />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: K.mt, display: "block", marginBottom: 4 }}>Email</label>
          <input type="email" value={form.email} onChange={function(e) { setForm(function(p) { return Object.assign({}, p, { email: e.target.value }); }); }} style={I} placeholder="agente@ejemplo.com" />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: K.mt, display: "block", marginBottom: 4 }}>Contrasena temporal</label>
          <input type="text" value={form.password} onChange={function(e) { setForm(function(p) { return Object.assign({}, p, { password: e.target.value }); }); }} style={I} placeholder="Minimo 6 caracteres" />
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: K.mt, display: "block", marginBottom: 8 }}>Rol</label>
          <div style={{ display: "flex", gap: 10 }}>
            {ROLES.map(function(r) {
              var selected = form.role === r.id;
              return <button key={r.id} onClick={function() { setForm(function(p) { return Object.assign({}, p, { role: r.id }); }); }} style={{
                flex: 1, padding: "12px 14px", background: selected ? "#f0fdfa" : "#fff",
                border: selected ? "2px solid #0d9488" : "1px solid #e2e8f0",
                borderRadius: 10, cursor: "pointer", textAlign: "left"
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: selected ? K.sd : "#475569" }}>{r.label}</div>
                <div style={{ fontSize: 11, color: K.mt, marginTop: 2 }}>{r.desc}</div>
              </button>;
            })}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
        <button onClick={function() { setShowForm(false); setForm({ nombre: "", email: "", password: "", role: "agent" }); }} style={{ padding: "10px 20px", background: "#f1f5f9", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", color: K.mt }}>Cancelar</button>
        <button onClick={handleCreate} disabled={creating} style={{ padding: "10px 24px", background: K.ac, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: creating ? "wait" : "pointer", opacity: creating ? .7 : 1 }}>
          {creating ? "Creando..." : "Crear agente"}
        </button>
      </div>
    </div>}

    {/* Agents list */}
    {loading ? <div style={{ textAlign: "center", padding: 40, color: K.mt, fontSize: 13 }}>Cargando agentes...</div> :
      agents.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: K.mt, fontSize: 13, fontStyle: "italic" }}>No hay agentes registrados</div> :
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {agents.map(function(agent) {
          var rb = roleBadge(agent.role);
          var isEditing = editingId === agent._id;
          return <div key={agent._id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #0a3d2f, #0d9488)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
              {(agent.nombre || "?")[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: K.sd }}>{agent.nombre || "Sin nombre"}</span>
                {!isEditing && <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, color: rb.color, background: rb.bg }}>{roleLabel(agent.role)}</span>}
              </div>
              <div style={{ fontSize: 12, color: K.mt }}>{agent.email}</div>
              {agent.createdAt && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>{"Creado: " + new Date(agent.createdAt).toLocaleDateString("es-AR")}</div>}
            </div>
            {isEditing ? <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <select value={editRole} onChange={function(e) { setEditRole(e.target.value); }} style={{ padding: "6px 10px", border: "1px solid #e2e8f0", borderRadius: 6, fontSize: 12, background: "#fff" }}>
                <option value="agent">Agente de Soporte</option>
                <option value="agent_senior">Agente Senior</option>
              </select>
              <button onClick={function() { handleUpdateRole(agent); }} style={{ padding: "6px 14px", background: K.ac, color: "#fff", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Guardar</button>
              <button onClick={function() { setEditingId(null); }} style={{ padding: "6px 14px", background: "#f1f5f9", border: "none", borderRadius: 6, fontSize: 11, cursor: "pointer", color: K.mt }}>Cancelar</button>
            </div> : <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button onClick={function() { setEditingId(agent._id); setEditRole(agent.role); }} style={{ padding: "6px 14px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", color: "#0369a1" }}>Editar rol</button>
              <button onClick={function() { handleDelete(agent); }} style={{ padding: "6px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", color: "#dc2626" }}>Eliminar</button>
            </div>}
          </div>;
        })}
      </div>}
  </div>;
}
