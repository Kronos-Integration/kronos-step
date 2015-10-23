/* jslint node: true, esnext: true */
"use strict";

const Step = require('./lib/step');
const endpoint = require('./lib/endpoint');

module.exports.Step = Step;
module.exports.ScopeDefinitions = require('./lib/scopeDefinitions');

module.exports.Endpoint = endpoint.Endpoint;
module.exports.createEndpoint = endpoint.createEndpoint;


exports.registerWithManager = function (manager) {
	manager.registerStepImplementation(Step);
};

/**
 * Prepares a step for registration
 * @param {Object} manager
 * @param {ScopeReporter} scopeReporter
 * @param {Object} stepImpl
 * @return {Step} step ready for registration
 */
exports.prepareStepForRegistration = function (manager, scopeReporter, stepImpl) {

	// set default base class
	if (stepImpl.extends) {
		stepImpl.extends = manager.steps[stepImpl.extends];
	} else {
		stepImpl.extends = Step;
	}

	const base = stepImpl.extends;
	const step = base.create.call(stepImpl, manager, scopeReporter, stepImpl.name, {});

	return step;
};

/*
 * Creates a step from its configuration data.
 * 1.) Consultes the manager (stepImplementations) to retrieve the Step
 *     implementation class from the Step type
 * 2.) Initialize a new Step instance with the consiguration data
 * @param {Manager} manager kronos service manger
 * @param {ScopeReporter} scopeReporter
 * @param {Object} data step configuration data
 * @param {String} name optional name of the steps
 * @return {Step} newly created step
 */
exports.createStep = function (manager, scopeReporter, data, name) {

	// The data type is mandatory
	if (!data.type) {
		scopeReporter.error(`The step ${name} has not type defined`, 'step', name);
		return;
	}


	const Impl = manager.steps[data.type];

	if (!name) {
		name = data.name;
	}

	if (Impl) {
		return Impl.create(manager, scopeReporter, name, data);
	} else {
		scopeReporter.error('Step implementation not found', 'step', name, data.type);
	}
};
