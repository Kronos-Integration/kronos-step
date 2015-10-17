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

exports.createStep = function (manager, sr, clazz, name, data) {
	return new clazz(manager, sr, name, data);
}
