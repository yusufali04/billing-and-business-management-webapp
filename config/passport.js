const LocalStrategy = require('passport-local').Strategy;
const Admin = require('../models/admin')
const bcrypt = require('bcrypt')



function init(passport){

    passport.use(new LocalStrategy({ usernameField: 'email' },async (email, password, done)=>{
        //login
        // check if email exists
        const admin = await Admin.findOne({email: email})
        if(!admin){
            return done(null, false, {message: '*No user exists with this email'});
        }

        bcrypt.compare(password, admin.password).then(match => {
            if(match){
                return done(null, admin, {message: 'Logged in successfully'})
            }
            else{
                return done(null, false, {message: '*Invalid username or password'})
            }
            
        }).catch(err=>{
            return done(null, false, {message: '*Something went wrong'})
        })
    }));

    passport.serializeUser((admin, done)=>{
        done(null, admin._id)
    });

    passport.deserializeUser((id, done)=>{
        Admin.findById(id, (err, user)=>{
            done(err, user)
        })
    });

}


module.exports = init;