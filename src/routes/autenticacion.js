const express= require('express');
const router= express.Router();

const passport = require('passport');
const { isLoggedIn} = require('../lib/autor');
const { isNotLoggedIn} = require('../lib/autor');

router.get('/registro', isNotLoggedIn, (req, res) => {
     res.render('auth/registro');
 });

router.post('/registro', isNotLoggedIn, passport.authenticate('local.registro', {
    successRedirect: '/inicio',
    failureRedirect: '/registro',
    failureFlash: true
}));

router.get('/ingreso', isNotLoggedIn, (req, res) => {
    res.render('auth/ingreso');
});
router.post('/ingreso', isNotLoggedIn, (req, res, next) =>{ 
    passport.authenticate('local.ingreso', {
        successRedirect: '/inicio',
        failureRedirect: '/ingreso',
        failureFlash: true
    })(req, res, next)
});


router.get('/inicio', isLoggedIn,  (req, res) => {
    res.render('inicio');
});
 router.get('/salir', isLoggedIn, (req, res) =>{
    req.logOut();
    res.redirect('/ingreso');
});


module.exports= router;