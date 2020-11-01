var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
const FabricCAServices = require('fabric-ca-client');
const { Wallets, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');

const utility = require(path.join(__dirname, 'utilities.js'));

const cors = require('../../cors');
router.use(bodyParser.json());

router.options('*', cors.corsWithOptions, (req, res) => { res.sendStatus(200); });


router.post('/', async function (req, res, next) {
    const authCheck = await utility.authenticate(req.body.username, req.body.password);
    if (authCheck == false) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'application/json');
        res.json({
            success: false,
            message: 'You dont have permission to access this page!!'
        });
    }
    else {
        const contractor = await utility.getUser(req.body.username, req.body.password);
        if (contractor['activeProjectID'] == null) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.json({
                success: false,
                message: 'Contractor has no allocated project'
            });
        }
        else {
            const project = await utility.getProject(contractor['activeProjectID']);
            if (project == null) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.json({
                    success: false,
                    message: 'Invalid project id found'
                });
            }
            else {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(project);
            }

        }
    }
});

// router.post('/getBidDetails', async function(req, res, next) {
//     const dictionary=JSON.parse(fs.readFileSync(path.resolve(__dirname,'dictionaryBid.json'), 'utf8'));
//     if(dictionary.hasOwnProperty(req.body.id)){
//         var bidDetails=dictionary[req.body.id];
//         res.statusCode = 200;
//         res.setHeader('Content-Type', 'application/json');
//         res.json({
//             success: true,
//             message: 'Successfully get bid details',
//             bidDetails: bidDetails
//         });
//     }else{
//         res.statusCode = 400;
//         res.setHeader('Content-Type', 'application/json');
//         res.json({
//             success: false,
//             message: 'No such bid id exists'
//         });
//     }
// });

router.post('/updateProjectStatus', async function (req, res, next) {
    const authCheck = await utility.authenticate(req.body.username, req.body.password);
    if (authCheck == false) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'application/json');
        res.json({
            success: false,
            message: 'You dont have permission to access this page!!'
        });
    }
    else {
        const contractor = await utility.getUser(req.body.username, req.body.password);
        if (contractor['activeProjectID'] == null) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.json({
                success: false,
                message: 'Contractor has no allocated project'
            });
        }
        else {
            var gateway = await utility.getGailGateway();
            // Get the network (channel) our contract is deployed to.
            var network = await gateway.getNetwork('channelgg');
            // Get the contract from the network.
            var contract = network.getContract('gail', 'Project');
            await contract.submitTransaction('updateProjectStatus', contractor['activeProjectID'], req.body.status);
            await gateway.disconnect();

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json({
                success: true,
                message: 'Successfully updated project status'
            });

        }
    }
});

router.post('/updateProjectStatusByID', async function (req, res, next) {
    var gateway = await utility.getGailGateway();
    // Get the network (channel) our contract is deployed to.
    var network = await gateway.getNetwork('channelgg');
    // Get the contract from the network.
    var contract = network.getContract('gail', 'Project');
    await contract.submitTransaction('updateProjectStatus', req.body.id, req.body.status);
    await gateway.disconnect();

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json({
        success: true,
        message: 'Successfully updated project status'
    });
});

router.post('/updateProjectProgressByID', async function (req, res, next) {
    var gateway = await utility.getGailGateway();
    // Get the network (channel) our contract is deployed to.
    var network = await gateway.getNetwork('channelgg');
    // Get the contract from the network.
    var contract = network.getContract('gail', 'Project');
    var timestamp = (new Date()).getTime().toString();
    console.log(req.body.id);
    console.log(req.body.description);
    console.log(timestamp);

    await contract.submitTransaction('updateProjectProgress', req.body.id, req.body.description, timestamp);
    await gateway.disconnect();

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.json({
        success: true,
        message: 'Successfully updated project status'
    });
});


router.post('/updateProjectProgress', async function (req, res, next) {
    const authCheck = await utility.authenticate(req.body.username, req.body.password);
    if (authCheck == false) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'application/json');
        res.json({
            success: false,
            message: 'You dont have permission to access this page!!'
        });
    }
    else {
        const contractor = await utility.getUser(req.body.username, req.body.password);
        if (contractor['activeProjectID'] == null) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.json({
                success: false,
                message: 'Contractor has no allocated project'
            });
        }
        else {
            var gateway = await utility.getGailGateway();
            // Get the network (channel) our contract is deployed to.
            var network = await gateway.getNetwork('channelgg');
            // Get the contract from the network.
            var contract = network.getContract('gail', 'Project');
            var timestamp = (new Date()).getTime().toString();
            await contract.submitTransaction('updateProjectProgress', contractor['activeProjectID'], req.body.description, timestamp);
            await gateway.disconnect();
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json({
                success: true,
                message: 'Successfully updated project progress'
            });
        }
    }
});
module.exports = router;
