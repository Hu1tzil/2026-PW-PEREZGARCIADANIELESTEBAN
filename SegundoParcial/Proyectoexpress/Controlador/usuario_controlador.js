const bcypt = require('bcryptjs');

const usuarioModelo = require('../Modelo/usuario_modelo');

const {ValidarCorreo, ValidarBoleta, ValidarContrasena} = require('../validaciones');

function esDuplicado(error){
    return error.code === 'ER_DUP_ENTRY' || error.code === '23505';
}

async function listar(req, res){
    try {
        const usuarios = await usuarioModelo.listar();
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function obtenerPorUsuario(req, res){
    try {
        const usuario = await usuarioModelo.obtenerPorId(req.params.id);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}


//deberán realizar los controladores de asistencia y talleres con sus funciones correspondientes

async function crearUsuario(req, res){
    const { nombre, correo, contrasena, boleta, rol } = req.body;

    if(!nombre || !correo || !contrasena || !boleta){
        return res.status(400).json({ error: 'Los campos nombre, correo, contraseña y boleta son obligatorios' });
    }

    if(!ValidarCorreo(correo)){
        return res.status(400).json({ error: 'El correo no tiene un formato válido' });
    }

    if(!ValidarBoleta(boleta)){
        return res.status(400).json({ error: 'La boleta debe tener 10 dígitos' });
    }

    if(!ValidarContrasena(contrasena)){
        return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    try {
        const contrasenaHash = await bcypt.hash(contrasena, 10);
        const usuario = await usuarioModelo.crear({ nombre, correo, contrasenaHash, boleta, rol });
        res.status(201).json(usuario);
    } catch (error) {
        if (esDuplicado(error)) {
            return res.status(409).json({ error: 'Ya existe un usuario con ese correo o boleta registrado' });
        }
        res.status(500).json({ error: error.message });
    }
}

async function actualizarUsuario(req, res){
    const { nombre, correo, rol } = req.body;

    if(nombre === undefined && correo === undefined && rol === undefined){
        return res.status(400).json({ error: 'Al menos un campo (nombre, correo o rol) debe ser proporcionado para actualizar' });
    }

    if(correo === undefined && !ValidarCorreo(correo)){
        return res.status(400).json({ error: 'El correo no tiene un formato válido' });
    }
    //aquí mandan a llamar la función de nombre
    try{
        const usuario = await usuarioModelo.actualizar(req.params.id, { nombre, correo, rol });
        if(!usuario){
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(usuario);
    } catch (error) {
        if (esDuplicado(error)) {
            return res.status(400).json({ error: 'Ya existe un usuario con ese correo registrado' });
        }
        res.status(500).json({ error: error.message });
    }
}

async function eliminarUsuario(req, res){
    try {
        const eliminado = await usuarioModelo.eliminarPorId(req.params.id);
        if(!eliminado){
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    listar,
    obtenerPorUsuario,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario
}