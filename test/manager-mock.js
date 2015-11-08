/* jslint node: true, esnext: true */
"use strict";

/*
 * Almost every step test needs a monager mock. So this would be a general mock for it.
 *
 */

const scopeReporter = require('scope-reporter');
const events = require('events');
const scopeDefinitions = require('../lib/scopeDefinitions');

// ---------------------------
// Create a mock manager
// ---------------------------
const sr = scopeReporter.createReporter(scopeDefinitions);
let stepImplementations = {};
let flows = {};

const manager = Object.create(new events.EventEmitter(), {
	steps: {
		value: stepImplementations
	},
	flows: {
		value: flows
	},
	scopeReporter: {
		value: sr
	}
});
manager.registerStepImplementation = function (si) {
	stepImplementations[si.name] = si;
};

manager.registerFlow = function (flow) {
	flows[flow.name] = flow;
};

manager.getFlow = function (flowName) {
	return flows[flowName];
};

manager.getStepInstance = function (configuration) {
	const stepImpl = stepImplementations[configuration.type];
	if (stepImpl) {
		return stepImpl.createInstance(this, this.scopeReporter, configuration);
	}
};


module.exports = manager;
