var express = require("express");
var router = express.Router({ mergeParams: true });
var http = require('http');
var cookieParser = require('cookie-parser');


router.get('/floated', function (req, res) {
    if (req.cookies.username == null || req.cookies.username.toString() == "") {
        res.redirect("/login");
        return;
    }

    var username = req.cookies.username.toString();
    var password = req.cookies.password.toString();
    var designation = req.cookies.designation.toString();
    const requestData = JSON.stringify({
        "username": username,
        "password": password,
    });

    var options = {
        host: 'localhost',
        port: '3000',
        path: '/gail/project/getAllProjects',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': requestData.length
        }
    }

    const requestData2 = JSON.stringify({
        "username": username,
        "password": password
    });

    var options2 = {
        host: 'localhost',
        port: '3000',
        path: '/contractors/users/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': requestData2.length
        }
    }

    callback = function (response) {
        var str = '';
        //another chunk of data has been received, so append it to `str`
        response.on('data', function (chunk) {
            str += chunk;
        });

        //the whole response has been received, so we just print it out here
        response.on('end', function () {
            const jsonObject = JSON.parse(str);
            console.log("All Projects");
            if (jsonObject.success == true) {
                callback2 = function(response){

                    var str = '';
                    //another chunk of data has been received, so append it to `str`
                    response.on('data', function (chunk) {
                        str += chunk;
                    });

                    response.on('end', function () {
                        const jsonObject2 = JSON.parse(str);
                        if(jsonObject2.activeProjectID != null){
                            res.redirect("/");
                        }
                        else{
                            const requestData3 = JSON.stringify({
                                "id": username,
                            });
                            var options3 = getOptions('/gail/project/getAllContractorsForProjects', requestData3);
                            callback3 = function (response3) {
                                var str3 = '';
                                //another chunk of data has been received, so append it to `str`
                                response3.on('data', function (chunk) {
                                    str3 += chunk;
                                });
                        
                                //the whole response has been received, so we just print it out here
                                response3.on('end', function () {
                                    const jsonObject3 = JSON.parse(str3);
                                    console.log(jsonObject3.relation);
                                    res.render("projects/floatedprojects", { projects: jsonObject.allProjects, currentUser: req.cookies.username, designation: designation, relation: jsonObject3.relation });
                                });
                            }            
            
                            runHttpRequest(options3, callback3, requestData3);
                        }
                    });
                }
                var request = http.request(options2, callback2);
                request.write(requestData2);
                request.end();
            }
        });
    }
    var request = http.request(options, callback);
    request.write(requestData);
    request.end();
});

router.get('/apply', function (req, res) {
    if (req.cookies.username == null || req.cookies.username.toString() == "") {
        res.redirect("/");
        return;
    }

    var projectID = req.query.id.toString();

    const requestData = JSON.stringify({
        "id": projectID
    });

    var options = {
        host: 'localhost',
        port: '3000',
        path: '/gail/project/getProject',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': requestData.length
        }
    }

    callback = function (response) {
        var str = '';
        //another chunk of data has been received, so append it to `str`
        response.on('data', function (chunk) {
            str += chunk;
        });

        //the whole response has been received, so we just print it out here
        response.on('end', function () {
            const jsonObject = JSON.parse(str);
            res.render("projects/applybid", {
                project: jsonObject.object,
                projectID: projectID,
                currentUser: req.cookies.username
            });
        });
    }
    var request = http.request(options, callback);
    request.write(requestData);
    request.end();
});

router.post('/apply', function (req, res) {
    if (req.cookies.username == null || req.cookies.username.toString() == "") {
        res.redirect("/login");
        return;
    }

    var username = req.cookies.username.toString();
    var password = req.cookies.password.toString();

    var id = req.body.id.toString();
    var time_period = req.body.time_period.toString();

    var isoArr = [];
    for (var i = 1; ; i++) {
        if (req.body['iso' + i.toString()] != null) {
            isoArr.push(req.body['iso' + i.toString()]);
        }
        else {
            break;
        }
    }

    var itemArr = [];
    var totalPrice = 0;
    for (var i = 1; ; i++) {
        if (req.body['price' + i.toString()] != null) {
            var price = req.body['price'+i.toString()];
            var tax = req.body['tax'+i.toString()];
            var quantity = req.body['quantity'+i.toString()];
            itemArr.push({
                'item': req.body['item'+i.toString()].toString(),
                'quantity': quantity.toString(),
                'price': price.toString(),
                'tax': tax.toString()
            });
            totalPrice += quantity*(price*1+tax*1);
        }
        else {
            break;
        }
    }

    var file = null;
    if (req.files) {
        file = req.files.brochure;
    }
    else {
        redirect('/projects/floated');
        return;
    }

    var getTimeStampString = null;
    if (file != null) {
        getTimeStampString = new Date().getTime().toString();
        var saveFilePath = "../nodeserver/BidBrochure/" + getTimeStampString;
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
        "username": username,
        "password": password,
        "projectID": id,
        "bidDetails": {
            "price": totalPrice,
            "time_period": time_period,
            "standards": isoArr,
            "brochurePath": getTimeStampString,
            "itemArr": itemArr
        }
    });

    var options = {
        host: 'localhost',
        port: '3000',
        path: '/contractors/bids/applyForProject',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': requestData.length
        }
    }

    callback = function (response) {
        var str = '';
        //another chunk of data has been received, so append it to `str`
        response.on('data', function (chunk) {
            str += chunk;
        });

        //the whole response has been received, so we just print it out here
        response.on('end', function () {
            const jsonObject = JSON.parse(str);
            if (jsonObject.success == true) {
                res.redirect('/projects/floated');
            }
        });
    }
    var request = http.request(options, callback);
    request.write(requestData);
    request.end();
});

