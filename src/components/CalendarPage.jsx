import { useState, useEffect, useCallback } from "react";
import { db, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc, query, where } from "../firebase.js";
import "../styles/CalendarPage.css";

const K = { mt: "#64748b", ac: "#0d9488", sd: "#0a3d2f" };
const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const COLORS = [
  { id: "red", hex: "#dc2626", label: "Urgente" },
  { id: "blue", hex: "#2563eb", label: "Control" },
  { id: "green", hex: "#059669", label: "Reevaluación" },
  { id: "yellow", hex: "#d97706", label: "Primera vez" },
  { id: "violet", hex: "#7c3aed", label: "Seguimiento" }
];

const EVAL_TYPES = ["Examen Clínico OFA", "Evaluación Fonética", "Repetición de palabras", "Discriminación Fonológica", "Reconocimiento Fonológico"];
const STATUS_LIST = ["pendiente", "realizada", "cancelada"];

const pad = n => String(n).padStart(2, "0");
const dateKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

function calcAge(birthStr){
  if(!birthStr) return "";
  var b = new Date(birthStr); var now = new Date();
  var years = now.getFullYear() - b.getFullYear();
  var months = now.getMonth() - b.getMonth();
  if(now.getDate() < b.getDate()) months--;
  if(months < 0){ years--; months += 12; }
  if(years < 1) return months + (months===1?" mes":" meses");
  return years + (years===1?" año":" años") + (months > 0 ? ", " + months + " m" : "");
}

