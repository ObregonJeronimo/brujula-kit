import { useState, useEffect } from "react";
import { db, collection, getDocs, doc, getDoc, updateDoc, query, orderBy, limit } from "../firebase.js";
import "../styles/ChangelogModal.css";

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

  return <div className="clm-overlay">
    <div className="clm-card">

      <div className="clm-header">
        <div className="clm-compass" dangerouslySetInnerHTML={{__html:COMPASS_SVG}} />
        <div className="clm-header-content">
          <div className="clm-kicker">CHANGELOG</div>
          <div className="clm-title">{"¿Qué hay de nuevo en"}<br/>{"Brújula KIT?"}</div>
        </div>
      </div>

      <div className="clm-body">
        {logs.map(function(log, idx){
          var withDivider = idx < logs.length-1;
          return <div key={log._id} className={"clm-item"+(withDivider?" clm-item--with-divider":"")}>
            <div className="clm-meta">
              <span className="clm-version">{"v" + log.version}</span>
              <span className="clm-date">{log.fecha}</span>
            </div>
            <div className="clm-item-title">{log.titulo}</div>
            {log.subtitulo && <div className="clm-item-subtitle">{log.subtitulo}</div>}
            <div className="clm-item-desc">{log.descripcion}</div>
          </div>;
        })}
      </div>

      <div className="clm-footer">
        <button onClick={dismiss} className="clm-accept-btn">
          Aceptar
        </button>
      </div>
    </div>
  </div>;
}
