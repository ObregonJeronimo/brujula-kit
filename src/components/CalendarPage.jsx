import { useState, useEffect, useCallback } from "react";
import { db, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from "../firebase.js";

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

const EVAL_TYPES = ["ELDI", "PEFF", "CELF-5", "ADOS-2", "PLS-5", "Otro"];
const STATUS_LIST = ["pendiente", "realizada", "cancelada"];

const pad = n => String(n).padStart(2, "0");
const dateKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

export default function CalendarPage({ userId, nfy }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selDay, setSelDay] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ paciente: "", tipo: "ELDI", notas: "", hora: "09:00", estado: "pendiente", color: "blue" });

  const loadCitas = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const q2 = query(collection(db, "citas"), where("userId", "==", userId));
      const snap = await getDocs(q2);
      const all = snap.docs.map(d => ({ _fbId: d.id, ...d.data() }));
      setCitas(all);
    } catch (e) { console.error("Error cargando citas:", e); }
    setLoading(false);
  }, [userId, year, month]);

  useEffect(() => { loadCitas(); }, [loadCitas]);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };
  const goToday = () => { setYear(new Date().getFullYear()); setMonth(new Date().getMonth()); };

  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const isToday = (d) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  const getCitasForDay = (d) => {
    const key = dateKey(year, month, d);
    return citas.filter(c => c.fecha === key);
  };

  const openNewForm = (d) => {
    setSelDay(d);
    setEditId(null);
    setForm({ paciente: "", tipo: "ELDI", notas: "", hora: "09:00", estado: "pendiente", color: "blue" });
    setShowForm(true);
  };

  const openDayView = (d) => {
    setSelDay(d);
    setShowForm(false);
    setEditId(null);
  };

  const handleDayClick = (d) => {
    const dayCitas = getCitasForDay(d);
    if (dayCitas.length > 0) openDayView(d);
    else openNewForm(d);
  };

  const startEdit = (cita) => {
    setEditId(cita._fbId);
    setForm({ paciente: cita.paciente || "", tipo: cita.tipo || "ELDI", notas: cita.notas || "", hora: cita.hora || "09:00", estado: cita.estado || "pendiente", color: cita.color || "blue" });
    setShowForm(true);
  };

  const saveCita = async () => {
    if (!form.paciente.trim()) { nfy("Ingrese nombre del paciente", "er"); return; }
    const key = dateKey(year, month, selDay);
    const data = { ...form, paciente: form.paciente.trim(), fecha: key, userId, updatedAt: new Date().toISOString() };
    try {
      if (editId) {
        await updateDoc(doc(db, "citas", editId), data);
        nfy("Cita actualizada", "ok");
      } else {
        data.createdAt = new Date().toISOString();
        await addDoc(collection(db, "citas"), data);
        nfy("Cita guardada", "ok");
      }
      await loadCitas();
      setShowForm(false);
      setEditId(null);
    } catch (e) { nfy("Error: " + e.message, "er"); }
  };

  const deleteCita = async (fbId) => {
    if (!window.confirm("Eliminar esta cita?")) return;
    try {
      await deleteDoc(doc(db, "citas", fbId));
      nfy("Cita eliminada", "ok");
      await loadCitas();
    } catch (e) { nfy("Error: " + e.message, "er"); }
  };

  const getColorHex = (id) => COLORS.find(c => c.id === id)?.hex || "#2563eb";
  const I = { width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, background: "#f8faf9" };

  const dayCitas = selDay ? getCitasForDay(selDay) : [];

  return (
    <div style={{ animation: "fi .3s ease", width: "100%", maxWidth: 900 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>📅 Calendario de Citas</h1>
      <p style={{ color: K.mt, fontSize: 14, marginBottom: 24 }}>Organizá tu agenda de evaluaciones</p>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <button onClick={prevMonth} style={{ background: "#f1f5f9", border: "none", padding: "10px 18px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#475569" }}>←</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: K.sd }}>{MONTHS[month]} {year}</div>
          <button onClick={goToday} style={{ background: "none", border: "none", color: K.ac, fontSize: 12, cursor: "pointer", fontWeight: 600, marginTop: 2 }}>Ir a hoy</button>
        </div>
        <button onClick={nextMonth} style={{ background: "#f1f5f9", border: "none", padding: "10px 18px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#475569" }}>→</button>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        {COLORS.map(c => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: K.mt }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: c.hex }} />
            {c.label}
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden", marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", background: K.sd }}>
          {DAYS.map(d => (
            <div key={d} style={{ padding: "10px 0", textAlign: "center", color: "#5eead4", fontSize: 12, fontWeight: 600 }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
          {Array.from({ length: offset }).map((_, i) => (
            <div key={"e" + i} style={{ minHeight: 80, borderRight: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9", background: "#f8faf9" }} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1;
            const dc = getCitasForDay(d);
            const isT = isToday(d);
            const isSel = selDay === d;
            return (
              <div key={d} onClick={() => handleDayClick(d)}
                style={{ minHeight: 80, padding: 4, borderRight: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9", cursor: "pointer", background: isSel ? "#ccfbf1" : isT ? "#f0fdf4" : "#fff", transition: "background .15s", position: "relative" }}>
                <div style={{ fontSize: 12, fontWeight: isT ? 700 : 500, color: isT ? K.ac : "#1e293b", padding: "2px 6px", borderRadius: 4, display: "inline-block", background: isT ? "#ccfbf1" : "transparent" }}>{d}</div>
                {dc.slice(0, 2).map((c, ci) => (
                  <div key={ci} style={{ fontSize: 10, padding: "2px 4px", margin: "1px 0", borderRadius: 3, background: getColorHex(c.color) + "22", borderLeft: `3px solid ${getColorHex(c.color)}`, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.hora ? c.hora.substring(0, 5) + " " : ""}{c.paciente}
                  </div>
                ))}
                {dc.length > 2 && <div style={{ fontSize: 9, color: K.mt, padding: "0 4px" }}>+{dc.length - 2} más</div>}
              </div>
            );
          })}
        </div>
      </div>

      {selDay && !showForm && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 24, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: K.sd }}>{selDay} de {MONTHS[month]} {year}</h3>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => openNewForm(selDay)} style={{ background: K.ac, color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>+ Nueva cita</button>
              <button onClick={() => setSelDay(null)} style={{ background: "#f1f5f9", border: "none", padding: "8px 14px", borderRadius: 8, fontSize: 13, cursor: "pointer", color: K.mt }}>×</button>
            </div>
          </div>
          {dayCitas.length === 0 ? (
            <p style={{ color: K.mt, fontSize: 13, fontStyle: "italic" }}>No hay citas para este día</p>
          ) : (
            dayCitas.sort((a, b) => (a.hora || "").localeCompare(b.hora || "")).map(c => (
              <div key={c._fbId} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: "#f8faf9", borderRadius: 10, border: "1px solid #e2e8f0", marginBottom: 8, borderLeft: `4px solid ${getColorHex(c.color)}` }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{c.paciente}</span>
                    <span style={{ background: getColorHex(c.color) + "22", color: getColorHex(c.color), padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{c.tipo}</span>
                    <span style={{ background: c.estado === "realizada" ? "#dcfce7" : c.estado === "cancelada" ? "#fef2f2" : "#fef9c3", color: c.estado === "realizada" ? "#059669" : c.estado === "cancelada" ? "#dc2626" : "#d97706", padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 600 }}>{c.estado}</span>
                  </div>
                  {c.hora && <div style={{ fontSize: 12, color: K.mt }}>Hora: {c.hora}</div>}
                  {c.notas && <div style={{ fontSize: 12, color: K.mt, fontStyle: "italic", marginTop: 2 }}>{c.notas}</div>}
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button onClick={(e) => { e.stopPropagation(); startEdit(c); }} style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", color: "#0369a1" }}>Editar</button>
                  <button onClick={(e) => { e.stopPropagation(); deleteCita(c._fbId); }} style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer", color: "#dc2626" }}>Eliminar</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showForm && selDay && (
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: 24, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: K.sd }}>{editId ? "Editar cita" : "Nueva cita"} - {selDay} de {MONTHS[month]}</h3>
            <button onClick={() => { setShowForm(false); setEditId(null); }} style={{ background: "none", border: "none", fontSize: 18, color: K.mt, cursor: "pointer" }}>×</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: K.mt, display: "block", marginBottom: 4 }}>Nombre del paciente</label>
              <input value={form.paciente} onChange={e => setForm(p => ({ ...p, paciente: e.target.value }))} style={I} placeholder="Nombre y apellido" />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: K.mt, display: "block", marginBottom: 4 }}>Tipo de evaluación</label>
              <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))} style={{ ...I, cursor: "pointer" }}>
                {EVAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: K.mt, display: "block", marginBottom: 4 }}>Hora</label>
              <input type="time" value={form.hora} onChange={e => setForm(p => ({ ...p, hora: e.target.value }))} style={I} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: K.mt, display: "block", marginBottom: 4 }}>Estado</label>
              <select value={form.estado} onChange={e => setForm(p => ({ ...p, estado: e.target.value }))} style={{ ...I, cursor: "pointer" }}>
                {STATUS_LIST.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: K.mt, display: "block", marginBottom: 6 }}>Color / Categoría</label>
              <div style={{ display: "flex", gap: 8 }}>
                {COLORS.map(c => (
                  <button key={c.id} onClick={() => setForm(p => ({ ...p, color: c.id }))}
                    title={c.label}
                    style={{ width: 36, height: 36, borderRadius: 8, background: c.hex, border: form.color === c.id ? "3px solid #1e293b" : "2px solid #e2e8f0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 700, transition: "all .15s" }}>
                    {form.color === c.id ? "✓" : ""}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 10, color: K.mt, marginTop: 4 }}>{COLORS.find(c => c.id === form.color)?.label || ""}</div>
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: K.mt, display: "block", marginBottom: 4 }}>Notas clínicas</label>
              <textarea value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))} rows={3} style={{ ...I, resize: "vertical" }} placeholder="Observaciones, objetivos de la sesión..." />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
            <button onClick={() => { setShowForm(false); setEditId(null); }} style={{ background: "#f1f5f9", border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 14, cursor: "pointer", color: K.mt }}>Cancelar</button>
            <button onClick={saveCita} style={{ background: K.ac, color: "#fff", border: "none", padding: "10px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{editId ? "Actualizar" : "Guardar"}</button>
          </div>
        </div>
      )}

      {loading && <div style={{ textAlign: "center", color: K.mt, fontSize: 13, padding: 20 }}>Cargando citas...</div>}
    </div>
  );
}
