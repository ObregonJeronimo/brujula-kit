import { useState, useEffect, useCallback } from "react";
import { db, collection, getDocs } from "../firebase.js";
import { VISIBLE_TYPES, TYPE_COLORS, isVisibleType } from "../config/evalTypes.js";
import "../styles/AdminStats.css";

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
  var neverPurchased=nonAdminUsers.filter(function(u){
    return !allPagos.some(function(p){ return p.userId===u._fbId; });
  });
  var totalCreditsPurchased=allPagos.reduce(function(sum,p){ return sum+(p.creditosAgregados||0); },0);
  var totalRevenue=allPagos.reduce(function(sum,p){ return sum+(p.amount||0); },0);

  var getMonthEvals=function(y,m){return visibleEvals.filter(function(ev){if(!ev.fechaGuardado)return false;var d=new Date(ev.fechaGuardado);return d.getFullYear()===y&&d.getMonth()===m})};
  var getYearEvals=function(y){return visibleEvals.filter(function(ev){if(!ev.fechaGuardado)return false;return new Date(ev.fechaGuardado).getFullYear()===y})};

  var monthEvals=getMonthEvals(selYear,selMonth);
  var yearEvals=getYearEvals(selYear);

  var typeCounts=function(evs){var c={};VISIBLE_TYPES.forEach(function(t){c[t.id]=evs.filter(function(e){return e.tipo===t.id}).length});return c};
  var mc=typeCounts(monthEvals);
  var yc=typeCounts(yearEvals);

  var usersCreatedMonth=nonAdminUsers.filter(function(u){if(!u.createdAt)return false;var d=new Date(u.createdAt);return d.getFullYear()===selYear&&d.getMonth()===selMonth});
  var usersCreatedYear=nonAdminUsers.filter(function(u){if(!u.createdAt)return false;return new Date(u.createdAt).getFullYear()===selYear});

  var prevMonth=function(){if(selMonth===0){setSelMonth(11);setSelYear(function(y){return y-1})}else setSelMonth(function(m){return m-1})};
  var nextMonth=function(){if(selMonth===11){setSelMonth(0);setSelYear(function(y){return y+1})}else setSelMonth(function(m){return m+1})};

  var monthNames=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  var Stat=function(props){return <div className="stats-card">
    <div className="stats-card-header">
      <span className="stats-card-icon">{props.icon}</span>
      <span className="stats-card-label">{props.label}</span>
    </div>
    <div className="stats-card-value" style={props.color?{color:props.color}:undefined}>{props.value}</div>
    {props.sub && <div className="stats-card-sub">{props.sub}</div>}
  </div>};

  var TabBtn=function(props){return <button onClick={function(){setTab(props.id)}} className={"stats-tab"+(tab===props.id?" stats-tab--active":"")}>{props.icon+" "+props.label}</button>};

  if(ld)return <div className="stats-loading">
    <div className="stats-loading-icon">{"📊"}</div>
    <div className="stats-loading-text">{"Cargando estadísticas..."}</div>
  </div>;

  return <div className="stats-page">
    <h1 className="stats-title">{"📊 Estadísticas"}</h1>
    <p className="stats-subtitle">{"Panel de análisis y métricas del sistema"}</p>

    <div className="stats-tabs">
      <TabBtn id="resumen" label="Resumen Global" icon="🌐"/>
      <TabBtn id="mensual" label="Mensual / Anual" icon="📅"/>
      <TabBtn id="pagos" label="Pagos" icon="💰"/>
    </div>

    {tab==="resumen"&&<div>
      <div className="stats-grid-4">
        <Stat icon="💰" label="Ingresos totales" value={fmt$(totalRevenue)} sub={totalCreditsPurchased+" créditos vendidos"} color="#059669"/>
        <Stat icon={"\ud83d\udcb3"} label={"Evaluaciones realizadas"} value={visibleEvals.length} color="#7c3aed"/>
        <Stat icon={"\ud83d\udc65"} label={"Usuarios registrados"} value={totalUsers} color="#0d9488"/>
        <Stat icon="⚠️" label="Sin comprar" value={neverPurchased.length} sub="terminaron demo sin comprar" color="#f59e0b"/>
      </div>

      <div className="stats-chart-card">
        <div className="stats-chart-title">{"Ingresos por mes ("+selYear+")"}</div>
        {(function(){
          var monthlyIncome = monthNames.map(function(_,m){
            var mPagos = allPagos.filter(function(p){ if(!p.processedAt) return false; var d = new Date(p.processedAt); return d.getFullYear()===selYear && d.getMonth()===m; });
            var total = mPagos.reduce(function(s,p){ return s + (p.amount||0); },0);
            var creds = mPagos.reduce(function(s,p){ return s + (p.creditosAgregados||0); },0);
            return {m:m, amount:total, creds:creds};
          });
          var maxIncome = Math.max(1, Math.max.apply(null, monthlyIncome.map(function(d){return d.amount})));
          return <div>
            <div className="stats-chart-bars">
              {monthlyIncome.map(function(d){ return <div key={d.m} className="stats-chart-bar">
                <div className="stats-chart-amount">{d.amount > 0 ? fmt$(d.amount) : ""}</div>
                <div className={"stats-chart-bar-fill"+(d.amount>0?" stats-chart-bar-fill--has":" stats-chart-bar-fill--empty")} style={{height:Math.max(2, d.amount/maxIncome*100)+"px"}}/>
                <div className="stats-chart-month-label">{monthNames[d.m]}</div>
              </div>; })}
            </div>
          </div>;
        })()}
        <div className="stats-chart-nav">
          <button onClick={function(){setSelYear(function(y){return y-1})}} className="stats-year-btn">{"← "+(selYear-1)}</button>
          <span className="stats-year-label">{selYear}</span>
          <button onClick={function(){setSelYear(function(y){return y+1})}} className="stats-year-btn">{(selYear+1)+" →"}</button>
        </div>
      </div>

      {neverPurchased.length>0 && <div className="stats-alert">
        <div className="stats-alert-title">{"⚠ Usuarios que no compraron ("+ neverPurchased.length+")"}</div>
        <div className="stats-alert-list">
          {neverPurchased.map(function(u){return <div key={u._fbId} className="stats-alert-row">
            <div><span className="stats-alert-user-name">{u.nombre} {u.apellido}</span><span className="stats-alert-user-username">@{u.username}</span></div>
            <div className="stats-alert-meta">{(u.creditos||0)+" créd."}{u.createdAt?" · "+fmtDate(u.createdAt):""}</div>
          </div>})}
        </div>
      </div>}
    </div>}

    {tab==="mensual"&&<div>
      <div className="stats-month-nav">
        <button onClick={prevMonth} className="stats-month-btn">{"←"}</button>
        <div className="stats-month-label-wrap"><div className="stats-month-label">{fmtMo(selYear,selMonth)}</div></div>
        <button onClick={nextMonth} className="stats-month-btn">{"→"}</button>
      </div>

      <div className="stats-grid-types">
        {VISIBLE_TYPES.map(function(t){return <Stat key={t.id} icon={t.icon} label={t.label} value={mc[t.id]} color={t.color}/>})}
        <Stat icon="💳" label="Total" value={monthEvals.length} sub="evaluaciones" color="#1e293b"/>
        <Stat icon="👤" label="Nuevos usuarios" value={usersCreatedMonth.length}/>
      </div>

      <div className="stats-annual">
        <div className="stats-annual-label">{"Resumen anual "+selYear}</div>
        <div className="stats-annual-grid">
          <div><div className="stats-annual-big">{yearEvals.length}</div><div className="stats-annual-sub">total</div></div>
          {VISIBLE_TYPES.map(function(t){return <div key={t.id}><div className="stats-annual-mid">{yc[t.id]}</div><div className="stats-annual-sub-sm">{t.label}</div></div>})}
          <div><div className="stats-annual-mid">{usersCreatedYear.length}</div><div className="stats-annual-sub-sm">nuevos</div></div>
        </div>
      </div>

      {monthEvals.length>0 ? <div className="stats-list-card">
        <div className="stats-list-title">{"Evaluaciones del mes ("+monthEvals.length+")"}</div>
        <div className="stats-list-scroll">
          {monthEvals.sort(function(a,b){return(b.fechaGuardado||"").localeCompare(a.fechaGuardado||"")}).map(function(ev,i){return <div key={i} className="stats-list-row">
            <div className="stats-list-row-left">
              <span className="stats-list-badge" style={{background:TYPE_COLORS[(ev.tipo||"").toUpperCase()]||"#94a3b8"}}>{(ev.tipo||"").toUpperCase()}</span>
              <span className="stats-list-name">{ev.paciente}</span>
            </div>
            <div className="stats-list-meta">{(ev.evaluador||"?") + " · " + (ev.fechaGuardado?fmtDate(ev.fechaGuardado):"")}</div>
          </div>})}
        </div>
      </div> : <div className="stats-empty">Sin evaluaciones este mes</div>}
    </div>}

    {tab==="pagos"&&(function(){
      var filteredPagos = allPagos.filter(function(p){
        if(!p.processedAt) return false;
        var d = new Date(p.processedAt);
        if(payFilter === "month") return d.getFullYear() === payYear && d.getMonth() === payMonth;
        if(payFilter === "year") return d.getFullYear() === payYear;
        return true;
      });
      var totalFiltered = filteredPagos.reduce(function(s,p){ return s + (p.amount || 0); }, 0);
      var totalCredits = filteredPagos.reduce(function(s,p){ return s + (p.creditosAgregados || 0); }, 0);
      var userMap = {};
      users.forEach(function(u){ userMap[u._fbId] = u; });
      var monthNames2 = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

      return <div>
        <div className="stats-pay-filters">
          {[["month","Este mes"],["year","Este año"],["all","Todos"]].map(function(f){
            return <button key={f[0]} onClick={function(){setPayFilter(f[0]);if(f[0]==="month"){setPayYear(new Date().getFullYear());setPayMonth(new Date().getMonth())}else if(f[0]==="year"){setPayYear(new Date().getFullYear())}}} className={"stats-pay-filter"+(payFilter===f[0]?" stats-pay-filter--active":"")}>{f[1]}</button>;
          })}
          {payFilter==="month" && <div className="stats-pay-nav">
            <button onClick={function(){if(payMonth===0){setPayMonth(11);setPayYear(function(y){return y-1})}else setPayMonth(function(m){return m-1})}} className="stats-pay-nav-btn">{"←"}</button>
            <span className="stats-pay-nav-label">{monthNames2[payMonth]+" "+payYear}</span>
            <button onClick={function(){if(payMonth===11){setPayMonth(0);setPayYear(function(y){return y+1})}else setPayMonth(function(m){return m+1})}} className="stats-pay-nav-btn">{"→"}</button>
          </div>}
          {payFilter==="year" && <div className="stats-pay-nav">
            <button onClick={function(){setPayYear(function(y){return y-1})}} className="stats-pay-nav-btn">{"←"}</button>
            <span className="stats-pay-nav-label" style={{minWidth:60}}>{payYear}</span>
            <button onClick={function(){setPayYear(function(y){return y+1})}} className="stats-pay-nav-btn">{"→"}</button>
          </div>}
        </div>

        <div className="stats-grid-3">
          <Stat icon="💰" label="Ingresos" value={fmt$(totalFiltered)} color="#059669"/>
          <Stat icon="💳" label="Créditos vendidos" value={totalCredits} color="#7c3aed"/>
          <Stat icon="📋" label="Transacciones" value={filteredPagos.length} color="#0a3d2f"/>
        </div>

        {filteredPagos.length > 0 ? <div className="stats-pay-table">
          <div className="stats-pay-table-header">
            <span>Usuario</span>
            <span>Email</span>
            <span className="stats-pay-th-center">Créditos</span>
            <span className="stats-pay-th-right">Monto</span>
            <span className="stats-pay-th-right">Fecha</span>
          </div>
          <div className="stats-pay-table-body">
            {filteredPagos.map(function(p,i){
              var u = userMap[p.uid] || {};
              return <div key={p._fbId||i} className="stats-pay-row">
                <div className="stats-pay-user">{u.nombre ? u.nombre+" "+(u.apellido||"") : p.uid ? p.uid.substring(0,8)+"..." : "?"}</div>
                <div className="stats-pay-email">{p.email || u.email || "—"}</div>
                <div className="stats-pay-credits">{p.creditosAgregados || "?"}</div>
                <div className="stats-pay-amount">{fmt$(p.amount || 0)}</div>
                <div className="stats-pay-date">{p.processedAt ? fmtDate(p.processedAt) : "—"}</div>
              </div>;
            })}
          </div>
        </div> : <div className="stats-empty">{"Sin pagos en este período"}</div>}
      </div>;
    })()}
  </div>;
}
