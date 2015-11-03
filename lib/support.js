/* jslint node: true, esnext: true */
"use strict";

const Step = require('./step');

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
exports.create = function(manager, scopeReporter, baseStep, data, name) {
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

	const newStep = Object.create(parent, props);

	newStep.finalize(manager, scopeReporter, data);

	scopeReporter.leaveScope('step');

	return newStep;
}
