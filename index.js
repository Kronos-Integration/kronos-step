/* jslint node: true, esnext: true */
"use strict";

const step = require('./lib/step'),
	endpoint = require('./lib/endpoint');

exports.Step = step.BaseStep;
exports.ScopeDefinitions = require('./lib/scopeDefinitions');

exports.createEndpoint = endpoint.createEndpoint;
