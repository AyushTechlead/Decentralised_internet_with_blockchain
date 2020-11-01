var express = require("express");
var router = express.Router({ mergeParams: true });
var http = require("http");
var cookieParser = require("cookie-parser");
var download = require('download');


router.get("/", function (req, res) {
	var designation = req.cookies.designation;
	res.render("landing", { currentUser: req.cookies.username, designation: designation });
});

//SHOW REGISTER FORM
router.get("/register", function (req, res) {
	if (req.cookies.username != null && req.cookies.username.toString() != "") {
		res.redirect("/");
		return;
	}
	res.render("register", { currentUser: req.cookies.username });
});

//HANDLE SIGN UP
router.post("/register", function (req, res) {
	var username = req.body.username;
	var password = req.body.password;
	var email = req.body.email;
	var name = req.body.name;
	var designation = req.body.designation;

	if (req.cookies.username != null && req.cookies.username.toString() != "") {
		res.redirect("/");
		return;
	}

	const requestData = JSON.stringify({
		username: username.toString(),
		password: password.toString(),
		email: email.toString(),
		name: name.toString(),
		contact: "",
		teamname: "",
		profilePic: "",
		address: "",
		designation: designation.toString()
	});

	var options = {
		host: "localhost",
		port: "3000",
		path: "/gail/users/signup",
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Content-Length": requestData.length,
		},
		// json: requestData
	};

	callback = function (response) {
		var str = "";
		//another chunk of data has been received, so append it to `str`
		response.on("data", function (chunk) {
			str += chunk;
		});

		//the whole response has been received, so we just print it out here
		response.on("end", function () {
			console.log(str);
			const jsonObject = JSON.parse(str);
			if (jsonObject.success == false) {
				console.log("Failed");
				res.redirect("/register");
			} else {
				res.cookie("username", username.toString());
				res.cookie("password", password.toString());
				res.cookie("designation", designation.toString());
				res.redirect("/");
			}
		});
	};

	var request = http.request(options, callback);
	request.write(requestData);
	request.end();
});

//SHOW LOGIN FORM
router.get("/login", function (req, res) {
	if (req.cookies.username != null && req.cookies.username.toString() != "") {
		res.redirect("/");
		return;
	}
	res.render("login", { currentUser: req.cookies.username });
});

//HANDLE LOGIN
router.post("/login", function (req, res) {
	if (req.cookies.username != null && req.cookies.username.toString() != "") {
		res.redirect("/");
		return;
	}
	var username = req.body.username;
	var password = req.body.password;

	const requestData = JSON.stringify({
		username: username.toString(),
		password: password.toString(),
	});

	var options = getOptions('/gail/users/login', requestData);

	callback = function (response) {
		var str = "";
		response.on("data", function (chunk) {
			str += chunk;
		});

		response.on("end", function () {
			console.log(str);
			const jsonObject = JSON.parse(str);
			if (jsonObject.success == false) {
				res.redirect("/login");
			} else {
				res.cookie("username", username.toString());
				res.cookie("password", password.toString());
				res.cookie("designation", jsonObject.designation.toString());
				res.redirect("/");
			}
		});
	};

    runHttpRequest(options, callback, requestData);
});

router.get("/logout", function (req, res) {
	res.cookie("username", "");
	res.cookie("password", "");
	res.cookie("designation", "");
	res.redirect("/");
});

router.get("/cookies", function (req, res) {
	res.send(req.cookies);
});

router.get("/download/:path", function (req, res) {
	var filePath = "../nodeserver/brochureUpload/" + req.params.path.toString();
    var getTimeStampString = new Date().getTime().toString();
	var fileName = getTimeStampString + ".pdf"; // The default name the browser will use
	res.setHeader("Content-Type", "application/pdf");
	res.download(filePath, fileName);
});

router.get("/download2/:path", function (req, res) {
	var filePath = "../nodeserver/BidBrochure/" + req.params.path.toString();
    var getTimeStampString = new Date().getTime().toString();
	var fileName = getTimeStampString + ".pdf"; // The default name the browser will use
	res.setHeader("Content-Type", "application/pdf");
	res.download(filePath, fileName);
});

router.get("/editprofile", function(req,res){
	if (req.cookies.username == null || req.cookies.username.toString() == "") {
		res.redirect("/login");
		return;
	}

	var username = req.cookies.username.toString();
    var password = req.cookies.password.toString();
    const requestData = JSON.stringify({
        "username": username,
        "password": password,
	});

	var options = getOptions('/gail/users/getUserDetails', requestData);

	callback = function (response) {
        var str = '';
        response.on('data', function (chunk) {
            str += chunk;
        });
        response.on('end', function () {
            const jsonObject = JSON.parse(str);
            if (jsonObject.success == false) {
                res.redirect('/');
            } else {
				res.render("editProfile", { currentUser: req.cookies.username, user: jsonObject.object, designation: req.cookies.designation });
            }
        });
    }

    runHttpRequest(options, callback, requestData);
});

router.post("/editprofile", function (req, res) {

	if (req.cookies.username == null || req.cookies.username.toString() == "") {
		res.redirect("/login");
		return;
	}

	var username = req.cookies.username.toString();
    var password = req.cookies.password.toString();
	var email = req.body.email;
	var name = req.body.name;
	var contact = req.body.contact;
	var teamname = req.body.teamname;
	var address = req.body.address;
	var designation = req.body.designation;

	const requestData = JSON.stringify({
		username: username.toString(),
		password: password.toString(),
		email: email.toString(),
		name: name.toString(),
		contact: contact.toString(),
		teamname: teamname.toString(),
		profilePic: "",
		address: address.toString(),
		designation: designation.toString()
	});

	var options = getOptions("/gail/users/editUserDetails", requestData);

	callback = function (response) {
		var str = "";
		response.on("data", function (chunk) {
			str += chunk;
		});

		response.on("end", function () {
			console.log(str);
			const jsonObject = JSON.parse(str);
			if (jsonObject.success == false) {
				console.log("Unable to Edit Profile");
				res.redirect("/editprofile");
			} else {
				res.redirect("/editprofile");
			}
		});
	};

	runHttpRequest(options, callback,requestData);
});

function getOptions(pathTemp, requestDataTemp) {
    return {
        host: 'localhost',
        port: '3000',
        path: pathTemp,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': requestDataTemp.length
        }
    };
}

function runHttpRequest(options, callback, requestData) {
    var request = http.request(options, callback);
    request.write(requestData);
    request.end();
}

module.exports = router;
