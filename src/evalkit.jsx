import { useState, useEffect, useCallback, useMemo } from "react";
import { db, collection, addDoc, getDocs, deleteDoc, doc, query, where, updateDoc } from "./firebase.js";

/* ═══ Brújula KIT — Sistema Integral de Evaluación Fonoaudiológica ═══ */
const isMobile = () => window.innerWidth < 768 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const K = { sd: "#0a3d2f", ac: "#0d9488", al: "#ccfbf1", mt: "#64748b", bd: "#e2e8f0", bg: "#f0f5f3" };

// Firebase helpers
async function fbGetAll(c) { const s = await getDocs(collection(db, c)); return s.docs.map(d => ({ _fbId: d.id, ...d.data() })); }
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

// ── Ítems ELDI Receptivo con ejemplos ──
const REC=[
{id:"AC1",l:"Responde a sonidos del ambiente",a:"0;0–0;5",ej:"Se sobresalta o gira ante un portazo"},
{id:"AC2",l:"Busca fuente de sonido",a:"0;0–0;5",ej:"Mueve la cabeza hacia donde suena un sonajero"},
{id:"AC3",l:"Reacciona ante voz del cuidador",a:"0;0–0;5",ej:"Sonríe cuando mamá/papá le habla"},
{id:"AC4",l:"Se calma con voz familiar",a:"0;0–0;5",ej:"Deja de llorar al escuchar a su cuidador"},
{id:"AC5",l:"Diferencia voces conocidas",a:"0;0–0;5",ej:"Reacciona distinto ante voz de mamá vs extraño"},
{id:"AC6",l:"Responde a su nombre",a:"0;6–0;11",ej:"Gira la cabeza cuando dicen su nombre"},
{id:"AC7",l:"Reconoce nombres de familiares",a:"0;6–0;11",ej:"Mira a papá cuando preguntan ¿dónde está papá?"},
{id:"AC8",l:"Responde a 'no'",a:"0;6–0;11",ej:"Se detiene brevemente cuando le dicen no"},
{id:"AC9",l:"Entiende gestos simples",a:"0;6–0;11",ej:"Extiende brazos cuando le hacen gesto de ven"},
{id:"AC10",l:"Identifica objeto al nombrarlo",a:"0;6–0;11",ej:"Mira la mamadera cuando le dicen leche"},
{id:"AC11",l:"Sigue instrucciones de un paso",a:"1;0–1;5",ej:"Dame la pelota y la entrega"},
{id:"AC12",l:"Identifica 3 partes del cuerpo",a:"1;0–1;5",ej:"Señala ojos, nariz o boca al preguntar"},
{id:"AC13",l:"Señala objetos al nombrarlos",a:"1;0–1;5",ej:"Señala el perro en un libro"},
{id:"AC14",l:"Comprende ¿dónde?",a:"1;0–1;5",ej:"Busca con la mirada cuando preguntan ¿dónde está?"},
{id:"AC15",l:"Identifica imágenes comunes",a:"1;0–1;5",ej:"Señala auto, perro, bebé en lámina"},
{id:"AC16",l:"Sigue 2 pasos relacionados",a:"1;6–1;11",ej:"Agarra el vaso y ponlo en la mesa"},
{id:"AC17",l:"Identifica acciones en imágenes",a:"1;6–1;11",ej:"Señala al niño que está corriendo"},
{id:"AC18",l:"Comprende tamaño",a:"1;6–1;11",ej:"Entrega el objeto grande cuando se lo piden"},
{id:"AC19",l:"Comprende pronombres",a:"1;6–1;11",ej:"Entiende dámelo a mí vs dáselo a él"},
{id:"AC20",l:"Identifica por uso",a:"1;6–1;11",ej:"Señala la cuchara ante ¿con qué comemos?"},
{id:"AC21",l:"Comprende conceptos espaciales",a:"2;0–2;5",ej:"Pone el juguete arriba o adentro de la caja"},
{id:"AC22",l:"Identifica colores primarios",a:"2;0–2;5",ej:"Da el bloque rojo cuando se le pide"},
{id:"AC23",l:"Comprende plurales",a:"2;0–2;5",ej:"Distingue dame un bloque vs dame los bloques"},
{id:"AC24",l:"Sigue 2 pasos no relacionados",a:"2;0–2;5",ej:"Cierra la puerta y trae el libro"},
{id:"AC25",l:"Identifica por categoría",a:"2;0–2;5",ej:"Señala los animales entre varios objetos"},
{id:"AC26",l:"Comprende adjetivos",a:"2;6–2;11",ej:"Elige el vaso limpio vs el sucio"},
{id:"AC27",l:"Entiende negación",a:"2;6–2;11",ej:"Señala al niño que no está comiendo"},
{id:"AC28",l:"Comprende cantidad",a:"2;6–2;11",ej:"Da muchos vs pocos bloques"},
{id:"AC29",l:"Identifica género",a:"2;6–2;11",ej:"Señala al niño vs la niña correctamente"},
{id:"AC30",l:"Comprende ¿quién?",a:"2;6–2;11",ej:"Responde quién es el doctor en la imagen"},
{id:"AC31",l:"Conceptos temporales básicos",a:"3;0–3;5",ej:"Entiende primero come, después juega"},
{id:"AC32",l:"Sigue 3 instrucciones",a:"3;0–3;5",ej:"Levántate, cierra la puerta y siéntate"},
{id:"AC33",l:"Comprende comparaciones",a:"3;0–3;5",ej:"Señala cuál torre es más alta"},
{id:"AC34",l:"Funciones de objetos complejos",a:"3;0–3;5",ej:"Explica para qué sirve un termómetro"},
{id:"AC35",l:"Comprende ¿por qué?",a:"3;0–3;5",ej:"Responde ¿por qué usamos paraguas?"},
{id:"AC36",l:"Oraciones pasivas simples",a:"3;6–3;11",ej:"Entiende: el gato fue perseguido por el perro"},
{id:"AC37",l:"Identifica absurdos verbales",a:"3;6–3;11",ej:"Dice qué está mal en: nos ponemos zapatos en las manos"},
{id:"AC38",l:"Conceptos de posesión",a:"3;6–3;11",ej:"Señala el sombrero del señor"},
{id:"AC39",l:"Comprende ¿cuándo?",a:"3;6–3;11",ej:"Responde a ¿cuándo dormimos?"},
{id:"AC40",l:"Oraciones condicionales",a:"3;6–3;11",ej:"Entiende: si llueve, usamos paraguas"},
{id:"AC41",l:"Secuencia temporal",a:"4;0–4;11",ej:"Ordena 3 imágenes de una historia"},
{id:"AC42",l:"Instrucciones condicionales",a:"4;0–4;11",ej:"Si es rojo ponlo aquí, si es azul allá"},
{id:"AC43",l:"Analogías simples",a:"4;0–4;11",ej:"Completa: un pájaro vuela, un pez..."},
{id:"AC44",l:"Idea principal de historia",a:"4;0–4;11",ej:"Dice de qué se trató un cuento corto"},
{id:"AC45",l:"Relaciones causa-efecto",a:"4;0–4;11",ej:"Explica por qué el niño se mojó"},
{id:"AC46",l:"Vocabulario avanzado",a:"5;0–5;11",ej:"Entiende palabras como frágil o transparente"},
{id:"AC47",l:"Instrucciones complejas",a:"5;0–5;11",ej:"Antes de sentarte, guarda los lápices"},
{id:"AC48",l:"Lenguaje figurado simple",a:"5;0–5;11",ej:"Entiende está lloviendo a cántaros"},
{id:"AC49",l:"Hace inferencias",a:"5;0–5;11",ej:"Ve piso mojado e infiere que alguien derramó algo"},
{id:"AC50",l:"Cláusulas subordinadas",a:"5;0–5;11",ej:"Entiende: el niño que tiene gorro rojo está sentado"},
{id:"AC51",l:"Vocabulario abstracto",a:"6;0–7;11",ej:"Comprende libertad o justicia"},
{id:"AC52",l:"Doble sentido",a:"6;0–7;11",ej:"Entiende chistes con doble significado"},
{id:"AC53",l:"Inferencias predictivas",a:"6;0–7;11",ej:"Predice qué pasará después en una historia"},
{id:"AC54",l:"Gramática compleja",a:"6;0–7;11",ej:"Entiende oraciones con múltiples cláusulas"},
{id:"AC55",l:"Múltiples condiciones",a:"6;0–7;11",ej:"Si no llueve y no hace frío, iremos al parque"}
];
// ── Ítems ELDI Expresivo con ejemplos ──
const EXP=[
{id:"EC1",l:"Produce sonidos vocálicos",a:"0;0–0;5",ej:"Emite /a/, /e/, /o/ espontáneamente"},
{id:"EC2",l:"Balbuceo reduplicado",a:"0;0–0;5",ej:"Dice mamama, bababa repetidamente"},
{id:"EC3",l:"Vocaliza ante estimulación",a:"0;0–0;5",ej:"Hace sonidos cuando le hablan"},
{id:"EC4",l:"Ríe audiblemente",a:"0;0–0;5",ej:"Se ríe a carcajadas con cosquillas"},
{id:"EC5",l:"Sonidos consonánticos aislados",a:"0;0–0;5",ej:"Produce /m/, /b/, /p/ de forma aislada"},
{id:"EC6",l:"Balbuceo variado",a:"0;6–0;11",ej:"Combina distintas sílabas: badagu, matipa"},
{id:"EC7",l:"Usa gestos para comunicar",a:"0;6–0;11",ej:"Señala con el dedo lo que quiere"},
{id:"EC8",l:"Primera palabra reconocible",a:"0;6–0;11",ej:"Dice mamá o agua con intención"},
{id:"EC9",l:"Imita sonidos y palabras",a:"0;6–0;11",ej:"Repite guau después de escucharlo"},
{id:"EC10",l:"Jerga expresiva con entonación",a:"0;6–0;11",ej:"Habla con entonación como si conversara"},
{id:"EC11",l:"10+ palabras reconocibles",a:"1;0–1;5",ej:"Usa mamá, papá, agua, no, más..."},
{id:"EC12",l:"Nombra objetos espontáneamente",a:"1;0–1;5",ej:"Dice auto al ver un auto pasar"},
{id:"EC13",l:"Usa palabras para pedir",a:"1;0–1;5",ej:"Dice agua cuando quiere tomar"},
{id:"EC14",l:"Combina gesto + palabra",a:"1;0–1;5",ej:"Señala y dice más para pedir comida"},
{id:"EC15",l:"Imita palabras nuevas",a:"1;0–1;5",ej:"Repite zapato después de escucharlo"},
{id:"EC16",l:"Combinaciones de 2 palabras",a:"1;6–1;11",ej:"Dice mamá ven, más leche"},
{id:"EC17",l:"Vocabulario 50+ palabras",a:"1;6–1;11",ej:"Usa variedad de sustantivos y verbos"},
{id:"EC18",l:"Usa yo y mío",a:"1;6–1;11",ej:"Dice mío al reclamar un juguete"},
{id:"EC19",l:"Nombra acciones en imágenes",a:"1;6–1;11",ej:"Dice corriendo, comiendo al ver imagen"},
{id:"EC20",l:"Responde ¿qué?",a:"1;6–1;11",ej:"Ante ¿qué es esto? dice el nombre"},
{id:"EC21",l:"Frases de 3+ palabras",a:"2;0–2;5",ej:"Yo quiero leche, mamá está ahí"},
{id:"EC22",l:"Usa plurales regulares",a:"2;0–2;5",ej:"Dice gatos, pelotas correctamente"},
{id:"EC23",l:"Presente progresivo",a:"2;0–2;5",ej:"Dice está comiendo, está durmiendo"},
{id:"EC24",l:"Nombra colores primarios",a:"2;0–2;5",ej:"Dice rojo, azul, amarillo"},
{id:"EC25",l:"Responde ¿dónde?",a:"2;0–2;5",ej:"Ante ¿dónde está el perro? dice afuera"},
{id:"EC26",l:"Oraciones de 4-5 palabras",a:"2;6–2;11",ej:"El nene quiere más jugo"},
{id:"EC27",l:"Usa artículos correctamente",a:"2;6–2;11",ej:"Dice el perro, una casa"},
{id:"EC28",l:"Describe funciones",a:"2;6–2;11",ej:"Dice que la cuchara es para comer"},
{id:"EC29",l:"Preposiciones espaciales",a:"2;6–2;11",ej:"Usa arriba, adentro, al lado"},
{id:"EC30",l:"Narra eventos en secuencia",a:"2;6–2;11",ej:"Primero comí y después jugué"},
{id:"EC31",l:"Oraciones compuestas con y",a:"3;0–3;5",ej:"Fui al parque y jugué con mi amigo"},
{id:"EC32",l:"Tiempos verbales pasados",a:"3;0–3;5",ej:"Dice comí, jugué, fui correctamente"},
{id:"EC33",l:"Responde ¿por qué?",a:"3;0–3;5",ej:"Porque tenía hambre"},
{id:"EC34",l:"Define palabras por uso",a:"3;0–3;5",ej:"Un cuchillo es para cortar"},
{id:"EC35",l:"Relata historia con inicio/final",a:"3;0–3;5",ej:"Cuenta cuento con principio y fin"},
{id:"EC36",l:"Oraciones subordinadas",a:"3;6–3;11",ej:"Quiero el juguete que está en la mesa"},
{id:"EC37",l:"Pronombres posesivos",a:"3;6–3;11",ej:"Usa suyo, nuestro, tuyo correctamente"},
{id:"EC38",l:"Similitudes y diferencias",a:"3;6–3;11",ej:"Dice en qué se parecen gato y perro"},
{id:"EC39",l:"Verbos irregulares",a:"3;6–3;11",ej:"Dice puse en vez de ponió"},
{id:"EC40",l:"Mantiene tema conversacional",a:"3;6–3;11",ej:"Habla de un tema 3-4 turnos sin cambiar"},
{id:"EC41",l:"Cláusulas relativas",a:"4;0–4;11",ej:"El niño que tiene pelo largo es mi amigo"},
{id:"EC42",l:"Define con categoría/atributos",a:"4;0–4;11",ej:"Un perro es un animal que ladra"},
{id:"EC43",l:"Secuencia lógica completa",a:"4;0–4;11",ej:"Narra rutina con inicio, desarrollo y cierre"},
{id:"EC44",l:"Usa condicionales",a:"4;0–4;11",ej:"Si me porto bien, voy al parque"},
{id:"EC45",l:"Explica causa-efecto",a:"4;0–4;11",ej:"Se cayó porque el piso estaba mojado"},
{id:"EC46",l:"Vocabulario preciso",a:"5;0–5;11",ej:"Usa enorme en vez de grande"},
{id:"EC47",l:"Narrativas con detalles",a:"5;0–5;11",ej:"Cuenta película con personajes y problema"},
{id:"EC48",l:"Lenguaje para argumentar",a:"5;0–5;11",ej:"No quiero ir porque está lloviendo y..."},
{id:"EC49",l:"Corrige errores propios",a:"5;0–5;11",ej:"Se autocorrige: fuimos al... no, a la plaza"},
{id:"EC50",l:"Estructuras pasivas",a:"5;0–5;11",ej:"La torta fue hecha por mi mamá"},
{id:"EC51",l:"Define abstractas",a:"6;0–7;11",ej:"Explica qué significa felicidad"},
{id:"EC52",l:"Narrativas problema/resolución",a:"6;0–7;11",ej:"Cuenta historia con conflicto y solución"},
{id:"EC53",l:"Lenguaje metalingüístico",a:"6;0–7;11",ej:"Explica reglas del lenguaje"},
{id:"EC54",l:"Significados figurados",a:"6;0–7;11",ej:"Usa me muero de hambre como exageración"},
{id:"EC55",l:"Múltiples cláusulas",a:"6;0–7;11",ej:"Aunque llovía, salimos porque necesitábamos"}
];

