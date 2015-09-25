/* jslint node: true, esnext: true */
"use strict";

/**
 * Default endpoint implementation.
 * These endpoints just connecting steps with each other
 */
class Endpoint {

	/**
	 *
	 */
	constructor(config) {

		if (!config) {
			config = {};
		}

		// Set the name of this endpoint
		if (config.name) {
			this.name = config.name;
		} else {
			throw 'Error: An endpoint could not be created without a name';
		}

		// configure the behavior of this endpoint
		this.active = false;
		this.pasive = false;
		this.out = false;
		this.in = false;

		if (config.active !== undefined) {
			this.active = config.active;
		}
		if (config.pasive !== undefined) {
			this.pasive = config.pasive;
		}
		if (config.out !== undefined) {
			this.out = config.out;
		}
		if (config.in !== undefined) {
			this.in = config.in;
		}

		// This stores the connected endpoint
		this.connectedEndpoint = undefined;

		// if the connected endpoint is inPassive, then this is the iterator for it
		this.outActiveIterator = undefined;

		// the step this endpoint is in. Must be set when the endpoint is registered at the step
		this.step = undefined;
	}

	/**
	 * If this endpoint is 'in' and 'passive' this will return a generator
	 * funtion to push values in.
	 */
	getInPassiveIterator() {
		const step = this.step;
		const endpointName = this.name;
		return function* () {
			while (true) {
				const message = yield;
				step._receive(endpointName, message);
			}
		};
	}

	/**
	 * Connects an endpoint from an other step to this endpoint.
	 * The endpoint must be an incomming passive endpoint
	 */
	connectInPassive(endpoint) {
		if (this.out) {
			if (this.active) {
				// OK we can connect it
				this.connectedEndpoint = endpoint;
				this.outActiveIterator = endpoint.getInPassiveIterator()();
				this.outActiveIterator.next();
			}
		}
	}

	/**
	 * The push method. This method will be used if this endpoint
	 * is an 'active' 'out' endpoint
	 * @param message The message to be pushed to the next endpoint
	 */
	push(message) {
		if (this.connectedEndpoint) {
			// The message needs to be cloned.

			message.addHop(this.step.name);
			this.outActiveIterator.next(message);
		}
	}

}



module.exports = Endpoint;
