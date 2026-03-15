import { useState, useEffect, useCallback } from "react";
import { db, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from "../firebase.js";
import { K, ageLabel } from "../lib/fb.js";
import { renderReportText } from "../lib/evalUtils.jsx";
import { getEvalType } from "../config/evalTypes.js";

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

var IS = {width:"100%",padding:"10px 14px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,background:"#f8faf9"};

var RESP_TYPES = ["Madre","Padre","Tutor/a","Cuidador/a","Hermano/a","Otro"];

export default function PacientesPage({ userId, nfy, allEvals }){
  var _p = useState([]), pacientes = _p[0], setPacientes = _p[1];
  var _l = useState(true), loading = _l[0], setLoading = _l[1];
  var _q = useState(""), busqueda = _q[0], setBusqueda = _q[1];
  var _s = useState(null), selected = _s[0], setSelected = _s[1];
  var _e = useState(false), editing = _e[0], setEditing = _e[1];
  var _f = useState({dni:"",nombre:"",colegio:"",fechaNac:"",respNombre:"",respDni:"",respTel:"",respEmail:"",respTipo:"Madre",respTipoOtro:""}), form = _f[0], setForm = _f[1];
  var _ef = useState({dni:"",nombre:"",colegio:"",fechaNac:""}), editForm = _ef[0], setEditForm = _ef[1];
  var _sf = useState(false), showForm = _sf[0], setShowForm = _sf[1];
  var _cd = useState(false), confirmDelPac = _cd[0], setConfirmDelPac = _cd[1];
  var _consolReport = useState(null), consolReport = _consolReport[0], setConsolReport = _consolReport[1];
  var _consolGen = useState(false), consolGenerating = _consolGen[0], setConsolGenerating = _consolGen[1];

  var generateConsolidated = function(pac){
    var pacDni = pac.dni || "";
    var patientEvals = allEvals.filter(function(ev){ return (ev.pacienteDni||ev.dni||"") === pacDni; });
    if(patientEvals.length === 0){ nfy("No hay evaluaciones para este paciente","er"); return; }
    setConsolGenerating(true); setConsolReport(null);
    var summary = patientEvals.map(function(ev){
      var t = getEvalType(ev.tipo);
      return (t?t.fullName:ev.tipo) + " (" + new Date(ev.fechaGuardado||ev.fechaEvaluacion).toLocaleDateString("es-AR") + "): " + JSON.stringify(ev.resultados||{}).substring(0,300);
    }).join("\n");
    var evalData = {
      paciente: pac.nombre, pacienteDni: pac.dni, edadMeses: 0,
      fechaEvaluacion: new Date().toISOString().split("T")[0],
      observaciones: "Informe consolidado de " + patientEvals.length + " evaluaciones",
      resultados: { resumen: summary, cantEvals: patientEvals.length }
    };
    if(pac.fechaNac){
      var b=new Date(pac.fechaNac),n=new Date();
      evalData.edadMeses = (n.getFullYear()-b.getFullYear())*12+(n.getMonth()-b.getMonth());
    }
    fetch("/api/generate-report", {
      method: "POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ evalData: evalData, evalType: "consolidado", reportMode: "consolidado" })
    }).then(function(r){ return r.json(); })
    .then(function(data){
      if(data.success && data.report) setConsolReport(data.report);
      else nfy("Error al generar: " + (data.error||""),"er");
      setConsolGenerating(false);
    }).catch(function(e){ nfy("Error: " + e.message,"er"); setConsolGenerating(false); });
  };

  var loadPacientes = useCallback(function(){
    if(!userId) return; setLoading(true);
    var q2 = query(collection(db,"pacientes"), where("userId","==",userId));
    getDocs(q2).then(function(snap){
      var arr = snap.docs.map(function(d){ return Object.assign({_fbId:d.id},d.data()); });
      arr.sort(function(a,b){ return (a.nombre||"").localeCompare(b.nombre||""); });
      setPacientes(arr); setLoading(false);
    }).catch(function(e){ console.error(e); setLoading(false); });
  },[userId]);

  useEffect(function(){ loadPacientes(); },[loadPacientes]);

  var savePaciente = function(){
    var dni = (form.dni||"").replace(/\D/g,"").trim();
    var nombre = (form.nombre||"").trim();
    if(!dni || !nombre || !form.fechaNac){ nfy("Complete DNI, nombre y fecha de nacimiento","er"); return; }
    if(dni.length < 7 || dni.length > 8){ nfy("El DNI debe tener 7 u 8 dígitos","er"); return; }
    if(!(form.respTel||"").trim()){ nfy("El teléfono del responsable es obligatorio","er"); return; }
    if(pacientes.find(function(p){ return p.dni === dni; })){ nfy("Ya existe un paciente con DNI " + dni,"er"); return; }
    var responsable = {
      nombre: (form.respNombre||"").trim(),
      dni: (form.respDni||"").replace(/\D/g,"").trim(),
      telefono: (form.respTel||"").trim(),
      email: (form.respEmail||"").trim(),
      tipo: form.respTipo === "Otro" ? (form.respTipoOtro||"").trim() || "Otro" : form.respTipo
    };
    addDoc(collection(db,"pacientes"), { dni: dni, nombre: nombre, colegio: (form.colegio||"").trim(), fechaNac: form.fechaNac, responsable: responsable, userId: userId, createdAt: new Date().toISOString() }).then(function(){
      nfy("Paciente guardado","ok"); setForm({dni:"",nombre:"",colegio:"",fechaNac:"",respNombre:"",respDni:"",respTel:"",respEmail:"",respTipo:"Madre",respTipoOtro:""}); setShowForm(false); loadPacientes();
    }).catch(function(e){ nfy("Error: " + e.message,"er"); });
  };

  var updatePaciente = function(){
    if(!selected) return;
    var dni = (editForm.dni||"").replace(/\D/g,"").trim();
    var nombre = (editForm.nombre||"").trim();
    if(!dni || !nombre || !editForm.fechaNac){ nfy("Complete DNI, nombre y fecha de nacimiento","er"); return; }
    if(pacientes.find(function(p){ return p.dni === dni && p._fbId !== selected._fbId; })){ nfy("Ya existe otro paciente con DNI " + dni,"er"); return; }
    updateDoc(doc(db,"pacientes",selected._fbId), { dni: dni, nombre: nombre, colegio: (editForm.colegio||"").trim(), fechaNac: editForm.fechaNac }).then(function(){
      nfy("Paciente actualizado","ok"); setEditing(false); setSelected(null); loadPacientes();
    }).catch(function(e){ nfy("Error: " + e.message,"er"); });
  };

  var deletePaciente = function(){
    if(!selected) return;
    deleteDoc(doc(db,"pacientes",selected._fbId)).then(function(){
      nfy("Paciente eliminado","ok"); setConfirmDelPac(false); setSelected(null); loadPacientes();
    }).catch(function(e){ nfy("Error: " + e.message,"er"); });
  };

  var openEdit = function(pac){ setSelected(pac); setEditForm({ dni: pac.dni||"", nombre: pac.nombre||"", colegio: pac.colegio||"", fechaNac: pac.fechaNac||"" }); setEditing(true); setConfirmDelPac(false); };
  var openView = function(pac){ setSelected(pac); setEditing(false); setConfirmDelPac(false); setConsolReport(null); };

  var getLastEval = function(pacDni){
    if(!pacDni || !allEvals) return null;
    var matching = allEvals.filter(function(ev){ return (ev.pacienteDni||ev.dni||"") === pacDni && ev.tipo !== "eldi"; });
    if(matching.length === 0) return null;
    matching.sort(function(a,b){ return (b.fechaGuardado||"").localeCompare(a.fechaGuardado||""); });
    return { tipo: (matching[0].tipo||"").toUpperCase(), fecha: matching[0].fechaGuardado || matching[0].fechaEvaluacion || "" };
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
  }

  return (
    <div style={{animation:"fi .3s ease",width:"100%",maxWidth:900}}>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>{"👧👦 Pacientes"}</h1>
      <p style={{color:K.mt,fontSize:14,marginBottom:20}}>Gestiona los datos de tus pacientes</p>

      {!showForm && !editing && <button onClick={function(){ setShowForm(true); setSelected(null); setConfirmDelPac(false); }} style={{background:"#0d9488",color:"#fff",border:"none",padding:"10px 20px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",marginBottom:20}}>+ Nuevo paciente</button>}

      {showForm && !editing && <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:24,marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h3 style={{fontSize:16,fontWeight:700,color:"#0a3d2f",margin:0}}>Nuevo paciente</h3><button onClick={function(){ setShowForm(false); }} style={{background:"none",border:"none",fontSize:18,color:K.mt,cursor:"pointer"}}>×</button></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>DNI (sin puntos)</label><input value={form.dni} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{dni:e.target.value.replace(/\D/g,"").slice(0,8)}); }); }} style={IS} placeholder="Introducir DNI" maxLength={8} inputMode="numeric" /></div>
          <div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Fecha de nacimiento</label><input type="date" value={form.fechaNac} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{fechaNac:e.target.value}); }); }} style={IS} /></div>
          <div style={{gridColumn:"1/-1"}}><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Nombre completo</label><input value={form.nombre} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{nombre:e.target.value}); }); }} style={IS} placeholder="Apellido Nombre" /></div>
          <div style={{gridColumn:"1/-1"}}><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>{"Jardín / Colegio"}</label><input value={form.colegio} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{colegio:e.target.value}); }); }} style={IS} placeholder="Establecimiento" /></div>
        </div>

        {/* RESPONSABLE */}
        <div style={{marginTop:20,paddingTop:18,borderTop:"1px solid #e2e8f0"}}>
          <h4 style={{fontSize:14,fontWeight:700,color:"#0a3d2f",marginBottom:4}}>{"Información del responsable"}</h4>
          <p style={{fontSize:11,color:K.mt,marginBottom:14}}>Datos de contacto del adulto responsable del paciente</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{gridColumn:"1/-1"}}><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Nombre y Apellido</label><input value={form.respNombre} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{respNombre:e.target.value}); }); }} style={IS} placeholder="Nombre del responsable" /></div>
            <div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>DNI <span style={{fontWeight:400,color:"#94a3b8"}}>(opcional)</span></label><input value={form.respDni} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{respDni:e.target.value.replace(/\D/g,"").slice(0,8)}); }); }} style={IS} placeholder="DNI del responsable" maxLength={8} inputMode="numeric" /></div>
            <div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>{"Teléfono"} <span style={{color:"#dc2626"}}>*</span></label><input value={form.respTel} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{respTel:e.target.value}); }); }} style={IS} placeholder="Ej: +54 351 1234567" /></div>
            <div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Email <span style={{fontWeight:400,color:"#94a3b8"}}>(recomendado)</span></label><input type="email" value={form.respEmail} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{respEmail:e.target.value}); }); }} style={IS} placeholder="correo@ejemplo.com" /></div>
            <div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Tipo de responsable</label><select value={form.respTipo} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{respTipo:e.target.value}); }); }} style={Object.assign({},IS,{cursor:"pointer"})}>{RESP_TYPES.map(function(t){ return <option key={t} value={t}>{t}</option>; })}</select></div>
            {form.respTipo==="Otro"&&<div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Especificar</label><input value={form.respTipoOtro} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{respTipoOtro:e.target.value}); }); }} style={IS} placeholder="Tipo de vínculo" /></div>}
          </div>
        </div>

        <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:18}}>
          <button onClick={function(){ setShowForm(false); }} style={{background:"#f1f5f9",border:"none",padding:"10px 20px",borderRadius:8,fontSize:14,cursor:"pointer",color:K.mt}}>Cancelar</button>
          <button onClick={savePaciente} style={{background:"#0d9488",color:"#fff",border:"none",padding:"10px 24px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>Guardar</button>
        </div>
      </div>}

      {editing && selected && <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:24,marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h3 style={{fontSize:16,fontWeight:700,color:"#0a3d2f",margin:0}}>Editar paciente</h3><button onClick={function(){ setEditing(false); setSelected(null); }} style={{background:"none",border:"none",fontSize:18,color:K.mt,cursor:"pointer"}}>×</button></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>DNI</label><input value={editForm.dni} onChange={function(e){ setEditForm(function(p){ return Object.assign({},p,{dni:e.target.value.replace(/\D/g,"").slice(0,8)}); }); }} style={IS} maxLength={8} inputMode="numeric" /></div>
          <div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Fecha de nacimiento</label><input type="date" value={editForm.fechaNac} onChange={function(e){ setEditForm(function(p){ return Object.assign({},p,{fechaNac:e.target.value}); }); }} style={IS} /></div>
          <div style={{gridColumn:"1/-1"}}><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Nombre completo</label><input value={editForm.nombre} onChange={function(e){ setEditForm(function(p){ return Object.assign({},p,{nombre:e.target.value}); }); }} style={IS} /></div>
          <div style={{gridColumn:"1/-1"}}><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>{"Jardín / Colegio"}</label><input value={editForm.colegio} onChange={function(e){ setEditForm(function(p){ return Object.assign({},p,{colegio:e.target.value}); }); }} style={IS} /></div>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:18}}>
          <button onClick={function(){ setEditing(false); setSelected(null); }} style={{background:"#f1f5f9",border:"none",padding:"10px 20px",borderRadius:8,fontSize:14,cursor:"pointer",color:K.mt}}>Cancelar</button>
          <button onClick={updatePaciente} style={{background:"#0d9488",color:"#fff",border:"none",padding:"10px 24px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>Actualizar</button>
        </div>
      </div>}

      {selected && !editing && <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:24,marginBottom:20}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <h3 style={{fontSize:16,fontWeight:700,color:"#0a3d2f",margin:0}}>Ficha del paciente</h3>
          <div style={{display:"flex",gap:8}}>
            <button onClick={function(){ openEdit(selected); }} style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:6,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#0369a1"}}>Editar</button>
            <button onClick={function(){ setConfirmDelPac(true); }} style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:6,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer",color:"#dc2626"}}>Eliminar</button>
            <button onClick={function(){ setSelected(null); setConfirmDelPac(false); }} style={{background:"#f1f5f9",border:"none",padding:"6px 14px",borderRadius:6,fontSize:12,cursor:"pointer",color:K.mt}}>×</button>
          </div>
        </div>
        {confirmDelPac && <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:10,padding:"14px 20px",marginBottom:16,display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
          <div style={{fontSize:13,fontWeight:600,color:"#dc2626",textAlign:"center"}}>{"¿Eliminar este paciente?"}</div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={deletePaciente} style={{background:"#dc2626",color:"#fff",border:"none",padding:"8px 20px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>{"Sí, eliminar"}</button>
            <button onClick={function(){ setConfirmDelPac(false); }} style={{background:"#f1f5f9",border:"1px solid #e2e8f0",padding:"8px 20px",borderRadius:8,fontSize:13,cursor:"pointer",color:"#64748b"}}>Cancelar</button>
          </div>
        </div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div><div style={{fontSize:11,fontWeight:600,color:K.mt}}>DNI</div><div style={{fontSize:15,fontWeight:600}}>{selected.dni}</div></div>
          <div><div style={{fontSize:11,fontWeight:600,color:K.mt}}>Edad</div><div style={{fontSize:15,fontWeight:600}}>{calcAge(selected.fechaNac)}</div></div>
          <div style={{gridColumn:"1/-1"}}><div style={{fontSize:11,fontWeight:600,color:K.mt}}>Nombre</div><div style={{fontSize:15,fontWeight:600}}>{selected.nombre}</div></div>
          <div><div style={{fontSize:11,fontWeight:600,color:K.mt}}>Fecha nac.</div><div style={{fontSize:15}}>{selected.fechaNac ? new Date(selected.fechaNac+"T12:00:00").toLocaleDateString("es-AR") : "-"}</div></div>
          <div><div style={{fontSize:11,fontWeight:600,color:K.mt}}>Colegio</div><div style={{fontSize:15}}>{selected.colegio || "-"}</div></div>
        </div>
        {selected.responsable && <div style={{marginTop:16,padding:"14px 16px",background:"#f0f9ff",borderRadius:10,border:"1px solid #bae6fd"}}>
          <div style={{fontSize:12,fontWeight:700,color:"#0369a1",marginBottom:8}}>Responsable</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,fontSize:13}}>
            <div><span style={{color:K.mt}}>Nombre: </span><b>{selected.responsable.nombre || "-"}</b></div>
            <div><span style={{color:K.mt}}>Tipo: </span><b>{selected.responsable.tipo || "-"}</b></div>
            <div><span style={{color:K.mt}}>Tel: </span><b>{selected.responsable.telefono || "-"}</b></div>
            <div><span style={{color:K.mt}}>Email: </span><b>{selected.responsable.email || "-"}</b></div>
            {selected.responsable.dni && <div><span style={{color:K.mt}}>DNI: </span><b>{selected.responsable.dni}</b></div>}
          </div>
        </div>}
        {(function(){ var last = getLastEval(selected.dni); if(!last) return <div style={{marginTop:16,padding:"10px 14px",background:"#f8faf9",borderRadius:8,border:"1px solid #e2e8f0",fontSize:12,color:K.mt,fontStyle:"italic"}}>Sin evaluaciones registradas</div>; return <div style={{marginTop:16,padding:"12px 14px",background:"#f0fdf4",borderRadius:8,border:"1px solid #bbf7d0"}}><div style={{fontSize:11,fontWeight:600,color:K.mt,marginBottom:4}}>{"Última evaluación"}</div><div style={{fontSize:14}}><span style={{fontWeight:700,color:"#0d9488"}}>{last.tipo}</span>{" - "}{last.fecha ? new Date(last.fecha).toLocaleDateString("es-AR") : "-"}</div></div>; })()}
        {(function(){
          var pacEvals = allEvals.filter(function(ev){ return (ev.pacienteDni||ev.dni||"") === (selected.dni||""); });
          if(pacEvals.length < 1) return null;
          return <div style={{marginTop:16}}>
            {!consolReport && !consolGenerating && <button onClick={function(){generateConsolidated(selected)}} style={{width:"100%",padding:"12px",background:"linear-gradient(135deg,#7c3aed,#6d28d9)",color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:"pointer"}}>{"Generar Informe Consolidado (" + pacEvals.length + " evaluaciones)"}</button>}
            {consolGenerating && <div style={{background:"#fff",borderRadius:10,border:"1px solid #e2e8f0",padding:20,textAlign:"center"}}>
              <div style={{display:"inline-block",width:30,height:30,border:"3px solid #e2e8f0",borderTopColor:"#7c3aed",borderRadius:"50%",animation:"spin 1s linear infinite",marginBottom:8}} />
              <div style={{fontSize:13,fontWeight:600,color:"#0a3d2f"}}>Generando informe consolidado...</div>
              <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
            </div>}
            {consolReport && <div style={{background:"#fff",borderRadius:12,border:"2px solid #7c3aed",padding:24,marginTop:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                <div style={{fontSize:15,fontWeight:700,color:"#7c3aed"}}>Informe Consolidado</div>
                <button onClick={function(){
                  import("jspdf").then(function(mod){
                    var jsPDF=mod.jsPDF,pdf=new jsPDF("p","mm","a4"),margin=14,maxW=182,y=14;
                    pdf.setFontSize(8);pdf.setTextColor(120);pdf.text("Informe Consolidado - "+selected.nombre,margin,y);y+=8;
                    pdf.setDrawColor(200);pdf.line(margin,y,196,y);y+=8;
                    pdf.setFontSize(14);pdf.setTextColor(10,61,47);pdf.setFont(undefined,"bold");pdf.text(selected.nombre,margin,y);y+=7;
                    pdf.setFontSize(9);pdf.setTextColor(100);pdf.setFont(undefined,"normal");pdf.text("DNI: "+(selected.dni||"N/A"),margin,y);y+=10;
                    consolReport.split("\n").forEach(function(line){
                      var t=line.trim();if(!t){y+=3;return;}
                      var isT=/^[A-Z\u00c0-\u00dc\s\d\.\:\-]{6,}:?\s*$/.test(t);
                      if(isT){y+=3;pdf.setFontSize(10);pdf.setTextColor(10,61,47);pdf.setFont(undefined,"bold");if(y+7>283){pdf.addPage();y=14;}pdf.text(t,margin,y);y+=7;pdf.setFont(undefined,"normal");}
                      else{pdf.setFontSize(9);pdf.setTextColor(51,65,85);var w=pdf.splitTextToSize(t,maxW);w.forEach(function(l){if(y+5>283){pdf.addPage();y=14;}pdf.text(l,margin,y);y+=5;});}
                    });
                    pdf.save("Consolidado_"+selected.nombre.replace(/\s/g,"_")+".pdf");
                  });
                }} style={{padding:"6px 12px",background:"#7c3aed",color:"#fff",border:"none",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer"}}>Imprimir</button>
              </div>
              <div style={{fontSize:13,lineHeight:1.7}}>{renderReportText(consolReport)}</div>
              <div style={{marginTop:14,paddingTop:8,borderTop:"1px solid #e2e8f0",fontSize:9,color:"#94a3b8",textAlign:"center"}}>{"Brújula KIT — Informe Consolidado — " + new Date().toLocaleDateString("es-AR")}</div>
            </div>}
          </div>;
        })()}
      </div>}

      <div style={{marginBottom:16}}>
        <input value={busqueda} onChange={function(e){ setBusqueda(e.target.value); setSelected(null); setEditing(false); setConfirmDelPac(false); }} style={Object.assign({},IS,{background:"#fff",fontSize:15})} placeholder="Buscar por DNI o nombre..." />
      </div>

      {loading ? <div style={{textAlign:"center",padding:20,color:K.mt,fontSize:13}}>Cargando pacientes...</div> : filtered.length === 0 ? <div style={{textAlign:"center",padding:20,color:K.mt,fontSize:13,fontStyle:"italic"}}>{busqueda.trim() ? "No se encontraron pacientes" : "No hay pacientes cargados"}</div> :
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {filtered.map(function(pac){
            var isSelected = selected && selected._fbId === pac._fbId && !editing;
            var lastEv = getLastEval(pac.dni);
            return <div key={pac._fbId} onClick={function(){ openView(pac); }} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:isSelected?"#ccfbf1":"#fff",borderRadius:10,border:"1px solid "+(isSelected?"#5eead4":"#e2e8f0"),cursor:"pointer"}}>
              <div style={{width:40,height:40,borderRadius:10,background:"#f0f9ff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{"👤"}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:14}}>{pac.nombre}</div>
                <div style={{fontSize:11,color:K.mt}}>{"DNI: " + pac.dni + " · " + calcAge(pac.fechaNac) + (pac.colegio ? " · " + pac.colegio : "")}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                {lastEv ? <div><div style={{fontSize:11,fontWeight:600,color:"#0d9488"}}>{lastEv.tipo}</div><div style={{fontSize:10,color:K.mt}}>{lastEv.fecha ? new Date(lastEv.fecha).toLocaleDateString("es-AR") : ""}</div></div> : <div style={{fontSize:10,color:"#cbd5e1",fontStyle:"italic"}}>Sin eval.</div>}
              </div>
              <button onClick={function(e){ e.stopPropagation(); openEdit(pac); }} style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:6,padding:"6px 10px",fontSize:11,fontWeight:600,cursor:"pointer",color:"#0369a1",flexShrink:0}}>Editar</button>
            </div>;
          })}
          <div style={{textAlign:"center",fontSize:11,color:K.mt,padding:"8px 0"}}>{filtered.length + " paciente" + (filtered.length!==1?"s":"")}</div>
        </div>}
    </div>
  );
}
