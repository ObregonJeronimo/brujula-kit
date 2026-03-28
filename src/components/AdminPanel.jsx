import { useState, useEffect } from "react";
import { db, doc, getDoc, setDoc } from "../firebase.js";
import { ALL_EVAL_TYPES } from "../config/evalTypes.js";
import { K } from "../lib/fb.js";
import Admin from "./Admin.jsx";

var TOOLS_DOC = "config/tools";

export default function AdminPanel({ nfy }) {
  var _tab = useState("usuarios"), tab = _tab[0], setTab = _tab[1];
  var _toolsConfig = useState(null), toolsConfig = _toolsConfig[0], setToolsConfig = _toolsConfig[1];
  var _editTitle = useState({}), editTitle = _editTitle[0], setEditTitle = _editTitle[1];
  var _editDesc = useState({}), editDesc = _editDesc[0], setEditDesc = _editDesc[1];
  var _editAge = useState({}), editAge = _editAge[0], setEditAge = _editAge[1];
  var _editTime = useState({}), editTime = _editTime[0], setEditTime = _editTime[1];
  var _saving = useState(false), saving = _saving[0], setSaving = _saving[1];
  // Theme colors
  var _themeColors = useState({primary:"#0a3d2f",secondary:"#0d9488",primaryAlpha:100,secondaryAlpha:100}), themeColors = _themeColors[0], setThemeColors = _themeColors[1];
  var _themeSaving = useState(false), themeSaving = _themeSaving[0], setThemeSaving = _themeSaving[1];

  // Load tools config from Firestore
  useEffect(function(){
    getDoc(doc(db, "config", "tools")).then(function(snap){
      if(snap.exists()){
        setToolsConfig(snap.data());
      } else {
        // Initialize default config
        var def = {};
        ALL_EVAL_TYPES.forEach(function(t){
          def[t.id] = { enabled: t.id !== "eldi", title: t.fullName, desc: t.desc };
        });
        setDoc(doc(db, "config", "tools"), def);
        setToolsConfig(def);
      }
    }).catch(function(){ 
      // Fallback: all enabled
      var def = {};
      ALL_EVAL_TYPES.forEach(function(t){
        def[t.id] = { enabled: t.id !== "eldi", title: t.fullName, desc: t.desc };
      });
      setToolsConfig(def);
    });
  }, []);

  // Load theme
  useEffect(function(){
    getDoc(doc(db, "config", "theme")).then(function(snap){
      if(snap.exists()) setThemeColors(Object.assign({primary:"#0a3d2f",secondary:"#0d9488",primaryAlpha:100,secondaryAlpha:100}, snap.data()));
    });
  }, []);

  var saveTheme = function(){
    setThemeSaving(true);
    setDoc(doc(db, "config", "theme"), themeColors).then(function(){
      nfy("Colores guardados. Recarg\u00e1 la p\u00e1gina para ver los cambios.", "ok");
      setThemeSaving(false);
    }).catch(function(e){ nfy("Error: "+e.message,"er"); setThemeSaving(false); });
  };

  var PALETTE = [
    {n:"Verde oscuro",c:"#0a3d2f"},{n:"Verde azulado",c:"#0d9488"},{n:"Esmeralda",c:"#059669"},
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
    setToolsConfig(updated);
    setSaving(true);
    setDoc(doc(db, "config", "tools"), updated).then(function(){
      nfy((updated[id].enabled ? "Activada: " : "Desactivada: ") + id.toUpperCase(), "ok");
      setSaving(false);
    }).catch(function(e){ nfy("Error: " + e.message, "er"); setSaving(false); });
  };

  var saveTitleDesc = function(id){
    var updated = Object.assign({}, toolsConfig);
    if(!updated[id]) updated[id] = { enabled: true };
    updated[id] = Object.assign({}, updated[id], { 
      title: editTitle[id] !== undefined ? editTitle[id] : (updated[id].title || ""),
      desc: editDesc[id] !== undefined ? editDesc[id] : (updated[id].desc || ""),
      age: editAge[id] !== undefined ? editAge[id] : (updated[id].age || ""),
      time: editTime[id] !== undefined ? editTime[id] : (updated[id].time || "")
    });
    setToolsConfig(updated);
    setSaving(true);
    setDoc(doc(db, "config", "tools"), updated).then(function(){
      nfy("Guardado", "ok");
      setEditTitle(function(p){ var n = Object.assign({},p); delete n[id]; return n; });
      setEditDesc(function(p){ var n = Object.assign({},p); delete n[id]; return n; });
      setEditAge(function(p){ var n = Object.assign({},p); delete n[id]; return n; });
      setEditTime(function(p){ var n = Object.assign({},p); delete n[id]; return n; });
      setSaving(false);
    }).catch(function(e){ nfy("Error: " + e.message, "er"); setSaving(false); });
  };

  return (
    <div style={{animation:"fi .3s ease",width:"100%",maxWidth:900}}>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>{"⚙️ Administrar"}</h1>
      <p style={{color:K.mt,fontSize:14,marginBottom:16}}>Panel de administración del sistema</p>

      <div style={{display:"flex",gap:6,marginBottom:20}}>
        {[["usuarios","\ud83d\udc65 Usuarios"],["herramientas","\ud83e\uddf0 Herramientas"],["colores","\ud83c\udfa8 Colores"]].map(function(t){
          return <button key={t[0]} onClick={function(){setTab(t[0])}} style={{padding:"10px 20px",borderRadius:8,border:tab===t[0]?"2px solid "+K.ac:"1px solid #e2e8f0",background:tab===t[0]?"#ccfbf1":"#fff",color:tab===t[0]?K.ac:"#475569",fontSize:13,fontWeight:600,cursor:"pointer"}}>{t[1]}</button>;
        })}
      </div>

      {tab==="usuarios" && <Admin nfy={nfy} />}

      {tab==="herramientas" && <div>
        <p style={{fontSize:13,color:K.mt,marginBottom:16}}>Activá o desactivá herramientas para los usuarios. Podés editar el título y descripción.</p>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {ALL_EVAL_TYPES.map(function(t){
            var cfg = (toolsConfig && toolsConfig[t.id]) || { enabled: true, title: t.fullName, desc: t.desc };
            var isEnabled = cfg.enabled !== false;
            var isEditing = editTitle[t.id] !== undefined || editDesc[t.id] !== undefined;
            var currentTitle = editTitle[t.id] !== undefined ? editTitle[t.id] : (cfg.title || t.fullName);
            var currentDesc = editDesc[t.id] !== undefined ? editDesc[t.id] : (cfg.desc || t.desc);

            return <div key={t.id} style={{background:"#fff",borderRadius:12,border:"1px solid "+(isEnabled?"#e2e8f0":"#fecaca"),overflow:"hidden",opacity:isEnabled?1:0.7}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",background:isEnabled?"linear-gradient(135deg,"+t.color+","+t.color+"cc)":"#f8f8f8"}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:28}}>{t.icon}</span>
                  <div>
                    <div style={{fontSize:16,fontWeight:700,color:isEnabled?"#fff":"#94a3b8"}}>{cfg.title || t.fullName}</div>
                    <div style={{fontSize:11,color:isEnabled?"rgba(255,255,255,.7)":"#cbd5e1"}}>{t.id.toUpperCase()+" · "+(cfg.age||t.age||"")+" · "+(cfg.time||t.time||"")}</div>
                  </div>
                </div>
                {/* Toggle */}
                <button onClick={function(){toggleTool(t.id)}} style={{width:52,height:28,borderRadius:14,border:"none",background:isEnabled?"#059669":"#dc2626",cursor:"pointer",position:"relative",transition:"background .2s"}}>
                  <div style={{width:22,height:22,borderRadius:11,background:"#fff",position:"absolute",top:3,left:isEnabled?27:3,transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}></div>
                </button>
              </div>
              <div style={{padding:"14px 20px"}}>
                {!isEditing ? <div>
                  <div style={{fontSize:13,color:"#475569",lineHeight:1.6,marginBottom:10}}>{cfg.desc || t.desc}</div>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                    <button onClick={function(){
                      var updated = Object.assign({}, toolsConfig);
                      if(!updated[t.id]) updated[t.id] = { enabled: true };
                      updated[t.id] = Object.assign({}, updated[t.id], { showAge: cfg.showAge === false ? true : false });
                      setToolsConfig(updated);
                      setDoc(doc(db, "config", "tools"), updated).then(function(){ nfy("Edad "+(updated[t.id].showAge?"visible":"oculta"),"ok"); });
                    }} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"1px solid #e2e8f0",borderRadius:8,padding:"6px 12px",cursor:"pointer",fontSize:11,fontWeight:600,color:cfg.showAge!==false?"#059669":"#dc2626"}}>
                      <span style={{width:32,height:16,borderRadius:8,background:cfg.showAge!==false?"#059669":"#dc2626",display:"inline-block",position:"relative"}}><span style={{width:12,height:12,borderRadius:6,background:"#fff",position:"absolute",top:2,left:cfg.showAge!==false?18:2,transition:"left .2s"}}></span></span>
                      {"Edad: "+(cfg.showAge!==false?"visible":"oculta")}
                    </button>
                    <button onClick={function(){
                    setEditTitle(function(p){ return Object.assign({},p,{[t.id]:cfg.title||t.fullName}); });
                    setEditDesc(function(p){ return Object.assign({},p,{[t.id]:cfg.desc||t.desc}); });
                    setEditAge(function(p){ return Object.assign({},p,{[t.id]:cfg.age||t.age||""}); });
                    setEditTime(function(p){ return Object.assign({},p,{[t.id]:cfg.time||t.time||""}); });
                  }} style={{padding:"6px 14px",background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:6,fontSize:11,fontWeight:600,cursor:"pointer",color:K.mt}}>{"Editar"}</button>
                  </div>
                </div> : <div>
                  <div style={{marginBottom:10}}>
                    <label style={{fontSize:11,fontWeight:600,color:K.mt,display:"block",marginBottom:3}}>Titulo</label>
                    <input value={currentTitle} onChange={function(e){setEditTitle(function(p){return Object.assign({},p,{[t.id]:e.target.value})})}} style={{width:"100%",padding:"8px 12px",border:"1px solid #e2e8f0",borderRadius:6,fontSize:13}} />
                  </div>
                  <div style={{marginBottom:10}}>
                    <label style={{fontSize:11,fontWeight:600,color:K.mt,display:"block",marginBottom:3}}>Descripcion</label>
                    <textarea value={currentDesc} onChange={function(e){setEditDesc(function(p){return Object.assign({},p,{[t.id]:e.target.value})})}} rows={3} style={{width:"100%",padding:"8px 12px",border:"1px solid #e2e8f0",borderRadius:6,fontSize:13,resize:"vertical",fontFamily:"inherit"}} />
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                        <label style={{fontSize:11,fontWeight:600,color:K.mt}}>Edad recomendada</label>
                        <button onClick={function(){
                          var updated = Object.assign({}, toolsConfig);
                          if(!updated[t.id]) updated[t.id] = { enabled: true };
                          updated[t.id] = Object.assign({}, updated[t.id], { showAge: !cfg.showAge });
                          setToolsConfig(updated);
                          setDoc(doc(db, "config", "tools"), updated);
                        }} style={{display:"flex",alignItems:"center",gap:4,background:"none",border:"none",cursor:"pointer",fontSize:10,color:cfg.showAge!==false?"#059669":"#dc2626",fontWeight:600}}>
                          <span style={{width:32,height:16,borderRadius:8,background:cfg.showAge!==false?"#059669":"#dc2626",display:"inline-block",position:"relative"}}><span style={{width:12,height:12,borderRadius:6,background:"#fff",position:"absolute",top:2,left:cfg.showAge!==false?18:2,transition:"left .2s"}}></span></span>
                          {cfg.showAge!==false?"Visible":"Oculta"}
                        </button>
                      </div>
                      <input value={editAge[t.id]||""} onChange={function(e){setEditAge(function(p){return Object.assign({},p,{[t.id]:e.target.value})})}} placeholder="ej: 3-6 anos" style={{width:"100%",padding:"8px 12px",border:"1px solid #e2e8f0",borderRadius:6,fontSize:13}} />
                    </div>
                    <div>
                      <label style={{fontSize:11,fontWeight:600,color:K.mt,display:"block",marginBottom:3}}>Tiempo estimado</label>
                      <input value={editTime[t.id]||""} onChange={function(e){setEditTime(function(p){return Object.assign({},p,{[t.id]:e.target.value})})}} placeholder="ej: ~20 min" style={{width:"100%",padding:"8px 12px",border:"1px solid #e2e8f0",borderRadius:6,fontSize:13}} />
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={function(){saveTitleDesc(t.id)}} disabled={saving} style={{padding:"8px 16px",background:K.ac,color:"#fff",border:"none",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer"}}>Guardar</button>
                    <button onClick={function(){
                      setEditTitle(function(p){ var n=Object.assign({},p); delete n[t.id]; return n; });
                      setEditDesc(function(p){ var n=Object.assign({},p); delete n[t.id]; return n; });
                      setEditAge(function(p){ var n=Object.assign({},p); delete n[t.id]; return n; });
                      setEditTime(function(p){ var n=Object.assign({},p); delete n[t.id]; return n; });
                    }} style={{padding:"8px 16px",background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:6,fontSize:12,cursor:"pointer",color:K.mt}}>Cancelar</button>
                  </div>
                </div>}
                {!isEnabled && <div style={{marginTop:10,padding:"8px 12px",background:"#fef2f2",borderRadius:6,fontSize:11,color:"#dc2626",fontWeight:600}}>{"⚠ Desactivada — no visible para usuarios"}</div>}
              </div>
            </div>;
          })}
        </div>
      </div>}

      {tab==="colores" && <div>
        <p style={{fontSize:13,color:K.mt,marginBottom:16}}>Personaliz\u00e1 los colores de la aplicaci\u00f3n. Los cambios se aplican para todos los usuarios.</p>

        {/* Color Primario */}
        <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:20,marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:700,color:"#1e293b",marginBottom:4}}>Color Primario</div>
          <div style={{fontSize:11,color:K.mt,marginBottom:12}}>Sidebar, encabezados principales y botones de acci\u00f3n</div>

          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
            {PALETTE.map(function(p){ var sel = themeColors.primary===p.c; return <button key={p.c} onClick={function(){setThemeColors(function(prev){return Object.assign({},prev,{primary:p.c})})}} title={p.n} style={{width:36,height:36,borderRadius:8,background:p.c,border:sel?"3px solid #000":"2px solid #e2e8f0",cursor:"pointer",transition:"all .15s",transform:sel?"scale(1.15)":"scale(1)",boxShadow:sel?"0 2px 8px rgba(0,0,0,.3)":"none"}} />; })}
          </div>

          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:11,fontWeight:600,color:K.mt,minWidth:70}}>Intensidad</span>
            <input type="range" min="30" max="100" value={themeColors.primaryAlpha} onChange={function(e){setThemeColors(function(prev){return Object.assign({},prev,{primaryAlpha:parseInt(e.target.value)})})}} style={{flex:1,accentColor:themeColors.primary}} />
            <span style={{fontSize:12,fontWeight:700,color:themeColors.primary,minWidth:35}}>{themeColors.primaryAlpha+"%"}</span>
          </div>

          <div style={{marginTop:12,height:40,borderRadius:8,background:themeColors.primary,opacity:themeColors.primaryAlpha/100,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:600}}>Vista previa</div>
        </div>

        {/* Color Secundario */}
        <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:20,marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:700,color:"#1e293b",marginBottom:4}}>Color Secundario</div>
          <div style={{fontSize:11,color:K.mt,marginBottom:12}}>Acentos, badges, botones secundarios y enlaces</div>

          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
            {PALETTE.map(function(p){ var sel = themeColors.secondary===p.c; return <button key={p.c} onClick={function(){setThemeColors(function(prev){return Object.assign({},prev,{secondary:p.c})})}} title={p.n} style={{width:36,height:36,borderRadius:8,background:p.c,border:sel?"3px solid #000":"2px solid #e2e8f0",cursor:"pointer",transition:"all .15s",transform:sel?"scale(1.15)":"scale(1)",boxShadow:sel?"0 2px 8px rgba(0,0,0,.3)":"none"}} />; })}
          </div>

          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:11,fontWeight:600,color:K.mt,minWidth:70}}>Intensidad</span>
            <input type="range" min="30" max="100" value={themeColors.secondaryAlpha} onChange={function(e){setThemeColors(function(prev){return Object.assign({},prev,{secondaryAlpha:parseInt(e.target.value)})})}} style={{flex:1,accentColor:themeColors.secondary}} />
            <span style={{fontSize:12,fontWeight:700,color:themeColors.secondary,minWidth:35}}>{themeColors.secondaryAlpha+"%"}</span>
          </div>

          <div style={{marginTop:12,height:40,borderRadius:8,background:themeColors.secondary,opacity:themeColors.secondaryAlpha/100,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:600}}>Vista previa</div>
        </div>

        {/* Preview combinada */}
        <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:20,marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:700,color:"#1e293b",marginBottom:12}}>Vista previa combinada</div>
          <div style={{display:"flex",gap:0,borderRadius:10,overflow:"hidden",height:60}}>
            <div style={{flex:1,background:themeColors.primary,opacity:themeColors.primaryAlpha/100,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:11,fontWeight:600}}>Sidebar</div>
            <div style={{flex:2,background:"#f0f5f3",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              <div style={{padding:"6px 14px",background:themeColors.secondary,opacity:themeColors.secondaryAlpha/100,color:"#fff",borderRadius:6,fontSize:11,fontWeight:600}}>Bot\u00f3n</div>
              <div style={{padding:"6px 14px",border:"1px solid "+themeColors.secondary,color:themeColors.secondary,borderRadius:6,fontSize:11,fontWeight:600}}>Enlace</div>
            </div>
          </div>
        </div>

        <button onClick={saveTheme} disabled={themeSaving} style={{width:"100%",padding:"14px",background:themeColors.primary,color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:themeSaving?"wait":"pointer",opacity:themeSaving?.7:1}}>
          {themeSaving ? "Guardando..." : "Guardar colores"}
        </button>
      </div>}
    </div>
  );
}
