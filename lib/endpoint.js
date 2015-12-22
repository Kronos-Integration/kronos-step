/* jslint node: true, esnext: true */
"use strict";

const ENDPOINT_ATTRIBUTES = ['in', 'out', 'active', 'passive', 'mandatory', 'default', 'description', 'uti'];
const DEFAULT_UTI = "public.data";

/*
 * Defines the default property values for this Step.
 */
const DEFAULT_PROPERTIES = {
	"active": false,
	"passive": false,
	"out": false,
	"in": false,

	// If true means that this endpoint is a mandatory endpoint of a step.
	// For the step it is mandatory that the endpoint is connected
	"mandatory": false,

	// This marks this endpoint as the default endpoint of a step.
	// This information is needed for creating the toJSON method
	"default": false,

	// The uti defines which data the endpoint could handle
	"uti": DEFAULT_UTI,
};


/**
 * Creates readonly properties for a given object
 * @param {Object} (mandatory) obj The object which where the properties should be added
 * @param {String} (mandatory) name The Name of the step
 * @param {Object} (optional) endpointConfiguration The configuration to be used for the properties
 * @param {Object} (optional) metaConfiguration A meta configuration where properties where
 *                            derived from if not given in the endpointConfiguration
 *
 */
function propertyConfigurer(obj, name, endpointConfiguration, metaConfiguration) {

	if (typeof endpointConfiguration === 'string') {
		const target = endpointConfiguration;
		endpointConfiguration = {};
		endpointConfiguration.target = target;
	}

	let target;

	const props = {
		name: {
			"value": name
		},
		target: {
			get: function () {
				return target;
			},
			set: function (newTaget) {
				target = newTaget;
			}
		}
	};

	if (endpointConfiguration.target) {
		target = endpointConfiguration.target;
	}


	ENDPOINT_ATTRIBUTES.forEach(
		key => {
			if (endpointConfiguration[key] !== undefined) {
				props[key] = {
					value: endpointConfiguration[key]
				};
			} else if (metaConfiguration && metaConfiguration[key] !== undefined) {
				props[key] = {
					value: metaConfiguration[key]
				};
			} else if (DEFAULT_PROPERTIES[key] !== undefined) {
				props[key] = {
					value: DEFAULT_PROPERTIES[key]
				};
			}
		}
	);

	Object.defineProperties(obj, props);
}

/**
 * Default endpoint implementation.
 * These endpoints just connecting steps with each other
 */
class Endpoint {

	/**
	 * Creates a new endpoint from the given configuration
	 * @param {String} endpointName The name of this endpoint
	 * @param {Object} endpointConfiguration The configuration for this endpoint
	 * @param {Object} metaConfiguration The meta configuration for this endpoint.
	 *                 This configuration will taken as a basis
	 * @api public
	 */
	constructor(endpointName, endpointConfiguration, metaConfiguration) {
		if (!endpointConfiguration) {
			throw new Error("No endpoint configuration given");
		}

		if (!endpointName) {
			throw new Error('An endpoint could not be created without a name');
		}

		propertyConfigurer(this, endpointName, endpointConfiguration, metaConfiguration);


		// This stores the connected endpoint
		this.connectedEndpoint = undefined;

		// if the connected endpoint is inPassive, then this is the iterator for it
		this.outActiveIterator = undefined;

		// the step this endpoint is in. Must be set when the endpoint is registered at the step
		this.step = undefined;

		//this.target = undefined;
	}

	toJSON() {
		const res = {};

		ENDPOINT_ATTRIBUTES.forEach(
			key => {
				if (this[key] !== undefined) {
					if (DEFAULT_PROPERTIES[key] !== undefined && DEFAULT_PROPERTIES[key] === this[key]) {
						return;
					}
					res[key] = this[key];
				}
			}
		);

		if (this.target) {
			res.target = this.target;
		}

		return res;
	}

	toString() {
		// TODO step / endpoint ?
		//if (this.step) return `${this.step}/${this.name}`;
		return `${this.name}:${['in','out','active','passive'].filter( a => { return this[a]; }).join(':')}`;
	}

	/**
	 * Returns true if the endpoint is already connected.
	 * @return connected True if the endpoint is already connected, else false
	 * @api public
	 */
	isConnected() {
		return this.connectedEndpoint;
	}

	/**
	 * If this endpoint is 'in' and 'passive' the step could set a generator
	 * which handles the incomming requests.
	 * @param {object} generator The generator to receive the incomming messages
	 * @api public
	 */
	setPassiveGenerator(generator) {
		if (this.in && this.passive) {
			this.inPassiveGenerator = generator;
		} else {
			throw new Error("It is not possible to set a genertaor if an endpoint is not 'in' and not 'passive'");
		}
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
		if (this.in && this.passive) {
			return this.inPassiveGenerator;
		} else {
			throw new Error(
				`${this}: It is not possible to get a 'inPassiveGenerator' if the endpoint is not 'in' and not 'passive'`);
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
			this.outActiveIterator = this.connectedEndpoint.getInPassiveGenerator()();
			this.outActiveIterator.next();
		}
		// send the message
		this.outActiveIterator.next(request);
	}

	/**
	 * Opens the endpoint for pulling out requests
	 * @param {Generator Function} generator
	 */
	receive(generator) {
		this.inPassiveGenerator = generator;
	}

	/**
	 * Connects an endpoint from an other step to this endpoint.
	 * The endpoint must be an incomming passive endpoint
	 * @api proteced
	 */
	_connectInPassive(endpoint) {
		if (this.out) {
			if (this.active) {
				// OK we can connect it
				this.connectedEndpoint = endpoint;
				endpoint.connectedEndpoint = this;
			}
		}
	}

	/**
	 * Connects an other endpoint to this one. It will check that the other endpoints
	 * matches this one. If not an error will be thrown.
	 * @api public
	 */
	connect(otherEndpoint) {
		if (!otherEndpoint) {
			throw new Error(`No endpoint given to be connected`);
		}

		if (this.isConnected() && this.isConnected() === otherEndpoint) {
			// nothing to do, already connected with the given endpoint
		} else {
			if (this.isConnected()) {
				throw new Error(
					`Could not connect the endpoint, the endpoint '${this}' is already connected with '${this.connectedEndpoint}'`
				);
			}
			if (otherEndpoint.isConnected()) {
				throw new Error(
					`Could not connect the endpoint, the endpoint '${otherEndpoint}' is already connected with '${otherEndpoint.connectedEndpoint}'`
				);
			}

			if (this.in && otherEndpoint.out) {
				if (this.passive && otherEndpoint.active) {
					otherEndpoint._connectInPassive(this);
				} else if (this.active && otherEndpoint.passive) {
					// not yet supported
					throw new Error(
						`Could not connect the endpoint '${this}' with the endpoint '${otherEndpoint}'. The combination 'out and passive' with 'in and active' is currently not supported`
					);
				}
			} else if (this.out && otherEndpoint.in) {
				if (this.passive && otherEndpoint.active) {
					// not yet supported
					throw new Error(
						`Could not connect the endpoint '${this}' with the endpoint '${otherEndpoint}'. The combination 'out and passive' with 'in and active' is currently not supported`
					);
				} else if (this.active && otherEndpoint.passive) {
					this._connectInPassive(otherEndpoint);
				}
			}

			if (!this.isConnected()) {
				throw new Error(`Could not connect the endpoint '${this}' with the endpoint '${otherEndpoint}'`);
			}
		}
	}
}

module.exports.createEndpoint = function (endpointName, endpointConfiguration, metaDefinition) {
	return new Endpoint(endpointName, endpointConfiguration, metaDefinition);
};
