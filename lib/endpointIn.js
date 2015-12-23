/* jslint node: true, esnext: true */
"use strict";

const EndpointBase = require('./endpointBase');

/**
 * This endpoint could be connected multiple times with an other endpoint.
 */
class EndpointIn extends EndpointBase {

	constructor(endpointName, endpointConfiguration, metaConfiguration) {
		super(endpointName, endpointConfiguration, metaConfiguration);

		this.connectedEndpoints = [];
	}

	/**
	 * For this spezial endpoint, always return false. It is allowed to connect as many endpoints you want
	 * @return false Always returns false
	 * @api public
	 */
	isConnected() {
		return this.connectedEndpoints > 0;
	}


	connect(outEndpoint) {
		if (!outEndpoint) {
			throw new Error(`No endpoint given to connected to`);
		}

		if (outEndpoint.in) {
			throw new Error(
				`Could not connect this IN endpoint '${this}' with an other IN endpoint '${outEndpoint}'`
			);
		}

		outEndpoint.connect(this);
		this.connectedEndpoints.push(outEndpoint);
	}

	/**
	 * If this endpoint is 'in' and 'passive' the step could set a generator
	 * which handles the incomming requests.
	 * @param {object} generator The generator to receive the incomming messages
	 * @api public
	 */
	setPassiveGenerator(generator) {
		if (this.passive) {
			this.inPassiveGenerator = generator();
			this.inPassiveGenerator.next();
		} else {
			throw new Error("It is not possible to set a generator if an endpoint is not 'in' and not 'passive'");
		}
	}

	/**
	 * Opens the endpoint for pulling out requests
	 * @param {Generator Function} generator
	 */
	receive(generator) {
		this.setPassiveGenerator(generator);
	}

	registerReceiveCallback(receiveFunction) {
		this.setPassiveGenerator(
			function* () {
				while (true) {
					const message = yield;
					receiveFunction(message);
				}
			}
		);
	}

	/**
	 * If this endpoint is 'in' and 'passive' this will return a generator
	 * funtion to push values in. If no generator is there or the endpoint is not 'in' and not 'passive'
	 * an error will be thrown
	 * @return {Object} generator A generator to send messages to
	 * @api public
	 */
	getInPassiveGenerator() {
		if (!this.inPassiveGenerator) {
			throw new Error(`${this}: There was no 'inPassiveGenerator' set, so it could not return any`);
		}
		if (this.passive) {
			return this.inPassiveGenerator;
		} else {
			throw new Error(
				`${this}: It is not possible to get a 'inPassiveGenerator' if the endpoint is not 'in' and not 'passive'`);
		}
	}

}

// Export the endpoint class
module.exports.EndpointIn = EndpointIn;

module.exports.createEndpointIn = function (endpointName, endpointConfiguration, metaDefinition) {
	return new EndpointIn(endpointName, endpointConfiguration, metaDefinition);
};
