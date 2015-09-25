/* jslint node: true, esnext: true */
"use strict";

const baseStep = require('../../lib/step');
const messageFactory = require('../../lib/message');
const STATUS = require('./status');


class StepEventGenerator extends baseStep {
	constructor(config) {
		super(config);


	}

	/**
	 * Initializes the step
	 * Müsste eine promise zurück liefern. Aber für den test hier geht es auch so
	 */
	start() {
		for (let i = 0; i < 3; i++) {
			console.log("starter: round " + i);

			const message = messageFactory({
				"messageNumber": i
			});

			message.payload = "Payload " + i;

			this._push("out", message);
		}
	}

	stop() {
		this.status = STATUS.stopping;
	}

	/**
	 * This method should be overwritten by the dreived class to setup the endpoints
	 * for this step.
	 */
	_setupEndpoints() {
		// do nothing. Should be imlemented by the drived class
		this._addEndpointFromConfig({
			"name": "out",
			"active": true,
			"out": true
		});
	}


}



module.exports = function (opts) {
	return new StepEventGenerator(opts);
};
