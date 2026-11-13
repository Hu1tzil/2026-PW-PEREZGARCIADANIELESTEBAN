// La aplicación de la demo. server.js la arranca; las pruebas la arrancan con otras configuraciones.
// Lo que dice "(en clase)" lo programamos juntos, paso por paso. Mientras no esté, esa ruta responde 501.
const path = require('path');
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const { crearModeloUsuarios } = require('./modelos/usuarios.modelo');

const NOMBRE_COOKIE = 'connect.sid';

//Si hay una sesion existente pbtenerla del alamcen sino crear una nueva
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
      return res.status(401).json({error: '401 no has iniciado sesion con la cuenta correcta'})
    }
    req.session.ultimoUso = Date.now();
    next();
  }

  function requiereRol(rol){
    return (req, res, next) => {
      if(req.session.usuario.rol !== rol){
        return res.status(403).json({error: `Eres ${req.session.usuario.usuario}, pero esta ruta es para ${rol}`})
      }
      next();
    }
  }

  //vamos a definiir las rutas de acceso 
  app.get('/api/condiguracion', (req, res) => {
    res.json(config);
  });

  //vamos a crear una ruta para un usuario sin que inicie sesion

  app.post('api/visitas', (req, res) => {
    if(!req.session) return res.json({error: 'no tiene acceso'});
    req.session.visitas = (req.session.visitas || 0) + 1;
    res.json({visitas: req.session.visitas, sesion: cortoId(req.sessionID)});
  });

  //vamos a autenticarnos
  app.post('/api/login', async (req, res) => {
    try {
      const { usuario, contrasena } = req.body || {};
      const datos = await usuarios.verificar(usuario, contrasena);
      if (!datos) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
      const antes = req.session.visitas !== undefined ? idcorto(req.sessionID) : null;
      const visitas = req.session.visitas || 0;
      //tenemos que guardar los datos de la sesion 
      const guardar = () => {
        req.session.usuario = datos;
        req.session.ultimoUso = Date.now();
        req.session.visitas = visitas;
        req.session.ultimoUso = Date.now();
        req.session.save((err) => {
          if (err) return next(err);
          res.json({ usuario: datos, sesionAntes: antes, sesionDespues: cortoId(req.sessionID)});
        });
      };

      if (config.regeneraAlEntrar){
        req.session.regenerate((error) => (error ? next(error) : guardar()));
      }else{
        guardar();
      }

    }catch (error) {
      next(error);
    }
  });

  app.post('/api/logout', (req, res, next) => {
    req.session.destroy((error) => {
      if (error) return next(error);
        res.clearCookie(NOMBRE_COOKIE);
        res.json({ mensaje: 'Sesión cerrada'});
    });
  });

  app.get('/api/sesiones', requiereSesion,(req, res) => {
    const desde = config.rolling ? req.session.ultimoUso : req.session.creada;
    res.json({
      usuario: req.session.usuario,
      sesion: cortoId(req.sessionID),
      expiraEnSegundos: Math.max(0, Math.round((config.maxAge - Date.now()) / 1000)),
    });
  });

  app.get('/api/perfil', requiereSesion, (req, res) => {
    req.session.visitas = (req.session.visitas || 0) + 1;
    res.json({mensaje: `Hola ${req.session.usuario.nombre}, rol: ${req.session.usuario.rol}, visitas: ${req.session.visitas}`});
  });
  
  //vamos a desarrollar una prueba unitaria para verificar con v o f las pruebas ejecutadas
  app.get('/api/diagnostico/sesiones',  async (req, res, next) => {
    try{
      const sesiones = await todasLasSesiones(almacen);
      const lista = Object.entries(sesiones || {}).map(([id, sesion]) => ({
        sesion: cortoId(id),
        esLaTuya: id === req.sessionID,
        usuario: s.usuario ? s.usuario.usuario : 'Sin iniciar sesión',
        visitas: s.visitas || 0,
        expira: s.cookie && s.cookie.expires,
      }));
      res.json({ almacen: config.almacen, sesiones: lista });
    }catch (error) {
      next(error);
    }
  });

  app.use(express.static(path.join(__dirname, 'public')));

  app.use((err, req, res, next) => {
    console.error(error);
    res.status(500).json({error: 'Error del servidor'});
  });

  app.use('/api', (req, res) => res.status(404).json({error: 'Ruta no encontrada'}));

  return app;
  
}

module.exports = { crearApp, NOMBRE_COOKIE};

//Tarea 1: Realizar infografia sobre autenticacion con jwt y como se implementa--Domingo
//Tarea 2: con el uso del archivo que se les da deberan realizar y completar las pruebas al ejercicio de sesiones en el archivo llamado xxx para implementar en el archivo demo.js, se evaluara en la proxima clase.