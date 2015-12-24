/* jslint node: true, esnext: true */
"use strict";

const step = require('./lib/step'),
	endpointIn = require('./lib/endpointIn'),
	endpointOut = require('./lib/endpointOut');

exports.Step = step.BaseStep;
exports.ScopeDefinitions = require('./lib/scopeDefinitions');

exports.createEndpoint = function (endpointName, endpointConfiguration, metaDefinition) {
	if (endpointConfiguration.in) {
		return endpointIn.createEndpointIn(endpointName, endpointConfiguration, metaDefinition);
	} else {
		return endpointOut.createEndpointOut(endpointName, endpointConfiguration, metaDefinition);
	}
};
