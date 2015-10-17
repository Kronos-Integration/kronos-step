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
 * Creates a step from its configuration data.
 * 1.) Consultes the manager (stepImplementations) to retrieve the Step
 *     implementation class from the Step type
 * 2.) Initialize a new Step instance with the consiguration data
 * @param {Manager} manager kronos service manger
 * @param {ScopeReporter} scopeReporter
 * @param {String} name name of the steps
 * @param {Object} data step configuration data
 * @return {Step} newly created step
 */
exports.createStep = function (manager, scopeReporter, name, data) {

	// TODO what is the registration interface ?
	const Impl = manager.stepImplementations[data.type];

	if (!name) {
		name = data.name;
	}

	if (Impl) {
		return new Impl(manager, scopeReporter, name, data);
	} else {
		scopeReporter.error('Step implementation not found', 'step', name, data.type);
	}
};
