import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { db, doc, getDoc, updateDoc, collection, getDocs, query, orderBy, limit } from "../firebase.js";
import "../styles/SettingsPage.css";

var K = { sd:"#0a3d2f", ac:"#0d9488", mt:"#64748b", bd:"#e2e8f0" };
var DEFAULT_VERSION = "1.0.0.0";

function Toggle({ value, onChange, disabled }) {
  var cls = "settings-toggle" + (value?" settings-toggle--on":"") + (disabled?" settings-toggle--disabled":"");
  return <button type="button" onClick={function(){ if(!disabled) onChange(!value); }} className={cls}>
    <div className="settings-toggle-knob" />
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

  var _cName = useState(""), cName = _cName[0], setCName = _cName[1];
  var _cDir = useState(""), cDir = _cDir[0], setCDir = _cDir[1];
  var _cTel = useState(""), cTel = _cTel[0], setCTel = _cTel[1];
  var _cEmail = useState(""), cEmail = _cEmail[0], setCEmail = _cEmail[1];
  var _showInReport = useState(false), showInReport = _showInReport[0], setShowInReport = _showInReport[1];
  var _profName = useState(""), profName = _profName[0], setProfName = _profName[1];
  var _profLicense = useState(""), profLicense = _profLicense[0], setProfLicense = _profLicense[1];
  var _profPhone = useState(""), profPhone = _profPhone[0], setProfPhone = _profPhone[1];
  var _creditWarning = useState(true), creditWarning = _creditWarning[0], setCreditWarning = _creditWarning[1];
  var _citaReminder = useState(true), citaReminder = _citaReminder[0], setCitaReminder = _citaReminder[1];
  var _reminderDays = useState(3), reminderDays = _reminderDays[0], setReminderDays = _reminderDays[1];
  var _autoEmail = useState(true), autoEmail = _autoEmail[0], setAutoEmail = _autoEmail[1];
  var _appVersion = useState(DEFAULT_VERSION), appVersion = _appVersion[0], setAppVersion = _appVersion[1];
  var _appVersionDate = useState(""), appVersionDate = _appVersionDate[0], setAppVersionDate = _appVersionDate[1];
  var _appVersionTitle = useState(""), appVersionTitle = _appVersionTitle[0], setAppVersionTitle = _appVersionTitle[1];

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
    // Load latest version from changelogs (fallback to DEFAULT_VERSION)
    var q2 = query(collection(db, "changelogs"), orderBy("createdAt", "desc"), limit(1));
    getDocs(q2).then(function(snap){
      if(!snap.empty){
        var d = snap.docs[0].data();
        setAppVersion(d.version || DEFAULT_VERSION);
        setAppVersionDate(d.fecha || "");
        setAppVersionTitle(d.titulo || "");
      }
    }).catch(function(){});
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

  if(loading) return <div className="settings-loading">{"Cargando configuración..."}</div>;

  var renderConsultorio = function(){
    return <div className="settings-section">
      <div className="settings-block">
        <h3 className="settings-h3">{"Información del profesional"}</h3>
        <p className="settings-desc">{"Estos datos aparecen en el encabezado de cada informe que generes."}</p>
        <div className="settings-grid-2">
          <div className="settings-field--full"><label className="settings-label">Nombre completo del profesional</label><input value={profName} onChange={function(e){ setProfName(e.target.value); }} className="settings-input" placeholder="Ej: Lic. María López" /></div>
          <div><label className="settings-label">{"Matrícula profesional"}</label><input value={profLicense} onChange={function(e){ setProfLicense(e.target.value); }} className="settings-input" placeholder="Ej: MP 12345" /></div>
          <div><label className="settings-label">{"Teléfono personal"}</label><input value={profPhone} onChange={function(e){ setProfPhone(e.target.value); }} className="settings-input" placeholder="Ej: 351-1234567" /></div>
        </div>
      </div>
      <div className="settings-block-separator">
        <h3 className="settings-h3">{"Datos del consultorio"}</h3>
        <p className="settings-desc">{"Esta información se incluye en los informes de pacientes y en los emails automáticos de recordatorio de citas."}</p>
        <div className={"settings-toggle-row settings-toggle-row--spaced"+(showInReport?" settings-toggle-row--active":"")}>
          <div>
            <div className="settings-toggle-row-title">Mostrar en informe de paciente</div>
            {!allFieldsFilled && <div className="settings-toggle-row-warn">{"Completá todos los campos del consultorio para activar"}</div>}
          </div>
          <Toggle value={showInReport} onChange={function(v){ if(v && !allFieldsFilled){ nfy("Completá todos los campos del consultorio primero","er"); return; } setShowInReport(v); }} />
        </div>
        <div className="settings-grid-2 settings-grid-2--spaced">
          <div><label className="settings-label">Nombre del consultorio</label><input value={cName} onChange={function(e){ setCName(e.target.value); }} className="settings-input" placeholder="Ej: Consultorio Fonos" /></div>
          <div><label className="settings-label">{"Teléfono del consultorio"}</label><input value={cTel} onChange={function(e){ setCTel(e.target.value); }} className="settings-input" placeholder="Ej: +54 351 1234567" /></div>
        </div>
        <div className="settings-field"><label className="settings-label">{"Dirección"}</label><input value={cDir} onChange={function(e){ setCDir(e.target.value); }} className="settings-input" placeholder="Ej: Av. Colón 1234, Córdoba" /></div>
        <div><label className="settings-label">Email de contacto</label><input value={cEmail} onChange={function(e){ setCEmail(e.target.value); }} className="settings-input" placeholder="Ej: contacto@consultorio.com" /></div>
      </div>
    </div>;
  };

  var renderGeneral = function(){
    return <div className="settings-section">
      <div className={"settings-toggle-row"+(creditWarning?" settings-toggle-row--active":"")}>
        <div>
          <div className="settings-toggle-row-title">{"Aviso de uso de crédito al iniciar evaluación"}</div>
          <div className="settings-toggle-row-desc">{"Muestra una confirmación antes de descontar un crédito"}</div>
        </div>
        <Toggle value={creditWarning} onChange={setCreditWarning} />
      </div>
      <div className={"settings-toggle-row"+(autoEmail?" settings-toggle-row--active":"")}>
        <div>
          <div className="settings-toggle-row-title">{"Enviar mail automático al agendar cita"}</div>
          <div className="settings-toggle-row-desc">{"Envía un email de recordatorio al responsable del paciente al guardar una cita"}</div>
        </div>
        <Toggle value={autoEmail} onChange={setAutoEmail} />
      </div>
      <div className={"settings-toggle-row settings-toggle-row--stacked"+(citaReminder?" settings-toggle-row--active":"")}>
        <div className="settings-toggle-row-header">
          <div>
            <div className="settings-toggle-row-title">{"Avisar cuando una cita es próxima"}</div>
            <div className="settings-toggle-row-desc">{"Recibí recordatorios de citas en el panel principal"}</div>
          </div>
          <Toggle value={citaReminder} onChange={setCitaReminder} />
        </div>
        {citaReminder && <div className="settings-reminder-box">
          <div className="settings-reminder-title">{"Seleccionar cuándo recibir recordatorio"}</div>
          <div className="settings-reminder-options">{REMINDER_OPTIONS.map(function(opt){ var selected = reminderDays === opt.value; return <button key={opt.value} onClick={function(){ setReminderDays(opt.value); }} className={"settings-reminder-opt"+(selected?" settings-reminder-opt--sel":"")}>{opt.label}</button>; })}</div>
        </div>}
      </div>
      <div className="settings-tutorial-box">
        <div className="settings-tutorial-row">
          <div>
            <div className="settings-toggle-row-title">{"Iniciar tutorial"}</div>
            <div className="settings-toggle-row-desc">{"Volvé a ver el recorrido guiado por las secciones principales"}</div>
          </div>
          <button onClick={function(){ if(onStartTour) onStartTour(); }} className="settings-tutorial-btn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
            Ver tutorial
          </button>
        </div>
      </div>
    </div>;
  };

  var renderAcerca = function(){
    var versionLabel = "Brújula KIT v" + appVersion;
    return <div className="settings-about">
      <div className="settings-version-label">{"Versión actual del sistema:"}</div>
      <div className="settings-version-badge">{versionLabel}</div>
      {appVersionTitle && <div className="settings-version-title">{appVersionTitle}</div>}
      {appVersionDate && <div className="settings-version-date">{"Publicada el " + appVersionDate}</div>}
      <div className="settings-legal-section">
        <div className="settings-legal-title">{"Legal"}</div>
        <div className="settings-legal-links">
          <a href="/politicas.html" target="_blank" rel="noopener noreferrer" className="settings-legal-link">{"Términos y Condiciones"}</a>
          <a href="/politicas.html#privacidad" target="_blank" rel="noopener noreferrer" className="settings-legal-link">{"Política de Privacidad"}</a>
        </div>
      </div>
      <div className="settings-about-footer">{"Desarrollado para profesionales de fonoaudiología."}</div>
    </div>;
  };

  return <div className="settings-page">
    <h1 className="settings-title">{"⚙️ Configuración"}</h1>
    <p className="settings-subtitle">{"Personalizá tu experiencia en Brújula KIT"}</p>
    <div className="settings-tabs">
      {TABS.map(function(t){ var active = activeTab === t.id; return <button key={t.id} onClick={function(){ setActiveTab(t.id); }} className={"settings-tab"+(active?" settings-tab--active":"")}><span className="settings-tab-icon">{t.icon}</span><span>{t.label}</span></button>; })}
    </div>
    <div className="settings-content">
      {activeTab === "consultorio" && renderConsultorio()}
      {activeTab === "general" && renderGeneral()}
      {activeTab === "acerca" && renderAcerca()}
    </div>
    {activeTab !== "acerca" && <button onClick={function(){ doSave(); }} disabled={saving} className="settings-save-btn">
      {saving ? "Guardando..." : "Guardar configuración"}
    </button>}
  </div>;
});

export default SettingsPage;
