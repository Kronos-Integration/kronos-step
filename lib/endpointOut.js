/* jslint node: true, esnext: true */
"use strict";

const EndpointBase = require('./endpointBase');

/**
 * This endpoint could be connected multiple times with an other endpoint.
 */
class EndpointOut extends EndpointBase {

	constructor(endpointName, endpointConfiguration, metaConfiguration) {
		super(endpointName, endpointConfiguration, metaConfiguration);

		// stores the connected IN endpoint.
		this.connectedEndpoint = undefined;

		// The iterator used to send the messages to
		this.outActiveIterator = undefined;
	}

	/**
	 * For this spezial endpoint, always return false. It is allowed to connect as many endpoints you want
	 * @return false Always returns false
	 * @api public
	 */
	isConnected() {
		return this.connectedEndpoint;
	}

	connect(inEndpoint) {
		if (!inEndpoint) {
			throw new Error(`No endpoint given to connected to`);
		}

		if (inEndpoint.out) {
			throw new Error(
				`Could not connect this out endpoint '${this}' with an other OUT endpoint '${inEndpoint}'`
			);
		}

		if (this.isConnected() && this.isConnected() === inEndpoint) {
			// nothing to do, already connected with the given endpoint
		} else {
			if (this.isConnected()) {
				throw new Error(
					`Could not connect to the endpoint, this endpoint '${this}' is already connected with '${this.connectedEndpoint}'`
				);
			}

			if (this.passive && inEndpoint.active) {
				// not yet supported
				throw new Error(
					`Could not connect this endpoint '${this}' with the endpoint '${inEndpoint}'. The combination 'out and passive' with 'in and active' is currently not supported`
				);
			} else if (this.active && inEndpoint.active) {
				throw new Error(`Could not connect the endpoint '${this}' with the endpoint '${inEndpoint}'`);
			} else if (this.passive && inEndpoint.passive) {
				throw new Error(`Could not connect the endpoint '${this}' with the endpoint '${inEndpoint}'`);
			} else if (this.active && inEndpoint.passive) {
				this._connectInPassive(inEndpoint);
			}
		}
	}

	/**
	 * Connects an endpoint from an other step to this endpoint.
	 * The endpoint must be an incomming passive endpoint
	 * @api proteced
	 */
	_connectInPassive(inEndpoint) {
		if (this.out) {
			if (this.active) {
				// OK we can connect it
				this.connectedEndpoint = inEndpoint;
			}
		}
	}

	/**
	 * Sends a request to the target endpoint
	 * @param {Object} request The request to be send
	 * @api public
	 */
	send(request) {
		if (!this.outActiveIterator) {
			if (!this.isConnected()) {
				throw new Error(`The endpoint '${this}' is not connected`);
			}
			const passiveGenerator = this.connectedEndpoint.getInPassiveGenerator();
			this.outActiveIterator = passiveGenerator;
		}
		// send the message
		this.outActiveIterator.next(request);
	}
}

// Export the endpoint class
module.exports.EndpointOut = EndpointOut;

module.exports.createEndpointOut = function (endpointName, endpointConfiguration, metaDefinition) {
	return new EndpointOut(endpointName, endpointConfiguration, metaDefinition);
};
