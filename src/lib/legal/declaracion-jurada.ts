// Contenido de la Declaración Jurada de Trabajo Pro Bono.
//
// NOTA DE IMPLEMENTACIÓN: el prompt maestro (línea 23 y sección "Contenido de
// la Declaración Jurada") indica que el cliente iba a adjuntar el texto
// completo y oficial de la "Declaración de Trabajo Pro Bono para el
// Continente Americano" para usarlo tal cual, pero ese texto no llegó a
// incluirse en el archivo `legal-nea-soft-prompt-maestro.md` (la sección
// referenciada no existe). Ante esa ausencia, se redactó el texto que sigue
// tomando como base fiel el resumen de compromisos que sí figura en el
// prompt (20 horas o 3 días anuales, misma calidad profesional, foco en
// personas/comunidades/organizaciones vulnerables). Reemplazar por el texto
// oficial exacto si Legal Nea lo provee — es texto real seleccionable/
// indexable tanto en este módulo como en el modal y el PDF que lo consumen,
// nunca una imagen.
//
// Estructura consumida tanto por el modal (React) como por el PDF
// (@react-pdf/renderer) para no duplicar el contenido legal en dos lugares.

export type BloqueDeclaracion =
  | { tipo: "titulo"; texto: string }
  | { tipo: "parrafo"; texto: string }
  | { tipo: "considerando"; texto: string }
  | { tipo: "item"; numero: number; texto: string };

export const TITULO_DECLARACION_JURADA =
  "Declaración Jurada de Trabajo Pro Bono";

export const CONTENIDO_DECLARACION_JURADA: BloqueDeclaracion[] = [
  { tipo: "considerando", texto: "CONSIDERANDO:" },
  {
    tipo: "parrafo",
    texto:
      "Que el acceso a la justicia es un derecho humano fundamental y una condición indispensable para el ejercicio efectivo de los demás derechos reconocidos por el ordenamiento jurídico argentino e internacional.",
  },
  {
    tipo: "parrafo",
    texto:
      "Que existen amplios sectores de la población que, por su situación económica o social, no pueden acceder a asesoramiento y patrocinio legal de calidad.",
  },
  {
    tipo: "parrafo",
    texto:
      "Que la abogacía, como profesión liberal, conlleva una responsabilidad social que trasciende el interés particular de cada profesional, y que el trabajo pro bono constituye una de las formas más directas de honrar dicha responsabilidad.",
  },
  {
    tipo: "parrafo",
    texto:
      "Que Legal Nea, con sede en Corrientes, impulsa una red de profesionales del derecho dispuestos a destinar parte de su tiempo a la asistencia jurídica gratuita, en línea con los principios de la Declaración de Trabajo Pro Bono para el Continente Americano.",
  },
  {
    tipo: "considerando",
    texto: "POR ELLO, quien suscribe la presente DECLARA BAJO JURAMENTO:",
  },
  {
    tipo: "item",
    numero: 1,
    texto: "Que los datos consignados en el presente formulario son correctos, veraces y se encuentran actualizados.",
  },
  {
    tipo: "item",
    numero: 2,
    texto: "Que se encuentra matriculado/a para el ejercicio de la abogacía en la jurisdicción declarada, y que dicha matrícula se encuentra vigente.",
  },
  {
    tipo: "item",
    numero: 3,
    texto: "Que se compromete a destinar, en forma voluntaria y gratuita, un mínimo de veinte (20) horas o tres (3) días de trabajo profesional por año a casos de interés público derivados por Legal Nea, en beneficio de personas, comunidades u organizaciones en situación de vulnerabilidad.",
  },
  {
    tipo: "item",
    numero: 4,
    texto: "Que prestará dicho servicio con el mismo nivel de calidad, dedicación y responsabilidad profesional que aplicaría a un servicio remunerado.",
  },
  {
    tipo: "item",
    numero: 5,
    texto: "Que comprende que la presente inscripción no genera relación de dependencia, laboral ni de ningún otro tipo con Legal Nea, y que su participación en la red PROBONO es libre, voluntaria y revocable en cualquier momento.",
  },
  {
    tipo: "item",
    numero: 6,
    texto: "Que autoriza a Legal Nea a contactarlo/a por los medios declarados (email, teléfono/WhatsApp) para la derivación de casos y el seguimiento de su participación en la red.",
  },
  {
    tipo: "parrafo",
    texto:
      "Firma la presente declaración jurada en carácter de aceptación electrónica, dejando constancia de la fecha y hora registradas por el sistema al momento de su envío.",
  },
];
