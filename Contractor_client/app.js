var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var upload = require("express-fileupload");

var indexRoutes = require("./routes/index");
var projectRoutes = require("./routes/projects");
var userRoutes = require("./routes/profile");

app.use(cookieParser());
app.use(upload());
app.use(bodyParser.urlencoded({extended:true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

app.use("/", indexRoutes);
app.use("/projects/", projectRoutes);
app.use("/profile/", userRoutes);

app.listen(4200,function(){
    console.log("Server started at port 4200");
});
