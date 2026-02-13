// Repetición de Palabras — Análisis fonético-fonológico (PEFF 3.2)
// Basado en: Susanibar F; Dioses A; Huamaní O. (2014)
// Posiciones: ISPP=Inicio Sílaba en Posición de Palabra,
//             ISIP=Inicio Sílaba en Interior de Palabra,
//             CSIP=Coda Silaba en Interior de Palabra,
//             CSFP=Coda Sílaba en Final de Palabra

export var REP_CATEGORIES = [
  { id:"ocl_sordas", title:"Oclusivas sordas", items:[
    { id:"p", phoneme:"/p/", age:3, words:{ISPP:["pala","paloma"],ISIP:["mapa","mapache"],CSIP:[],CSFP:[]} },
    { id:"t", phoneme:"/t/", age:3, words:{ISPP:["toma","t\u00fanica"],ISIP:["lata","p\u00e9talo"],CSIP:[],CSFP:[]} },
    { id:"k", phoneme:"/k/", age:3, words:{ISPP:["copa","camino"],ISIP:["boca","vacuna"],CSIP:[],CSFP:[]} }
  ]},
  { id:"ocl_sonoras", title:"Oclusivas sonoras", items:[
    { id:"b", phoneme:"/b/", age:3, words:{ISPP:["bote","banana"],ISIP:["Cuba","cabina"],CSIP:[],CSFP:[]} },
    { id:"g", phoneme:"/g/", age:3, words:{ISPP:["gota","galope"],ISIP:["pego","bigote"],CSIP:[],CSFP:[]} },
    { id:"d", phoneme:"/d/", age:3, words:{ISPP:["dame","dibujo"],ISIP:["codo","bodega"],CSIP:[],CSFP:[]} }
  ]},
  { id:"nasales", title:"Nasales", items:[
    { id:"m", phoneme:"/m/", age:3, words:{ISPP:["mapa","muleta"],ISIP:["pomo","camote"],CSIP:["campo","cambio"],CSFP:[]} },
    { id:"n", phoneme:"/n/", age:3, words:{ISPP:["noche","nativo"],ISIP:["vino","canela"],CSIP:["cansa","vende","envase","pinta","banco"],CSFP:["pat\u00edn","mel\u00f3n"]} },
    { id:"ny", phoneme:"/\u00f1/", age:3, words:{ISPP:["\u00f1ato","\u00f1oquis"],ISIP:["ba\u00f1o","mu\u00f1eca"],CSIP:[],CSFP:[]} }
  ]},
  { id:"africada", title:"Africada", items:[
    { id:"ch", phoneme:"/t\u0283/", age:3, words:{ISPP:["chico","chupete"],ISIP:["lucha","lechuga"],CSIP:[],CSFP:[]} }
  ]},
  { id:"lateral", title:"Lateral", items:[
    { id:"l", phoneme:"/l/", age:3, words:{ISPP:["lata","l\u00e1mina"],ISIP:["malo","colina"],CSIP:["alma","alto","bolsa"],CSFP:["mal","sal"]} }
  ]},
  { id:"fricativas", title:"Fricativas", items:[
    { id:"f", phoneme:"/f/", age:3, words:{ISPP:["fuma","Felipe"],ISIP:["caf\u00e9","b\u00fafalo"],CSIP:[],CSFP:[]} },
    { id:"x", phoneme:"/x/", age:3, words:{ISPP:["jugo","jinete"],ISIP:["caja","m\u00e1gico"],CSIP:[],CSFP:[]} },
    { id:"y", phoneme:"/\u028d/", age:3, words:{ISPP:["llena","llamada"],ISIP:["mayo","gallina"],CSIP:[],CSFP:[]} },
    { id:"s", phoneme:"/s/", age:3, words:{ISPP:["suma","semana"],ISIP:["queso","cocina"],CSIP:["asma","casco","costa","caspa","isla"],CSFP:["luz","an\u00eds"]} }
  ]},
  { id:"vibrantes", title:"Vibrantes", items:[
    { id:"r_simple", phoneme:"/\u027e/", age:4, ageCSIP:5, words:{ISPP:[],ISIP:["cero","curita"],CSIP:["\u00e1rbol","cerdo","carta","arpa","carne","termo","barco"],CSFP:["mar","calor"]} },
    { id:"r_multiple", phoneme:"/r/", age:5, words:{ISPP:["rosa","regalo"],ISIP:["zorro","guitarra"],CSIP:[],CSFP:[]} }
  ]},
  { id:"gc_laterales", title:"Grupos conson\u00e1nticos laterales", items:[
    { id:"bl", phoneme:"/bl/", age:4, words:{ISPP:["bloque"],ISIP:["tabla"],CSIP:[],CSFP:[]} },
    { id:"pl", phoneme:"/pl/", age:4, words:{ISPP:["playa"],ISIP:["soplo"],CSIP:[],CSFP:[]} },
    { id:"fl", phoneme:"/fl/", age:5, words:{ISPP:["flauta"],ISIP:["afloja"],CSIP:[],CSFP:[]} },
    { id:"cl", phoneme:"/cl/", age:5, words:{ISPP:["clase"],ISIP:["tecla"],CSIP:[],CSFP:[]} },
    { id:"gl", phoneme:"/gl/", age:5, words:{ISPP:["glot\u00f3n"],ISIP:["siglo"],CSIP:[],CSFP:[]} }
  ]},
  { id:"gc_centrales", title:"Grupos conson\u00e1nticos centrales", items:[
    { id:"br", phoneme:"/b\u027e/", age:5, words:{ISPP:["bravo"],ISIP:["cobra"],CSIP:[],CSFP:[]} },
    { id:"pr", phoneme:"/p\u027e/", age:5, words:{ISPP:["primo"],ISIP:["lepra"],CSIP:[],CSFP:[]} },
    { id:"fr", phoneme:"/f\u027e/", age:5, words:{ISPP:["frito"],ISIP:["cifra"],CSIP:[],CSFP:[]} },
    { id:"cr", phoneme:"/c\u027e/", age:5, words:{ISPP:["crema"],ISIP:["lacra"],CSIP:[],CSFP:[]} },
    { id:"gr", phoneme:"/g\u027e/", age:5, words:{ISPP:["grano"],ISIP:["logro"],CSIP:[],CSFP:[]} },
    { id:"dr", phoneme:"/d\u027e/", age:5, words:{ISPP:["drama"],ISIP:["ladra"],CSIP:[],CSFP:[]} },
    { id:"tr", phoneme:"/t\u027e/", age:5, words:{ISPP:["trapo"],ISIP:["metro"],CSIP:[],CSFP:[]} }
  ]},
  { id:"diptongos", title:"Diptongos", items:[
    { id:"ia", phoneme:"/ia/", age:3, words:{ISPP:["Celia","copia"],ISIP:[],CSIP:[],CSFP:[]} },
    { id:"io", phoneme:"/io/", age:3, words:{ISPP:["piojo","novio"],ISIP:[],CSIP:[],CSFP:[]} },
    { id:"ie", phoneme:"/ie/", age:3, words:{ISPP:["nadie","miel"],ISIP:[],CSIP:[],CSFP:[]} },
    { id:"uo", phoneme:"/uo/", age:3, words:{ISPP:["cuota","antiguo"],ISIP:[],CSIP:[],CSFP:[]} },
    { id:"ua", phoneme:"/ua/", age:3, words:{ISPP:["guapo","agua"],ISIP:[],CSIP:[],CSFP:[]} },
    { id:"ue", phoneme:"/ue/", age:3, words:{ISPP:["fuego","nuevo"],ISIP:[],CSIP:[],CSFP:[]} },
    { id:"eu", phoneme:"/eu/", age:3, words:{ISPP:["deuda","feudo"],ISIP:[],CSIP:[],CSFP:[]} },
    { id:"ei", phoneme:"/ei/", age:3, words:{ISPP:["aceite","veinte"],ISIP:[],CSIP:[],CSFP:[]} },
    { id:"ui", phoneme:"/ui/", age:3, words:{ISPP:["Luisa","cuida"],ISIP:[],CSIP:[],CSFP:[]} },
    { id:"ai", phoneme:"/ai/", age:3, words:{ISPP:["baila","Jaime"],ISIP:[],CSIP:[],CSFP:[]} },
    { id:"oi", phoneme:"/oi/", age:3, words:{ISPP:["hoy","Coima"],ISIP:[],CSIP:[],CSFP:[]} },
    { id:"iu", phoneme:"/iu/", age:3, words:{ISPP:["viuda","ciudad"],ISIP:[],CSIP:[],CSFP:[]} },
    { id:"au", phoneme:"/au/", age:4, words:{ISPP:["auto","aula"],ISIP:[],CSIP:[],CSFP:[]} }
  ]}
];

export var POSITIONS = [
  { id:"ISPP", label:"ISPP", full:"Inicio s\u00edlaba \u2014 Posici\u00f3n de palabra" },
  { id:"ISIP", label:"ISIP", full:"Inicio s\u00edlaba \u2014 Interior de palabra" },
  { id:"CSIP", label:"CSIP", full:"Coda s\u00edlaba \u2014 Interior de palabra" },
  { id:"CSFP", label:"CSFP", full:"Coda s\u00edlaba \u2014 Final de palabra" }
];

export var ERROR_TYPES = [
  { id:"ok", label:"\u2713", color:"#059669", desc:"Correcto" },
  { id:"D", label:"D", color:"#f59e0b", desc:"Distorsi\u00f3n" },
  { id:"O", label:"O", color:"#dc2626", desc:"Omisi\u00f3n" },
  { id:"S", label:"S", color:"#7c3aed", desc:"Sustituci\u00f3n" }
];
