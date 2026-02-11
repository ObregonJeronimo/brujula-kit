import { useState } from "react";
import { K } from "../lib/fb.js";

export default function PremiumPage({ profile, nfy, onBack, authUser }) {
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: authUser?.uid || profile?.uid,
          email: profile?.email || authUser?.email,
          nombre: profile?.nombre ? `${profile.nombre} ${profile.apellido}` : "",
        }),
      });
      const data = await res.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      } else {
        nfy("Error al crear el pago: " + (data.error || "intente nuevamente"), "er");
      }
    } catch (e) {
      nfy("Error de conexi\u00f3n: " + e.message, "er");
    }
    setLoading(false);
  };

  return (
    <div style={{animation:"fi .3s ease",width:"100%",maxWidth:600}}>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>{"\u2728 Plan Premium"}</h1>
      <p style={{color:K.mt,fontSize:14,marginBottom:24}}>{"Actualiz\u00e1 tu plan para seguir evaluando"}</p>

      <div style={{background:"linear-gradient(135deg,#0a3d2f,#0d9488)",borderRadius:16,padding:"32px 28px",color:"#fff",marginBottom:24,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:12}}>{"\ud83c\udf38"}</div>
        <div style={{fontSize:28,fontWeight:700,marginBottom:4}}>{"30 Cr\u00e9ditos"}</div>
        <div style={{fontSize:36,fontWeight:800,marginBottom:8}}>$49.950</div>
        <div style={{fontSize:13,opacity:.8}}>{"Pago \u00fanico \u00b7 Sin suscripci\u00f3n \u00b7 30 evaluaciones"}</div>
      </div>

      <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:"24px",marginBottom:20}}>
        <div style={{fontSize:15,fontWeight:700,color:"#0a3d2f",marginBottom:16}}>{"\ud83c\udf38 \u00bfQu\u00e9 incluye?"}</div>
        <div style={{display:"grid",gap:12}}>
          {[
            ["\ud83d\udccb", "30 evaluaciones ELDI o PEFF"],
            ["\u23f0", "Sin vencimiento \u2014 us\u00e1 tus cr\u00e9ditos cuando quieras"],
            ["\ud83d\udcca", "Acceso a reportes completos con PDF"],
            ["\ud83d\udcc5", "Calendario de pacientes incluido"],
          ].map(([ic, txt], i) => (
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,fontSize:14,color:"#334155"}}>
              <span style={{fontSize:20,flexShrink:0}}>{ic}</span>
              <span>{txt}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleBuy}
        disabled={loading}
        style={{
          width:"100%",
          padding:"16px",
          background: loading ? "#94a3b8" : "linear-gradient(135deg,#0d9488,#0a3d2f)",
          color:"#fff",
          border:"none",
          borderRadius:12,
          fontSize:17,
          fontWeight:700,
          cursor: loading ? "wait" : "pointer",
          marginBottom:12,
          boxShadow:"0 4px 16px rgba(13,148,136,.3)",
          transition:"all .2s",
          display:"flex",
          alignItems:"center",
          justifyContent:"center",
          gap:10,
        }}
      >
        {loading ? "Procesando..." : "\ud83d\udd12 Pagar con MercadoPago"}
      </button>

      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:16,flexWrap:"wrap"}}>
          {["Tarjeta cr\u00e9dito/d\u00e9bito", "MercadoPago", "Transferencia", "QR"].map((m, i) => (
            <span key={i} style={{fontSize:11,color:"#94a3b8",background:"#f1f5f9",padding:"4px 10px",borderRadius:20}}>{m}</span>
          ))}
        </div>
        <p style={{fontSize:11,color:"#94a3b8",marginTop:10}}>{"Pago seguro procesado por MercadoPago. Los cr\u00e9ditos se acreditan autom\u00e1ticamente."}</p>
      </div>

      <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:10,padding:16,marginBottom:20}}>
        <div style={{fontSize:13,fontWeight:600,color:"#0369a1",marginBottom:8}}>{"\ud83d\udce7 \u00bfPrefer\u00eds transferencia manual?"}</div>
        <div style={{fontSize:13,color:"#475569",lineHeight:1.7}}>
          {"Realiz\u00e1 una transferencia por "}<b>$49.950</b>{" al siguiente alias:"}
          <div style={{background:"#e0f2fe",borderRadius:8,padding:"12px 16px",margin:"10px 0",fontFamily:"monospace",fontSize:14,fontWeight:600,color:"#0c4a6e",letterSpacing:".5px",textAlign:"center",userSelect:"all"}}>brujula.kit.fono</div>
          {"Luego envi\u00e1 el comprobante a "}<b>valkyriumsolutions@gmail.com</b>{" para activar tus cr\u00e9ditos manualmente."}
        </div>
      </div>

      <button onClick={onBack} style={{background:"#f1f5f9",border:"none",padding:"12px 24px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",color:"#64748b"}}>{"\u2190 Volver al panel"}</button>
    </div>
  );
}
