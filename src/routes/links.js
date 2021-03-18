const express = require('express');
const router = express.Router();
const db = require('../database');
const { isLoggedIn } = require('../lib/autor');
const passport = require('passport');
const objectsACsv = require('objects-to-csv');
const { Result } = require('express-validator');
const { send } = require('process');



//Agregar cliente
router.get('/add', isLoggedIn, (req, res) => {
    res.render('links/add');
});
router.post('/add',isLoggedIn, passport.authenticate('local.registro', {
    successRedirect: '/links',
    failureRedirect: '/registro',
    failureFlash: true
}),  async(req, res) => {
    req.flash('exito', 'Cliente agregado exitosamente');
    res.redirect('/links');
});
// pagina de persona
router.get('/persona/:id', isLoggedIn, async (req, res) =>{
    const {id} = req.user;
    const usuarios= await db.query('SELECT * FROM usuario WHERE id =?', [id]);
    const email= await db.query('SELECT email FROM usuario_email WHERE usuario_id =?', [id]);
    const telefono= await db.query('SELECT telefono FROM usuario_telefono WHERE usuario_id =?', [id]);
    res.render('links/persona' , {usuarios: usuarios[0], email, telefono});
});
//Lista de clientes

 router.get('/', isLoggedIn,  async (req, res) => {
      const user= await db.query('SELECT * FROM usuario WHere rol =? ', 1);
      let usuario = await db.query('SELECT * FROM usuario');
     
      const clientEmail = await db.query('SELECT * FROM usuario_email');
      const clienTelefono = await db.query('SELECT * FROM usuario_telefono');
     res.render('links/lista', { usuario, clientEmail, clienTelefono, user: user[0]});
     (async () => {
        const csv =await new objectsACsv(usuario).toDisk('./src/public/csv.csv', {append: false });
         //console.log(await csv.toString());
    })();
     
 });

//agregar contacto del cliente

router.get('/agregarContacto/:id', isLoggedIn, async (req, res) =>{
    const {id} = req.params;
    const clientEmail = await db.query('SELECT * FROM usuario_email WHERE id = ?', [id]);
    const clientetelefono = await db.query('SELECT * FROM usuario_telefono WHERE id = ?', [id]);
    const cliente = await db.query('SELECT * FROM usuario WHERE id = ?', [id]);
    res.render('links/agregarContacto', {clientetelefono, clientEmail, cliente: cliente[0]});
});
router.post('/agregarContacto/:id', isLoggedIn, async (req, res) => {
    let {id} = req.params;
    const {telefono, email} = req.body;
    const usuario_id= req.params.id;
    if (email.length > 0) {
        const newEmail= { usuario_id, email };
        await db.query('INSERT INTO usuario_email set ?', [newEmail]);
    }
    if (telefono.length > 0) {
        const newTelefono= { usuario_id, telefono };
        await db.query('INSERT INTO usuario_telefono set ?', [newTelefono]);
    }
   
    req.flash('exito', 'Contacto agregado correctamente');
    res.redirect('/links/persona/:id');
});
//Agregar un Contenedor
router.get('/agregarContainer', isLoggedIn, async(req, res) =>{
    res.render('links/agregarContainer');
});
router.post('/agregarContainer', isLoggedIn, async(req, res)=>{
    const {NroContenedor, marca, IdCapacidad, Tara} = req.body;
    const newContenedor= {NroContenedor, marca, IdCapacidad, Tara, estado: 'Disponible'};
    try {
        if((NroContenedor.length, marca.length, IdCapacidad.length, Tara.length) > 0) {
             await db.query('INSERT INTO contenedor set ?', [newContenedor]);
            res.redirect('/links/listaContainer/:id');
        }
        
    } catch (error) {
        req.flash('mal', 'Contenedor existente');   
        res.redirect('/links/agregarContainer');
    }
    
});

//lista de Containers
router.get('/listaContainer/:id', isLoggedIn, async(req, res)=>{
    const {id} = req.user;
    const contenedores= await db.query('SELECT * FROM contenedor');
    const contenedor= await db.query('SELECT * FROM contenedor Where id_usuario =?', [id]);
    res.render('links/listaContainer', {contenedores, contenedor});
});
//editar un cliente 
 router.get('/editar/:id', isLoggedIn, async (req, res) => {
     const {id} = req.params;
     const cliente = await db.query('SELECT * FROM usuario WHERE id = ?', [id]);
     const clientEmail = await db.query('SELECT * FROM usuario_email WHERE usuario_id = ?', [id]);
     const clientetelefono = await db.query('SELECT * FROM usuario_telefono WHERE usuario_id = ?', [id]);
     res.render('links/editar', { cliente: cliente[0],  clientEmail, clientetelefono});
 });
 router.post('/editar/:id', isLoggedIn, async (req, res) => {
        const {id} = req.params;
        const { nombre, direccion, cuit, telefono, email } = req.body;
        const newCliente =  {nombre, direccion, cuit};
        const usuario_id = req.params.id;
        await db.query('DELETE FROM usuario_email WHERE usuario_id = ?', [id]);
        if  (email instanceof Array) {
            email.forEach (async email => {
                const newEmail = {usuario_id, email};
                await db.query('INSERT INTO usuario_email set ?', [newEmail]); 
            });   
        }else {
            const newEmail = {usuario_id, email};
            await db.query('INSERT INTO usuario_email set?', [newEmail]);
        }  
        await db.query('DELETE FROM usuario_telefono WHERE usuario_id = ?', [id]);
        if  (telefono instanceof Array) {
            telefono.forEach (async telefono => {
                const newTelefono = {usuario_id, telefono};
                await db.query('INSERT INTO usuario_telefono set ?', [newTelefono]); 
            });   
        }else {
            const newTelefono = {usuario_id, telefono};
            await db.query('INSERT INTO usuario_telefono set?', [newTelefono])
    
        }  
        await db.query('UPDATE usuario set ? WHERE id = ?', [newCliente, id]); 
    req.flash('exito', 'Cliente editado correctamente');
    res.redirect('/links/persona/:id');
 });
//eliminar un cliente

router.get('/eliminar/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;
     await db.query('DELETE FROM usuario WHERE id = ?', [id]);
     await db.query('DELETE FROM usuario_email WHERE usuario_id = ?', [id]);
     await db.query('DELETE FROM usuario_telefono WHERE usuario_id = ?', [id]);
    req.flash('success', 'Cliente eliminado');
     res.redirect('/links');
 });

//Ventas
router.get('/venta', isLoggedIn, async (req, res) => {
    res.render('links/venta');
});
module.exports = router;

