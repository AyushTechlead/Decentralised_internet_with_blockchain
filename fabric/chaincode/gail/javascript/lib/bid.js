/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class Bid extends Contract {
    async initLedger(ctx) {

    }

    async applyForProject(ctx, username, projectID, bidDetails, tempBidID) {
        
        const bid = {
            username: username,
            docType: 'BID',
            projectID: projectID,
            bidDetails: bidDetails,
        };

        const bidID = tempBidID.toString();
        await ctx.stub.putState('BID_' + bidID, Buffer.from(JSON.stringify(bid)));

        var applied = await ctx.stub.getState('APPLIED_' + projectID);
        var obj = JSON.parse(applied.toString());
        obj.bids.push(bidID);
        await ctx.stub.putState('APPLIED_' + projectID, Buffer.from(JSON.stringify(obj)));

        return bidID;
    }

    async getBid(ctx, bidID) {
        const bidAsBytes = await ctx.stub.getState('BID_' + bidID);
        if (!bidAsBytes || bidAsBytes.length === 0) {
            return {
                success: 'false',
                message: 'Invalid Bid ID'
            };
        }

        return bidAsBytes.toString();

    }
    async getProjectBids(ctx, projectID) {
        const projectBidsAsBytes = await ctx.stub.getState('APPLIED_' + projectID);
        if (!projectBidsAsBytes || projectBidsAsBytes.length === 0) {
            return {
                success: 'false',
                message: 'No bids for this project.'
            };
        }
        return projectBidsAsBytes.toString();
    }
    async updateBid(ctx, bidID, gailfield) {
        const bidAsBytes = await ctx.stub.getState('BID_' + bidID);
        if (!bidAsBytes || bidAsBytes.length === 0) {
            return {
                success: 'false',
                message: 'Invalid Bid ID'
            };
        }
        var bid = JSON.parse(bidAsBytes.toString());
        var bidDetails = JSON.parse(bid.bidDetails);
        bidDetails["gailfield"] = gailfield;
        bid.bidDetails = JSON.stringify(bidDetails);
        await ctx.stub.putState('BID_' + bidID, Buffer.from(JSON.stringify(bid)));

        return bidAsBytes.toString();

    }
}

module.exports = Bid;
