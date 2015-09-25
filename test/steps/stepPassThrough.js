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
		this._push("out", message);
	}

	/**
	 * This method should be overwritten by the dreived class to setup the endpoints
	 * for this step.
	 */
	_setupEndpoints() {
		// do nothing. Should be imlemented by the drived class
		this._addEndpointFromConfig({
			"name": "in",
			"passive": true,
			"in": true
		});

		this._addEndpointFromConfig({
			"name": "out",
			"active": true,
			"out": true
		});
	}

}


module.exports = function (opts) {
	return new StepPassThrough(opts);
};
