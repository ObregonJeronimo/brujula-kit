import { useState, useEffect, useCallback } from "react";
import { db, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from "../firebase.js";
import { K } from "../lib/fb.js";

var pad = function(n){ return String(n).padStart(2,"0"); };

function calcAge(birthStr){
  if(!birthStr) return "";
  var b = new Date(birthStr);
  var now = new Date();
  var years = now.getFullYear() - b.getFullYear();
  var months = now.getMonth() - b.getMonth();
  if(now.getDate() < b.getDate()) months--;
  if(months < 0){ years--; months += 12; }
  if(years < 1) return months + (months===1?" mes":" meses");
  var parts = years + (years===1?" a\u00f1o":" a\u00f1os");
  if(months > 0) parts += ", " + months + (months===1?" mes":" meses");
  return parts;
}

var IS = {width:"100%",padding:"10px 14px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,background:"#f8faf9"};

export default function PacientesPage({ userId, nfy, evals, peffEvals, repEvals, discEvals, recoEvals }){
  var _p = useState([]), pacientes = _p[0], setPacientes = _p[1];
  var _l = useState(true), loading = _l[0], setLoading = _l[1];
  var _q = useState(""), busqueda = _q[0], setBusqueda = _q[1];
  var _s = useState(null), selected = _s[0], setSelected = _s[1];
  var _e = useState(false), editing = _e[0], setEditing = _e[1];
  var _f = useState({dni:"",nombre:"",colegio:"",fechaNac:""}), form = _f[0], setForm = _f[1];
  var _ef = useState({dni:"",nombre:"",colegio:"",fechaNac:""}), editForm = _ef[0], setEditForm = _ef[1];
  var _sf = useState(false), showForm = _sf[0], setShowForm = _sf[1];
  var _cd = useState(false), confirmDelPac = _cd[0], setConfirmDelPac = _cd[1];

  var loadPacientes = useCallback(function(){
    if(!userId) return;
    setLoading(true);
    var q2 = query(collection(db,"pacientes"), where("userId","==",userId));
    getDocs(q2).then(function(snap){
      var arr = snap.docs.map(function(d){ return Object.assign({_fbId:d.id},d.data()); });
      arr.sort(function(a,b){ return (a.nombre||"").localeCompare(b.nombre||""); });
      setPacientes(arr);
      setLoading(false);
    }).catch(function(e){
      console.error("Error cargando pacientes:", e);
      setLoading(false);
    });
  },[userId]);

  useEffect(function(){ loadPacientes(); },[loadPacientes]);

  var savePaciente = function(){
    var dni = (form.dni||"").replace(/\D/g,"").trim();
    var nombre = (form.nombre||"").trim();
    if(!dni || !nombre || !form.fechaNac){
      nfy("Complete DNI, nombre y fecha de nacimiento","er");
      return;
    }
    if(dni.length < 7 || dni.length > 8){
      nfy("El DNI debe tener 7 u 8 d\u00edgitos","er");
      return;
    }
    var dup = pacientes.find(function(p){ return p.dni === dni; });
    if(dup){
      nfy("Ya existe un paciente con DNI " + dni,"er");
      return;
    }
    var data = {
      dni: dni, nombre: nombre,
      colegio: (form.colegio||"").trim(),
      fechaNac: form.fechaNac,
      userId: userId,
      createdAt: new Date().toISOString()
    };
    addDoc(collection(db,"pacientes"), data).then(function(){
      nfy("Paciente guardado","ok");
      setForm({dni:"",nombre:"",colegio:"",fechaNac:""});
      setShowForm(false);
      loadPacientes();
    }).catch(function(e){ nfy("Error: " + e.message,"er"); });
  };

  var updatePaciente = function(){
    if(!selected) return;
    var dni = (editForm.dni||"").replace(/\D/g,"").trim();
    var nombre = (editForm.nombre||"").trim();
    if(!dni || !nombre || !editForm.fechaNac){
      nfy("Complete DNI, nombre y fecha de nacimiento","er");
      return;
    }
    var dup = pacientes.find(function(p){ return p.dni === dni && p._fbId !== selected._fbId; });
    if(dup){
      nfy("Ya existe otro paciente con DNI " + dni,"er");
      return;
    }
    var ref = doc(db,"pacientes",selected._fbId);
    updateDoc(ref, { dni: dni, nombre: nombre, colegio: (editForm.colegio||"").trim(), fechaNac: editForm.fechaNac
    }).then(function(){
      nfy("Paciente actualizado","ok");
      setEditing(false); setSelected(null); loadPacientes();
    }).catch(function(e){ nfy("Error: " + e.message,"er"); });
  };

  var deletePaciente = function(){
    if(!selected) return;
    var ref = doc(db,"pacientes",selected._fbId);
    deleteDoc(ref).then(function(){
      nfy("Paciente eliminado","ok");
      setConfirmDelPac(false);
      setSelected(null);
      loadPacientes();
    }).catch(function(e){ nfy("Error: " + e.message,"er"); });
  };

  var openEdit = function(pac){
    setSelected(pac);
    setEditForm({ dni: pac.dni||"", nombre: pac.nombre||"", colegio: pac.colegio||"", fechaNac: pac.fechaNac||"" });
    setEditing(true);
    setConfirmDelPac(false);
  };

  var openView = function(pac){ setSelected(pac); setEditing(false); setConfirmDelPac(false); };

  var getLastEval = function(pacDni){
    if(!pacDni) return null;
    var allEvals = [];
    if(evals) evals.forEach(function(ev){ if((ev.pacienteDni||"") === pacDni) allEvals.push({tipo:"ELDI", fecha:ev.fechaGuardado || ev.fechaEvaluacion || ""}); });
    if(peffEvals) peffEvals.forEach(function(ev){ if((ev.pacienteDni||ev.dni||"") === pacDni) allEvals.push({tipo:"PEFF", fecha:ev.fechaGuardado || ev.fechaEvaluacion || ""}); });
    if(repEvals) repEvals.forEach(function(ev){ if((ev.pacienteDni||"") === pacDni) allEvals.push({tipo:"REP", fecha:ev.fechaGuardado || ev.fechaEvaluacion || ""}); });
    if(discEvals) discEvals.forEach(function(ev){ if((ev.pacienteDni||"") === pacDni) allEvals.push({tipo:"DISC", fecha:ev.fechaGuardado || ev.fechaEvaluacion || ""}); });
    if(recoEvals) recoEvals.forEach(function(ev){ if((ev.pacienteDni||"") === pacDni) allEvals.push({tipo:"RECO", fecha:ev.fechaGuardado || ev.fechaEvaluacion || ""}); });
    if(allEvals.length === 0) return null;
    allEvals.sort(function(a,b){ return (b.fecha||"").localeCompare(a.fecha||""); });
    return allEvals[0];
  };

  var filtered = pacientes;
  if(busqueda.trim()){
    var q = busqueda.trim().toLowerCase();
    var dniQ = q.replace(/\D/g,"");
    filtered = pacientes.filter(function(p){
      if(dniQ && p.dni && p.dni.indexOf(dniQ) === 0) return true;
      if(p.nombre && p.nombre.toLowerCase().indexOf(q) >= 0) return true;
      return false;
    });
    filtered.sort(function(a,b){
      var aExact = dniQ && a.dni === dniQ ? 0 : 1;
      var bExact = dniQ && b.dni === dniQ ? 0 : 1;
      if(aExact !== bExact) return aExact - bExact;
      return (a.nombre||"").localeCompare(b.nombre||"");
    });
  }

  return (
    <div style={{animation:"fi .3s ease",width:"100%",maxWidth:900}}>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>{"\ud83d\udc67\ud83d\udc66 Pacientes"}</h1>
      <p style={{color:K.mt,fontSize:14,marginBottom:20}}>{"Gestiona los datos de tus pacientes"}</p>

      {!showForm && !editing && (
        <button onClick={function(){ setShowForm(true); setSelected(null); setConfirmDelPac(false); }}
          style={{background:"#0d9488",color:"#fff",border:"none",padding:"10px 20px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",marginBottom:20}}>
          {"+ Nuevo paciente"}
        </button>
      )}

      {showForm && !editing && (
        <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:24,marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <h3 style={{fontSize:16,fontWeight:700,color:"#0a3d2f",margin:0}}>Nuevo paciente</h3>
            <button onClick={function(){ setShowForm(false); }} style={{background:"none",border:"none",fontSize:18,color:K.mt,cursor:"pointer"}}>{"\u00d7"}</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>DNI (sin puntos)</label>
              <input value={form.dni} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{dni:e.target.value.replace(/\D/g,"").slice(0,8)}); }); }} style={IS} placeholder="Ej: 45123456" maxLength={8} inputMode="numeric" /></div>
            <div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Fecha de nacimiento</label>
              <input type="date" value={form.fechaNac} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{fechaNac:e.target.value}); }); }} style={IS} /></div>
            <div style={{gridColumn:"1/-1"}}><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Nombre completo (Apellido Nombre)</label>
              <input value={form.nombre} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{nombre:e.target.value}); }); }} style={IS} placeholder="Ej: Alonso Pepe" /></div>
            <div style={{gridColumn:"1/-1"}}><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>{"Jard\u00edn / Colegio"}</label>
              <input value={form.colegio} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{colegio:e.target.value}); }); }} style={IS} placeholder="Nombre del establecimiento" /></div>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:18}}>
            <button onClick={function(){ setShowForm(false); }} style={{background:"#f1f5f9",border:"none",padding:"10px 20px",borderRadius:8,fontSize:14,cursor:"pointer",color:K.mt}}>Cancelar</button>
            <button onClick={savePaciente} style={{background:"#0d9488",color:"#fff",border:"none",padding:"10px 24px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>Guardar</button>
          </div>
        </div>
      )}

      {editing && selected && (
        <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:24,marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <h3 style={{fontSize:16,fontWeight:700,color:"#0a3d2f",margin:0}}>Editar paciente</h3>
            <button onClick={function(){ setEditing(false); setSelected(null); }} style={{background:"none",border:"none",fontSize:18,color:K.mt,cursor:"pointer"}}>{"\u00d7"}</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>DNI (sin puntos)</label>
              <input value={editForm.dni} onChange={function(e){ setEditForm(function(p){ return Object.assign({},p,{dni:e.target.value.replace(/\D/g,"").slice(0,8)}); }); }} style={IS} maxLength={8} inputMode="numeric" /></div>
            <div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Fecha de nacimiento</label>
              <input type="date" value={editForm.fechaNac} onChange={function(e){ setEditForm(function(p){ return Object.assign({},p,{fechaNac:e.target.value}); }); }} style={IS} /></div>
            <div style={{gridColumn:"1/-1"}}><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Nombre completo (Apellido Nombre)</label>
              <input value={editForm.nombre} onChange={function(e){ setEditForm(function(p){ return Object.assign({},p,{nombre:e.target.value}); }); }} style={IS} /></div>
            <div style={{gridColumn:"1/-1"}}><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>{"Jard\u00edn / Colegio"}</label>
              <input value={editForm.colegio} onChange={function(e){ setEditForm(function(p){ return Object.assign({},p,{colegio:e.target.value}); }); }} style={IS} /></div>
          </div>
          <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:18}}>
            <button onClick={function(){ setEditing(false); setSelected(null); }} style={{background:"#f1f5f9",border:"none",padding:"10px 20px",borderRadius:8,fontSize:14,cursor:"pointer",color:K.mt}}>Cancelar</button>
            <button onClick={updatePaciente} style={{background:"#0d9488",color:"#fff",border:"none",padding:"10px 24px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>Actualizar</button>
          </div>
        </div>
      )}

      {selected && !editing && (
        <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:24,marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <h3 style={{fontSize:16,fontWeight:700,color:"#0a3d2f",margin:0}}>{"Ficha del paciente"}</h3>
            <div style={{display:"flex",gap:8}}>
              <button onClick={function(){ openEdit(selected); }} style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:6,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#0369a1"}}>Editar</button>
              <button onClick={function(){ setConfirmDelPac(true); }} style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:6,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#dc2626"}}>Eliminar</button>
              <button onClick={function(){ setSelected(null); setConfirmDelPac(false); }} style={{background:"#f1f5f9",border:"none",padding:"6px 14px",borderRadius:6,fontSize:12,cursor:"pointer",color:K.mt}}>{"\u00d7"}</button>
            </div>
          </div>

          {confirmDelPac && (
            <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"14px 20px",marginBottom:16,display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
              <div style={{fontSize:13,fontWeight:600,color:"#dc2626",textAlign:"center"}}>{"\u00bfEst\u00e1 seguro que desea eliminar este paciente?"}</div>
              <div style={{fontSize:12,color:"#64748b",textAlign:"center"}}>{"Esta acci\u00f3n es irreversible"}</div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={deletePaciente} style={{background:"#dc2626",color:"#fff",border:"none",padding:"8px 20px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>{"S\u00ed, eliminar"}</button>
                <button onClick={function(){ setConfirmDelPac(false); }} style={{background:"#f1f5f9",border:"1px solid #e2e8f0",padding:"8px 20px",borderRadius:8,fontSize:13,cursor:"pointer",color:"#64748b"}}>Cancelar</button>
              </div>
            </div>
          )}

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div><div style={{fontSize:11,fontWeight:600,color:K.mt}}>DNI</div><div style={{fontSize:15,fontWeight:600}}>{selected.dni}</div></div>
            <div><div style={{fontSize:11,fontWeight:600,color:K.mt}}>Edad</div><div style={{fontSize:15,fontWeight:600}}>{calcAge(selected.fechaNac)}</div></div>
            <div style={{gridColumn:"1/-1"}}><div style={{fontSize:11,fontWeight:600,color:K.mt}}>Nombre completo</div><div style={{fontSize:15,fontWeight:600}}>{selected.nombre}</div></div>
            <div><div style={{fontSize:11,fontWeight:600,color:K.mt}}>Fecha de nacimiento</div><div style={{fontSize:15}}>{selected.fechaNac ? new Date(selected.fechaNac+"T12:00:00").toLocaleDateString("es-AR") : "-"}</div></div>
            <div><div style={{fontSize:11,fontWeight:600,color:K.mt}}>{"Jard\u00edn / Colegio"}</div><div style={{fontSize:15}}>{selected.colegio || "-"}</div></div>
          </div>
          {(function(){
            var last = getLastEval(selected.dni);
            if(!last) return <div style={{marginTop:16,padding:"10px 14px",background:"#f8faf9",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,color:K.mt,fontStyle:"italic"}}>{"Sin evaluaciones registradas"}</div>;
            return <div style={{marginTop:16,padding:"12px 14px",background:"#f0fdf4",borderRadius:8,border:"1px solid #bbf7d0"}}>
              <div style={{fontSize:11,fontWeight:600,color:K.mt,marginBottom:4}}>{"\u00daltima evaluaci\u00f3n"}</div>
              <div style={{fontSize:14}}><span style={{fontWeight:700,color:"#0d9488"}}>{last.tipo}</span><span style={{color:K.mt}}>{" \u00b7 "}</span><span>{last.fecha ? new Date(last.fecha).toLocaleDateString("es-AR") : "-"}</span></div>
            </div>;
          })()}
        </div>
      )}

      <div style={{marginBottom:16}}>
        <input value={busqueda} onChange={function(e){ setBusqueda(e.target.value); setSelected(null); setEditing(false); setConfirmDelPac(false); }}
          style={Object.assign({},IS,{background:"#fff",fontSize:15})} placeholder={"Buscar por DNI o nombre..."} />
      </div>

      {loading ? (
        <div style={{textAlign:"center",padding:20,color:K.mt,fontSize:13}}>Cargando pacientes...</div>
      ) : filtered.length === 0 ? (
        <div style={{textAlign:"center",padding:20,color:K.mt,fontSize:13,fontStyle:"italic"}}>{busqueda.trim() ? "No se encontraron pacientes" : "No hay pacientes cargados"}</div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {filtered.map(function(pac){
            var isSelected = selected && selected._fbId === pac._fbId && !editing;
            var lastEv = getLastEval(pac.dni);
            return <div key={pac._fbId} onClick={function(){ openView(pac); }}
                style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:isSelected?"#ccfbf1":"#fff",borderRadius:10,border:"1px solid "+(isSelected?"#5eead4":"#e2e8f0"),cursor:"pointer",transition:"all .15s"}}>
                <div style={{width:40,height:40,borderRadius:10,background:"#f0f9ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{"\ud83d\udc64"}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:600,fontSize:14}}>{pac.nombre}</div>
                  <div style={{fontSize:11,color:K.mt}}>{"DNI: "}{pac.dni}{" \u00b7 "}{calcAge(pac.fechaNac)}{pac.colegio ? " \u00b7 " + pac.colegio : ""}</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  {lastEv ? <div><div style={{fontSize:11,fontWeight:600,color:"#0d9488"}}>{lastEv.tipo}</div><div style={{fontSize:10,color:K.mt}}>{lastEv.fecha ? new Date(lastEv.fecha).toLocaleDateString("es-AR") : ""}</div></div> : <div style={{fontSize:10,color:"#cbd5e1",fontStyle:"italic"}}>Sin eval.</div>}
                </div>
                <button onClick={function(e){ e.stopPropagation(); openEdit(pac); }} style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:6,padding:"6px 10px",fontSize:11,fontWeight:600,cursor:"pointer",color:"#0369a1",flexShrink:0}}>Editar</button>
              </div>;
          })}
          <div style={{textAlign:"center",fontSize:11,color:K.mt,padding:"8px 0"}}>{filtered.length + " paciente" + (filtered.length!==1?"s":"")}</div>
        </div>
      )}
    </div>
  );
}
