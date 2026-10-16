const pool = require('../bd-local');

const COLUMNAS_PUBLICAS = 'id, nombre, correo, boleta, rol';

async function listar(){
    const [filas] = await pool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM usuario ORDER BY id`);
    return filas;
}

async function obtenerPorId(){
    const [filas] = await pool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM usuario WHERE id = ?`);
    return filas[0];
}

async function crear({nombre, correo, contrasenaHash, boleta, rol}){
    const [resultado] = await pool.query(
        'INSERT INTO usuario (nombre, correo, contrasena_hash, boleta, rol) VALUES (?, ?, ?, ?, ?)',
        [nombre, correo, contrasenaHash, boleta, rol || 'alumno']
    );
    return obtenerPorId(info.insertId); 
}

async function actualizar(id, {nombre, correo, rol}){
    const cambios = Object.entries({nombre, correo, rol}).filter(([ , valor]) => valor !== undefined);

    if (cambios.length === 0) { return obtenerPorId(id); }

    const [columnas] = cambios.map(([columna]) => `${columna} = ?`).join(', ');

    const [info] = await pool.query(
        `UPDATE usuario SET ${columnas} WHERE id = ?`,
        [...cambios.map(([ , valor]) => valor), id]
    );
    if (info.affectedRows === 0) { return undefined; }
    return obtenerPorId(id);
}

async function eliminarPorId(id){
    const [filas] = await pool.query(`DELETE FROM usuario WHERE id = ?`, [id]);
    return info.affectedRows > 0;
} 

async function obtenerPorCorreoConHash(correo){
    const [filas] = await pool.query('SELECT * FROM usuario WHERE correo = ?', [correo]);
    return filas[0];
}

module.exports = {
    listar,
    obtenerPorId,
    crear,
    actualizar,
    eliminarPorId,
    obtenerPorCorreoConHash
}

//crear modelos de las tablas talleres y asistencia 
// tallere tiene registrar_alumno, consultar_todos_detalles
// asistencia tiene registrar_asistencia, consultar_asistencia de taller 