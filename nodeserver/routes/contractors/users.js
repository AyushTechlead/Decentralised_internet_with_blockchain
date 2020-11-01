var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
const FabricCAServices = require('fabric-ca-client');
const { Wallets, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');

const cors = require('../../cors');

const utility = require(path.join(__dirname, 'utilities.js'));

const constants = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'constants.json'), 'utf8'));
const numGailNodes = constants['numGailNodes'];
const numContractorNodes = constants['numContractorNodes'];

router.use(bodyParser.json());

router.options('*', cors.corsWithOptions, (req, res) => { res.sendStatus(200); });

/* GET users listing. */
router.post('/login', async function (req, res, next) {
    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(__dirname, 'wallet');
    var wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check to see if we've already enrolled the user.
    const identity = await wallet.get(req.body.username);
    if (!identity) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.json({
            success: false,
            message: 'User with username: ' + req.body.username + ' does not exist!!'
        });
    }
    else {
        // Create a new gateway for connecting to our peer node.

        const gateway = await utility.getContractorGateway(req.body.username);
        const dictionary = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'dictionary.json'), 'utf8'));
        var channelNum = dictionary[req.body.username];
        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('channelg1c' + channelNum);

        // Get the contract from the network.
        const contract = network.getContract('contractors_1_' + channelNum);

        const user = await contract.evaluateTransaction('getUser', req.body.username, req.body.password);
        // Disconnect from the gateway.
        await gateway.disconnect();


        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(JSON.parse(user.toString()));
    }
});