// ── PEFF Estructura ──
const PEFF_SECTIONS=[
{id:"ec",title:"1. Examen Clínico — OFA",subsections:[
{id:"labios",title:"1.1 Labios",fields:[
{id:"lab_postura",label:"Postura habitual",type:"select",options:["Ocluidos","Entreabiertos","Abiertos","Con contacto labio-dentario"]},
{id:"lab_simetria",label:"Simetría",type:"select",options:["Simétricos","Asimétricos - Derecha","Asimétricos - Izquierda"]},
{id:"lab_tonicidad",label:"Tonicidad",type:"select",options:["Adecuada","Hipotónico","Hipertónico"]},
{id:"lab_frenillo",label:"Frenillo labial superior",type:"select",options:["Normal","Corto","Con inserción baja"]},
{id:"lab_obs",label:"Observaciones",type:"text"}]},
{id:"atm",title:"1.2 ATM / Mandíbula",fields:[
{id:"atm_postura",label:"Postura habitual",type:"select",options:["Elevada (oclusión)","Deprimida","Desviada derecha","Desviada izquierda"]},
{id:"atm_apertura",label:"Apertura máxima",type:"select",options:["Adecuada (≥35mm)","Reducida (<35mm)"]},
{id:"atm_chasquido",label:"Chasquido / crepitación",type:"select",options:["Ausente","Chasquido","Crepitación","Ambos"]},
{id:"atm_dolor",label:"Dolor a la palpación",type:"select",options:["No","Sí - Derecha","Sí - Izquierda","Sí - Bilateral"]},
{id:"atm_obs",label:"Observaciones",type:"text"}]},
{id:"lengua",title:"1.3 Lengua",fields:[
{id:"len_postura",label:"Postura habitual",type:"select",options:["En piso de boca","Interdental","En paladar","Lateralizada"]},
{id:"len_tamano",label:"Tamaño",type:"select",options:["Adecuado","Macroglosia","Microglosia"]},
{id:"len_apice",label:"Forma del ápice",type:"select",options:["Redondeado","En forma de corazón","Bífido"]},
{id:"len_frenillo",label:"Frenillo lingual",type:"select",options:["Normal","Corto","Anteriorizado","Anquiloglosia"]},
{id:"len_movilidad",label:"Movilidad general",type:"select",options:["Adecuada","Reducida","Muy reducida"]},
{id:"len_obs",label:"Observaciones",type:"text"}]},
{id:"dientes",title:"1.4 Dientes y Oclusión",fields:[
{id:"die_denticion",label:"Tipo de dentición",type:"select",options:["Temporal (decidua)","Mixta","Permanente"]},
{id:"die_ausencias",label:"Ausencias dentarias",type:"select",options:["No","Sí"]},
{id:"die_aus_detalle",label:"Detalle ausencias",type:"text"},
{id:"die_angle_der",label:"Angle - Derecha",type:"select",options:["Clase I","Clase II div.1","Clase II div.2","Clase III"]},
{id:"die_angle_izq",label:"Angle - Izquierda",type:"select",options:["Clase I","Clase II div.1","Clase II div.2","Clase III"]},
{id:"die_mordida",label:"Tipo de mordida",type:"select",options:["Normal","Mordida abierta anterior","Mordida cruzada","Sobremordida","Borde a borde"]},
{id:"die_obs",label:"Observaciones",type:"text"}]},
{id:"paladar",title:"1.5 Paladar Duro",fields:[
{id:"pal_altura",label:"Altura",type:"select",options:["Adecuada","Alto (profundo)","Ojival"]},
{id:"pal_integridad",label:"Integridad",type:"select",options:["Íntegro","Fisura - Preforamen","Fisura - Postforamen","Fisura - Transforamen"]},
{id:"pal_obs",label:"Observaciones",type:"text"}]},
{id:"velo",title:"1.6 Velo y Esfínter Velofaríngeo",fields:[
{id:"vel_simetria",label:"Simetría del velo",type:"select",options:["Simétrico","Asimétrico"]},
{id:"vel_movilidad",label:"Movilidad (al decir /a/)",type:"select",options:["Adecuada","Reducida","Ausente"]},
{id:"vel_uvula",label:"Úvula",type:"select",options:["Presente - Normal","Bífida","Ausente","Desviada"]},
{id:"vel_escape",label:"Escape nasal",type:"select",options:["Competencia (sin escape)","Incompetencia leve","Incompetencia evidente","Insuficiencia"]},
{id:"vel_obs",label:"Observaciones",type:"text"}]}
]},
{id:"cnm",title:"2. Coordinación Neuromotora",description:"Diadococinesis: repetir lo más rápido posible.",subsections:[
{id:"diadoco",title:"2.1 Diadococinesis",fields:[
{id:"diad_pa_vel",label:"Velocidad /pa-pa-pa/",type:"select",options:["Adecuada","Aumentada","Disminuida"]},
{id:"diad_pa_coord",label:"Coordinación /pa-pa-pa/",type:"select",options:["Adecuada","Inadecuada"]},
{id:"diad_ta_vel",label:"Velocidad /ta-ta-ta/",type:"select",options:["Adecuada","Aumentada","Disminuida"]},
{id:"diad_ta_coord",label:"Coordinación /ta-ta-ta/",type:"select",options:["Adecuada","Inadecuada"]},
{id:"diad_ka_vel",label:"Velocidad /ka-ka-ka/",type:"select",options:["Adecuada","Aumentada","Disminuida"]},
{id:"diad_ka_coord",label:"Coordinación /ka-ka-ka/",type:"select",options:["Adecuada","Inadecuada"]},
{id:"diad_pataka_vel",label:"Velocidad /pa-ta-ka/",type:"select",options:["Adecuada","Aumentada","Disminuida"]},
{id:"diad_pataka_coord",label:"Coordinación /pa-ta-ka/",type:"select",options:["Adecuada","Inadecuada"]},
{id:"diad_obs",label:"Observaciones",type:"text"}]}
]},
{id:"fon",title:"3. Evaluación Fonética",description:"Repetición de sílabas: ✓ Correcto, D Distorsión, O Omisión, S Sustitución",subsections:[
{id:"sil_2",title:"3.1 Fonemas a los 2 años",items:[
{id:"s_a",target:"/a/",word:"a"},{id:"s_e",target:"/e/",word:"e"},{id:"s_i",target:"/i/",word:"i"},{id:"s_o",target:"/o/",word:"o"},{id:"s_u",target:"/u/",word:"u"}]},
{id:"sil_3",title:"3.2 Fonemas a los 3 años",items:[
{id:"s_ma",target:"/m/",word:"ma"},{id:"s_na",target:"/n/",word:"na"},{id:"s_nya",target:"/ɲ/",word:"ña"},{id:"s_pa",target:"/p/",word:"pa"},{id:"s_ta",target:"/t/",word:"ta"},{id:"s_ka",target:"/k/",word:"ka"},{id:"s_fa",target:"/f/",word:"fa"},{id:"s_sa",target:"/s/",word:"sa"},{id:"s_xa",target:"/x/",word:"ja"},{id:"s_ya",target:"/ʝ/",word:"ya"},{id:"s_ba",target:"/b/",word:"ba"},{id:"s_cha",target:"/tʃ/",word:"cha"},{id:"s_da",target:"/d/",word:"da"},{id:"s_la",target:"/l/",word:"la"},{id:"s_ga",target:"/g/",word:"ga"},{id:"s_am",target:"/m/ coda",word:"am"},{id:"s_an",target:"/n/ coda",word:"an"},{id:"s_al",target:"/l/ coda",word:"al"},{id:"s_as",target:"/s/ coda",word:"as"}]},
{id:"sil_4",title:"3.3 Fonemas a los 4 años",items:[
{id:"s_ara",target:"/ɾ/ interv.",word:"ara"},{id:"s_ar",target:"/ɾ/ coda",word:"ar"},{id:"s_au",target:"dipt. /au/",word:"au"},{id:"s_pla",target:"/pl/",word:"pla"},{id:"s_bla",target:"/bl/",word:"bla"}]},
{id:"sil_5",title:"3.4 Fonemas a los 5 años",items:[
{id:"s_rra",target:"/r/ vibrante",word:"rra"},{id:"s_fla",target:"/fl/",word:"fla"},{id:"s_kla",target:"/kl/",word:"cla"},{id:"s_gla",target:"/gl/",word:"gla"},{id:"s_bra",target:"/br/",word:"bra"},{id:"s_pra",target:"/pr/",word:"pra"},{id:"s_fra",target:"/fr/",word:"fra"},{id:"s_kra",target:"/kr/",word:"cra"},{id:"s_gra",target:"/gr/",word:"gra"},{id:"s_dra",target:"/dr/",word:"dra"},{id:"s_tra",target:"/tr/",word:"tra"}]}
]},
{id:"disc",title:"3.5 Discriminación Fonológica",description:"¿Son iguales o diferentes?",subsections:[
{id:"disc_items",title:"Pares de palabras",discItems:[
{id:"d1",pair:"pala — pala",answer:"igual"},{id:"d2",pair:"calo — galo",answer:"diferente",contrast:"/k/-/g/"},{id:"d3",pair:"sapo — sapo",answer:"igual"},{id:"d4",pair:"sapo — chapo",answer:"diferente",contrast:"/s/-/tʃ/"},{id:"d5",pair:"foca — foca",answer:"igual"},{id:"d6",pair:"foca — poca",answer:"diferente",contrast:"/f/-/p/"},{id:"d7",pair:"saco — taco",answer:"diferente",contrast:"/s/-/t/"},{id:"d8",pair:"ala — ala",answer:"igual"},{id:"d9",pair:"ala — ara",answer:"diferente",contrast:"/l/-/ɾ/"},{id:"d10",pair:"rapa — lapa",answer:"diferente",contrast:"/ɾ/-/l/"},{id:"d11",pair:"mapa — mapa",answer:"igual"},{id:"d12",pair:"carro — cayo",answer:"diferente",contrast:"/r/-/ʝ/"},{id:"d13",pair:"luna — luna",answer:"igual"},{id:"d14",pair:"tuna — duna",answer:"diferente",contrast:"/t/-/d/"}]}
]},
{id:"recfon",title:"3.5b Reconocimiento Fonológico",description:"Señalar imagen correcta entre 5 opciones. 36 ítems en 12 contrastes.",subsections:[
{id:"rA",title:"A. Oclusivas vs Fricativas",recItems:[{id:"rA1",target:"puente/fuente",contrast:"/p/-/f/"},{id:"rA2",target:"piso/fijo",contrast:"/p/-/f/"},{id:"rA3",target:"taza/casa",contrast:"/t/-/k/"}]},
{id:"rB",title:"B. Oclusivas vs Nasales",recItems:[{id:"rB1",target:"bota/mota",contrast:"/b/-/m/"},{id:"rB2",target:"codo/cono",contrast:"/d/-/n/"},{id:"rB3",target:"pato/mato",contrast:"/p/-/m/"}]},
{id:"rC",title:"C. Oclusivas vs Líquidas",recItems:[{id:"rC1",target:"duna/luna",contrast:"/d/-/l/"},{id:"rC2",target:"pala/para",contrast:"/l/-/ɾ/"},{id:"rC3",target:"cola/cora",contrast:"/l/-/ɾ/"}]},
{id:"rD",title:"D. Sonoras vs Sordas",recItems:[{id:"rD1",target:"vaso/paso",contrast:"/b/-/p/"},{id:"rD2",target:"pato/gato",contrast:"/p/-/g/"},{id:"rD3",target:"tuna/duna",contrast:"/t/-/d/"}]},
{id:"rE",title:"E. Anteriores vs Posteriores",recItems:[{id:"rE1",target:"taza/casa",contrast:"/t/-/k/"},{id:"rE2",target:"toma/coma",contrast:"/t/-/k/"},{id:"rE3",target:"pera/quera",contrast:"/p/-/k/"}]},
{id:"rF",title:"F. Fricativas vs Nasales",recItems:[{id:"rF1",target:"foto/moto",contrast:"/f/-/m/"},{id:"rF2",target:"casa/cana",contrast:"/s/-/n/"},{id:"rF3",target:"sapo/napo",contrast:"/s/-/n/"}]},
{id:"rG",title:"G. Nasales vs Líquidas",recItems:[{id:"rG1",target:"nana/lana",contrast:"/n/-/l/"},{id:"rG2",target:"mono/morro",contrast:"/n/-/r/"},{id:"rG3",target:"cana/cara",contrast:"/n/-/ɾ/"}]},
{id:"rH",title:"H. Nasales Ant. vs Post.",recItems:[{id:"rH1",target:"mono/moño",contrast:"/n/-/ɲ/"},{id:"rH2",target:"cama/caña",contrast:"/m/-/ɲ/"},{id:"rH3",target:"lana/laña",contrast:"/n/-/ɲ/"}]},
{id:"rI",title:"I. Fricativas vs Líquidas",recItems:[{id:"rI1",target:"ola/hora",contrast:"/l/-/Ø/"},{id:"rI2",target:"sello/cero",contrast:"/s/-/ɾ/"},{id:"rI3",target:"pasa/para",contrast:"/s/-/ɾ/"}]},
{id:"rJ",title:"J. Africadas vs Fricativas",recItems:[{id:"rJ1",target:"ocho/oso",contrast:"/tʃ/-/s/"},{id:"rJ2",target:"hacha/asa",contrast:"/tʃ/-/s/"},{id:"rJ3",target:"choca/soca",contrast:"/tʃ/-/s/"}]},
{id:"rK",title:"K. Fricativas Ant. vs Post.",recItems:[{id:"rK1",target:"fuego/juego",contrast:"/f/-/x/"},{id:"rK2",target:"fiesta/siesta",contrast:"/f/-/s/"},{id:"rK3",target:"foca/joca",contrast:"/f/-/x/"}]},
{id:"rL",title:"L. Lateral vs Rótica",recItems:[{id:"rL1",target:"cero/cerro",contrast:"/ɾ/-/r/"},{id:"rL2",target:"rata/lata",contrast:"/r/-/l/"},{id:"rL3",target:"pollo/polo",contrast:"/ʎ/-/l/"}]}
]}
];

