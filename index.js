/* jslint node: true, esnext: true */
"use strict";

const step = require('./lib/step');
const endpoint = require('./lib/endpoint');

exports.endpoint = endpoint;

exports.Step = step.BaseStep;
exports.ScopeDefinitions = require('./lib/scopeDefinitions');

exports.createEndpoint = function (name, definition, step) {
	if (definition.in) {
		return new endpoint.ReceiveEndpoint(name, step);
	} else {
		return new endpoint.SendEndpoint(name, step);
	}
};
