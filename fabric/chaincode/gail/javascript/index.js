/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const User = require('./lib/user');
const Project = require('./lib/project');
const Bid = require('./lib/bid');

module.exports.User = User;
module.exports.Project = Project;
module.exports.Bid = Bid;
module.exports.contracts = [ User, Project,Bid ];