router.post('/signup', async function (req, res, next) {
    // load the network configuration
    const ccpPath = path.resolve(__dirname, '..', '..', '..', 'fabric', 'test-network', 'organizations',
        'peerOrganizations', 'contractors.example.com', 'connection-contractors.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Create a new CA client for interacting with the CA.
    const caURL = ccp.certificateAuthorities['ca.contractors.example.com'].url;
    const ca = new FabricCAServices(caURL);

    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(__dirname, 'wallet');
    var wallet = await Wallets.newFileSystemWallet(walletPath);

    //Check to see max num of contractors reached
    const boolMaxContractorsReached = await utility.checkMaxUsersReached();
    if (boolMaxContractorsReached == true) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.json({
            success: false,
            message: 'Max number of contractors reached'
        });
        return;
    }

    // Check to see if we've already enrolled the user.
    const userIdentity = await wallet.get(req.body.username);
    if (userIdentity) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.json({
            success: false,
            message: 'User with username: ' + req.body.username + ' already exists in the wallet'
        });
    }
    else {
        // Check to see if we've already enrolled the admin user.
        const adminIdentity = await wallet.get('admin');
        if (!adminIdentity) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.json({
                success: false,
                message: 'admin should be registered before registering client user'
            });
        }
        else {
            // build a user object for authenticating with the CA
            const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
            const adminUser = await provider.getUserContext(adminIdentity, 'admin');

            // Register the user, enroll the user, and import the new identity into the wallet.
            const secret = await ca.register({
                enrollmentID: req.body.username,
                role: 'client',
                enrollmentSecret: req.body.password
            }, adminUser);
            const enrollment = await ca.enroll({
                enrollmentID: req.body.username,
                enrollmentSecret: secret
            });
            const x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: 'ContractorsMSP',
                type: 'X.509',
            };
            await wallet.put(req.body.username, x509Identity);

            // Check to see if we've already enrolled the user.
            const identity = await wallet.get(req.body.username);
            if (!identity) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.json({
                    success: false,
                    message: 'User registration failed'
                });
            }
            else {

                const gateway = new Gateway();
                await gateway.connect(ccp, {
                    wallet, identity: 'admin',
                    discovery: { enabled: true, asLocalhost: true }
                });

                // Create a new gateway for connecting to our peer node.
                const gatewayGail = new Gateway();
                const ccpGailPath = path.resolve(__dirname, '..', '..', '..', 'fabric', 'test-network', 'organizations',
                    'peerOrganizations', 'gail.example.com', 'connection-gail.json');
                const ccpGail = JSON.parse(fs.readFileSync(ccpGailPath, 'utf8'));
                const gailWalletPath = path.resolve(__dirname, '..', 'gail', 'wallet');
                try {
                    wallet = await Wallets.newFileSystemWallet(gailWalletPath);
                    await gatewayGail.connect(ccpGail, {
                        wallet, identity: 'admin',
                        discovery: { enabled: true, asLocalhost: true }
                    });
                } catch (e) {

                }

                // Get the network (channel) our contract is deployed to.
                const network = await gatewayGail.getNetwork('channelgg');

                // Get the contract from the network.
                const contract = network.getContract('gail', 'User');
                const numContractorsAsBytes = await contract.evaluateTransaction('getNumContractors');
                var numContractors = JSON.parse(numContractorsAsBytes.toString());
                // var curChannelNum = numContractors.numContractors + 1;
                var curChannelNum = 1;

                console.log(curChannelNum);
                console.log(numGailNodes);
                console.log("Chirag");
                for (i = 1; i < numGailNodes; i++) {
                    var str = 'channelg' + i.toString() + 'c' + curChannelNum.toString();
                    const networkChannel = await gateway.getNetwork(str);
                    const contractChannel = networkChannel.getContract('contractors_' + i.toString() + '_' + curChannelNum.toString(), 'User');
                    console.log("--------------");
                    await contractChannel.submitTransaction('createUser', req.body.username, req.body.password, req.body.email
                        , req.body.contact, req.body.address, req.body.aboutUs, req.body.profilepic, req.body.mid, req.body.mkey, req.body.designation);
                    console.log("+++++++++++++++++");

                }
                await contract.submitTransaction('updateNumContractors');
                // Disconnect from the gateway.
                await gateway.disconnect();
                await gatewayGail.disconnect();

                const dictionary = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'dictionary.json'), 'utf8'));
                dictionary[req.body.username] = curChannelNum.toString();
                fs.writeFile(path.resolve(__dirname, 'dictionary.json'), JSON.stringify(dictionary), err => {
                    // Checking for errors
                    if (err) throw err;
                    console.log(dictionary); // Success
                });

                // const dictionaryRev = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'dictionaryRev.json'), 'utf8'));
                // dictionaryRev[req.body.username] = req.body.username;
                // fs.writeFile(path.resolve(__dirname, 'dictionaryRev.json'), JSON.stringify(dictionaryRev), err => {
                //     // Checking for errors
                //     if (err) throw err;
                //     console.log(dictionaryRev); // Success
                // });
                await utility.sendEmail(req.body.email.toString(),'Gail: User Created','<p>Dear Contractor,<br> Your account has been successfully created with username <b>'+req.body.username.toString()+'</b> . Please visit your dashboard at GAIL website for more details.<br> Regards,<br> Gail Team</p>');


                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json({
                    success: true,
                    username: req.body.username
                });
            }
        }
    }
});

router.post('/profile', async function (req, res, next) {
    const contractor = await utility.getUser(req.body.username, req.body.password);
    if (contractor == null) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.json({
            success: false,
            message: 'No such contractor ID exists'
        });
    }
    else {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({
            success: true,
            message: 'Successfully get contractor details',
            object: contractor
        });
    }
});

