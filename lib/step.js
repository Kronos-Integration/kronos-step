/* jslint node: true, esnext: true */

"use strict";

const myScopeReporter = require('scope-reporter'),
	states = require('./states'),
	endpoint = require('./endpoint'),
	loggingSupport = require('./loggingSupport'),
	scopeDefinitions = require('./scopeDefinitions');

// Steps plain attributes without special handling
// may be extended by some properties like writable,...
const ATTRIBUTES = ['description'];

// attributes with special handling during intiialization
const KNOW_ATTRIBUTES = {
	'extends': 1,
	'endpoints': 1
};

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
	 * Creates the properties for a given object
	 * @param {Object} manager The kronos service manager
	 * @param {String} (mandatory) name The Name of the step
	 * @param {Object} (mandatory) endpoints the pre-populated endpoints
	 * @param {Object} (optional) stepDefinition The step definition
	 *
	 */
	prepareProperties(manager, scopeReporter, name, stepConfiguration, endpoints) {
		let state = "stopped";

		if (!endpoints) {
			endpoints = {};
		}

		// TODO ther is no better way ?
		const type = stepConfiguration.type ? stepConfiguration.type : this.name;

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
			}
		};

		/*
				ATTRIBUTES.forEach(a => {
					if (stepConfiguration[a] !== undefined) {
						props[a] = {
							value: stepConfiguration[a]
						};
					}
				});
		*/

		return props;
	},

	/**
	 * Called to initialize step
	 * Please note 'this' is not jet present
	 */
	initialize(manager, scopeReporter, name, stepConfiguration, endpoints, props) {},

	/**
	 * Called when step instance properties are present.
	 *
	 */
	finalize(manager, scopeReporter, stepConfiguration) {
		this.createPredefinedEndpoints(manager, scopeReporter, stepConfiguration);
	},

	/**
	 * @return {Step} newly created step
	 */
	createInstance(manager, scopeReporter, stepDefinition) {
		const endpoints = this.createEndpoints(manager, scopeReporter, this, stepDefinition);
		const props = this.prepareProperties(manager, scopeReporter, stepDefinition.name, stepDefinition, endpoints);
		this.initialize(manager, scopeReporter, stepDefinition.name, stepDefinition, endpoints, props);
		const newInstance = Object.create(this, props);
		newInstance.finalize(manager, scopeReporter, stepDefinition);
		return newInstance;
	},

	/**
	 * This method could be overwritten by a derived object to setup default endpoints.
	 * This method may be overwritten by derived classes.
	 * This will be called by the initialize method
	 * @param {Object} scopeReporter This reporter is used to report parsing errors
	 * @param {Object} stepConfiguration The default step configuration
	 * @api protected
	 */
	createPredefinedEndpoints(manager, scopeReporter, stepConfiguration) {

		// log endpoint already present
		if (this.endpoints && this.endpoints.log) return;

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
	createEndpoints(manager, scopeReporter, impl, def) {
		const endpoints = {};

		const allEndpointNames = new Set(impl.endpoints ? Object.keys(impl.endpoints) :
			undefined);

		// Add the endpoints of the step definition
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
	 * Returns the string representation of this step
	 * @return {String} human readable name
	 */
	toString() {
		return this.name;
	},

	/**
	 * Deliver json representation
	 * @param {Objects} options
	 *  with the following flags:
	 *    includeRuntimeInfo - include runtime informtion like state
	 *    includeName - name of the step
	 *    includeDefaults - include all properties also the inherited and not overwittern ones
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

		if (options.includeDefaults) {
			ATTRIBUTES.forEach(a => {
				json[a] = this[a];
			});
		} else {
			const prototype = Object.getPrototypeOf(this);

			ATTRIBUTES.forEach(a => {
				if (this[a] !== prototype[a]) {
					json[a] = this[a];
				}
			});
		}

		return json;
	},

	toJSON() {
		return this.toJSONWithOptions({
			includeRuntimeInfo: false,
			includeDefaults: false,
			includeName: false
		});
	}
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


/* TODO: depecated methods to be removed */
baseStep.getInstance = baseStep.createInstance;

module.exports.base = baseStep;

/**
 * Step factory.
 * @param {Step} parent Step
 * @param {Manager} manager
 * @param {Object} scopeReporter This reporter is used to report parsing errors
 * @param {Step} baseStep The base step
 * @param {String} name of the step
 * @api protected
 */
module.exports.prepare = function (manager, scopeReporter, aStep) {
	if (!manager) {
		throw new Error("No 'kronos' service manager given");
	}

	if (!scopeReporter) {
		scopeReporter = manager.scopeReporter;
	}

	const name = aStep.name;
	scopeReporter.enterScope('step', name);

	// set default base class
	let parent;
	if (aStep.extends) {
		parent = manager.steps[aStep.extends];
		if (!parent) {
			throw new Error(`The base step '${baseStep.extends}' is not registered. Error in step '${name}'`);
		}
	} else {
		parent = baseStep;
	}

	const mp = {};

	Object.keys(aStep).forEach(p => {
		if (!KNOW_ATTRIBUTES[p] && aStep[p] !== parent[p]) {
			mp[p] = {
				value: aStep[p]
			};
		}
	});

	const newStep = Object.create(parent, mp);

	const data = {};
	const endpoints = newStep.createEndpoints(manager, scopeReporter, aStep, data);
	const props = newStep.prepareProperties(manager, scopeReporter, name, data, endpoints);
	newStep.initialize(manager, scopeReporter, name, data, endpoints, props);

	Object.defineProperties(newStep, props);

	newStep.finalize(manager, scopeReporter, data);

	scopeReporter.leaveScope('step');

	return newStep;
};
