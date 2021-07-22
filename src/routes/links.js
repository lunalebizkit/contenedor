const express = require('express');
const router = express.Router();
const db = require('../database');
const { isLoggedIn } = require('../lib/autor');
const passport = require('passport');
const objectsACsv = require('objects-to-csv');
const { Result } = require('express-validator');
const { send } = require('process');
const { DH_UNABLE_TO_CHECK_GENERATOR } = require('constants');
const helpers =require('../lib/helper');
require('nodemailer');

//Agregar cliente
router.get('/add', isLoggedIn, (req, res) => {
    res.render('links/add');
});
router.post('/add', isLoggedIn, async(req, res) => {
    const {nombre, direccion, cuit, email, usuario, contrasenia}= req.body;   
    const comprobarEmail= await db.query('Select * from usuario_email where email =?', [email]);
    const usuar= await db.query('Select * from usuario where usuario =?', [usuario]);
    const cuit1= await db.query('Select * from usuario where cuit =?', [cuit]);
    if ( (usuar.length) > 0) {
        req.flash('mal', 'Usuario Existente!');
        res.redirect('/links/add');
    }  if ( (cuit1.length) > 0) {
        req.flash('mal', 'CUIT-CUIL-DNI Existente!');
        res.redirect('/links/add');
    }if ((comprobarEmail.length)>0) {
        req.flash('mal', 'Email Existente!');
        res.redirect('/links/add');
    }
    else{
        const newUsuario = {
            nombre,
            direccion,
            cuit,
            usuario,
            contrasenia,
        };
        newUsuario.contrasenia = await helpers.encriptaContrasenia(contrasenia);
        const resultado= await db.query('INSERT INTO usuario SET ? ', [newUsuario])
        const newEmail = { usuario_id: resultado.insertId, email };
        await db.query('INSERT INTO usuario_email set ?', [newEmail]);;
        req.flash('exito', 'Cliente agregado exitosamente');
        res.redirect('/links/lista');
    }   
});

// pagina de persona
router.get('/persona/:id', isLoggedIn, async (req, res) => {
    const { id } = req.user;
    const usuarios = await db.query('SELECT * FROM usuario WHERE id =?', [id]);
    const email = await db.query('SELECT email FROM usuario_email WHERE usuario_id =?', [id]);
    const telefono = await db.query('SELECT telefono FROM usuario_telefono WHERE usuario_id =?', [id]);
    res.render('links/persona', { usuarios: usuarios[0], email, telefono });
});
//Lista de clientes

router.get('/lista', isLoggedIn, async (req, res) => {
    //   const user= await db.query('SELECT * FROM usuario WHere rol =? ', 1);
    let usuarios = await db.query('SELECT * FROM usuario');
    const clientEmail = await db.query('SELECT * FROM usuario_email');
    const clienTelefono = await db.query('SELECT * FROM usuario_telefono');
    res.render('links/lista', { usuarios, clientEmail, clienTelefono });
    // (async () => {
    //     const csv = await new objectsACsv(usuarios).toDisk('./src/public/csv.csv', { append: false });
    //     //console.log(await csv.toString());
    // })();

});

//agregar contacto del cliente

router.get('/agregarContacto/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;
    const clientEmail = await db.query('SELECT * FROM usuario_email WHERE id = ?', [id]);
    const clientetelefono = await db.query('SELECT * FROM usuario_telefono WHERE id = ?', [id]);
    const cliente = await db.query('SELECT * FROM usuario WHERE id = ?', [id]);
    res.render('links/agregarContacto', { clientetelefono, clientEmail, cliente: cliente[0] });
});
router.post('/agregarContacto/:id', isLoggedIn, async (req, res) => {
    let { id } = req.params;
    const { telefono, email } = req.body;
    const usuario_id = req.params.id;
    if (email.length > 0) {
        const newEmail = { usuario_id, email };
        await db.query('INSERT INTO usuario_email set ?', [newEmail]);
    }
    if (telefono.length > 0) {
        const newTelefono = { usuario_id, telefono };
        await db.query('INSERT INTO usuario_telefono set ?', [newTelefono]);
    }

    req.flash('exito', 'Contacto agregado correctamente');
    res.redirect('/links/persona/:id');
});
//Agregar un Contenedor
router.get('/agregarContainer', isLoggedIn, async (req, res) => {
    res.render('links/agregarContainer');
});
router.post('/agregarContainer', isLoggedIn, async (req, res) => {
    const { NroContenedor, marca, IdCapacidad, Tara } = req.body;
    const newContenedor = { NroContenedor, marca, IdCapacidad, Tara, estado: 'Disponible' };
    try {
        if ((NroContenedor.length, marca.length, IdCapacidad.length, Tara.length) > 0) {
            await db.query('INSERT INTO contenedor set ?', [newContenedor]);
            res.redirect('/links/listaContainer/:id');
        }

    } catch (error) {
        req.flash('mal', 'Contenedor existente');
        res.redirect('/links/agregarContainer');
    }

});