router.post('/updateProfile', async function (req, res, next) {
    //console.log('correcturl');
    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(__dirname, 'wallet');
    var wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check to see if we've already enrolled the user.
    const identity = await wallet.get(req.body.username);
    if (!identity) {
        //console.log('here1');
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.json({
            success: false,
            message: 'User with username: ' + req.body.username + ' does not exist!!'
        });
    }
    else {
        // Create a new gateway for connecting to our peer node.
        const gateway = await utility.getContractorGateway(req.body.username);
        const dictionary = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'dictionary.json'), 'utf8'));
        var channelNum = dictionary[req.body.username];
        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('channelg1c' + channelNum);

        // Get the contract from the network.
        const contract = network.getContract('contractors_1_' + channelNum);

        var user = await contract.evaluateTransaction('getUser', req.body.username, req.body.password);
        const userJson = JSON.parse(user.toString());
        //console.log(userJson);
        if ("message" in userJson) {
            //console.log('here2');
            res.statusCode = 400;
            res.json(userJson);
            await gateway.disconnect();
        }
        else
            // Disconnect from the gateway.

            res.statusCode = 200;
        for (i = 1; i < numGailNodes; i++) {
            var str = 'channelg' + i.toString() + 'c' + channelNum.toString();
            const networkChannel = await gateway.getNetwork(str);
            const contractChannel = networkChannel.getContract('contractors_' + i.toString() + '_' + channelNum.toString(), 'User');
            if ("email" in req.body) {
                await contractChannel.submitTransaction('updateUserEmail', req.body.username, req.body.password,
                    req.body.email);
            }

            if ("contact" in req.body) {
                await contractChannel.submitTransaction('updateUserContact', req.body.username, req.body.password,
                    req.body.contact);
            }

            if ("address" in req.body) {
                await contractChannel.submitTransaction('updateUserAddress', req.body.username, req.body.password,
                    req.body.address);
            }

            if ("profilepic" in req.body) {
                await contractChannel.submitTransaction('updateUserProfilePic', req.body.username, req.body.password,
                    req.body.profilepic);

            }
            if ("aboutUs" in req.body) {
                await contractChannel.submitTransaction('updateUserAboutUs', req.body.username, req.body.password,
                    req.body.aboutUs);
            }

        }
        user = await contract.evaluateTransaction('getUser', req.body.username, req.body.password);
        res.json(JSON.parse(user.toString()));
    }
});

router.post('/getCompletedProjects', async function (req, res, next) {
    //console.log('correcturl');
    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(__dirname, 'wallet');
    var wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check to see if we've already enrolled the user.
    const identity = await wallet.get(req.body.username);
    if (!identity) {
        //console.log('here1');
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.json({
            success: false,
            message: 'User with username: ' + req.body.username + ' does not exist!!'
        });
    }
    else {
        // Create a new gateway for connecting to our peer node.
        const gateway = await utility.getContractorGateway(req.body.username);
        const dictionary = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'dictionary.json'), 'utf8'));
        var channelNum = dictionary[req.body.username];
        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('channelg1c' + channelNum);

        // Get the contract from the network.
        const contract = network.getContract('contractors_1_' + channelNum);

        var user = await contract.evaluateTransaction('getUser', req.body.username, req.body.password);
        const userJson = JSON.parse(user.toString());
        //console.log(userJson);
        if ("message" in userJson) {
            //console.log('here2');
            res.statusCode = 400;
            res.json(userJson);
            await gateway.disconnect();
        }
        else
            // Disconnect from the gateway.

            res.statusCode = 200;
        const ccpPath2 = path.resolve(__dirname, '..', '..', '..', 'fabric', 'test-network', 'organizations',
            'peerOrganizations', 'gail.example.com', 'connection-gail.json');
        const ccp2 = JSON.parse(fs.readFileSync(ccpPath2, 'utf8'));
        const prevProjs = userJson.listOfPreviousProjects;
        const gateway2 = new Gateway();
        await gateway2.connect(ccp2, {
            wallet, identity: 'admin',
            discovery: { enabled: true, asLocalhost: true }
        });


        // Get the network (channel) our contract is deployed to.
        const network2 = await gateway2.getNetwork('channelgg');

        // Get the contract from the network.
        const contract2 = network2.getContract('gail', 'Project');
        var completedProjects = {};
        for(var i =0 ; i<prevProjs.length; i++){
            const getProj = await contract2.evaluateTransaction('getProject', prevProjs[i].id);
            const project = JSON.parse(getProj.toString());
            console.log(project);
            if ("message" in project) {
            }
            else {
                console.log('hello' + i.toString());
                completedProjects[prevProjs[i].id] = JSON.stringify(project);
            }
        }
        res.json({
            success: true,
            allProjects: completedProjects
        });
    }

});

router.post('/:username', async function (req, res, next) {

    var contractorUsername = req.params.username.toString();
    const contractor = await utility.getSingleUser(contractorUsername);
    console.log("CONTRACTOR: " + contractor.toString());

    if (contractor == null) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.json({
            success: false,
            message: 'No such contractor ID exists'
        });
    }
    else {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({
            success: true,
            message: 'Successfully get contractor details',
            object: contractor
        });
    }
});


module.exports = router;
