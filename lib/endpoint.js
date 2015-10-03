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
		this.passive = false;
		this.out = false;
		this.in = false;

		if (config.active !== undefined) {
			this.active = config.active;
		}
		if (config.passive !== undefined) {
			this.passive = config.passive;
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
	 * Returns true if the endpoint is already connected.
	 * @return connected True if the endpoint is already connected, else false
	 */
	isConnected() {
		return this.connectedEndpoint;
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
				endpoint.connectedEndpoint = this;
				this.outActiveIterator = endpoint.getInPassiveIterator()();
				this.outActiveIterator.next();
			}
		}
	}

	/**
	 * Connects an other endpoint to this one. It will check that the other endpoints
	 * matches this one. If not an error will be thrown.
	 */
	connect(otherEndpoint) {
		const self = this;

		if (self.isConnected()) {
			throw `Could not conect the endpoint, the endpoint '${self.name}' is already connected with '${self.connectedEndpoint.name}'`;
		}
		if (otherEndpoint.isConnected()) {
			throw `Could not conect the endpoint, the endpoint '${otherEndpoint.name}' is already connected with '${otherEndpoint.connectedEndpoint.name}'`;
		}

		if (self.in && otherEndpoint.out) {
			if (self.passive && otherEndpoint.active) {
				otherEndpoint.connectInPassive(self);
			} else if (self.active && otherEndpoint.passive) {
				// not yet supported
				throw `Could not contain the endpoint '${self.name}' with the endpoint '${otherEndpoint.name}'. The combination 'out and passive' with 'in and active' is currently not supported`;
			}
		} else if (self.out && otherEndpoint.in) {
			if (self.passive && otherEndpoint.active) {
				// not yet supported
				throw `Could not contain the endpoint '${self.name}' with the endpoint '${otherEndpoint.name}'. The combination 'out and passive' with 'in and active' is currently not supported`;
			} else if (self.active && otherEndpoint.passive) {
				self.connectInPassive(otherEndpoint);
			}
		}

		if (!self.isConnected()) {
			throw `Could not conect the endpoint '${self.name}' with the endpoint '${otherEndpoint.name}'`;
		}
	}

	/**
	 * The push method. This method will be used if this endpoint
	 * is an 'active' 'out' endpoint
	 * @param message The message to be pushed to the next endpoint
	 */
	push(message) {
		if (this.connectedEndpoint) {
			message.addHop(this.step.name);
			this.outActiveIterator.next(message);
		}
	}

}



module.exports = Endpoint;
