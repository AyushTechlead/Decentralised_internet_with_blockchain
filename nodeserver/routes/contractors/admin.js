var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

const cors = require('../../cors');

router.use(bodyParser.json());

router.options('*', cors.corsWithOptions, (req, res) => { res.sendStatus(200); });

/* GET users listing. */
router.post('/login', function(req, res, next) {
    res.send('respond with a resource');
});

router.post('/signup', async function(req, res, next){
    // load the network configuration
    const ccpPath = path.resolve(__dirname, '..', '..', '..', 'fabric', 'test-network', 'organizations',
    'peerOrganizations', 'contractors.example.com', 'connection-contractors.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Create a new CA client for interacting with the CA.
    const caInfo = ccp.certificateAuthorities['ca.contractors.example.com'];
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check to see if we've already enrolled the admin user.
    const identity = await wallet.get('admin');
    if (identity) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.json({
            success: false,
            message: 'admin user already exists in the wallet'
        });
    }
    else{
        // Enroll the admin user, and import the new identity into the wallet.
        const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'ContractorsMSP',
            type: 'X.509',
        };
        await wallet.put('admin', x509Identity);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({
            success: true,
            username: 'admin'
        });

        fs.writeFile(path.resolve(__dirname,'dictionary.json'), '{}', err => {

            // Checking for errors
            if (err) throw err;
            // console.log(dictionary); // Success
        });
    }
});

module.exports = router;
