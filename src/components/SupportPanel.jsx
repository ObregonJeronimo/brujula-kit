import { useState, useEffect, useRef } from "react";
import { db, collection, getDocs, doc, updateDoc, query, where, orderBy, onSnapshot, getDoc } from "../firebase.js";
import { sendSupportMessage, subscribeToMessages, escalateCase, transferCase, changeUrgency, getAgentsList, cleanupOldCases, loadSupportSettings, saveSupportSettings, DEFAULT_SCHEDULE } from "../lib/support.js";

var K = { sd:"#0a3d2f", ac:"#0d9488", mt:"#64748b" };
var DAY_NAMES = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

function timeAgo(ts) {
  if (!ts) return "";
  var d = ts.toDate ? ts.toDate() : new Date(ts);
  var now = new Date();
  var diff = Math.floor((now - d) / 1000);
  if (diff < 60) return "ahora";
  if (diff < 3600) return Math.floor(diff / 60) + " min";
  if (diff < 86400) return Math.floor(diff / 3600) + " h";
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

function statusInfo(st) {
  if (st === "open") return { text: "Abierto", color: "#059669", bg: "#dcfce7" };
  if (st === "in_review") return { text: "En revision", color: "#d97706", bg: "#fef3c7" };
  if (st === "resolved") return { text: "Resuelto", color: "#2563eb", bg: "#dbeafe" };
  if (st === "closed") return { text: "Cerrado", color: "#64748b", bg: "#f1f5f9" };
  return { text: st || "?", color: "#64748b", bg: "#f1f5f9" };
}

function urgencyInfo(u) {
  if (u === "high") return { text: "Alta", color: "#dc2626", bg: "#fef2f2" };
  if (u === "medium") return { text: "Media", color: "#d97706", bg: "#fef9c3" };
  return { text: "Baja", color: "#059669", bg: "#f0fdf4" };
}

var I = { width: "100%", padding: "10px 14px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 14, background: "#f8faf9" };

export default function SupportPanel({ nfy, agentUid, agentName, agentRole }) {
  var _tab = useState("unassigned"), tab = _tab[0], setTab = _tab[1];
  var _cases = useState([]), cases = _cases[0], setCases = _cases[1];
  var _loading = useState(true), loading = _loading[0], setLoading = _loading[1];
  var _openCase = useState(null), openCase = _openCase[0], setOpenCase = _openCase[1];
  var _messages = useState([]), messages = _messages[0], setMessages = _messages[1];
  var _input = useState(""), input = _input[0], setInput = _input[1];
  var _sending = useState(false), sending = _sending[0], setSending = _sending[1];
  var _search = useState(""), search = _search[0], setSearch = _search[1];
  var _showEscalate = useState(false), showEscalate = _showEscalate[0], setShowEscalate = _showEscalate[1];
  var _escUrgency = useState("medium"), escUrgency = _escUrgency[0], setEscUrgency = _escUrgency[1];
  var _showTransfer = useState(false), showTransfer = _showTransfer[0], setShowTransfer = _showTransfer[1];
  var _agents = useState([]), agents = _agents[0], setAgents = _agents[1];
  var _showUrgency = useState(false), showUrgency = _showUrgency[0], setShowUrgency = _showUrgency[1];
  var _showConfig = useState(false), showConfig = _showConfig[0], setShowConfig = _showConfig[1];
  var _scheduleConfig = useState(null), scheduleConfig = _scheduleConfig[0], setScheduleConfig = _scheduleConfig[1];
  var _savingConfig = useState(false), savingConfig = _savingConfig[0], setSavingConfig = _savingConfig[1];
  var bodyRef = useRef(null);
  var unsubCasesRef = useRef(null);
  var unsubMsgsRef = useRef(null);
  var cleanupDoneRef = useRef(false);

  var isSuperAdmin = agentRole === "admin";
  var isSenior = agentRole === "agent_senior";
  var canEscalate = isSuperAdmin || isSenior;

  // Cleanup old cases on first load (Super Admin only)
  useEffect(function() {
    if (isSuperAdmin && !cleanupDoneRef.current) {
      cleanupDoneRef.current = true;
      cleanupOldCases().then(function(n) {
        if (n > 0) nfy(n + " caso(s) cerrados hace +15 dias eliminados", "ok");
      }).catch(function() {});
    }
  }, [isSuperAdmin]);

  // Load schedule config for Super Admin
  useEffect(function() {
    if (isSuperAdmin) {
      loadSupportSettings().then(function(s) { setScheduleConfig(s); });
    }
  }, [isSuperAdmin]);

  // Subscribe to cases (real-time)
  useEffect(function() {
    if (unsubCasesRef.current) unsubCasesRef.current();
    var q = query(
      collection(db, "support_cases"),
      where("status", "in", ["open", "in_review"]),
      orderBy("lastMessageAt", "desc")
    );
    unsubCasesRef.current = onSnapshot(q, function(snap) {
      var arr = snap.docs.map(function(d) { return Object.assign({ _id: d.id }, d.data()); });
      setCases(arr);
      setLoading(false);
    }, function(err) {
      console.error("Error loading cases:", err);
      setLoading(false);
    });
    return function() { if (unsubCasesRef.current) unsubCasesRef.current(); };
  }, []);

  // Subscribe to messages when a case is opened
  useEffect(function() {
    if (unsubMsgsRef.current) { unsubMsgsRef.current(); unsubMsgsRef.current = null; }
    if (!openCase) return;
    unsubMsgsRef.current = subscribeToMessages(openCase._id, function(msgs) {
      setMessages(msgs);
    });
    updateDoc(doc(db, "support_cases", openCase._id), { unreadByAgent: false }).catch(function() {});
    return function() { if (unsubMsgsRef.current) { unsubMsgsRef.current(); unsubMsgsRef.current = null; } };
  }, [openCase]);

  // Auto-scroll
  useEffect(function() {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages]);

  // Filter cases by tab
  var filteredCases = cases.filter(function(c) {
    if (tab === "mine") return c.assignedTo && c.assignedTo.uid === agentUid;
    if (tab === "unassigned") return !c.assignedTo;
    return true;
  });

  if (search.trim()) {
    var sq = search.trim().toLowerCase();
    filteredCases = filteredCases.filter(function(c) {
      return (c.caseNumber && c.caseNumber.toLowerCase().indexOf(sq) >= 0) ||
             (c.userName && c.userName.toLowerCase().indexOf(sq) >= 0);
    });
  }

  filteredCases.sort(function(a, b) {
    var urgOrder = { high: 0, medium: 1, low: 2 };
    var ua = urgOrder[a.urgency] !== undefined ? urgOrder[a.urgency] : 2;
    var ub = urgOrder[b.urgency] !== undefined ? urgOrder[b.urgency] : 2;
    if (ua !== ub) return ua - ub;
    var ta = a.lastMessageAt ? (a.lastMessageAt.toDate ? a.lastMessageAt.toDate().getTime() : new Date(a.lastMessageAt).getTime()) : 0;
    var tb = b.lastMessageAt ? (b.lastMessageAt.toDate ? b.lastMessageAt.toDate().getTime() : new Date(b.lastMessageAt).getTime()) : 0;
    return tb - ta;
  });

  // Actions
  var takeCase = async function(c) {
    try {
      await updateDoc(doc(db, "support_cases", c._id), { assignedTo: { uid: agentUid, nombre: agentName }, status: "in_review" });
      nfy("Caso " + c.caseNumber + " tomado", "ok");
      if (openCase && openCase._id === c._id) setOpenCase(Object.assign({}, openCase, { assignedTo: { uid: agentUid, nombre: agentName }, status: "in_review" }));
    } catch (e) { nfy("Error: " + e.message, "er"); }
  };

  var closeCase = async function(c) {
    if (!window.confirm("Cerrar el caso " + c.caseNumber + "?")) return;
    try {
      await updateDoc(doc(db, "support_cases", c._id), { status: "closed", closedAt: new Date().toISOString() });
      nfy("Caso " + c.caseNumber + " cerrado", "ok");
      setOpenCase(null);
    } catch (e) { nfy("Error: " + e.message, "er"); }
  };

  var handleEscalate = async function() {
    if (!openCase) return;
    try {
      var newNum = await escalateCase(openCase._id, escUrgency);
      nfy("Caso escalado a " + newNum, "ok");
      setOpenCase(Object.assign({}, openCase, { type: "case", caseNumber: newNum, urgency: escUrgency }));
      setShowEscalate(false);
    } catch (e) { nfy("Error: " + e.message, "er"); }
  };

  var handleTransfer = async function(agent) {
    if (!openCase) return;
    try {
      await transferCase(openCase._id, agent.uid, agent.nombre);
      nfy("Caso transferido a " + agent.nombre, "ok");
      setOpenCase(Object.assign({}, openCase, { assignedTo: { uid: agent.uid, nombre: agent.nombre } }));
      setShowTransfer(false);
    } catch (e) { nfy("Error: " + e.message, "er"); }
  };

  var handleChangeUrgency = async function(newUrg) {
    if (!openCase) return;
    try {
      await changeUrgency(openCase._id, newUrg);
      nfy("Urgencia cambiada a " + urgencyInfo(newUrg).text, "ok");
      setOpenCase(Object.assign({}, openCase, { urgency: newUrg }));
      setShowUrgency(false);
    } catch (e) { nfy("Error: " + e.message, "er"); }
  };

  var openTransferModal = async function() {
    var list = await getAgentsList();
    setAgents(list.filter(function(a) { return a.uid !== agentUid; }));
    setShowTransfer(true);
  };

  var handleSend = async function() {
    var text = input.trim();
    if (!text || !openCase || sending) return;
    setSending(true);
    setInput("");
    try { await sendSupportMessage(openCase._id, text, "agent"); } catch (e) { console.error(e); }
    setSending(false);
  };

  var handleKeyDown = function(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  // Schedule config handlers
  var toggleDay = function(day) {
    setScheduleConfig(function(prev) {
      var days = (prev.days || []).slice();
      var idx = days.indexOf(day);
      if (idx >= 0) days.splice(idx, 1);
      else days.push(day);
      days.sort();
      return Object.assign({}, prev, { days: days });
    });
  };

  var handleSaveSchedule = async function() {
    setSavingConfig(true);
    try {
      await saveSupportSettings(scheduleConfig);
      nfy("Horario de atencion guardado", "ok");
    } catch (e) { nfy("Error: " + e.message, "er"); }
    setSavingConfig(false);
  };

  // ========== RENDER ==========

  // Schedule config panel (Super Admin only)
  var renderConfigPanel = function() {
    if (!scheduleConfig) return <div style={{ textAlign: "center", padding: 40, color: K.mt, fontSize: 13 }}>Cargando configuracion...</div>;
    return <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: K.sd }}>Horario de atencion</div>
          <div style={{ fontSize: 12, color: K.mt }}>Configura cuando el soporte esta disponible</div>
        </div>
        <button onClick={function() { setShowConfig(false); }} style={{ padding: "8px 16px", background: "#f1f5f9", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", color: K.mt }}>Volver</button>
      </div>

      {/* Toggle enabled */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: scheduleConfig.scheduleEnabled ? "#f0fdfa" : "#f8fafc", borderRadius: 10, border: "1px solid " + (scheduleConfig.scheduleEnabled ? "#99f6e4" : "#e2e8f0"), marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: scheduleConfig.scheduleEnabled ? K.sd : "#475569" }}>Horario de atencion activado</div>
          <div style={{ fontSize: 11, color: K.mt, marginTop: 2 }}>Si esta desactivado, el soporte aparece siempre como disponible</div>
        </div>
        <button onClick={function() { setScheduleConfig(function(p) { return Object.assign({}, p, { scheduleEnabled: !p.scheduleEnabled }); }); }} style={{ width: 44, height: 24, borderRadius: 12, border: "none", background: scheduleConfig.scheduleEnabled ? "#0d9488" : "#cbd5e1", cursor: "pointer", position: "relative" }}>
          <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: scheduleConfig.scheduleEnabled ? 23 : 3, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)" }} />
        </button>
      </div>

      {scheduleConfig.scheduleEnabled && <div>
        {/* Days */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: K.sd, marginBottom: 8 }}>Dias de atencion</div>
          <div style={{ display: "flex", gap: 6 }}>
            {DAY_NAMES.map(function(name, idx) {
              var selected = (scheduleConfig.days || []).indexOf(idx) >= 0;
              return <button key={idx} onClick={function() { toggleDay(idx); }} style={{
                flex: 1, padding: "10px 0", borderRadius: 8,
                border: selected ? "2px solid #0d9488" : "1px solid #e2e8f0",
                background: selected ? "#f0fdfa" : "#fff",
                color: selected ? K.sd : "#94a3b8",
                fontSize: 12, fontWeight: selected ? 700 : 500, cursor: "pointer"
              }}>{name}</button>;
            })}
          </div>
        </div>

        {/* Hours */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: K.mt, display: "block", marginBottom: 4 }}>Hora de inicio</label>
            <input type="time" value={scheduleConfig.startHour || "09:00"} onChange={function(e) { setScheduleConfig(function(p) { return Object.assign({}, p, { startHour: e.target.value }); }); }} style={I} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: K.mt, display: "block", marginBottom: 4 }}>Hora de fin</label>
            <input type="time" value={scheduleConfig.endHour || "18:00"} onChange={function(e) { setScheduleConfig(function(p) { return Object.assign({}, p, { endHour: e.target.value }); }); }} style={I} />
          </div>
        </div>

        {/* Offline message */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: K.mt, display: "block", marginBottom: 4 }}>Mensaje fuera de horario</label>
          <textarea value={scheduleConfig.offlineMessage || ""} onChange={function(e) { setScheduleConfig(function(p) { return Object.assign({}, p, { offlineMessage: e.target.value }); }); }} rows={3} style={Object.assign({}, I, { resize: "vertical", fontFamily: "inherit" })} placeholder="Mensaje que ven los usuarios fuera del horario..." />
        </div>
      </div>}

      <button onClick={handleSaveSchedule} disabled={savingConfig} style={{ width: "100%", padding: "14px", background: K.ac, color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: savingConfig ? "wait" : "pointer", opacity: savingConfig ? .7 : 1 }}>
        {savingConfig ? "Guardando..." : "Guardar horario"}
      </button>
    </div>;
  };

  var renderCaseList = function() {
    return <div>
      <div style={{ display: "flex", gap: 0, marginBottom: 16, borderBottom: "2px solid #e2e8f0" }}>
        {[
          ["mine", "Mis casos"],
          ["unassigned", "Sin asignar"],
          isSuperAdmin ? ["all", "Todos"] : null
        ].filter(Boolean).map(function(t) {
          var active = tab === t[0];
          var count = cases.filter(function(c) {
            if (t[0] === "mine") return c.assignedTo && c.assignedTo.uid === agentUid;
            if (t[0] === "unassigned") return !c.assignedTo;
            return true;
          }).length;
          return <button key={t[0]} onClick={function() { setTab(t[0]); }} style={{
            padding: "10px 20px", background: "transparent", border: "none",
            borderBottom: active ? "2px solid #0d9488" : "2px solid transparent",
            marginBottom: "-2px", color: active ? K.sd : "#94a3b8",
            fontSize: 14, fontWeight: active ? 700 : 500, cursor: "pointer"
          }}>
            {t[1]}
            {count > 0 && <span style={{ marginLeft: 6, padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700, background: active ? "#ccfbf1" : "#f1f5f9", color: active ? K.ac : "#94a3b8" }}>{count}</span>}
          </button>;
        })}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input value={search} onChange={function(e) { setSearch(e.target.value); }} style={Object.assign({}, I, { background: "#fff", flex: 1 })} placeholder="Buscar por numero de caso o nombre..." />
        {isSuperAdmin && <button onClick={function() { setShowConfig(true); }} style={{ padding: "10px 16px", background: "#f8faf9", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", color: K.sd, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          Configurar
        </button>}
      </div>

      {loading ? <div style={{ textAlign: "center", padding: 40, color: K.mt, fontSize: 13 }}>Cargando casos...</div> :
        filteredCases.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: K.mt, fontSize: 13, fontStyle: "italic" }}>No hay casos en esta categoria</div> :
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filteredCases.map(function(c) {
            var st = statusInfo(c.status);
            var urg = urgencyInfo(c.urgency);
            var isCase = c.type === "case";
            return <div key={c._id} onClick={function() { setOpenCase(c); setShowEscalate(false); setShowTransfer(false); setShowUrgency(false); }} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
              background: c.unreadByAgent ? "#f0fdfa" : "#fff",
              borderRadius: 10, border: "1px solid " + (c.unreadByAgent ? "#99f6e4" : "#e2e8f0"),
              cursor: "pointer", transition: "background .15s",
              borderLeft: isCase ? "4px solid " + urg.color : "4px solid #e2e8f0"
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: K.sd }}>{c.caseNumber}</span>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{c.userName}</span>
                  <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 9, fontWeight: 700, color: st.color, background: st.bg }}>{st.text}</span>
                  {isCase && <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 9, fontWeight: 700, color: urg.color, background: urg.bg }}>{urg.text}</span>}
                  {c.unreadByAgent && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#dc2626", flexShrink: 0 }} />}
                </div>
                <div style={{ fontSize: 12, color: K.mt, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.lastMessage || "Sin mensajes"}</div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 10, color: K.mt }}>{timeAgo(c.lastMessageAt)}</div>
                {c.assignedTo && <div style={{ fontSize: 10, color: K.ac, marginTop: 2 }}>{c.assignedTo.nombre}</div>}
              </div>
            </div>;
          })}
        </div>}
    </div>;
  };

  var renderChatView = function() {
    if (!openCase) return null;
    var st = statusInfo(openCase.status);
    var urg = urgencyInfo(openCase.urgency);
    var isAssignedToMe = openCase.assignedTo && openCase.assignedTo.uid === agentUid;
    var isUnassigned = !openCase.assignedTo;
    var isClosed = openCase.status === "closed" || openCase.status === "resolved";
    var isTemporal = openCase.type === "temporal";

    return <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 180px)", minHeight: 400 }}>
      <div style={{ padding: "14px 18px", background: "#f8faf9", borderRadius: "12px 12px 0 0", border: "1px solid #e2e8f0", borderBottom: "none", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={function() { setOpenCase(null); setShowEscalate(false); setShowTransfer(false); setShowUrgency(false); }} style={{ background: "none", border: "none", cursor: "pointer", color: K.mt, fontSize: 18, padding: 0 }}>{"<"}</button>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: K.sd }}>{openCase.caseNumber}</span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{openCase.userName}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 9, fontWeight: 700, color: st.color, background: st.bg }}>{st.text}</span>
                {openCase.type === "case" && <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 9, fontWeight: 700, color: urg.color, background: urg.bg }}>{"Urgencia: " + urg.text}</span>}
                {openCase.assignedTo && <span style={{ fontSize: 10, color: K.mt }}>{"Asignado a: " + openCase.assignedTo.nombre}</span>}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {isUnassigned && <button onClick={function() { takeCase(openCase); }} style={{ padding: "7px 14px", background: K.ac, color: "#fff", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Tomar caso</button>}
            {!isClosed && (isAssignedToMe || isSuperAdmin) && <button onClick={function() { closeCase(openCase); }} style={{ padding: "7px 14px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Cerrar</button>}
          </div>
        </div>
        {!isClosed && (isAssignedToMe || isSuperAdmin) && <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {isTemporal && canEscalate && <button onClick={function() { setShowEscalate(!showEscalate); setShowTransfer(false); setShowUrgency(false); }} style={{ padding: "6px 12px", background: showEscalate ? "#4f46e5" : "#f0f9ff", color: showEscalate ? "#fff" : "#4f46e5", border: "1px solid " + (showEscalate ? "#4f46e5" : "#c7d2fe"), borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Escalar a caso</button>}
          {!isTemporal && canEscalate && <button onClick={function() { setShowUrgency(!showUrgency); setShowEscalate(false); setShowTransfer(false); }} style={{ padding: "6px 12px", background: showUrgency ? "#d97706" : "#fef9c3", color: showUrgency ? "#fff" : "#92400e", border: "1px solid " + (showUrgency ? "#d97706" : "#fef3c7"), borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Cambiar urgencia</button>}
          <button onClick={function() { openTransferModal(); setShowEscalate(false); setShowUrgency(false); }} style={{ padding: "6px 12px", background: showTransfer ? "#0369a1" : "#f0f9ff", color: showTransfer ? "#fff" : "#0369a1", border: "1px solid " + (showTransfer ? "#0369a1" : "#bae6fd"), borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Transferir</button>
        </div>}

        {showEscalate && <div style={{ marginTop: 10, padding: "12px 14px", background: "#f5f3ff", borderRadius: 8, border: "1px solid #e0e7ff" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#4f46e5", marginBottom: 8 }}>Escalar #{openCase.caseNumber} a caso formal</div>
          <div style={{ fontSize: 11, color: K.mt, marginBottom: 8 }}>Selecciona el nivel de urgencia:</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {["low", "medium", "high"].map(function(u) {
              var ui = urgencyInfo(u);
              return <button key={u} onClick={function() { setEscUrgency(u); }} style={{ padding: "6px 16px", borderRadius: 6, border: escUrgency === u ? "2px solid " + ui.color : "1px solid #e2e8f0", background: escUrgency === u ? ui.bg : "#fff", color: ui.color, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>{ui.text}</button>;
            })}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={handleEscalate} style={{ padding: "8px 18px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Confirmar escalamiento</button>
            <button onClick={function() { setShowEscalate(false); }} style={{ padding: "8px 14px", background: "#f1f5f9", border: "none", borderRadius: 6, fontSize: 12, cursor: "pointer", color: K.mt }}>Cancelar</button>
          </div>
        </div>}

        {showTransfer && <div style={{ marginTop: 10, padding: "12px 14px", background: "#f0f9ff", borderRadius: 8, border: "1px solid #bae6fd" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#0369a1", marginBottom: 8 }}>Transferir caso a otro agente</div>
          {agents.length === 0 ? <div style={{ fontSize: 11, color: K.mt, fontStyle: "italic" }}>No hay otros agentes disponibles</div> :
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {agents.map(function(a) {
                var roleLabel = a.role === "admin" ? "Super Admin" : a.role === "agent_senior" ? "Senior" : "Agente";
                return <button key={a.uid} onClick={function() { handleTransfer(a); }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 6, cursor: "pointer", textAlign: "left" }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{a.nombre}</span>
                  <span style={{ fontSize: 10, color: K.mt }}>{roleLabel}</span>
                </button>;
              })}
            </div>}
          <button onClick={function() { setShowTransfer(false); }} style={{ marginTop: 8, padding: "6px 14px", background: "#f1f5f9", border: "none", borderRadius: 6, fontSize: 11, cursor: "pointer", color: K.mt }}>Cancelar</button>
        </div>}

        {showUrgency && <div style={{ marginTop: 10, padding: "12px 14px", background: "#fef9c3", borderRadius: 8, border: "1px solid #fef3c7" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#92400e", marginBottom: 8 }}>Cambiar urgencia del caso</div>
          <div style={{ display: "flex", gap: 6 }}>
            {["low", "medium", "high"].map(function(u) {
              var ui = urgencyInfo(u);
              var isCurrent = openCase.urgency === u;
              return <button key={u} onClick={function() { if (!isCurrent) handleChangeUrgency(u); }} style={{ padding: "6px 16px", borderRadius: 6, border: isCurrent ? "2px solid " + ui.color : "1px solid #e2e8f0", background: isCurrent ? ui.bg : "#fff", color: ui.color, fontSize: 11, fontWeight: 600, cursor: isCurrent ? "default" : "pointer", opacity: isCurrent ? .6 : 1 }}>{ui.text}{isCurrent ? " (actual)" : ""}</button>;
            })}
          </div>
          <button onClick={function() { setShowUrgency(false); }} style={{ marginTop: 8, padding: "6px 14px", background: "#f1f5f9", border: "none", borderRadius: 6, fontSize: 11, cursor: "pointer", color: K.mt }}>Cerrar</button>
        </div>}
      </div>

      <div ref={bodyRef} style={{ flex: 1, overflowY: "auto", padding: "16px 18px", background: "#fff", borderLeft: "1px solid #e2e8f0", borderRight: "1px solid #e2e8f0" }}>
        {messages.length === 0 && <div style={{ textAlign: "center", fontSize: 12, color: K.mt, fontStyle: "italic", padding: 20 }}>Sin mensajes</div>}
        {messages.map(function(msg, i) {
          var isUser = msg.from === "user";
          return <div key={msg._id || i} style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-start" : "flex-end", marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: K.mt, marginBottom: 2 }}>{isUser ? openCase.userName : "Agente"}</div>
            <div style={{
              maxWidth: "75%", padding: "10px 14px", borderRadius: isUser ? "14px 14px 14px 4px" : "14px 14px 4px 14px",
              background: isUser ? "#f1f5f9" : "#0d9488", color: isUser ? "#1e293b" : "#fff",
              fontSize: 13, lineHeight: 1.5
            }}>{msg.text}</div>
            <div style={{ fontSize: 9, color: "#94a3b8", marginTop: 2 }}>{timeAgo(msg.timestamp)}</div>
          </div>;
        })}
      </div>

      {!isClosed && (isAssignedToMe || isSuperAdmin) && <div style={{ display: "flex", gap: 8, padding: "12px 18px", background: "#f8faf9", borderRadius: "0 0 12px 12px", border: "1px solid #e2e8f0", borderTop: "none", flexShrink: 0 }}>
        <input value={input} onChange={function(e) { setInput(e.target.value); }} onKeyDown={handleKeyDown} style={Object.assign({}, I, { flex: 1, background: "#fff" })} placeholder="Escribi tu respuesta..." />
        <button onClick={handleSend} disabled={sending || !input.trim()} style={{ background: K.ac, color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontSize: 13, fontWeight: 600, cursor: sending ? "wait" : "pointer", opacity: sending || !input.trim() ? .5 : 1, flexShrink: 0 }}>
          {sending ? "..." : "Enviar"}
        </button>
      </div>}
      {isClosed && <div style={{ padding: "12px 18px", background: "#f0fdf4", borderRadius: "0 0 12px 12px", border: "1px solid #bbf7d0", textAlign: "center", fontSize: 12, color: "#059669", fontWeight: 600, flexShrink: 0 }}>Este caso esta cerrado</div>}
      {!isClosed && !isAssignedToMe && !isSuperAdmin && !isUnassigned && <div style={{ padding: "12px 18px", background: "#fef9c3", borderRadius: "0 0 12px 12px", border: "1px solid #fef3c7", textAlign: "center", fontSize: 12, color: "#92400e", fontWeight: 600, flexShrink: 0 }}>Este caso esta asignado a otro agente</div>}
    </div>;
  };

  return (
    <div style={{ animation: "fi .3s ease", width: "100%", maxWidth: 900 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{"Soporte"}</h1>
      <p style={{ color: K.mt, fontSize: 14, marginBottom: 20 }}>{"Gestiona las consultas de los profesionales"}</p>
      {showConfig && isSuperAdmin ? renderConfigPanel() : (openCase ? renderChatView() : renderCaseList())}
    </div>
  );
}
