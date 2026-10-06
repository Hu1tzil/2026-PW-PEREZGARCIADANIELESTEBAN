// 03-strings-fechas.js
// Métodos de string más usados + el objeto Date — conecta con la validación
// de fecha (DD/MM/AAAA) de la semana 4. Completa cada TODO.

const entrada = '  María López  ';

// TODO: trim — imprime `entrada` sin espacios sobrantes
console.log('ejemplo de uso de trim()');
console.log(`${entrada.trim()}`);

// TODO: split — parte el resultado del trim en un arreglo `partes`, separado por espacio
console.log('ejemplo de uso de split()');
const partes = entrada.trim().split(' ');
console.log(partes);

// TODO: includes — imprime si 'correo@cecyt9.ipn.mx' contiene '@'
console.log('ejemplo de includes()');
console.log('correo@cecyt9.ipn.mx'.includes('@'));

// TODO: replace y replaceAll — con '05/09/2026', reemplaza '/' por '-'
//       primero con replace (una sola vez) y luego con replaceAll (todas)
console.log('ejemplo de replace() y replaceAll()');
console.log('05/09/2026'.replace('/', '-'));//remplaza un slash
console.log('05/09/2026'.replaceAll('/', '-'));//remplaza todos los slashs

// TODO: template literals — usando `nombre = 'María'` y `cupo = 25`, imprime
//       "María se inscribió en un taller con cupo para 25 personas."
console.log('manejo de template');
const nombre = 'María';
const cupo = 25;
console.log(`${nombre} se inscribió en un taller con cupo para ${cupo} personas.`);

// TODO: Date — completa esta función para construir un objeto Date a partir
// de un texto 'DD/MM/AAAA' (recuerda: los meses en Date empiezan en 0)
console.log('ejemplo de uso de Date()');
function fechaDesdeTexto(textoFecha) {
  // TODO
  const [dia, mes, año] = textoFecha.split('/').map(Number); // Convierte cada parte a número
  return new Date(año, mes - 1, dia); // Los meses en Date empiezan en 0
}

// TODO: usa fechaDesdeTexto('05/09/2026'), imprime su toISOString() y su
// getDay(); luego calcula cuántos días de diferencia hay contra `new Date()`
const fechaAsistencia = fechaDesdeTexto('05/09/2026');
console.log('fecha de construida:', fechaAsistencia.toISOString());
console.log('Día de la semnana (0=domingo):');
fechaAsistencia.getDay();

const hoy = new Date();
const DiasDiferencia = Math.round((fechaAsistencia - hoy) / (1000 * 60 * 60 * 24));
console.log(`Faltan ${DiasDiferencia} días para la fecha de asistencia al taller (puede ser negativo).`);