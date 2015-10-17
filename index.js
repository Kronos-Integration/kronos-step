/* jslint node: true, esnext: true */
"use strict";

const Step = require('./lib/step');
const endpoint = require('./lib/endpoint');
const message = require('./lib/message');

module.exports.Step = Step;

module.exports.Endpoint = endpoint.Endpoint;
module.exports.createEndpoint = endpoint.createEndpoint;
module.exports.message = message;

// registers some steps usefull for debugging
exports.registerWithManagerTest = function (manager) {
	manager.registerStep(require('./lib/steps/stepConsoleLogger'));
	manager.registerStep(require('./lib/steps/StepEventGenerator'));
	manager.registerStep(require('./lib/steps/stepPassThrough'));
};

/*
 * Creates a step from its configuration data
 * @param {Manager} manager kronos service manger
 * @param {ScopeReporter} scopeReporter
 * @param {String} name name of the steps
 * @param {Object} data step configuration data
 * @return {Step} nely created step
 */
exports.createStep = function (manager, scopeReporter, name, data) {

	// TODO what is the registration interface ?
	const impl = manager.stepImplementations[data.type];

	console.log(`${data.type} -> ${impl}`);

	if (!name) {
		name = data.name;
	}

	if (impl) {
		return new impl(manager, scopeReporter, name, data);
	} else {
		scopeReporter.error('Step implementation not found', 'step', name, data.type);
	}
}
