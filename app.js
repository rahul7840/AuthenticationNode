require('dotenv').config()
const express = require('express');
const bodyparser = require('body-parser');
const mongoose = require('mongoose');
// const encrypt = require('mongoose-encryption');   ---> this is for encription
// const md5 = require('md5');                       ---> this is for hashing
// const bcrypt = require('bcrypt');                 ---> this is for salting
// const saltRound = 10;
const passport = require('passport')
const session = require('express-session');
const passsportLocalMongoose = require('passport-local-mongoose')
const ejs = require('ejs');

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs")
app.use(bodyparser.urlencoded({ extended: true }));

app.use(session({
    secret: 'rahul will deside what will secteet',
    resave: false,
    saveUninitialized: false,
    
  }));
app.use(passport.initialize());
app.use(passport.session());

mongoose.set("strictQuery", false)
mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

// const secret = "loveislifeitsmysecret";
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });

userSchema.plugin(passsportLocalMongoose);


const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get("/", function (req, res) {
    res.render("home");
});
app.get("/login", function (req, res) {
    res.render("login");
});
app.get("/register", function (req, res) {
    res.render("register");
});

// BELLOW CODE FOR SALTING, AND ENCRIPTION 
// app.post("/register", function (req, res) {

//     bcrypt.hash(req.body.password, saltRound, function (err, hash) {
//         const newUser = new User({
//             email: req.body.username,
//             password: hash
//         });
//         newUser.save(function (err) {
//             if (err) {
//                 console.log("bc err")
//             } else {
//                 res.render("secrets")
//                 // only hear render secrets rout bcoz we only render when user resister only
//             }
//         });
//     });
// });
// app.post("/login", function (req, res) {
//     const username = req.body.username;
//     // const password =md5(req.body.password);
//     const password = req.body.password;
//     User.findOne({ email: username }, function (err, foundUser) {
//         if (err) {
//             console.log(err);
//         } else {
//             if (foundUser) {
//                 bcrypt.compare(password, foundUser.password).then(function (result) {
//                     if (result === true) {
//                         res.render("secrets");
//                     }
//                 });

//             }
//         }
//     })
// })

// GIVEN BELLOW CODE FOR COOKIES AND SESSION LEV. AUTHENTICATION 
app.get("/logout", function (req, res) {
    req.logOut(function(err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/");
        }
    });
    
});

app.get("/secrets", function (req, res) {
    if (req.isAuthenticated()){
     res.render("secrets");
    }else{
     res.redirect("login");
    }
 });

app.post("/register", function (req, res) {

    User.register({username:req.body.username}, req.body.password, function(err, user) {
        if (err){
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
});
app.post("/login", function (req, res) {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });
    req.login(user, function(err){
        if (err){
            console.log(err);
            res.redirect("/login");
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    }); 

});


app.listen(3000, function () {
    console.log("server is running on 3k.....")
})
