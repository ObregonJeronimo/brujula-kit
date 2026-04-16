import { useState, useEffect, useCallback } from "react";
import { db, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from "../firebase.js";
import { K, ageLabel } from "../lib/fb.js";
import { renderReportText } from "../lib/evalUtils.jsx";
import { getEvalType } from "../config/evalTypes.js";
import "../styles/PacientesPage.css";

var pad = function(n){ return String(n).padStart(2,"0"); };

function calcAge(birthStr){
  if(!birthStr) return "";
  var b = new Date(birthStr); var now = new Date();
  var years = now.getFullYear() - b.getFullYear();
  var months = now.getMonth() - b.getMonth();
  if(now.getDate() < b.getDate()) months--;
  if(months < 0){ years--; months += 12; }
  if(years < 1) return months + (months===1?" mes":" meses");
  var parts = years + (years===1?" año":" años");
  if(months > 0) parts += ", " + months + (months===1?" mes":" meses");
  return parts;
}

var RESP_TYPES = ["Madre","Padre","Tutor/a","Cuidador/a","Hermano/a","Otro"];

export default function PacientesPage({ TC, userId, nfy, allEvals, therapistInfo }){
  var _p = useState([]), pacientes = _p[0], setPacientes = _p[1];
  var _l = useState(true), loading = _l[0], setLoading = _l[1];
  var _q = useState(""), busqueda = _q[0], setBusqueda = _q[1];
  var _s = useState(null), selected = _s[0], setSelected = _s[1];
  var _e = useState(false), editing = _e[0], setEditing = _e[1];
  var _f = useState({dni:"",nombre:"",colegio:"",fechaNac:"",respNombre:"",respDni:"",respTel:"",respEmail:"",respTipo:"Madre",respTipoOtro:""}), form = _f[0], setForm = _f[1];
  var _ef = useState({dni:"",nombre:"",colegio:"",fechaNac:"",respNombre:"",respDni:"",respTel:"",respEmail:"",respTipo:"Madre",respTipoOtro:""}), editForm = _ef[0], setEditForm = _ef[1];
  var _sf = useState(false), showForm = _sf[0], setShowForm = _sf[1];
  var _cd = useState(false), confirmDelPac = _cd[0], setConfirmDelPac = _cd[1];

  var loadPacientes = useCallback(function(){
    if(!userId) return; setLoading(true);
    var q2 = query(collection(db,"pacientes"), where("userId","==",userId));
    getDocs(q2).then(function(snap){ var arr = snap.docs.map(function(d){ return Object.assign({_fbId:d.id},d.data()); }); arr.sort(function(a,b){ return (a.nombre||"").localeCompare(b.nombre||""); }); setPacientes(arr); setLoading(false); }).catch(function(e){ console.error(e); setLoading(false); });
  },[userId]);

  useEffect(function(){ loadPacientes(); },[loadPacientes]);

  var savePaciente = function(){
    var dni = (form.dni||"").replace(/\D/g,"").trim(); var nombre = (form.nombre||"").trim();
    if(!dni || !nombre || !form.fechaNac){ nfy("Complet\u00e1 DNI, nombre y fecha de nacimiento","er"); return; }
    if(dni.length < 7 || dni.length > 8){ nfy("El DNI debe tener 7 u 8 d\u00edgitos","er"); return; }
    if(!(form.colegio||"").trim()){ nfy("El jard\u00edn / colegio es obligatorio","er"); return; }
    if(!(form.respNombre||"").trim()){ nfy("El nombre del responsable es obligatorio","er"); return; }
    if(!(form.respTel||"").trim()){ nfy("El tel\u00e9fono del responsable es obligatorio","er"); return; }
    if(pacientes.find(function(p){ return p.dni === dni; })){ nfy("Ya existe un paciente con DNI " + dni,"er"); return; }
    var responsable = { nombre: (form.respNombre||"").trim(), dni: (form.respDni||"").replace(/\D/g,"").trim(), telefono: (form.respTel||"").trim(), email: (form.respEmail||"").trim(), tipo: form.respTipo === "Otro" ? (form.respTipoOtro||"").trim() || "Otro" : form.respTipo };
    addDoc(collection(db,"pacientes"), { dni: dni, nombre: nombre, colegio: (form.colegio||"").trim(), fechaNac: form.fechaNac, responsable: responsable, userId: userId, createdAt: new Date().toISOString() }).then(function(){ nfy("Paciente guardado","ok"); setForm({dni:"",nombre:"",colegio:"",fechaNac:"",respNombre:"",respDni:"",respTel:"",respEmail:"",respTipo:"Madre",respTipoOtro:""}); setShowForm(false); loadPacientes(); }).catch(function(e){ nfy("Error: " + e.message,"er"); });
  };

  var updatePaciente = function(){
    if(!selected) return;
    var dni = (editForm.dni||"").replace(/\D/g,"").trim(); var nombre = (editForm.nombre||"").trim();
    if(!dni || !nombre || !editForm.fechaNac){ nfy("Complete DNI, nombre y fecha de nacimiento","er"); return; }
    if(pacientes.find(function(p){ return p.dni === dni && p._fbId !== selected._fbId; })){ nfy("Ya existe otro paciente con DNI " + dni,"er"); return; }
    var responsable = { nombre: (editForm.respNombre||"").trim(), dni: (editForm.respDni||"").replace(/\D/g,"").trim(), telefono: (editForm.respTel||"").trim(), email: (editForm.respEmail||"").trim(), tipo: editForm.respTipo === "Otro" ? (editForm.respTipoOtro||"").trim() || "Otro" : editForm.respTipo };
    updateDoc(doc(db,"pacientes",selected._fbId), { dni: dni, nombre: nombre, colegio: (editForm.colegio||"").trim(), fechaNac: editForm.fechaNac, responsable: responsable }).then(function(){ nfy("Paciente actualizado","ok"); setEditing(false); setSelected(null); loadPacientes(); }).catch(function(e){ nfy("Error: " + e.message,"er"); });
  };

  var deletePaciente = function(){
    if(!selected) return;
    var pacDni = selected.dni || "";
    var pacNombre = selected.nombre || "";
    // Buscar todas las evaluaciones del paciente
    var pacEvals = (allEvals||[]).filter(function(ev){
      return (ev.pacienteDni||ev.dni||"") === pacDni || ev.paciente === pacNombre;
    });
    // Eliminar paciente
    deleteDoc(doc(db,"pacientes",selected._fbId)).then(function(){
      // Eliminar todas las evaluaciones asociadas
      if(pacEvals.length > 0){
        var deletions = pacEvals.map(function(ev){
          return deleteDoc(doc(db,"evaluaciones",ev._fbId));
        });
        Promise.all(deletions).then(function(){
          nfy("Paciente y "+pacEvals.length+" evaluaci\u00f3n"+(pacEvals.length!==1?"es":"")+" eliminado"+(pacEvals.length!==1?"s":""),"ok");
          setConfirmDelPac(false); setSelected(null); loadPacientes();
        }).catch(function(e){ nfy("Paciente eliminado pero falló al eliminar evaluaciones: " + e.message,"er"); setConfirmDelPac(false); setSelected(null); loadPacientes(); });
      } else {
        nfy("Paciente eliminado","ok");
        setConfirmDelPac(false); setSelected(null); loadPacientes();
      }
    }).catch(function(e){ nfy("Error: " + e.message,"er"); });
  };

  var openEdit = function(pac){
    setSelected(pac);
    var r = pac.responsable || {};
    var tipoResp = r.tipo || "Madre";
    var tipoOtro = "";
    if(tipoResp && RESP_TYPES.indexOf(tipoResp) === -1){ tipoOtro = tipoResp; tipoResp = "Otro"; }
    setEditForm({ dni: pac.dni||"", nombre: pac.nombre||"", colegio: pac.colegio||"", fechaNac: pac.fechaNac||"", respNombre: r.nombre||"", respDni: r.dni||"", respTel: r.telefono||"", respEmail: r.email||"", respTipo: tipoResp, respTipoOtro: tipoOtro });
    setEditing(true); setConfirmDelPac(false);
  };
  var openView = function(pac){ setSelected(pac); setEditing(false); setConfirmDelPac(false); };

  var getLastEval = function(pacDni){ if(!pacDni || !allEvals) return null; var matching = allEvals.filter(function(ev){ return (ev.pacienteDni||ev.dni||"") === pacDni && ev.tipo !== "eldi"; }); if(matching.length === 0) return null; matching.sort(function(a,b){ return (b.fechaGuardado||"").localeCompare(a.fechaGuardado||""); }); return { tipo: (matching[0].tipo||"").toUpperCase(), fecha: matching[0].fechaGuardado || matching[0].fechaEvaluacion || "" }; };

  var filtered = pacientes;
  if(busqueda.trim()){ var q = busqueda.trim().toLowerCase(); var dniQ = q.replace(/\D/g,""); filtered = pacientes.filter(function(p){ if(dniQ && p.dni && p.dni.indexOf(dniQ) === 0) return true; if(p.nombre && p.nombre.toLowerCase().indexOf(q) >= 0) return true; return false; }); }

  return (
    <div className="pac-page">
      <h1 className="pac-title">{"👧👦 Pacientes"}</h1>
      <p className="pac-subtitle">Gestiona los datos de tus pacientes</p>

      {!showForm && !editing && <button onClick={function(){ setShowForm(true); setSelected(null); setConfirmDelPac(false); }} className="pac-new-btn">+ Nuevo paciente</button>}

      {showForm && !editing && <div className="pac-card">
        <div className="pac-card-header">
          <h3 className="pac-card-title">Nuevo paciente</h3>
          <button onClick={function(){ setShowForm(false); }} className="pac-card-close">×</button>
        </div>
        <div className="pac-grid-2">
          <div><label className="pac-label">DNI (sin puntos)</label><input value={form.dni} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{dni:e.target.value.replace(/\D/g,"").slice(0,8)}); }); }} className="pac-input" placeholder="Introducir DNI" maxLength={8} inputMode="numeric" /></div>
          <div><label className="pac-label">Fecha de nacimiento</label><input type="date" value={form.fechaNac} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{fechaNac:e.target.value}); }); }} className="pac-input" /></div>
          <div className="pac-field-full"><label className="pac-label">Nombre completo</label><input value={form.nombre} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{nombre:e.target.value}); }); }} className="pac-input" placeholder="Apellido Nombre" /></div>
          <div className="pac-field-full"><label className="pac-label">{"Jard\u00edn / Colegio *"}</label><input value={form.colegio} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{colegio:e.target.value}); }); }} className="pac-input" placeholder="Establecimiento" /></div>
        </div>
        <div className="pac-section-divider">
          <h4 className="pac-section-title">{"Información del responsable"}</h4>
          <p className="pac-section-desc">Datos de contacto del adulto responsable del paciente</p>
          <div className="pac-grid-2">
            <div className="pac-field-full"><label className="pac-label">{"Nombre y Apellido *"}</label><input value={form.respNombre} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{respNombre:e.target.value}); }); }} className="pac-input" placeholder="Nombre del responsable" /></div>
            <div><label className="pac-label">DNI <span className="pac-label-optional">(opcional)</span></label><input value={form.respDni} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{respDni:e.target.value.replace(/\D/g,"").slice(0,8)}); }); }} className="pac-input" placeholder="DNI del responsable" maxLength={8} inputMode="numeric" /></div>
            <div><label className="pac-label">{"Teléfono"} <span className="pac-label-required">*</span></label><input value={form.respTel} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{respTel:e.target.value}); }); }} className="pac-input" placeholder="Ej: +54 351 1234567" /></div>
            <div><label className="pac-label">Email <span className="pac-label-optional">(recomendado)</span></label><input type="email" value={form.respEmail} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{respEmail:e.target.value}); }); }} className="pac-input" placeholder="correo@ejemplo.com" /></div>
            <div><label className="pac-label">Tipo de responsable</label><select value={form.respTipo} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{respTipo:e.target.value}); }); }} className="pac-input pac-select">{RESP_TYPES.map(function(t){ return <option key={t} value={t}>{t}</option>; })}</select></div>
            {form.respTipo==="Otro"&&<div><label className="pac-label">Especificar</label><input value={form.respTipoOtro} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{respTipoOtro:e.target.value}); }); }} className="pac-input" placeholder="Tipo de vínculo" /></div>}
          </div>
        </div>
        <div className="pac-form-actions">
          <button onClick={function(){ setShowForm(false); }} className="pac-btn-cancel">Cancelar</button>
          <button onClick={savePaciente} className="pac-btn-primary">Guardar</button>
        </div>
      </div>}

      {editing && selected && <div className="pac-card">
        <div className="pac-card-header">
          <h3 className="pac-card-title">Editar paciente</h3>
          <button onClick={function(){ setEditing(false); setSelected(null); }} className="pac-card-close">×</button>
        </div>
        <div className="pac-grid-2">
          <div><label className="pac-label">DNI</label><input value={editForm.dni} onChange={function(e){ setEditForm(function(p){ return Object.assign({},p,{dni:e.target.value.replace(/\D/g,"").slice(0,8)}); }); }} className="pac-input" maxLength={8} inputMode="numeric" /></div>
          <div><label className="pac-label">Fecha de nacimiento</label><input type="date" value={editForm.fechaNac} onChange={function(e){ setEditForm(function(p){ return Object.assign({},p,{fechaNac:e.target.value}); }); }} className="pac-input" /></div>
          <div className="pac-field-full"><label className="pac-label">Nombre completo</label><input value={editForm.nombre} onChange={function(e){ setEditForm(function(p){ return Object.assign({},p,{nombre:e.target.value}); }); }} className="pac-input" /></div>
          <div className="pac-field-full"><label className="pac-label">{"Jardín / Colegio"}</label><input value={editForm.colegio} onChange={function(e){ setEditForm(function(p){ return Object.assign({},p,{colegio:e.target.value}); }); }} className="pac-input" /></div>
        </div>
        <div className="pac-section-divider">
          <h4 className="pac-section-title">{"Información del responsable"}</h4>
          <p className="pac-section-desc">Datos de contacto del adulto responsable del paciente</p>
          <div className="pac-grid-2">
            <div className="pac-field-full"><label className="pac-label">Nombre y Apellido</label><input value={editForm.respNombre} onChange={function(e){ setEditForm(function(p){ return Object.assign({},p,{respNombre:e.target.value}); }); }} className="pac-input" placeholder="Nombre del responsable" /></div>
            <div><label className="pac-label">DNI <span className="pac-label-optional">(opcional)</span></label><input value={editForm.respDni} onChange={function(e){ setEditForm(function(p){ return Object.assign({},p,{respDni:e.target.value.replace(/\D/g,"").slice(0,8)}); }); }} className="pac-input" placeholder="DNI del responsable" maxLength={8} inputMode="numeric" /></div>
            <div><label className="pac-label">{"Teléfono"}</label><input value={editForm.respTel} onChange={function(e){ setEditForm(function(p){ return Object.assign({},p,{respTel:e.target.value}); }); }} className="pac-input" placeholder="Ej: +54 351 1234567" /></div>
            <div><label className="pac-label">Email</label><input type="email" value={editForm.respEmail} onChange={function(e){ setEditForm(function(p){ return Object.assign({},p,{respEmail:e.target.value}); }); }} className="pac-input" placeholder="correo@ejemplo.com" /></div>
            <div><label className="pac-label">Tipo de responsable</label><select value={editForm.respTipo} onChange={function(e){ setEditForm(function(p){ return Object.assign({},p,{respTipo:e.target.value}); }); }} className="pac-input pac-select">{RESP_TYPES.map(function(t){ return <option key={t} value={t}>{t}</option>; })}</select></div>
            {editForm.respTipo==="Otro"&&<div><label className="pac-label">Especificar</label><input value={editForm.respTipoOtro} onChange={function(e){ setEditForm(function(p){ return Object.assign({},p,{respTipoOtro:e.target.value}); }); }} className="pac-input" placeholder="Tipo de vínculo" /></div>}
          </div>
        </div>
        <div className="pac-form-actions">
          <button onClick={function(){ setEditing(false); setSelected(null); }} className="pac-btn-cancel">Cancelar</button>
          <button onClick={updatePaciente} className="pac-btn-primary">Actualizar</button>
        </div>
      </div>}

      {selected && !editing && <div className="pac-card">
        <div className="pac-card-header">
          <h3 className="pac-card-title">Ficha del paciente</h3>
          <div className="pac-actions">
            <button onClick={function(){ openEdit(selected); }} className="pac-btn-edit">Editar</button>
            <button onClick={function(){ setConfirmDelPac(true); }} className="pac-btn-delete">Eliminar</button>
            <button onClick={function(){ setSelected(null); setConfirmDelPac(false); }} className="pac-btn-close">×</button>
          </div>
        </div>
        {confirmDelPac && (function(){
          var pacDni = selected.dni || "";
          var pacNombre = selected.nombre || "";
          var pacEvalsCount = (allEvals||[]).filter(function(ev){
            return (ev.pacienteDni||ev.dni||"") === pacDni || ev.paciente === pacNombre;
          }).length;
          return <div className="pac-confirm-delete">
            <div className="pac-confirm-msg">
              {"\u26a0\ufe0f \u00bfEliminar este paciente?"}
              {pacEvalsCount > 0 && <div className="pac-del-warn">
                {"Tambi\u00e9n se eliminar\u00e1n "+pacEvalsCount+" evaluaci\u00f3n"+(pacEvalsCount!==1?"es":"")+" asociada"+(pacEvalsCount!==1?"s":"")+". Esta acci\u00f3n no se puede deshacer."}
              </div>}
              {pacEvalsCount === 0 && <div className="pac-del-warn">Esta acci\u00f3n no se puede deshacer.</div>}
            </div>
            <div className="pac-confirm-actions">
              <button onClick={deletePaciente} className="pac-btn-confirm-delete">{"S\u00ed, eliminar todo"}</button>
              <button onClick={function(){ setConfirmDelPac(false); }} className="pac-btn-confirm-cancel">Cancelar</button>
            </div>
          </div>;
        })()}
        <div className="pac-grid-2">
          <div><div className="pac-info-label">DNI</div><div className="pac-info-value">{selected.dni}</div></div>
          <div><div className="pac-info-label">Edad</div><div className="pac-info-value">{calcAge(selected.fechaNac)}</div></div>
          <div className="pac-field-full"><div className="pac-info-label">Nombre</div><div className="pac-info-value">{selected.nombre}</div></div>
          <div><div className="pac-info-label">Fecha nac.</div><div className="pac-info-value pac-info-value--normal">{selected.fechaNac ? new Date(selected.fechaNac+"T12:00:00").toLocaleDateString("es-AR") : "-"}</div></div>
          <div><div className="pac-info-label">Colegio</div><div className="pac-info-value pac-info-value--normal">{selected.colegio || "-"}</div></div>
        </div>
        {selected.responsable && <div className="pac-responsable">
          <div className="pac-responsable-title">Responsable</div>
          <div className="pac-responsable-grid">
            <div><span className="pac-responsable-key">Nombre: </span><b>{selected.responsable.nombre || "-"}</b></div>
            <div><span className="pac-responsable-key">Tipo: </span><b>{selected.responsable.tipo || "-"}</b></div>
            <div><span className="pac-responsable-key">Tel: </span><b>{selected.responsable.telefono || "-"}</b></div>
            <div><span className="pac-responsable-key">Email: </span><b>{selected.responsable.email || "-"}</b></div>
            {selected.responsable.dni && <div><span className="pac-responsable-key">DNI: </span><b>{selected.responsable.dni}</b></div>}
          </div>
        </div>}
        {(function(){
          var last = getLastEval(selected.dni);
          if(!last) return <div className="pac-last-none">Sin evaluaciones registradas</div>;
          return <div className="pac-last-box">
            <div className="pac-last-label">{"Última evaluación"}</div>
            <div className="pac-last-eval"><span className="pac-last-type">{last.tipo}</span>{" - "}{last.fecha ? new Date(last.fecha).toLocaleDateString("es-AR") : "-"}</div>
          </div>;
        })()}
      </div>}

      <div className="pac-search"><input value={busqueda} onChange={function(e){ setBusqueda(e.target.value); setSelected(null); setEditing(false); setConfirmDelPac(false); }} className="pac-input pac-search-input" placeholder="Buscar por DNI o nombre..." /></div>

      {loading ? <div className="pac-empty">Cargando pacientes...</div> : filtered.length === 0 ? <div className="pac-empty pac-empty--italic">{busqueda.trim() ? "No se encontraron pacientes" : "No hay pacientes cargados"}</div> :
        <div className="pac-list">
          {filtered.map(function(pac){
            var isSelected = selected && selected._fbId === pac._fbId && !editing;
            var lastEv = getLastEval(pac.dni);
            return <div key={pac._fbId} onClick={function(){ openView(pac); }} className={"pac-item"+(isSelected?" pac-item--selected":"")}>
              <div className="pac-item-avatar">{"👤"}</div>
              <div className="pac-item-info"><div className="pac-item-name">{pac.nombre}</div><div className="pac-item-meta">{"DNI: " + pac.dni + " · " + calcAge(pac.fechaNac) + (pac.colegio ? " · " + pac.colegio : "")}</div></div>
              <div className="pac-item-right">{lastEv ? <div><div className="pac-item-last-type">{lastEv.tipo}</div><div className="pac-item-last-date">{lastEv.fecha ? new Date(lastEv.fecha).toLocaleDateString("es-AR") : ""}</div></div> : <div className="pac-item-no-eval">Sin eval.</div>}</div>
              <button onClick={function(e){ e.stopPropagation(); openEdit(pac); }} className="pac-item-edit-btn">Editar</button>
            </div>;
          })}
          <div className="pac-list-count">{filtered.length + " paciente" + (filtered.length!==1?"s":"")}</div>
        </div>}
    </div>
  );
}
