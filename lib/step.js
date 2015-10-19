/* jslint node: true, esnext: true */

"use strict";

const states = require('./states');
const endpoint = require('./endpoint');
const loggingSupport = require('./loggingSupport');
const myScopeReporter = require('scope-reporter');
const scopeDefinitions = require('../lib/scopeDefinitions');



/* CLASS problems to be fixed otherwise class will be removed again!!!
  - merge config and Class to "one" object
	- either call this thing "Step" or "kronos-step" one of both has to go away
*/
const baseStep = {
	"name": "kronos-step",
	"description": "This step is the base class for step implementations"
	"endpoints": {},

	/**
	 * Initializes a step.
	 * This method may be overwritten by derived classes.
	 * @param {Object} scopeReporter This reporter is used to report parsing errors
	 * @param {Object} stepConfiguration The default step configuration
	 * @param {Object} stepDefinition The json step definition
	 * @api protected
	 */
	_create(manager, scopeReporter, name, stepConfiguration, stepDefinition) {
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

		const props;

		// Now initialize this step
		this._initializeInternal(manager, scopeReporter, name, this.constructor.configuration, stepDefinition);

		this._stateChanged(undefined, this.state);

		// phase 1 without instance 'this' is dirty and may not be there at all
		this._beforeInitialize(scopeReporter, stepConfiguration, stepDefinition);
		propertyConfigurer(this, manager, name, this._createEndpoints(scopeReporter, stepConfiguration, stepDefinition),
			stepDefinition);

		this = Object.create(this, props);

		// phase 2 with instance 'this' is valid
		this._initialize(scopeReporter, stepConfiguration, stepDefinition);
		this._afterInitialize(scopeReporter, stepConfiguration, stepDefinition);

		scopeReporter.leaveScope('step');

		return this;
	}

	/**
	 * Creates the properties for a given object
	 * @param {Object} (mandatory) obj The object which where the properties should be added
	 * @param {Object} manager The kronos service manager
	 * @param {String} (mandatory) name The Name of the step
	 * @param {Object} (mandatory) endpoints the pre-populated endpoints
	 * @param {Object} (optional) stepDefinition The step definition
	 *
	 */
	function propertyConfigurer(obj, manager, name, endpoints, stepDefinition) {
		let state = "stopped";

		const props = {
			name: {
				value: name
			},
			type: {
				value: stepDefinition.type
			},
			endpoints: {
				value: endpoints
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
		return props;
	},

	// this is valid can
	_initialize(scopeReporter, stepConfiguration, stepDefinition) {

		// what is special about the endpoints here ?
		this._setupEndpoints(scopeReporter, stepConfiguration, stepDefinition);
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
	_createPredefinedEndpoints(scopeReporter, endpoints, stepConfiguration, stepDefinition) {

		// log endpoint already present
		if (endpoints.log) return;

		endpoints.log = endpoint.createEndpoint("log", {}, logEndpoint);

		loggingSupport.assignLoggerFunctions(this, function (args) {
			if (endpoints.log.isConnected()) {
				endpoints.log.send(args);
			} else {
				console.log(args);
			}
		});
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
	 * This method creates the endpoint objects defined as a combination from
	 * implementation and definition
	 * @param {Object} scopeReporter This reporter is used to report parsing errors
	 * @param {Object} def The step configuration
	 * @param {Object} impl The json step implementations definition
	 * @return {Object} endpoints A hash containing the endpoints stored by its name
	 * @api protected
	 */
	_createEndpoints(scopeReporter, def, impl) {
		const endpoints = {};

		const allEndpointNames = new Set(impl.endpoints ? Object.keys(impl.endpoints) :
			undefined);

		if (def.endpoints) {
			for (const en in def.endpoints) {
				allEndpointNames.add(en);
			}
		}

		for (const en of allEndpointNames) {
			const de = def.endpoints && def.endpoints[en] ?
				def.endpoints[en] : undefined;
			const ie = impl.endpoints && impl.endpoints[en] ? impl.endpoints[
				en] : undefined;

			if (de) {
				endpoints[en] = endpoint.createEndpoint(en, de, ie);
			} else if (ie) {
				endpoints[en] = endpoint.createEndpoint(en, ie);

				if (endpoints[en].mandatory) {
					scopeReporter.error('Mandatory endpoint not defined', 'endpoint', en);
				}
			}
		}

		this._createPredefinedEndpoints(scopeReporter, endpoints, def, impl);

		return endpoints;
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
	 * To be overwritten
	 * @return {Promise} always fullfills with the receiving step
	 */
	_remove() {
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
baseStep.start = states.transitionFunction(states.transitions.start);

/**
 * Adding a stop function
 * Brings the step into the stopped state
 * @return {Promise} that fullfills with the step in the stopped state
 */
baseStep.stop = states.transitionFunction(states.transitions.stop);

/**
 * Adding a remove function
 * Brings the step into the removed state
 * @return {Promise} that fullfills with the step in the removed state
 */
baseStep.remove = states.transitionFunction(states.transitions.remove);


const logEndpoint = endpoint.createEndpoint("log", {
	"description": "logging endpoint. All logging goes through this endpoint",
	"out": true,
	"active": true,
	"default": true
});


module.exports = baseStep;