//lista de Containers
router.get('/listaContainer/:id', isLoggedIn, async (req, res) => {
    const { id } = req.user;
    const contenedores = await db.query('SELECT * FROM contenedor');
    const contenedor = await db.query('SELECT * FROM contenedor Where id_usuario =?', [id]);
    res.render('links/listaContainer', { contenedores, contenedor });
});
//editar un cliente 
router.get('/editar/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;
    const cliente = await db.query('SELECT * FROM usuario WHERE id = ?', [id]);
    const clientEmail = await db.query('SELECT * FROM usuario_email WHERE usuario_id = ?', [id]);
    const clientetelefono = await db.query('SELECT * FROM usuario_telefono WHERE usuario_id = ?', [id]);
    res.render('links/editar', { cliente: cliente[0], clientEmail, clientetelefono });
});
router.post('/editar/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;
    const { nombre, direccion, cuit, telefono, email } = req.body;
    const newCliente = { nombre, direccion, cuit };
    const usuario_id = req.params.id;
    await db.query('DELETE FROM usuario_email WHERE usuario_id = ?', [id]);
    if (email instanceof Array) {
        email.forEach(async email => {
            const newEmail = { usuario_id, email };
            await db.query('INSERT INTO usuario_email set ?', [newEmail]);
        });
    } else {
        const newEmail = { usuario_id, email };
        await db.query('INSERT INTO usuario_email set?', [newEmail]);
    }
    await db.query('DELETE FROM usuario_telefono WHERE usuario_id = ?', [id]);
    if (telefono instanceof Array) {
        telefono.forEach(async telefono => {
            const newTelefono = { usuario_id, telefono };
            await db.query('INSERT INTO usuario_telefono set ?', [newTelefono]);
        });
    } else {
        const newTelefono = { usuario_id, telefono };
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
    res.redirect('/links/lista');
});

//Ventas
router.get('/venta/:id', isLoggedIn, async (req, res) => {
    const { id }= req.params;
    const producto = await db.query('SELECT * FROM contenedor where estado = "Disponible" or estado = ""');
    res.render('links/venta', { producto });
});
router.post('/venta/:id', isLoggedIn, async(req, res) =>{
    const { id }= req.user;
    const {contenedor}= req.body;
    req.session.contenedor= contenedor
    res.redirect('/links/factura/:id');
});

//Confirmacion de facturas
router.get('/factura/:id', async(req, res) =>{
    const {id} = req.user;
    let {contenedor}= req.session; 
    let consulta= [];
    if (contenedor instanceof Array) {
       for (let i =0; i < contenedor.length; i ++) {
        let producto= await db.query('SELECT * FROM contenedor WHERE NroContenedor = ?', [contenedor[i]]);
        consulta.push(producto[0]);}
    }    
    else {consulta= await db.query('SELECT * FROM contenedor WHERE NroContenedor = ?', [contenedor]);};
    req.session.contenedor = consulta;                                                                            
    res.render('links/factura', {consulta});
});
router.post('/factura/:id', isLoggedIn, async(req, res)=>{
    const {id}= req.params;
    const {contenedor}= req.session;
    let fecha= new Date(Date.now()).toLocaleDateString();
    const newFactura = {Tipo: 'A', Sucursal: 'Rodriguez Peña 1349, Maipu', NroCliente: id, idOperacion:  1, total: '', Fecha: fecha, idEstadoFactura: 2 };
    if ((contenedor.length) > 1) {
        const facturar= await db.query('INSERT INTO encabezado_factura_venta set?', [newFactura]);
        let num= facturar.insertId;
        contenedor.forEach(async numero => {
            const detalle= await{Numero: num, Tipo: 'A', Sucursal: 'Rodriguez Peña 1349, Maipu', NroContenedor: numero.NroContenedor, precio: ''};
            await db.query('INSERT INTO encabezado_detalle_venta set?', [detalle]);;
            await db.query('Update contenedor set estado = "Vendido" where NroContenedor =?', numero.NroContenedor);})
    } else {
       const facturar= await db.query('INSERT INTO encabezado_factura_venta set?', [newFactura]);
        const nro = contenedor[0].NroContenedor;        
        const detalle= await{Numero: facturar.insertId, Tipo: 'A', Sucursal: 'Rodriguez Peña 1349, Maipu', NroContenedor: nro, precio: ''};
        await db.query('INSERT INTO encabezado_detalle_venta set?', [detalle]);
        await db.query('Update contenedor set estado = "Vendido" where NroContenedor =?', [nro]);}
  
    res.redirect('/links/misProductos/:id');
});

//Vista de mis productos
router.get('/misProductos/:id', isLoggedIn, async(req, res) =>{
    const {id} = req.user;
    const misProductos= await db.query('Select * from encabezado_factura_venta inner join encabezado_detalle_venta on encabezado_factura_venta.Numero = encabezado_detalle_venta.Numero inner join contenedor on encabezado_detalle_venta.NroContenedor = contenedor.NroContenedor  where encabezado_factura_venta.NroCliente = ?', [id]);
    res.render('links/misProductos', {misProductos});
});

module.exports = router;

