import { useState, useEffect, useCallback } from "react";
import { db, collection, getDocs, updateDoc, deleteDoc, doc, increment, query, where } from "../firebase.js";
import "../styles/Admin.css";

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

  // Confirm dialog
  var ConfirmBox = function(props){
    return <div className="admin-confirm">
      <div className="admin-confirm-title">{props.title}</div>
      <div className="admin-confirm-desc">{props.desc}</div>
      <div className="admin-confirm-actions">
        <button onClick={props.onConfirm} disabled={busy} className="admin-btn-danger">{busy ? "Procesando..." : props.confirmText}</button>
        <button onClick={function(){setConfirmAction(null)}} className="admin-btn-cancel">Cancelar</button>
      </div>
    </div>;
  };

  if(loading) return <div className="admin-loading">
    <div className="admin-loading-icon">{"⚙️"}</div>
    <div className="admin-loading-text">Cargando usuarios...</div>
  </div>;

  return (
    <div className="admin-page">
      <h1 className="admin-title">{"⚙️ Administración"}</h1>
      <p className="admin-subtitle">{nonAdmin.length + " usuarios registrados"}</p>

      {/* Tabs */}
      <div className="admin-tabs">
        {[["list","Usuarios"],["actions","Acciones globales"]].map(function(t){
          return <button
            key={t[0]}
            onClick={function(){setTab(t[0]);setSelUser(null);setConfirmAction(null);}}
            className={"admin-tab" + (tab===t[0] ? " admin-tab--active" : "")}
          >{t[1]}</button>;
        })}
      </div>

      {/* Global actions tab */}
      {tab==="actions" && <div>
        {confirmAction==="deleteAllEvals" && <ConfirmBox title="Eliminar TODAS las evaluaciones" desc={"Esto borrará todas las evaluaciones de todos los usuarios. Esta acción es IRREVERSIBLE."} confirmText="Sí, eliminar todo" onConfirm={deleteAllEvals} />}

        <div className="admin-actions-list">
          <div className="admin-action-card">
            <div>
              <div className="admin-action-info-title">{"Borrar todas las evaluaciones"}</div>
              <div className="admin-action-info-desc">Elimina evaluaciones de TODOS los usuarios</div>
            </div>
            <button onClick={function(){setConfirmAction("deleteAllEvals")}} className="admin-btn-danger">Eliminar todas</button>
          </div>
        </div>
      </div>}

      {/* Users list tab */}
      {tab==="list" && !selUser && <div>
        <input
          value={filter}
          onChange={function(e){ setFilter(e.target.value); }}
          className="admin-search"
          placeholder="Buscar por nombre, usuario o email..."
        />
        <div className="admin-list">
          <div className="admin-list-header">
            <span>Usuario</span>
            <span>Email</span>
            <span className="admin-list-header-center">Créd.</span>
            <span></span>
          </div>
          <div className="admin-list-body">
            {filtered.length === 0 && <div className="admin-list-empty">No se encontraron usuarios</div>}
            {filtered.sort(function(a,b){ return (a.username||"").localeCompare(b.username||""); }).map(function(u){
              var credClass = (u.creditos||0) > 0 ? "admin-list-credits admin-list-credits--positive" : "admin-list-credits admin-list-credits--zero";
              return <div
                key={u._fbId}
                onClick={function(){ setSelUser(u); setEditForm(null); setConfirmAction(null); }}
                className="admin-list-row"
              >
                <div>
                  <div className="admin-list-name">{u.nombre} {u.apellido}</div>
                  <div className="admin-list-username">@{u.username}</div>
                </div>
                <div className="admin-list-email">{u.email}</div>
                <div className={credClass}>{u.creditos || 0}</div>
                <div className="admin-list-action">{"Ver →"}</div>
              </div>;
            })}
          </div>
        </div>
      </div>}

      {/* Selected user detail */}
      {tab==="list" && selUser && <div>
        <button
          onClick={function(){ setSelUser(null); setEditForm(null); setConfirmAction(null); }}
          className="admin-back"
        >{"← Volver a lista"}</button>

        {/* Confirm dialogs */}
        {confirmAction==="deleteEvals" && <ConfirmBox title={"Eliminar evaluaciones de " + selUser.nombre} desc="Se borrarán todas las evaluaciones de este usuario. Esta acción es irreversible." confirmText="Sí, eliminar evaluaciones" onConfirm={function(){deleteUserEvals(selUser._fbId)}} />}
        {confirmAction==="deleteUser" && <ConfirmBox title={"Eliminar usuario " + selUser.nombre + " " + selUser.apellido} desc="Se eliminarán el usuario, sus evaluaciones y sus pacientes. Esta acción es IRREVERSIBLE." confirmText="Sí, eliminar usuario" onConfirm={function(){deleteUserDoc(selUser._fbId)}} />}

        {/* User info card */}
        <div className="admin-user-card">
          <div className="admin-user-name">
            {selUser.nombre} {selUser.apellido}
          </div>
          {!editForm ? <div>
            <div className="admin-user-grid">
              <div><span className="admin-user-label">Usuario: </span><strong>@{selUser.username}</strong></div>
              <div><span className="admin-user-label">Email: </span>{selUser.email}</div>
              <div><span className="admin-user-label">DNI: </span>{selUser.dni || "—"}</div>
              <div>
                <span className="admin-user-label">Créditos: </span>
                <strong className={"admin-user-credits-value " + ((selUser.creditos || 0) > 0 ? "admin-user-credits-value--positive" : "admin-user-credits-value--zero")}>{selUser.creditos || 0}</strong>
              </div>
              {selUser.createdAt && <div><span className="admin-user-label">Registro: </span>{new Date(selUser.createdAt).toLocaleDateString("es-AR")}</div>}
              {selUser.authProvider && <div><span className="admin-user-label">Método: </span>{selUser.authProvider === "google" ? "Google" : "Email/contraseña"}</div>}
            </div>
            <button
              onClick={function(){setEditForm({nombre:selUser.nombre||"",apellido:selUser.apellido||"",dni:selUser.dni||""})}}
              className="admin-edit-btn"
            >{"✏️ Editar datos"}</button>
          </div> : <div>
            <div className="admin-edit-grid">
              <div>
                <label className="admin-edit-label">Nombre</label>
                <input value={editForm.nombre} onChange={function(e){setEditForm(function(p){return Object.assign({},p,{nombre:e.target.value})})}} className="admin-edit-input"/>
              </div>
              <div>
                <label className="admin-edit-label">Apellido</label>
                <input value={editForm.apellido} onChange={function(e){setEditForm(function(p){return Object.assign({},p,{apellido:e.target.value})})}} className="admin-edit-input"/>
              </div>
              <div>
                <label className="admin-edit-label">DNI</label>
                <input value={editForm.dni} onChange={function(e){setEditForm(function(p){return Object.assign({},p,{dni:e.target.value})})}} className="admin-edit-input"/>
              </div>
            </div>
            <div className="admin-edit-actions">
              <button onClick={saveEdit} disabled={busy} className="admin-btn-save">{"Guardar"}</button>
              <button onClick={function(){setEditForm(null)}} className="admin-btn-cancel">Cancelar</button>
            </div>
          </div>}
        </div>

        {/* Credits management */}
        <div className="admin-credits-card">
          <div className="admin-credits-title">{"💳 Gestionar créditos"}</div>
          <div className="admin-credits-row">
            <input
              type="number"
              min={1}
              max={100}
              value={amount}
              onChange={function(e){ setAmount(e.target.value); }}
              className="admin-credits-input"
            />
            <button onClick={addCredits} className="admin-btn-add">{"+ Agregar"}</button>
            <button onClick={removeCredits} className="admin-btn-remove">{"- Quitar"}</button>
          </div>
        </div>

        {/* Danger zone */}
        <div className="admin-danger-zone">
          <div className="admin-danger-title">{"⚠ Zona de peligro"}</div>
          <div className="admin-danger-list">
            <div className="admin-danger-row">
              <div className="admin-danger-row-text">Borrar evaluaciones de este usuario</div>
              <button onClick={function(){setConfirmAction("deleteEvals")}} className="admin-btn-danger admin-btn-danger--sm">Eliminar evaluaciones</button>
            </div>
            <div className="admin-danger-row">
              <div className="admin-danger-row-text">Eliminar usuario completamente</div>
              <button onClick={function(){setConfirmAction("deleteUser")}} className="admin-btn-danger admin-btn-danger--sm">Eliminar usuario</button>
            </div>
          </div>
        </div>
      </div>}
    </div>
  );
}
