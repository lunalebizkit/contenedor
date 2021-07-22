const passport= require('passport');
const localStrategy= require('passport-local').Strategy;
const db=require('../database');
const helpers= require('../lib/helper');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');

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
    const {nombre, direccion, cuit, email}= req.body;
   
    const comprobar= await db.query('Select * from usuario Where usuario = ?', [usuario]);
    const comprobarEmail = await db.query('SELECT * FROM usuario_email WHERE email =?', [email]);
    if ((comprobar.length)> 0) {
        return done(null, false, req.flash('mal', 'Usuario Existente!'));
    }if ((comprobarEmail.length)>0) {
        return done(null, false, req.flash('mal', 'Email Existente!'));
    }else {
        const newUsuario = {
            nombre,
            direccion,
            cuit,
            usuario,
            contrasenia,
        };
        const mensajeMail =`
        <h2>Hola! ${nombre}...<br>
            Gracias por Registrarse a Containers & Logistica !!! </h3>
        
        <ul>
            <li>Su Usuario es:<b> ${usuario} </b></li>
            <li>Su contraseña es :<b> ${contrasenia} </b></li>
        </ul>
        
    `;
    
    const CLIENT_ID="341263466702-kgegh0q8lvoppkt62du36dnfgvi6hdc8.apps.googleusercontent.com";
    const CLIENT_SECRET="mT3ZTIsG3TMt0p6GCXDjUH2U";
    const REDIRECT_URI="https://developers.google.com/oauthplayground";
    const REFRESH_TOKEN="1//04Tv43DZavK41CgYIARAAGAQSNwF-L9IrkjS7YQBdxTZCmHJFnCQx0lWv8SZ8tblRRXWCkervdg446DeYAArC4gwyVlGP0xhrVsE";
    const oAuth2cliente = new google.auth.OAuth2( 
        CLIENT_ID,
        CLIENT_SECRET,
        REDIRECT_URI
        );
    
     oAuth2cliente.setCredentials({refresh_token:REFRESH_TOKEN});
     
     async function sendMail(){
         try{
            const accessToken= await oAuth2cliente.getAccessToken()
            const transporter= nodemailer.createTransport({
                 service: "gmail",
                 auth:{
                     type:"Oauth2",
                     user: "lunalebizkit@gmail.com",
                     clientId:CLIENT_ID,
                     clientSecret:CLIENT_SECRET,
                     refreshToken:REFRESH_TOKEN,
                     accessToken:accessToken
                 },
    
             });
             const mailOptions=
                
                {
                 from:"Contenedores & Logistica <lunalebizkit@gmail.com>",
                 to: email,
                 subject:"Confirmacion de Registro",
                 html: mensajeMail, 
             };
             const result = await transporter.sendMail(mailOptions);
             return result
    
    
         }catch(err){
             console.log(err);
         }
        
     } 
    sendMail()
    //  .then((result)=>res.status(200).send('enviado'))
     .catch((error)=> console.log(error.message));
        newUsuario.contrasenia = await helpers.encriptaContrasenia(contrasenia);
        const resultado= await db.query('INSERT INTO usuario SET ? ', [newUsuario]);
        const newEmail = { usuario_id: resultado.insertId, email };
        await db.query('INSERT INTO usuario_email set ?', [newEmail]);
        newUsuario.id= resultado.insertId;
        return done(null, newUsuario);
        
    }
  
  
}));


passport.serializeUser((user, done)=>{
       done(null, user.id);
   });

passport.deserializeUser(async (id, done)=> {
    const filas= await  db.query('SELECT * FROM usuario Where id = ?', [id]);
    done(null, filas[0]);
 });