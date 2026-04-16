import "../styles/NoCreditsModal.css";

export default function NoCreditsModal({ onClose, onUpgrade }) {
  return (
    <div className="ncm-overlay">
      <div className="ncm-card">
        <button onClick={onClose} className="ncm-close">{"\u00d7"}</button>
        <div className="ncm-icon">{"\ud83d\udcb3"}</div>
        <h2 className="ncm-title">{"Sin cr\u00e9ditos restantes"}</h2>
        <p className="ncm-desc">{"Has utilizado todas las evaluaciones disponibles."}</p>
        <p className="ncm-hint">{"Para continuar realizando evaluaciones profesionales, compr\u00e1 m\u00e1s cr\u00e9ditos."}</p>
        <button onClick={onUpgrade} className="ncm-buy-btn">{"COMPRAR CR\u00c9DITOS \u2192"}</button>
        <button onClick={onClose} className="ncm-back-btn">Volver al panel</button>
      </div>
    </div>
  );
}
