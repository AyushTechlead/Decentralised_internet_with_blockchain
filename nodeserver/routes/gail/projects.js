var express = require('express');
var app = express();
var router = express.Router();
const bodyParser = require('body-parser');
const FabricCAServices = require('fabric-ca-client');
const { Wallets, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const utility = require(path.join(__dirname, 'utilities.js'));

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));

const cors = require('../../cors');

router.use(bodyParser.json());

router.options('*', cors.corsWithOptions, (req, res) => { res.sendStatus(200); });

router.post('/', async function (req, res, next) {
    console.log("Checking");
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.json({
        success: false,
        message: 'You dont have permission to access this page'
    });
});

router.post('/createProject', async function (req, res, next) {

    const ccpPath = path.resolve(__dirname, '..', '..', '..', 'fabric', 'test-network', 'organizations',
        'peerOrganizations', 'gail.example.com', 'connection-gail.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const identity = await wallet.get(req.body.username);

    if (!identity) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.json({
            success: false,
            message: 'You dont have permission to access this page'
        });
    }
    else {
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet, identity: req.body.username,
            discovery: { enabled: true, asLocalhost: true }
        });

        const network = await gateway.getNetwork('channelgg');

        const contract = network.getContract('gail', 'User');

        const user = await contract.evaluateTransaction('getUser', req.body.username, req.body.password);
        const jsonObj = JSON.parse(user.toString());
        console.log(jsonObj.success);
        await gateway.disconnect();

        if (jsonObj.success == "false") {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.json({
                success: false,
                message: 'You dont have permission to access this page!!'
            });
        }
        else {
            //correct username and password, proceed further to create new project
            const gateway = new Gateway();
            await gateway.connect(ccp, {
                wallet, identity: req.body.username,
                discovery: { enabled: true, asLocalhost: true }
            });
            const network = await gateway.getNetwork('channelgg');
            const contract = network.getContract('gail', 'Project');
            const numProjectsPrev = await contract.evaluateTransaction('getNumProjects');
            if ("message" in numProjectsPrev) {
                await contract.submitTransaction('createNumProjects', 0);
            }
            await contract.submitTransaction('incrementNumProjects', 1);
            const numProjectsCurr = await contract.evaluateTransaction('getNumProjects');
            const numProjectsCurrJson = JSON.parse(numProjectsCurr.toString());
            const autoGeneratedProjectID = numProjectsCurrJson.num;
            var brouchurePath = req.body.brochurePath;
            if (req.body.brochurePath == null) {
                brouchurePath = "null";
            }
            var type = 'Product';
            if ("type" in req.body) {
                type = req.body.type;
            }
            await contract.submitTransaction('createProject', req.body.username, autoGeneratedProjectID,
                req.body.title, req.body.description, req.body.currentTime, req.body.deadlineTime, brouchurePath, type, "");
            await gateway.disconnect();

            res.json({
                success: true,
                message: 'Successfully created a new Project '
            });

        }
    }


});

router.post('/getProject', async function (req, res, next) {
    const ccpPath = path.resolve(__dirname, '..', '..', '..', 'fabric', 'test-network', 'organizations',
        'peerOrganizations', 'gail.example.com', 'connection-gail.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check to see if we've already enrolled the user.
    const identity = await wallet.get('admin');
    if (!identity) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.json({
            success: false,
            message: 'GAIL Admin should be registered first'
        });
    }
    else {
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet, identity: 'admin',
            discovery: { enabled: true, asLocalhost: true }
        });

        // Get the network (channel) our contract is deployed to.

        const network = await gateway.getNetwork('channelgg');
        const contract = network.getContract('gail', 'Project');
        const getProj = await contract.evaluateTransaction('getProject', req.body.id);
        const jsonObj = JSON.parse(getProj.toString());
        console.log("Project Creation: " + jsonObj.success);
        await gateway.disconnect();
        const project = JSON.parse(getProj.toString());
        if ("message" in project) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.json({
                success: false,
                message: 'No project of project id-' + req.body.id + ' found.'
            });
        }
        else {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json({
                success: true,
                message: 'Succesfully got project of id-' + project.id,
                object: jsonObj
            });
        }
    }
});

