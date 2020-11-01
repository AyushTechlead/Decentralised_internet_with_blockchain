var express = require("express");
var router = express.Router({mergeParams: true});
var http = require('http');
var upload = require("express-fileupload");
var cookieParser = require('cookie-parser');


router.get("/", function(req,res){
	if(req.cookies.username == null || req.cookies.username.toString() == "")  {
		res.render("landing", { currentUser: req.cookies.username, designation: ""} );
	}
	else{
		var designation = req.cookies.designation.toString();
		res.render("landing", { currentUser: req.cookies.username, designation: designation} );
	}
});

//SHOW REGISTER FORM
router.get("/register",function(req,res){
	if(req.cookies.username != null && req.cookies.username.toString() != "")  {
		res.redirect("/");
		return;
	}
    res.render("register", { currentUser: req.cookies.username, designation: ""} );
});

//HANDLE SIGN UP
router.post("/register",function(req,res){
	if(req.cookies.username != null && req.cookies.username.toString() != "")  {
		res.redirect("/");
		return;
	}

	var username = req.body.username;
	var password = req.body.password;
	var email = req.body.email;
	var contact = req.body.contact;
	var address = req.body.address;
	var aboutus = req.body.aboutus;
	var mid = "";
	var mkey = "";
	var designation = req.body.designation;
	var file = null;
    if (req.files) {
        file = req.files.profilepic;
    }

	var getTimeStampString = null;
    if (file != null) {
        getTimeStampString = new Date().getTime().toString();
        var saveFilePath = "./public/ContractorProfile/" + getTimeStampString;
        file.mv(saveFilePath, function (err) {
            if (err) {
                res.redirect("/register");
                return;
            } else {
                console.log("File uploaded successfully");
            }
        });
    }

	const requestData = JSON.stringify({
		"username": username.toString(),
		"password": password.toString(),
		"email": email.toString(),
		"contact": contact.toString(),
		"address": address.toString(),
		"aboutUs": aboutus.toString(),
		"mid": mid.toString(),
		"mkey": mkey.toString(),
		"profilepic": getTimeStampString,
		"designation": designation
	});

	console.log(requestData);

	var options = {
		host: 'localhost',
		port: '3000',
		path:'/contractors/users/signup',
		method: 'POST',
		headers: {
	        'Content-Type': 'application/json',
		    'Content-Length': requestData.length
        },
		// json: requestData
	}

	callback = function(response) {
		var str = '';
		//another chunk of data has been received, so append it to `str`
	  	response.on('data', function (chunk) {
	    	str += chunk;
	  	});

	  	//the whole response has been received, so we just print it out here
	  	response.on('end', function () {
	    	console.log(str);
	    	const jsonObject = JSON.parse(str);
	    	if(jsonObject.success == false) {
	    		console.log("Failed");
	    		res.redirect('/register');
	    	} else {
	    		res.cookie("username", username.toString());
				res.cookie("password", password.toString());
				res.cookie("designation", designation.toString());
	    		res.redirect('/');
	    	}
	  	});
	}

	var request = http.request(options, callback);
	request.write(requestData);
	request.end();
});

//SHOW LOGIN FORM
router.get("/login", function(req,res){
	if(req.cookies.username != null && req.cookies.username.toString() != "") {
		res.redirect("/");
		return;
	}
	var designation = "";
    res.render("login", { currentUser: req.cookies.username, designation: designation});
})

//HANDLE LOGIN
router.post("/login", function(req,res){
	if(req.cookies.username != null && req.cookies.username.toString() != "")  {
		res.redirect("/");
		return;
	}
	var username = req.body.username;
	var password = req.body.password;

	const requestData = JSON.stringify({
		"username": username.toString(),
		"password": password.toString()
	});

	var options = {
		host: 'localhost',
		port: '3000',
		path:'/contractors/users/login',
		method: 'POST',
		headers: {
	        'Content-Type': 'application/json',
		    'Content-Length': requestData.length
        },
	}

	callback = function(response) {
		var str = '';
		//another chunk of data has been received, so append it to `str`
	  	response.on('data', function (chunk) {
	    	str += chunk;
	  	});

	  	//the whole response has been received, so we just print it out here
	  	response.on('end', function () {
	    	console.log(str);
			const jsonObject = JSON.parse(str);
	    	if(jsonObject.success == "false" || jsonObject.success == false) {
	    		res.redirect('/login');
	    	} else {
	    		res.cookie("username", username.toString());
				res.cookie("password", password.toString());
				res.cookie("designation", jsonObject.designation.toString());
	    		res.redirect('/');
	    	}
	  	});
	}

	var request = http.request(options, callback);
	request.write(requestData);
	request.end();
})

router.get("/download/:path", function (req, res) {
	var filePath = "../nodeserver/brochureUpload/" + req.params.path.toString();
    var getTimeStampString = new Date().getTime().toString();
	var fileName = getTimeStampString + ".pdf"; // The default name the browser will use
	res.setHeader("Content-Type", "application/pdf");
	res.download(filePath, fileName);
});

router.get("/logout",function(req,res){
    res.cookie("username", "");
    res.cookie("password", "");
    res.redirect("/");
});

router.get("/cookies", function(req,res){
	res.send(req.cookies);
});

module.exports = router;
