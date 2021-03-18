const bcrypt= require('bcryptjs');

const helpers={};


helpers.encriptaContrasenia = async (contrasenia) =>{
    const salt=  await bcrypt.genSalt(5);
    const hash= await bcrypt.hash(contrasenia, salt);
    return hash;
};

helpers.compareContrasenia= async (contrasenia, savedPassword) =>{
    try{
        return await bcrypt.compare(contrasenia, savedPassword);
    } catch(e) {
        console.log(e);
    }
};



module.exports= helpers;