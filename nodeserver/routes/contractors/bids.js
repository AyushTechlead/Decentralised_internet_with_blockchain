var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
const FabricCAServices = require('fabric-ca-client');
const { Wallets, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');

const utility=require(path.join(__dirname,'utilities.js'));

const cors = require('../../cors');
router.use(bodyParser.json());

router.options('*', cors.corsWithOptions, (req, res) => { res.sendStatus(200); });

router.post('/applyForProject', async function(req, res, next) {
    const authCheck=await utility.authenticate(req.body.username,req.body.password);
    if(authCheck==false)
    {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'application/json');
        res.json({
            success: false,
            message: 'You dont have permission to access this page!!'
        });
    }
    else{
        const contractor=await utility.getUser(req.body.username,req.body.password);
        console.log(contractor);
        if(contractor['activeProjectID']!=null)
        {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.json({
                success: false,
                message: 'Contractor already has an allocated project'
            });
        }
        else {
            const checkProject=await utility.getProject(req.body.projectID)
            if(checkProject==null) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.json({
                    success: false,
                    message: 'No project of this project id found'
                });
            }
            else{
                // Create a new gateway for connecting to our peer node.
                var gateway = await utility.getGailGateway();
                // Get the network (channel) our contract is deployed to.
                var network = await gateway.getNetwork('channelgg');
                // Get the contract from the network.
                var contract = network.getContract('gail', 'Bid');
                var bidID=(new Date()).getTime().toString();
                await contract.submitTransaction('applyForProject', req.body.username, req.body.projectID,JSON.stringify(req.body.bidDetails),bidID);
                await gateway.disconnect();

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json({
                    success: true,
                    message: 'Successfully Bid',
                    bidID:bidID.toString()
                });
            }
        }
    }
});
module.exports=router;
