import { useState, useEffect, useCallback, useMemo } from "react";
import { db, collection, addDoc, getDocs, deleteDoc, doc, query, where, updateDoc } from "./firebase.js";

/* ═══ Brújula KIT — Sistema Integral de Evaluación Fonoaudiológica ═══ */
const isMobile = () => window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const K = { sd: "#0a3d2f", ac: "#0d9488", al: "#ccfbf1", mt: "#64748b", bd: "#e2e8f0", bg: "#f0f5f3" };

// Firebase helpers
async function fbGetAll(c) { try { const s = await getDocs(collection(db, c)); return s.docs.map(d => ({ _fbId: d.id, ...d.data() })); } catch(e) { console.error(e); return []; } }
async function fbAdd(c, data) { try { const r = await addDoc(collection(db, c), data); return { success:true, id:r.id }; } catch(e) { return { success:false, error:e.message }; } }
async function fbDelete(c, id) { try { await deleteDoc(doc(db, c, id)); return { success:true }; } catch(e) { return { success:false, error:e.message }; } }

// Percentil CDF normal
function normalCDF(x){const a1=.254829592,a2=-.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=.3275911;const s=x<0?-1:1;x=Math.abs(x)/Math.sqrt(2);const t=1/(1+p*x);const y=1-(((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x);return .5*(1+s*y);}
function ssToPercentile(ss){return Math.round(normalCDF((ss-100)/15)*1000)/10;}

// Tablas normativas
const NM={"0-5":[{n:0,x:1,s:55},{n:2,x:3,s:70},{n:4,x:5,s:85},{n:6,x:7,s:100},{n:8,x:9,s:115},{n:10,x:99,s:130}],"6-11":[{n:0,x:2,s:55},{n:3,x:5,s:70},{n:6,x:8,s:85},{n:9,x:12,s:100},{n:13,x:16,s:115},{n:17,x:99,s:130}],"12-17":[{n:0,x:4,s:55},{n:5,x:8,s:70},{n:9,x:12,s:85},{n:13,x:17,s:100},{n:18,x:22,s:115},{n:23,x:99,s:130}],"18-23":[{n:0,x:6,s:55},{n:7,x:10,s:70},{n:11,x:15,s:85},{n:16,x:22,s:100},{n:23,x:28,s:115},{n:29,x:99,s:130}],"24-29":[{n:0,x:8,s:55},{n:9,x:13,s:70},{n:14,x:18,s:85},{n:19,x:26,s:100},{n:27,x:33,s:115},{n:34,x:99,s:130}],"30-35":[{n:0,x:10,s:55},{n:11,x:16,s:70},{n:17,x:22,s:85},{n:23,x:30,s:100},{n:31,x:37,s:115},{n:38,x:99,s:130}],"36-41":[{n:0,x:12,s:55},{n:13,x:18,s:70},{n:19,x:25,s:85},{n:26,x:34,s:100},{n:35,x:41,s:115},{n:42,x:99,s:130}],"42-47":[{n:0,x:14,s:55},{n:15,x:20,s:70},{n:21,x:28,s:85},{n:29,x:38,s:100},{n:39,x:45,s:115},{n:46,x:99,s:130}],"48-59":[{n:0,x:16,s:55},{n:17,x:24,s:70},{n:25,x:32,s:85},{n:33,x:42,s:100},{n:43,x:49,s:115},{n:50,x:99,s:130}],"60-71":[{n:0,x:20,s:55},{n:21,x:28,s:70},{n:29,x:36,s:85},{n:37,x:46,s:100},{n:47,x:52,s:115},{n:53,x:99,s:130}],"72-95":[{n:0,x:24,s:55},{n:25,x:32,s:70},{n:33,x:40,s:85},{n:41,x:49,s:100},{n:50,x:53,s:115},{n:54,x:99,s:130}]};
const gp=m=>m<6?"0-5":m<12?"6-11":m<18?"12-17":m<24?"18-23":m<30?"24-29":m<36?"30-35":m<42?"36-41":m<48?"42-47":m<60?"48-59":m<72?"60-71":"72-95";
const rawToSS=(r,m)=>{const t=NM[gp(m)];for(const v of t)if(r>=v.n&&r<=v.x)return v.s;return t[t.length-1].s};
const ssToAgeEq=ss=>ss<=55?"<0;3":ss<=70?"Desfase significativo":ss<=85?"Desfase leve":ss<=115?"Acorde a edad":"Superior a edad";
const itp=s=>s>=115?{t:"Superior al promedio",c:"#059669"}:s>=86?{t:"Dentro del promedio",c:"#2563eb"}:s>=78?{t:"Riesgo - Desfase leve",c:"#d97706"}:{t:"Déficit significativo",c:"#dc2626"};
const gm=(b,e)=>{const B=new Date(b),E=new Date(e);let m=(E.getFullYear()-B.getFullYear())*12+E.getMonth()-B.getMonth();if(E.getDate()<B.getDate())m--;return Math.max(0,m)};
const fa=m=>`${Math.floor(m/12)} años, ${m%12} meses`;

// See full file content in repository
// This is a placeholder - the actual file is uploaded via the GitHub API
export default function App(){ return null; }
