const express= require('express');
const ruta= express.Router();

ruta.get('/', (req, res) => {
    res.send('Bienvenido a la ruta');
});



module.exports=ruta;