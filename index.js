/* jslint node: true, esnext: true */
"use strict";

const step = require('./lib/step'),
	endpoint = require('./lib/endpoint'),
	managerMock = require('./test/manager-mock');

exports.Step = step.BaseStep;
exports.ScopeDefinitions = require('./lib/scopeDefinitions');

exports.createEndpoint = endpoint.createEndpoint;

// Used for test. Each step nest needs a manager. This is a mockup used for testing steps
exports.managerMock = managerMock;