// ══════════════════════════════════════════════
// APP PRINCIPAL
// ══════════════════════════════════════════════
export default function App(){
  const[user,sU]=useState(null),[view,sV]=useState("dash"),[evals,sE]=useState([]),[peffEvals,sPE]=useState([]);
  const[sel,sS]=useState(null),[toast,sT]=useState(null),[loading,sL]=useState(false);
  const[mobile]=useState(isMobile());
  const nfy=useCallback((m,t)=>{sT({m,t});setTimeout(()=>sT(null),3500)},[]);

  const loadEvals=useCallback(async()=>{
    sL(true);
    try{
      const eldi=await fbGetAll("evaluaciones");
      sE(eldi.sort((a,b)=>(b.fechaGuardado||"").localeCompare(a.fechaGuardado||"")));
      const peff=await fbGetAll("peff_evaluaciones");
      sPE(peff.sort((a,b)=>(b.fechaGuardado||"").localeCompare(a.fechaGuardado||"")));
    }catch(e){console.error(e)}
    sL(false);
  },[]);

  useEffect(()=>{if(user)loadEvals()},[user,loadEvals]);

  const saveEval=async(ev)=>{
    const ssR=rawToSS(ev.rR,ev.a),ssE2=rawToSS(ev.rE,ev.a),ssT=Math.round((ssR+ssE2)/2);
    const newEv={id:Date.now()+"",paciente:ev.pN,fechaNacimiento:ev.birth,fechaEvaluacion:ev.eD,establecimiento:ev.sch,derivadoPor:ev.ref,edadMeses:ev.a,brutoReceptivo:ev.rR,brutoExpresivo:ev.rE,ssReceptivo:ssR,pcReceptivo:ssToPercentile(ssR),aeReceptivo:ssToAgeEq(ssR),ssExpresivo:ssE2,pcExpresivo:ssToPercentile(ssE2),aeExpresivo:ssToAgeEq(ssE2),ssTotal:ssT,pcTotal:ssToPercentile(ssT),interpretacion:itp(ssT).t,observaciones:ev.obs||"",evaluador:user?.un||"",fechaGuardado:new Date().toISOString(),respuestas:ev.rsp||{}};
    const res=await fbAdd("evaluaciones",newEv);
    if(res.success){nfy("Evaluación ELDI guardada","ok");await loadEvals()}else nfy("Error: "+res.error,"er");
    sV("dash");
  };

  const savePeff=async(data)=>{
    const res=await fbAdd("peff_evaluaciones",{id:Date.now()+"",evaluador:user?.un||"",fechaGuardado:new Date().toISOString(),...data});
    if(res.success){nfy("Evaluación PEFF guardada","ok");await loadEvals()}else nfy("Error: "+res.error,"er");
    sV("dash");
  };

  const deleteEval=async(fbId,colName="evaluaciones")=>{
    if(!user?.adm)return;
    const res=await fbDelete(colName,fbId);
    if(res.success){nfy("Eliminada","ok");await loadEvals()}else nfy("Error: "+res.error,"er");
    sS(null);sV("hist");
  };

  if(!user)return<Login onOk={u=>{sU(u);nfy("Bienvenido/a, "+u.un,"ok")}}/>;

  const nav=mobile?[["hist","⏱","Historial"]]:[["dash","⊞","Panel"],["tools","🧰","Herramientas"],["hist","⏱","Historial"]];
  if(user.adm&&!mobile)nav.push(["adm","⚙","Usuarios"]);

  return(
    <div style={{display:"flex",height:"100vh",width:"100vw",fontFamily:"'DM Sans',system-ui,sans-serif",background:K.bg,color:"#1e293b",overflow:"hidden"}}>
      <aside style={{width:mobile?60:230,minWidth:mobile?60:230,background:K.sd,color:"#fff",display:"flex",flexDirection:"column",padding:"18px 0",flexShrink:0,height:"100vh"}}>
        <div style={{padding:"0 14px",marginBottom:26,display:"flex",alignItems:"center",gap:9}}>
          <span style={{fontSize:28}}>🧭</span>
          {!mobile&&<div><div style={{fontSize:17,fontWeight:700}}>Brújula KIT</div><div style={{fontSize:9,color:"#5eead4",fontWeight:600,letterSpacing:"1px"}}>FONOAUDIOLOGÍA</div></div>}
        </div>
        <nav style={{flex:1}}>{nav.map(([id,ic,lb])=><button key={id} onClick={()=>{sV(id);sS(null)}} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:mobile?"13px 0":"11px 18px",background:view===id?"rgba(94,234,212,.12)":"transparent",border:"none",color:view===id?"#5eead4":"rgba(255,255,255,.6)",cursor:"pointer",fontSize:14,fontWeight:view===id?600:400,borderLeft:view===id?"3px solid #5eead4":"3px solid transparent",textAlign:"left",justifyContent:mobile?"center":"flex-start"}}><span>{ic}</span>{!mobile&&<span>{lb}</span>}</button>)}</nav>
        <div style={{padding:"0 14px",borderTop:"1px solid rgba(255,255,255,.1)",paddingTop:12}}>
          {!mobile&&<div style={{fontSize:10,color:"rgba(255,255,255,.45)",marginBottom:5}}>Sesión: <b style={{color:"#5eead4"}}>{user.un}</b>{user.adm&&<span style={{background:"#5eead4",color:K.sd,padding:"1px 5px",borderRadius:3,fontSize:8,marginLeft:6,fontWeight:700}}>ADMIN</span>}</div>}
          <button onClick={()=>{sU(null);sV("dash");sS(null)}} style={{background:"rgba(255,255,255,.08)",border:"none",color:"rgba(255,255,255,.6)",padding:"7px 12px",borderRadius:6,cursor:"pointer",fontSize:mobile?16:12,width:"100%"}}>{mobile?"↩":"↩ Cerrar sesión"}</button>
        </div>
      </aside>
      <main style={{flex:1,overflowY:"auto",overflowX:"hidden",padding:mobile?"16px":"28px 36px",height:"100vh"}}>
        {toast&&<div style={{position:"fixed",top:16,right:16,zIndex:999,background:toast.t==="ok"?"#059669":"#dc2626",color:"#fff",padding:"10px 18px",borderRadius:8,fontSize:13,fontWeight:500,boxShadow:"0 4px 16px rgba(0,0,0,.15)",animation:"fi .3s ease"}}>{toast.m}</div>}
        {mobile&&<div style={{background:"#fef3c7",padding:"12px 16px",borderRadius:8,border:"1px solid #fde68a",fontSize:13,color:"#92400e",marginBottom:16}}>📱 Modo móvil: solo lectura. Usa una computadora para evaluar.</div>}
        {view==="dash"&&!mobile&&<Dash es={evals} pe={peffEvals} onT={()=>sV("tools")} onV={e=>{sS(e);sV("rpt")}} onVP={e=>{sS(e);sV("rptP")}} ld={loading}/>}
        {view==="tools"&&!mobile&&<Tools onSel={t=>sV(t)}/>}
        {view==="newELDI"&&!mobile&&<NewELDI onS={saveEval} nfy={nfy}/>}
        {view==="newPEFF"&&!mobile&&<NewPEFF onS={savePeff} nfy={nfy}/>}
        {view==="hist"&&<Hist es={evals} pe={peffEvals} onV={e=>{sS(e);sV("rpt")}} onVP={e=>{sS(e);sV("rptP")}} isA={user.adm} onD={deleteEval}/>}
        {view==="rpt"&&sel&&<RptELDI ev={sel} isA={user.adm} onD={deleteEval}/>}
        {view==="rptP"&&sel&&<RptPEFF ev={sel} isA={user.adm} onD={deleteEval}/>}
        {view==="adm"&&user.adm&&!mobile&&<Admin nfy={nfy}/>}
      </main>
    </div>
  );
}

