export const PF_CATEGORIES = [
  {
    id: "sust", title: "Sustituciones",
    processes: [
      { id: "oclusivizacion", name: "Oclusivización", desc: "Fricativos → oclusivos (ej: 'popa' por 'sopa')", expectedAge: 36 },
      { id: "fricativizacion", name: "Fricativización", desc: "Oclusivos → fricativos (ej: 'yanyo' por 'chancho')", expectedAge: 36 },
      { id: "frontalizacion", name: "Frontalización", desc: "Velares/palatales → labiales/dentales (ej: 'boma' por 'goma')", expectedAge: 36 },
      { id: "posteriorizacion", name: "Posteriorización", desc: "Alveolares → velares/palatales (ej: 'kele' por 'tele')", expectedAge: 36 },
      { id: "nasalizacion", name: "Nasalización", desc: "Orales → nasales (ej: 'neche' por 'leche')", expectedAge: 36 },
      { id: "desnasalizacion", name: "Desnasalización", desc: "Nasales → orales (ej: 'lele' por 'nene')", expectedAge: 36 },
      { id: "indif_lrd", name: "Indiferenciación l-r-d", desc: "Usa l, r, d indistintamente (ej: 'pada' por 'para')", expectedAge: 60 }
    ]
  },
  {
    id: "asim", title: "Asimilaciones",
    processes: [
      { id: "asim_vocalica", name: "Asimilación vocálica", desc: "Vocal se asimila a otra (ej: 'calisita' por 'calesita')", expectedAge: 42 },
      { id: "asim_cons_total", name: "Asimilación consonántica total", desc: "Consonante idéntica a otra de la palabra (ej: 'teletono' por 'teléfono')", expectedAge: 42 },
      { id: "asim_cons_modo", name: "Asimilación parcial - modo", desc: "Por modo articulatorio (ej: 'name' por 'dame')", expectedAge: 42 },
      { id: "asim_cons_punto", name: "Asimilación parcial - punto", desc: "Por punto articulatorio (ej: 'pomé' por 'comé')", expectedAge: 42 },
      { id: "asim_cons_sonoridad", name: "Asimilación parcial - sonoridad", desc: "Por sonoridad (ej: 'kato' por 'gato')", expectedAge: 42 }
    ]
  },
  {
    id: "estr", title: "Estructuración silábica",
    processes: [
      { id: "red_grupo_cons", name: "Reducción grupo consonántico", desc: "Omite un fonema del grupo (ej: 'paza' por 'plaza')", expectedAge: 60 },
      { id: "red_grupo_voc", name: "Reducción grupo vocálico", desc: "Elimina el cerrado del diptongo (ej: 'pe' por 'pie')", expectedAge: 48 },
      { id: "omis_cons_final", name: "Omisión consonante final", desc: "CVC → CV (ej: 'go' por 'gol')", expectedAge: 42 },
      { id: "omis_cons_inicial", name: "Omisión consonante inicial", desc: "CVC → VC (ej: 'oca' por 'boca')", expectedAge: 36 },
      { id: "omis_sil_atona", name: "Omisión sílaba átona", desc: "Suprime sílaba no acentuada (ej: 'efante' por 'elefante')", expectedAge: 42 },
      { id: "omis_sil_tonica", name: "Omisión sílaba tónica", desc: "Elimina sílaba acentuada (ej: 'téfono' por 'teléfono')", expectedAge: 36 },
      { id: "reduplicacion", name: "Reduplicación", desc: "Repite la misma sílaba (ej: 'cococótero' por 'helicóptero')", expectedAge: 30 },
      { id: "metatesis", name: "Metátesis", desc: "Invierte fonemas (ej: 'manqueta' por 'manteca')", expectedAge: 48 },
      { id: "migracion", name: "Migración", desc: "Fonema cambia de lugar (ej: 'estuata' por 'estatua')", expectedAge: 48 },
      { id: "epentesis", name: "Epéntesis", desc: "Agrega un fonema (ej: 'teres' por 'tres')", expectedAge: 48 },
      { id: "omis_son_post_nasal", name: "Omisión sonora post-nasal", desc: "Tras nasal omite sonora (ej: 'tamién' por 'también')", expectedAge: 48 }
    ]
  }
];

export const ALL_PROCESSES = PF_CATEGORIES.flatMap(c => c.processes.map(p => ({ ...p, category: c.id, categoryTitle: c.title })));
