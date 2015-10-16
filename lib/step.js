/* jslint node: true, esnext: true */

"use strict";

const states = require('./states');
const endpoint = require('./endpoint');
const loggingSupport = require('./loggingSupport');
const myScopeReporter = require('scope-reporter');
const scopeDefinitions = require('../lib/scopeDefinitions');


/**
 * Creates the properties for a given object
 * @param {Object} (mandatory) obj The object which where the properties should be added
 * @param {Object} manager The kronos service manager
 * @param {String} (mandatory) name The Name of the step
 * @param {Object} (optional) stepDefinition The step definition
 *
 */
function propertyConfigurer(obj, manager, name, stepDefinition) {
	let state = "stopped";

	const props = {
		name: {
			value: name
		},
		type: {
			value: stepDefinition.type
		},
		manager: {
			value: manager
		},
		state: {
			get: function () {
				return state;
			},
			set: function (newState) {
				if (state != newState) {
					const oldState = state;
					state = newState;
					this._stateChanged(oldState, newState);
				}
			}
		},
		/**
		 * @return {Boolean} if step is in a running state
		 */
		isRunning: {
			get: function () {
				return state === 'running' || state === 'starting';
			}
		},
	};

	if (stepDefinition.description) {
		props.description = {
			value: stepDefinition.description
		};
	}

	Object.defineProperties(obj, props);
}



class Step {

	/**
	 * Creates a step
	 * @param {Object} manager The kronos service manager
	 * @param {Object} scopeReporter This reporter is used to report parsing errors
	 * @param {String} name The name for this step
	 * @param {Object} stepDefinition The json step definition
	 */
	constructor(manager, scopeReporter, name, stepDefinition) {
		if (!scopeReporter) {
			scopeReporter = myScopeReporter.createReporter(scopeDefinitions, function (reporter) {
				// do nothing
			});
		}

		scopeReporter.enterScope('step', name);

		if (!manager) {
			throw new Error("No 'kronos' service manager given");
		}
		if (!scopeReporter) {
			throw new Error("No 'scopeReporter' given");
		}
		if (!name) {
			throw new Error("No 'name' given");
		}
		if (!stepDefinition) {
			throw new Error("No 'stepDefinition' given");
		}

		// Stores all endpoints of this step by its name
		this.endpoints = {};


		propertyConfigurer(this, manager, name, stepDefinition);

		// Now initialize this step
		this._initialize(scopeReporter, Step.configuration, stepDefinition);

		this._stateChanged(undefined, this.state);

		scopeReporter.leaveScope('step');
	}


	/**
	 * Initializes a step.
	 * This method may be overwritten by derived classes.
	 * @param {Object} scopeReporter This reporter is used to report parsing errors
	 * @param {Object} stepConfiguration The default step configuration
	 * @param {Object} stepDefinition The json step definition
	 * @api protected
	 */
	_initialize(scopeReporter, stepConfiguration, stepDefinition) {
		this._beforeInitialize(scopeReporter, stepConfiguration, stepDefinition);
		let endpoints = this._setupEndpointsFromConfig(scopeReporter, stepConfiguration, stepDefinition);
		endpoints = this._setupPredefinedEndpoints(endpoints, scopeReporter, stepConfiguration, stepDefinition);
		endpoints = this._setupEndpoints(endpoints, scopeReporter, stepConfiguration, stepDefinition);
		this._afterInitialize(endpoints, scopeReporter, stepConfiguration, stepDefinition);
	}

	/**
	 * Could be overwritten by a derived object. This method is the first method called from
	 * the initialize function.
	 * @param {Object} scopeReporter This reporter is used to report parsing errors
	 * @param {Object} stepConfiguration The default step configuration
	 * @param {Object} stepDefinition The json step definition
	 * @api protected
	 */
	_beforeInitialize(scopeReporter, stepConfiguration, stepDefinition) {}

	/**
	 * Could be overwritten by a derived object. This method is the last method called from
	 * the initialize function.
	 * @param {Object} scopeReporter This reporter is used to report parsing errors
	 * @param {Object} stepConfiguration The default step configuration
	 * @param {Object} stepDefinition The json step definition
	 * @api protected
	 */
	_afterInitialize(scopeReporter, stepConfiguration, stepDefinition) {}


