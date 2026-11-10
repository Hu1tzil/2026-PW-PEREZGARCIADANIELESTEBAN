// La aplicación de la demo. server.js la arranca; las pruebas la arrancan con otras configuraciones.
// Lo que dice "(en clase)" lo programamos juntos, paso por paso. Mientras no esté, esa ruta responde 501.
const path = require('path');
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const { crearModeloUsuarios } = require('./modelos/usuarios.modelo');

const NOMBRE_COOKIE = 'connect.sid';

//Si hay una sesioon existente pbtenerla del alamcen sino crear una nueva
function todasLasSesiones(almacen) {
  return new Promise((resolve, reject) => {
    const promesa = almacen.all((err, sesiones) => (err ? reject(err) : resolve(sesiones)));
    if (promesa && typeof promesa.then === 'function') promesa.then(resolve, reject);
  });
}

function crearApp(config, pool) {
  const app = express();
  app.use(express.json());
  //primero obtenemos le modelo de la db
  const usuarios = crearModeloUsuarios(pool);

  //aqui nosotros debemos identificar la sesión sera por tabla en bd, o la sesiom sera una cookie en moemoria del navegador, o es una mezcla, sesiones en memoria de servidor y por tabla en bd y cookie en navegador y bd
  const almacen = config.almacen === 'memoria' 
  ? new session.MemoryStore() 
  : new MySQLStore({createDatabase: false, clearExpired: false}, pool);
  app.locals.almacen = almacen;
}

app.use(
  session({
    name: NOMBRE_COOKIE,
    secret: process.env.SESSION_SECRET || 'secreto-solo.para-la-demo',
    store: almacen,
    resave: false,
    //No se crea la sesion ni la cookie
    saveUninitialized: false,
    rolling: config.rolling || false,
    cookie: {
      maxAge: config.maxAge || 1000 * 60 * 60 * 24, // 1 día
      httpOnly: config.httpOnly || true,
      sameSite: config.sameSite || 'lax',
      secure: config.secure || false,
    },
  })
)

//Necesitamos visualizar el id de la sesion para compararla en la pantalla

const cortoId = (id) => (id ? `${id.slice(0, 8)}...` : null);

// nosotros usamos un middleware , el cual se encarga de comunicar el back y front, para ello nosotrsos debdemos obtener la sesion a partir de express, para ello el atributo rolling, la extiende y aunque le hallamos dado false, no se puede confiar en que la expire, para ello debemos identificarla y validarla en sus diferentes momentos

function vencida (sesion){
  const desde = config.rolling ? sesion.ultimoUso : sesion.creada;
  return Date.now() - desde > config.maxAge;
}

function requiereSesion(req, res, next){
  if(req.session.usuario && vencida(req.session)){
    return req.session.destroy(() => {
      res.clearCookie(NOMBRE_COOKIE);
      res.status(401).json({error: '401 tu sesion ya expiro, vuelve a iniciar sesion'})
    });
    if(!req.session.usuario){
      return res.status(401).json({error: '401 no has iniciadosesion con la cuneta correcta'})
    }
    req.session.ultimoUso = Date.now();
    next();
  }
  
}