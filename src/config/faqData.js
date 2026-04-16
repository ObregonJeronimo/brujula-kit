// Default FAQ data — used as fallback when Firestore config/support_faq document doesn't exist
// Super Admin can edit these from the support config panel, which saves to Firestore
var DEFAULT_FAQ = [
  {
    id: "faq-eval",
    pregunta: "Como realizar una evaluacion?",
    respuesta: "Para realizar una evaluacion, anda a Herramientas, selecciona el area de evaluacion que necesites y hace click en Iniciar. Cada evaluacion consume 1 credito. Asegurate de tener al menos un paciente registrado antes de comenzar."
  },
  {
    id: "faq-paciente",
    pregunta: "Como agregar un paciente nuevo?",
    respuesta: "Anda a la seccion Pacientes en el menu lateral y hace click en + Nuevo paciente. Completa los datos del paciente (DNI, nombre, fecha de nacimiento) y los datos del responsable. El telefono del responsable es obligatorio."
  },
  {
    id: "faq-informe",
    pregunta: "Como exportar un informe?",
    respuesta: "Despues de completar una evaluacion, el sistema genera automaticamente un informe con inteligencia artificial. Podes descargarlo en PDF desde la pantalla de resultados haciendo click en el boton Imprimir. Tambien podes acceder a informes anteriores desde el Historial."
  },
  {
    id: "faq-creditos",
    pregunta: "Como comprar creditos?",
    respuesta: "Anda a la seccion Creditos en el menu lateral. Ahi vas a ver los packs disponibles con sus precios. Selecciona el que necesites y completa el pago a traves de MercadoPago. Los creditos se acreditan automaticamente una vez confirmado el pago."
  },
  {
    id: "faq-cita",
    pregunta: "Como agendar una cita?",
    respuesta: "Anda al Calendario, hace click en el dia que quieras y selecciona + Nueva cita. Podes buscar un paciente registrado por DNI o nombre. Si el responsable del paciente tiene email registrado, se le envia automaticamente un recordatorio por correo."
  },
  {
    id: "faq-complementario",
    pregunta: "Que es el Informe Complementario?",
    respuesta: "El Informe Complementario integra multiples evaluaciones de un mismo paciente en un solo informe consolidado. Lo encontras en Herramientas, al final de la pagina. Necesitas al menos 2 evaluaciones del mismo paciente para generarlo. Consume 1 credito."
  }
];

export { DEFAULT_FAQ };
