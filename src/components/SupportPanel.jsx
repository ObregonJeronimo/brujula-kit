import { useState, useEffect, useRef, useCallback } from "react";
import { db, collection, getDocs, doc, updateDoc, query, where, orderBy, onSnapshot } from "../firebase.js";
import { sendSupportMessage, subscribeToMessages } from "../lib/support.js";

var K = { sd:"#0a3d2f", ac:"#0d9488", mt:"#64748b" };

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
  var bodyRef = useRef(null);
  var unsubCasesRef = useRef(null);
  var unsubMsgsRef = useRef(null);

  var isSuperAdmin = agentRole === "admin";

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
    // Mark as read by agent
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
    return true; // "all" tab
  });

  // Apply search filter
  if (search.trim()) {
    var sq = search.trim().toLowerCase();
    filteredCases = filteredCases.filter(function(c) {
      return (c.caseNumber && c.caseNumber.toLowerCase().indexOf(sq) >= 0) ||
             (c.userName && c.userName.toLowerCase().indexOf(sq) >= 0);
    });
  }

  // Sort: urgency high first, then by lastMessageAt
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
      await updateDoc(doc(db, "support_cases", c._id), {
        assignedTo: { uid: agentUid, nombre: agentName },
        status: "in_review"
      });
      nfy("Caso " + c.caseNumber + " tomado", "ok");
      if (openCase && openCase._id === c._id) {
        setOpenCase(Object.assign({}, openCase, { assignedTo: { uid: agentUid, nombre: agentName }, status: "in_review" }));
      }
    } catch (e) { nfy("Error: " + e.message, "er"); }
  };

  var closeCase = async function(c) {
    if (!window.confirm("Cerrar el caso " + c.caseNumber + "?")) return;
    try {
      await updateDoc(doc(db, "support_cases", c._id), {
        status: "closed",
        closedAt: new Date().toISOString()
      });
      nfy("Caso " + c.caseNumber + " cerrado", "ok");
      setOpenCase(null);
    } catch (e) { nfy("Error: " + e.message, "er"); }
  };

  var handleSend = async function() {
    var text = input.trim();
    if (!text || !openCase || sending) return;
    setSending(true);
    setInput("");
    try {
      await sendSupportMessage(openCase._id, text, "agent");
    } catch (e) { console.error(e); }
    setSending(false);
  };

  var handleKeyDown = function(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ========== RENDER ==========

  // Case list view
  var renderCaseList = function() {
    return <div>
      {/* Tabs */}
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

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input value={search} onChange={function(e) { setSearch(e.target.value); }} style={Object.assign({}, I, { background: "#fff" })} placeholder="Buscar por numero de caso o nombre..." />
      </div>

      {/* Cases */}
      {loading ? <div style={{ textAlign: "center", padding: 40, color: K.mt, fontSize: 13 }}>Cargando casos...</div> :
        filteredCases.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: K.mt, fontSize: 13, fontStyle: "italic" }}>No hay casos en esta categoria</div> :
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filteredCases.map(function(c) {
            var st = statusInfo(c.status);
            var urg = urgencyInfo(c.urgency);
            var isCase = c.type === "case";
            return <div key={c._id} onClick={function() { setOpenCase(c); }} style={{
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

  // Chat view
  var renderChatView = function() {
    if (!openCase) return null;
    var st = statusInfo(openCase.status);
    var urg = urgencyInfo(openCase.urgency);
    var isAssignedToMe = openCase.assignedTo && openCase.assignedTo.uid === agentUid;
    var isUnassigned = !openCase.assignedTo;
    var isClosed = openCase.status === "closed" || openCase.status === "resolved";

    return <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 180px)", minHeight: 400 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "#f8faf9", borderRadius: "12px 12px 0 0", border: "1px solid #e2e8f0", borderBottom: "none", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={function() { setOpenCase(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: K.mt, fontSize: 18, padding: 0 }}>{"<"}</button>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: K.sd }}>{openCase.caseNumber}</span>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{openCase.userName}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
              <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 9, fontWeight: 700, color: st.color, background: st.bg }}>{st.text}</span>
              {openCase.type === "case" && <span style={{ padding: "2px 8px", borderRadius: 20, fontSize: 9, fontWeight: 700, color: urg.color, background: urg.bg }}>{"Urgencia: " + urg.text}</span>}
              {openCase.assignedTo && <span style={{ fontSize: 10, color: K.mt }}>{"Asignado a: " + openCase.assignedTo.nombre}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {isUnassigned && <button onClick={function() { takeCase(openCase); }} style={{ padding: "8px 16px", background: K.ac, color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Tomar caso</button>}
          {!isClosed && (isAssignedToMe || isSuperAdmin) && <button onClick={function() { closeCase(openCase); }} style={{ padding: "8px 16px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Cerrar caso</button>}
        </div>
      </div>

      {/* Messages */}
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

      {/* Input */}
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
      {openCase ? renderChatView() : renderCaseList()}
    </div>
  );
}
