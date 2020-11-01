var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const utility=require(path.join(__dirname,'utilities.js'));

const cors = require('../../cors');

router.use(bodyParser.json());

router.options('*', cors.corsWithOptions, (req, res) => { res.sendStatus(200); });

router.post('/email', async function(req, res, next) {
    await utility.sendEmail(req.body.emailId,req.body.subject,req.body.message);
});

module.exports = router;