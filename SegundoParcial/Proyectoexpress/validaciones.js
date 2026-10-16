//vamos a dejarle 2 de las 3 validaciones para validar 

function ValidarCorreo(correo){

}

function ValidarBoleta(boleta){
}

function ValidarContrasena(contrasena){
    if(typeof contrasena !== 'string')return false;
    return contrasena.length >= 8;
}

module.exports = {
    ValidarCorreo,
    ValidarBoleta,
    ValidarContrasena
}