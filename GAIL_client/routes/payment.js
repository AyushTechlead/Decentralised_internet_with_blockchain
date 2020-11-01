var express = require("express");
var router = express.Router({mergeParams: true});
var http = require('http');
var url=require('url');
var cookieParser = require('cookie-parser');
const { mkdir } = require("fs");

//need mid,value,merchantKey
router.get("/payment", function(req,res){
    console.log("hello");
    if (req.cookies.username == null || req.cookies.username.toString() == "") {
        res.redirect("/login");
        return;
    }
    var username = req.cookies.username.toString();
    const queryObject = url.parse(req.url,true).query;

    const orderId=(new Date()).getTime().toString()+"_"+queryObject.mid;
    console.log(orderId);

    var actionUrl="https://securegw-stage.paytm.in/theia/api/v1/showPaymentPage?mid="+queryObject.mid+"&orderId="+orderId;
    console.log(actionUrl);

    const requestData = JSON.stringify({
        "mid":queryObject.mid,
        "orderId":orderId,
        "value":queryObject.value,
        "merchantKey":queryObject.merchantKey
    });

    var options = {
        host: 'localhost',
        port: '3000',
        path: '/payment/initiateTransaction',
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
            if (jsonObject.body.resultInfo.resultMsg == "Success") {
                res.render("payment/payment", { currentUser:username,actionUrl: actionUrl ,mid:queryObject.mid ,orderId:orderId,txnToken:jsonObject.body.txnToken, designation: req.cookies.designation});
            }
        });
    }
    var request = http.request(options, callback);
    request.write(requestData);
    request.end();


});
router.post("/payment/result", function (req, res) {
    console.log(req.body);
    res.send(req.body);
    // res.redirect("payment/showTransation", {details: req.body});
});

module.exports = router;
