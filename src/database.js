const mySql= require('mysql');
const {promisify}=require('util');
const {database}=require('./keys');


const db= mySql.createPool(database);

db.getConnection((err,connection) =>{
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('La conexion con la base de datos se cerro');

        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('La base de datos tiene muchas conexiones');
        
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('La conexion de base de datos fue rechazada')
        }
    }
    if (connection) connection.release();
    console.log('La base de datos esta conectada');
    console.log('Buena Suerte!!');
    return;

});

//Promisfy pool querys- Convertir a promesas la base de datos
db.query= promisify(db.query);
module.exports= db;
