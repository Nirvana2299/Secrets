const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const app = express();
require('dotenv').config()
const bcrypt = require('bcryptjs');

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
mongoose.set('strictQuery', true);

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/userDB');
};

const userSchema = new mongoose.Schema({ email: { type: String }, password: { type: String } });
const User = mongoose.model("User", userSchema);

app.get("/", (req, res) => res.render("home"));

app.get("/login", (req, res) => res.render("login"));

app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    User.findOne({ email: username }, (err, foundUser) => {
        if (err) {
            console.log(err)
        } else {
            if (foundUser) {
                bcrypt.compare(password, foundUser.password, function (err, result) {
                    if (result === true) {
                        res.render("secrets")
                    };
                });
            };
        };
    });
});

app.get("/register", (req, res) => res.render("register"));

app.post("/register", (req, res) => {

    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(req.body.password, salt, function (err, hash) {
            // Store hash in your password DB.
            const newUser = new User({
                email: req.body.username,
                password: hash
            });
            console.log(err);
            newUser.save((err) => {
                if (!err) {
                    res.render("secrets")
                } else {
                    console.log(err)
                };
            });
        });
    });
});

app.listen(3000, () => console.log("Connected to port 3000"))