import { useState, useEffect, useCallback } from "react";
import { db, collection, getDocs, updateDoc, doc, increment } from "../firebase.js";

var K = { mt: "#64748b", ac: "#0d9488", sd: "#0a3d2f" };

export default function Admin({ nfy }) {
  var _users = useState([]), users = _users[0], setUsers = _users[1];
  var _ld = useState(true), loading = _ld[0], setLoading = _ld[1];
  var _filter = useState(""), filter = _filter[0], setFilter = _filter[1];
  var _sel = useState(null), selUser = _sel[0], setSelUser = _sel[1];
  var _amount = useState(5), amount = _amount[0], setAmount = _amount[1];

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
           (u.email||"").toLowerCase().indexOf(q) >= 0 ||
           (u.dni||"").indexOf(q) >= 0;
  }) : nonAdmin;

  var addCredits = function(){
    if(!selUser) return;
    var qty = Math.min(Math.max(1, parseInt(amount) || 0), 100);
    if(qty < 1){ nfy("Cantidad inv\u00e1lida", "er"); return; }
    updateDoc(doc(db, "usuarios", selUser._fbId), { creditos: increment(qty) }).then(function(){
      setSelUser(function(p){ return Object.assign({}, p, { creditos: (p.creditos || 0) + qty }); });
      setUsers(function(prev){ return prev.map(function(u){ return u._fbId === selUser._fbId ? Object.assign({}, u, { creditos: (u.creditos || 0) + qty }) : u; }); });
      nfy("+" + qty + " cr\u00e9ditos agregados a " + selUser.username, "ok");
    }).catch(function(e){ nfy("Error: " + e.message, "er"); });
  };

  var removeCredits = function(){
    if(!selUser) return;
    var qty = Math.min(Math.max(1, parseInt(amount) || 0), selUser.creditos || 0);
    if(qty < 1){ nfy("No hay cr\u00e9ditos para quitar", "er"); return; }
    updateDoc(doc(db, "usuarios", selUser._fbId), { creditos: increment(-qty) }).then(function(){
      setSelUser(function(p){ return Object.assign({}, p, { creditos: Math.max(0, (p.creditos || 0) - qty) }); });
      setUsers(function(prev){ return prev.map(function(u){ return u._fbId === selUser._fbId ? Object.assign({}, u, { creditos: Math.max(0, (u.creditos || 0) - qty) }) : u; }); });
      nfy("-" + qty + " cr\u00e9ditos de " + selUser.username, "ok");
    }).catch(function(e){ nfy("Error: " + e.message, "er"); });
  };

  var I = { padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, background: "#f8faf9" };

  if(loading) return <div style={{animation:"fi .3s ease",textAlign:"center",padding:60}}><div style={{fontSize:36,marginBottom:12}}>{"\u2699\ufe0f"}</div><div style={{fontSize:16,fontWeight:600,color:K.mt}}>Cargando usuarios...</div></div>;

  return (
    <div style={{ animation: "fi .3s ease", width: "100%", maxWidth: 700 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{"\u2699\ufe0f Administraci\u00f3n de Usuarios"}</h1>
      <p style={{ color: K.mt, fontSize: 14, marginBottom: 24 }}>{nonAdmin.length + " usuarios registrados"}</p>

      {!selUser ? <div>
        <div style={{ marginBottom: 16 }}>
          <input value={filter} onChange={function(e){ setFilter(e.target.value); }} style={Object.assign({}, I, { width: "100%" })} placeholder="Buscar por nombre, usuario, email o DNI..." />
        </div>
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 80px 80px", gap: 8, padding: "12px 16px", background: K.sd, color: "#fff", fontSize: 11, fontWeight: 700 }}>
            <span>Usuario</span><span>Email</span><span style={{textAlign:"center"}}>Cr\u00e9ditos</span><span></span>
          </div>
          <div style={{ maxHeight: 500, overflowY: "auto" }}>
            {filtered.length === 0 && <div style={{ padding: 20, textAlign: "center", color: K.mt, fontSize: 13 }}>No se encontraron usuarios</div>}
            {filtered.sort(function(a,b){ return (a.username||"").localeCompare(b.username||""); }).map(function(u){
              return <div key={u._fbId} onClick={function(){ setSelUser(u); }} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 80px 80px", gap: 8, padding: "14px 16px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", alignItems: "center", fontSize: 13, transition: "background .15s" }} onMouseOver={function(e){e.currentTarget.style.background="#f0fdf4"}} onMouseOut={function(e){e.currentTarget.style.background="#fff"}}>
                <div>
                  <div style={{ fontWeight: 600, color: K.sd }}>{u.nombre} {u.apellido}</div>
                  <div style={{ fontSize: 11, color: K.mt }}>@{u.username}</div>
                </div>
                <div style={{ fontSize: 11, color: K.mt, overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</div>
                <div style={{ textAlign: "center", fontWeight: 700, color: (u.creditos||0) > 0 ? "#059669" : "#dc2626" }}>{u.creditos || 0}</div>
                <div style={{ textAlign: "center", fontSize: 11, color: K.ac, fontWeight: 600 }}>{"Ver \u2192"}</div>
              </div>;
            })}
          </div>
        </div>
      </div> : <div>
        <button onClick={function(){ setSelUser(null); }} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, padding: "8px 18px", fontSize: 13, cursor: "pointer", fontWeight: 600, marginBottom: 16 }}>{"\u2190 Volver a lista"}</button>

        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: K.sd, marginBottom: 10 }}>
            {selUser.nombre} {selUser.apellido}
            {selUser.role === "admin" && <span style={{ background: K.ac, color: "#fff", padding: "2px 8px", borderRadius: 4, fontSize: 10, marginLeft: 8, fontWeight: 700 }}>ADMIN</span>}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13, color: "#475569" }}>
            <div><span style={{ color: K.mt }}>Usuario: </span><strong>@{selUser.username}</strong></div>
            <div><span style={{ color: K.mt }}>Email: </span>{selUser.email}</div>
            <div><span style={{ color: K.mt }}>DNI: </span>{selUser.dni || "\u2014"}</div>
            <div>
              <span style={{ color: K.mt }}>{"Cr\u00e9ditos: "}</span>
              <strong style={{ color: selUser.role === "admin" ? K.ac : (selUser.creditos || 0) > 0 ? "#059669" : "#dc2626", fontSize: 18 }}>
                {selUser.role === "admin" ? "\u221e" : (selUser.creditos || 0)}
              </strong>
            </div>
          </div>
        </div>

        {selUser.role !== "admin" && <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>{"\ud83d\udcb3 Gestionar cr\u00e9ditos"}</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <input type="number" min={1} max={100} value={amount} onChange={function(e){ setAmount(e.target.value); }} style={Object.assign({}, I, { width: 80, textAlign: "center" })} />
            <button onClick={addCredits} style={{ background: "#059669", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{"+ Agregar"}</button>
            <button onClick={removeCredits} style={{ background: "#dc2626", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{"- Quitar"}</button>
          </div>
        </div>}

        {selUser.role === "admin" && <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 8, padding: 14, fontSize: 13, color: "#0369a1" }}>
          {"Los administradores tienen cr\u00e9ditos ilimitados."}
        </div>}
      </div>}
    </div>
  );
}
