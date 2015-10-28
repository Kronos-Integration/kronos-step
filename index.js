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
	return _create(manager, scopeReporter, stepImpl, stepImpl.name);
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
		return Impl.create(manager, scopeReporter, data, name);
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
function _create(manager, scopeReporter, template, name) {

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
	if (template.extends) {
		template.extends = manager.steps[template.extends];
	} else {
		template.extends = Step;
	}

	const parent = template.extends;

	scopeReporter.enterScope('step', name);

	//console.log(`${parent} ${this}`);
	// create the endpoints from what we know

	// TODO find bettwer way to decide if parent or target itself can be used
	// const endpoints =
	// 	template._createEndpoints ? template._createEndpoints(scopeReporter, template) :
	// 	parent._createEndpoints.call(template, scopeReporter, template);

	let endpoints;
	if (template._createEndpoints) {
		endpoints = template._createEndpoints(scopeReporter, template);
	} else {
		endpoints = parent._createEndpoints.call(template, scopeReporter, template);
	}



	// prepare object properties
	// const props =
	// 	template._prepareProperties ? template._prepareProperties(manager, scopeReporter, name, template, endpoints) :
	// 	parent._prepareProperties.call(template, manager, scopeReporter, name, template, endpoints);

	let props;
	if (template._prepareProperties) {
		props = template._prepareProperties(manager, scopeReporter, name, template, endpoints);
	} else {
		props = parent._prepareProperties.call(template, manager, scopeReporter, name, template, endpoints);
	}


	// template._initialize ? template._initialize(manager, scopeReporter, name, template, endpoints, props) :
	// 	parent._initialize.call(template, manager, scopeReporter, name, template, endpoints, props);

	if (template._initialize) {
		template._initialize(manager, scopeReporter, name, template, endpoints, props);
	} else {
		parent._initialize.call(template, manager, scopeReporter, name, template, endpoints, props);
	}

	Object.keys(template).forEach((p) => {
		if (template.hasOwnProperty(p) && !props[p]) {
			console.log(`${name} copy ${p}`);

			props[p] = {
				value: template[p]
			};
		}
	});

	let newStep = Object.create(parent, props);

	newStep._createPredefinedEndpoints(scopeReporter, template);

	newStep.create = function (manager, scopeReporter, data, name) {
		return _create(manager, scopeReporter, data, name);
	};

	// @TODO markus: warum dieser Aufruf??
	parent._createEndpoints.call(template, scopeReporter, template);

	scopeReporter.leaveScope('step');

	// TODO remove replace with Object.getPrototypeOf()
	//newStep.prototype = base;

	console.log(`_create: ${name} ${parent} ${JSON.stringify(newStep)}`);
	return newStep;
}
