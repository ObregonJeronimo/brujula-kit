import { useState, useEffect, useCallback } from "react";
import { db, collection, getDocs } from "../firebase.js";
import { VISIBLE_TYPES, TYPE_COLORS, isVisibleType } from "../config/evalTypes.js";

var K={mt:"#64748b",ac:"#0d9488",sd:"#0a3d2f"};
var PRICE_PER_CREDIT=1650;

function fmt$(n){return"$"+n.toLocaleString("es-AR")}
function fmtMo(y,m){return new Date(y,m).toLocaleString("es-AR",{month:"long",year:"numeric"})}
function fmtDate(d){return new Date(d).toLocaleDateString("es-AR",{day:"numeric",month:"short",year:"numeric"})}

export default function AdminStats({nfy}){
  var _u=useState([]),users=_u[0],setUsers=_u[1];
  var _ae=useState([]),allEvals=_ae[0],setAllEvals=_ae[1];
  var _pg=useState([]),allPagos=_pg[0],setAllPagos=_pg[1];
  var _ld=useState(true),ld=_ld[0],setLd=_ld[1];
  var _tab=useState("resumen"),tab=_tab[0],setTab=_tab[1];
  var _sy=useState(new Date().getFullYear()),selYear=_sy[0],setSelYear=_sy[1];
  var _sm=useState(new Date().getMonth()),selMonth=_sm[0],setSelMonth=_sm[1];
  var _payFilter=useState("month"),payFilter=_payFilter[0],setPayFilter=_payFilter[1];
  var _payYear=useState(new Date().getFullYear()),payYear=_payYear[0],setPayYear=_payYear[1];
  var _payMonth=useState(new Date().getMonth()),payMonth=_payMonth[0],setPayMonth=_payMonth[1];

  var load=useCallback(function(){
    setLd(true);
    Promise.all([
      getDocs(collection(db,"usuarios")),
      getDocs(collection(db,"evaluaciones")),
      getDocs(collection(db,"pagos")).catch(function(){ return { docs: [] }; })
    ]).then(function(res){
      setUsers(res[0].docs.map(function(d){return Object.assign({_fbId:d.id},d.data())}));
      setAllEvals(res[1].docs.map(function(d){return Object.assign({_fbId:d.id},d.data())}));
      setAllPagos(res[2].docs.map(function(d){return Object.assign({_fbId:d.id},d.data())}).sort(function(a,b){return(b.processedAt||"").localeCompare(a.processedAt||"")}));
    }).catch(function(e){nfy("Error cargando datos: "+e.message,"er")}).finally(function(){setLd(false)});
  },[nfy]);

  useEffect(function(){load()},[load]);

  var visibleEvals=allEvals.filter(function(e){return isVisibleType(e.tipo)});
  var nonAdminUsers=users.filter(function(u){return u.role!=="admin"});
  var totalUsers=nonAdminUsers.length;
  var totalCreditsDeducted=allEvals.length;
  var neverPurchased=nonAdminUsers.filter(function(u){
    var userEvals=allEvals.filter(function(ev){return ev.userId===u._fbId}).length;
    var totalEverHad=(u.creditos||0)+userEvals;
    return totalEverHad<=5;
  });
  var totalCreditsPurchased=nonAdminUsers.reduce(function(sum,u){
    var userEvals=allEvals.filter(function(ev){return ev.userId===u._fbId}).length;
    var totalEverHad=(u.creditos||0)+userEvals;
    return sum+Math.max(0,totalEverHad-5);
  },0);
  var totalRevenue=totalCreditsPurchased*PRICE_PER_CREDIT;

  var getMonthEvals=function(y,m){return visibleEvals.filter(function(ev){if(!ev.fechaGuardado)return false;var d=new Date(ev.fechaGuardado);return d.getFullYear()===y&&d.getMonth()===m})};
  var getYearEvals=function(y){return visibleEvals.filter(function(ev){if(!ev.fechaGuardado)return false;return new Date(ev.fechaGuardado).getFullYear()===y})};

  var monthEvals=getMonthEvals(selYear,selMonth);
  var yearEvals=getYearEvals(selYear);

  // Dynamic type counts from registry
  var typeCounts=function(evs){var c={};VISIBLE_TYPES.forEach(function(t){c[t.id]=evs.filter(function(e){return e.tipo===t.id}).length});return c};
  var mc=typeCounts(monthEvals);
  var yc=typeCounts(yearEvals);
  var globalCounts=typeCounts(visibleEvals);

  // Build sub string dynamically: "PEFF: 5 · REP: 3 · ..."
  var evalCountsSub=VISIBLE_TYPES.map(function(t){return t.label+": "+globalCounts[t.id]}).join(" · ");

  var usersCreatedMonth=nonAdminUsers.filter(function(u){if(!u.createdAt)return false;var d=new Date(u.createdAt);return d.getFullYear()===selYear&&d.getMonth()===selMonth});
  var usersCreatedYear=nonAdminUsers.filter(function(u){if(!u.createdAt)return false;return new Date(u.createdAt).getFullYear()===selYear});

  var prevMonth=function(){if(selMonth===0){setSelMonth(11);setSelYear(function(y){return y-1})}else setSelMonth(function(m){return m-1})};
  var nextMonth=function(){if(selMonth===11){setSelMonth(0);setSelYear(function(y){return y+1})}else setSelMonth(function(m){return m+1})};

  var monthNames=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  var monthlyData=monthNames.map(function(_,m){var mEvals=getMonthEvals(selYear,m);return{m:m,count:mEvals.length}});
  var maxMonthly=Math.max(1,Math.max.apply(null,monthlyData.map(function(d){return d.count})));

  var Stat=function(props){return <div style={{background:"#fff",borderRadius:12,padding:"18px 20px",border:"1px solid #e2e8f0"}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><span style={{fontSize:22}}>{props.icon}</span><span style={{fontSize:12,color:K.mt,fontWeight:600}}>{props.label}</span></div><div style={{fontSize:28,fontWeight:700,color:props.color||"#1e293b"}}>{props.value}</div>{props.sub&&<div style={{fontSize:11,color:K.mt,marginTop:2}}>{props.sub}</div>}</div>};

  var TabBtn=function(props){return <button onClick={function(){setTab(props.id)}} style={{padding:"10px 20px",background:tab===props.id?"#0d9488":"#fff",color:tab===props.id?"#fff":"#475569",border:tab===props.id?"none":"1px solid #e2e8f0",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>{props.icon+" "+props.label}</button>};

  if(ld)return <div style={{animation:"fi .3s ease",textAlign:"center",padding:60}}><div style={{fontSize:36,marginBottom:12}}>{"📊"}</div><div style={{fontSize:16,fontWeight:600,color:K.mt}}>{"Cargando estadísticas..."}</div></div>;

  return <div style={{animation:"fi .3s ease",width:"100%",maxWidth:1000}}>
    <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>{"📊 Estadísticas"}</h1>
    <p style={{color:K.mt,fontSize:14,marginBottom:20}}>{"Panel de análisis y métricas del sistema"}</p>

    <div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"}}>
      <TabBtn id="resumen" label="Resumen Global" icon="🌐"/>
      <TabBtn id="mensual" label="Mensual / Anual" icon="📅"/>
      <TabBtn id="pagos" label="Pagos" icon="💰"/>
    </div>

    {tab==="resumen"&&<div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14,marginBottom:24}}>
        <Stat icon="💰" label="Ingresos totales" value={fmt$(totalRevenue)} sub={totalCreditsPurchased+" créditos vendidos"} color="#059669"/>
        <Stat icon="💳" label="Evaluaciones realizadas" value={visibleEvals.length} sub={evalCountsSub} color="#7c3aed"/>
        <Stat icon="👥" label="Usuarios registrados" value={totalUsers} sub={neverPurchased.length+" nunca compraron"} color="#0d9488"/>
        <Stat icon="⚠️" label="Sin comprar" value={neverPurchased.length} sub="terminaron demo sin comprar" color="#f59e0b"/>
      </div>

      <div style={{background:"#fff",borderRadius:12,padding:24,border:"1px solid #e2e8f0",marginBottom:20}}>
        <div style={{fontSize:15,fontWeight:700,marginBottom:16}}>{"Evaluaciones por mes ("+selYear+")"}</div>
        <div style={{display:"flex",alignItems:"flex-end",gap:6,height:140,padding:"0 4px"}}>
          {monthlyData.map(function(d){return <div key={d.m} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <div style={{fontSize:10,fontWeight:600,color:K.mt}}>{d.count||""}</div>
            <div style={{width:"100%",borderRadius:3,height:Math.max(2,d.count/maxMonthly*100),transition:"height .3s",background:d.count>0?"linear-gradient(to top,#0d9488,#7c3aed)":"#e2e8f0"}}/>
            <div style={{fontSize:9,color:K.mt}}>{monthNames[d.m]}</div>
          </div>})}
        </div>
        <div style={{display:"flex",gap:12,marginTop:12,justifyContent:"center",fontSize:11,flexWrap:"wrap"}}>
          {Object.entries(TYPE_COLORS).map(function(e){return <span key={e[0]} style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,borderRadius:2,background:e[1]}}/>{e[0]}</span>})}
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:12,marginTop:12}}>
          <button onClick={function(){setSelYear(function(y){return y-1})}} style={{background:"#f1f5f9",border:"none",borderRadius:6,padding:"6px 14px",fontSize:12,cursor:"pointer"}}>{"← "+(selYear-1)}</button>
          <span style={{fontWeight:700,fontSize:14,padding:"6px 0"}}>{selYear}</span>
          <button onClick={function(){setSelYear(function(y){return y+1})}} style={{background:"#f1f5f9",border:"none",borderRadius:6,padding:"6px 14px",fontSize:12,cursor:"pointer"}}>{(selYear+1)+" →"}</button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat("+VISIBLE_TYPES.length+",1fr)",gap:10,marginBottom:20}}>
        {VISIBLE_TYPES.map(function(t){return <div key={t.id} style={{background:"#fff",borderRadius:10,padding:16,border:"1px solid #e2e8f0",textAlign:"center"}}><div style={{fontSize:24,fontWeight:700,color:t.color}}>{globalCounts[t.id]}</div><div style={{fontSize:11,color:K.mt,fontWeight:600}}>{t.label}</div></div>})}
      </div>

      {neverPurchased.length>0&&<div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:12,padding:20}}>
        <div style={{fontSize:14,fontWeight:700,color:"#92400e",marginBottom:12}}>{"⚠ Usuarios que no compraron ("+ neverPurchased.length+")"}</div>
        <div style={{maxHeight:200,overflowY:"auto"}}>
          {neverPurchased.map(function(u){return <div key={u._fbId} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #fde68a",fontSize:13}}>
            <div><span style={{fontWeight:600}}>{u.nombre} {u.apellido}</span><span style={{color:K.mt,marginLeft:8}}>@{u.username}</span></div>
            <div style={{fontSize:11,color:K.mt}}>{(u.creditos||0)+" créd."}{u.createdAt?" · "+fmtDate(u.createdAt):""}</div>
          </div>})}
        </div>
      </div>}
    </div>}

    {tab==="mensual"&&<div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:16,marginBottom:24,background:"#fff",borderRadius:10,padding:"14px 20px",border:"1px solid #e2e8f0"}}>
        <button onClick={prevMonth} style={{background:"#f1f5f9",border:"none",borderRadius:6,padding:"8px 16px",fontSize:14,cursor:"pointer",fontWeight:600}}>{"←"}</button>
        <div style={{textAlign:"center",minWidth:200}}><div style={{fontSize:18,fontWeight:700,color:K.sd,textTransform:"capitalize"}}>{fmtMo(selYear,selMonth)}</div></div>
        <button onClick={nextMonth} style={{background:"#f1f5f9",border:"none",borderRadius:6,padding:"8px 16px",fontSize:14,cursor:"pointer",fontWeight:600}}>{"→"}</button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:20}}>
        {VISIBLE_TYPES.map(function(t){return <Stat key={t.id} icon={t.icon} label={t.label} value={mc[t.id]} color={t.color}/>})}
        <Stat icon="💳" label="Total" value={monthEvals.length} sub="evaluaciones" color="#1e293b"/>
        <Stat icon="👤" label="Nuevos usuarios" value={usersCreatedMonth.length}/>
      </div>

      <div style={{background:"linear-gradient(135deg,#0a3d2f,#0d9488)",borderRadius:14,padding:24,color:"#fff",marginBottom:20}}>
        <div style={{fontSize:14,opacity:.8,marginBottom:12}}>{"Resumen anual "+selYear}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:16}}>
          <div><div style={{fontSize:32,fontWeight:700}}>{yearEvals.length}</div><div style={{fontSize:12,opacity:.7}}>total</div></div>
          {VISIBLE_TYPES.map(function(t){return <div key={t.id}><div style={{fontSize:24,fontWeight:700}}>{yc[t.id]}</div><div style={{fontSize:11,opacity:.7}}>{t.label}</div></div>})}
          <div><div style={{fontSize:24,fontWeight:700}}>{usersCreatedYear.length}</div><div style={{fontSize:11,opacity:.7}}>nuevos</div></div>
        </div>
      </div>

      {monthEvals.length>0?<div style={{background:"#fff",borderRadius:12,padding:20,border:"1px solid #e2e8f0"}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>{"Evaluaciones del mes ("+monthEvals.length+")"}</div>
        <div style={{maxHeight:300,overflowY:"auto"}}>
          {monthEvals.sort(function(a,b){return(b.fechaGuardado||"").localeCompare(a.fechaGuardado||"")}).map(function(ev,i){return <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #f1f5f9",fontSize:13}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{background:TYPE_COLORS[(ev.tipo||"").toUpperCase()]||"#94a3b8",color:"#fff",padding:"3px 8px",borderRadius:4,fontSize:10,fontWeight:700}}>{(ev.tipo||"").toUpperCase()}</span>
              <span style={{fontWeight:600}}>{ev.paciente}</span>
            </div>
            <div style={{fontSize:11,color:K.mt}}>{(ev.evaluador||"?") + " · " + (ev.fechaGuardado?fmtDate(ev.fechaGuardado):"")}</div>
          </div>})}
        </div>
      </div>:<div style={{background:"#f8faf9",borderRadius:10,padding:20,textAlign:"center",color:K.mt,fontSize:14}}>Sin evaluaciones este mes</div>}
    </div>}

    {tab==="pagos"&&(function(){
      // Filter pagos by selected period
      var filteredPagos = allPagos.filter(function(p){
        if(!p.processedAt) return false;
        var d = new Date(p.processedAt);
        if(payFilter === "month") return d.getFullYear() === payYear && d.getMonth() === payMonth;
        if(payFilter === "year") return d.getFullYear() === payYear;
        return true; // "all"
      });
      var totalFiltered = filteredPagos.reduce(function(s,p){ return s + (p.amount || 0); }, 0);
      var totalCredits = filteredPagos.reduce(function(s,p){ return s + (p.creditosAgregados || 0); }, 0);
      var userMap = {};
      users.forEach(function(u){ userMap[u._fbId] = u; });
      var monthNames2 = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

      return <div>
        {/* Filter controls */}
        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
          {[["month","Este mes"],["year","Este año"],["all","Todos"]].map(function(f){
            return <button key={f[0]} onClick={function(){setPayFilter(f[0]);if(f[0]==="month"){setPayYear(new Date().getFullYear());setPayMonth(new Date().getMonth())}else if(f[0]==="year"){setPayYear(new Date().getFullYear())}}} style={{padding:"6px 14px",borderRadius:6,border:payFilter===f[0]?"2px solid "+K.ac:"1px solid #e2e8f0",background:payFilter===f[0]?"#ccfbf1":"#fff",color:payFilter===f[0]?K.ac:K.mt,fontSize:12,fontWeight:600,cursor:"pointer"}}>{f[1]}</button>;
          })}
          {payFilter==="month" && <div style={{display:"flex",alignItems:"center",gap:6}}>
            <button onClick={function(){if(payMonth===0){setPayMonth(11);setPayYear(function(y){return y-1})}else setPayMonth(function(m){return m-1})}} style={{background:"#f1f5f9",border:"none",borderRadius:6,padding:"6px 10px",cursor:"pointer",fontSize:12}}>{"←"}</button>
            <span style={{fontSize:13,fontWeight:600,minWidth:130,textAlign:"center"}}>{monthNames2[payMonth]+" "+payYear}</span>
            <button onClick={function(){if(payMonth===11){setPayMonth(0);setPayYear(function(y){return y+1})}else setPayMonth(function(m){return m+1})}} style={{background:"#f1f5f9",border:"none",borderRadius:6,padding:"6px 10px",cursor:"pointer",fontSize:12}}>{"→"}</button>
          </div>}
          {payFilter==="year" && <div style={{display:"flex",alignItems:"center",gap:6}}>
            <button onClick={function(){setPayYear(function(y){return y-1})}} style={{background:"#f1f5f9",border:"none",borderRadius:6,padding:"6px 10px",cursor:"pointer",fontSize:12}}>{"←"}</button>
            <span style={{fontSize:13,fontWeight:600}}>{payYear}</span>
            <button onClick={function(){setPayYear(function(y){return y+1})}} style={{background:"#f1f5f9",border:"none",borderRadius:6,padding:"6px 10px",cursor:"pointer",fontSize:12}}>{"→"}</button>
          </div>}
        </div>

        {/* Summary cards */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:20}}>
          <Stat icon="💰" label="Ingresos" value={fmt$(totalFiltered)} color="#059669"/>
          <Stat icon="💳" label="Créditos vendidos" value={totalCredits} color="#7c3aed"/>
          <Stat icon="📋" label="Transacciones" value={filteredPagos.length} color={K.sd}/>
        </div>

        {/* Payments table */}
        {filteredPagos.length > 0 ? <div style={{background:"#fff",borderRadius:12,border:"1px solid #e2e8f0",overflow:"hidden"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 80px 100px 120px",gap:8,padding:"10px 16px",background:K.sd,color:"#fff",fontSize:11,fontWeight:700}}>
            <span>Usuario</span><span>Email</span><span style={{textAlign:"center"}}>Créditos</span><span style={{textAlign:"right"}}>Monto</span><span style={{textAlign:"right"}}>Fecha</span>
          </div>
          <div style={{maxHeight:400,overflowY:"auto"}}>
            {filteredPagos.map(function(p,i){
              var u = userMap[p.uid] || {};
              return <div key={p._fbId||i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 80px 100px 120px",gap:8,padding:"10px 16px",borderBottom:"1px solid #f1f5f9",alignItems:"center",fontSize:13}}>
                <div style={{fontWeight:600,color:K.sd}}>{u.nombre ? u.nombre+" "+(u.apellido||"") : p.uid ? p.uid.substring(0,8)+"..." : "?"}</div>
                <div style={{fontSize:11,color:K.mt,overflow:"hidden",textOverflow:"ellipsis"}}>{p.email || u.email || "—"}</div>
                <div style={{textAlign:"center",fontWeight:700,color:"#7c3aed"}}>{p.creditosAgregados || "?"}</div>
                <div style={{textAlign:"right",fontWeight:600,color:"#059669"}}>{fmt$(p.amount || 0)}</div>
                <div style={{textAlign:"right",fontSize:11,color:K.mt}}>{p.processedAt ? fmtDate(p.processedAt) : "—"}</div>
              </div>;
            })}
          </div>
        </div> : <div style={{background:"#f8faf9",borderRadius:10,padding:20,textAlign:"center",color:K.mt,fontSize:14}}>{"Sin pagos en este período"}</div>}
      </div>;
    })()}
  </div>;
}
