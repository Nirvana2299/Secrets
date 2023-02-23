require('dotenv').config();

const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const app = express();
const bcrypt = require('bcryptjs');
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false
})
);
app.use(passport.initialize());
app.use(passport.session());

app.set("view engine", "ejs");
mongoose.set('strictQuery', true);



main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/userDB');
};

///////////////////////////////////////////////SCHEMA MODEL/////////////////////////////////////////////////////////////////

const userSchema = new mongoose.Schema({ email: String, password: String, googleId: String, secret: String });

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
// use static serialize and deserialize of model for passport session support
passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, {
            id: user.id,
            username: user.username
        });
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
},
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

///////////////////////////////////HOME/////////////////////////////////////////////////////////////////////


app.get("/", (req, res) => res.render("home"));


///////////////////////////////////USER REGISTERATION///////////////////////////////////////////////////////

app.get("/register", (req, res) => res.render("register"));

app.post("/register", (req, res) => {

    // direct bcrypt hashing ///////////////////////////////////////////////////////////////////////////////
    // bcrypt.genSalt(10, function (err, salt) {
    //     bcrypt.hash(req.body.password, salt, function (err, hash) {
    //         // Store hash in your password DB.
    //         const newUser = new User({
    //             email: req.body.username,
    //             password: hash
    //         });
    //         console.log(err);
    //         newUser.save((err) => {
    //             if (!err) {
    //                 res.render("secrets")
    //             } else {
    //                 console.log(err)
    //             };
    //         });
    //     });
    // });
    ////////////////////////////////////////////////////////////////////////////////////////////////////////

    User.register({ username: req.body.username }, req.body.password, (err, user) => {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/secrets")
            });
        };
    });
});

///////////////////////////////////GOOGLE AUTHENTICATION(RESGISTER USING GOOGLE AUTH)///////////////////////////////////////////////////////


app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });

///////////////////////////////////USER LOGIN///////////////////////////////////////////////////////


app.get("/login", (req, res) => res.render("login"));


app.post("/login", passport.authenticate("local", { failureRedirect: '/login' }), (req, res) => {
    res.redirect("/secrets")

    /////////////// non cookies Version //////////////////////////////////////////////////////////////////////
    // const username = req.body.username;
    // const password = req.body.password;
    // User.findOne({ email: username }, (err, foundUser) => {
    //     if (err) {
    //         console.log(err)
    //     } else {
    //         if (foundUser) {
    //             bcrypt.compare(password, foundUser.password, function (err, result) {
    //                 if (result === true) {
    //                     res.render("secrets")
    //                 };
    //             });
    //         };
    //     };
    // });
    ///////////// gives access to the secrets route page even after puttin the wrong password in the login page///////// 
    // const user = new User({
    //     username: req.body.username,
    //     password: req.body.password
    // });
    // req.logIn(user, (err) => {
    //     if (err) {
    //         console.log(err);
    //     } else {
    //         passport.authenticate("local")(req, res, () => {
    //             res.redirect("/secrets");
    //         });
    //     };
    // });
});


///////////////////////////////////USER SECRET PAGE///////////////////////////////////////////////////////


app.get("/secrets", (req, res) => {
    User.find({"secret": {$ne: null}}, (err, foundResult) => {
        if (err) {
            console.log(err);
        } else {
            res.render("secrets", {secretSubmitted: foundResult})
        }
    })
});


///////////////////////////////////USER LOGOUT BUTTON///////////////////////////////////////////////////////


app.get("/logout", (req, res) => {
    req.logOut((err) => {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/");
        };
    });
});


///////////////////////////////////USER SUBMIT BUTTON///////////////////////////////////////////////////////


app.get("/submit", (req, res) => {
    if (req.isAuthenticated) {
        res.render("submit");
    } else {
        res.redirect("/login");
    };
});

app.post("/submit", (req, res) => {
    const submittedSecret = req.body.secret;
    console.log(req.user)
    User.findById((req.user.id), (err, foundResult) => {
        if (foundResult) {
            console.log(foundResult)
            foundResult.secret = submittedSecret;
            foundResult.save(() => {
                res.redirect("/secrets")
            });
        } else {
            console.log(err);
        };
    });
});


//////////////////////////////////////////////////////////////////////////////////////////////////////////////


app.listen(3000, () => console.log("Connected to port 3000"))