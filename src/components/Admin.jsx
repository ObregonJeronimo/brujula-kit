import { useState, useEffect, useCallback } from "react";
import { db, collection, getDocs, updateDoc, deleteDoc, doc, increment, query, where } from "../firebase.js";
import { K } from "../lib/fb.js";

export default function Admin({ nfy }) {
  var _users = useState([]), users = _users[0], setUsers = _users[1];
  var _ld = useState(true), loading = _ld[0], setLoading = _ld[1];
  var _filter = useState(""), filter = _filter[0], setFilter = _filter[1];
  var _sel = useState(null), selUser = _sel[0], setSelUser = _sel[1];
  var _amount = useState(5), amount = _amount[0], setAmount = _amount[1];
  var _tab = useState("list"), tab = _tab[0], setTab = _tab[1];
  var _confirm = useState(null), confirmAction = _confirm[0], setConfirmAction = _confirm[1];
  var _editForm = useState(null), editForm = _editForm[0], setEditForm = _editForm[1];
  var _busy = useState(false), busy = _busy[0], setBusy = _busy[1];

  var load = useCallback(function(){
    setLoading(true);
    getDocs(collection(db, "usuarios")).then(function(snap){
      setUsers(snap.docs.map(function(d){ return Object.assign({ _fbId: d.id }, d.data()); }));
    }).catch(function(e){ nfy("Error: " + e.message, "er"); }).finally(function(){ setLoading(false); });
  }, [nfy]);

  useEffect(function(){ load(); }, [load]);

  var nonAdmin = users.filter(function(u){ return u.role !== "admin"; });
  var filtered = filter.trim() ? nonAdmin.filter(function(u){
    var q = filter.trim().toLowerCase();
    return (u.username||"").toLowerCase().indexOf(q) >= 0 ||
           (u.nombre||"").toLowerCase().indexOf(q) >= 0 ||
           (u.apellido||"").toLowerCase().indexOf(q) >= 0 ||
           (u.email||"").toLowerCase().indexOf(q) >= 0;
  }) : nonAdmin;

  var addCredits = function(){
    if(!selUser) return;
    var qty = Math.min(Math.max(1, parseInt(amount) || 0), 100);
    if(qty < 1){ nfy("Cantidad inválida", "er"); return; }
    updateDoc(doc(db, "usuarios", selUser._fbId), { creditos: increment(qty) }).then(function(){
      setSelUser(function(p){ return Object.assign({}, p, { creditos: (p.creditos || 0) + qty }); });
      setUsers(function(prev){ return prev.map(function(u){ return u._fbId === selUser._fbId ? Object.assign({}, u, { creditos: (u.creditos || 0) + qty }) : u; }); });
      nfy("+" + qty + " créditos agregados", "ok");
    }).catch(function(e){ nfy("Error: " + e.message, "er"); });
  };

  var removeCredits = function(){
    if(!selUser) return;
    var qty = Math.min(Math.max(1, parseInt(amount) || 0), selUser.creditos || 0);
    if(qty < 1){ nfy("No hay créditos para quitar", "er"); return; }
    updateDoc(doc(db, "usuarios", selUser._fbId), { creditos: increment(-qty) }).then(function(){
      setSelUser(function(p){ return Object.assign({}, p, { creditos: Math.max(0, (p.creditos || 0) - qty) }); });
      setUsers(function(prev){ return prev.map(function(u){ return u._fbId === selUser._fbId ? Object.assign({}, u, { creditos: Math.max(0, (u.creditos || 0) - qty) }) : u; }); });
      nfy("-" + qty + " créditos", "ok");
    }).catch(function(e){ nfy("Error: " + e.message, "er"); });
  };

  // Delete all evals for a specific user
  var deleteUserEvals = function(uid){
    setBusy(true);
    var q2 = query(collection(db, "evaluaciones"), where("userId", "==", uid));
    getDocs(q2).then(function(snap){
      var batch = [];
      snap.docs.forEach(function(d){ batch.push(deleteDoc(doc(db, "evaluaciones", d.id))); });
      return Promise.all(batch);
    }).then(function(results){
      nfy("Se eliminaron " + results.length + " evaluaciones", "ok");
      setConfirmAction(null); setBusy(false);
    }).catch(function(e){ nfy("Error: " + e.message, "er"); setBusy(false); });
  };

  // Delete ALL evals from ALL users
  var deleteAllEvals = function(){
    setBusy(true);
    getDocs(collection(db, "evaluaciones")).then(function(snap){
      var batch = [];
      snap.docs.forEach(function(d){ batch.push(deleteDoc(doc(db, "evaluaciones", d.id))); });
      return Promise.all(batch);
    }).then(function(results){
      nfy("Se eliminaron " + results.length + " evaluaciones de todos los usuarios", "ok");
      setConfirmAction(null); setBusy(false);
    }).catch(function(e){ nfy("Error: " + e.message, "er"); setBusy(false); });
  };

  // Delete a user's document from Firestore (not Firebase Auth — that needs admin SDK)
  var deleteUserDoc = function(uid){
    setBusy(true);
    // First delete their evals
    var q2 = query(collection(db, "evaluaciones"), where("userId", "==", uid));
    getDocs(q2).then(function(snap){
      var batch = [];
      snap.docs.forEach(function(d){ batch.push(deleteDoc(doc(db, "evaluaciones", d.id))); });
      return Promise.all(batch);
    }).then(function(){
      // Delete pacientes
      var q3 = query(collection(db, "pacientes"), where("userId", "==", uid));
      return getDocs(q3);
    }).then(function(snap){
      var batch = [];
      snap.docs.forEach(function(d){ batch.push(deleteDoc(doc(db, "pacientes", d.id))); });
      return Promise.all(batch);
    }).then(function(){
      // Delete user doc
      return deleteDoc(doc(db, "usuarios", uid));
    }).then(function(){
      nfy("Usuario eliminado completamente", "ok");
      setUsers(function(prev){ return prev.filter(function(u){ return u._fbId !== uid; }); });
      setSelUser(null); setConfirmAction(null); setBusy(false);
    }).catch(function(e){ nfy("Error: " + e.message, "er"); setBusy(false); });
  };

  // Save edited user info
  var saveEdit = function(){
    if(!editForm || !selUser) return;
    setBusy(true);
    var updates = { nombre: editForm.nombre, apellido: editForm.apellido, dni: editForm.dni };
    updateDoc(doc(db, "usuarios", selUser._fbId), updates).then(function(){
      setSelUser(function(p){ return Object.assign({}, p, updates); });
      setUsers(function(prev){ return prev.map(function(u){ return u._fbId === selUser._fbId ? Object.assign({}, u, updates) : u; }); });
      setEditForm(null); setBusy(false);
      nfy("Datos actualizados", "ok");
    }).catch(function(e){ nfy("Error: " + e.message, "er"); setBusy(false); });
  };

  var I = { padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, background: "#f8faf9", width: "100%" };
  var dangerBtn = { background: "#dc2626", color: "#fff", border: "none", padding: "10px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" };
  var cancelBtn = { background: "#f1f5f9", border: "1px solid #e2e8f0", padding: "10px 18px", borderRadius: 8, fontSize: 13, cursor: "pointer", color: K.mt };

  // Confirm dialog
  var ConfirmBox = function(props){
    return <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:12,padding:20,marginBottom:16}}>
      <div style={{fontSize:14,fontWeight:700,color:"#dc2626",marginBottom:8}}>{props.title}</div>
      <div style={{fontSize:13,color:"#7f1d1d",marginBottom:14}}>{props.desc}</div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={props.onConfirm} disabled={busy} style={Object.assign({},dangerBtn,{opacity:busy?0.5:1})}>{busy ? "Procesando..." : props.confirmText}</button>
        <button onClick={function(){setConfirmAction(null)}} style={cancelBtn}>Cancelar</button>
      </div>
    </div>;
  };

  if(loading) return <div style={{animation:"fi .3s ease",textAlign:"center",padding:60}}><div style={{fontSize:36,marginBottom:12}}>{"⚙️"}</div><div style={{fontSize:16,fontWeight:600,color:K.mt}}>Cargando usuarios...</div></div>;

  return (
    <div style={{ animation: "fi .3s ease", width: "100%", maxWidth: 800 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{"⚙️ Administración"}</h1>
      <p style={{ color: K.mt, fontSize: 14, marginBottom: 16 }}>{nonAdmin.length + " usuarios registrados"}</p>

      {/* Tabs */}
      <div style={{display:"flex",gap:6,marginBottom:20}}>
        {[["list","Usuarios"],["actions","Acciones globales"]].map(function(t){
          return <button key={t[0]} onClick={function(){setTab(t[0]);setSelUser(null);setConfirmAction(null);}} style={{padding:"8px 16px",borderRadius:8,border:tab===t[0]?"2px solid "+K.ac:"1px solid #e2e8f0",background:tab===t[0]?"#ccfbf1":"#fff",color:tab===t[0]?K.ac:K.mt,fontSize:13,fontWeight:600,cursor:"pointer"}}>{t[1]}</button>;
        })}
      </div>

      {/* Global actions tab */}
      {tab==="actions" && <div>
        {confirmAction==="deleteAllEvals" && <ConfirmBox title="Eliminar TODAS las evaluaciones" desc={"Esto borrará todas las evaluaciones de todos los usuarios. Esta acción es IRREVERSIBLE."} confirmText="Sí, eliminar todo" onConfirm={deleteAllEvals} />}

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <div style={{background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:20,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
            <div><div style={{fontSize:14,fontWeight:600}}>{"Borrar todas las evaluaciones"}</div><div style={{fontSize:12,color:K.mt}}>Elimina evaluaciones de TODOS los usuarios</div></div>
            <button onClick={function(){setConfirmAction("deleteAllEvals")}} style={dangerBtn}>Eliminar todas</button>
          </div>
        </div>
      </div>}

      {/* Users list tab */}
      {tab==="list" && !selUser && <div>
        <input value={filter} onChange={function(e){ setFilter(e.target.value); }} style={Object.assign({}, I, { marginBottom: 12 })} placeholder="Buscar por nombre, usuario o email..." />
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 70px 60px", gap: 8, padding: "10px 16px", background: K.sd, color: "#fff", fontSize: 11, fontWeight: 700 }}>
            <span>Usuario</span><span>Email</span><span style={{textAlign:"center"}}>Créd.</span><span></span>
          </div>
          <div style={{ maxHeight: 450, overflowY: "auto" }}>
            {filtered.length === 0 && <div style={{ padding: 20, textAlign: "center", color: K.mt, fontSize: 13 }}>No se encontraron usuarios</div>}
            {filtered.sort(function(a,b){ return (a.username||"").localeCompare(b.username||""); }).map(function(u){
              return <div key={u._fbId} onClick={function(){ setSelUser(u); setEditForm(null); setConfirmAction(null); }} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 70px 60px", gap: 8, padding: "12px 16px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", alignItems: "center", fontSize: 13 }}>
                <div>
                  <div style={{ fontWeight: 600, color: K.sd }}>{u.nombre} {u.apellido}</div>
                  <div style={{ fontSize: 11, color: K.mt }}>@{u.username}</div>
                </div>
                <div style={{ fontSize: 11, color: K.mt, overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</div>
                <div style={{ textAlign: "center", fontWeight: 700, color: (u.creditos||0) > 0 ? "#059669" : "#dc2626" }}>{u.creditos || 0}</div>
                <div style={{ textAlign: "center", fontSize: 11, color: K.ac, fontWeight: 600 }}>{"Ver →"}</div>
              </div>;
            })}
          </div>
        </div>
      </div>}

      {/* Selected user detail */}
      {tab==="list" && selUser && <div>
        <button onClick={function(){ setSelUser(null); setEditForm(null); setConfirmAction(null); }} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, cursor: "pointer", fontWeight: 600, marginBottom: 16 }}>{"← Volver a lista"}</button>

        {/* Confirm dialogs */}
        {confirmAction==="deleteEvals" && <ConfirmBox title={"Eliminar evaluaciones de " + selUser.nombre} desc="Se borrarán todas las evaluaciones de este usuario. Esta acción es irreversible." confirmText="Sí, eliminar evaluaciones" onConfirm={function(){deleteUserEvals(selUser._fbId)}} />}
        {confirmAction==="deleteUser" && <ConfirmBox title={"Eliminar usuario " + selUser.nombre + " " + selUser.apellido} desc="Se eliminarán el usuario, sus evaluaciones y sus pacientes. Esta acción es IRREVERSIBLE." confirmText="Sí, eliminar usuario" onConfirm={function(){deleteUserDoc(selUser._fbId)}} />}

        {/* User info card */}
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: K.sd, marginBottom: 10 }}>
            {selUser.nombre} {selUser.apellido}
          </div>
          {!editForm ? <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13, color: "#475569" }}>
              <div><span style={{ color: K.mt }}>Usuario: </span><strong>@{selUser.username}</strong></div>
              <div><span style={{ color: K.mt }}>Email: </span>{selUser.email}</div>
              <div><span style={{ color: K.mt }}>DNI: </span>{selUser.dni || "—"}</div>
              <div><span style={{ color: K.mt }}>Créditos: </span><strong style={{ color: (selUser.creditos || 0) > 0 ? "#059669" : "#dc2626", fontSize: 18 }}>{selUser.creditos || 0}</strong></div>
              {selUser.createdAt && <div><span style={{ color: K.mt }}>Registro: </span>{new Date(selUser.createdAt).toLocaleDateString("es-AR")}</div>}
              {selUser.authProvider && <div><span style={{ color: K.mt }}>Método: </span>{selUser.authProvider === "google" ? "Google" : "Email/contraseña"}</div>}
            </div>
            <button onClick={function(){setEditForm({nombre:selUser.nombre||"",apellido:selUser.apellido||"",dni:selUser.dni||""})}} style={{marginTop:12,padding:"8px 16px",background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",color:K.mt}}>{"✏️ Editar datos"}</button>
          </div> : <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
              <div><label style={{fontSize:11,fontWeight:600,color:K.mt,display:"block",marginBottom:3}}>Nombre</label><input value={editForm.nombre} onChange={function(e){setEditForm(function(p){return Object.assign({},p,{nombre:e.target.value})})}} style={I}/></div>
              <div><label style={{fontSize:11,fontWeight:600,color:K.mt,display:"block",marginBottom:3}}>Apellido</label><input value={editForm.apellido} onChange={function(e){setEditForm(function(p){return Object.assign({},p,{apellido:e.target.value})})}} style={I}/></div>
              <div><label style={{fontSize:11,fontWeight:600,color:K.mt,display:"block",marginBottom:3}}>DNI</label><input value={editForm.dni} onChange={function(e){setEditForm(function(p){return Object.assign({},p,{dni:e.target.value})})}} style={I}/></div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={saveEdit} disabled={busy} style={{padding:"8px 16px",background:K.ac,color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>{"Guardar"}</button>
              <button onClick={function(){setEditForm(null)}} style={cancelBtn}>Cancelar</button>
            </div>
          </div>}
        </div>

        {/* Credits management */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{"💳 Gestionar créditos"}</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input type="number" min={1} max={100} value={amount} onChange={function(e){ setAmount(e.target.value); }} style={Object.assign({}, I, { width: 80, textAlign: "center" })} />
            <button onClick={addCredits} style={{ background: "#059669", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{"+ Agregar"}</button>
            <button onClick={removeCredits} style={{ background: "#dc2626", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{"- Quitar"}</button>
          </div>
        </div>

        {/* Danger zone */}
        <div style={{background:"#fff",border:"1px solid #fecaca",borderRadius:12,padding:20}}>
          <div style={{fontSize:14,fontWeight:700,color:"#dc2626",marginBottom:14}}>{"⚠ Zona de peligro"}</div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:"#fef2f2",borderRadius:8,flexWrap:"wrap",gap:8}}>
              <div style={{fontSize:13}}>Borrar evaluaciones de este usuario</div>
              <button onClick={function(){setConfirmAction("deleteEvals")}} style={Object.assign({},dangerBtn,{fontSize:12,padding:"8px 14px"})}>Eliminar evaluaciones</button>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",background:"#fef2f2",borderRadius:8,flexWrap:"wrap",gap:8}}>
              <div style={{fontSize:13}}>Eliminar usuario completamente</div>
              <button onClick={function(){setConfirmAction("deleteUser")}} style={Object.assign({},dangerBtn,{fontSize:12,padding:"8px 14px"})}>Eliminar usuario</button>
            </div>
          </div>
        </div>
      </div>}
    </div>
  );
}
