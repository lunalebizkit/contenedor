const express= require('express');
const morgan=require('morgan');
const expresshbs= require('express-handlebars');
const path=require('path');

//Inicializaciones
const aplicacion= express();


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
aplicacion.use(morgan('dev'));

//variables
//Rutas
aplicacion.use(require('./routes/'));

//Archivos Publicos
//Empezar el servidor
aplicacion.listen(aplicacion.get('port'), ()=> {
    console.log('Servidor en Puerto', aplicacion.get('port'));
});