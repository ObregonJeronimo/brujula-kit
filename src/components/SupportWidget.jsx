import { useState, useEffect, useRef, useCallback } from "react";
import { DEFAULT_FAQ } from "../config/faqData.js";
import { createSupportCase, sendSupportMessage, getActiveCase, subscribeToMessages, markReadByUser, loadFAQ } from "../lib/support.js";

var S = {
  fab: { position:"fixed", bottom:24, right:24, zIndex:900, width:56, height:56, borderRadius:"50%", background:"linear-gradient(135deg,#0a3d2f,#0d9488)", color:"#fff", border:"none", cursor:"pointer", boxShadow:"0 4px 20px rgba(0,0,0,.25)", display:"flex", alignItems:"center", justifyContent:"center", transition:"transform .2s, box-shadow .2s" },
  panel: { position:"fixed", bottom:92, right:24, zIndex:901, width:380, maxWidth:"calc(100vw - 32px)", height:520, maxHeight:"calc(100vh - 120px)", background:"#fff", borderRadius:16, boxShadow:"0 12px 48px rgba(0,0,0,.2)", display:"flex", flexDirection:"column", overflow:"hidden", animation:"fi .2s ease" },
  header: { background:"linear-gradient(135deg,#0a3d2f,#0d9488)", padding:"18px 20px", color:"#fff", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 },
  body: { flex:1, overflowY:"auto", padding:"16px 16px 8px" },
  footer: { padding:"12px 16px", borderTop:"1px solid #e2e8f0", flexShrink:0, display:"flex", gap:8 },
  input: { flex:1, padding:"10px 14px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:13, background:"#f8faf9", outline:"none", fontFamily:"inherit" },
  sendBtn: { background:"#0d9488", color:"#fff", border:"none", borderRadius:8, padding:"10px 16px", fontSize:13, fontWeight:600, cursor:"pointer", flexShrink:0 },
  faqBtn: { display:"block", width:"100%", textAlign:"left", padding:"12px 16px", background:"#f0fdfa", border:"1px solid #ccfbf1", borderRadius:10, fontSize:13, fontWeight:500, color:"#0a3d2f", cursor:"pointer", marginBottom:8, lineHeight:1.5, transition:"background .15s" },
  msgUser: { maxWidth:"80%", padding:"10px 14px", borderRadius:"14px 14px 4px 14px", background:"#0d9488", color:"#fff", fontSize:13, lineHeight:1.5, marginLeft:"auto", marginBottom:8 },
  msgAgent: { maxWidth:"80%", padding:"10px 14px", borderRadius:"14px 14px 14px 4px", background:"#f1f5f9", color:"#1e293b", fontSize:13, lineHeight:1.5, marginBottom:8 },
  msgSystem: { textAlign:"center", fontSize:11, color:"#94a3b8", marginBottom:8, fontStyle:"italic" },
  badge: { position:"absolute", top:-4, right:-4, width:18, height:18, borderRadius:"50%", background:"#dc2626", color:"#fff", fontSize:10, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", border:"2px solid #fff" }
};

function ChatIcon() {
  return <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
}

function CloseIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}

function BackIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>;
}

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

