module.exports = {
    isLoggedIn(req, res, next){
        if(req.isAuthenticated()) {
            return next();
        }
        return  res.redirect('/registro');
    },
    isNotLoggedIn(req, res, next){
        if(!req.isAuthenticated()) {
            return next();
        }
        return res.redirect('/index');
    }
    
};