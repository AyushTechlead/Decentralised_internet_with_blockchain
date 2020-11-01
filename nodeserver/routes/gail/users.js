var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
const FabricCAServices = require('fabric-ca-client');
const { Wallets, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');

const cors = require('../../cors');

router.use(bodyParser.json());

router.options('*', cors.corsWithOptions, (req, res) => { res.sendStatus(200); });

/* GET users listing. */
router.post('/login', async function (req, res, next) {
    // load the network configuration
    const ccpPath = path.resolve(__dirname, '..', '..', '..', 'fabric', 'test-network', 'organizations',
        'peerOrganizations', 'gail.example.com', 'connection-gail.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check to see if we've already enrolled the user.
    const identity = await wallet.get(req.body.username);
    if (!identity) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.json({
            success: false,
            message: 'User with username: ' + req.body.username + ' does not exist'
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
        const contract = network.getContract('gail');

        const user = await contract.evaluateTransaction('getUser', req.body.username, req.body.password);
        const jsonObject = JSON.parse(user.toString());
        await gateway.disconnect();

        if (jsonObject.hasOwnProperty('success')) {
            console.log("Contains Success");
            console.log(jsonObject.success);
            if (jsonObject.success == 'false') {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.json({
                    success: false,
                    message: "Authentication failed"
                });
            } else {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json({
                    success: true,
                    message: "Successful Login",
                    designation: jsonObject.designation
                });
            }

        } else {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json({
                success: true,
                message: "Successful Login",
                designation: jsonObject.designation
            });
        }
    }
});

router.post('/signup', async function (req, res, next) {
    // load the network configuration
    const ccpPath = path.resolve(__dirname, '..', '..', '..', 'fabric', 'test-network', 'organizations',
        'peerOrganizations', 'gail.example.com', 'connection-gail.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Create a new CA client for interacting with the CA.
    const caURL = ccp.certificateAuthorities['ca.gail.example.com'].url;
    const ca = new FabricCAServices(caURL);

    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check to see if we've already enrolled the user.
    const userIdentity = await wallet.get(req.body.username);
    if (userIdentity) {
        res.statusCode = 500;
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
                mspId: 'GailMSP',
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
                // Create a new gateway for connecting to our peer node.
                const gateway = new Gateway();
                await gateway.connect(ccp, {
                    wallet, identity: req.body.username,
                    discovery: { enabled: true, asLocalhost: true }
                });

                // Get the network (channel) our contract is deployed to.
                const network = await gateway.getNetwork('channelgg');

                // Get the contract from the network.
                const contract = network.getContract('gail');

                await contract.submitTransaction('createUser', req.body.username, req.body.password, req.body.email,
                    req.body.teamname, req.body.profilePic, req.body.name, req.body.contact, req.body.address, req.body.designation);
                // Disconnect from the gateway.
                await gateway.disconnect();

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

router.post('/getUserDetails', async function (req, res, next) {
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
        await gateway.connect(ccp, { wallet, identity: req.body.username, discovery: { enabled: true, asLocalhost: true } });

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
        } else {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json({
                success: true,
                object: jsonObj
            });
        }
    }

});

router.post('/editUserDetails', async function (req, res, next) {
    const ccpPath = path.resolve(__dirname, '../../..', 'fabric/test-network/organizations/peerOrganizations', 'gail.example.com/connection-gail.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    const caURL = ccp.certificateAuthorities['ca.gail.example.com'].url;

    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    const userIdentity = await wallet.get(req.body.username);
    if (!userIdentity) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.json({
            success: false,
            message: 'User with username: ' + req.body.username + ' does not exists in the wallet'
        });
    } else {
        const adminIdentity = await wallet.get('admin');
        if (!adminIdentity) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.json({
                success: false,
                message: 'admin should be registered before registering client user'
            });
        } else {
            const gateway = new Gateway();
            await gateway.connect(ccp, {
                wallet, identity: req.body.username,
                discovery: { enabled: true, asLocalhost: true }
            });

            const network = await gateway.getNetwork('channelgg');
            const contract = network.getContract('gail');

            await contract.submitTransaction('createUser', req.body.username, req.body.password, req.body.email, req.body.teamname, req.body.profilePic, 
                req.body.name, req.body.contact, req.body.address, req.body.designation);

            await gateway.disconnect();

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json({
                success: true,
                message: "Successfully edited Details"
            });
        }
    }
});


module.exports = router;