async function sendCitaEmail(pacienteDni, pacienteNombre, fecha, hora, tipo, notas, userId, userSettings, profesional) {
  if (!pacienteDni || !userId) return;
  if (userSettings && userSettings.autoEmailCita === false) return;
  try {
    const pacQuery = query(collection(db, "pacientes"), where("userId", "==", userId), where("dni", "==", pacienteDni));
    const pacSnap = await getDocs(pacQuery);
    if (pacSnap.empty) return;
    const pacData = pacSnap.docs[0].data();
    const email = pacData.responsable?.email;
    if (!email) return;
    let consultorio = null;
    if (userSettings) {
      const cNombre = userSettings.consultorioNombre, cDir = userSettings.consultorioDireccion, cTel = userSettings.consultorioTelefono, cEmail = userSettings.consultorioEmail;
      if (cNombre || cDir || cTel || cEmail) consultorio = { nombre: cNombre || "", direccion: cDir || "", telefono: cTel || "", email: cEmail || "" };
    }
    const res = await fetch("/api/send-cita-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: email, paciente: pacienteNombre, fecha, hora: hora || "", tipo: tipo || "", notas: notas || "", consultorio, profesional: profesional || "" }) });
    const data = await res.json();
    if (data.success) console.log("Email de cita enviado a:", email);
    else console.warn("Error enviando email:", data.error);
  } catch (e) { console.warn("Error enviando email de cita:", e.message); }
}

export default function CalendarPage({ userId, nfy, userSettings, profesionalNombre }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selDay, setSelDay] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ paciente: "", tipo: EVAL_TYPES[0], notas: "", hora: "09:00", estado: "pendiente", color: "blue", pacienteDni: "", pacienteFechaNac: "" });
  const [pacientes, setPacientes] = useState([]);
  const [showPacSearch, setShowPacSearch] = useState(false);
  const [pacSearchQuery, setPacSearchQuery] = useState("");
  const [selectedPac, setSelectedPac] = useState(null);

  const loadCitas = useCallback(async () => { if (!userId) return; setLoading(true); try { const q2 = query(collection(db, "citas"), where("userId", "==", userId)); const snap = await getDocs(q2); setCitas(snap.docs.map(d => ({ _fbId: d.id, ...d.data() }))); } catch (e) { console.error("Error cargando citas:", e); } setLoading(false); }, [userId, year, month]);
  useEffect(() => { if(!userId) return; const q2 = query(collection(db, "pacientes"), where("userId", "==", userId)); getDocs(q2).then(snap => { setPacientes(snap.docs.map(d => ({ _fbId: d.id, ...d.data() }))); }).catch(e => console.error(e)); }, [userId]);
  useEffect(() => { loadCitas(); }, [loadCitas]);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };
  const goToday = () => { setYear(new Date().getFullYear()); setMonth(new Date().getMonth()); };
  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isToday = (d) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
  const getCitasForDay = (d) => { const key = dateKey(year, month, d); return citas.filter(c => c.fecha === key); };

  const openNewForm = (d) => { setSelDay(d); setEditId(null); setSelectedPac(null); setShowPacSearch(false); setPacSearchQuery(""); setForm({ paciente: "", tipo: EVAL_TYPES[0], notas: "", hora: "09:00", estado: "pendiente", color: "blue", pacienteDni: "", pacienteFechaNac: "" }); setShowForm(true); };
  const openDayView = (d) => { setSelDay(d); setShowForm(false); setEditId(null); };
  const handleDayClick = (d) => { const dc = getCitasForDay(d); if (dc.length > 0) openDayView(d); else openNewForm(d); };
  const startEdit = (cita) => { setEditId(cita._fbId); setSelectedPac(null); setShowPacSearch(false); setPacSearchQuery(""); setForm({ paciente: cita.paciente || "", tipo: cita.tipo || EVAL_TYPES[0], notas: cita.notas || "", hora: cita.hora || "09:00", estado: cita.estado || "pendiente", color: cita.color || "blue", pacienteDni: cita.pacienteDni || "", pacienteFechaNac: cita.pacienteFechaNac || "" }); setShowForm(true); };

  // Dynamic search: filter pacientes by DNI or name
  const getFilteredPacientes = () => {
    const q = pacSearchQuery.trim().toLowerCase();
    if (!q) return [];
    const dniOnly = q.replace(/\D/g, "");
    var results = pacientes.filter(function(p) {
      if (dniOnly && p.dni && p.dni.indexOf(dniOnly) === 0) return true;
      if (p.nombre && p.nombre.toLowerCase().indexOf(q) >= 0) return true;
      return false;
    });
    return results.slice(0, 6);
  };

  const selectPaciente = (pac) => {
    setSelectedPac(pac);
    setPacSearchQuery("");
    setForm(p => ({ ...p, paciente: pac.nombre, pacienteDni: pac.dni, pacienteFechaNac: pac.fechaNac || "" }));
  };

  const clearPacSelection = () => { setSelectedPac(null); setPacSearchQuery(""); setShowPacSearch(false); setForm(p => ({ ...p, paciente: "", pacienteDni: "", pacienteFechaNac: "" })); };

  const saveCita = async () => {
    if (!form.paciente.trim()) { nfy("Ingrese nombre del paciente", "er"); return; }
    const key = dateKey(year, month, selDay);
    const data = { ...form, paciente: form.paciente.trim(), fecha: key, userId, updatedAt: new Date().toISOString() };
    const isNewCita = !editId;
    try {
      if (editId) { await updateDoc(doc(db, "citas", editId), data); nfy("Cita actualizada", "ok"); }
      else { data.createdAt = new Date().toISOString(); await addDoc(collection(db, "citas"), data); nfy("Cita guardada", "ok"); }
      await loadCitas(); setShowForm(false); setEditId(null); setSelectedPac(null); setShowPacSearch(false);
      if (isNewCita && form.pacienteDni) { sendCitaEmail(form.pacienteDni, form.paciente.trim(), key, form.hora, form.tipo, form.notas, userId, userSettings, profesionalNombre).catch(() => {}); }
    } catch (e) { nfy("Error: " + e.message, "er"); }
  };

  const deleteCita = async (fbId) => { if (!window.confirm("Eliminar esta cita?")) return; try { await deleteDoc(doc(db, "citas", fbId)); nfy("Cita eliminada", "ok"); await loadCitas(); } catch (e) { nfy("Error: " + e.message, "er"); } };
  const getColorHex = (id) => COLORS.find(c => c.id === id)?.hex || "#2563eb";
  const dayCitas = selDay ? getCitasForDay(selDay) : [];
  const filteredPacs = showPacSearch && !selectedPac ? getFilteredPacientes() : [];

  return (
    <div className="cal-page">
      <h1 className="cal-title">{"📅 Calendario de Citas"}</h1>
      <p className="cal-subtitle">{"Organizá tu agenda de evaluaciones"}</p>
      <div className="cal-nav">
        <button onClick={prevMonth} className="cal-nav-btn">{"←"}</button>
        <div className="cal-nav-center">
          <div className="cal-nav-month">{MONTHS[month]} {year}</div>
          <button onClick={goToday} className="cal-today-btn">Ir a hoy</button>
        </div>
        <button onClick={nextMonth} className="cal-nav-btn">{"→"}</button>
      </div>
      <div className="cal-legend">{COLORS.map(c => (<div key={c.id} className="cal-legend-item"><div className="cal-legend-swatch" style={{ background: c.hex }} />{c.label}</div>))}</div>

      <div className="cal-grid-wrap">
        <div className="cal-grid-header">{DAYS.map(d => (<div key={d} className="cal-grid-day-label">{d}</div>))}</div>
        <div className="cal-grid">
          {Array.from({ length: offset }).map((_, i) => (<div key={"e" + i} className="cal-day-empty" />))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1; const dc = getCitasForDay(d); const isT = isToday(d); const isSel = selDay === d;
            return (<div key={d} onClick={() => handleDayClick(d)} className={"cal-day"+(isSel?" cal-day--selected":isT?" cal-day--today":"")}>
              <div className={"cal-day-num"+(isT?" cal-day-num--today":"")}>{d}</div>
              {dc.slice(0, 2).map((c, ci) => (<div key={ci} className="cal-day-event" style={{ background: getColorHex(c.color) + "22", borderLeft: `3px solid ${getColorHex(c.color)}` }}>{c.hora ? c.hora.substring(0, 5) + " " : ""}{c.paciente}</div>))}
              {dc.length > 2 && <div className="cal-day-more">+{dc.length - 2} más</div>}
            </div>);
          })}
        </div>
      </div>

      {selDay && !showForm && (<div className="cal-detail">
        <div className="cal-detail-header">
          <h3 className="cal-detail-title">{selDay} de {MONTHS[month]} {year}</h3>
          <div className="cal-detail-actions">
            <button onClick={() => openNewForm(selDay)} className="cal-btn-add">+ Nueva cita</button>
            <button onClick={() => setSelDay(null)} className="cal-btn-close">×</button>
          </div>
        </div>
        {dayCitas.length === 0 ? (<p className="cal-empty-msg">{"No hay citas para este día"}</p>) :
          dayCitas.sort((a, b) => (a.hora || "").localeCompare(b.hora || "")).map(c => (<div key={c._fbId} className="cal-cita" style={{ borderLeft: `4px solid ${getColorHex(c.color)}` }}>
            <div className="cal-cita-info">
              <div className="cal-cita-header">
                <span className="cal-cita-name">{c.paciente}</span>
                <span className="cal-cita-tipo" style={{ background: getColorHex(c.color) + "22", color: getColorHex(c.color) }}>{c.tipo}</span>
                <span className={"cal-cita-estado cal-cita-estado--"+c.estado}>{c.estado}</span>
              </div>
              {c.hora && <div className="cal-cita-hora">Hora: {c.hora}</div>}
              {c.notas && <div className="cal-cita-notas">{c.notas}</div>}
            </div>
            <div className="cal-cita-actions">
              <button onClick={(e) => { e.stopPropagation(); startEdit(c); }} className="cal-btn-edit">Editar</button>
              <button onClick={(e) => { e.stopPropagation(); deleteCita(c._fbId); }} className="cal-btn-delete">Eliminar</button>
            </div>
          </div>))}
      </div>)}

      {showForm && selDay && (<div className="cal-form-card">
        <div className="cal-detail-header">
          <h3 className="cal-detail-title">{editId ? "Editar cita" : "Nueva cita"} – {selDay} de {MONTHS[month]}</h3>
          <button onClick={() => { setShowForm(false); setEditId(null); setSelectedPac(null); setShowPacSearch(false); }} style={{ background: "none", border: "none", fontSize: 18, color: "var(--c-text-muted)", cursor: "pointer" }}>×</button>
        </div>
        <div className="cal-form-grid">
          <div className="cal-form-field-full">
            <label className="cal-label">Nombre del paciente</label>
            <div className="cal-patient-row">
              <input value={form.paciente} onChange={e => setForm(p => ({ ...p, paciente: e.target.value }))} className="cal-input cal-patient-input" placeholder="Nombre y apellido" disabled={!!selectedPac} />
              {!selectedPac && <button onClick={() => { setShowPacSearch(!showPacSearch); setPacSearchQuery(""); }} className={"cal-btn-search"+(showPacSearch?" cal-btn-search--active":"")}>{showPacSearch ? "Cancelar" : "Seleccionar paciente"}</button>}
              {selectedPac && <button onClick={clearPacSelection} className="cal-btn-clear-patient">Quitar</button>}
            </div>
            {showPacSearch && !selectedPac && <div className="cal-search-box">
              <label className="cal-search-label">Buscar por DNI o nombre</label>
              <input value={pacSearchQuery} onChange={e => setPacSearchQuery(e.target.value)} className="cal-input cal-search-input" placeholder="Escribí DNI o nombre del paciente..." autoFocus />
              {pacSearchQuery.trim().length > 0 && filteredPacs.length > 0 && <div className="cal-search-results">
                {filteredPacs.map(function(pac) {
                  return <button key={pac._fbId} onClick={function(){ selectPaciente(pac); setShowPacSearch(false); }} className="cal-search-result">
                    <div className="cal-search-avatar">{"👤"}</div>
                    <div className="cal-search-info">
                      <div className="cal-search-name">{pac.nombre} <span className="cal-search-dni">{"- DNI: " + pac.dni}</span></div>
                      {pac.fechaNac && <div className="cal-search-age">{calcAge(pac.fechaNac)}</div>}
                    </div>
                  </button>;
                })}
              </div>}
              {pacSearchQuery.trim().length > 0 && filteredPacs.length === 0 && <div className="cal-search-empty">{"No se encontraron pacientes"}</div>}
            </div>}
            {selectedPac && <div className="cal-selected-pac">
              <div className="cal-selected-title">Paciente seleccionado</div>
              <div className="cal-selected-grid">
                <div><span className="cal-selected-key">Nombre: </span><b>{selectedPac.nombre}</b></div>
                <div><span className="cal-selected-key">DNI: </span><b>{selectedPac.dni}</b></div>
                <div><span className="cal-selected-key">Edad: </span><b>{calcAge(selectedPac.fechaNac)}</b></div>
                {selectedPac.colegio && <div><span className="cal-selected-key">Colegio: </span><b>{selectedPac.colegio}</b></div>}
              </div>
              {selectedPac.responsable?.email && <div className="cal-email-ok">{"📧 Se enviará recordatorio a: " + selectedPac.responsable.email}</div>}
              {!selectedPac.responsable?.email && <div className="cal-email-warn">{"⚠️ El responsable no tiene email registrado, no se enviará recordatorio"}</div>}
            </div>}
          </div>
          <div>
            <label className="cal-label">{"Tipo de evaluación"}</label>
            <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))} className="cal-input cal-select">{EVAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select>
          </div>
          <div><label className="cal-label">Hora</label><input type="time" value={form.hora} onChange={e => setForm(p => ({ ...p, hora: e.target.value }))} className="cal-input" /></div>
          <div><label className="cal-label">Estado</label><select value={form.estado} onChange={e => setForm(p => ({ ...p, estado: e.target.value }))} className="cal-input cal-select">{STATUS_LIST.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}</select></div>
          <div>
            <label className="cal-label">{"Color / Categoría"}</label>
            <div className="cal-color-picker">{COLORS.map(c => (<button key={c.id} onClick={() => setForm(p => ({ ...p, color: c.id }))} title={c.label} className={"cal-color-swatch"+(form.color===c.id?" cal-color-swatch--sel":"")} style={{ background: c.hex }}>{form.color === c.id ? "✓" : ""}</button>))}</div>
            <div className="cal-color-label">{COLORS.find(c => c.id === form.color)?.label || ""}</div>
          </div>
          <div className="cal-form-field-full"><label className="cal-label">{"Notas clínicas"}</label><textarea value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))} rows={3} className="cal-input cal-textarea" placeholder={"Observaciones, objetivos de la sesión..."} /></div>
        </div>
        <div className="cal-form-actions">
          <button onClick={() => { setShowForm(false); setEditId(null); setSelectedPac(null); setShowPacSearch(false); }} className="cal-btn-cancel">Cancelar</button>
          <button onClick={saveCita} className="cal-btn-save">{editId ? "Actualizar" : "Guardar"}</button>
        </div>
      </div>)}
      {loading && <div className="cal-loading">Cargando citas...</div>}
    </div>
  );
}
