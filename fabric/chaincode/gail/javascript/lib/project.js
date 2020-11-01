/*
* Copyright IBM Corp. All Rights Reserved.
*
* SPDX-License-Identifier: Apache-2.0
*/

'use strict';

const { Contract } = require('fabric-contract-api');

class Project extends Contract {

    async createProject(ctx, username, id, title, description, createTimeStamp, deadline, brochurePath, type, evaluation_review) {
        const project = {
            username: username,
            docType: 'PROJECT',
            id: id,
            title: title,
            description: description,
            status: 'floated', //in-progress, in-shipment, in-review, complete_accepted, complete_rejected
            contractor_id: null,
            bid_id: null,
            progress: [],
            createTimeStamp: createTimeStamp,
            deadline: deadline,
            brochurePath: brochurePath,
            type: type,
            evaluation_review: evaluation_review
        };

        await ctx.stub.putState('PROJECT_' + id, Buffer.from(JSON.stringify(project)));

        var arr = [];
        const temp = {
            docType: 'PROJECT_BIDS',
            bids: arr,
        };
        await ctx.stub.putState('APPLIED_' + id, Buffer.from(JSON.stringify(temp)));

        return {
            success: 'true'
        };
    }

    async getProject(ctx, id) {
        const projectAsBytes = await ctx.stub.getState('PROJECT_' + id);
        if (!projectAsBytes || projectAsBytes.length === 0) {
            return {
                success: 'false',
                message: 'Project with id: \'' + id + '\' does not exist.'
            };
        }
        return projectAsBytes.toString();

    }
    async updateProjectBidID(ctx, id, bidID) {
        const projectAsBytes = await ctx.stub.getState('PROJECT_' + id);
        if (!projectAsBytes || projectAsBytes.length === 0) {
            return {
                success: 'false',
                message: 'Project with id: \'' + id + '\' does not exist.'
            };
        }
        var project = JSON.parse(projectAsBytes.toString());
        project.bid_id = bidID;
        await ctx.stub.putState('PROJECT_' + id, Buffer.from(JSON.stringify(project)));
    }
    async updateProjectContractor(ctx, id, contractorUsername) {
        const projectAsBytes = await ctx.stub.getState('PROJECT_' + id);
        if (!projectAsBytes || projectAsBytes.length === 0) {
            return {
                success: 'false',
                message: 'Project with id: \'' + id + '\' does not exist.'
            };
        }
        var project = JSON.parse(projectAsBytes.toString());
        project.contractor_id = contractorUsername;
        await ctx.stub.putState('PROJECT_' + id, Buffer.from(JSON.stringify(project)));
    }
    async updateProjectStatus(ctx, id, status) {
        const projectAsBytes = await ctx.stub.getState('PROJECT_' + id);
        if (!projectAsBytes || projectAsBytes.length === 0) {
            return {
                success: 'false',
                message: 'Project with id: \'' + id + '\' does not exist.'
            };
        }
        var project = JSON.parse(projectAsBytes.toString());
        project.status = status;
        await ctx.stub.putState('PROJECT_' + id, Buffer.from(JSON.stringify(project)));
    }
    async updateProjectProgress(ctx, id, description, timestamp) {
        const projectAsBytes = await ctx.stub.getState('PROJECT_' + id);
        if (!projectAsBytes || projectAsBytes.length === 0) {
            return {
                success: 'false',
                message: 'Project with id: \'' + id + '\' does not exist.'
            };
        }
        var curStatus = {
            description: description,
            timestamp: timestamp
        };
        var project = JSON.parse(projectAsBytes.toString());
        project.progress.push(curStatus);
        await ctx.stub.putState('PROJECT_' + id, Buffer.from(JSON.stringify(project)));
    }
    async updateProjectEvaluationReview(ctx, id, evaluation_review) {
        const projectAsBytes = await ctx.stub.getState('PROJECT_' + id);
        if (!projectAsBytes || projectAsBytes.length === 0) {
            return {
                success: 'false',
                message: 'Project with id: \'' + id + '\' does not exist.'
            };
        }
        var project = JSON.parse(projectAsBytes.toString());
        project["evaluation_review"] = evaluation_review;
        await ctx.stub.putState('PROJECT_' + id, Buffer.from(JSON.stringify(project)));
    }

    async createNumProjects(ctx) {
        const numProjects = {
            num: '0',
            docType: 'NUMPROJECTS'
        };
        await ctx.stub.putState('NUMPROJECTS', Buffer.from(JSON.stringfy(numProjects)));
    }

    async getNumProjects(ctx) {
        const numProjectsAsBytes = await ctx.stub.getState('NUMPROJECTS');
        if (!numProjectsAsBytes || numProjectsAsBytes.length === 0) {
            return {
                success: 'false',
                message: 'NUMPROJECTS does not exist.'
            };
        }
        return numProjectsAsBytes.toString();
    }

    async incrementNumProjects(ctx) {
        const numProjects = {
            num: '1',
            docType: 'NUMPROJECTS'
        };
        const numProjectsAsBytes = await ctx.stub.getState('NUMPROJECTS');
        if (!numProjectsAsBytes || numProjectsAsBytes.length === 0) {
            await ctx.stub.putState('NUMPROJECTS', Buffer.from(JSON.stringify(numProjects)));
        }
        else {
            const numProj = JSON.parse(numProjectsAsBytes.toString());
            const newNumProj = numProj;
            newNumProj.num = (parseInt(numProj.num) + 1).toString();
            await ctx.stub.putState('NUMPROJECTS', Buffer.from(JSON.stringify(newNumProj)));
        }
        return {
            success: 'true'
        };
    }
}

module.exports = Project;
