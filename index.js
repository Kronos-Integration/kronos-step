/* jslint node: true, esnext: true */
"use strict";

const Step = require('./lib/step');
const endpoint = require('./lib/endpoint');

module.exports.Step = Step;
module.exports.ScopeDefinitions = require('./lib/scopeDefinitions');

module.exports.createEndpoint = endpoint.createEndpoint;


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
	return _create(manager, scopeReporter, stepImpl, {}, stepImpl.name);
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
		return _create(manager, scopeReporter, baseStep, data, name);
		//return Impl.create(manager, scopeReporter, data, name);
	} else {
		scopeReporter.error('Step implementation not found', 'step', name, data.type);
	}
};


/**
 * Step factory.
 * @param {Step} parent Step
 * @param {Manager} manager
 * @param {Object} scopeReporter This reporter is used to report parsing errors
 * @param {Step} baseStep The base step
 * @param {Object} data configuration of the new step
 * @param {String} name of the step
 * @api protected
 */
function _create(manager, scopeReporter, baseStep, data, name) {

	if (!scopeReporter) {
		// get default scopereporter
		scopeReporter = manager.scopeReporter;
	}

	if (!manager) {
		throw new Error("No 'kronos' service manager given");
	}
	if (!name) {
		throw new Error("No 'name' given");
	}


	// set default base class
	let parent;
	if (baseStep.extends) {
		parent = manager.steps[baseStep.extends];
		if (!parent) {
			throw new Error(`The base step '${baseStep.extends}' is not registered. Error in step '${name}'`);
		}
	} else {
		parent = Step;
	}

	scopeReporter.enterScope('step', name);

	let endpoints;
	if (baseStep._createEndpoints) {
		endpoints = baseStep._createEndpoints(scopeReporter, baseStep, data);
	} else {
		endpoints = parent._createEndpoints.call(baseStep, scopeReporter, baseStep, data);
	}



	// prepare object properties
	let props;
	if (baseStep._prepareProperties) {
		props = baseStep._prepareProperties(manager, scopeReporter, name, data, endpoints);
	} else {
		props = parent._prepareProperties.call(baseStep, manager, scopeReporter, name, data, endpoints);
	}

	if (baseStep.initialize) {
		baseStep.initialize(manager, scopeReporter, name, data, endpoints, props);
	} else {
		parent.initialize.call(baseStep, manager, scopeReporter, name, data, endpoints, props);
	}

	Object.keys(baseStep).forEach((p) => {
		if (baseStep.hasOwnProperty(p) && !props[p]) {
			props[p] = {
				value: baseStep[p]
			};
		}
	});

	// TODO das muss ganz weg. bject create muss überarbeitet werden
	props.finalize = {
		value: baseStep.finalize
	};

	let newStep = Object.create(parent, props);


	newStep._createPredefinedEndpoints(scopeReporter, baseStep);


	if (!newStep.getInstance) {
		newStep.getInstance = function (manager, scopeReporter, stepDefinition) {
			const newInstance = _create(manager, scopeReporter, this, stepDefinition, stepDefinition.name);
			// Finalize the object
			newInstance.finalize(manager, scopeReporter, stepDefinition);
			return newInstance;
		};
	}

	scopeReporter.leaveScope('step');


	return newStep;
}
