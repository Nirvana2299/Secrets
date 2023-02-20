const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const app = express();
require('dotenv').config()
const md5 = require('md5');


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
    const username = req.body.username
    const password = md5(req.body.password)
    User.findOne({ email: username }, (err, foundUser) => {
        if (err) {
            console.log(err)
        } else {
            if(foundUser) {
                if (foundUser.password === password) {
                    res.render("secrets")
                }; 
            };   
        };
    });
});

app.get("/register", (req, res) => res.render("register"));

app.post("/register", (req, res) => {
    const newUser = new User({
        email: req.body.username,
        password: md5(req.body.password)
    });
    newUser.save((err) => {
        if (!err) {
            res.render("secrets")
        } else {
            console.log(err)
        };
    });
});

app.listen(3000, () => console.log("Connected to port 3000"))