const mysql = require('mysql2/promise');

/**
 * LA BASE DE DATOS LOCAL LA USAREMOS PARA VERIFICAR PRUEBAS INTERNAS, SE BUSCARA QUE CASD AUNO CREA UNA CUENTA EN SUPABAS.COM Y GENERAREMOS UNA API PARA CONECTAR EL SERVICIODE BD PARA ELLO SE DEBDE CONFIGUARRA EL ARCHIVO EN .ENV
 */

const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'r31ra',
    database: 'cecyt_local',
    dateStrings: true,
});
