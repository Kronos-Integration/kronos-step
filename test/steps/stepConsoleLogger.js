/* jslint node: true, esnext: true */
"use strict";

const baseStep = require('../../lib/step');
const messageFactory = require('../../lib/message');

class StepPassThrough extends baseStep {
	constructor(config) {
		super(config);
	}

	/**
	 * receives messages from incomming endpoints
	 */
	_receive(endpointName, message) {
		console.log("------------------------------------------");
		console.log(`Received a message on endpoint '${endpointName}'`);
		console.log("------------------------------------------");
		console.log(message);
		console.log("\n");

	}


	_setupEndpoints() {
		this._addEndpointFromConfig({
			"name": "in",
			"passive": true,
			"in": true
		});
	}
}

module.exports = function (opts) {
	return new StepPassThrough(opts);
};