router.get('/allocated', function (req, res) {
    if (req.cookies.username == null || req.cookies.username.toString() == "") {
        res.redirect("/");
        return;
    }

    var username = req.cookies.username.toString();
    var password = req.cookies.password.toString();
    var designation = req.cookies.designation.toString();

    const requestData = JSON.stringify({
        username: username,
        password: password
    });

    var options = {
        host: 'localhost',
        port: '3000',
        path: '/contractors/project',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': requestData.length
        }
    }

    var contractorID = req.cookies.username.toString();

    callback = function (response) {
        var str = '';
        //another chunk of data has been received, so append it to `str`
        response.on('data', function (chunk) {
            str += chunk;
        });

        //the whole response has been received, so we just print it out here
        response.on('end', function () {
            const jsonObject = JSON.parse(str);
            var requestData2 = JSON.stringify({
            });
            var options2 = getOptions('/contractors/users/' + contractorID, requestData2);
            var callback2 = function (response2) {
                var str2 = '';
                response2.on('data', function (chunk) {
                    str2 += chunk;
                });

                response2.on('end', function () {
                    const jsonObject2 = JSON.parse(str2); //coressponding to the contractor details
                    console.log("Contractor Details: " + str2);

                    if (jsonObject2.success == false) {
                        console.log("Failed");
                        res.redirect('/projects/allocated');
                    } else {
                        if (jsonObject2.object.designation == "contractor") {
                            if (jsonObject.success == false) {
                                console.log("HSJV");
                                res.render("projects/allocated", {
                                    project: null,
                                    currentUser: req.cookies.username,
                                    designation: designation
                                });
                            } else {
                                res.render("projects/allocated", {
                                    project: jsonObject,
                                    currentUser: req.cookies.username,
                                    contractor_details: jsonObject2.object,
                                    designation: designation
                                });
                            }

                        } else {
                            const requestData3 = JSON.stringify({
                            });

                            var options3 = getOptions('/gail/project/getAllProjects', requestData3);

                            callback3 = function (response3) {
                                var str3 = '';
                                response3.on('data', function (chunk) {
                                    str3 += chunk;
                                });

                                response3.on('end', function () {
                                    var jsonObject3 = JSON.parse(str3);
                                    console.log("CHIRAG");
                                    console.log(str3);
                                    if (jsonObject3.success == true) {
                                        res.render("projects/allocated", {
                                            project: jsonObject,
                                            currentUser: req.cookies.username,
                                            contractor_details: jsonObject2.object,
                                            allProjects: jsonObject3.allProjects,
                                            designation: designation
                                        });
                                    }
                                });
                            }
                            runHttpRequest(options3, callback3, requestData3);
                        }

                    }
                });
            }

            runHttpRequest(options2, callback2, requestData2);
        });
    }

    runHttpRequest(options, callback, requestData);
});

router.get('/details', function (req, res) {
    if (req.cookies.username == null || req.cookies.username.toString() == "") {
        res.redirect("/");
    }

    var id = req.query.id.toString();
    const requestData = JSON.stringify({
        id: id
    });

    var contractorID = req.cookies.username.toString();
    var options = getOptions('/gail/project/getProject', requestData);


    callback = function (response) {
        var str = '';
        //another chunk of data has been received, so append it to `str`
        response.on('data', function (chunk) {
            str += chunk;
        });

        //the whole response has been received, so we just print it out here
        response.on('end', function () {
            const jsonObject = JSON.parse(str);
            var requestData2 = JSON.stringify({
            });
            var options2 = getOptions('/contractors/users/' + contractorID, requestData2);

            var callback2 = function (response2) {
                var str2 = '';
                response2.on('data', function (chunk) {
                    str2 += chunk;
                });

                response2.on('end', function () {
                    const jsonObject2 = JSON.parse(str2); //coressponding to the bid details
                    console.log("Contractor Details: " + str2);
                    if (jsonObject2.success == false) {
                        console.log("Failed");
                        res.redirect('/projects/allocated');
                    } else {
                        res.render("projects/projectdetails", {
                            currentUser: req.cookies.username,
                            project: jsonObject.object,
                            projectID: id,
                            progress: jsonObject.object.progress,
                            contractor_details: jsonObject2.object,
                            designation: req.cookies.designation
                        });
                    }
                });
            }
            runHttpRequest(options2, callback2, requestData2);
        });
    }

    runHttpRequest(options, callback, requestData);
});

