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
 * Defines some of the basics for the IN and OUT endpoint.
 */
class AbstractEndpoint {

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


		// the step this endpoint is in. Must be set when the endpoint is registered at the step
		this.step = undefined;
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
}


// Export the endpoint class
module.exports = AbstractEndpoint;
