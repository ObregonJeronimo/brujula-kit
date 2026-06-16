// Placeholder landing page — full design to be built next
export default function LandingPage() {
  var goToApp = function() {
    window.history.pushState({}, "", "/app");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0a3d2f, #0d9488)",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      color: "#fff",
      padding: 24,
      textAlign: "center"
    }}>
      <img src="/img/logo_96.png" alt="Brújula KIT" style={{ width: 72, height: 72, marginBottom: 20 }} />
      <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 10 }}>{"Brújula KIT"}</h1>
      <p style={{ fontSize: 16, opacity: 0.85, maxWidth: 480, lineHeight: 1.6, marginBottom: 32 }}>
        {"Sistema integral de evaluación fonoaudiológica. Evaluaciones digitales, informes con IA y gestión de pacientes en un solo lugar."}
      </p>
      <button onClick={goToApp} style={{
        padding: "14px 36px",
        background: "#fff",
        color: "#0a3d2f",
        border: "none",
        borderRadius: 10,
        fontSize: 16,
        fontWeight: 700,
        cursor: "pointer",
        boxShadow: "0 4px 20px rgba(0,0,0,.2)"
      }}>
        {"Ingresar al sistema"}
      </button>
      <p style={{ marginTop: 40, fontSize: 12, opacity: 0.6 }}>{"Landing page en construcción"}</p>
    </div>
  );
}
