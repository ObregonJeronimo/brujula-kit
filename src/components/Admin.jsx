import { useState, useEffect } from "react";
import { db, collection, addDoc, getDocs, deleteDoc, doc } from "../firebase.js";
const K = { mt: "#64748b" };
async function fbGetAll(c) { const s = await getDocs(collection(db, c)); return s.docs.map(d => ({ _fbId: d.id, ...d.data() })); }
async function fbAdd(c, data) { try { const r = await addDoc(collection(db, c), data); return { success:true, id:r.id }; } catch(e) { return { success:false, error:e.message }; } }
async function fbDelete(c, id) { try { await deleteDoc(doc(db, c, id)); return { success:true }; } catch(e) { return { success:false, error:e.message }; } }

export default function Admin({nfy}){
  const[us,sUs]=useState([]),[ld,sLd]=useState(true),[nu,sNu]=useState(""),[np,sNp]=useState(""),[busy,sBusy]=useState(false);
  const load=async()=>{sLd(true);try{const users=await fbGetAll("usuarios");sUs(users)}catch{nfy("Error cargando","er")}sLd(false)};
  useEffect(()=>{load()},[]);
  const add=async()=>{
    if(!nu||!np){nfy("Complete ambos campos","er");return}
    if(us.some(u=>u.usuario===nu)){nfy("Usuario ya existe","er");return}
    sBusy(true);
    const res=await fbAdd("usuarios",{usuario:nu,contrasena:np});
    if(res.success){nfy(`\"${nu}\" agregado`,"ok");sNu("");sNp("");await load()}else nfy(res.error,"er");
    sBusy(false);
  };
  const del=async(u)=>{
    if(u.usuario==="CalaAdmin976"){nfy("No se puede eliminar admin","er");return}
    sBusy(true);
    const res=await fbDelete("usuarios",u._fbId);
    if(res.success){nfy(`\"${u.usuario}\" eliminado`,"ok");await load()}else nfy(res.error,"er");
    sBusy(false);
  };
  return(<div style={{width:"100%",maxWidth:700,animation:"fi .3s ease"}}>
    <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>Administrar Usuarios</h1>
    <p style={{color:K.mt,fontSize:14,marginBottom:22}}>Gestión de accesos — Firebase Firestore</p>
    <div style={{background:"#fff",borderRadius:12,padding:22,border:"1px solid #e2e8f0",marginBottom:16}}>
      <h3 style={{fontSize:15,fontWeight:600,marginBottom:14}}>Agregar usuario</h3>
      <div style={{display:"flex",gap:10,alignItems:"flex-end",flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:160}}><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Usuario</label><input value={nu} onChange={e=>sNu(e.target.value)} style={{width:"100%",padding:"10px 14px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14}} placeholder="Nombre de usuario"/></div>
        <div style={{flex:1,minWidth:160}}><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Contraseña</label><input value={np} onChange={e=>sNp(e.target.value)} type="password" style={{width:"100%",padding:"10px 14px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14}} placeholder="Contraseña"/></div>
        <button onClick={add} disabled={busy} style={{background:"#0d9488",color:"#fff",border:"none",padding:"10px 20px",borderRadius:8,fontSize:14,fontWeight:600,cursor:busy?"wait":"pointer",opacity:busy?.7:1}}>＋ Agregar</button>
      </div>
    </div>
    <div style={{background:"#fff",borderRadius:12,padding:22,border:"1px solid #e2e8f0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><h3 style={{fontSize:15,fontWeight:600}}>Usuarios ({us.length})</h3><button onClick={load} style={{background:"#f1f5f9",border:"none",padding:"6px 12px",borderRadius:6,fontSize:12,cursor:"pointer"}}>🔄</button></div>
      {ld?<p style={{color:K.mt}}>Cargando...</p>:us.map(u=><div key={u._fbId} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #e2e8f0"}}>
        <div><span style={{fontWeight:600,fontSize:14}}>{u.usuario}</span>{u.usuario==="CalaAdmin976"&&<span style={{fontSize:10,background:"#ccfbf1",color:"#0d9488",padding:"2px 6px",borderRadius:4,marginLeft:8,fontWeight:700}}>ADMIN</span>}</div>
        {u.usuario!=="CalaAdmin976"&&<button onClick={()=>del(u)} disabled={busy} style={{background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca",padding:"6px 12px",borderRadius:6,cursor:"pointer",fontSize:12}}>🗑</button>}
      </div>)}
    </div>
  </div>);
}
