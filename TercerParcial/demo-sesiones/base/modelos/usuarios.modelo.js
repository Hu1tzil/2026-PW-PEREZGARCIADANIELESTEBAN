// Consultas a la tabla usuarios. Siempre con ? (consulta parametrizada), nunca pegando texto en el SQL.
const bcrypt = require('bcryptjs');

function crearModeloUsuarios(pool) {

  async function verificar(usuario, contrasena) {

    const [filas] = await pool.query(
      `SELECT id, usuario, nombre, rol, contrasena_hash
       FROM usuarios
       WHERE usuario = ?`,
      [usuario]
    );

    if (filas.length === 0) {
      return null;
    }

    const usuarioBD = filas[0];

    const coincide = await bcrypt.compare(
      contrasena,
      usuarioBD.contrasena_hash
    );

    if (!coincide) {
      return null;
    }

    return {
      id: usuarioBD.id,
      usuario: usuarioBD.usuario,
      nombre: usuarioBD.nombre,
      rol: usuarioBD.rol
    };
  }

  return { verificar };
}

module.exports = { crearModeloUsuarios };