router.post('/details', function (req, res) {
    if (req.cookies.username == null || req.cookies.username.toString() == "") {
        res.redirect("/");
        return;
    }

    var username = req.cookies.username.toString();
    var password = req.cookies.password.toString();

    var status = req.body.status.toString();
    var id = req.body.id.toString();

    const requestData = JSON.stringify({
        username: username,
        password: password,
        status: status,
        id: id
    });

    var options = {
        host: 'localhost',
        port: '3000',
        path: '/contractors/project/updateProjectStatusByID',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': requestData.length
        }
    }

    callback = function (response) {
        var str = '';
        //another chunk of data has been received, so append it to `str`
        response.on('data', function (chunk) {
            str += chunk;
        });

        //the whole response has been received, so we just print it out here
        response.on('end', function () {
            const jsonObject = JSON.parse(str);
            if(status == "in-pre-review") {
                res.redirect('/projects/allocated');
            } else {
                res.redirect('/projects/details?id=' + id);
            }
        });
    }
    var request = http.request(options, callback);
    request.write(requestData);
    request.end();
});

router.get('/progress', function (req, res) {
    if (req.cookies.username == null || req.cookies.username.toString() == "") {
        res.redirect("/");
    }

    var id = req.query.id;

    var username = req.cookies.username.toString();
    res.render("projects/updateprogress", {
        projectID: id,
        currentUser: req.cookies.username
    });
});

router.post('/progress', function (req, res) {
    if (req.cookies.username == null || req.cookies.username.toString() == "") {
        res.redirect("/");
        return;
    }

    var username = req.cookies.username.toString();
    var password = req.cookies.password.toString();
    var description = req.body.description.toString();
    var id = req.body.id.toString();

    const requestData = JSON.stringify({
        "username": username,
        "password": password,
        "description": description,
        "id": id
    });

    var options = {
        host: 'localhost',
        port: '3000',
        path: '/contractors/project/updateProjectProgressByID',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': requestData.length
        }
    }

    callback = function (response) {
        var str = '';
        //another chunk of data has been received, so append it to `str`
        response.on('data', function (chunk) {
            str += chunk;
        });

        //the whole response has been received, so we just print it out here
        response.on('end', function () {
            res.redirect('/projects/details?id=' + id);
        });
    }
    var request = http.request(options, callback);
    request.write(requestData);
    request.end();
});

router.get('/completed', function (req, res) {
    if (req.cookies.username == null || req.cookies.username.toString() == "") {
        res.redirect("/login");
    }

    var username = req.cookies.username.toString();
    var password = req.cookies.password.toString();
    var designation = req.cookies.designation.toString();

    const requestData = JSON.stringify({
        "username": username,
        "password": password,
    });

    var options = {
        host: 'localhost',
        port: '3000',
        path: '/contractors/users/getCompletedProjects',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': requestData.length
        }
    }

    callback = function (response) {
        var str = '';
        //another chunk of data has been received, so append it to `str`
        response.on('data', function (chunk) {
            str += chunk;
        });

        //the whole response has been received, so we just print it out here
        response.on('end', function () {
            const jsonObject = JSON.parse(str);
            console.log(jsonObject);
            if (jsonObject.success == true) {
                res.render("projects/completed", {
                    projects: jsonObject.allProjects, currentUser: req.cookies.username,
                    designation: designation
                });
            }
        });
    }
    var request = http.request(options, callback);
    request.write(requestData);
    request.end();
});

router.get('/completed/details', function (req, res) {
    if (req.cookies.username == null || req.cookies.username.toString() == "") {
        res.redirect("/");
    }

    var username = req.cookies.username;
    var password = req.cookies.password;
    var id = req.query.id.toString();

    const requestData = JSON.stringify({
        username: username,
        password: password
    });

    var options = {
        host: 'localhost',
        port: '3000',
        path: '/contractors/users/getCompletedProjects',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': requestData.length
        }
    }

    callback = function (response) {
        var str = '';
        //another chunk of data has been received, so append it to `str`
        response.on('data', function (chunk) {
            str += chunk;
        });

        //the whole response has been received, so we just print it out here
        response.on('end', function () {
            const jsonObject = JSON.parse(str);
            var projectDetails = JSON.parse(jsonObject.allProjects[id]);
            res.render("projects/completedetails", {
                currentUser: req.cookies.username,
                project: projectDetails,
                projectID: id,
                progress: projectDetails.progress,
                evaluation_review: JSON.parse(projectDetails.evaluation_review)
            });
        });
    }
    var request = http.request(options, callback);
    request.write(requestData);
    request.end();
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