router.post('/getAllProjects', async function (req, res, next) {
    const ccpPath = path.resolve(__dirname, '..', '..', '..', 'fabric', 'test-network', 'organizations',
        'peerOrganizations', 'gail.example.com', 'connection-gail.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check to see if we've already enrolled the user.
    const identity = await wallet.get('admin');
    if (!identity) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.json({
            success: false,
            message: 'GAIL Admin should be registered first.'
        });
    }
    else {
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet, identity: 'admin',
            discovery: { enabled: true, asLocalhost: true }
        });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('channelgg');

        // Get the contract from the network.
        const contract = network.getContract('gail', 'Project');
        var allProjects = {};
        const numProj = await contract.evaluateTransaction('getNumProjects');
        const numProjJson = JSON.parse(numProj.toString());
        console.log(numProjJson);
        if ("message" in numProjJson) {
            res.json({
                success: true,
                allProjects: allProjects
            });
        }
        else {
            for (var i = 1; i <= parseInt(numProjJson.num.toString()) + 1; i++) {
                const getProj = await contract.evaluateTransaction('getProject', i);
                const project = JSON.parse(getProj.toString());
                if ("message" in project) {
                }
                else {
                    console.log('hello' + i.toString());
                    allProjects[i.toString()] = JSON.stringify(project);
                }
            }
            res.json({
                success: true,
                allProjects: allProjects
            });
        }

    }
});

router.post('/acceptProject', async function (req, res, next) {
    const ccpPath = path.resolve(__dirname, '..', '..', '..', 'fabric', 'test-network', 'organizations',
        'peerOrganizations', 'gail.example.com', 'connection-gail.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check to see if we've already enrolled the user.
    console.log("Username: " + req.body.username);
    const identity = await wallet.get(req.body.username);
    if (!identity) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.json({
            success: false,
            message: 'You dont have permission to access this page'
        });
    }
    else {
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet, identity: req.body.username,
            discovery: { enabled: true, asLocalhost: true }
        });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('channelgg');

        // Get the contract from the network.
        const contract = network.getContract('gail', 'User');

        const user = await contract.evaluateTransaction('getUser', req.body.username, req.body.password);
        const jsonObj = JSON.parse(user.toString());
        console.log(jsonObj.success);
        await gateway.disconnect();

        if (jsonObj.success == "false") {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.json({
                success: false,
                message: 'You dont have permission to access this page!!'
            });
        }
        else {
            // correct username and password, proceed further to create new project
            const gateway = new Gateway();
            await gateway.connect(ccp, {
                wallet, identity: req.body.username,
                discovery: { enabled: true, asLocalhost: true }
            });
            const network = await gateway.getNetwork('channelgg');
            const contract = network.getContract('gail', 'Project');
            const getProj = await contract.evaluateTransaction('getProject', req.body.id);
            const project = JSON.parse(getProj.toString());
            if ("message" in project) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.json({
                    success: false,
                    message: 'No project of project id-' + req.body.id + ' found.'
                });
            }
            if (project.contractor_id == null) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.json({
                    success: false,
                    message: 'Project not yet allocated.'
                });
            }
            //updating status of project to completed_accepted.
            await contract.submitTransaction('updateProjectStatus', req.body.id, 'complete_accepted');
            const allocatedContractor = project.contractor_id.toString();

            //deallocating project for contractor.
            const constants = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'contractors', 'constants.json'), 'utf8'));
            const numGailNodes = constants['numGailNodes'];
            const ccpPath2 = path.resolve(__dirname, '..', '..', '..', 'fabric', 'test-network', 'organizations',
                'peerOrganizations', 'contractors.example.com', 'connection-contractors.json');
            const ccp2 = JSON.parse(fs.readFileSync(ccpPath2, 'utf8'));
            const gatewayContractors = new Gateway();
            await gatewayContractors.connect(ccp2, {
                wallet, identity: 'admin',
                discovery: { enabled: true, asLocalhost: true }
            });


            // Get the network (channel) our contract is deployed to.
            const dictionary = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'contractors', 'dictionary.json'), 'utf8'));
            var currChannelNum = dictionary[allocatedContractor];

            var allocatedContractorDetails;
            console.log(currChannelNum);
            for (i = 1; i < numGailNodes; i++) {
                var str = 'channelg' + i.toString() + 'c' + currChannelNum.toString();
                const networkChannel = await gatewayContractors.getNetwork(str);
                const contractChannel = networkChannel.getContract('contractors_' + i.toString() + '_' + currChannelNum.toString(), 'User');
                await contractChannel.submitTransaction('deallocateProject', allocatedContractor, req.body.rating, req.body.quality, req.body.review);

                const numPrevProjects = await contractChannel.evaluateTransaction('getNumPrevProjs', allocatedContractor);
                const currRating = await contractChannel.evaluateTransaction('getOverallRating', allocatedContractor);
                const currQuality = await contractChannel.evaluateTransaction('getProductQuality', allocatedContractor);

                var newRating = parseFloat(currRating) * (parseFloat(numPrevProjects) - 1) + parseFloat(req.body.rating);
                newRating = newRating / parseFloat(numPrevProjects);
                await contractChannel.submitTransaction('updateOverallRating', allocatedContractor, newRating.toString());

                var newQuality = parseFloat(currQuality) * (parseFloat(numPrevProjects) - 1) + parseFloat(req.body.quality);
                newQuality = newQuality / parseFloat(numPrevProjects);
                await contractChannel.submitTransaction('updateProductQuality', allocatedContractor, newQuality.toString());
                if (i == 1)
                    allocatedContractorDetails = await contractChannel.evaluateTransaction('getUserDetails', allocatedContractor);
            }
            var allocatedContractorJson = JSON.parse(allocatedContractorDetails.toString());
            await utility.sendEmail(allocatedContractorJson.email.toString(), 'Gail:Project Accepted', '<p>Dear Contractor,<br> Your work for project <b>' + project.id + '</b> has been accepted . Please visit your dashboard at GAIL website for more details.<br> Regards,<br> Gail Team</p>');
            // Disconnect from the gateway.
            await gateway.disconnect();
            await gatewayContractors.disconnect();

            res.json({
                success: true,
                message: 'Successfully accepted the project.'
            });
        }
    }


});

