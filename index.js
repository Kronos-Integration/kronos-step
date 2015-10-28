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
	return _create(manager, scopeReporter, stepImpl, {}, stepImpl.name);
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
 * @param {Object} stepConfiguration The default step configuration
 * @param {String} name of the step
 * @api protected
 */
function _create(manager, scopeReporter, baseStep, data, name) {

	if (!manager) {
		throw new Error("No 'kronos' service manager given");
	}
	if (!scopeReporter) {
		throw new Error("No 'scopeReporter' given");
	}
	if (!name) {
		throw new Error("No 'name' given");
	}

	// set default base class
	/* if (baseStep.extends) {
		baseStep.extends = manager.steps[baseStep.extends];
	} else {
		baseStep.extends = Step;
	}*/

	const parent = baseStep.extends ? manager.steps[baseStep.extends] : Step;

	scopeReporter.enterScope('step', name);

	//console.log(`${parent} ${this}`);
	// create the endpoints from what we know

	// TODO find bettwer way to decide if parent or target itself can be used
	// const endpoints =
	// 	baseStep._createEndpoints ? baseStep._createEndpoints(scopeReporter, baseStep) :
	// 	parent._createEndpoints.call(baseStep, scopeReporter, baseStep);

	let endpoints;
	if (baseStep._createEndpoints) {
		endpoints = baseStep._createEndpoints(scopeReporter, baseStep, data);
	} else {
		endpoints = parent._createEndpoints.call(baseStep, scopeReporter, baseStep, data);
	}



	// prepare object properties
	// const props =
	// 	baseStep._prepareProperties ? baseStep._prepareProperties(manager, scopeReporter, name, baseStep, endpoints) :
	// 	parent._prepareProperties.call(baseStep, manager, scopeReporter, name, baseStep, endpoints);

	let props;
	if (baseStep._prepareProperties) {
		props = baseStep._prepareProperties(manager, scopeReporter, name, data, endpoints);
	} else {
		props = parent._prepareProperties.call(baseStep, manager, scopeReporter, name, data, endpoints);
	}


	// baseStep._initialize ? baseStep._initialize(manager, scopeReporter, name, baseStep, endpoints, props) :
	// 	parent._initialize.call(baseStep, manager, scopeReporter, name, baseStep, endpoints, props);

	if (baseStep._initialize) {
		baseStep._initialize(manager, scopeReporter, name, data, endpoints, props);
	} else {
		parent._initialize.call(baseStep, manager, scopeReporter, name, data, endpoints, props);
	}

	Object.keys(baseStep).forEach((p) => {
		if (baseStep.hasOwnProperty(p) && !props[p]) {
			console.log(`${name} copy ${p}`);

			props[p] = {
				value: baseStep[p]
			};
		}
	});

	let newStep = Object.create(parent, props);

	newStep._createPredefinedEndpoints(scopeReporter, baseStep);

	/*	newStep.create = function (manager, scopeReporter, data, name) {
			data.extends = this.type;
			return _create(manager, scopeReporter, data, name);
		};*/

	// @TODO markus: warum dieser Aufruf??
	//parent._createEndpoints.call(baseStep, scopeReporter, baseStep);

	scopeReporter.leaveScope('step');

	// TODO remove replace with Object.getPrototypeOf()
	//newStep.prototype = base;

	console.log(`_create: ${name} ${parent} ${JSON.stringify(newStep)}`);
	return newStep;
}
