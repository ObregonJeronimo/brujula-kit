import { useState, useEffect } from "react";
import { db, collection, getDocs, doc, getDoc, updateDoc, query, orderBy, limit } from "../firebase.js";

var COMPASS_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none" stroke="#0a3d2f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.12"><circle cx="100" cy="100" r="70"/><circle cx="100" cy="100" r="85"/><path d="M100 30 L100 15 M100 170 L100 185 M30 100 L15 100 M170 100 L185 100"/><polygon points="100,40 108,95 100,110 92,95" fill="#0a3d2f" stroke="none" opacity="0.15"/><polygon points="100,160 108,105 100,90 92,105" fill="#0d9488" stroke="none" opacity="0.1"/><circle cx="100" cy="100" r="6" fill="#0a3d2f" opacity="0.15"/><path d="M60 60 Q80 50 100 30 Q120 50 140 60" stroke-width="1.5"/><path d="M60 140 Q80 150 100 170 Q120 150 140 140" stroke-width="1.5"/></svg>';

export default function ChangelogModal({ userId, onClose }) {
  var _logs = useState([]), logs = _logs[0], setLogs = _logs[1];
  var _loading = useState(true), loading = _loading[0], setLoading = _loading[1];
  var _visible = useState(false), visible = _visible[0], setVisible = _visible[1];

  useEffect(function(){
    if(!userId) return;
    var q2 = query(collection(db, "changelogs"), orderBy("createdAt", "desc"), limit(5));
    getDocs(q2).then(function(snap){
      var all = snap.docs.map(function(d){ return Object.assign({ _id: d.id }, d.data()); });
      if(all.length === 0){ setLoading(false); return; }
      var latestId = all[0]._id;
      getDoc(doc(db, "usuarios", userId)).then(function(usnap){
        var userData = usnap.exists() ? usnap.data() : {};
        var lastSeen = userData.lastSeenChangelog || "";
        if(lastSeen !== latestId){
          setLogs(all);
          setVisible(true);
        }
        setLoading(false);
      }).catch(function(){ setLoading(false); });
    }).catch(function(){ setLoading(false); });
  }, [userId]);

  var dismiss = function(){
    setVisible(false);
    if(logs.length > 0 && userId){
      updateDoc(doc(db, "usuarios", userId), { lastSeenChangelog: logs[0]._id }).catch(function(){});
    }
    if(onClose) onClose();
  };

  if(loading || !visible || logs.length === 0) return null;

  return <div style={{position:"fixed",inset:0,zIndex:1100,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,.5)",backdropFilter:"blur(6px)",animation:"fi .2s ease"}}>
    <div style={{background:"#fff",borderRadius:20,width:560,maxWidth:"92vw",maxHeight:"85vh",overflow:"hidden",boxShadow:"0 24px 80px rgba(0,0,0,.25)",display:"flex",flexDirection:"column"}}>

      <div style={{background:"linear-gradient(135deg,#f0fdfa,#ccfbf1)",padding:"32px 32px 24px",position:"relative",overflow:"hidden",flexShrink:0}}>
        <div style={{position:"absolute",right:-20,top:-10,width:180,height:180,transform:"rotate(-20deg)",opacity:1}} dangerouslySetInnerHTML={{__html:COMPASS_SVG}} />
        <div style={{position:"relative",zIndex:1}}>
          <div style={{fontSize:11,fontWeight:700,color:"#0d9488",textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:6}}>CHANGELOG</div>
          <div style={{fontSize:22,fontWeight:800,color:"#0a3d2f",lineHeight:1.3}}>{"¿Qué hay de nuevo en"}<br/>{"Brújula KIT?"}</div>
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"20px 32px 8px"}}>
        {logs.map(function(log, idx){
          return <div key={log._id} style={{marginBottom:20,paddingBottom:idx < logs.length-1 ? 20 : 0,borderBottom:idx < logs.length-1 ? "1px solid #f1f5f9" : "none"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              <span style={{background:"#0d9488",color:"#fff",padding:"3px 10px",borderRadius:6,fontSize:11,fontWeight:700}}>{"v" + log.version}</span>
              <span style={{fontSize:11,color:"#94a3b8"}}>{log.fecha}</span>
            </div>
            <div style={{fontSize:16,fontWeight:700,color:"#0a3d2f",marginBottom:2}}>{log.titulo}</div>
            {log.subtitulo && <div style={{fontSize:13,color:"#64748b",marginBottom:6,fontStyle:"italic"}}>{log.subtitulo}</div>}
            <div style={{fontSize:13,color:"#475569",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{log.descripcion}</div>
          </div>;
        })}
      </div>

      <div style={{padding:"16px 32px 24px",flexShrink:0}}>
        <button onClick={dismiss} style={{width:"100%",padding:"14px",background:"linear-gradient(135deg,#0a3d2f,#0d9488)",color:"#fff",border:"none",borderRadius:12,fontSize:15,fontWeight:700,cursor:"pointer",transition:"all .15s"}}>
          Aceptar
        </button>
      </div>
    </div>
  </div>;
}