router.post('/rejectProject', async function (req, res, next) {
    const ccpPath = path.resolve(__dirname, '..', '..', '..', 'fabric', 'test-network', 'organizations',
        'peerOrganizations', 'gail.example.com', 'connection-gail.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check to see if we've already enrolled the user.
    console.log("Username: " + req.body.username);
    const identity = await wallet.get(req.body.username);
    if (!identity) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.json({
            success: false,
            message: 'You dont have permission to access this page'
        });
    }
    else {
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet, identity: req.body.username,
            discovery: { enabled: true, asLocalhost: true }
        });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('channelgg');

        // Get the contract from the network.
        const contract = network.getContract('gail', 'User');

        const user = await contract.evaluateTransaction('getUser', req.body.username, req.body.password);
        const jsonObj = JSON.parse(user.toString());
        console.log(jsonObj.success);
        await gateway.disconnect();

        if (jsonObj.success == "false") {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.json({
                success: false,
                message: 'You dont have permission to access this page!!'
            });
        }
        else {
            //correct username and password, proceed further to create new project
            const gateway = new Gateway();
            await gateway.connect(ccp, {
                wallet, identity: req.body.username,
                discovery: { enabled: true, asLocalhost: true }
            });
            const network = await gateway.getNetwork('channelgg');
            const contract = network.getContract('gail', 'Project');
            const getProj = await contract.evaluateTransaction('getProject', req.body.id);
            const project = JSON.parse(getProj.toString());
            if ("message" in project) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.json({
                    success: false,
                    message: 'No project of project id-' + req.body.id + ' found.'
                });
            }
            if (project.contractor_id == null) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.json({
                    success: false,
                    message: 'Project not yet allocated.'
                });
            }
            //updating status of project to completed_rejected.
            await contract.submitTransaction('updateProjectStatus', req.body.id, 'complete_rejected');
            const allocatedContractor = project.contractor_id.toString();

            //deallocating project for contractor.
            const constants = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'contractors', 'constants.json'), 'utf8'));
            const numGailNodes = constants['numGailNodes'];
            const ccpPath2 = path.resolve(__dirname, '..', '..', '..', 'fabric', 'test-network', 'organizations',
                'peerOrganizations', 'contractors.example.com', 'connection-contractors.json');
            const ccp2 = JSON.parse(fs.readFileSync(ccpPath2, 'utf8'));
            const gatewayContractors = new Gateway();
            await gatewayContractors.connect(ccp2, {
                wallet, identity: 'admin',
                discovery: { enabled: true, asLocalhost: true }
            });


            // Get the network (channel) our contract is deployed to.
            // const network2 = await gateway.getNetwork('channelgg');
            const dictionary = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'contractors', 'dictionary.json'), 'utf8'));
            // // Get the contract from the network.
            // const contract3 = network2.getContract('gail', 'User');
            // const numContractorsAsBytes = await contract3.evaluateTransaction('getNumContractors');
            // var numContractors = JSON.parse(numContractorsAsBytes.toString());
            // var curChannelNum = numContractors.numContractors;
            var currChannelNum = dictionary[allocatedContractor];

            var allocatedContractorDetails;
            console.log(currChannelNum);
            for (i = 1; i < numGailNodes; i++) {
                var str = 'channelg' + i.toString() + 'c' + currChannelNum.toString();
                const networkChannel = await gatewayContractors.getNetwork(str);
                const contractChannel = networkChannel.getContract('contractors_' + i.toString() + '_' + currChannelNum.toString(), 'User');
                await contractChannel.submitTransaction('deallocateProject', allocatedContractor, req.body.rating, req.body.quality, req.body.review);

                const numPrevProjects = await contractChannel.evaluateTransaction('getNumPrevProjs', allocatedContractor);
                const currRating = await contractChannel.evaluateTransaction('getOverallRating', allocatedContractor);
                const currQuality = await contractChannel.evaluateTransaction('getProductQuality', allocatedContractor);

                var newRating = parseFloat(currRating) * (parseFloat(numPrevProjects) - 1) + parseFloat(req.body.rating);
                newRating = newRating / parseFloat(numPrevProjects);
                await contractChannel.submitTransaction('updateOverallRating', allocatedContractor, newRating.toString());

                var newQuality = parseFloat(currQuality) * (parseFloat(numPrevProjects) - 1) + parseFloat(req.body.quality);
                newQuality = newQuality / parseFloat(numPrevProjects);
                await contractChannel.submitTransaction('updateProductQuality', allocatedContractor, newQuality.toString());
                if (i == 1)
                    allocatedContractorDetails = await contractChannel.evaluateTransaction('getUserDetails', allocatedContractor);
            }
            var allocatedContractorJson = JSON.parse(allocatedContractorDetails.toString());
            await utility.sendEmail(allocatedContractorJson.email.toString(), 'Gail:Project Rejected', '<p>Dear Contractor,<br> Your work for project <b>' + project.id + '</b> has been rejected . Please visit your dashboard at GAIL website for more details.<br> Regards,<br> Gail Team</p>');
            // Disconnect from the gateway.
            await gateway.disconnect();
            await gatewayContractors.disconnect();

            res.json({
                success: true,
                message: 'Rejected the project.'
            });
        }
    }


});

