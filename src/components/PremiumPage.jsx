import { K } from "../lib/fb.js";

export default function PremiumPage({ profile, nfy, onBack }) {
  return (
    <div style={{animation:"fi .3s ease",width:"100%",maxWidth:600}}>
      <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>{"\u2728 Plan Premium"}</h1>
      <p style={{color:K.mt,fontSize:14,marginBottom:24}}>{"Actualiz\u00e1 tu plan para seguir evaluando"}</p>
      <div style={{background:"linear-gradient(135deg,#0a3d2f,#0d9488)",borderRadius:16,padding:"32px 28px",color:"#fff",marginBottom:24,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:12}}>{"\ud83d\ude80"}</div>
        <div style={{fontSize:28,fontWeight:700,marginBottom:4}}>{"30 Cr\u00e9ditos"}</div>
        <div style={{fontSize:36,fontWeight:800,marginBottom:8}}>$49.500</div>
        <div style={{fontSize:13,opacity:.8}}>{"Pago \u00fanico \u00b7 Sin suscripci\u00f3n \u00b7 30 evaluaciones"}</div>
      </div>
      <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:"24px",marginBottom:20}}>
        <div style={{fontSize:15,fontWeight:700,color:"#0a3d2f",marginBottom:16}}>Medios de pago</div>
        <div style={{background:"#f0f9ff",border:"1px solid #bae6fd",borderRadius:10,padding:16,marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:600,color:"#0369a1",marginBottom:8}}>{"\ud83d\udcf1 Transferencia bancaria / Ual\u00e1 / MercadoPago"}</div>
          <div style={{fontSize:13,color:"#475569",lineHeight:1.7}}>
            {"Realiz\u00e1 una transferencia por "}<b>$49.500</b>{" al siguiente CBU/Alias:"}
            <div style={{background:"#e0f2fe",borderRadius:8,padding:"12px 16px",margin:"10px 0",fontFamily:"monospace",fontSize:14,fontWeight:600,color:"#0c4a6e",letterSpacing:".5px",textAlign:"center",userSelect:"all"}}>brujula.kit.fono</div>
            {"Luego envi\u00e1 el comprobante por WhatsApp o email para activar tus cr\u00e9ditos."}
          </div>
        </div>
        <div style={{background:"#f8faf9",border:"1px solid #e2e8f0",borderRadius:10,padding:16}}>
          <div style={{fontSize:14,fontWeight:600,color:"#1e293b",marginBottom:8}}>{"\ud83d\udce7 Contacto para activaci\u00f3n"}</div>
          <div style={{fontSize:13,color:"#475569",lineHeight:1.7}}>Email: <b>valkyriumsolutions@gmail.com</b><br/>{"Indic\u00e1 tu email de cuenta y adjunt\u00e1 el comprobante de pago."}</div>
        </div>
      </div>
      <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:10,padding:16,marginBottom:20,fontSize:12,color:"#92400e",lineHeight:1.6}}>
        <b>{"\u26a0 Nota:"}</b>{" La activaci\u00f3n de cr\u00e9ditos es manual y puede demorar hasta 24 horas h\u00e1biles. Estamos trabajando en un sistema de pago autom\u00e1tico."}
      </div>
      <button onClick={onBack} style={{background:"#f1f5f9",border:"none",padding:"12px 24px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",color:"#64748b"}}>{"\u2190 Volver al panel"}</button>
    </div>
  );
}
