const express= require('express');
const ruta= express.Router();

ruta.get('/', (req, res) => {
    res.render('index');
});



module.exports=ruta;