export default function SupportWidget({ userId, userName }) {
  var _open = useState(false), open = _open[0], setOpen = _open[1];
  var _view = useState("home"), view = _view[0], setView = _view[1];
  var _faq = useState(DEFAULT_FAQ), faq = _faq[0], setFaq = _faq[1];
  var _faqChat = useState([]), faqChat = _faqChat[0], setFaqChat = _faqChat[1];
  var _activeCase = useState(null), activeCase = _activeCase[0], setActiveCase = _activeCase[1];
  var _messages = useState([]), messages = _messages[0], setMessages = _messages[1];
  var _input = useState(""), input = _input[0], setInput = _input[1];
  var _sending = useState(false), sending = _sending[0], setSending = _sending[1];
  var _loading = useState(false), loading = _loading[0], setLoading = _loading[1];
  var _unread = useState(0), unread = _unread[0], setUnread = _unread[1];
  var bodyRef = useRef(null);
  var unsubRef = useRef(null);
  var prevMsgCount = useRef(0);

  // Load FAQ on mount
  useEffect(function() {
    loadFAQ(DEFAULT_FAQ).then(setFaq);
  }, []);

  // Check for active case on mount
  useEffect(function() {
    if (!userId) return;
    getActiveCase(userId).then(function(c) {
      if (c) {
        setActiveCase(c);
        setView("chat");
      }
    });
  }, [userId]);

  // Subscribe to messages when active case changes
  useEffect(function() {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    if (!activeCase || !activeCase._id) return;
    unsubRef.current = subscribeToMessages(activeCase._id, function(msgs) {
      setMessages(msgs);
      // Count unread from agent when widget is closed
      if (!open) {
        var newFromAgent = msgs.filter(function(m) { return m.from === "agent"; }).length;
        var prev = prevMsgCount.current;
        if (newFromAgent > prev) setUnread(newFromAgent - prev);
      }
    });
    return function() { if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; } };
  }, [activeCase]);

  // Auto-scroll to bottom when messages change
  useEffect(function() {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, faqChat, view]);

  // Mark as read when opening
  useEffect(function() {
    if (open && activeCase && activeCase._id) {
      markReadByUser(activeCase._id).catch(function() {});
      setUnread(0);
      prevMsgCount.current = messages.filter(function(m) { return m.from === "agent"; }).length;
    }
  }, [open, messages.length]);

  var handleFaqClick = function(item) {
    setFaqChat(function(prev) {
      return prev.concat([
        { type: "user", text: item.pregunta },
        { type: "bot", text: item.respuesta }
      ]);
    });
    setView("faq-chat");
  };

  var startLiveChat = useCallback(async function() {
    if (activeCase) { setView("chat"); return; }
    setLoading(true);
    try {
      var result = await createSupportCase(userId, userName);
      var newCase = { _id: result.id, caseNumber: result.caseNumber, status: "open", type: "temporal" };
      setActiveCase(newCase);
      await sendSupportMessage(result.id, "Hola, necesito ayuda.", "user");
      setView("chat");
    } catch (e) {
      console.error("Error creating support case:", e);
    }
    setLoading(false);
  }, [userId, userName, activeCase]);

  var handleSend = async function() {
    var text = input.trim();
    if (!text || sending) return;
    if (!activeCase) {
      // First message creates the case
      setSending(true);
      try {
        var result = await createSupportCase(userId, userName);
        var newCase = { _id: result.id, caseNumber: result.caseNumber, status: "open", type: "temporal" };
        setActiveCase(newCase);
        await sendSupportMessage(result.id, text, "user");
        setView("chat");
        setInput("");
      } catch (e) { console.error(e); }
      setSending(false);
      return;
    }
    setSending(true);
    setInput("");
    try {
      await sendSupportMessage(activeCase._id, text, "user");
    } catch (e) { console.error(e); }
    setSending(false);
  };

  var handleKeyDown = function(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  var statusLabel = function(st) {
    if (st === "open") return { text: "Abierto", color: "#059669", bg: "#dcfce7" };
    if (st === "in_review") return { text: "En revision", color: "#d97706", bg: "#fef3c7" };
    if (st === "resolved") return { text: "Resuelto", color: "#2563eb", bg: "#dbeafe" };
    if (st === "closed") return { text: "Cerrado", color: "#64748b", bg: "#f1f5f9" };
    return { text: st, color: "#64748b", bg: "#f1f5f9" };
  };

  var toggleOpen = function() {
    setOpen(!open);
    if (!open) { setUnread(0); }
  };

  // --- RENDER ---
  var renderHome = function() {
    return <div>
      <div style={{marginBottom:16}}>
        <div style={{fontSize:15,fontWeight:700,color:"#0a3d2f",marginBottom:4}}>{"Hola, como podemos ayudarte?"}</div>
        <div style={{fontSize:12,color:"#64748b"}}>{"Selecciona una pregunta frecuente o escribi tu consulta."}</div>
      </div>
      {faq.map(function(item) {
        return <button key={item.id} onClick={function() { handleFaqClick(item); }} style={S.faqBtn} onMouseEnter={function(e){ e.currentTarget.style.background="#ccfbf1"; }} onMouseLeave={function(e){ e.currentTarget.style.background="#f0fdfa"; }}>
          {item.pregunta}
        </button>;
      })}
      <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid #e2e8f0"}}>
        <button onClick={startLiveChat} disabled={loading} style={{width:"100%",padding:"12px",background:"linear-gradient(135deg,#0a3d2f,#0d9488)",color:"#fff",border:"none",borderRadius:10,fontSize:13,fontWeight:600,cursor:loading?"wait":"pointer",opacity:loading?.7:1}}>
          {loading ? "Conectando..." : "Hablar con soporte"}
        </button>
      </div>
    </div>;
  };

  var renderFaqChat = function() {
    return <div>
      {faqChat.map(function(msg, i) {
        if (msg.type === "user") return <div key={i} style={S.msgUser}>{msg.text}</div>;
        return <div key={i} style={S.msgAgent}>{msg.text}</div>;
      })}
      <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:8}}>
        {faq.filter(function(item) {
          return !faqChat.some(function(m) { return m.text === item.pregunta; });
        }).slice(0, 3).map(function(item) {
          return <button key={item.id} onClick={function() { handleFaqClick(item); }} style={Object.assign({}, S.faqBtn, {fontSize:12,padding:"10px 14px",marginBottom:0})}>
            {item.pregunta}
          </button>;
        })}
        <button onClick={startLiveChat} disabled={loading} style={{width:"100%",padding:"10px",background:"#0a3d2f",color:"#fff",border:"none",borderRadius:8,fontSize:12,fontWeight:600,cursor:loading?"wait":"pointer",marginTop:4}}>
          {loading ? "Conectando..." : "Necesito mas ayuda"}
        </button>
      </div>
    </div>;
  };

  var renderChat = function() {
    var st = activeCase ? statusLabel(activeCase.status) : null;
    var isClosed = activeCase && (activeCase.status === "closed" || activeCase.status === "resolved");
    return <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      {activeCase && <div style={{padding:"8px 16px",background:"#f8faf9",borderBottom:"1px solid #e2e8f0",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
        <div style={{fontSize:12,fontWeight:600,color:"#0a3d2f"}}>{activeCase.caseNumber}</div>
        {st && <span style={{padding:"2px 10px",borderRadius:20,fontSize:10,fontWeight:600,color:st.color,background:st.bg}}>{st.text}</span>}
      </div>}
      <div ref={bodyRef} style={{flex:1,overflowY:"auto",padding:"12px 16px"}}>
        {messages.length === 0 && <div style={S.msgSystem}>{"Inicio de la conversacion"}</div>}
        {messages.map(function(msg, i) {
          var isUser = msg.from === "user";
          return <div key={msg._id || i} style={{display:"flex",flexDirection:"column",alignItems:isUser?"flex-end":"flex-start",marginBottom:8}}>
            <div style={isUser ? S.msgUser : S.msgAgent}>{msg.text}</div>
            <div style={{fontSize:9,color:"#94a3b8",marginTop:2,paddingLeft:isUser?0:4,paddingRight:isUser?4:0}}>{timeAgo(msg.timestamp)}</div>
          </div>;
        })}
      </div>
      {!isClosed && <div style={S.footer}>
        <input value={input} onChange={function(e){ setInput(e.target.value); }} onKeyDown={handleKeyDown} style={S.input} placeholder="Escribi tu mensaje..." />
        <button onClick={handleSend} disabled={sending || !input.trim()} style={Object.assign({}, S.sendBtn, {opacity:sending||!input.trim()?.5:1})}>
          {sending ? "..." : "Enviar"}
        </button>
      </div>}
      {isClosed && <div style={{padding:"12px 16px",background:"#f0fdf4",borderTop:"1px solid #bbf7d0",textAlign:"center",fontSize:12,color:"#059669",fontWeight:600,flexShrink:0}}>
        {"Este caso fue cerrado. Si necesitas mas ayuda, inicia una nueva consulta."}
      </div>}
    </div>;
  };

  if (!userId) return null;

  return <>
    {/* FAB */}
    <button onClick={toggleOpen} style={Object.assign({}, S.fab, open?{transform:"scale(0.9)"}:{})} aria-label="Soporte">
      {open ? <CloseIcon /> : <ChatIcon />}
      {unread > 0 && !open && <div style={S.badge}>{unread}</div>}
    </button>

    {/* Panel */}
    {open && <div style={S.panel}>
      <div style={S.header}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {view !== "home" && <button onClick={function() {
            if (view === "chat" && activeCase) { setView("home"); return; }
            if (view === "faq-chat") { setView("home"); setFaqChat([]); return; }
            setView("home");
          }} style={{background:"none",border:"none",color:"#fff",cursor:"pointer",display:"flex",padding:0}}>
            <BackIcon />
          </button>}
          <div>
            <div style={{fontSize:15,fontWeight:700}}>{"Soporte"}</div>
            <div style={{fontSize:10,opacity:.7}}>{"Brujula KIT"}</div>
          </div>
        </div>
        <button onClick={toggleOpen} style={{background:"none",border:"none",color:"#fff",cursor:"pointer",display:"flex",padding:0}}><CloseIcon /></button>
      </div>

      <div ref={view === "chat" ? null : bodyRef} style={view === "chat" ? {flex:1,display:"flex",flexDirection:"column",overflow:"hidden"} : S.body}>
        {view === "home" && renderHome()}
        {view === "faq-chat" && renderFaqChat()}
        {view === "chat" && renderChat()}
      </div>

      {view === "home" && <div style={S.footer}>
        <input value={input} onChange={function(e){ setInput(e.target.value); }} onKeyDown={handleKeyDown} style={S.input} placeholder="Escribi tu consulta..." />
        <button onClick={handleSend} disabled={sending || !input.trim()} style={Object.assign({}, S.sendBtn, {opacity:sending||!input.trim()?.5:1})}>
          Enviar
        </button>
      </div>}
    </div>}
  </>;
}
