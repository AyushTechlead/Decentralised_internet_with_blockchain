/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Contract } = require('fabric-contract-api');

class User extends Contract {

    async initLedger(ctx) {
        // Number of contractors registered
        const numContractors = {
            numContractors: 0,
            docType: 'NUMCONTRACTORS'
        }
        await ctx.stub.putState('NUMCONTRACTORS', Buffer.from(JSON.stringify(numContractors)));

        // Max number of contractors that can be registered (= CONTRACTOR_NODES - 1)
        const maxContractors = {
            numContractors: 1,
            docType: 'MAXCONTRACTORS'
        }
        await ctx.stub.putState('MAXCONTRACTORS', Buffer.from(JSON.stringify(maxContractors)));

        return {
            success: 'true'
        };
    }

    async getUser(ctx, username, password) {
        const userAsBytes = await ctx.stub.getState('USER_' + username);
        if (!userAsBytes || userAsBytes.length === 0) {
            return {
                success: 'false',
                message: 'User with username: \'' + username + '\' does not exist.'
            };
        }

        const user = JSON.parse(userAsBytes.toString());
        if (user.password !== password) {
            return {
                success: 'false',
                message: 'User authentication failed. Please retry with correct password.'
            };
        }

        return userAsBytes.toString();
    }

    async getUserDetails(ctx, username) {
        const userAsBytes = await ctx.stub.getState('USER_' + username);
        if (!userAsBytes || userAsBytes.length === 0) {
            return {
                success: 'false',
                message: 'User with username: \'' + username + '\' does not exist.'
            };
        }

        return userAsBytes.toString();
    }
    async createUser(ctx, username, password, email, teamname, profilePic, name, contact, address, designation) {
        const user = {
            username: username,
            name: name,
            contact: contact,
            docType: 'USER',
            password: password,
            email: email,
            teamName: teamname,
            profilePic: profilePic,
            address: address,
            designation: designation
        };

        await ctx.stub.putState('USER_' + username, Buffer.from(JSON.stringify(user)));
        return {
            success: 'true'
        };
    }
    async updatePassword(ctx, username, password, newPass) {
        const userAsBytes = await ctx.stub.getState('USER_' + username);
        if (!userAsBytes || userAsBytes.length === 0) {
            return {
                success: 'false',
                message: 'User with username: \'' + username + '\' does not exist.'
            };
        }

        var user = JSON.parse(userAsBytes.toString());
        if (user.password !== password) {
            return {
                success: 'false',
                message: 'User authentication failed. Please retry with correct password.'
            };
        }
        user.password = newPass;
        await ctx.stub.putState('USER_' + username, Buffer.from(JSON.stringify(user)));

    }
    async getNumContractors(ctx) {
        const numContractorsAsBytes = await ctx.stub.getState('NUMCONTRACTORS');
        if (!numContractorsAsBytes || numContractorsAsBytes.length === 0) {
            return {
                success: 'false',
                message: 'NUMCONTRACTORS does not exist.'
            };
        }

        return numContractorsAsBytes.toString();
    }
    async updateNumContractors(ctx) {
        const numContractorsAsBytes = await ctx.stub.getState('NUMCONTRACTORS');
        if (!numContractorsAsBytes || numContractorsAsBytes.length === 0) {
            return {
                success: 'false',
                message: 'NUMCONTRACTORS does not exist.'
            };
        }

        const numContractors = JSON.parse(numContractorsAsBytes.toString());
        numContractors.numContractors += 1;

        await ctx.stub.putState('NUMCONTRACTORS', Buffer.from(JSON.stringify(numContractors)));
        return {
            success: 'true'
        };
    }
}

module.exports = User;
