/* jslint node: true, esnext: true */
"use strict";

const step = require('./lib/step'),
	endpoint = require('./lib/endpoint');

exports.endpoint = endpoint;
exports.interceptor = require('./lib/interceptor');;

exports.Step = step.BaseStep;
exports.ScopeDefinitions = require('./lib/scopeDefinitions');

exports.createEndpoint = function (name, definition, step) {
	if (definition.in) {
		return new endpoint.ReceiveEndpoint(name, step);
	} else {
		return new endpoint.SendEndpoint(name, step);
	}
};

exports.registerWithManager = function (manager) {
	manager.registerInterceptor(exports.interceptor.RequestLimitingInterceptor);
	manager.registerInterceptor(exports.interceptor.TimeoutInterceptor);
}