router.post('/getAllBids', async function (req, res, next) {
    const ccpPath = path.resolve(__dirname, '..', '..', '..', 'fabric', 'test-network', 'organizations',
        'peerOrganizations', 'gail.example.com', 'connection-gail.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check to see if we've already enrolled the user.
    const identity = await wallet.get('admin');
    if (!identity) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.json({
            success: false,
            message: 'GAIL Admin should be registered first'
        });
    }
    else {
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet, identity: 'admin',
            discovery: { enabled: true, asLocalhost: true }
        });

        const network = await gateway.getNetwork('channelgg');
        const contract = network.getContract('gail', 'Bid');
        const allAppliedBids = await contract.evaluateTransaction('getProjectBids', req.body.id);
        const allAppliedBidsJson = JSON.parse(allAppliedBids.toString());

        if ("message" in allAppliedBidsJson || allAppliedBidsJson.bids.length === 0) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.json({
                success: false,
                message: 'No applied bids for this project.'
            });
            await gateway.disconnect();
        } else {
            const allAppliedBidIDsArray = allAppliedBidsJson.bids;

            var finalJSON = [];
            for (var i = 0; i < allAppliedBidIDsArray.length; i++) {
                const bidID = allAppliedBidIDsArray[i];
                const getBid = await contract.evaluateTransaction('getBid', bidID);
                const getBidJson = JSON.parse(getBid.toString());
                const getJSON = { id: bidID, object: getBidJson };
                finalJSON.push(getJSON);
            }

            console.log(finalJSON);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json({
                success: true,
                allBids: finalJSON
            });
            await gateway.disconnect();
        }
    }
});

