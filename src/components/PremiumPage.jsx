import { useState } from "react";
import { K } from "../lib/fb.js";

var PACKS = [
  { id:"pack-10", credits:10, price:18999, label:"10", popular:false, save:0 },
  { id:"pack-25", credits:25, price:35499, label:"25", popular:true, save:12 },
  { id:"pack-40", credits:40, price:53199, label:"40", popular:false, save:16 },
  { id:"pack-60", credits:60, price:79799, label:"60", popular:false, save:22 }
];

function fmt(n){ return "$"+n.toLocaleString("es-AR"); }
function perCredit(p){ return Math.round(p.price/p.credits); }

export default function PremiumPage({ profile, nfy, onBack, authUser }) {
  var _sel = useState("pack-25"), selId = _sel[0], setSelId = _sel[1];
  var _ld = useState(false), loading = _ld[0], setLoading = _ld[1];

  var handleBuy = function(packId){
    var pack = PACKS.find(function(p){return p.id===packId});
    if(!pack) return;
    setLoading(true);
    fetch("/api/create-preference", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: authUser?.uid || profile?.uid,
        email: profile?.email || authUser?.email,
        nombre: profile?.nombre ? (profile.nombre+" "+profile.apellido) : "",
        packId: pack.id,
        credits: pack.credits,
        price: pack.price
      })
    }).then(function(res){ return res.json(); }).then(function(data){
      var url = data.sandbox ? data.sandbox_init_point : data.init_point;
      if(url){
        window.location.href = url;
      } else {
        nfy("Error al crear el pago: "+(data.error||"intent\u00e9 nuevamente"),"er");
      }
      setLoading(false);
    }).catch(function(e){
      nfy("Error de conexi\u00f3n: "+e.message,"er");
      setLoading(false);
    });
  };

  return (
    <div style={{animation:"fi .3s ease",width:"100%",maxWidth:800}}>
      <div style={{background:"linear-gradient(135deg,#0a3d2f 0%,#0d9488 50%,#2dd4bf 100%)",borderRadius:20,padding:"36px 32px 32px",color:"#fff",marginBottom:28,position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:-40,right:-40,width:180,height:180,borderRadius:"50%",background:"rgba(255,255,255,.06)"}}></div>
        <div style={{position:"absolute",bottom:-60,left:-30,width:200,height:200,borderRadius:"50%",background:"rgba(255,255,255,.04)"}}></div>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{fontSize:14,fontWeight:600,opacity:.85,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:8}}>{"BR\u00daJULA KIT"}</div>
          <h1 style={{fontSize:28,fontWeight:800,margin:"0 0 8px",lineHeight:1.2}}>{"Compr\u00e1 cr\u00e9ditos para evaluar"}</h1>
          <p style={{fontSize:14,opacity:.8,margin:0,lineHeight:1.6}}>{"Cada cr\u00e9dito = 1 evaluaci\u00f3n (Herramientas). Sin vencimiento."}</p>
          {profile && <div style={{marginTop:14,display:"inline-flex",alignItems:"center",gap:8,background:"rgba(255,255,255,.15)",backdropFilter:"blur(8px)",borderRadius:10,padding:"8px 16px"}}>
            <span style={{fontSize:13,opacity:.9}}>{"Cr\u00e9ditos actuales:"}</span>
            <span style={{fontSize:18,fontWeight:800}}>{profile.creditos||0}</span>
          </div>}
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:28}}>
        {PACKS.map(function(pack){
          var active = selId === pack.id;
          var pp = perCredit(pack);
          return <div key={pack.id} onClick={function(){setSelId(pack.id)}}
            style={{
              position:"relative",background:"#fff",borderRadius:16,padding:"28px 24px",
              border:active?"2.5px solid #0d9488":"2px solid #e2e8f0",
              cursor:"pointer",transition:"all .2s ease",
              boxShadow:active?"0 8px 30px rgba(13,148,136,.2)":"0 2px 8px rgba(0,0,0,.04)",
              transform:active?"scale(1.02)":"scale(1)"
            }}>
            {pack.popular && <div style={{position:"absolute",top:-1,right:20,background:"linear-gradient(135deg,#f59e0b,#d97706)",color:"#fff",padding:"4px 14px",borderRadius:"0 0 10px 10px",fontSize:10,fontWeight:800,letterSpacing:".5px",textTransform:"uppercase"}}>{"M\u00e1s elegido"}</div>}
            <div style={{width:64,height:64,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16,
              background:active?"linear-gradient(135deg,#0d9488,#2dd4bf)":"linear-gradient(135deg,#f1f5f9,#e2e8f0)",
              color:active?"#fff":"#64748b",fontSize:22,fontWeight:800,transition:"all .2s"}}>
              {pack.label}
            </div>
            <div style={{fontSize:13,fontWeight:600,color:"#64748b",marginBottom:4}}>{pack.credits+" cr\u00e9ditos"}</div>
            <div style={{fontSize:28,fontWeight:800,color:active?"#0a3d2f":"#334155",marginBottom:4,lineHeight:1}}>{fmt(pack.price)}</div>
            <div style={{fontSize:12,color:"#94a3b8"}}>{fmt(pp)+" por evaluaci\u00f3n"}</div>
            {pack.save > 0 && <div style={{marginTop:10,display:"inline-block",padding:"3px 10px",borderRadius:20,background:"#dcfce7",color:"#059669",fontSize:11,fontWeight:700}}>{"Ahorr\u00e1s "+pack.save+"%"}</div>}
            <div style={{position:"absolute",top:16,left:16,width:22,height:22,borderRadius:"50%",
              border:active?"2px solid #0d9488":"2px solid #d1d5db",
              background:active?"#0d9488":"transparent",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>
              {active && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
          </div>;
        })}
      </div>

      <button onClick={function(){handleBuy(selId)}} disabled={loading}
        style={{
          width:"100%",padding:"18px 24px",
          background:loading?"#94a3b8":"linear-gradient(135deg,#0a3d2f,#0d9488)",
          color:"#fff",border:"none",borderRadius:14,fontSize:17,fontWeight:800,
          cursor:loading?"wait":"pointer",marginBottom:14,
          boxShadow:"0 6px 24px rgba(13,148,136,.35)",
          transition:"all .2s",letterSpacing:".3px",
          display:"flex",alignItems:"center",justifyContent:"center",gap:10
        }}>
        {loading ? "Procesando..." : "\ud83d\udd12 Pagar "+fmt(PACKS.find(function(p){return p.id===selId})?.price||0)+" con MercadoPago"}
      </button>

      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,flexWrap:"wrap",marginBottom:8}}>
          {["Tarjeta cr\u00e9dito/d\u00e9bito","MercadoPago"].map(function(m,i){
            return <span key={i} style={{fontSize:11,color:"#64748b",background:"#f1f5f9",padding:"5px 12px",borderRadius:20,fontWeight:500}}>{m}</span>;
          })}
        </div>
        <p style={{fontSize:11,color:"#94a3b8",margin:0}}>{"Pago seguro procesado por MercadoPago. Los cr\u00e9ditos se acreditan autom\u00e1ticamente."}</p>
      </div>

      <div style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",padding:24,marginBottom:20}}>
        <div style={{fontSize:14,fontWeight:700,color:"#0a3d2f",marginBottom:14}}>{"Incluido con tus cr\u00e9ditos"}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          {[
            ["\ud83d\udccb","Todas las herramientas de evaluaci\u00f3n"],
            ["\u23f0","Sin vencimiento \u2014 us\u00e1los cuando quieras"],
            ["\ud83d\udcc4","Reportes completos con exportaci\u00f3n a PDF"],
            ["\ud83d\udcc5","Calendario y gesti\u00f3n de pacientes"]
          ].map(function(item,i){
            return <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,fontSize:13,color:"#475569",lineHeight:1.5}}>
              <span style={{fontSize:18,flexShrink:0,marginTop:1}}>{item[0]}</span>
              <span>{item[1]}</span>
            </div>;
          })}
        </div>
      </div>

      <button onClick={onBack} style={{background:"#f1f5f9",border:"none",padding:"12px 24px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer",color:"#64748b"}}>{"\u2190 Volver al panel"}</button>
    </div>
  );
}
