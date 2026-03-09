import { useState, useEffect, useCallback } from "react";
import { db, collection, getDocs } from "../firebase.js";

var K={mt:"#64748b",ac:"#0d9488",sd:"#0a3d2f"};
var PRICE_PER_CREDIT=1650;

function fmt$(n){return"$"+n.toLocaleString("es-AR")}
function fmtMo(y,m){return new Date(y,m).toLocaleString("es-AR",{month:"long",year:"numeric"})}
function fmtDate(d){return new Date(d).toLocaleDateString("es-AR",{day:"numeric",month:"short",year:"numeric"})}

export default function AdminStats({nfy}){
  var _u=useState([]),users=_u[0],setUsers=_u[1];
  var _eldi=useState([]),eldi=_eldi[0],setEldi=_eldi[1];
  var _peff=useState([]),peff=_peff[0],setPeff=_peff[1];
  var _rep=useState([]),rep=_rep[0],setRep=_rep[1];
  var _disc=useState([]),disc=_disc[0],setDisc=_disc[1];
  var _reco=useState([]),reco=_reco[0],setReco=_reco[1];
  var _ld=useState(true),ld=_ld[0],setLd=_ld[1];
  var _tab=useState("resumen"),tab=_tab[0],setTab=_tab[1];
  var _sy=useState(new Date().getFullYear()),selYear=_sy[0],setSelYear=_sy[1];
  var _sm=useState(new Date().getMonth()),selMonth=_sm[0],setSelMonth=_sm[1];

  var load=useCallback(function(){
    setLd(true);
    Promise.all([
      getDocs(collection(db,"usuarios")),
      getDocs(collection(db,"evaluaciones")),
      getDocs(collection(db,"peff_evaluaciones")),
      getDocs(collection(db,"rep_evaluaciones")),
      getDocs(collection(db,"disc_evaluaciones")),
      getDocs(collection(db,"reco_evaluaciones"))
    ]).then(function(res){
      setUsers(res[0].docs.map(function(d){return Object.assign({_fbId:d.id},d.data())}));
      setEldi(res[1].docs.map(function(d){return Object.assign({_fbId:d.id},d.data())}));
      setPeff(res[2].docs.map(function(d){return Object.assign({_fbId:d.id},d.data())}));
      setRep(res[3].docs.map(function(d){return Object.assign({_fbId:d.id},d.data())}));
      setDisc(res[4].docs.map(function(d){return Object.assign({_fbId:d.id},d.data())}));
      setReco(res[5].docs.map(function(d){return Object.assign({_fbId:d.id},d.data())}));
    }).catch(function(e){nfy("Error cargando datos: "+e.message,"er")}).finally(function(){setLd(false)});
  },[nfy]);

  useEffect(function(){load()},[load]);

  // allEvals includes ELDI internally for credit calculations but we hide ELDI from display
  var allEvalsInternal=[].concat(
    eldi.map(function(e){return Object.assign({},e,{tipo:"ELDI"})}),
    peff.map(function(e){return Object.assign({},e,{tipo:"PEFF"})}),
    rep.map(function(e){return Object.assign({},e,{tipo:"REP"})}),
    disc.map(function(e){return Object.assign({},e,{tipo:"DISC"})}),
    reco.map(function(e){return Object.assign({},e,{tipo:"RECO"})})
  );
  // Visible evals exclude ELDI
  var allEvals=allEvalsInternal.filter(function(e){return e.tipo!=="ELDI"});

  var nonAdminUsers=users.filter(function(u){return u.role!=="admin"});
  var totalUsers=nonAdminUsers.length;
  var totalCreditsDeducted=allEvalsInternal.length;
  var neverPurchased=nonAdminUsers.filter(function(u){
    var userEvals=allEvalsInternal.filter(function(ev){return ev.userId===u._fbId}).length;
    var totalEverHad=(u.creditos||0)+userEvals;
    return totalEverHad<=5;
  });
  var totalCreditsPurchased=nonAdminUsers.reduce(function(sum,u){
    var userEvals=allEvalsInternal.filter(function(ev){return ev.userId===u._fbId}).length;
    var totalEverHad=(u.creditos||0)+userEvals;
    return sum+Math.max(0,totalEverHad-5);
  },0);
  var totalRevenue=totalCreditsPurchased*PRICE_PER_CREDIT;

  var getMonthEvals=function(y,m){return allEvals.filter(function(ev){if(!ev.fechaGuardado)return false;var d=new Date(ev.fechaGuardado);return d.getFullYear()===y&&d.getMonth()===m})};
  var getYearEvals=function(y){return allEvals.filter(function(ev){if(!ev.fechaGuardado)return false;return new Date(ev.fechaGuardado).getFullYear()===y})};

  var monthEvals=getMonthEvals(selYear,selMonth);
  var yearEvals=getYearEvals(selYear);
  var typeCounts=function(evs){return{peff:evs.filter(function(e){return e.tipo==="PEFF"}).length,rep:evs.filter(function(e){return e.tipo==="REP"}).length,disc:evs.filter(function(e){return e.tipo==="DISC"}).length,reco:evs.filter(function(e){return e.tipo==="RECO"}).length}};
  var mc=typeCounts(monthEvals);
  var yc=typeCounts(yearEvals);

  var usersCreatedMonth=nonAdminUsers.filter(function(u){if(!u.createdAt)return false;var d=new Date(u.createdAt);return d.getFullYear()===selYear&&d.getMonth()===selMonth});
  var usersCreatedYear=nonAdminUsers.filter(function(u){if(!u.createdAt)return false;return new Date(u.createdAt).getFullYear()===selYear});

  var prevMonth=function(){if(selMonth===0){setSelMonth(11);setSelYear(function(y){return y-1})}else setSelMonth(function(m){return m-1})};
  var nextMonth=function(){if(selMonth===11){setSelMonth(0);setSelYear(function(y){return y+1})}else setSelMonth(function(m){return m+1})};

  var monthNames=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  var monthlyData=monthNames.map(function(_,m){var mEvals=getMonthEvals(selYear,m);var tc=typeCounts(mEvals);return{m:m,count:mEvals.length,peff:tc.peff,rep:tc.rep,disc:tc.disc,reco:tc.reco}});
  var maxMonthly=Math.max(1,Math.max.apply(null,monthlyData.map(function(d){return d.count})));

  var typeColors={PEFF:"#7c3aed",REP:"#2563eb",DISC:"#ea580c",RECO:"#d946ef"};

  var Stat=function(props){return <div style={{background:"#fff",borderRadius:12,padding:"18px 20px",border:"1px solid #e2e8f0"}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}><span style={{fontSize:22}}>{props.icon}</span><span style={{fontSize:12,color:K.mt,fontWeight:600}}>{props.label}</span></div><div style={{fontSize:28,fontWeight:700,color:props.color||"#1e293b"}}>{props.value}</div>{props.sub&&<div style={{fontSize:11,color:K.mt,marginTop:2}}>{props.sub}</div>}</div>};

  var TabBtn=function(props){return <button onClick={function(){setTab(props.id)}} style={{padding:"10px 20px",background:tab===props.id?"#0d9488":"#fff",color:tab===props.id?"#fff":"#475569",border:tab===props.id?"none":"1px solid #e2e8f0",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>{props.icon+" "+props.label}</button>};

  if(ld)return <div style={{animation:"fi .3s ease",textAlign:"center",padding:60}}><div style={{fontSize:36,marginBottom:12}}>{"\ud83d\udcca"}</div><div style={{fontSize:16,fontWeight:600,color:K.mt}}>Cargando estad\u00edsticas...</div></div>;

  return <div style={{animation:"fi .3s ease",width:"100%",maxWidth:1000}}>
    <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>{"\ud83d\udcca Estad\u00edsticas"}</h1>
    <p style={{color:K.mt,fontSize:14,marginBottom:20}}>Panel de an\u00e1lisis y m\u00e9tricas del sistema</p>

    <div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"}}>
      <TabBtn id="resumen" label="Resumen Global" icon="\ud83c\udf10"/>
      <TabBtn id="mensual" label="Mensual / Anual" icon="\ud83d\udcc5"/>
    </div>

    {tab==="resumen"&&<div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14,marginBottom:24}}>
        <Stat icon="\ud83d\udcb0" label="Ingresos totales" value={fmt$(totalRevenue)} sub={totalCreditsPurchased+" cr\u00e9ditos vendidos"} color="#059669"/>
        <Stat icon="\ud83d\udcb3" label="Evaluaciones realizadas" value={allEvals.length} sub={"PEFF: "+peff.length+" \u00b7 REP: "+rep.length+" \u00b7 DISC: "+disc.length+" \u00b7 RECO: "+reco.length} color="#7c3aed"/>
        <Stat icon="\ud83d\udc65" label="Usuarios registrados" value={totalUsers} sub={neverPurchased.length+" nunca compraron"} color="#0d9488"/>
        <Stat icon="\u26a0\ufe0f" label="Sin comprar" value={neverPurchased.length} sub="terminaron demo sin comprar" color="#f59e0b"/>
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
          {Object.entries(typeColors).map(function(e){return <span key={e[0]} style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,borderRadius:2,background:e[1]}}/>{e[0]}</span>})}
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:12,marginTop:12}}>
          <button onClick={function(){setSelYear(function(y){return y-1})}} style={{background:"#f1f5f9",border:"none",borderRadius:6,padding:"6px 14px",fontSize:12,cursor:"pointer"}}>{"\u2190 "+(selYear-1)}</button>
          <span style={{fontWeight:700,fontSize:14,padding:"6px 0"}}>{selYear}</span>
          <button onClick={function(){setSelYear(function(y){return y+1})}} style={{background:"#f1f5f9",border:"none",borderRadius:6,padding:"6px 14px",fontSize:12,cursor:"pointer"}}>{(selYear+1)+" \u2192"}</button>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
        {[["PEFF",peff.length,"#7c3aed"],["REP",rep.length,"#2563eb"],["DISC",disc.length,"#ea580c"],["RECO",reco.length,"#d946ef"]].map(function(t){return <div key={t[0]} style={{background:"#fff",borderRadius:10,padding:16,border:"1px solid #e2e8f0",textAlign:"center"}}><div style={{fontSize:24,fontWeight:700,color:t[2]}}>{t[1]}</div><div style={{fontSize:11,color:K.mt,fontWeight:600}}>{t[0]}</div></div>})}
      </div>

      {neverPurchased.length>0&&<div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:12,padding:20}}>
        <div style={{fontSize:14,fontWeight:700,color:"#92400e",marginBottom:12}}>{"\u26a0 Usuarios que no compraron ("+ neverPurchased.length+")"}</div>
        <div style={{maxHeight:200,overflowY:"auto"}}>
          {neverPurchased.map(function(u){return <div key={u._fbId} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #fde68a",fontSize:13}}>
            <div><span style={{fontWeight:600}}>{u.nombre} {u.apellido}</span><span style={{color:K.mt,marginLeft:8}}>@{u.username}</span></div>
            <div style={{fontSize:11,color:K.mt}}>{(u.creditos||0)+" cr\u00e9d."}{u.createdAt?" \u00b7 "+fmtDate(u.createdAt):""}</div>
          </div>})}
        </div>
      </div>}
    </div>}

    {tab==="mensual"&&<div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:16,marginBottom:24,background:"#fff",borderRadius:10,padding:"14px 20px",border:"1px solid #e2e8f0"}}>
        <button onClick={prevMonth} style={{background:"#f1f5f9",border:"none",borderRadius:6,padding:"8px 16px",fontSize:14,cursor:"pointer",fontWeight:600}}>{"\u2190"}</button>
        <div style={{textAlign:"center",minWidth:200}}><div style={{fontSize:18,fontWeight:700,color:K.sd,textTransform:"capitalize"}}>{fmtMo(selYear,selMonth)}</div></div>
        <button onClick={nextMonth} style={{background:"#f1f5f9",border:"none",borderRadius:6,padding:"8px 16px",fontSize:14,cursor:"pointer",fontWeight:600}}>{"\u2192"}</button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:20}}>
        <Stat icon="\ud83d\udd0a" label="PEFF" value={mc.peff} color="#7c3aed"/>
        <Stat icon="\ud83d\udcdd" label="REP" value={mc.rep} color="#2563eb"/>
        <Stat icon="\ud83d\udc42" label="DISC" value={mc.disc} color="#ea580c"/>
        <Stat icon="\ud83e\udde0" label="RECO" value={mc.reco} color="#d946ef"/>
        <Stat icon="\ud83d\udcb3" label="Total" value={monthEvals.length} sub="evaluaciones" color="#1e293b"/>
        <Stat icon="\ud83d\udc64" label="Nuevos usuarios" value={usersCreatedMonth.length}/>
      </div>

      <div style={{background:"linear-gradient(135deg,#0a3d2f,#0d9488)",borderRadius:14,padding:24,color:"#fff",marginBottom:20}}>
        <div style={{fontSize:14,opacity:.8,marginBottom:12}}>{"Resumen anual "+selYear}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:16}}>
          <div><div style={{fontSize:32,fontWeight:700}}>{yearEvals.length}</div><div style={{fontSize:12,opacity:.7}}>total</div></div>
          <div><div style={{fontSize:24,fontWeight:700}}>{yc.peff}</div><div style={{fontSize:11,opacity:.7}}>PEFF</div></div>
          <div><div style={{fontSize:24,fontWeight:700}}>{yc.rep}</div><div style={{fontSize:11,opacity:.7}}>REP</div></div>
          <div><div style={{fontSize:24,fontWeight:700}}>{yc.disc}</div><div style={{fontSize:11,opacity:.7}}>DISC</div></div>
          <div><div style={{fontSize:24,fontWeight:700}}>{yc.reco}</div><div style={{fontSize:11,opacity:.7}}>RECO</div></div>
          <div><div style={{fontSize:24,fontWeight:700}}>{usersCreatedYear.length}</div><div style={{fontSize:11,opacity:.7}}>nuevos</div></div>
        </div>
      </div>

      {monthEvals.length>0?<div style={{background:"#fff",borderRadius:12,padding:20,border:"1px solid #e2e8f0"}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>{"Evaluaciones del mes ("+monthEvals.length+")"}</div>
        <div style={{maxHeight:300,overflowY:"auto"}}>
          {monthEvals.sort(function(a,b){return(b.fechaGuardado||"").localeCompare(a.fechaGuardado||"")}).map(function(ev,i){return <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #f1f5f9",fontSize:13}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{background:typeColors[ev.tipo]||"#94a3b8",color:"#fff",padding:"3px 8px",borderRadius:4,fontSize:10,fontWeight:700}}>{ev.tipo}</span>
              <span style={{fontWeight:600}}>{ev.paciente}</span>
            </div>
            <div style={{fontSize:11,color:K.mt}}>{(ev.evaluador||"?") + " \u00b7 " + (ev.fechaGuardado?fmtDate(ev.fechaGuardado):"")}</div>
          </div>})}
        </div>
      </div>:<div style={{background:"#f8faf9",borderRadius:10,padding:20,textAlign:"center",color:K.mt,fontSize:14}}>Sin evaluaciones este mes</div>}
    </div>}
  </div>;
}
