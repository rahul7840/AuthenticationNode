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
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')
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
    password: String,
    googleId:String,
    secret:String
});

// const secret = "loveislifeitsmysecret";
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ['password'] });

userSchema.plugin(passsportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());
// bellow we do for only level 6 
passport.serializeUser(function (user, done) {
    done(null, user.id);
});
passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile);   
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));


app.get("/", function (req, res) {
    res.render("home");
});
// app.get("/auth/google", function (req, res) {
//     passport.authenticate("google", { scope: ['profile'] })
// });
app.get("/auth/google", passport.authenticate("google",
    {
        scope: ['profile']
    }));
app.get("/auth/google/secrets",
    passport.authenticate('google', { failureRedirect: "/login" }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
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
    req.logOut(function (err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/");
        }
    });

});

app.get("/secrets", function (req, res) {
 User.find({"secret":{$ne:null}}, function(err,foundUser){
    if(err){
        console.log(err)
    }else{
        if(foundUser){
           res.render("secrets",{userWithSecrets:foundUser})
          
        }
    }
 })
});
app.get("/submit", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("submit");
    }
});
        app.post("/submit",function(req,res){
            const submittedSecret =req.body.secret;

            console.log(req.user.id);

            User.findById(req.user.id,function(err,foundUser){
                if(err){
                    console.log(err)
                }else{
                    if(foundUser){
                        foundUser.secret=submittedSecret;
                        foundUser.save(function(){
                            res.redirect("/secrets")
                        });
                    }
                }
            })
        })
      
       

app.get("/logout", function (req, res) {
     req.logout();
     res.redirect("/");
});

app.post("/register", function (req, res) {

    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function () {
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
    req.login(user, function (err) {
        if (err) {
            console.log(err);
            res.redirect("/login");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });

});


app.listen(3000, function () {
    console.log("server is running on 3k.....")
});
