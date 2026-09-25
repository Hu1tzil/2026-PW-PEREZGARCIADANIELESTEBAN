

const talleres = [
  { nombre: 'Introducción a Python', instructor: 'Ing. María López', cupo: 25, inscritos: 25 },
  { nombre: 'Fundamentos de Redes', instructor: 'Ing. Carlos Ramírez', cupo: 30, inscritos: 18 },
  { nombre: 'Diseño de Bases de Datos', instructor: 'Ing. Ana Torres', cupo: 20, inscritos: 20 },
  { nombre: 'Desarrollo Web con JS', instructor: 'Ing. María López', cupo: 25, inscritos: 10 },
];


function pintarTabla(){
    //debe de obtener la tabla y rellenarla con los datos de talleres
    const table = document.getElementById('tabla-talleres');
    table.innerHTML = '';
    talleres.forEach((t) => {
        const row = document.createElement('tr');
        row.innerHTML = ` 
          <td>${t.nombre}</td>
          <td>${t.inscritos}</td>
          <td>${t.cupo}</td>
          <td>${t.instructor}</td>
          `;
          
          table.appendChild(row);
    });
}


const formArreglos = document.getElementById('form-arreglos');
const resultadoArreglos = document.getElementById('resultado-arreglo');
const selectOperacionArreglo = document.getElementById('operacion-arreglo');

formArreglos.addEventListener('submit', (evento) =>{
    evento.preventDefault();
    const operacion = selectOperacionArreglo.value;

    let resultado;

    switch(operacion){
        case 'forEach':
            resultado = talleres.map((t) => `- ${t.nombre} (${t.inscritos}/${t.cupo})`).join('\n');
            break;
        case 'map': 
            resultado = talleres.map((t) => t.nombre).join('- ');
            break;
        case 'filter': 
            resultado = talleres.filter((t) => t.inscritos >= t.cupo).map((t) =>  `- ${t.nombre} (${t.inscritos}/${t.cupo})`).join('\n');
            break;
        case 'find':
            const encontrado = talleres.find((t) => t.instructor.includes('Ing. María López'));
            resultado = encontrado ? `- ${encontrado.nombre} (${encontrado.inscritos}/${encontrado.cupo})` : 'No se encontró ningún taller impartido por Ing. María López';
            break;
        case 'reduce':
            resultado = talleres.map((t) => t.inscritos).reduce((total, inscritos) => total + inscritos, 0);
            break;
        case 'filterMap':
            resultado = talleres.filter((t) => t.inscritos < t.cupo).map((t) => `- ${t.nombre} (${t.inscritos}/${t.cupo})`).join('\n');
            break;
        default:
            resultado = 'Operación no válida';
        }
        
       
       


    resultadoArreglos.textContent = resultado;
});

//Segunda parte

const formObjetos = document.getElementById('form-objetos');
const resultadoObjetos = document.getElementById('resultado-objeto');

formObjetos.addEventListener('submit', (evento) => {
    evento.preventDefault();

    //Construimos el objeto de talleres 
    const taller = {
        nombre: document.getElementById('obj-nombre').value,
        instructor: document.getElementById('obj-instructor').value,
        cupo: Number(document.getElementById('obj-cupo').value),
        inscritos: Number(document.getElementById('obj-inscritos').value)
    };

    const operacion = document.getElementById('operacion-objeto').value;

    let resultado;

    switch(operacion){
        case 'keys':
            resultado = JSON.stringify(Object.keys(taller));
            break;
        case 'values':
            break;
        case 'entries':
            resultado = Object.entries(taller).map
            break;
        case 'stringify':
            break;
        case 'roundtrip':
            const textoJson = JSON.stringify(taller, null, 2);
            const objetoDeVuelta = JSON.parse(textoJson);

            resultado = [
                '',
                textoJson,
                '',
                `tipo: ${typeof objetoDeVuelta}`,
                
            ]
            break;
    }

    resultadoObjetos.textContent = resultado;
})