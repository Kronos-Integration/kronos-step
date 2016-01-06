/* jslint node: true, esnext: true */
"use strict";

const step = require('./lib/step'),
	endpoint = require('./lib/endpoint'),
	ConnectorMixin = require('./lib/connector-mixin');

exports.endpoint = endpoint;

exports.Step = step.BaseStep;
exports.ScopeDefinitions = require('./lib/scopeDefinitions');

exports.ConnectorMixin = ConnectorMixin;

exports.createEndpoint = function (name, definition, step) {
	if (definition.in) {
		return new endpoint.ReceiveEndpoint(name, step);
	} else {
		return new endpoint.SendEndpoint(name, step);
	}
};
