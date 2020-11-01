var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
const FabricCAServices = require('fabric-ca-client');
const { Wallets, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const utility=require(path.join(__dirname,'utilities.js'));

const cors = require('../../cors');
const { ContractImpl } = require('fabric-network/lib/contract');

router.use(bodyParser.json());

router.options('*', cors.corsWithOptions, (req, res) => { res.sendStatus(200); });

router.post('/updateBid', async function (req, res, next) {
    const ccpPath = path.resolve(__dirname, '..', '..', '..', 'fabric', 'test-network', 'organizations',
        'peerOrganizations', 'gail.example.com', 'connection-gail.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check to see if we've already enrolled the user.
    const identity = await wallet.get('admin');
    // const identity = await wallet.get(req.body.username);
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

        const network = await gateway.getNetwork('channelgg');
        const contract = network.getContract('gail', 'Bid');
        console.log(req.body.bid_id.toString());
        await contract.submitTransaction('updateBid', req.body.bid_id.toString(), req.body.gailfield);
        res.json({
            success: true
        });
    }
});

router.post('/', async function (req, res, next) {
    const ccpPath = path.resolve(__dirname, '..', '..', '..', 'fabric', 'test-network', 'organizations',
        'peerOrganizations', 'gail.example.com', 'connection-gail.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check to see if we've already enrolled the user.
    const identity = await wallet.get(req.body.username);
    if (!identity) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.json({
            success: false,
            message: 'You dont have permission to access this page!!'
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
            //correct username and password, proceed further to find the winner bidID for given projectID
            const gateway = new Gateway();
            await gateway.connect(ccp, {
                wallet, identity: req.body.username,
                discovery: { enabled: true, asLocalhost: true }
            });
            const network = await gateway.getNetwork('channelgg');
            const contract = network.getContract('gail', 'Project');
            const getProj = await contract.evaluateTransaction('getProject', req.body.id);
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
                const gateway = new Gateway();
                await gateway.connect(ccp, {
                    wallet, identity: req.body.username,
                    discovery: { enabled: true, asLocalhost: true }
                });
                const network = await gateway.getNetwork('channelgg');
                const contract = network.getContract('gail', 'Bid');
                const allAppliedBids = await contract.evaluateTransaction('getProjectBids', req.body.id);
                const allAppliedBidsJson = JSON.parse(allAppliedBids.toString());
                if ("message" in allAppliedBidsJson || allAppliedBidsJson.bids.length === 0) {


                    const network = await gateway.getNetwork('channelgg');
                    const contract = network.getContract('gail', 'Project');
                    await contract.submitTransaction('updateProjectStatus', req.body.id.toString(), 'discarded');

                    res.statusCode = 400;
                    res.setHeader('Content-Type', 'application/json');
                    res.json({
                        success: false,
                        message: 'No applied bids for this project.'
                    });
                    await gateway.disconnect();
                }
                else {
                    const allAppliedBidIDsArray = allAppliedBidsJson.bids;
                    var winnerBidID;
                    var winningBidValue = 0.0;
                    var maxPrice = 0.0;
                    var maxTime = 0.0;
                    var maxNumStandards = 0;
                    for (var i = 0; i < allAppliedBidIDsArray.length; i++) {
                        const bidID = allAppliedBidIDsArray[i];
                        const getBid = await contract.evaluateTransaction('getBid', bidID);
                        const getBidJson = JSON.parse(getBid.toString());
                        if ("message" in getBidJson) {
                            res.statusCode = 400;
                            res.setHeader('Content-Type', 'application/json');
                            res.json({
                                success: false,
                                message: 'Some error in applied bid values.'
                            });
                            await gateway.disconnect();
                        }
                        else {
                            const getBidDetails = getBidJson.bidDetails;
                            const getBidDetailsJson = JSON.parse(getBidDetails.toString());
                            //console.log(getBidDetailsJson);
                            //console.log(getBidDetailsJson.price);
                            var price = parseFloat(getBidDetailsJson.price);
                            var time = parseFloat(getBidDetailsJson.time_period);
                            var standards = getBidDetailsJson.standards;
                            if (price > maxPrice) maxPrice = price;
                            if (time > maxTime) maxTime = time;
                            if (standards.length > maxNumStandards) maxNumStandards = standards.length;
                        }
                    }
                    console.log('maxPrice'+maxPrice,toString());
                    console.log('maxTime'+ maxTime.toString());
                    console.log('maxStandards'+maxNumStandards.toString());

                    const constants = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'contractors', 'constants.json'), 'utf8'));
                    const numGailNodes = constants['numGailNodes'];
                    const ccpPath = path.resolve(__dirname, '..', '..', '..', 'fabric', 'test-network', 'organizations',
                        'peerOrganizations', 'contractors.example.com', 'connection-contractors.json');
                    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
                    const gatewayContractors = new Gateway();
                    await gatewayContractors.connect(ccp, {
                        wallet, identity: 'admin',
                        discovery: { enabled: true, asLocalhost: true }
                    });

                    const dictionary = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'contractors', 'dictionary.json'), 'utf8'));


                    for (var i = 0; i < allAppliedBidIDsArray.length; i++) {
                        const bidID = allAppliedBidIDsArray[i];
                        const getBid = await contract.evaluateTransaction('getBid', bidID);
                        const getBidJson = JSON.parse(getBid.toString());
                        if ("message" in getBidJson) {
                            res.statusCode = 400;
                            res.setHeader('Content-Type', 'application/json');
                            res.json({
                                success: false,
                                message: 'Some error in applied bid values.'
                            });
                            await gateway.disconnect();
                        }
                        else {
                            const contractorUsername = getBidJson.username;
                            const currChannelNum = dictionary[contractorUsername];
                            var str = 'channelg1c' + currChannelNum.toString();
                            const networkChannel = await gatewayContractors.getNetwork(str);
                            const contractChannel = networkChannel.getContract('contractors_1_' + currChannelNum.toString(), 'User');
                            const qualityString = await contractChannel.evaluateTransaction('getProductQuality', contractorUsername);
                            const ratingString = await contractChannel.evaluateTransaction('getOverallRating', contractorUsername);
                            const getBidDetails = getBidJson.bidDetails;
                            const getBidDetailsJson = JSON.parse(getBidDetails.toString());

                            /*Extra added*/
                            const gailReview=getBidDetailsJson.gailfield;
                            const gailReviewJson=JSON.parse(gailReview.toString());
                            const gailReviewRating=parseFloat(gailReviewJson.rating);
                            if(gailReviewJson.accept == "false") {
                                continue;
                            }
                            /*Extra fields added end  */

                            const price = parseFloat(getBidDetailsJson.price);
                            const quality = parseFloat(qualityString.toString());
                            const rating = parseFloat(ratingString.toString());
                            const time = parseFloat(getBidDetailsJson.time_period);
                            const numStandards = getBidDetailsJson.standards.length;
                            //const quality = 1.3;
                            //const rating = 2.4;
                            console.log("BIDID: " + bidID.toString());
                            console.log(ratingString.toString());
                            var bidVal = (maxPrice/price) * 300 + (maxTime/time) * 300 + (numStandards/maxNumStandards) * 100
                                        + (quality/100) * 100 + (rating/10) * 100 +
                                        (gailReviewRating/100) * 100;  //gail reviewRating added
                            if (winningBidValue === 0) {
                                winnerBidID = bidID;
                                winningBidValue = bidVal;
                            }
                            else {
                                if (bidVal > winningBidValue) {
                                    winningBidValue = bidVal;
                                    winnerBidID = bidID;
                                }
                            }
                        }
                    }
                    const winningBid = await contract.evaluateTransaction('getBid', winnerBidID);
                    const winningBidJson = JSON.parse(winningBid.toString());
                    const winningContractorUsername = winningBidJson.username;
                    const allocatedProjectID = winningBidJson.projectID;

                    //updating project status from floated to in-progress, bid_id from null to winner bid ID,
                    //contractor_id to winner contactor username.

                    const contract2 = network.getContract('gail', 'Project');
                    await contract2.submitTransaction('updateProjectStatus', allocatedProjectID, 'in-progress');
                    await contract2.submitTransaction('updateProjectBidID', allocatedProjectID, winnerBidID);
                    await contract2.submitTransaction('updateProjectContractor', allocatedProjectID, winningContractorUsername);



                    var channelNum = dictionary[winningContractorUsername];


                    // Get the network (channel) our contract is deployed to.
                    //const network2 = await gateway.getNetwork('channelgg');

                    // Get the contract from the network.
                    //const contract3 = network2.getContract('gail','User');
                    // const numContractorsAsBytes=await contract3.evaluateTransaction('getNumContractors');
                    // var numContractors=JSON.parse(numContractorsAsBytes.toString());
                    // var curChannelNum=numContractors.numContractors;


                    // console.log(curChannelNum);
                    var winningContractor;
                    for (i = 1; i < numGailNodes; i++) {
                        var str = 'channelg' + i.toString() + 'c' + channelNum.toString();
                        const networkChannel = await gatewayContractors.getNetwork(str);
                        const contractChannel = networkChannel.getContract('contractors_' + i.toString() + '_' + channelNum.toString(), 'User');
                        await contractChannel.submitTransaction('allocateProject', winningContractorUsername, req.body.id, winnerBidID);
                        if(i==1)
                            winningContractor=await contractChannel.evaluateTransaction('getUserDetails',winningContractorUsername);
                    }
                    var winningContractorJson=JSON.parse(winningContractor.toString());
                    await utility.sendEmail(winningContractorJson.email.toString(),'Gail:Bid Accepted','<p>Dear Contractor,<br> Your bid <b>'+winnerBidID+'</b> has been selected for the project <b>'+allocatedProjectID+'</b> . Please visit your dashboard at GAIL website for more details.<br> Regards,<br> Gail Team</p>');
                    // Disconnect from the gateway.
                    await gateway.disconnect();
                    res.json({
                        success: true,
                        message: 'Winning bidID for project' + req.body.id + ' is-' + winnerBidID
                        // +' '+allAppliedBidIDsArray.length.toString()+' '+winningBidValue.toString()
                        //+' '+maxPrice.toString()
                    });

                }
            }

        }
    }
});

router.post('/getSingleBid', async function (req, res, next) {
    const ccpPath = path.resolve(__dirname, '..', '..', '..', 'fabric', 'test-network', 'organizations',
        'peerOrganizations', 'gail.example.com', 'connection-gail.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check to see if we've already enrolled the user.
    const identity = await wallet.get('admin');
    // const identity = await wallet.get(req.body.username);
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

        const network = await gateway.getNetwork('channelgg');
        const contract = network.getContract('gail', 'Bid');
        console.log(req.body.bid_id.toString());
        const getBid = await contract.evaluateTransaction('getBid', req.body.bid_id.toString());
        const getBidJson = JSON.parse(getBid.toString());

        if ("message" in getBidJson) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.json({
                success: false,
                message: 'Bid ID does not exist'
            });
            await gateway.disconnect();
        } else {
            const getBidDetails = getBidJson.bidDetails;
            const getBidDetailsJson = JSON.parse(getBidDetails.toString());

            res.json({
                success: true,
                object: getBidDetailsJson
            });
        }

    }
});

module.exports = router;
