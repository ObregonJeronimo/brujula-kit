import Joyride, { STATUS } from "react-joyride";

var TOUR_STEPS = [
  {
    target: "[data-tour='sidebar-logo']",
    content: "¡Bienvenido a Brújula KIT! Este es tu espacio de trabajo para gestionar evaluaciones fonoaudiológicas. Te vamos a mostrar las secciones principales.",
    placement: "right",
    disableBeacon: true
  },
  {
    target: "[data-tour='nav-dash']",
    content: "En el Panel Principal vas a ver un resumen de tus evaluaciones recientes, créditos disponibles, accesos rápidos y tu agenda del mes.",
    placement: "right"
  },
  {
    target: "[data-tour='nav-tools']",
    content: "Desde Herramientas podés iniciar una nueva evaluación. Cada evaluación consume 1 crédito y genera un informe automático con inteligencia artificial.",
    placement: "right"
  },
  {
    target: "[data-tour='nav-hist']",
    content: "En Historial encontrás todas las evaluaciones realizadas. Podés ver los informes, filtrar por tipo y eliminar evaluaciones.",
    placement: "right"
  },
  {
    target: "[data-tour='nav-pacientes']",
    content: "Acá gestionás tus pacientes: cargás sus datos personales, del responsable, y podés ver un historial consolidado de cada uno.",
    placement: "right"
  },
  {
    target: "[data-tour='nav-calendario']",
    content: "El Calendario te permite agendar citas. Si el paciente tiene email registrado, se envía un recordatorio automático al guardar la cita.",
    placement: "right"
  },
  {
    target: "[data-tour='nav-premium']",
    content: "Desde Créditos podés adquirir más evaluaciones cuando lo necesites.",
    placement: "right"
  },
  {
    target: "[data-tour='nav-config']",
    content: "En Configuración podés personalizar los datos de tu consultorio, activar o desactivar avisos, y configurar los emails automáticos. También podés volver a ver este tutorial desde ahí.",
    placement: "right"
  }
];

var joyrideStyles = {
  options: {
    zIndex: 10000,
    primaryColor: "#0d9488",
    backgroundColor: "#fff",
    textColor: "#1e293b",
    arrowColor: "#fff",
    overlayColor: "rgba(10, 61, 47, 0.5)"
  },
  tooltip: {
    borderRadius: 14,
    padding: "20px 24px",
    boxShadow: "0 20px 60px rgba(0,0,0,.18)",
    fontSize: 14
  },
  tooltipContainer: {
    textAlign: "left"
  },
  tooltipContent: {
    padding: "8px 0",
    lineHeight: 1.6,
    fontSize: 13,
    color: "#475569"
  },
  tooltipTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: "#0a3d2f"
  },
  buttonNext: {
    backgroundColor: "#0d9488",
    borderRadius: 8,
    padding: "8px 18px",
    fontSize: 13,
    fontWeight: 600
  },
  buttonBack: {
    color: "#64748b",
    fontSize: 13,
    fontWeight: 500,
    marginRight: 8
  },
  buttonSkip: {
    color: "#94a3b8",
    fontSize: 12
  },
  buttonClose: {
    display: "none"
  },
  spotlight: {
    borderRadius: 10
  }
};

var joyrideLocale = {
  back: "Anterior",
  close: "Cerrar",
  last: "Finalizar",
  next: "Siguiente",
  skip: "Saltar tutorial"
};

export default function OnboardingTour({ run, onFinish }) {
  var handleCallback = function(data) {
    var status = data.status;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      if (onFinish) onFinish();
    }
  };

  return <Joyride
    steps={TOUR_STEPS}
    run={run}
    continuous={true}
    showSkipButton={true}
    showProgress={true}
    scrollToFirstStep={false}
    disableOverlayClose={true}
    disableCloseOnEsc={false}
    styles={joyrideStyles}
    locale={joyrideLocale}
    callback={handleCallback}
    floaterProps={{ disableAnimation: true }}
  />;
}
