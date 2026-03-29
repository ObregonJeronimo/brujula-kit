import { useState, useEffect } from "react";
import { db, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, limit } from "../firebase.js";
import { K } from "../lib/fb.js";

export default function ChangelogAdmin({ nfy }) {
  var _logs = useState([]), logs = _logs[0], setLogs = _logs[1];
  var _loading = useState(true), loading = _loading[0], setLoading = _loading[1];
  var _showForm = useState(false), showForm = _showForm[0], setShowForm = _showForm[1];
  var _saving = useState(false), saving = _saving[0], setSaving = _saving[1];
  var _form = useState({ version:"", titulo:"", subtitulo:"", descripcion:"", fecha:"" }), form = _form[0], setForm = _form[1];

  var loadLogs = function(){
    setLoading(true);
    var q2 = query(collection(db, "changelogs"), orderBy("fecha", "desc"), limit(5));
    getDocs(q2).then(function(snap){
      setLogs(snap.docs.map(function(d){ return Object.assign({ _id: d.id }, d.data()); }));
    }).catch(function(e){ console.error(e); }).finally(function(){ setLoading(false); });
  };

  useEffect(function(){ loadLogs(); }, []);

  var publish = function(){
    if(!form.version.trim() || !form.titulo.trim() || !form.descripcion.trim()){ nfy("Complete versión, título y descripción", "er"); return; }
    setSaving(true);
    var data = {
      version: form.version.trim(),
      titulo: form.titulo.trim(),
      subtitulo: (form.subtitulo || "").trim(),
      descripcion: form.descripcion.trim(),
      fecha: form.fecha || new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString()
    };
    addDoc(collection(db, "changelogs"), data).then(function(){
      nfy("Changelog publicado", "ok");
      setForm({ version:"", titulo:"", subtitulo:"", descripcion:"", fecha:"" });
      setShowForm(false);
      loadLogs();
    }).catch(function(e){ nfy("Error: " + e.message, "er"); }).finally(function(){ setSaving(false); });
  };

  var deleteLog = function(id){
    if(!window.confirm("¿Eliminar este changelog?")) return;
    deleteDoc(doc(db, "changelogs", id)).then(function(){
      nfy("Changelog eliminado", "ok");
      loadLogs();
    }).catch(function(e){ nfy("Error: " + e.message, "er"); });
  };

  var I = { width:"100%", padding:"10px 14px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:14, background:"#f8faf9" };

  return <div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <div>
        <h2 style={{fontSize:16,fontWeight:700,color:K.sd,margin:0}}>Changelog</h2>
        <p style={{fontSize:12,color:"#94a3b8",margin:"4px 0 0"}}>{"Últimas 5 publicaciones"}</p>
      </div>
      {!showForm && <button onClick={function(){ setShowForm(true); setForm({ version:"", titulo:"", subtitulo:"", descripcion:"", fecha: new Date().toISOString().split("T")[0] }); }} style={{padding:"10px 20px",background:K.ac,color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer"}}>+ Nuevo changelog</button>}
    </div>

    {showForm && <div style={{background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:24,marginBottom:20}}>
      <h3 style={{fontSize:15,fontWeight:700,color:K.sd,marginBottom:16}}>Nuevo changelog</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
        <div>
          <label style={{fontSize:12,fontWeight:600,color:"#64748b",display:"block",marginBottom:4}}>{"Versión"}</label>
          <input value={form.version} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{version:e.target.value}); }); }} style={I} placeholder="Ej: 1.0.0.5" />
        </div>
        <div>
          <label style={{fontSize:12,fontWeight:600,color:"#64748b",display:"block",marginBottom:4}}>{"Fecha de publicación"}</label>
          <input type="date" value={form.fecha} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{fecha:e.target.value}); }); }} style={I} />
        </div>
      </div>
      <div style={{marginBottom:14}}>
        <label style={{fontSize:12,fontWeight:600,color:"#64748b",display:"block",marginBottom:4}}>{"Título"}</label>
        <input value={form.titulo} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{titulo:e.target.value}); }); }} style={I} placeholder="Ej: Nuevas evaluaciones" />
      </div>
      <div style={{marginBottom:14}}>
        <label style={{fontSize:12,fontWeight:600,color:"#64748b",display:"block",marginBottom:4}}>{"Subtítulo"} <span style={{fontWeight:400,color:"#94a3b8"}}>(opcional)</span></label>
        <input value={form.subtitulo} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{subtitulo:e.target.value}); }); }} style={I} placeholder="Ej: Ahora están disponibles estas actualizaciones" />
      </div>
      <div style={{marginBottom:14}}>
        <label style={{fontSize:12,fontWeight:600,color:"#64748b",display:"block",marginBottom:4}}>{"Descripción"}</label>
        <textarea value={form.descripcion} onChange={function(e){ setForm(function(p){ return Object.assign({},p,{descripcion:e.target.value}); }); }} rows={5} style={Object.assign({},I,{resize:"vertical",fontFamily:"inherit"})} placeholder="Detalle de los cambios realizados..." />
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={publish} disabled={saving} style={{padding:"10px 24px",background:K.ac,color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:saving?"wait":"pointer",opacity:saving?.7:1}}>{"Publicar"}</button>
        <button onClick={function(){ setShowForm(false); }} style={{padding:"10px 20px",background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,cursor:"pointer",color:"#64748b"}}>Cancelar</button>
      </div>
    </div>}

    {loading ? <div style={{textAlign:"center",padding:20,color:"#94a3b8",fontSize:13}}>Cargando...</div> :
      logs.length === 0 ? <div style={{textAlign:"center",padding:30,color:"#94a3b8",fontSize:13,fontStyle:"italic"}}>No hay changelogs publicados</div> :
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {logs.map(function(log){
          return <div key={log._id} style={{background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12}}>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                <span style={{background:"#f0fdfa",color:K.ac,padding:"2px 10px",borderRadius:6,fontSize:11,fontWeight:700,border:"1px solid #99f6e4"}}>{"v"+log.version}</span>
                <span style={{fontSize:11,color:"#94a3b8"}}>{log.fecha}</span>
              </div>
              <div style={{fontSize:14,fontWeight:700,color:K.sd}}>{log.titulo}</div>
              {log.subtitulo && <div style={{fontSize:12,color:"#64748b",marginTop:2}}>{log.subtitulo}</div>}
              <div style={{fontSize:12,color:"#475569",marginTop:6,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{log.descripcion}</div>
            </div>
            <button onClick={function(){ deleteLog(log._id); }} style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:6,padding:"6px 10px",fontSize:11,fontWeight:600,cursor:"pointer",color:"#dc2626",flexShrink:0}}>Eliminar</button>
          </div>;
        })}
      </div>}
  </div>;
}
