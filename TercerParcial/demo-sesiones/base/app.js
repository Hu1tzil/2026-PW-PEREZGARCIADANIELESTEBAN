// La aplicación de la demo. server.js la arranca; las pruebas la arrancan con otras configuraciones.
// Lo que dice "(en clase)" lo programamos juntos, paso por paso. Mientras no esté, esa ruta responde 501.
const path = require('path');
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const { crearModeloUsuarios } = require('./modelos/usuarios.modelo');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { crearModeloTokens } = require('../modelos/tokens.modelo');

const NOMBRE_COOKIE = 'connect.sid';

//Si hay una sesion existente pbtenerla del alamcen sino crear una nueva
function todasLasSesiones(almacen) {
  return new Promise((resolve, reject) => {
    const promesa = almacen.all((err, sesiones) => (err ? reject(err) : resolve(sesiones)));
    if (promesa && typeof promesa.then === 'function') promesa.then(resolve, reject);
  });
}

function crearApp(config, pool){
    const app = express();
    app.use(express.json());
    //mandamos a traer el modelo
    const usuarios = crearModeloUsuarios(pool);

    //aqui el servidor debe de recordar cada vez que existe una sesión, para eso vamos a ocupar el almacen

    const almacen = config.almacen === 'memoria' ? new session.MemoryStore() : new MySQLStore({createDatabaseTable: false, clearExpired: false}, pool);
    app.locals.almacen = almacen;

    app.use(
        session({
            name : NOMBRE_COOKIE,
            //aqui tenemos que definir si es secreta, si es publica o como es su acceso
            secret: process.env.SESSION_SECRET || 'secreto-solo-para-demo',
            store: almacen,
            resave: false,
            saveUninitialized: false,
            rolling : config.rolling,
            cookie:{
                maxAge: config.maxAgeMs,
                httpOnly: config.httpOnly,
                sameSite: config.sameSite || 'lax',
                secure: config.secure || false
            }
        })
    );

    //necesitamos los primeros 8 caracteres del id de sesion, para compartirlos en pantalla para visualizarlos, en la realidad muy pocas veces se hace esto
    const idCorto = (id) => (id ? `${id.slice(0, 8)}...` : null);

    //como estamos ocupando un middleware dentro de la app, necesitamos verificar el vencimiento de la sesión, express-session alarga por defecto el vencimiento guardadno en el servidor por cada petición aunque el rolling sea en false, si solo confiamos en esto alguien nos puede copiar la cookie y mantener vivia la sesión creando un defecto de seguridad
    function vencida(sesion){
        const desde = config.rolling ? sesion.ultimoUso : sesion.creada;
        return Date.now() - desde > config.maxAgeMs;
    }

    //401 no estas autorizado
    function requiereSesion(req, res, next){
        if(req.session.usuario && vencida(req.session)){
            return req.session.destroy(()=>{
                res.clearCookie(NOMBRE_COOKIE);
                res.status(401).json({error: '401 tu sesion se vención vuelve a iniciar sesión'});
            });
        }
        if(!req.session.usuario){
            return res.status(401).json({error: '401 no has inicia sesion con tu usuario'});
        }
        req.session.ultimoUso = Date.now();
        next();
    }

    function requiereRol(rol){
        return (req, res, next)=>{
            if(req.session.usuario.rol !== rol){
                return res.status(403).json({error: `Eres ${req.session.usuario.usuario}, pero esta ruta es para ${rol}`});
            }
            next();
        };
    }

    //vamos a definir las rutas de acceso
    app.get('/api/config', (req, res)=>{
        res.json(config);
    });

    //vamos a crear una ruta para un usuario vasitante, sin que inicie sesión
    app.post('/api/visita', (req, res)=>{
        if(!req.session) return res.json({error: 'no tiene acceso'});
        req.session.visitas = (req.session.visitas || 0 ) + 1;
        res.json({visitas : req.session.visitas, sesion: idCorto(req.sessionID)});
    });

    //vamos a autenticarnos
    app.post('/api/login', async(req, res, next)=>{
        try{
            const {usuario, contrasena} = req.body || {};
            const datos = await usuarios.verificar(usuario, contrasena);
            if(!datos) return res.status(401).json({
                error: 'Usuario o contraseña incorrectos'
            });

            const antes = req.session.visitas !== undefined ? idCorto(req.sessionID) : null;
            const visitas = req.session.visitas || 0;

            //tenemos que guardar los datos de la sesión
            const guardar = () =>{
                req.session.usuario = datos;
                req.session.visitas = visitas;
                req.session.creada = Date.now();
                req.session.ultimoUso = Date.now();
                req.session.save((error)=>{
                    if (error) return next(error);
                    res.json({usuario:datos, sesionAntes: antes, sesionDespues: idCorto(req.sessionID)});
                });

            };

            if(config.regenerarAlEntrar){
                req.session.regenerate((error)=>(error ? next(error) : guardar() ));
            }else{
                guardar();
            }
                
        }catch(error){
            next(error);
        }

    });

    app.post('/api/logout', (req, res, next)=>{
        req.session.destroy((error)=>{
            if(error) return next(error);
            res.clearCookie(NOMBRE_COOKIE);
            res.json({mensaje : 'Sesion cerrada'});
        });
    });

    app.get('/api/sesion', requiereSesion, (req, res)=>{
        const desde = config.rolling ? req.session.ultimoUso : req.session.creada;
        res.json({
            usuario : req.session.usuario,
            sesion : idCorto(req.sessionID),
            expiraEnSegundos : Math.max(0, Math.round((desde + config.maxAge - Date.now())/1000)),
        });
    });

    app.get('/api/perfil', requiereSesion, (req, res)=>{
        req.session.visitas = (req.session.visitas || 0) + 1;
        res.json({mensaje : `Hola ${req.session.usuario.nombre}`, rol: req.session.usuario.rol, visitas : req.session.visitas});
    });

     app.get('/api/admin/reporte', requiereSesion, requiereRol('admin'), (req, res)=>{
        res.json({reporte: 'Talleres: 3 · Inscritos: 57 · Cupo libre: 18'});
    });

    //vamos a desarrollar una prueba uitadria para verificar con v o fl las pruebas ejecutadas

    app.get('/api/diagnostico/sesiones', async(req, res, next) =>{
        try{
            const sesiones = await todasLasSesiones(almacen);
            const lista = Object.entries(sesiones || {}).map(([id, s])=>({
                sesion : idCorto(id),
                esLaTuya : id === req.sessionID,
                usuario: s.usuario ? s.usuario.usuario : 'Sin incir sesion',
                visitas: s.visitas || 0,
                expira : s.cookie && s.cookie.expires,
            }));
            res.json({almacen : config.almacen, sesiones : lista});

        }catch(error){
            next(error);
        }
    });

    app.use(express.static(path.join(__dirname, 'public')));

    app.use((error, req, res, next)=>{
        console.error(error);
        res.status(500).json({error: 'Error del servidor'});
    });

    app.use('/api', (req, res)=> res.status(404).json({error: 'Ruta no encontrada'}));

    //implementacion jwt

    const SECRETO_JWT = config.jwtSecreto || process.env.JWT_SECRET || 'secreto-solo-para-este-tema';

    //vamos a crear una funcion para poder verificar y firmar que el token sea autentico y si no a volar

    function firmarToken(usuario){
        return jwt.sign(
            {
                sub : String(usuario.id), usuario : usuario.usuario, nombre : usuario.nombre, rol : usuario.rol
            }, SECRETO_JWT,
            {
                algorithm : 'HS256', expiresIn : config.jwtExpiraSeg, jwtid: crypto.randomUUID()
            }
        );
    }

    //tenemos que hacer una funcion que se encarge de validar quien necesita un token en la aplicacion en el middleware

    async function requiereJWT(req, res, next) {
        const encabezado = req.headers.authorization || '';

        if(!encabezado.startWith(' Bearer ')){
            return res.status(401).json({error : 'Falta un token asociado'});
        }

        const token = encabezado.slice(' Bearer '.length);

        let datos
        try{
            datos = jwt.verify(token, SECRETO_JWT, {algorithms : ['HS256']});
        } catch{
            if( error === 'TokenExpiredError'){
                return res.status(401).json({error: '401 Token expirado, porfavor renuevelo'});
            }
            return res.status(401).json({error : '401 Token invalido'});
        }

        try{
            if(config.jwtRecovar && (await tokens.estaRevocado(datos.jti))){
                return res.status(401).json({error : 'Token revocado'})
            }
        }catch(error){
            return next(error);
        }

        req.jwt = datos;
        next();

        
    }

    //403 el token es valido pero el rol mo
    function requiereRolJWT(rol){
        return(req, res, next) => {
            if(req.jwt.rol !== rol){
            return res.status(403).json({error : `Eres ${req.jwt.usuario} pero esta ruta solo accede ${rol}`});
        }
        next();
        }
    }

    app.post('/api/jwt/login', async(req, res, next)=>{
        try{
            const {usuario, contrasena } = req.body || {};
            const datos = await usuarios.verificar(usuario, contrasena);
            if(!datos) return res.status(401).json({error : 'Usuario o contraseña incorrectos'});
            res.json({token : firmarToken(datos), usuario : datos});
        }catch(error){
            next(error);
        }
    });

    app.get('/api/jwt/perfil', requiereJWT, (res, req)=>{
        res.json({
            mensaje: `Hola ${req.jwt.nombre}`,
            rol : req.jwt.rol,
            expiraEnSegundos: Math.max(0, req.jwt.exp - Math.floor(Date.now() /1000))
        });
    });

    //ruta para admin
    app.get('/api/jwt/admin/reporte', requiereJWT, requiereRol('admin'), (req, res)=>{
        res.json({reporte: 'Talleres: 3 · Inscritos: 57 · Cupo libre: 18'});
    });

    app.post('/api/jwt/refresh', requiereJWT, (req, res)=>{
        const { sub, usuario, nombre, rol} = req.jwtM
        res.json({token : firmarToken({id : sub, usuario, nombre, rol})});
    });

    app.post('/api/jwt/logout', requiereJWT, async(req, res, next)=>{
        try{
            if(config.jwtRevocar){
                await token.revocar(req.jwt.jti, req.jwt.usuario, req.jwt.exp);
                return res.json({mensaje : 'Token recodado en el servidor, se registra en lista negra'});
            }
            res.json({mensaje: 'El servidor no guarda nada'});
        }catch(error){
            next(error);
        }
    });

    return app;
}

module.exports = { crearApp, NOMBRE_COOKIE};

//Tarea 1: Realizar infografia sobre autenticacion con jwt y como se implementa--Domingo
//Tarea 2: con el uso del archivo que se les da deberan realizar y completar las pruebas al ejercicio de sesiones en el archivo llamado xxx para implementar en el archivo demo.js, se evaluara en la proxima clase.