router.post('/getAllBidsContractor', async function (req, res, next) {
    const ccpPath = path.resolve(__dirname, '..', '..', '..', 'fabric', 'test-network', 'organizations',
        'peerOrganizations', 'gail.example.com', 'connection-gail.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check to see if we've already enrolled the user.
    const identity = await wallet.get('admin');
    if (!identity) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.json({
            success: false,
            message: 'GAIL Admin should be registered first'
        });
    }
    else {
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet, identity: 'admin',
            discovery: { enabled: true, asLocalhost: true }
        });

        const network = await gateway.getNetwork('channelgg');
        const contract = network.getContract('gail', 'Bid');
        const allAppliedBids = await contract.evaluateTransaction('getProjectBids', req.body.id);
        const allAppliedBidsJson = JSON.parse(allAppliedBids.toString());

        if ("message" in allAppliedBidsJson || allAppliedBidsJson.bids.length === 0) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.json({
                success: false,
                allContractors: [],
                message: 'No applied bids for this project.'
            });
            await gateway.disconnect();
        } else {
            const allAppliedBidIDsArray = allAppliedBidsJson.bids;

            var finalJSON = [];
            for (var i = 0; i < allAppliedBidIDsArray.length; i++) {
                const bidID = allAppliedBidIDsArray[i];
                const getBid = await contract.evaluateTransaction('getBid', bidID);
                const getBidJson = JSON.parse(getBid.toString());
                const getJSON = { id: bidID, object: getBidJson };
                finalJSON.push(getJSON.object.username);
            }

            console.log(finalJSON);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json({
                success: true,
                allContractors: finalJSON
            });
            await gateway.disconnect();
        }
    }
});

router.post('/updateEvaluationReview', async function (req, res, next) {
    const ccpPath = path.resolve(__dirname, '..', '..', '..', 'fabric', 'test-network', 'organizations',
        'peerOrganizations', 'gail.example.com', 'connection-gail.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const identity = await wallet.get('admin');
    if (!identity) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.json({
            success: false,
            message: 'GAIL Admin should be registered first'
        });
    }
    else {
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet, identity: 'admin',
            discovery: { enabled: true, asLocalhost: true }
        });

        const network = await gateway.getNetwork('channelgg');
        const contract = network.getContract('gail', 'Project');
        await contract.submitTransaction('updateProjectEvaluationReview', req.body.id, JSON.stringify(req.body.evaluation_review));
        await contract.submitTransaction('updateProjectStatus', req.body.id, "in-review");
        await gateway.disconnect();

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({
            success: true
        });
    }
});

router.post('/getAllContractorsForProjects', async function (req, res, next) {
    const ccpPath = path.resolve(__dirname, '..', '..', '..', 'fabric', 'test-network', 'organizations',
        'peerOrganizations', 'gail.example.com', 'connection-gail.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const identity = await wallet.get('admin');
    if (!identity) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.json({
            success: false,
            message: 'GAIL Admin should be registered first.'
        });
    }
    else {
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet, identity: 'admin',
            discovery: { enabled: true, asLocalhost: true }
        });

        const network = await gateway.getNetwork('channelgg');

        const contract = network.getContract('gail', 'Project');
        var relationJSON = {};
        const numProj = await contract.evaluateTransaction('getNumProjects');
        const numProjJson = JSON.parse(numProj.toString());
        console.log(numProjJson);
        if ("message" in numProjJson) {
            res.json({
                success: true,
                relation: relationJSON
            });
        }
        else {
            var contractorID = req.body.id;
            for (var i = 1; i <= parseInt(numProjJson.num.toString()); i++) {
                const gateway = new Gateway();
                await gateway.connect(ccp, {
                    wallet, identity: 'admin',
                    discovery: { enabled: true, asLocalhost: true }
                });

                const network = await gateway.getNetwork('channelgg');
                const contract = network.getContract('gail', 'Bid');
                const allAppliedBids = await contract.evaluateTransaction('getProjectBids', i.toString());
                const allAppliedBidsJson = JSON.parse(allAppliedBids.toString());

                if ("message" in allAppliedBidsJson || allAppliedBidsJson.bids.length === 0) {
                    relationJSON[i.toString()] = false;
                    // relationJSON.push({id: i.toString(), contractors: {}});
                } else {
                    const allAppliedBidIDsArray = allAppliedBidsJson.bids;

                    var finalJSON = [];
                    var isPresent = false;
                    for (var j = 0; j < allAppliedBidIDsArray.length; j++) {
                        const bidID = allAppliedBidIDsArray[j];
                        const getBid = await contract.evaluateTransaction('getBid', bidID);
                        const getBidJson = JSON.parse(getBid.toString());
                        const getJSON = { id: bidID, object: getBidJson };
                        if(getJSON.object.username.toString() == contractorID.toString()) {
                            isPresent = true;
                            break;
                        }
                        finalJSON.push(getJSON.object.username);
                    }
                    
                    relationJSON[i.toString()] = isPresent;
                    // relationJSON.push({id: i.toString(), contractors: finalJSON});
                }

                console.log(i.toString());
                console.log(relationJSON);
                await gateway.disconnect();

            }
            res.json({
                success: true,
                relation: relationJSON
            });
        }

    }

});

module.exports = router;