	/**
	 * This method could be overwritten by a derived object to setup default endpoints.
	 * The derived method should call super first.
	 * This method may be overwritten by derived classes.
	 * This will be called by the initialize method
	 * @param {Object} scopeReporter This reporter is used to report parsing errors
	 * @param {Object} stepConfiguration The default step configuration
	 * @param {Object} stepDefinition The json step definition
	 * @return {Object} endpoints A hash containing the endpoints stored by its name
	 * @api protected
	 */
	_setupPredefinedEndpoints(scopeReporter, stepConfiguration, stepDefinition) {
		const logEndpoint = endpoint.createEndpoint("log", {
			"description": "logging endpoint. All logging goes through this endpoint",
			"out": true,
			"active": true,
			"default": true
		});
		this.putEndpoint(logEndpoint);

		const loggerFunction = function (args) {
			if (logEndpoint.isConnected()) {
				logEndpoint.send(args);
			} else {
				console.log(args);
			}
		};

		loggingSupport.assignLoggerFunctions(this, loggerFunction);
	}

	/**
	 * Derived objects should implement this method to setup the endpoints
	 * This will be called by the initialize method
	 * @param {Object} scopeReporter This reporter is used to report parsing errors
	 * @param {Object} stepConfiguration The default step configuration
	 * @param {Object} stepDefinition The json step definition
	 * @return {Object} endpoints A hash containing the endpoints stored by its name
	 * @api protected
	 */
	_setupEndpoints(scopeReporter, stepConfiguration, stepDefinition) {}

	/**
	 * This method creates the endpoint objects dfefined in the stepDefinition
	 * @param {Object} scopeReporter This reporter is used to report parsing errors
	 * @param {Object} stepConfiguration The default step configuration
	 * @param {Object} stepDefinition The json step definition
	 * @return {Object} endpoints A hash containing the endpoints stored by its name
	 * @api protected
	 */
	_setupEndpointsFromConfig(scopeReporter, stepConfiguration, stepDefinition) {
		if (stepDefinition.endpoints) {
			for (const endpoinName in stepDefinition.endpoints) {
				const ep = endpoint.createEndpoint(endpoinName, stepDefinition.endpoints[endpoinName]);
				this.putEndpoint(ep);
			}
		}
	}

	/**
	 * Sends a 'stepStateChanged' event to the manager.
	 * arguments are:
	 *  step,oldState,newState
	 * @param {String} oldState
	 * @param {String} newState
	 */
	_stateChanged(oldState, newState) {
		this.manager.emit('stepStateChanged', this, oldState, newState);
	}

	/**
	 * Called when state transition is not allowed
	 * @param {String} action
	 * @return {Promise} rejecting with an Error
	 */
	_rejectWrongState(action) {
		return Promise.reject(new Error(`Can't ${action} ${this.name} in ${this.state} state`));
	}

	/**
	 * To be overwritten
	 * @return {Promise} always fullfills with the receiving step
	 */
	_start() {
		return Promise.resolve(this);
	}

	/**
	 * To be overwritten
	 * @return {Promise} always fullfills with the receiving step
	 */
	_stop() {
		return Promise.resolve(this);
	}

	/**
	 * Stores the given endpoint under its name. If there was an exsting endpoint before
	 * with the same name it will be overwritten.
	 * @param endpoint The endpoint to set
	 */
	putEndpoint(endpoint) {
		this.endpoints[endpoint.name] = endpoint;
		endpoint.step = this;
	}

	/**
	 * Returns the string representation of this step
	 */
	toString() {
		return this.name;
	}

	toJSON() {
		const json = {
			type: this.type,
			endpoints: {},
			state: this.state
		};

		for (const endpointName in this.endpoints) {
			if (!this.endpoints[endpointName].default) {
				json.endpoints[endpointName] = this.endpoints[endpointName].toJSON();
			}
		}
		if (this.description) {
			json.description = this.description;
		}

		return json;
	}

}

/**
 * Adding a start function
 * Brings a step into the running state.
 * @return {Promise} that fullfills with the step in the running state
 */
Step.prototype.start = states.transitionFunction(states.transitions.start);

/**
 * Adding a stop function
 * Brings the step into the stopped state
 * @return {Promise} that fullfills with the step in the stopped state
 */
Step.prototype.stop = states.transitionFunction(states.transitions.stop);

Step.configuration = {
	"name": "kronos-step",
	"description": "This step is the base class for step implementations"
};



module.exports = Step;
