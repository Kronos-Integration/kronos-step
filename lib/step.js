/* jslint node: true, esnext: true */

"use strict";

const states = require('./states');
const endpoint = require('./endpoint');
const loggingSupport = require('./loggingSupport');
const myScopeReporter = require('scope-reporter');
const scopeDefinitions = require('../lib/scopeDefinitions');


const logEndpoint = endpoint.createEndpoint("log", {
	"description": "logging endpoint. All logging goes through this endpoint",
	"out": true,
	"active": true,
	"default": true
});


const baseStep = {
	"name": "kronos-step",
	"description": "This step is the base class for step implementations",

	/**
	 * Step factory.
	 * @param {Step} parent Step
	 * @param {Manager} manager
	 * @param {Object} scopeReporter This reporter is used to report parsing errors
	 * @param {Object} stepConfiguration The default step configuration
	 * @api protected
	 */
	create(manager, scopeReporter, name, stepConfiguration) {
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

		const parent = this.extends ? this.extends : this;

		console.log(`${parent} ${this}`);
		// create the endpoints from what we know

		// TODO find bettwer way to decide if parent or target itself can be used
		const endpoints =
			this._createEndpoints ? this._createEndpoints(scopeReporter, stepConfiguration, this) :
			parent._createEndpoints.call(this, scopeReporter, stepConfiguration, this);

		// TODO find bettwer way to decide if parent or target itself can be used
		// prepare object properties
		const props =
			this._prepareProperties ? this._prepareProperties(manager, scopeReporter, name, stepConfiguration, endpoints) :
			parent._prepareProperties.call(this, manager, scopeReporter, name, stepConfiguration, endpoints);

		// TODO find bettwer way to decide if parent or target itself can be used
		this._initialize ? this._initialize(manager, scopeReporter, name, stepConfiguration, endpoints, props) :
			parent._initialize.call(this, manager, scopeReporter, name, stepConfiguration, endpoints, props);

		let newStep = Object.create(parent, props);

		newStep._createPredefinedEndpoints(scopeReporter, stepConfiguration);

		scopeReporter.leaveScope('step');

		return newStep;
	},

	/**
	 * Creates the properties for a given object
	 * @param {Object} manager The kronos service manager
	 * @param {String} (mandatory) name The Name of the step
	 * @param {Object} (mandatory) endpoints the pre-populated endpoints
	 * @param {Object} (optional) stepDefinition The step definition
	 *
	 */
	_prepareProperties(manager, scopeReporter, name, stepConfiguration, endpoints) {
		let state = "stopped";

		const type = this.name;
		const props = {
			name: {
				value: name
			},
			type: {
				value: type
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

		if (stepConfiguration.description) {
			props.description = {
				value: stepConfiguration.description
			};
		}

		return props;
	},

	_initialize(manager, scopeReporter, name, stepConfiguration, endpoints, props) {},

	/**
	 * This method could be overwritten by a derived object to setup default endpoints.
	 * The derived method should call super first.
	 * This method may be overwritten by derived classes.
	 * This will be called by the initialize method
	 * @param {Object} scopeReporter This reporter is used to report parsing errors
	 * @param {Object} stepConfiguration The default step configuration
	 * @api protected
	 */
	_createPredefinedEndpoints(scopeReporter, stepConfiguration) {

		// log endpoint already present
		if (this.endpoints.log) return;

		const newLogEndpoint = endpoint.createEndpoint("log", {}, logEndpoint);
		this.endpoints.log = newLogEndpoint;

		//console.log(`DEFAULT ${this.endpoints.log.default}`);
		loggingSupport.assignLoggerFunctions(this, function (args) {
			if (newLogEndpoint.isConnected()) {
				newLogEndpoint.send(args);
			} else {
				console.log(args);
			}
		});
	},

	/**
	 * Creates the endpoint objects defined as a combination from
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
		return endpoints;
	},

	/**
	 * Sends a 'stepStateChanged' event to the manager.
	 * arguments are:
	 *  step,oldState,newState
	 * @param {String} oldState
	 * @param {String} newState
	 */
	_stateChanged(oldState, newState) {
		this.manager.emit('stepStateChanged', this, oldState, newState);
	},

	/**
	 * Called when state transition is not allowed
	 * @param {String} action
	 * @return {Promise} rejecting with an Error
	 */
	_rejectWrongState(action) {
		return Promise.reject(new Error(`Can't ${action} ${this.name} in ${this.state} state`));
	},

	/**
	 * To be overwritten
	 * Overwrite to implement the functionality to bring the step into the running state.
	 * @return {Promise} default implementation always fullfills with the receiving step
	 */
	_start() {
		return Promise.resolve(this);
	},

	/**
	 * To be overwritten
	 * Overwrite to implement the functionality to bring the step into the stopped state.
	 * @return {Promise} default implementation always fullfills with the receiving step
	 */
	_stop() {
		return Promise.resolve(this);
	},

	/**
	 * To be overwritten.
	 * Tear down every resource as a final step if the the step removal
	 * @return {Promise} default implementation always fullfills with the receiving step
	 */
	_remove() {
		return Promise.resolve(this);
	},

	/**
	 * Stores the given endpoint under its name. If there was an exsting endpoint before
	 * with the same name it will be overwritten.
	 * @param endpoint The endpoint to set
	 */
	putEndpoint(endpoint) {
		this.endpoints[endpoint.name] = endpoint;
		endpoint.step = this;
	},

	/**
	 * Returns the string representation of this step
	 */
	toString() {
		return this.name;
	},

	/**
	 * Deliver json representation
	 * @param {Objects} options
	 * @return json representation
	 */
	toJSONWithOptions(options) {
		const json = {
			type: this.type,
			endpoints: {}
		};

		if (options.includeName) {
			json.name = this.name;
		}

		if (options.includeRuntimeInfo) {
			json.state = this.state;
		}

		for (const endpointName in this.endpoints) {
			if (!this.endpoints[endpointName].default || options.includeDefaults) {
				json.endpoints[endpointName] = this.endpoints[endpointName].toJSON();
			}
		}
		if (this.description) {
			json.description = this.description;
		}

		return json;
	},

	toJSON() {
		return this.toJSONWithOptions({
			includeRuntimeInfo: false,
			includeDefaults: false,
			includeName: false
		});
	},

	/**
	 * Could be overwritten by a derived object. This method is the first method called from
	 * the initialize function.
	 * @param {Object} scopeReporter This reporter is used to report parsing errors
	 * @param {Object} stepConfiguration The default step configuration
	 * @param {Object} stepDefinition The json step definition
	 * @api protected
	 */
	_beforeInitialize(scopeReporter, stepConfiguration) {},

	/**
	 * Could be overwritten by a derived object. This method is the last method called from
	 * the initialize function.
	 * Called when the generated step object has alredy consumed all information
	 * from the configuration.
	 * @param {Object} scopeReporter This reporter is used to report parsing errors
	 * @api protected
	 */
	_afterInitialize(scopeReporter) {},

	/**
	 * Derived objects should implement this method to setup the endpoints
	 * This will be called by the initialize method
	 * @param {Object} scopeReporter This reporter is used to report parsing errors
	 * @param {Object} stepConfiguration The default step configuration
	 * @return {Object} endpoints A hash containing the endpoints stored by its name
	 * @api protected
	 */
	_setupEndpoints(scopeReporter, stepConfiguration, endpoints) {},
};

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

module.exports = baseStep;
