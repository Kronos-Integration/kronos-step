/* jslint node: true, esnext: true */
"use strict";

const step = require('./lib/step'),
	guardedEndpoint = require('./lib/endpoint');

exports.endpoint = require('./lib/endpoint');
exports.guardedEndpoint = guardedEndpoint;

exports.Step = step.BaseStep;
exports.ScopeDefinitions = require('./lib/scopeDefinitions');


exports.createEndpoint = function (name, definition, step) {
	console.log("deprecated use new directly");
	if (definition.in) {
		return new guardedEndpoint.GuardedReceiveEndpoint(name, step);
	} else {
		return new guardedEndpoint.GuardedSendEndpoint(name, step);
	}
};
