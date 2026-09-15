/*
Las validaciones para este formulario se realizaran mediante el uso de expresiones regulares, las cuales las vamos a dividir en tres:
1.- Tipo texto para nombre
2.- Numerica para la boleta
3.- Debbe tener un patron para la fecha

Las expresiones regulares son patrones que nos ayudan a validar cadenas bajo ciertas condiciones.

*/

const patrones = {
    nombre : /^[A-Za-zÁÉÍÓÚáéíóúñÜü]{2,60}$/,
    boleta : /^\d{10}$/,
    fecha :  /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/d{4}$/
};

const mensajes = {
    nombre : "Solo letras y espacios entres 2 y 60 caracteres",
    boleta: "La boleta debe tener exactamente 10 digitos",
    fecha : "La fecha debe tener formato DD/MM/AAAA."
};

function validarCampo(campo, valor){
    return patrones[campo].test(valor.trim())
}

//Para validar el formulario dbemos utilizar los principioa de obtencion y manipulacion de los elementos del DOM

if(typeof document !== 'undefined'){
    
}