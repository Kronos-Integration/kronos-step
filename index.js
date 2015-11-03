/* jslint node: true, esnext: true */
"use strict";

const Step = require('./lib/step'),
	endpoint = require('./lib/endpoint'),
	support = require('./lib/support');

exports.Step = Step;
exports.ScopeDefinitions = require('./lib/scopeDefinitions');

exports.createEndpoint = endpoint.createEndpoint;

exports.registerWithManager = function (manager) {
	manager.registerStepImplementation(prepareStepForRegistration(manager, undefined, Step));
};

/**
 * Prepares a step for registration
 * @param {Object} manager
 * @param {ScopeReporter} scopeReporter
 * @param {Object} stepImpl
 * @return {Step} step ready for registration
 */
function prepareStepForRegistration(manager, scopeReporter, stepImpl) {
	return support.create(manager, scopeReporter, stepImpl, {}, stepImpl.name);
}

exports.prepareStepForRegistration = prepareStepForRegistration;

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

	if (!scopeReporter) {
		// get default scopereporter
		scopeReporter = manager.scopeReporter;
	}

	// The data type is mandatory
	if (!data.type) {
		scopeReporter.error(`The step ${name} has not type defined`, 'step', name);
		return;
	}

	const baseStep = manager.steps[data.type];

	if (!name) {
		name = data.name;
	}

	if (baseStep) {
		return support.create(manager, scopeReporter, baseStep, data, name);
	} else {
		scopeReporter.error('Step implementation not found', 'step', name, data.type);
	}
};
