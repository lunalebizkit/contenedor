const passport= require('passport');
const localStrategy= require('passport-local').Strategy;

const db=require('../database');
const helpers= require('../lib/helper');

passport.use('local.ingreso', new localStrategy({
    usernameField: 'usuario',
    passwordField: 'contrasenia',
    passReqToCallback: true
}, async(req, usuario, contrasenia, done) =>{
    const fila= await db.query('SELECT * FROM usuario WHERE usuario =?', [usuario]);
    if (fila.length > 0) {
        const usuario= fila[0];
        const validContrasenia= await helpers.compareContrasenia(contrasenia, usuario.contrasenia);
        if (validContrasenia) {
            done(null, usuario, req.flash('exito', `Bienvenido  ${usuario.nombre}`) );
        }else {
            done(null, false, req.flash('mal', 'Contraseña Incorrecta'));
        }
    }else {
        return done( null, false, req.flash('mal', 'El usuario no existe'));
    }
   
}));

passport.use('local.registro', new localStrategy({
        usernameField: 'usuario',
        passwordField: 'contrasenia',
        passReqToCallback: true
}, async (req, usuario, contrasenia, done) => {
    const {nombre, direccion, cuit}= req.body;
    const newUsuario = {
        nombre,
        direccion,
        cuit,
        usuario,
        contrasenia,
    };
    newUsuario.contrasenia = await helpers.encriptaContrasenia(contrasenia);
    const resultado= await db.query('INSERT INTO usuario SET ? ', [newUsuario]);
    newUsuario.id= resultado.insertId;
   return done(null, newUsuario);
}));


passport.serializeUser((user, done)=>{
       done(null, user.id);
   });

passport.deserializeUser(async (id, done)=> {
    const filas= await  db.query('SELECT * FROM usuario Where id = ?', [id]);
    done(null, filas[0]);
 });