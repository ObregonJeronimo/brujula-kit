import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { db, doc, getDoc, updateDoc } from "../firebase.js";

var K = { sd:"#0a3d2f", ac:"#0d9488", mt:"#64748b", bd:"#e2e8f0" };

function Toggle({ value, onChange, disabled }) {
  return <button type="button" onClick={function(){ if(!disabled) onChange(!value); }} style={{width:44,height:24,borderRadius:12,border:"none",background:value?"#0d9488":"#cbd5e1",cursor:disabled?"not-allowed":"pointer",position:"relative",transition:"background .2s",opacity:disabled?.5:1}}>
    <div style={{width:18,height:18,borderRadius:"50%",background:"#fff",position:"absolute",top:3,left:value?23:3,transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}} />
  </button>;
}

var REMINDER_OPTIONS = [
  { value:1, label:"1 día" },
  { value:3, label:"3 días" },
  { value:5, label:"5 días" },
  { value:7, label:"7 días" },
  { value:10, label:"10 días" }
];

var TABS = [
  { id:"consultorio", label:"Consultorio y Profesional", icon:"🏥" },
  { id:"general", label:"General", icon:"🔧" },
  { id:"acerca", label:"Acerca de", icon:"ℹ️" }
];

var SettingsPage = forwardRef(function SettingsPageInner({ userId, nfy, profile, onSettingsChange, onDirtyChange, onStartTour }, ref) {
  var _ld = useState(true), loading = _ld[0], setLoading = _ld[1];
  var _saving = useState(false), saving = _saving[0], setSaving = _saving[1];
  var _tab = useState("consultorio"), activeTab = _tab[0], setActiveTab = _tab[1];

  // Consultorio fields
  var _cName = useState(""), cName = _cName[0], setCName = _cName[1];
  var _cDir = useState(""), cDir = _cDir[0], setCDir = _cDir[1];
  var _cTel = useState(""), cTel = _cTel[0], setCTel = _cTel[1];
  var _cEmail = useState(""), cEmail = _cEmail[0], setCEmail = _cEmail[1];
  var _showInReport = useState(false), showInReport = _showInReport[0], setShowInReport = _showInReport[1];

  // Professional info fields (from reportHeader)
  var _profName = useState(""), profName = _profName[0], setProfName = _profName[1];
  var _profLicense = useState(""), profLicense = _profLicense[0], setProfLicense = _profLicense[1];
  var _profPhone = useState(""), profPhone = _profPhone[0], setProfPhone = _profPhone[1];

  // General fields
  var _creditWarning = useState(true), creditWarning = _creditWarning[0], setCreditWarning = _creditWarning[1];
  var _citaReminder = useState(true), citaReminder = _citaReminder[0], setCitaReminder = _citaReminder[1];
  var _reminderDays = useState(3), reminderDays = _reminderDays[0], setReminderDays = _reminderDays[1];
  var _autoEmail = useState(true), autoEmail = _autoEmail[0], setAutoEmail = _autoEmail[1];

  var origRef = useRef(null);

  useEffect(function(){
    if(!userId) return;
    setLoading(true);
    getDoc(doc(db, "usuarios", userId)).then(function(snap){
      if(snap.exists()){
        var d = snap.data();
        var s = d.settings || {};
        var rh = d.reportHeader || {};
        var orig = {
          cName: s.consultorioNombre || "", cDir: s.consultorioDireccion || "",
          cTel: s.consultorioTelefono || "", cEmail: s.consultorioEmail || "",
          showInReport: s.showConsultorioInReport === true, creditWarning: s.creditWarning !== false,
          citaReminder: s.citaReminder !== false, reminderDays: s.reminderDays || 3,
          autoEmail: s.autoEmailCita !== false,
          profName: rh.therapist || "", profLicense: rh.license || "", profPhone: rh.phone || ""
        };
        origRef.current = orig;
        setCName(orig.cName); setCDir(orig.cDir); setCTel(orig.cTel); setCEmail(orig.cEmail);
        setShowInReport(orig.showInReport); setCreditWarning(orig.creditWarning);
        setCitaReminder(orig.citaReminder); setReminderDays(orig.reminderDays); setAutoEmail(orig.autoEmail);
        setProfName(orig.profName); setProfLicense(orig.profLicense); setProfPhone(orig.profPhone);
      }
    }).catch(function(e){ console.error(e); }).finally(function(){ setLoading(false); });
  }, [userId]);

  var isDirty = function(){
    if(!origRef.current) return false;
    var o = origRef.current;
    return cName !== o.cName || cDir !== o.cDir || cTel !== o.cTel || cEmail !== o.cEmail || showInReport !== o.showInReport || creditWarning !== o.creditWarning || citaReminder !== o.citaReminder || reminderDays !== o.reminderDays || autoEmail !== o.autoEmail || profName !== o.profName || profLicense !== o.profLicense || profPhone !== o.profPhone;
  };

  useEffect(function(){ if(onDirtyChange) onDirtyChange(isDirty()); });

  var allFieldsFilled = cName.trim() && cDir.trim() && cTel.trim() && cEmail.trim();

  var doSave = function(){
    return new Promise(function(resolve){
      if(!userId){ resolve(false); return; }
      setSaving(true);
      var settings = {
        consultorioNombre: cName.trim(), consultorioDireccion: cDir.trim(),
        consultorioTelefono: cTel.trim(), consultorioEmail: cEmail.trim(),
        showConsultorioInReport: showInReport, creditWarning: creditWarning,
        citaReminder: citaReminder, reminderDays: reminderDays, autoEmailCita: autoEmail
      };
      var reportHeader = {
        therapist: profName.trim(), license: profLicense.trim(), phone: profPhone.trim(),
        clinic: cName.trim(), address: cDir.trim()
      };
      updateDoc(doc(db, "usuarios", userId), { settings: settings, reportHeader: reportHeader }).then(function(){
        nfy("Configuración guardada", "ok");
        origRef.current = { cName: cName.trim(), cDir: cDir.trim(), cTel: cTel.trim(), cEmail: cEmail.trim(), showInReport: showInReport, creditWarning: creditWarning, citaReminder: citaReminder, reminderDays: reminderDays, autoEmail: autoEmail, profName: profName.trim(), profLicense: profLicense.trim(), profPhone: profPhone.trim() };
        if(profile){ profile.reportHeader = reportHeader; }
        if(onSettingsChange) onSettingsChange(settings);
        if(onDirtyChange) onDirtyChange(false);
        resolve(true);
      }).catch(function(e){ nfy("Error al guardar: " + e.message, "er"); resolve(false); }).finally(function(){ setSaving(false); });
    });
  };

  useImperativeHandle(ref, function(){ return { save: doSave }; });

  var I = { width:"100%", padding:"10px 14px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:14, background:"#f8faf9" };

  if(loading) return <div style={{animation:"fi .3s ease",textAlign:"center",padding:60}}><div style={{fontSize:16,fontWeight:600,color:K.mt}}>{"Cargando configuración..."}</div></div>;

  var renderConsultorio = function(){
    return <div style={{animation:"fi .2s ease"}}>
      {/* Professional Info */}
      <div style={{marginBottom:22}}>
        <h3 style={{fontSize:14,fontWeight:700,color:K.sd,marginBottom:4}}>{"Información del profesional"}</h3>
        <p style={{fontSize:11,color:K.mt,marginBottom:14}}>{"Estos datos aparecen en el encabezado de cada informe que generes."}</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div style={{gridColumn:"1/-1"}}>
            <label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Nombre completo del profesional</label>
            <input value={profName} onChange={function(e){ setProfName(e.target.value); }} style={I} placeholder="Ej: Lic. María López" />
          </div>
          <div>
            <label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>{"Matrícula profesional"}</label>
            <input value={profLicense} onChange={function(e){ setProfLicense(e.target.value); }} style={I} placeholder="Ej: MP 12345" />
          </div>
          <div>
            <label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>{"Teléfono personal"}</label>
            <input value={profPhone} onChange={function(e){ setProfPhone(e.target.value); }} style={I} placeholder="Ej: 351-1234567" />
          </div>
        </div>
      </div>

      <div style={{borderTop:"1px solid #e2e8f0",paddingTop:20}}>
        <h3 style={{fontSize:14,fontWeight:700,color:K.sd,marginBottom:4}}>{"Datos del consultorio"}</h3>
        <p style={{fontSize:11,color:K.mt,marginBottom:14}}>{"Esta información se incluye en los informes de pacientes y en los emails automáticos de recordatorio de citas."}</p>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:showInReport?"#f0fdfa":"#f8fafc",borderRadius:10,border:showInReport?"1px solid #99f6e4":"1px solid #e2e8f0",marginBottom:18}}>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:showInReport?K.sd:"#475569"}}>Mostrar en informe de paciente</div>
            {!allFieldsFilled && <div style={{fontSize:11,color:"#f59e0b",marginTop:2}}>{"Completá todos los campos del consultorio para activar"}</div>}
          </div>
          <Toggle value={showInReport} onChange={function(v){ if(v && !allFieldsFilled){ nfy("Completá todos los campos del consultorio primero","er"); return; } setShowInReport(v); }} />
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
          <div>
            <label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Nombre del consultorio</label>
            <input value={cName} onChange={function(e){ setCName(e.target.value); }} style={I} placeholder="Ej: Consultorio Fonos" />
          </div>
          <div>
            <label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>{"Teléfono del consultorio"}</label>
            <input value={cTel} onChange={function(e){ setCTel(e.target.value); }} style={I} placeholder="Ej: +54 351 1234567" />
          </div>
        </div>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>{"Dirección"}</label>
          <input value={cDir} onChange={function(e){ setCDir(e.target.value); }} style={I} placeholder="Ej: Av. Colón 1234, Córdoba" />
        </div>
        <div>
          <label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Email de contacto</label>
          <input value={cEmail} onChange={function(e){ setCEmail(e.target.value); }} style={I} placeholder="Ej: contacto@consultorio.com" />
        </div>
      </div>
    </div>;
  };

  var renderGeneral = function(){
    return <div style={{animation:"fi .2s ease"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:creditWarning?"#f0fdfa":"#f8fafc",borderRadius:10,border:creditWarning?"1px solid #99f6e4":"1px solid #e2e8f0",marginBottom:14}}>
        <div>
          <div style={{fontSize:13,fontWeight:600,color:creditWarning?K.sd:"#475569"}}>{"Aviso de uso de crédito al iniciar evaluación"}</div>
          <div style={{fontSize:11,color:K.mt,marginTop:2}}>{"Muestra una confirmación antes de descontar un crédito"}</div>
        </div>
        <Toggle value={creditWarning} onChange={setCreditWarning} />
      </div>

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:autoEmail?"#f0fdfa":"#f8fafc",borderRadius:10,border:autoEmail?"1px solid #99f6e4":"1px solid #e2e8f0",marginBottom:14}}>
        <div>
          <div style={{fontSize:13,fontWeight:600,color:autoEmail?K.sd:"#475569"}}>{"Enviar mail automático al agendar cita"}</div>
          <div style={{fontSize:11,color:K.mt,marginTop:2}}>{"Envía un email de recordatorio al responsable del paciente al guardar una cita"}</div>
        </div>
        <Toggle value={autoEmail} onChange={setAutoEmail} />
      </div>

      <div style={{padding:"12px 16px",background:citaReminder?"#f0fdfa":"#f8fafc",borderRadius:10,border:citaReminder?"1px solid #99f6e4":"1px solid #e2e8f0",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:citaReminder?K.sd:"#475569"}}>{"Avisar cuando una cita es próxima"}</div>
            <div style={{fontSize:11,color:K.mt,marginTop:2}}>{"Recibí recordatorios de citas en el panel principal"}</div>
          </div>
          <Toggle value={citaReminder} onChange={setCitaReminder} />
        </div>
        {citaReminder && <div style={{marginTop:12,padding:"10px 14px",background:"#f0f9ff",borderRadius:8,border:"1px solid #bae6fd"}}>
          <div style={{fontSize:12,fontWeight:600,color:"#0369a1",marginBottom:8}}>{"Seleccionar cuándo recibir recordatorio"}</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {REMINDER_OPTIONS.map(function(opt){
              var selected = reminderDays === opt.value;
              return <button key={opt.value} onClick={function(){ setReminderDays(opt.value); }} style={{padding:"6px 14px",borderRadius:8,border:selected?"2px solid #0d9488":"1px solid #e2e8f0",background:selected?"#ccfbf1":"#fff",color:selected?K.sd:"#475569",fontSize:12,fontWeight:selected?700:500,cursor:"pointer"}}>{opt.label}</button>;
            })}
          </div>
        </div>}
      </div>

      <div style={{padding:"16px",background:"#f8fafc",borderRadius:10,border:"1px solid #e2e8f0"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:K.sd}}>{"Iniciar tutorial"}</div>
            <div style={{fontSize:11,color:K.mt,marginTop:2}}>{"Volvé a ver el recorrido guiado por las secciones principales"}</div>
          </div>
          <button onClick={function(){ if(onStartTour) onStartTour(); }} style={{padding:"8px 18px",background:"linear-gradient(135deg,#0a3d2f,#0d9488)",color:"#fff",border:"none",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:6}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
            Ver tutorial
          </button>
        </div>
      </div>
    </div>;
  };

  var renderAcerca = function(){
    return <div style={{animation:"fi .2s ease"}}>
      <div style={{fontSize:14,color:"#475569",lineHeight:1.8}}>
        <div style={{marginBottom:16}}>{"Versión actual del sistema:"}</div>
        <div style={{display:"inline-block",padding:"10px 20px",background:"linear-gradient(135deg,#0a3d2f,#0d9488)",borderRadius:10,color:"#fff",fontSize:16,fontWeight:700,letterSpacing:"0.5px"}}>{"Brújula KIT V6.0"}</div>
        <div style={{marginTop:20,fontSize:12,color:"#94a3b8",lineHeight:1.6}}>{"Desarrollado para profesionales de fonoaudiología."}</div>
      </div>
    </div>;
  };

  return <div style={{animation:"fi .3s ease",width:"100%",maxWidth:700}}>
    <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>{"⚙️ Configuración"}</h1>
    <p style={{color:K.mt,fontSize:14,marginBottom:20}}>{"Personalizá tu experiencia en Brújula KIT"}</p>

    <div style={{display:"flex",gap:0,marginBottom:0,borderBottom:"2px solid #e2e8f0"}}>
      {TABS.map(function(t){
        var active = activeTab === t.id;
        return <button key={t.id} onClick={function(){ setActiveTab(t.id); }} style={{display:"flex",alignItems:"center",gap:6,padding:"12px 20px",background:"transparent",border:"none",borderBottom:active?"2px solid #0d9488":"2px solid transparent",marginBottom:"-2px",color:active?K.sd:"#94a3b8",fontSize:14,fontWeight:active?700:500,cursor:"pointer",transition:"all .15s ease"}}>
          <span style={{fontSize:15}}>{t.icon}</span>
          <span>{t.label}</span>
        </button>;
      })}
    </div>

    <div style={{background:"#fff",borderRadius:"0 0 12px 12px",border:"1px solid #e2e8f0",borderTop:"none",padding:24,marginBottom:20,minHeight:200}}>
      {activeTab === "consultorio" && renderConsultorio()}
      {activeTab === "general" && renderGeneral()}
      {activeTab === "acerca" && renderAcerca()}
    </div>

    {activeTab !== "acerca" && <button onClick={function(){ doSave(); }} disabled={saving} style={{width:"100%",padding:"14px",background:K.ac,color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:saving?"wait":"pointer",opacity:saving?.7:1,marginBottom:40}}>
      {saving ? "Guardando..." : "Guardar configuración"}
    </button>}
  </div>;
});

export default SettingsPage;
