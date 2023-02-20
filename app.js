const express = require("express");
const ejs = require("ejs");

const app = express();

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

app.get("/", (req, res) => res.render("home"));
app.get("/login", (req, res) => res.render("login"));
app.get("/register", (req, res) => res.render("register"));
app.get("/secrets", (req, res) => res.render("secrets"));
app.get("/submit", (req, res) => res.render("submit"));




app.listen(3000, () => console.log("Connected to port 3000"))