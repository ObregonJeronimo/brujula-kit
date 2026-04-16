import { useState, useEffect } from "react";
import { db, doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "../firebase.js";
import { ALL_EVAL_TYPES } from "../config/evalTypes.js";
import { K } from "../lib/fb.js";
import Admin from "./Admin.jsx";
import ChangelogAdmin from "./ChangelogAdmin.jsx";
import "../styles/AdminPanel.css";

export default function AdminPanel({ nfy }) {
  var _tab = useState("usuarios"), tab = _tab[0], setTab = _tab[1];
  var _toolsConfig = useState(null), toolsConfig = _toolsConfig[0], setToolsConfig = _toolsConfig[1];
  var _editTitle = useState({}), editTitle = _editTitle[0], setEditTitle = _editTitle[1];
  var _editDesc = useState({}), editDesc = _editDesc[0], setEditDesc = _editDesc[1];
  var _editAge = useState({}), editAge = _editAge[0], setEditAge = _editAge[1];
  var _editTime = useState({}), editTime = _editTime[0], setEditTime = _editTime[1];
  var _saving = useState(false), saving = _saving[0], setSaving = _saving[1];
  var _themeColors = useState({primary:"#0a3d2f",secondary:"#0d9488",primaryAlpha:100,secondaryAlpha:100}), themeColors = _themeColors[0], setThemeColors = _themeColors[1];
  var _themeSaving = useState(false), themeSaving = _themeSaving[0], setThemeSaving = _themeSaving[1];
  var _fonAudios = useState(null), fonAudios = _fonAudios[0], setFonAudios = _fonAudios[1];
  var _playingAudio = useState(null), playingAudio = _playingAudio[0], setPlayingAudio = _playingAudio[1];

  useEffect(function(){
    if(tab === "audios" && fonAudios === null){
      getDocs(collection(db,"fon_audios")).then(function(snap){
        var audios = {};
        snap.docs.forEach(function(d){ audios[d.id] = d.data().audio; });
        setFonAudios(audios);
      }).catch(function(){ setFonAudios({}); });
    }
  },[tab, fonAudios]);

  useEffect(function(){
    getDoc(doc(db, "config", "tools")).then(function(snap){
      if(snap.exists()){ setToolsConfig(snap.data()); }
      else { var def = {}; ALL_EVAL_TYPES.forEach(function(t){ def[t.id] = { enabled: t.id !== "eldi", title: t.fullName, desc: t.desc }; }); setDoc(doc(db, "config", "tools"), def); setToolsConfig(def); }
    }).catch(function(){ var def = {}; ALL_EVAL_TYPES.forEach(function(t){ def[t.id] = { enabled: t.id !== "eldi", title: t.fullName, desc: t.desc }; }); setToolsConfig(def); });
  }, []);

  useEffect(function(){
    getDoc(doc(db, "config", "theme")).then(function(snap){
      if(snap.exists()) setThemeColors(Object.assign({primary:"#0a3d2f",secondary:"#0d9488",primaryAlpha:100,secondaryAlpha:100}, snap.data()));
    });
  }, []);

  var saveTheme = function(){
    setThemeSaving(true);
    setDoc(doc(db, "config", "theme"), themeColors).then(function(){ nfy("Colores guardados. Recargá la página para ver los cambios.", "ok"); setThemeSaving(false); }).catch(function(e){ nfy("Error: "+e.message,"er"); setThemeSaving(false); });
  };

  var PALETTE = [
    {n:"Blanco",c:"#ffffff"},{n:"Verde oscuro",c:"#0a3d2f"},{n:"Verde azulado",c:"#0d9488"},{n:"Esmeralda",c:"#059669"},
    {n:"Azul marino",c:"#1e3a5f"},{n:"Azul",c:"#2563eb"},{n:"Indigo",c:"#4f46e5"},
    {n:"Violeta",c:"#7c3aed"},{n:"Fucsia",c:"#c026d3"},{n:"Rosa",c:"#e11d48"},
    {n:"Rojo",c:"#dc2626"},{n:"Naranja",c:"#ea580c"},{n:"Ambar",c:"#d97706"},
    {n:"Lima",c:"#65a30d"},{n:"Cyan",c:"#0891b2"},{n:"Slate",c:"#475569"},
    {n:"Negro",c:"#1e293b"}
  ];

  var toggleTool = function(id){
    var updated = Object.assign({}, toolsConfig);
    if(!updated[id]) updated[id] = { enabled: true, title: "", desc: "" };
    updated[id] = Object.assign({}, updated[id], { enabled: !updated[id].enabled });
    setToolsConfig(updated); setSaving(true);
    setDoc(doc(db, "config", "tools"), updated).then(function(){ nfy((updated[id].enabled ? "Activada: " : "Desactivada: ") + id.toUpperCase(), "ok"); setSaving(false); }).catch(function(e){ nfy("Error: " + e.message, "er"); setSaving(false); });
  };

  var saveTitleDesc = function(id){
    var updated = Object.assign({}, toolsConfig);
    if(!updated[id]) updated[id] = { enabled: true };
    updated[id] = Object.assign({}, updated[id], { title: editTitle[id] !== undefined ? editTitle[id] : (updated[id].title || ""), desc: editDesc[id] !== undefined ? editDesc[id] : (updated[id].desc || ""), age: editAge[id] !== undefined ? editAge[id] : (updated[id].age || ""), time: editTime[id] !== undefined ? editTime[id] : (updated[id].time || "") });
    setToolsConfig(updated); setSaving(true);
    setDoc(doc(db, "config", "tools"), updated).then(function(){ nfy("Guardado", "ok"); setEditTitle(function(p){ var n = Object.assign({},p); delete n[id]; return n; }); setEditDesc(function(p){ var n = Object.assign({},p); delete n[id]; return n; }); setEditAge(function(p){ var n = Object.assign({},p); delete n[id]; return n; }); setEditTime(function(p){ var n = Object.assign({},p); delete n[id]; return n; }); setSaving(false); }).catch(function(e){ nfy("Error: " + e.message, "er"); setSaving(false); });
  };

  var ADMIN_TABS = [["usuarios","\ud83d\udc65 Usuarios"],["changelog","\ud83d\udcdd Changelog"],["herramientas","\ud83e\uddf0 Herramientas"],["colores","\ud83c\udfa8 Colores"],["audios","\ud83c\udfa4 Audios"],["datos","\ud83d\uddd1\ufe0f Datos"]];

  return (
    <div className="adm-page">
      <h1 className="adm-title">{"⚙️ Administrar"}</h1>
      <p className="adm-subtitle">Panel de administración del sistema</p>

      <div className="adm-tabs">
        {ADMIN_TABS.map(function(t){
          return <button key={t[0]} onClick={function(){setTab(t[0])}} className={"adm-tab"+(tab===t[0]?" adm-tab--active":"")}>{t[1]}</button>;
        })}
      </div>

      {tab==="usuarios" && <Admin nfy={nfy} />}
      {tab==="changelog" && <ChangelogAdmin nfy={nfy} />}

      {tab==="herramientas" && <div>
        <p className="adm-desc">{"Activá o desactivá herramientas para los usuarios. Podés editar el título y descripción."}</p>
        <div className="adm-tools-list">
          {ALL_EVAL_TYPES.map(function(t){
            var cfg = (toolsConfig && toolsConfig[t.id]) || { enabled: true, title: t.fullName, desc: t.desc };
            var isEnabled = cfg.enabled !== false;
            var isEditing = editTitle[t.id] !== undefined || editDesc[t.id] !== undefined;
            var currentTitle = editTitle[t.id] !== undefined ? editTitle[t.id] : (cfg.title || t.fullName);
            var currentDesc = editDesc[t.id] !== undefined ? editDesc[t.id] : (cfg.desc || t.desc);

            return <div key={t.id} className={"adm-tool-card"+(isEnabled?"":" adm-tool-card--disabled")}>
              <div className={"adm-tool-header"+(isEnabled?"":" adm-tool-header--disabled")} style={isEnabled?{background:"linear-gradient(135deg,"+t.color+","+t.color+"cc)"}:undefined}>
                <div className="adm-tool-header-left">
                  <span className="adm-tool-icon">{t.icon}</span>
                  <div>
                    <div className={"adm-tool-name"+(isEnabled?"":" adm-tool-name--disabled")}>{cfg.title || t.fullName}</div>
                    <div className={"adm-tool-meta"+(isEnabled?"":" adm-tool-meta--disabled")}>{t.id.toUpperCase()+" · "+(cfg.age||t.age||"")+" · "+(cfg.time||t.time||"")}</div>
                  </div>
                </div>
                <button onClick={function(){toggleTool(t.id)}} className={"adm-toggle "+(isEnabled?"adm-toggle--on":"adm-toggle--off")}>
                  <div className="adm-toggle-knob"></div>
                </button>
              </div>
              <div className="adm-tool-body">
                {!isEditing ? <div>
                  <div className="adm-tool-body-desc">{cfg.desc || t.desc}</div>
                  <div className="adm-tool-actions">
                    <button onClick={function(){
                      var updated = Object.assign({}, toolsConfig);
                      if(!updated[t.id]) updated[t.id] = { enabled: true };
                      updated[t.id] = Object.assign({}, updated[t.id], { showAge: cfg.showAge === false ? true : false });
                      setToolsConfig(updated);
                      setDoc(doc(db, "config", "tools"), updated).then(function(){ nfy("Edad "+(updated[t.id].showAge?"visible":"oculta"),"ok"); });
                    }} className={"adm-age-toggle-btn "+(cfg.showAge!==false?"adm-age-toggle-btn--on":"adm-age-toggle-btn--off")}>
                      <span className="adm-toggle-mini" style={{background:cfg.showAge!==false?"#059669":"#dc2626"}}><span className="adm-toggle-mini-knob" style={{left:cfg.showAge!==false?"18px":"2px"}}></span></span>
                      {"Edad: "+(cfg.showAge!==false?"visible":"oculta")}
                    </button>
                    <button onClick={function(){
                      setEditTitle(function(p){ return Object.assign({},p,{[t.id]:cfg.title||t.fullName}); });
                      setEditDesc(function(p){ return Object.assign({},p,{[t.id]:cfg.desc||t.desc}); });
                      setEditAge(function(p){ return Object.assign({},p,{[t.id]:cfg.age||t.age||""}); });
                      setEditTime(function(p){ return Object.assign({},p,{[t.id]:cfg.time||t.time||""}); });
                    }} className="adm-edit-btn">{"Editar"}</button>
                  </div>
                </div> : <div>
                  <div className="adm-edit-field"><label className="adm-edit-label">Titulo</label><input value={currentTitle} onChange={function(e){setEditTitle(function(p){return Object.assign({},p,{[t.id]:e.target.value})})}} className="adm-edit-input" /></div>
                  <div className="adm-edit-field"><label className="adm-edit-label">Descripcion</label><textarea value={currentDesc} onChange={function(e){setEditDesc(function(p){return Object.assign({},p,{[t.id]:e.target.value})})}} rows={3} className="adm-edit-input adm-edit-textarea" /></div>
                  <div className="adm-edit-grid">
                    <div>
                      <div className="adm-edit-label-row">
                        <label className="adm-edit-label adm-edit-label--inline">Edad recomendada</label>
                        <button onClick={function(){ var updated = Object.assign({}, toolsConfig); if(!updated[t.id]) updated[t.id] = { enabled: true }; updated[t.id] = Object.assign({}, updated[t.id], { showAge: !cfg.showAge }); setToolsConfig(updated); setDoc(doc(db, "config", "tools"), updated); }} className="adm-age-inline-btn" style={{color:cfg.showAge!==false?"#059669":"#dc2626"}}>
                          <span className="adm-toggle-mini" style={{background:cfg.showAge!==false?"#059669":"#dc2626"}}><span className="adm-toggle-mini-knob" style={{left:cfg.showAge!==false?"18px":"2px"}}></span></span>
                          {cfg.showAge!==false?"Visible":"Oculta"}
                        </button>
                      </div>
                      <input value={editAge[t.id]||""} onChange={function(e){setEditAge(function(p){return Object.assign({},p,{[t.id]:e.target.value})})}} placeholder="ej: 3-6 anos" className="adm-edit-input" />
                    </div>
                    <div><label className="adm-edit-label">Tiempo estimado</label><input value={editTime[t.id]||""} onChange={function(e){setEditTime(function(p){return Object.assign({},p,{[t.id]:e.target.value})})}} placeholder="ej: ~20 min" className="adm-edit-input" /></div>
                  </div>
                  <div className="adm-edit-actions">
                    <button onClick={function(){saveTitleDesc(t.id)}} disabled={saving} className="adm-btn-save">Guardar</button>
                    <button onClick={function(){ setEditTitle(function(p){ var n=Object.assign({},p); delete n[t.id]; return n; }); setEditDesc(function(p){ var n=Object.assign({},p); delete n[t.id]; return n; }); setEditAge(function(p){ var n=Object.assign({},p); delete n[t.id]; return n; }); setEditTime(function(p){ var n=Object.assign({},p); delete n[t.id]; return n; }); }} className="adm-btn-cancel">Cancelar</button>
                  </div>
                </div>}
                {!isEnabled && <div className="adm-disabled-warn">{"⚠ Desactivada — no visible para usuarios"}</div>}
              </div>
            </div>;
          })}
        </div>
      </div>}

      {tab==="colores" && <div>
        <p className="adm-desc">{"Personalizá los colores de la aplicación. Los cambios se aplican para todos los usuarios."}</p>
        <div className="adm-colors-card">
          <div className="adm-colors-title">Color Primario</div>
          <div className="adm-colors-desc">{"Sidebar, encabezados principales y botones de acción"}</div>
          <div className="adm-palette">{PALETTE.map(function(p){ var sel = themeColors.primary===p.c; return <button key={p.c} onClick={function(){setThemeColors(function(prev){return Object.assign({},prev,{primary:p.c})})}} title={p.n} className={"adm-palette-swatch"+(sel?" adm-palette-swatch--sel":"")} style={{background:p.c}} />; })}</div>
          <div className="adm-alpha-row"><span className="adm-alpha-label">Intensidad</span><input type="range" min="30" max="100" value={themeColors.primaryAlpha} onChange={function(e){setThemeColors(function(prev){return Object.assign({},prev,{primaryAlpha:parseInt(e.target.value)})})}} className="adm-alpha-slider" style={{accentColor:themeColors.primary}} /><span className="adm-alpha-value" style={{color:themeColors.primary}}>{themeColors.primaryAlpha+"%"}</span></div>
          <div className="adm-preview" style={{background:themeColors.primary,opacity:themeColors.primaryAlpha/100}}>Vista previa</div>
        </div>
        <div className="adm-colors-card">
          <div className="adm-colors-title">Color Secundario</div>
          <div className="adm-colors-desc">Acentos, badges, botones secundarios y enlaces</div>
          <div className="adm-palette">{PALETTE.map(function(p){ var sel = themeColors.secondary===p.c; return <button key={p.c} onClick={function(){setThemeColors(function(prev){return Object.assign({},prev,{secondary:p.c})})}} title={p.n} className={"adm-palette-swatch"+(sel?" adm-palette-swatch--sel":"")} style={{background:p.c}} />; })}</div>
          <div className="adm-alpha-row"><span className="adm-alpha-label">Intensidad</span><input type="range" min="30" max="100" value={themeColors.secondaryAlpha} onChange={function(e){setThemeColors(function(prev){return Object.assign({},prev,{secondaryAlpha:parseInt(e.target.value)})})}} className="adm-alpha-slider" style={{accentColor:themeColors.secondary}} /><span className="adm-alpha-value" style={{color:themeColors.secondary}}>{themeColors.secondaryAlpha+"%"}</span></div>
          <div className="adm-preview" style={{background:themeColors.secondary,opacity:themeColors.secondaryAlpha/100}}>Vista previa</div>
        </div>
        <div className="adm-colors-card">
          <div className="adm-colors-title adm-colors-title--spaced">Vista previa combinada</div>
          <div className="adm-preview-combo">
            <div className="adm-preview-sidebar" style={{background:themeColors.primary,opacity:themeColors.primaryAlpha/100}}>Sidebar</div>
            <div className="adm-preview-content">
              <div className="adm-preview-btn" style={{background:themeColors.secondary,opacity:themeColors.secondaryAlpha/100}}>{"Botón"}</div>
              <div className="adm-preview-link" style={{border:"1px solid "+themeColors.secondary,color:themeColors.secondary}}>Enlace</div>
            </div>
          </div>
        </div>
        <button onClick={saveTheme} disabled={themeSaving} className="adm-save-btn" style={{background:themeColors.primary,opacity:themeSaving?.7:1,cursor:themeSaving?"wait":"pointer"}}>
          {themeSaving ? "Guardando..." : "Guardar colores"}
        </button>
      </div>}

      {tab==="audios" && <div>
        <p className="adm-desc">{"Audios guardados para la Evaluación Fonética. Se reproducen cuando el usuario toca Escuchar."}</p>
        {fonAudios === null ? <div className="adm-audios-loading">{"Cargando audios..."}</div> : (function(){
          var keys = Object.keys(fonAudios).sort();
          if(keys.length === 0) return <div className="adm-audios-empty">{"No hay audios grabados. Andá a Herramientas → Evaluación Fonética para grabar."}</div>;
          return <div>
            <div className="adm-audios-header">
              <div className="adm-audios-count">{keys.length + " audios grabados"}</div>
              <button onClick={function(){ setFonAudios(null); }} className="adm-audios-reload">{"Recargar"}</button>
            </div>
            <div className="adm-audios-grid">
              {keys.map(function(k){
                return <div key={k} className="adm-audio-item">
                  <button onClick={function(){
                    if(playingAudio === k){ setPlayingAudio(null); return; }
                    setPlayingAudio(k);
                    var a = new Audio(fonAudios[k]);
                    a.onended = function(){ setPlayingAudio(null); };
                    a.play().catch(function(){ setPlayingAudio(null); });
                  }} className={"adm-audio-play"+(playingAudio===k?" adm-audio-play--playing":"")}>{playingAudio===k?"\u23f9":"\u25b6"}</button>
                  <span className="adm-audio-name">{k}</span>
                  <button onClick={function(){
                    var ok = window.confirm("\u26a0\ufe0f Eliminar audio de '"+k+"'?\n\nEste audio fue grabado manualmente y no se puede recuperar.\n\u00bfEst\u00e1s seguro?");
                    if(!ok) return;
                    deleteDoc(doc(db,"fon_audios",k)).then(function(){
                      var next = Object.assign({}, fonAudios);
                      delete next[k];
                      setFonAudios(next);
                      nfy("Audio '"+k+"' eliminado","ok");
                    }).catch(function(e){ nfy("Error: "+e.message,"er"); });
                  }} className="adm-audio-del">{"\u00d7"}</button>
                </div>;
              })}
            </div>
          </div>;
        })()}
      </div>}

      {tab==="datos" && <div>
        <p className="adm-desc">{"Herramientas de mantenimiento de datos. Estas acciones son irreversibles."}</p>

        <div className="adm-danger-card">
          <div className="adm-danger-title">{"Borrar todas las evaluaciones"}</div>
          <div className="adm-danger-desc">{"Elimina todas las evaluaciones e informes complementarios de la base de datos. Los usuarios y créditos no se ven afectados."}</div>
          <button onClick={function(){
            var ok = window.confirm("ATENCION: Esto borrar\u00e1 TODAS las evaluaciones de TODOS los usuarios.\n\nEsta acci\u00f3n es IRREVERSIBLE.\n\n\u00bfEst\u00e1s seguro?");
            if(!ok) return;
            var ok2 = window.confirm("ULTIMA CONFIRMACION:\n\nSe borrar\u00e1n todas las evaluaciones y estad\u00edsticas volver\u00e1n a 0.\n\nEscrib\u00ed OK para confirmar... (cancel para cancelar)");
            if(!ok2) return;
            getDocs(collection(db,"evaluaciones")).then(function(snap){
              var promises = snap.docs.map(function(d){ return deleteDoc(doc(db,"evaluaciones",d.id)); });
              return Promise.all(promises);
            }).then(function(){ nfy("Todas las evaluaciones fueron borradas","ok"); }).catch(function(e){ nfy("Error: "+e.message,"er"); });
          }} className="adm-danger-btn">{"Borrar evaluaciones"}</button>
        </div>

        <div className="adm-danger-card">
          <div className="adm-danger-title">{"Borrar historial de pagos"}</div>
          <div className="adm-danger-desc">{"Elimina todos los registros de pagos. Los créditos actuales de los usuarios no se modifican."}</div>
          <button onClick={function(){
            var ok = window.confirm("Esto borrar\u00e1 todos los registros de pagos.\n\nLos cr\u00e9ditos de los usuarios NO se modifican.\n\n\u00bfEst\u00e1s seguro?");
            if(!ok) return;
            getDocs(collection(db,"pagos")).then(function(snap){
              var promises = snap.docs.map(function(d){ return deleteDoc(doc(db,"pagos",d.id)); });
              return Promise.all(promises);
            }).then(function(){ nfy("Historial de pagos borrado","ok"); }).catch(function(e){ nfy("Error: "+e.message,"er"); });
          }} className="adm-danger-btn">{"Borrar pagos"}</button>
        </div>

        <div className="adm-danger-card">
          <div className="adm-danger-title">{"Resetear TODO (evaluaciones + pagos)"}</div>
          <div className="adm-danger-desc">{"Borra todas las evaluaciones y todos los pagos. Las estadísticas vuelven a 0. Los usuarios y sus créditos actuales no se tocan."}</div>
          <button onClick={function(){
            var ok = window.confirm("RESETEAR TODO:\n\nSe borrar\u00e1n TODAS las evaluaciones y TODOS los pagos.\n\nEsta acci\u00f3n es IRREVERSIBLE.\n\n\u00bfEst\u00e1s completamente seguro?");
            if(!ok) return;
            Promise.all([
              getDocs(collection(db,"evaluaciones")).then(function(snap){ return Promise.all(snap.docs.map(function(d){ return deleteDoc(doc(db,"evaluaciones",d.id)); })); }),
              getDocs(collection(db,"pagos")).then(function(snap){ return Promise.all(snap.docs.map(function(d){ return deleteDoc(doc(db,"pagos",d.id)); })); })
            ]).then(function(){ nfy("Todo reseteado a 0","ok"); }).catch(function(e){ nfy("Error: "+e.message,"er"); });
          }} className="adm-danger-btn adm-danger-btn--extreme">{"Resetear TODO"}</button>
        </div>
      </div>}
    </div>
  );
}
