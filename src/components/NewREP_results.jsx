// NewREP — Results view (step 2) — PEFF-R protocol
import { ageLabel } from "./NewREP_logic.js";

var K = { sd:"#0a3d2f", ac:"#0d9488", mt:"#64748b", bd:"#e2e8f0" };
var posLabels = {ISPP:"ISPP",ISIP:"ISIP",CSIP:"CSIP",CSFP:"CSFP"};
var posFull = {ISPP:"Inicio s\u00edl. \u2014 Pos. palabra",ISIP:"Inicio s\u00edl. \u2014 Int. palabra",CSIP:"Coda s\u00edl. \u2014 Int. palabra",CSFP:"Coda s\u00edl. \u2014 Final palabra"};

export default function NewREPResults({ results, patientAge, obs, onBack, onSave }){
  if(!results) return null;

  var sevColor = results.pcc===100?"#059669":results.pcc>=85?"#059669":results.pcc>=65?"#d97706":results.pcc>=50?"#ea580c":"#dc2626";

  return (
    <div>
      {/* Summary cards */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
        <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,textAlign:"center"}}>
          <div style={{fontSize:32,fontWeight:800,color:K.ac}}>{results.pcc+"%"}</div>
          <div style={{fontSize:12,color:K.mt,fontWeight:600}}>PCC</div>
          <div style={{fontSize:10,color:K.mt}}>{"Porcentaje de Consonantes Correctas"}</div>
        </div>
        <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,textAlign:"center"}}>
          <div style={{fontSize:24,fontWeight:700,color:sevColor}}>{results.severity}</div>
          <div style={{fontSize:12,color:K.mt,fontWeight:600}}>Severidad</div>
        </div>
        <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,textAlign:"center"}}>
          <div style={{fontSize:24,fontWeight:700,color:K.sd}}>{results.totalCorrect+"/"+results.totalEvaluated}</div>
          <div style={{fontSize:12,color:K.mt,fontWeight:600}}>Correctos</div>
          <div style={{fontSize:11,color:K.mt}}>{results.totalErrors+" errores"}</div>
        </div>
      </div>

      {/* Distribution by position */}
      <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,marginBottom:16}}>
        <h3 style={{fontSize:15,fontWeight:700,marginBottom:12}}>{"Distribuci\u00f3n por posici\u00f3n"}</h3>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:10}}>
          {["ISPP","ISIP","CSIP","CSFP"].map(function(posId){
            var p = results.byPosition[posId] || {ok:0,err:0,total:0};
            var pct = p.total > 0 ? Math.round((p.ok/p.total)*100) : 0;
            var clr = p.total===0?"#cbd5e1":pct>=85?"#059669":pct>=65?"#d97706":"#dc2626";
            return <div key={posId} style={{background:"#f8faf9",borderRadius:10,padding:14,textAlign:"center",border:"1px solid "+K.bd}}>
              <div style={{fontSize:13,fontWeight:700,color:K.ac,marginBottom:4}}>{posLabels[posId]}</div>
              <div style={{fontSize:9,color:K.mt,marginBottom:8,lineHeight:1.3}}>{posFull[posId]}</div>
              {p.total > 0 ? <div>
                <div style={{fontSize:22,fontWeight:700,color:clr}}>{pct+"%"}</div>
                <div style={{fontSize:11,color:K.mt}}>{p.ok+"/"+p.total+" correctos"}</div>
                {p.err > 0 && <div style={{fontSize:11,color:"#dc2626",fontWeight:600}}>{p.err+" errores"}</div>}
              </div> : <div style={{fontSize:11,color:"#cbd5e1"}}>{"Sin \u00edtems"}</div>}
            </div>;
          })}
        </div>
      </div>

      {/* Category summary */}
      <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,marginBottom:16}}>
        <h3 style={{fontSize:15,fontWeight:700,marginBottom:12}}>{"Resumen por categor\u00eda"}</h3>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead><tr style={{borderBottom:"2px solid "+K.bd}}>
            <th style={{textAlign:"left",padding:"8px",color:K.mt,fontSize:11}}>{"Categor\u00eda"}</th>
            <th style={{textAlign:"center",padding:"8px",color:K.mt,fontSize:11}}>Correctos</th>
            <th style={{textAlign:"center",padding:"8px",color:K.mt,fontSize:11}}>Errores</th>
            <th style={{textAlign:"center",padding:"8px",color:K.mt,fontSize:11}}>Total</th>
            <th style={{textAlign:"center",padding:"8px",color:K.mt,fontSize:11}}>%</th>
          </tr></thead>
          <tbody>
            {Object.values(results.byCat).map(function(c){
              var pct = c.total > 0 ? Math.round((c.ok/c.total)*100) : 0;
              return <tr key={c.title} style={{borderBottom:"1px solid #f1f5f9"}}>
                <td style={{padding:"8px",fontWeight:600}}>{c.title}</td>
                <td style={{textAlign:"center",padding:"8px",color:"#059669",fontWeight:600}}>{c.ok}</td>
                <td style={{textAlign:"center",padding:"8px",color:c.errors>0?"#dc2626":"#059669",fontWeight:600}}>{c.errors}</td>
                <td style={{textAlign:"center",padding:"8px"}}>{c.total}</td>
                <td style={{textAlign:"center",padding:"8px"}}><span style={{padding:"2px 8px",borderRadius:10,fontSize:12,fontWeight:600,
                  background:pct>=85?"#dcfce7":pct>=65?"#fef3c7":pct>=50?"#ffedd5":"#fef2f2",
                  color:pct>=85?"#059669":pct>=65?"#d97706":pct>=50?"#ea580c":"#dc2626"}}>{pct+"%"}</span></td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>

      {/* Phoneme detail */}
      <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,marginBottom:16}}>
        <h3 style={{fontSize:15,fontWeight:700,marginBottom:12}}>{"Detalle por fonema"}</h3>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{borderBottom:"2px solid "+K.bd}}>
            <th style={{textAlign:"left",padding:"6px 8px",color:K.mt,fontSize:11}}>Fonema</th>
            <th style={{textAlign:"center",padding:"6px",color:K.mt,fontSize:11}}>Edad</th>
            <th style={{textAlign:"center",padding:"6px",color:"#059669",fontSize:11}}>{"\u2713"}</th>
            <th style={{textAlign:"center",padding:"6px",color:"#dc2626",fontSize:11}}>Err.</th>
            <th style={{textAlign:"center",padding:"6px",color:K.mt,fontSize:11}}>Total</th>
            <th style={{textAlign:"center",padding:"6px",color:K.mt,fontSize:11}}>Estado</th>
          </tr></thead>
          <tbody>
            {Object.entries(results.byPhoneme).map(function(e){
              var id = e[0], ph = e[1];
              var hasErrors = ph.errors > 0;
              var isExpected = (patientAge/12) >= ph.age;
              return <tr key={id} style={{borderBottom:"1px solid #f1f5f9",background:hasErrors && isExpected?"#fef2f2":"transparent"}}>
                <td style={{padding:"6px 8px",fontWeight:700}}>{ph.phoneme}</td>
                <td style={{textAlign:"center",padding:"6px",fontSize:11}}>{ph.age+" a."}</td>
                <td style={{textAlign:"center",padding:"6px",color:"#059669",fontWeight:600}}>{ph.ok||"-"}</td>
                <td style={{textAlign:"center",padding:"6px",color:ph.errors>0?"#dc2626":"#d1d5db",fontWeight:600}}>{ph.errors||"-"}</td>
                <td style={{textAlign:"center",padding:"6px"}}>{ph.total}</td>
                <td style={{textAlign:"center",padding:"6px"}}>
                  {hasErrors && isExpected && <span style={{padding:"2px 8px",borderRadius:10,background:"#fef2f2",color:"#dc2626",fontSize:10,fontWeight:700}}>ALTERADO</span>}
                  {hasErrors && !isExpected && <span style={{padding:"2px 8px",borderRadius:10,background:"#fef3c7",color:"#d97706",fontSize:10,fontWeight:700}}>EN DESARROLLO</span>}
                  {!hasErrors && <span style={{padding:"2px 8px",borderRadius:10,background:"#dcfce7",color:"#059669",fontSize:10,fontWeight:700}}>ADECUADO</span>}
                </td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>

      {/* Error details */}
      {results.errorList.length > 0 && <div style={{background:"#fff",borderRadius:12,border:"1px solid #fecaca",padding:20,marginBottom:16}}>
        <h3 style={{fontSize:15,fontWeight:700,color:"#dc2626",marginBottom:12}}>{"\u26a0 Detalle de errores ("+results.errorList.length+")"}</h3>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead><tr style={{borderBottom:"2px solid "+K.bd,background:"#fef2f2"}}>
            <th style={{textAlign:"left",padding:"6px 8px",color:K.mt,fontSize:11}}>Fonema</th>
            <th style={{textAlign:"left",padding:"6px 8px",color:K.mt,fontSize:11}}>Palabra</th>
            <th style={{textAlign:"center",padding:"6px",color:K.mt,fontSize:11}}>Pos.</th>
            <th style={{textAlign:"left",padding:"6px 8px",color:K.mt,fontSize:11}}>{"Producci\u00f3n"}</th>
          </tr></thead>
          <tbody>
            {results.errorList.map(function(err, i){
              var isExpected = (patientAge/12) >= err.age;
              return <tr key={i} style={{borderBottom:"1px solid #f1f5f9",background:isExpected?"#fef2f2":"#fffbeb"}}>
                <td style={{padding:"6px 8px",fontWeight:700,color:K.ac}}>{err.phoneme}</td>
                <td style={{padding:"6px 8px",fontWeight:500}}>{err.word}</td>
                <td style={{textAlign:"center",padding:"6px",fontSize:11,fontWeight:600,color:K.mt}}>{err.posId}</td>
                <td style={{padding:"6px 8px",color:"#dc2626",fontWeight:600}}>{err.produccion}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>}

      {/* Altered phonemes summary */}
      {(function(){
        var altered = Object.entries(results.byPhoneme).filter(function(e){
          var ph = e[1]; return ph.errors > 0 && (patientAge/12) >= ph.age;
        });
        if(altered.length === 0) return <div style={{background:"#dcfce7",borderRadius:12,padding:20,marginBottom:16,textAlign:"center"}}>
          <span style={{fontSize:24}}>{"\u2705"}</span>
          <p style={{fontSize:14,fontWeight:600,color:"#059669",marginTop:8}}>{"Todos los fonemas esperados para la edad est\u00e1n adecuados."}</p>
        </div>;
        return <div style={{background:"#fef2f2",borderRadius:12,border:"1px solid #fecaca",padding:20,marginBottom:16}}>
          <h3 style={{fontSize:15,fontWeight:700,color:"#dc2626",marginBottom:8}}>{"\u26a0 Fonemas alterados (esperados para la edad)"}</h3>
          <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
            {altered.map(function(e){
              var ph = e[1];
              return <div key={e[0]} style={{background:"#fff",borderRadius:8,padding:"8px 14px",border:"1px solid #fecaca"}}>
                <span style={{fontWeight:700,fontSize:16}}>{ph.phoneme}</span>
                <span style={{fontSize:11,color:"#dc2626",marginLeft:6}}>{ph.errors+" err."}</span>
                {ph.errorWords.length > 0 && <div style={{fontSize:10,color:K.mt,marginTop:2}}>
                  {ph.errorWords.map(function(ew){return ew.word+"\u2192"+ew.produccion}).join(", ")}
                </div>}
              </div>;
            })}
          </div>
        </div>;
      })()}

      {obs && <div style={{background:"#fff",borderRadius:12,border:"1px solid "+K.bd,padding:20,marginBottom:16}}>
        <h3 style={{fontSize:14,fontWeight:600,marginBottom:6}}>Observaciones</h3>
        <p style={{fontSize:13,color:K.mt}}>{obs}</p>
      </div>}

      <div style={{display:"flex",gap:10,marginTop:20}}>
        <button onClick={onBack}
          style={{flex:1,padding:"14px",background:"#f1f5f9",border:"1px solid "+K.bd,borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",color:K.mt}}>
          {"\u2190 Volver a editar"}</button>
        <button onClick={onSave}
          style={{flex:2,padding:"14px",background:"#059669",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer",color:"#fff"}}>
          {"\ud83d\udcbe Guardar evaluaci\u00f3n"}</button>
      </div>
    </div>
  );
}
