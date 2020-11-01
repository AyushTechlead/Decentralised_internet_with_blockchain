var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var indexRoutes = require("./routes/index");
var projectRoutes = require("./routes/projects");
var paymentRoutes = require("./routes/payment");
var cookieParser = require('cookie-parser');
var upload = require("express-fileupload");

app.use(cookieParser());
app.use(upload());
app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

app.use("/", indexRoutes);
app.use("/", projectRoutes);
app.use("/", paymentRoutes);

const port = process.env.PORT;
app.listen(port,function(){
    console.log("Server started at port " + port);
});