// ══ LOGIN ══
function Login({onOk}){
  const[u,su]=useState(""),[p,sp]=useState(""),[ld,sl]=useState(false),[e,se]=useState("");
  const go=async ev=>{ev.preventDefault();sl(true);se("");
    try{
      const users=await fbGetAll("usuarios");
      console.log("Firebase usuarios encontrados:", users.length, users.map(x=>x.usuario));
      const found=users.find(usr=>usr.usuario?.trim()===u.trim()&&usr.contrasena?.trim()===p.trim());
      if(found)onOk({un:u.trim(),adm:u.trim()==="CalaAdmin976"});
      else se("Usuario o contraseña incorrectos ("+users.length+" usuarios en BD)");
    }catch(err){
      console.error("Firebase login error:", err);
      se("Error Firebase: "+err.message);
    }
    sl(false);
  };
  const I={width:"100%",padding:"12px 14px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,background:"#f8faf9"};
  return(<div style={{width:"100vw",height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(145deg,#0a3d2f,#0d7363)",fontFamily:"'DM Sans',system-ui,sans-serif"}}>
    <div style={{background:"rgba(255,255,255,.97)",borderRadius:16,padding:"44px 36px",width:380,maxWidth:"90vw",boxShadow:"0 20px 50px rgba(0,0,0,.3)"}}>
      <div style={{textAlign:"center",marginBottom:28}}><div style={{display:"inline-flex",alignItems:"center",gap:9,marginBottom:8}}><span style={{fontSize:32}}>🧭</span><span style={{fontSize:26,fontWeight:700,color:"#0a3d2f"}}>Brújula KIT</span></div><p style={{color:"#64748b",fontSize:13}}>Sistema Integral de Evaluación Fonoaudiológica</p></div>
      <form onSubmit={go}>
        <div style={{marginBottom:14}}><label style={{fontSize:12,fontWeight:600,color:"#64748b",display:"block",marginBottom:5}}>Usuario</label><input value={u} onChange={e=>su(e.target.value)} style={I} placeholder="Ingrese su usuario" required/></div>
        <div style={{marginBottom:22}}><label style={{fontSize:12,fontWeight:600,color:"#64748b",display:"block",marginBottom:5}}>Contraseña</label><input type="password" value={p} onChange={e=>sp(e.target.value)} style={I} placeholder="Ingrese su contraseña" required/></div>
        {e&&<div style={{background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626",padding:"10px 12px",borderRadius:8,fontSize:12,marginBottom:14}}>{e}</div>}
        <button type="submit" disabled={ld} style={{width:"100%",padding:"13px",background:"#0d9488",color:"#fff",border:"none",borderRadius:8,fontSize:15,fontWeight:600,cursor:ld?"wait":"pointer",opacity:ld?.7:1}}>{ld?"Verificando...":"Iniciar sesión"}</button>
      </form>
      <p style={{textAlign:"center",marginTop:20,fontSize:10,color:"#94a3b8"}}>Brújula KIT v3.0</p>
    </div>
  </div>);
}

// ══ DASHBOARD ══
function Dash({es,pe,onT,onV,onVP,ld}){
  const all=[...es,...pe].sort((a,b)=>(b.fechaGuardado||"").localeCompare(a.fechaGuardado||""));
  const rc=all.slice(0,5);
  return(<div style={{animation:"fi .3s ease",width:"100%"}}>
    <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>🧭 Panel Principal</h1>
    <p style={{color:K.mt,fontSize:14,marginBottom:24}}>Resumen de actividad{ld?" — cargando...":""}</p>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:16,marginBottom:28}}>
      {[["📋","Eval. ELDI",es.length],["🔊","Eval. PEFF",pe.length],["👶","Pacientes",new Set([...es.map(e=>e.paciente),...pe.map(e=>e.paciente)]).size]].map(([ic,lb,v],i)=><div key={i} style={{background:"#fff",borderRadius:12,padding:22,border:"1px solid #e2e8f0"}}><div style={{fontSize:28,marginBottom:6}}>{ic}</div><div style={{fontSize:28,fontWeight:700}}>{v}</div><div style={{fontSize:13,color:K.mt,marginTop:2}}>{lb}</div></div>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      <button onClick={onT} style={{background:"linear-gradient(135deg,#0a3d2f,#0d9488)",color:"#fff",border:"none",borderRadius:14,padding:"28px 24px",cursor:"pointer",display:"flex",alignItems:"center",gap:16,textAlign:"left"}}>
        <div style={{width:52,height:52,borderRadius:12,background:"rgba(255,255,255,.14)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0}}>🧰</div>
        <div><div style={{fontSize:18,fontWeight:700}}>Panel de Herramientas</div><div style={{fontSize:13,opacity:.8,marginTop:4}}>Iniciar nueva evaluación</div></div>
      </button>
      <div style={{background:"#fff",borderRadius:14,padding:22,border:"1px solid #e2e8f0"}}>
        <h3 style={{fontSize:15,fontWeight:600,marginBottom:14}}>Recientes</h3>
        {rc.length===0?<p style={{color:K.mt,fontSize:13}}>No hay evaluaciones.</p>:rc.map(ev=>{const isP=!!ev.seccionData;return(
          <div key={ev._fbId||ev.id} onClick={()=>isP?onVP(ev):onV(ev)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #e2e8f0",cursor:"pointer"}}>
            <div><div style={{fontWeight:600,fontSize:14}}>{ev.paciente}</div><div style={{fontSize:11,color:K.mt}}>{isP?"🔊 PEFF":"📋 ELDI"} · {new Date(ev.fechaGuardado).toLocaleDateString("es-CL")}</div></div><span style={{color:K.mt}}>→</span>
          </div>)})}
      </div>
    </div>
  </div>);
}

// ══ PANEL DE HERRAMIENTAS ══
function Tools({onSel}){
  const tools=[
    {id:"newELDI",icon:"📋",name:"ELDI",full:"Evaluación del Lenguaje y Desarrollo Infantil",desc:"Evalúa comprensión auditiva (55 ítems) y comunicación expresiva (55 ítems) en niños de 0 a 7 años. Genera puntajes estándar, percentiles y edad equivalente.",age:"0 a 7;11 años",time:"~30-45 min",color:"#0d9488"},
    {id:"newPEFF",icon:"🔊",name:"PEFF",full:"Protocolo de Evaluación Fonética-Fonológica",desc:"Examen clínico de OFA (labios, ATM, lengua, dientes, paladar, velo), diadococinesis, repetición de sílabas, discriminación y reconocimiento fonológico.",age:"2;6 a 6;11 años",time:"~45-60 min",color:"#7c3aed"}
  ];
  return(<div style={{animation:"fi .3s ease",width:"100%"}}>
    <h1 style={{fontSize:22,fontWeight:700,marginBottom:6}}>🧰 Panel de Herramientas</h1>
    <p style={{color:K.mt,fontSize:14,marginBottom:24}}>Seleccione la herramienta de evaluación</p>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
      {tools.map(t=><div key={t.id} onClick={()=>onSel(t.id)} style={{background:"#fff",borderRadius:14,border:"1px solid #e2e8f0",overflow:"hidden",cursor:"pointer",transition:"box-shadow .2s"}} onMouseEnter={e=>e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,.1)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
        <div style={{background:`linear-gradient(135deg,${t.color},${t.color}aa)`,padding:"24px 24px 20px",color:"#fff"}}>
          <div style={{fontSize:36,marginBottom:8}}>{t.icon}</div><div style={{fontSize:22,fontWeight:700}}>{t.name}</div><div style={{fontSize:12,opacity:.85,marginTop:2}}>{t.full}</div>
        </div>
        <div style={{padding:"20px 24px"}}>
          <p style={{fontSize:13,color:"#475569",lineHeight:1.6,marginBottom:16}}>{t.desc}</p>
          <div style={{display:"flex",gap:16,fontSize:12,color:K.mt}}><span>👶 {t.age}</span><span>⏱ {t.time}</span></div>
          <button style={{marginTop:16,width:"100%",padding:"11px",background:t.color,color:"#fff",border:"none",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>Iniciar evaluación →</button>
        </div>
      </div>)}
    </div>
  </div>);
}

// ══ NUEVA EVALUACIÓN ELDI ══
function NewELDI({onS,nfy}){
  const[step,sS]=useState(1),[pd,sPd]=useState({pN:"",birth:"",eD:new Date().toISOString().split("T")[0],sch:"",ref:"",obs:""}),[rsp,sR]=useState({}),[showEx,setEx]=useState({});
  const a=pd.birth&&pd.eD?gm(pd.birth,pd.eD):0;
  const tog=id=>sR(p=>{const v=p[id];if(v===undefined)return{...p,[id]:true};if(v===true)return{...p,[id]:false};const n={...p};delete n[id];return n});
  const rR=Object.entries(rsp).filter(([k,v])=>k.startsWith("AC")&&v===true).length;
  const rE=Object.entries(rsp).filter(([k,v])=>k.startsWith("EC")&&v===true).length;
  const I={width:"100%",padding:"10px 14px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,background:"#f8faf9"};
  const Bt=({children,onClick,pr})=><button onClick={onClick} style={{background:pr?"#0d9488":"#f1f5f9",color:pr?"#fff":"#1e293b",border:"none",padding:"10px 22px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>{children}</button>;
  const RI=(items,prefix)=>{const gr={};items.forEach(i=>{if(!gr[i.a])gr[i.a]=[];gr[i.a].push(i)});
    return(<div><h2 style={{fontSize:18,fontWeight:700,marginBottom:4}}>{prefix==="AC"?"🔊 Comprensión Auditiva":"🗣️ Comunicación Expresiva"}</h2><p style={{color:K.mt,fontSize:13,marginBottom:16}}>1 click = ✔ OK · 2 clicks = ✘ No logrado · 3 clicks = Sin evaluar</p>
      {Object.entries(gr).map(([range,gi])=><div key={range} style={{marginBottom:18}}><div style={{background:"#ccfbf1",padding:"6px 12px",borderRadius:6,fontSize:12,fontWeight:600,color:"#0d9488",marginBottom:8}}>Edad: {range}</div>
        {gi.map(item=>{const v=rsp[item.id];const exO=showEx[item.id];return(<div key={item.id} style={{marginBottom:3}}>
          <div onClick={()=>tog(item.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:exO?"8px 8px 0 0":8,cursor:"pointer",background:v===true?"#ecfdf5":v===false?"#fef2f2":"#fff",border:`1px solid ${v===true?"#a7f3d0":v===false?"#fecaca":"#e2e8f0"}`,borderBottom:exO?"none":undefined}}>
            <div style={{width:28,height:28,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",background:v===true?"#059669":v===false?"#dc2626":"#e2e8f0",color:"#fff",fontSize:13,fontWeight:700,flexShrink:0}}>{v===true?"✓":v===false?"✗":"—"}</div>
            <span style={{fontWeight:600,fontSize:12,color:"#64748b",minWidth:36}}>{item.id}</span><span style={{fontSize:13,flex:1}}>{item.l}</span>
            <button onClick={e=>{e.stopPropagation();setEx(p=>({...p,[item.id]:!p[item.id]}))}} style={{background:"none",border:"1px solid #e2e8f0",borderRadius:4,padding:"2px 8px",fontSize:11,color:"#64748b",cursor:"pointer",flexShrink:0}}>{exO?"ocultar":"ver ejemplo"}</button>
          </div>
          {exO&&<div style={{background:"#f0fdf4",padding:"8px 14px 8px 52px",borderRadius:"0 0 8px 8px",border:"1px solid #e2e8f0",borderTop:"none",fontSize:12,color:"#16a34a",fontStyle:"italic"}}>💡 {item.ej}</div>}
        </div>)})}</div>)}</div>)};
  return(<div style={{width:"100%",maxWidth:800,animation:"fi .3s ease"}}>
    <div style={{display:"flex",gap:4,marginBottom:22}}>{["Paciente","Receptivo","Expresivo","Resultado"].map((s,i)=><div key={i} style={{flex:1,textAlign:"center"}}><div style={{height:4,borderRadius:2,marginBottom:5,background:step>i?"#0d9488":step===i+1?"#b2dfdb":"#e2e8f0"}}/><span style={{fontSize:11,color:step===i+1?"#0d9488":"#64748b",fontWeight:step===i+1?600:400}}>{s}</span></div>)}</div>
    <div style={{background:"#fff",borderRadius:12,padding:28,border:"1px solid #e2e8f0"}}>
      {step===1&&<div><h2 style={{fontSize:18,fontWeight:700,marginBottom:4}}>📋 ELDI — Datos del Paciente</h2><p style={{color:K.mt,fontSize:13,marginBottom:20}}>Evaluación del Lenguaje y Desarrollo Infantil</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}><div style={{gridColumn:"1/-1"}}><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Nombre completo</label><input value={pd.pN} onChange={e=>sPd(p=>({...p,pN:e.target.value}))} style={I} placeholder="Nombre y apellido"/></div><div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Fecha nacimiento</label><input type="date" value={pd.birth} onChange={e=>sPd(p=>({...p,birth:e.target.value}))} style={I}/></div><div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Fecha evaluación</label><input type="date" value={pd.eD} onChange={e=>sPd(p=>({...p,eD:e.target.value}))} style={I}/></div><div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Establecimiento</label><input value={pd.sch} onChange={e=>sPd(p=>({...p,sch:e.target.value}))} style={I} placeholder="Jardín / Colegio"/></div><div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Derivado por</label><input value={pd.ref} onChange={e=>sPd(p=>({...p,ref:e.target.value}))} style={I} placeholder="Profesional"/></div></div>
        {a>0&&<div style={{marginTop:14,padding:"10px 16px",background:"#ccfbf1",borderRadius:8,fontSize:14}}><strong>Edad:</strong> {fa(a)} ({a} meses)</div>}
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:20}}><Bt pr onClick={()=>{if(!pd.pN||!pd.birth){nfy("Complete nombre y fecha","er");return}sS(2)}}>Siguiente →</Bt></div></div>}
      {step===2&&<div>{RI(REC,"AC")}<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14,paddingTop:14,borderTop:"1px solid #e2e8f0"}}><span style={{fontSize:13,color:K.mt}}>Logrados: <b style={{color:"#0d9488"}}>{rR}</b>/55</span><div style={{display:"flex",gap:8}}><Bt onClick={()=>sS(1)}>← Atrás</Bt><Bt pr onClick={()=>sS(3)}>Siguiente →</Bt></div></div></div>}
      {step===3&&<div>{RI(EXP,"EC")}<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:14,paddingTop:14,borderTop:"1px solid #e2e8f0"}}><span style={{fontSize:13,color:K.mt}}>Logrados: <b style={{color:"#0d9488"}}>{rE}</b>/55</span><div style={{display:"flex",gap:8}}><Bt onClick={()=>sS(2)}>← Atrás</Bt><Bt pr onClick={()=>sS(4)}>Resultados →</Bt></div></div></div>}
      {step===4&&(()=>{const ssR=rawToSS(rR,a),ssE2=rawToSS(rE,a),ssT=Math.round((ssR+ssE2)/2),pcR=ssToPercentile(ssR),pcE=ssToPercentile(ssE2),pcT=ssToPercentile(ssT);
        return<div><h2 style={{fontSize:20,fontWeight:700,marginBottom:20}}>Resultados ELDI — {pd.pN}</h2>
          {[["🔊 Comprensión Auditiva",rR,ssR,pcR],["🗣️ Com. Expresiva",rE,ssE2,pcE]].map(([lb,raw,ss,pc],i)=>{const ip=itp(ss);return<div key={i} style={{background:"#f8faf9",borderRadius:10,padding:20,border:"1px solid #e2e8f0",marginBottom:12}}><div style={{fontWeight:700,fontSize:15,marginBottom:12}}>{lb}</div><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>{[["Bruto",`${raw}/55`],["Estándar",ss],["Percentil",`${pc}%`],["Nivel",ssToAgeEq(ss)]].map(([l,v],j)=><div key={j}><div style={{fontSize:11,color:K.mt,marginBottom:2}}>{l}</div><div style={{fontSize:20,fontWeight:700}}>{v}</div></div>)}</div><div style={{marginTop:10,display:"inline-flex",alignItems:"center",gap:6,padding:"4px 12px",borderRadius:16,background:ip.c+"15",color:ip.c,fontSize:13,fontWeight:600}}><span style={{width:8,height:8,borderRadius:"50%",background:ip.c}}/>{ip.t}</div></div>})}
          <div style={{background:"linear-gradient(135deg,#0a3d2f,#0d9488)",borderRadius:10,padding:24,color:"#fff",marginBottom:24}}><div style={{fontSize:13,opacity:.8,marginBottom:8}}>Puntaje Total</div><div style={{display:"flex",alignItems:"baseline",gap:14}}><span style={{fontSize:44,fontWeight:700}}>{ssT}</span><span style={{fontSize:15,opacity:.8}}>Percentil: {pcT}%</span></div><div style={{marginTop:8,display:"inline-flex",padding:"5px 14px",borderRadius:16,background:"rgba(255,255,255,.18)",fontSize:14,fontWeight:600}}>● {itp(ssT).t}</div></div>
          <div style={{marginBottom:20}}><label style={{fontSize:13,fontWeight:600,color:K.mt,display:"block",marginBottom:6}}>Observaciones</label><textarea value={pd.obs} onChange={e=>sPd(p=>({...p,obs:e.target.value}))} rows={4} style={{width:"100%",padding:"12px 14px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,resize:"vertical",background:"#f8faf9"}} placeholder="Observaciones clínicas..."/></div>
          <div style={{display:"flex",justifyContent:"space-between"}}><Bt onClick={()=>sS(3)}>← Atrás</Bt><button onClick={()=>onS({...pd,a,rsp,rR,rE})} style={{background:"#0d9488",color:"#fff",border:"none",padding:"12px 28px",borderRadius:8,fontSize:15,fontWeight:700,cursor:"pointer"}}>💾 Guardar</button></div>
        </div>})()}
    </div>
  </div>);
}

// ══ NUEVA EVALUACIÓN PEFF ══
function NewPEFF({onS,nfy}){
  const[step,sS2]=useState(0),[pd,sPd]=useState({pN:"",birth:"",eD:new Date().toISOString().split("T")[0],sch:"",ref:"",obs:""}),[data,setD]=useState({});
  const a=pd.birth&&pd.eD?gm(pd.birth,pd.eD):0;
  const I={width:"100%",padding:"10px 14px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,background:"#f8faf9"};
  const sf=(id,v)=>setD(p=>({...p,[id]:v}));

  const rField=f=>f.type==="select"?(<div key={f.id} style={{marginBottom:10}}><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>{f.label}</label><select value={data[f.id]||""} onChange={e=>sf(f.id,e.target.value)} style={{...I,cursor:"pointer"}}><option value="">— Seleccionar —</option>{f.options.map(o=><option key={o} value={o}>{o}</option>)}</select></div>):(<div key={f.id} style={{marginBottom:10}}><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>{f.label}</label><input value={data[f.id]||""} onChange={e=>sf(f.id,e.target.value)} style={I} placeholder="Escriba aquí..."/></div>);

  const rPhon=item=>{const v=data[item.id]||"";const opts=[{v:"ok",l:"✓",bg:"#059669"},{v:"D",l:"D",bg:"#f59e0b"},{v:"O",l:"O",bg:"#dc2626"},{v:"S",l:"S",bg:"#7c3aed"}];
    return(<div key={item.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",background:"#fff",borderRadius:8,border:"1px solid #e2e8f0",marginBottom:4}}>
      <span style={{fontWeight:700,fontSize:16,minWidth:50,color:"#7c3aed"}}>{item.word}</span><span style={{fontSize:12,color:K.mt,flex:1}}>{item.target}</span>
      <div style={{display:"flex",gap:4}}>{opts.map(o=><button key={o.v} onClick={()=>sf(item.id,v===o.v?"":o.v)} style={{width:30,height:30,borderRadius:6,border:v===o.v?`2px solid ${o.bg}`:"1px solid #e2e8f0",background:v===o.v?o.bg:"#fff",color:v===o.v?"#fff":"#64748b",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{o.l}</button>)}</div>
    </div>)};

  const rDisc=item=>{const v=data[item.id]||"";
    return(<div key={item.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"#fff",borderRadius:8,border:"1px solid #e2e8f0",marginBottom:4}}>
      <span style={{fontWeight:600,fontSize:14,flex:1}}>{item.pair}</span>{item.contrast&&<span style={{fontSize:11,color:K.mt}}>{item.contrast}</span>}
      <div style={{display:"flex",gap:4}}>{["correcto","incorrecto"].map(o=><button key={o} onClick={()=>sf(item.id,v===o?"":o)} style={{padding:"5px 10px",borderRadius:6,border:v===o?`2px solid ${o==="correcto"?"#059669":"#dc2626"}`:"1px solid #e2e8f0",background:v===o?(o==="correcto"?"#059669":"#dc2626"):"#fff",color:v===o?"#fff":"#64748b",fontSize:12,fontWeight:600,cursor:"pointer"}}>{o==="correcto"?"✓":"✗"}</button>)}</div>
    </div>)};

  const rRec=item=>{const v=data[item.id]||"";
    return(<div key={item.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"#fff",borderRadius:8,border:"1px solid #e2e8f0",marginBottom:4}}>
      <span style={{fontWeight:600,fontSize:14,flex:1}}>{item.target}</span><span style={{fontSize:11,color:K.mt}}>{item.contrast}</span>
      <div style={{display:"flex",gap:4}}>{["reconoce","no"].map(o=><button key={o} onClick={()=>sf(item.id,v===o?"":o)} style={{padding:"5px 10px",borderRadius:6,border:v===o?`2px solid ${o==="reconoce"?"#059669":"#dc2626"}`:"1px solid #e2e8f0",background:v===o?(o==="reconoce"?"#059669":"#dc2626"):"#fff",color:v===o?"#fff":"#64748b",fontSize:12,fontWeight:600,cursor:"pointer"}}>{o==="reconoce"?"✓":"✗"}</button>)}</div>
    </div>)};

  const rSec=sec=>(<div><h2 style={{fontSize:18,fontWeight:700,marginBottom:4,color:"#7c3aed"}}>{sec.title}</h2>{sec.description&&<p style={{color:K.mt,fontSize:13,marginBottom:16}}>{sec.description}</p>}{sec.subsections.map(sub=><div key={sub.id} style={{marginBottom:20}}><h3 style={{fontSize:15,fontWeight:600,marginBottom:10,color:"#0a3d2f",paddingBottom:6,borderBottom:"2px solid #ede9fe"}}>{sub.title}</h3>{sub.fields&&sub.fields.map(f=>rField(f))}{sub.items&&sub.items.map(i=>rPhon(i))}{sub.discItems&&sub.discItems.map(i=>rDisc(i))}{sub.recItems&&sub.recItems.map(i=>rRec(i))}</div>)}</div>);

  const calc=()=>{
    const sI=PEFF_SECTIONS.find(s=>s.id==="fon")?.subsections.flatMap(sub=>sub.items||[])||[];
    const sOk=sI.filter(i=>data[i.id]==="ok").length,sPct=sI.length?Math.round(sOk/sI.length*100):0;
    const dI=PEFF_SECTIONS.find(s=>s.id==="disc")?.subsections.flatMap(sub=>sub.discItems||[])||[];
    const dOk=dI.filter(i=>data[i.id]==="correcto").length;
    const rI=PEFF_SECTIONS.find(s=>s.id==="recfon")?.subsections.flatMap(sub=>sub.recItems||[])||[];
    const rOk=rI.filter(i=>data[i.id]==="reconoce").length;
    let sev="Adecuado";if(sPct<50)sev="Severo";else if(sPct<65)sev="Moderado-Severo";else if(sPct<85)sev="Moderado";else if(sPct<98)sev="Leve";
    return{silOk:sOk,silTotal:sI.length,silPct:sPct,discOk:dOk,discTotal:dI.length,recOk:rOk,recTotal:rI.length,severity:sev};
  };

  return(<div style={{width:"100%",maxWidth:800,animation:"fi .3s ease"}}>
    <div style={{display:"flex",gap:2,marginBottom:22}}>{["Datos",...PEFF_SECTIONS.map((_,i)=>`${i+1}`),"Result"].map((s,i)=><div key={i} style={{flex:1,textAlign:"center"}}><div style={{height:4,borderRadius:2,marginBottom:4,background:step>i?"#7c3aed":step===i?"#c4b5fd":"#e2e8f0"}}/><span style={{fontSize:9,color:step===i?"#7c3aed":"#64748b"}}>{s}</span></div>)}</div>
    <div style={{background:"#fff",borderRadius:12,padding:28,border:"1px solid #e2e8f0"}}>
      {step===0&&<div><h2 style={{fontSize:18,fontWeight:700,marginBottom:4,color:"#7c3aed"}}>🔊 PEFF — Datos del Paciente</h2>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginTop:16}}><div style={{gridColumn:"1/-1"}}><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Nombre</label><input value={pd.pN} onChange={e=>sPd(p=>({...p,pN:e.target.value}))} style={I} placeholder="Nombre y apellido"/></div><div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Fecha nacimiento</label><input type="date" value={pd.birth} onChange={e=>sPd(p=>({...p,birth:e.target.value}))} style={I}/></div><div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Fecha evaluación</label><input type="date" value={pd.eD} onChange={e=>sPd(p=>({...p,eD:e.target.value}))} style={I}/></div><div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Establecimiento</label><input value={pd.sch} onChange={e=>sPd(p=>({...p,sch:e.target.value}))} style={I}/></div><div><label style={{fontSize:12,fontWeight:600,color:K.mt,display:"block",marginBottom:4}}>Derivado por</label><input value={pd.ref} onChange={e=>sPd(p=>({...p,ref:e.target.value}))} style={I}/></div></div>
        {a>0&&<div style={{marginTop:14,padding:"10px 16px",background:"#ede9fe",borderRadius:8,fontSize:14}}><strong>Edad:</strong> {fa(a)}</div>}
        <div style={{display:"flex",justifyContent:"flex-end",marginTop:20}}><button onClick={()=>{if(!pd.pN||!pd.birth){nfy("Complete datos","er");return}sS2(1)}} style={{background:"#7c3aed",color:"#fff",border:"none",padding:"10px 22px",borderRadius:8,fontSize:14,fontWeight:600,cursor:"pointer"}}>Siguiente →</button></div></div>}
      {step>=1&&step<=PEFF_SECTIONS.length&&rSec(PEFF_SECTIONS[step-1])}
      {step===PEFF_SECTIONS.length+1&&(()=>{const r=calc();return<div><h2 style={{fontSize:20,fontWeight:700,marginBottom:20,color:"#7c3aed"}}>Resultados PEFF — {pd.pN}</h2>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:20}}>{[["Sílabas",`${r.silOk}/${r.silTotal}`,`${r.silPct}%`],["Discriminación",`${r.discOk}/${r.discTotal}`,""],["Reconocimiento",`${r.recOk}/${r.recTotal}`,""]].map(([l,v,v2],i)=><div key={i} style={{background:"#f8faf9",borderRadius:10,padding:20,border:"1px solid #e2e8f0",textAlign:"center"}}><div style={{fontSize:11,color:K.mt,marginBottom:4}}>{l}</div><div style={{fontSize:32,fontWeight:700,color:"#7c3aed"}}>{v}</div>{v2&&<div style={{fontSize:14,color:K.mt}}>{v2}</div>}</div>)}</div>
        <div style={{background:"linear-gradient(135deg,#5b21b6,#7c3aed)",borderRadius:10,padding:24,color:"#fff",marginBottom:24}}><div style={{fontSize:13,opacity:.8,marginBottom:8}}>Severidad Fonética</div><div style={{fontSize:36,fontWeight:700}}>{r.severity}</div></div>
        <div style={{marginBottom:20}}><label style={{fontSize:13,fontWeight:600,color:K.mt,display:"block",marginBottom:6}}>Observaciones</label><textarea value={pd.obs} onChange={e=>sPd(p=>({...p,obs:e.target.value}))} rows={4} style={{width:"100%",padding:"12px 14px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,resize:"vertical",background:"#f8faf9"}}/></div>
        <div style={{display:"flex",justifyContent:"space-between"}}><button onClick={()=>sS2(step-1)} style={{background:"#f1f5f9",border:"none