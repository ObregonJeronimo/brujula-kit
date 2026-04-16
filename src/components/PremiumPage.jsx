import { useState } from "react";
import "../styles/PremiumPage.css";

var PACKS = [
  { id:"pack-10", credits:10, price:18999, label:"10", popular:false, save:0 },
  { id:"pack-25", credits:25, price:35499, label:"25", popular:true, save:25 },
  { id:"pack-40", credits:40, price:53199, label:"40", popular:false, save:30 },
  { id:"pack-60", credits:60, price:75000, label:"60", popular:false, save:34 }
];

function fmt(n){ return "$"+n.toLocaleString("es-AR"); }
function perCredit(p){ return Math.round(p.price/p.credits); }

export default function PremiumPage({ TC, profile, nfy, onBack, authUser }) {
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
    <div className="premium-page">
      <div className="premium-hero">
        <div className="premium-hero-circle1"></div>
        <div className="premium-hero-circle2"></div>
        <div className="premium-hero-content">
          <div className="premium-hero-label">{"BR\u00daJULA KIT"}</div>
          <h1 className="premium-hero-title">{"Compr\u00e1 cr\u00e9ditos para evaluar"}</h1>
          <p className="premium-hero-desc">{"Cada cr\u00e9dito = 1 evaluaci\u00f3n (Herramientas). Sin vencimiento."}</p>
          {profile && <div className="premium-hero-credits">
            <span className="premium-hero-credits-label">{"Cr\u00e9ditos actuales:"}</span>
            <span className="premium-hero-credits-value">{profile.creditos||0}</span>
          </div>}
        </div>
      </div>

      <div className="premium-grid">
        {PACKS.map(function(pack){
          var active = selId === pack.id;
          return <div key={pack.id} onClick={function(){setSelId(pack.id)}}
            className={"premium-pack"+(active?" premium-pack--active":"")}>
            {pack.popular && <div className="premium-pack-badge">{"M\u00e1s elegido"}</div>}
            <div className="premium-pack-icon">{pack.label}</div>
            <div className="premium-pack-credits">{pack.credits+" cr\u00e9ditos"}</div>
            <div className="premium-pack-price">{fmt(pack.price)}</div>
            <div className="premium-pack-per">{fmt(perCredit(pack))+" por evaluaci\u00f3n"}</div>
            {pack.save > 0 && <div className="premium-pack-save">{"Ahorr\u00e1s "+pack.save+"%"}</div>}
            <div className="premium-pack-radio">
              {active && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
          </div>;
        })}
      </div>

      <button onClick={function(){handleBuy(selId)}} disabled={loading} className="premium-buy-btn">
        {loading ? "Procesando..." : "\ud83d\udd12 Pagar "+fmt(PACKS.find(function(p){return p.id===selId})?.price||0)+" con MercadoPago"}
      </button>

      <div className="premium-payment">
        <div className="premium-payment-methods">
          {["Tarjeta cr\u00e9dito/d\u00e9bito","MercadoPago"].map(function(m,i){
            return <span key={i} className="premium-payment-badge">{m}</span>;
          })}
        </div>
        <p className="premium-payment-note">{"Pago seguro procesado por MercadoPago. Los cr\u00e9ditos se acreditan autom\u00e1ticamente."}</p>
      </div>

      <div className="premium-features">
        <div className="premium-features-title">{"Incluido con tus cr\u00e9ditos"}</div>
        <div className="premium-features-grid">
          {[
            ["\ud83d\udccb","Todas las herramientas de evaluaci\u00f3n"],
            ["\u23f0","Sin vencimiento \u2014 usalos cuando quieras"],
            ["\ud83d\udcc4","Reportes completos con exportaci\u00f3n a PDF"],
            ["\ud83d\udcc5","Calendario y gesti\u00f3n de pacientes"]
          ].map(function(item,i){
            return <div key={i} className="premium-feature-item">
              <span className="premium-feature-icon">{item[0]}</span>
              <span>{item[1]}</span>
            </div>;
          })}
        </div>
      </div>

      <button onClick={onBack} className="premium-back-btn">{"\u2190 Volver al panel"}</button>
    </div>
  );
}
