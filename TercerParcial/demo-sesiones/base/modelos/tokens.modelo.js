function crearModeloToken(pool){
    //necesitamos de una funcion que se encargue de insertar dentro de la base de datos los tokens que estaran revocados para que no se vuelvan a utilizar

    async function revocar(jti,usuario,exp) {
        await pool.query('INSERT INTO token_revocado (jti, usuario, exp) VALUES (?,?, FROM_UNIXTIME(?))',[jti, usuario, exp]);
    }

    async function estaRevocado(jti) {
        const [ filas ] = await pool.query('SELECT 1 FROM tokens_revocados WHERE jti = ?',[String(jti || '')]);

        return filas.length > 0;
    }

    //una funcion para poder consultar todos los tokens revocados
    async function listar() {
        const [ filas ] = await pool.query('SELECT jti, usuario, expira, revocado_en FROM tokens_revocados ORDER BY revocados_en, jti');

        return filas;
    }

    return { revocar, estaRevocado, listar}
}

module.exports = {crearModeloToken}

