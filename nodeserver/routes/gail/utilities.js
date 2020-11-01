var express = require('express');
var router = express.Router();
const bodyParser = require('body-parser');
const FabricCAServices = require('fabric-ca-client');
const { Wallets, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const dictionaryPath=path.resolve(__dirname,'..','contractors','dictionary.json');

const constants=JSON.parse(fs.readFileSync(path.resolve(__dirname,'..','contractors','constants.json'), 'utf8'));
const numGailNodes=constants['numGailNodes'];
const numContractorNodes=constants['numContractorNodes'];

const contractor_ccpPath = path.resolve(__dirname, '..', '..', '..', 'fabric', 'test-network', 'organizations',
'peerOrganizations', 'contractors.example.com', 'connection-contractors.json');
const contractor_ccp = JSON.parse(fs.readFileSync(contractor_ccpPath, 'utf8'));
const contractor_walletPath=path.join(__dirname, '..','contractors','wallet');

const gail_ccpPath = path.resolve(__dirname, '..', '..', '..', 'fabric', 'test-network', 'organizations',
'peerOrganizations', 'gail.example.com', 'connection-gail.json');
const gail_ccp = JSON.parse(fs.readFileSync(gail_ccpPath, 'utf8'));
const gail_walletPath=path.resolve(__dirname,'wallet');


const gailEmail="gail.sih2020@gmail.com";
const password="adminpassword";

exports.sendEmail=async function (emailid,subject,textmessage){
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