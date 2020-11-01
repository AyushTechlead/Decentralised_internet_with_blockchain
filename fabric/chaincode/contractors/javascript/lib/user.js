/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class User extends Contract {

    async initLedger(ctx) {
    }

    async getUser(ctx, username, password) {
        const userAsBytes = await ctx.stub.getState('CONTRACTOR_' + username);
        if (!userAsBytes || userAsBytes.length === 0) {
            return {
                success: 'false',
                message: 'Contractor with username: \'' + username + '\' does not exist.'
            };
        }

        const user = JSON.parse(userAsBytes.toString());
        if (user.password !== password) {
            return {
                success: 'false',
                message: 'Contractor authentication failed. Please retry with correct password.'
            };
        }

        return userAsBytes.toString();

    }

    async getUserDetails(ctx, username) {
        const userAsBytes = await ctx.stub.getState('CONTRACTOR_' + username);
        if (!userAsBytes || userAsBytes.length === 0) {
            return {
                success: 'false',
                message: 'Contractor with username: \'' + username + '\' does not exist.'
            };
        }

        return userAsBytes.toString();

    }

    async createUser(ctx, username, password, email, contact, address, aboutUs, profilepic, merchantID, merchantKey, designation) {
        const user = {
            docType: 'CONTRACTOR',
            username: username,
            password: password,
            email: email,
            activeProjectID: null,
            activeBidID: null,
            listOfPreviousProjects: [],
            overallRating: '0',
            productQuality: '0',
            contact: contact,
            address: address,
            aboutUs: aboutUs,
            profilePicPath: profilepic,
            merchantID: merchantID,
            merchantKey: merchantKey, 
            designation: designation
        };

        await ctx.stub.putState('CONTRACTOR_' + username, Buffer.from(JSON.stringify(user)));
        return {
            success: 'true'
        };
    }
    async getNumPrevProjs(ctx, username) {
        const userAsBytes = await ctx.stub.getState('CONTRACTOR_' + username);
        if (!userAsBytes || userAsBytes.length === 0) {
            return {
                success: 'false',
                message: 'Contractor with username: \'' + username + '\' does not exist.'
            };
        }
        var user = JSON.parse(userAsBytes.toString());
        var num = user.listOfPreviousProjects.length;
        return num.toString();
    }
    async getOverallRating(ctx, username) {
        const userAsBytes = await ctx.stub.getState('CONTRACTOR_' + username);
        if (!userAsBytes || userAsBytes.length === 0) {
            return {
                success: 'false',
                message: 'Contractor with username: \'' + username + '\' does not exist.'
            };
        }
        var user = JSON.parse(userAsBytes.toString());
        return user.overallRating;
    }
    async getProductQuality(ctx, username) {
        const userAsBytes = await ctx.stub.getState('CONTRACTOR_' + username);
        if (!userAsBytes || userAsBytes.length === 0) {
            return {
                success: 'false',
                message: 'Contractor with username: \'' + username + '\' does not exist.'
            };
        }
        var user = JSON.parse(userAsBytes.toString());
        return user.productQuality;
    }
    async updateUserEmail(ctx, username, password, email) {
        const userAsBytes = await ctx.stub.getState('CONTRACTOR_' + username);
        if (!userAsBytes || userAsBytes.length === 0) {
            return {
                success: 'false',
                message: 'Contractor with username: \'' + username + '\' does not exist.'
            };
        }
        var user = JSON.parse(userAsBytes.toString());
        if (user.password !== password) {
            return {
                success: 'false',
                message: 'Contractor authentication failed. Please retry with correct password.'
            };
        }
        user.email = email;
        await ctx.stub.putState('CONTRACTOR_' + username, Buffer.from(JSON.stringify(user)));

    }
    async updateUserProfilePic(ctx, username, password, profilepic) {
        const userAsBytes = await ctx.stub.getState('CONTRACTOR_' + username);
        if (!userAsBytes || userAsBytes.length === 0) {
            return {
                success: 'false',
                message: 'Contractor with username: \'' + username + '\' does not exist.'
            };
        }

        var user = JSON.parse(userAsBytes.toString());
        if (user.password !== password) {
            return {
                success: 'false',
                message: 'Contractor authentication failed. Please retry with correct password.'
            };
        }
        user.profilePicPath = profilepic;
        await ctx.stub.putState('CONTRACTOR_' + username, Buffer.from(JSON.stringify(user)));

    }
    async updateUserPassword(ctx, username, password, newPass) {
        const userAsBytes = await ctx.stub.getState('CONTRACTOR_' + username);
        if (!userAsBytes || userAsBytes.length === 0) {
            return {
                success: 'false',
                message: 'Contractor with username: \'' + username + '\' does not exist.'
            };
        }

        var user = JSON.parse(userAsBytes.toString());
        if (user.password !== password) {
            return {
                success: 'false',
                message: 'Contractor authentication failed. Please retry with correct password.'
            };
        }

        user.password = newPass;
        await ctx.stub.putState('CONTRACTOR_' + username, Buffer.from(JSON.stringify(user)));

    }
    async updateUserContact(ctx, username, password, contact) {
        const userAsBytes = await ctx.stub.getState('CONTRACTOR_' + username);
        if (!userAsBytes || userAsBytes.length === 0) {
            return {
                success: 'false',
                message: 'Contractor with username: \'' + username + '\' does not exist.'
            };
        }

        var user = JSON.parse(userAsBytes.toString());
        if (user.password !== password) {
            return {
                success: 'false',
                message: 'Contractor authentication failed. Please retry with correct password.'
            };
        }

        user.contact = contact;
        await ctx.stub.putState('CONTRACTOR_' + username, Buffer.from(JSON.stringify(user)));

    }
    async updateUserAboutUs(ctx, username, password, aboutUs) {
        const userAsBytes = await ctx.stub.getState('CONTRACTOR_' + username);
        if (!userAsBytes || userAsBytes.length === 0) {
            return {
                success: 'false',
                message: 'Contractor with username: \'' + username + '\' does not exist.'
            };
        }

        var user = JSON.parse(userAsBytes.toString());
        if (user.password !== password) {
            return {
                success: 'false',
                message: 'Contractor authentication failed. Please retry with correct password.'
            };
        }

        user.aboutUs = aboutUs;
        await ctx.stub.putState('CONTRACTOR_' + username, Buffer.from(JSON.stringify(user)));

    }

    async updateUserDesignation(ctx, username, password, designation) {
        const userAsBytes = await ctx.stub.getState('CONTRACTOR_' + username);
        if (!userAsBytes || userAsBytes.length === 0) {
            return {
                success: 'false',
                message: 'Contractor with username: \'' + username + '\' does not exist.'
            };
        }

        var user = JSON.parse(userAsBytes.toString());
        if (user.password !== password) {
            return {
                success: 'false',
                message: 'Contractor authentication failed. Please retry with correct password.'
            };
        }

        user.designation = designation;
        await ctx.stub.putState('CONTRACTOR_' + username, Buffer.from(JSON.stringify(user)));

    }

    async updateUserAddress(ctx, username, password, address) {
        const userAsBytes = await ctx.stub.getState('CONTRACTOR_' + username);
        if (!userAsBytes || userAsBytes.length === 0) {
            return {
                success: 'false',
                message: 'Contractor with username: \'' + username + '\' does not exist.'
            };
        }
        var user = JSON.parse(userAsBytes.toString());
        if (user.password !== password) {
            return {
                success: 'false',
                message: 'Contractor authentication failed. Please retry with correct password.'
            };
        }

        user.address = address;
        await ctx.stub.putState('CONTRACTOR_' + username, Buffer.from(JSON.stringify(user)));

    }
    async updateOverallRating(ctx, username, newRating) {
        const userAsBytes = await ctx.stub.getState('CONTRACTOR_' + username);
        if (!userAsBytes || userAsBytes.length === 0) {
            return {
                success: 'false',
                message: 'Contractor with username: \'' + username + '\' does not exist.'
            };
        }
        var user = JSON.parse(userAsBytes.toString());
        user.overallRating = newRating;
        await ctx.stub.putState('CONTRACTOR_' + username, Buffer.from(JSON.stringify(user)));
    }
    async updateProductQuality(ctx, username, newQuality) {
        const userAsBytes = await ctx.stub.getState('CONTRACTOR_' + username);
        if (!userAsBytes || userAsBytes.length === 0) {
            return {
                success: 'false',
                message: 'Contractor with username: \'' + username + '\' does not exist.'
            };
        }
        var user = JSON.parse(userAsBytes.toString());
        user.productQuality = newQuality;
        await ctx.stub.putState('CONTRACTOR_' + username, Buffer.from(JSON.stringify(user)));
    }
    async allocateProject(ctx, username, projectID, bidID) {
        const userAsBytes = await ctx.stub.getState('CONTRACTOR_' + username);
        if (!userAsBytes || userAsBytes.length === 0) {
            return {
                success: 'false',
                message: 'Contractor with username: \'' + username + '\' does not exist.'
            };
        }
        var user = JSON.parse(userAsBytes.toString());
        user.activeProjectID = projectID;
        user.activeBidID = bidID;
        await ctx.stub.putState('CONTRACTOR_' + username, Buffer.from(JSON.stringify(user)));
    }
    async deallocateProject(ctx, username, rating, quality, review) {
        const userAsBytes = await ctx.stub.getState('CONTRACTOR_' + username);
        if (!userAsBytes || userAsBytes.length === 0) {
            return {
                success: 'false',
                message: 'Contractor with username: \'' + username + '\' does not exist.'
            };
        }
        var user = JSON.parse(userAsBytes.toString());
        const contractorProjectReviews = {
            id: user.activeProjectID.toString(),
            rating: rating.toString(),
            quality: quality.toString(),
            review: review.toString()
        };
        user.listOfPreviousProjects.push(contractorProjectReviews);
        user.activeProjectID = null;
        user.activeBidID = null;
        await ctx.stub.putState('CONTRACTOR_' + username, Buffer.from(JSON.stringify(user)));
    }
}

module.exports = User;
