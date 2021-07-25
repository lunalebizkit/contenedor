const express= require('express');
const morgan=require('morgan');
const expresshbs= require('express-handlebars');
const path=require('path');
const flash= require('connect-flash');
const session = require('express-session');
const mySqlStore=require('express-mysql-session');
const {database}=require('./keys');
const passport= require('passport');


//Inicializaciones
const aplicacion= express();
require('./lib/passport');
//configuracion
aplicacion.set('port', process.env.PORT || 5000);
aplicacion.set('views', path.join(__dirname, 'views'));
aplicacion.engine('.hbs', expresshbs({
    defaultLayout: 'main',
    layoutsDir: path.join(aplicacion.get('views'), 'layouts'),
    partialsDir: path.join(aplicacion.get('views'), 'partials'),
    extname: '.hbs',
    helpers: require('./lib/handlebars'),
}));
aplicacion.set('view engine', '.hbs');

//funciones para peticiones
aplicacion.use(session({
    secret: 'alenodeappsession',
    resave: false,
    saveUninitialized: false,
    store: new mySqlStore(database)
}));
aplicacion.use(flash());
aplicacion.use(morgan('dev'));
aplicacion.use(express.urlencoded({extended: true}));
aplicacion.use(express.json());
aplicacion.use(passport.initialize());
aplicacion.use(passport.session());

//variables
aplicacion.use((req, res, next)=> {
    aplicacion.locals.exito= req.flash('exito');
    aplicacion.locals.mal= req.flash('mal');
    aplicacion.locals.usuario= req.user;
    next();
});
//Rutas
aplicacion.use(require('./routes'));
aplicacion.use(require('./routes/autenticacion'));
aplicacion.use('/links', require('./routes/links'));
//Archivos Publicos
aplicacion.use(express.static(path.join(__dirname, 'public')));
//Empezar el servidor
aplicacion.listen(aplicacion.get('port'), ()=> {
    console.log('Servidor en Puerto', aplicacion.get('port'));
});