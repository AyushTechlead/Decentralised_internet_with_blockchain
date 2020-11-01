var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
const FabricCAServices = require('fabric-ca-client');
const { Wallets, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const dictionary=JSON.parse(fs.readFileSync(path.resolve(__dirname,'dictionary.json'), 'utf8'));

const constants=JSON.parse(fs.readFileSync(path.resolve(__dirname,'constants.json'), 'utf8'));
const numGailNodes=constants['numGailNodes'];
const numContractorNodes=constants['numContractorNodes'];

const contractor_ccpPath = path.resolve(__dirname, '..', '..', '..', 'fabric', 'test-network', 'organizations',
'peerOrganizations', 'contractors.example.com', 'connection-contractors.json');
const contractor_ccp = JSON.parse(fs.readFileSync(contractor_ccpPath, 'utf8'));
const contractor_walletPath=path.join(__dirname, 'wallet');

const gail_ccpPath = path.resolve(__dirname, '..', '..', '..', 'fabric', 'test-network', 'organizations',
'peerOrganizations', 'gail.example.com', 'connection-gail.json');
const gail_ccp = JSON.parse(fs.readFileSync(gail_ccpPath, 'utf8'));
const gail_walletPath=path.resolve(__dirname, '..','gail','wallet');

const gailEmail="gail.sih2020@gmail.com";
const password="adminpassword";

exports.sendEmail=async function (emailid,subject,textmessage){
    console.log('email!');
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gailEmail,
          pass: password
        }
      });

    var mailOptions = {
        from: gailEmail,
        to: emailid,
        subject: subject,
        html: textmessage
    };

    transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};
exports.checkMaxUsersReached=async function (){
    var gateway = new Gateway();
    var wallet = await Wallets.newFileSystemWallet(gail_walletPath);
    await gateway.connect(gail_ccp, { wallet, identity: 'admin',
        discovery: { enabled: true, asLocalhost: true } });
    // Get the contract from the network.
    // Get the network (channel) our contract is deployed to.
    const network = await gateway.getNetwork('channelgg');
    const contract = network.getContract('gail','User');
    const numContractorsAsBytes=await contract.evaluateTransaction('getNumContractors');

    await gateway.disconnect();
    var numContractors=JSON.parse(numContractorsAsBytes.toString());
    var curChannelNum=numContractors.numContractors+1;
    if(curChannelNum>=numContractorNodes){
        return true;
    }
    else {
        return false;
    }
};

exports.authenticate=async function (username,password){
    const wallet = await Wallets.newFileSystemWallet(contractor_walletPath);
    // Check to see if we've already enrolled the user.
    const identity = await wallet.get(username);
    if(!identity){
        return false;
    }
    else {
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(contractor_ccp, { wallet, identity: username,
            discovery: { enabled: true, asLocalhost: true } });
        const dictionary=JSON.parse(fs.readFileSync(path.resolve(__dirname,'dictionary.json'), 'utf8'));
        var channelNum=dictionary[username];
        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('channelg1c'+channelNum);

        // Get the contract from the network.
        const contract = network.getContract('contractors_1_'+channelNum);

        const user = await contract.evaluateTransaction('getUser', username, password);
        await gateway.disconnect();
        const userJson=JSON.parse(user,'utf8');
        if(userJson.hasOwnProperty('success')){
            return false;
        }
        else {
            return true;
        }
    }
};
exports.getUser=async function (username,password){
    // Check to see if we've already enrolled the user.
    const wallet = await Wallets.newFileSystemWallet(contractor_walletPath);
    const identity = await wallet.get(username);
    if(!identity){
        return false;
    }
    else {
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(contractor_ccp, { wallet, identity: username,
            discovery: { enabled: true, asLocalhost: true } });
        const dictionary=JSON.parse(fs.readFileSync(path.resolve(__dirname,'dictionary.json'), 'utf8'));
        var channelNum=dictionary[username];
        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('channelg1c'+channelNum);

        // Get the contract from the network.
        const contract = network.getContract('contractors_1_'+channelNum);

        const user = await contract.evaluateTransaction('getUser', username, password);
        await gateway.disconnect();
        const userJson=JSON.parse(user,'utf8');
        if(userJson.hasOwnProperty('success')){
            return null;
        }
        else {
            return userJson;
        }
    }
};

exports.getSingleUser=async function (username){
    // Check to see if we've already enrolled the user.
    const wallet = await Wallets.newFileSystemWallet(contractor_walletPath);
    const identity = await wallet.get(username);
    if(!identity){
        return false;
    }
    else {
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(contractor_ccp, { wallet, identity: username,
            discovery: { enabled: true, asLocalhost: true } });
        const dictionary=JSON.parse(fs.readFileSync(path.resolve(__dirname,'dictionary.json'), 'utf8'));
        var channelNum=dictionary[username];
        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('channelg1c'+channelNum);

        // Get the contract from the network.
        const contract = network.getContract('contractors_1_'+channelNum);

        const user = await contract.evaluateTransaction('getUserDetails', username);
        await gateway.disconnect();
        const userJson=JSON.parse(user,'utf8');
        if(userJson.hasOwnProperty('success')){
            return null;
        }
        else {
            return userJson;
        }
    }
};

exports.getProject=async function (projectid){
    const wallet = await Wallets.newFileSystemWallet(gail_walletPath);
    var gateway = new Gateway();
    await gateway.connect(gail_ccp, { wallet, identity: 'admin',
        discovery: { enabled: true, asLocalhost: true } });

    // Get the network (channel) our contract is deployed to.
    var network = await gateway.getNetwork('channelgg');
    // Get the contract from the network.
    var contract = network.getContract('gail', 'Project');
    const project=await contract.evaluateTransaction('getProject', projectid);
    await gateway.disconnect();
    const projectJson = JSON.parse(project.toString());
    if("message" in projectJson) {
        return null;
    }
    else{
        return projectJson;
    }
};

exports.getGailGateway=async function (){
    const wallet = await Wallets.newFileSystemWallet(gail_walletPath);
    var gateway = new Gateway();
    await gateway.connect(gail_ccp, { wallet, identity: 'admin',
        discovery: { enabled: true, asLocalhost: true } });
    return gateway;
};
exports.getContractorGateway=async function (username){
    const wallet = await Wallets.newFileSystemWallet(contractor_walletPath);
    var gateway = new Gateway();
    await gateway.connect(contractor_ccp, { wallet, identity: username,
        discovery: { enabled: true, asLocalhost: true } });
    return gateway;
};
