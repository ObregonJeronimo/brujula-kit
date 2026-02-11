import { useState, useEffect, useCallback } from "react";
import { db, collection, getDocs } from "../firebase.js";

const K={mt:"#64748b",ac:"#0d9488",sd:"#0a3d2f"};
const PRICE_PER_CREDIT=1650;

function fmt$(n){return"$"+n.toLocaleString("es-AR")}
function fmtMo(y,m){return new Date(y,m).toLocaleString("es-AR",{month:"long",year:"numeric"})}
function fmtDate(d){return new Date(d).toLocaleDateString("es-AR",{day:"numeric",month:"short",year:"numeric"})}

export default function AdminStats({nfy}){
  const[users,setUsers]=useState([]);
  const[eldi,setEldi]=useState([]);
  const[peff,setPeff]=useState([]);
  const[ld,setLd]=useState(true);
  const[tab,setTab]=useState("resumen");
  const[selYear,setSelYear]=useState(new Date().getFullYear());
  const[selMonth,setSelMonth]=useState(new Date().getMonth());
  const[selUser,setSelUser]=useState(null);

  const load=useCallback(async()=>{
    setLd(true);
    try{
      const uSnap=await getDocs(collection(db,"usuarios"));
      setUsers(uSnap.docs.map(d=>({_fbId:d.id,...d.data()})));
      const eSnap=await getDocs(collection(db,"evaluaciones"));
      setEldi(eSnap.docs.map(d=>({_fbId:d.id,...d.data()})));
      const pSnap=await getDocs(collection(db,"peff_evaluaciones"));
      setPeff(pSnap.docs.map(d=>({_fbId:d.id,...d.data()})));
    }catch(e){nfy("Error cargando datos: "+e.message,"er")}
    setLd(false);
  },[nfy]);

  useEffect(()=>{load()},[load]);

  const allEvals=[...eldi.map(e=>({...e,tipo:"ELDI"})),...peff.map(e=>({...e,tipo:"PEFF"}))];
  const nonAdminUsers=users.filter(u=>u.role!=="admin");
  const totalUsers=nonAdminUsers.length;

  const neverPurchased=nonAdminUsers.filter(u=>{
    const userEvals=allEvals.filter(ev=>ev.userId===u._fbId).length;
    const totalEverHad=(u.creditos||0)+userEvals;
    return totalEverHad<=5;
  });

  const totalCreditsDeducted=allEvals.length;
  const totalCreditsPurchased=nonAdminUsers.reduce((sum,u)=>{
    const userEvals=allEvals.filter(ev=>ev.userId===u._fbId).length;
    const totalEverHad=(u.creditos||0)+userEvals;
    return sum+Math.max(0,totalEverHad-5);
  },0);
  const totalRevenue=totalCreditsPurchased*PRICE_PER_CREDIT;

  const getMonthEvals=(y,m)=>allEvals.filter(ev=>{
    if(!ev.fechaGuardado)return false;
    const d=new Date(ev.fechaGuardado);
    return d.getFullYear()===y&&d.getMonth()===m;
  });
  const getYearEvals=(y)=>allEvals.filter(ev=>{
    if(!ev.fechaGuardado)return false;
    return new Date(ev.fechaGuardado).getFullYear()===y;
  });

  const monthEvals=getMonthEvals(selYear,selMonth);
  const yearEvals=getYearEvals(selYear);
  const monthEldi=monthEvals.filter(e=>e.tipo==="ELDI").length;
  const monthPeff=monthEvals.filter(e=>e.tipo==="PEFF").length;
  const yearEldi=yearEvals.filter(e=>e.tipo==="ELDI").length;
  const yearPeff=yearEvals.filter(e=>e.tipo==="PEFF").length;

  const usersCreatedMonth=nonAdminUsers.filter(u=>{
    if(!u.createdAt)return false;
    const d=new Date(u.createdAt);
    return d.getFullYear()===selYear&&d.getMonth()===selMonth;
  });
  const usersCreatedYear=nonAdminUsers.filter(u=>{
    if(!u.createdAt)return false;
    return new Date(u.createdAt).getFullYear()===selYear;
  });

  const prevMonth=()=>{if(selMonth===0){setSelMonth(11);setSelYear(y=>y-1)}else setSelMonth(m=>m-1)};
  const nextMonth=()=>{if(selMonth===11){setSelMonth(0);setSelYear(y=>y+1)}else setSelMonth(m=>m+1)};

  const getUserDetail=(u)=>{
    const uEvals=allEvals.filter(ev=>ev.userId===u._fbId);
    const thisMonth=uEvals.filter(ev=>{const d=new Date(ev.fechaGuardado);return d.getFullYear()===selYear&&d.getMonth()===selMonth});
    const totalUsed=uEvals.length;
    const totalEverHad=(u.creditos||0)+totalUsed;
    const purchased=Math.max(0,totalEverHad-5);
    return{total:uEvals.length,thisMonth:thisMonth.length,eldi:uEvals.filter(e=>e.tipo==="ELDI").length,peff:uEvals.filter(e=>e.tipo==="PEFF").length,purchased,remaining:u.creditos||0,totalRevenue:purchased*PRICE_PER_CREDIT,evals:uEvals.sort((a,b)=>(b.fechaGuardado||"").localeCompare(a.fechaGuardado||""))};
  };

  const monthCreditsUsed=monthEvals.length;
  const monthNames=["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const monthlyData=monthNames.map((_,m)=>{
    const mEvals=getMonthEvals(selYear,m);
    return{m,count:mEvals.length,eldi:mEvals.filter(e=>e.tipo==="ELDI").length,peff:mEvals.filter(e=>e.tipo==="PEFF").length};
  });
  const maxMonthly=Math.max(1,...monthlyData.map(d=>d.count));

  const Stat=({icon,label,value,sub,color})=><div style={{background:"#fff",borderRadius:12,padding:"18px 20px",border:"1px solid #e2e8f0"}}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
      <span style={{fontSize:22}}>{icon}</span>
      <span style={{fontSize:12,color:K.mt,fontWeight:600}}>{label}</span>
    </div>
    <div style={{fontSize:28,fontWeight:700,color:color||"#1e293b"}}>{value}</div>
    {sub&&<div style={{fontSize:11,color:K.mt,marginTop:2}}>{sub}</div>}
  </div>;

  const TabBtn=({id,label,icon})=><button onClick={()=>{setTab(id);setSelUser(null)}} style={{padding:"10px 20px",background:tab===id?"#0d9488":"#fff",color:tab===id?"#fff":"#475569",border:tab===id?"none":"1px solid #e2e8f0",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>{icon} {label}</button>;

  if(ld)return<div style={{animation:"fi .3s ease",textAlign:"center",padding:60}}>
    <div style={{fontSize:36,marginBottom:12}}>{"\ud83d\udcca"}</div>
    <div style={{fontSize:16,fontWeight:600,color:K.mt}}>Cargando estad\u00edsticas...</div>
  </div>;

  return<div style={{animation:"fi .3s ease",width:"100%",maxWidth:1000}}>
    <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>{"\ud83d\udcca Estad\u00edsticas"}</h1>
    <p style={{color:K.mt,fontSize:14,marginBottom:20}}>Panel de an\u00e1lisis y m\u00e9tricas del sistema</p>

    <div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"}}>
      <TabBtn id="resumen" label="Resumen Global" icon={"\ud83c\udf10"}/>
      <TabBtn id="mensual" label="Mensual / Anual" icon={"\ud83d\udcc5"}/>
      <TabBtn id="usuarios" label="Por Usuario" icon={"\ud83d\udc65"}/>
    </div>

    {tab==="resumen"&&<div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14,marginBottom:24}}>
        <Stat icon={"\ud83d\udcb0"} label="Ingresos totales" value={fmt$(totalRevenue)} sub={`${totalCreditsPurchased} cr\u00e9ditos vendidos`} color="#059669"/>
        <Stat icon={"\ud83d\udcb3"} label="Cr\u00e9ditos utilizados" value={totalCreditsDeducted} sub="evaluaciones realizadas" color="#7c3aed"/>
        <Stat icon={"\ud83d\udc65"} label="Usuarios registrados" value={totalUsers} sub={`${neverPurchased.length} nunca compraron`} color="#0d9488"/>
        <Stat icon={"\u26a0\ufe0f"} label="Sin comprar" value={neverPurchased.length} sub="terminaron demo sin comprar" color="#f59e0b"/>
      </div>

      <div style={{background:"#fff",borderRadius:12,padding:24,border:"1px solid #e2e8f0",marginBottom:20}}>
        <div style={{fontSize:15,fontWeight:700,marginBottom:16}}>Evaluaciones por mes ({selYear})</div>
        <div style={{display:"flex",alignItems:"flex-end",gap:6,height:140,padding:"0 4px"}}>
          {monthlyData.map(d=><div key={d.m} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <div style={{fontSize:10,fontWeight:600,color:K.mt}}>{d.count||""}</div>
            <div style={{width:"100%",display:"flex",flexDirection:"column",gap:1}}>
              <div style={{background:"#0d9488",borderRadius:"3px 3px 0 0",height:maxMonthly>0?Math.max(2,d.eldi/maxMonthly*100):0,transition:"height .3s"}}/>
              <div style={{background:"#7c3aed",borderRadius:"0 0 3px 3px",height:maxMonthly>0?Math.max(0,d.peff/maxMonthly*100):0,transition:"height .3s"}}/>
            </div>
            <div style={{fontSize:9,color:K.mt}}>{monthNames[d.m]}</div>
          </div>)}
        </div>
        <div style={{display:"flex",gap:16,marginTop:12,justifyContent:"center",fontSize:11}}>
          <span style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,borderRadius:2,background:"#0d9488"}}/> ELDI</span>
          <span style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,borderRadius:2,background:"#7c3aed"}}/> PEFF</span>
        </div>
        <div style={{display:"flex",justifyContent:"center",gap:12,marginTop:12}}>
          <button onClick={()=>setSelYear(y=>y-1)} style={{background:"#f1f5f9",border:"none",borderRadius:6,padding:"6px 14px",fontSize:12,cursor:"pointer"}}>{"\u2190 "}{selYear-1}</button>
          <span style={{fontWeight:700,fontSize:14,padding:"6px 0"}}>{selYear}</span>
          <button onClick={()=>setSelYear(y=>y+1)} style={{background:"#f1f5f9",border:"none",borderRadius:6,padding:"6px 14px",fontSize:12,cursor:"pointer"}}>{selYear+1}{" \u2192"}</button>
        </div>
      </div>

      {neverPurchased.length>0&&<div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:12,padding:20,marginBottom:20}}>
        <div style={{fontSize:14,fontWeight:700,color:"#92400e",marginBottom:12}}>{"\u26a0 Usuarios que no compraron tras demo ("}{neverPurchased.length}{")"}</div>
        <div style={{maxHeight:200,overflowY:"auto"}}>
          {neverPurchased.map(u=><div key={u._fbId} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #fde68a",fontSize:13}}>
            <div>
              <span style={{fontWeight:600}}>{u.nombre} {u.apellido}</span>
              <span style={{color:K.mt,marginLeft:8}}>@{u.username}</span>
            </div>
            <div style={{fontSize:11,color:K.mt}}>
              {u.creditos||0} cr\u00e9d. {"\u00b7"} {u.createdAt?fmtDate(u.createdAt):""}
            </div>
          </div>)}
        </div>
      </div>}
    </div>}

    {tab==="mensual"&&<div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:16,marginBottom:24,background:"#fff",borderRadius:10,padding:"14px 20px",border:"1px solid #e2e8f0"}}>
        <button onClick={prevMonth} style={{background:"#f1f5f9",border:"none",borderRadius:6,padding:"8px 16px",fontSize:14,cursor:"pointer",fontWeight:600}}>{"\u2190"}</button>
        <div style={{textAlign:"center",minWidth:200}}>
          <div style={{fontSize:18,fontWeight:700,color:K.sd,textTransform:"capitalize"}}>{fmtMo(selYear,selMonth)}</div>
        </div>
        <button onClick={nextMonth} style={{background:"#f1f5f9",border:"none",borderRadius:6,padding:"8px 16px",fontSize:14,cursor:"pointer",fontWeight:600}}>{"\u2192"}</button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:14,marginBottom:20}}>
        <Stat icon={"\ud83d\udccb"} label="ELDI este mes" value={monthEldi} color="#0d9488"/>
        <Stat icon={"\ud83d\udd0a"} label="PEFF este mes" value={monthPeff} color="#7c3aed"/>
        <Stat icon={"\ud83d\udcb3"} label="Cr\u00e9ditos usados" value={monthCreditsUsed} sub="este mes" color="#ea580c"/>
        <Stat icon={"\ud83d\udc64"} label="Nuevos usuarios" value={usersCreatedMonth.length} sub="registros este mes"/>
      </div>

      <div style={{background:"linear-gradient(135deg,#0a3d2f,#0d9488)",borderRadius:14,padding:24,color:"#fff",marginBottom:20}}>
        <div style={{fontSize:14,opacity:.8,marginBottom:12}}>Resumen anual {selYear}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:16}}>
          <div><div style={{fontSize:32,fontWeight:700}}>{yearEvals.length}</div><div style={{fontSize:12,opacity:.7}}>evaluaciones totales</div></div>
          <div><div style={{fontSize:32,fontWeight:700}}>{yearEldi}</div><div style={{fontSize:12,opacity:.7}}>ELDI</div></div>
          <div><div style={{fontSize:32,fontWeight:700}}>{yearPeff}</div><div style={{fontSize:12,opacity:.7}}>PEFF</div></div>
          <div><div style={{fontSize:32,fontWeight:700}}>{usersCreatedYear.length}</div><div style={{fontSize:12,opacity:.7}}>nuevos usuarios</div></div>
        </div>
      </div>

      {monthEvals.length>0?<div style={{background:"#fff",borderRadius:12,padding:20,border:"1px solid #e2e8f0"}}>
        <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Evaluaciones del mes ({monthEvals.length})</div>
        <div style={{maxHeight:300,overflowY:"auto"}}>
          {monthEvals.sort((a,b)=>(b.fechaGuardado||"").localeCompare(a.fechaGuardado||"")).map((ev,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #f1f5f9",fontSize:13}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{background:ev.tipo==="ELDI"?"#ccfbf1":"#ede9fe",color:ev.tipo==="ELDI"?"#0d9488":"#7c3aed",padding:"3px 8px",borderRadius:4,fontSize:10,fontWeight:700}}>{ev.tipo}</span>
              <span style={{fontWeight:600}}>{ev.paciente}</span>
            </div>
            <div style={{fontSize:11,color:K.mt}}>{ev.evaluador||"?"} {"\u00b7"} {ev.fechaGuardado?fmtDate(ev.fechaGuardado):""}</div>
          </div>)}
        </div>
      </div>:<div style={{background:"#f8faf9",borderRadius:10,padding:20,textAlign:"center",color:K.mt,fontSize:14}}>Sin evaluaciones este mes</div>}
    </div>}

    {tab==="usuarios"&&<div>
      {!selUser?<div>
        <div style={{background:"#fff",borderRadius:12,padding:20,border:"1px solid #e2e8f0"}}>
          <div style={{fontSize:14,fontWeight:700,marginBottom:14}}>{"\ud83d\udc65 Todos los usuarios ("}{nonAdminUsers.length}{")"}</div>
          <div style={{maxHeight:500,overflowY:"auto"}}>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 80px",gap:8,padding:"8px 0",borderBottom:"2px solid #e2e8f0",fontSize:11,fontWeight:700,color:K.mt}}>
              <span>Usuario</span><span>Evals</span><span>Cr\u00e9d.</span><span>Comprados</span><span></span>
            </div>
            {nonAdminUsers.sort((a,b)=>{
              const aE=allEvals.filter(ev=>ev.userId===a._fbId).length;
              const bE=allEvals.filter(ev=>ev.userId===b._fbId).length;
              return bE-aE;
            }).map(u=>{
              const det=getUserDetail(u);
              return<div key={u._fbId} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr 1fr 80px",gap:8,padding:"12px 0",borderBottom:"1px solid #f1f5f9",alignItems:"center",fontSize:13}}>
                <div>
                  <div style={{fontWeight:600}}>{u.nombre} {u.apellido}</div>
                  <div style={{fontSize:11,color:K.mt}}>@{u.username} {"\u00b7"} {u.email}</div>
                </div>
                <div style={{fontWeight:700,color:det.total>0?"#0d9488":"#cbd5e1"}}>{det.total}</div>
                <div style={{fontWeight:700,color:det.remaining>0?"#059669":"#dc2626"}}>{det.remaining}</div>
                <div style={{fontWeight:600,color:det.purchased>0?"#7c3aed":"#cbd5e1"}}>{det.purchased}</div>
                <button onClick={()=>setSelUser(u)} style={{background:"#f1f5f9",border:"none",borderRadius:6,padding:"6px 12px",fontSize:11,cursor:"pointer",fontWeight:600}}>Ver {"\u2192"}</button>
              </div>
            })}
          </div>
        </div>
      </div>:<div>
        {(()=>{const det=getUserDetail(selUser);return<div>
          <button onClick={()=>setSelUser(null)} style={{background:"#f1f5f9",border:"none",borderRadius:8,padding:"8px 18px",fontSize:13,cursor:"pointer",fontWeight:600,marginBottom:16}}>{"\u2190 Volver a lista"}</button>

          <div style={{background:"linear-gradient(135deg,#0a3d2f,#0d9488)",borderRadius:14,padding:24,color:"#fff",marginBottom:20}}>
            <div style={{fontSize:20,fontWeight:700}}>{selUser.nombre} {selUser.apellido}</div>
            <div style={{fontSize:13,opacity:.7,marginTop:4}}>@{selUser.username} {"\u00b7"} {selUser.email} {"\u00b7"} DNI: {selUser.dni||"\u2014"}</div>
            <div style={{fontSize:11,opacity:.5,marginTop:4}}>Registrado: {selUser.createdAt?fmtDate(selUser.createdAt):"\u2014"}</div>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:14,marginBottom:20}}>
            <Stat icon={"\ud83d\udccb"} label="Total evaluaciones" value={det.total}/>
            <Stat icon={"\ud83d\udcc5"} label="Este mes" value={det.thisMonth}/>
            <Stat icon={"\ud83d\udcb3"} label="Cr\u00e9ditos restantes" value={det.remaining} color={det.remaining>0?"#059669":"#dc2626"}/>
            <Stat icon={"\ud83d\udecd\ufe0f"} label="Cr\u00e9ditos comprados" value={det.purchased} color="#7c3aed"/>
            <Stat icon={"\ud83d\udcb0"} label="Ingresos generados" value={fmt$(det.totalRevenue)} color="#059669"/>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
            <div style={{background:"#fff",borderRadius:10,padding:16,border:"1px solid #e2e8f0",textAlign:"center"}}>
              <div style={{fontSize:11,color:K.mt,marginBottom:4}}>ELDI realizadas</div>
              <div style={{fontSize:28,fontWeight:700,color:"#0d9488"}}>{det.eldi}</div>
            </div>
            <div style={{background:"#fff",borderRadius:10,padding:16,border:"1px solid #e2e8f0",textAlign:"center"}}>
              <div style={{fontSize:11,color:K.mt,marginBottom:4}}>PEFF realizadas</div>
              <div style={{fontSize:28,fontWeight:700,color:"#7c3aed"}}>{det.peff}</div>
            </div>
          </div>

          {det.evals.length>0&&<div style={{background:"#fff",borderRadius:12,padding:20,border:"1px solid #e2e8f0"}}>
            <div style={{fontSize:14,fontWeight:700,marginBottom:12}}>Historial de evaluaciones</div>
            <div style={{maxHeight:300,overflowY:"auto"}}>
              {det.evals.map((ev,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #f1f5f9",fontSize:13}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{background:ev.tipo==="ELDI"?"#ccfbf1":"#ede9fe",color:ev.tipo==="ELDI"?"#0d9488":"#7c3aed",padding:"3px 8px",borderRadius:4,fontSize:10,fontWeight:700}}>{ev.tipo}</span>
                  <span style={{fontWeight:600}}>{ev.paciente}</span>
                </div>
                <span style={{fontSize:11,color:K.mt}}>{ev.fechaGuardado?fmtDate(ev.fechaGuardado):""}</span>
              </div>)}
            </div>
          </div>}
        </div>})()}
      </div>}
    </div>}
  </div>;
}
