/* jslint node: true, esnext: true */

"use strict";

const myScopeReporter = require('scope-reporter'),
	states = require('./states'),
	outEndpoint = require('./endpointOut'),
	inEndpoint = require('./endpointIn'),
	llm = require('loglevel-mixin'),
	scopeDefinitions = require('./scopeDefinitions');

// Steps plain attributes without special handling
// may be extended by some properties like writable,...
const ATTRIBUTES = ['description'];


const BaseStep = {
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

		ATTRIBUTES.forEach(a => {
			if (stepConfiguration[a] !== undefined) {
				props[a] = {
					value: stepConfiguration[a]
				};
			}
		});

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
	finalize(manager, scopeReporter, stepConfiguration) {},

	/**
	 * This method could be overwritten by a derived object to setup default endpoints.
	 * This method may be overwritten by derived classes.
	 * This will be called by the initialize method
	 * @param {Object} scopeReporter This reporter is used to report parsing errors
	 * @param {Object} stepConfiguration The default step configuration
	 * @api protected
	 */
	createPredefinedEndpoints(manager, scopeReporter, stepConfiguration) {
		const logEndpoint = outEndpoint.createEndpointOut("log", {
			"description": "logging endpoint. All logging goes through this endpoint",
			"out": true,
			"active": true,
			"default": true
		});

		// log endpoint already present
		if (this.endpoints && this.endpoints.log) return;

		this.endpoints.log = logEndpoint;

		// get the default loglevel for this step
		let logLevel = llm.defaultLogLevels[stepConfiguration.logLevel] || llm.defaultLogLevels.info;

		// create the properties to store the loglevel
		llm.defineLogLevelProperties(this, llm.defaultLogLevels, logLevel);

		this.log = function (level, args) {
			if (logEndpoint.isConnected()) {
				logEndpoint.send(args);
			} else {
				console.log(`${level}: ${args}`);
			}
		};
	},

	/**
	 * Creates the endpoint objects defined as a combination from
	 * implementation and definition
	 * @param {Object} manager The service manager
	 * @param {Object} scopeReporter This reporter is used to report parsing errors
	 * @param {Object} impl The json step implementations definition
	 * @param {Object} def The step configuration
	 * @return {Object} endpoints A hash containing the endpoints stored by its name
	 * @api protected
	 */
	createEndpoints(manager, scopeReporter, impl, def) {
		const endpoints = {};

		/*
		 * The definition defines how to use endpoints provided by the implementation.
		 * So it must not be possible to add new endpoints via the definition.
		 * First create the endpoints of the implementation, then configure the
		 * endpoints with the definition
		 */

		let endpointConfiguration;
		for (const endpointName in impl.endpoints) {
			const endpointImplementationDefinition = impl.endpoints[endpointName];


			endpointConfiguration = undefined;
			if (def && def.endpoints && def.endpoints[endpointName]) {
				endpointConfiguration = def.endpoints[endpointName];
				if (typeof endpointConfiguration === 'string') {
					// in this case rebuild the configuration
					endpointConfiguration = {
						"target": endpointConfiguration
					};
					endpointConfiguration = Object.assign({}, endpointImplementationDefinition, endpointConfiguration);
				}
			}

			if (endpointConfiguration) {
				if (endpointConfiguration.in) {
					endpoints[endpointName] = inEndpoint.createEndpointIn(endpointName, endpointConfiguration,
						endpointImplementationDefinition);
				} else {
					endpoints[endpointName] = outEndpoint.createEndpointOut(endpointName, endpointConfiguration,
						endpointImplementationDefinition);
				}

			} else {
				if (endpointImplementationDefinition.in) {
					endpoints[endpointName] = inEndpoint.createEndpointIn(endpointName, endpointImplementationDefinition);
				} else {
					endpoints[endpointName] = outEndpoint.createEndpointOut(endpointName, endpointImplementationDefinition);
				}

				if (endpoints[endpointName].mandatory) {
					scopeReporter.error('Mandatory endpoint not defined', 'endpoint', endpointName);
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
	rejectWrongState(action) {
		return Promise.reject(new Error(`Can't ${action} ${this} in ${this.state} state`));
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

		ATTRIBUTES.forEach(a => {
			json[a] = this[a];
		});

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
	 * The endpoints need to know there step. This Function
	 * set all the endpoints the step there are in.
	 */
	updateEndpoints() {
		for (const endpointName in this.endpoints) {
			this.endpoints[endpointName].step = this;
		}
	},

	/**
	 * @return {Step} newly created step
	 */
	createInstance(manager, scopeReporter, stepDefinition) {
		const endpoints = this.createEndpoints(manager, scopeReporter, this, stepDefinition);
		const props = this.prepareProperties(manager, scopeReporter, stepDefinition.name, stepDefinition, endpoints);
		this.initialize(manager, scopeReporter, stepDefinition.name, stepDefinition, endpoints, props);
		const newInstance = Object.create(this, props);
		newInstance.createPredefinedEndpoints(manager, scopeReporter, stepDefinition);
		newInstance.finalize(manager, scopeReporter, stepDefinition);
		newInstance.updateEndpoints();
		return newInstance;
	}
};

/**
 * Adding a start function
 * Brings a step into the running state.
 * @return {Promise} that fullfills with the step in the running state
 */
BaseStep.start = states.transitionFunction(states.transitions.start);

/**
 * Adding a stop function
 * Brings the step into the stopped state
 * @return {Promise} that fullfills with the step in the stopped state
 */
BaseStep.stop = states.transitionFunction(states.transitions.stop);

/**
 * Adding a remove function
 * Brings the step into the removed state
 * @return {Promise} that fullfills with the step in the removed state
 */
BaseStep.remove = states.transitionFunction(states.transitions.remove);

// define the logger methods
llm.defineLoggerMethods(BaseStep, llm.defaultLogLevels, createLogfunction());

/**
 * Returns a logger function.
 */
function createLogfunction() {

	// Set an own function for preparing the stacktrace.
	// this is needed to get the some details later on
	Error.prepareStackTrace = function (err, stackObj) {
		return stackObj[0];
	};



	/**
	 * This function will create the logs.
	 * Uses the GELF log format
	 */
	return function (level, arg) {

		const ll = llm.defaultLogLevels[level];

		const logevent = {
			// "version": "1.1",	Done by the logger step
			// "host": "example.org", Done by the logger step
			//"short_message": "A short message that helps you identify what is going on",
			//"full_message": "Backtrace here\n\nmore stuff",
			"timestamp": Date.now(),
			"level": level,
			// "line": xxxxx, Only available if the 'arg' is an Error object
			"_step-type": this.type,
			"_step-name": this.name,
			"_priority": ll.priority
		};

		if (typeof arg === 'string') {
			logevent.short_message = arg;
		} else if (typeof arg === 'object') {
			if (arg instanceof Error) {
				// The 'arg' is an Error Object
				const stack = arg.stack;

				logevent.line = stack.getLineNumber();
				logevent._file_name = stack.getFileName();
				logevent._error_name = arg.name;
				logevent.short_message = arg.message;
			} else {
				// The 'arg' is a normal object. Copy all the properties

				if (arg.short_message !== undefined) {
					logevent.short_message = arg.short_message;
					delete(arg.short_message);
				}
				if (arg.full_message !== undefined) {
					logevent.full_message = arg.full_message;
					delete(arg.full_message);
				}

				let key;
				for (key in arg) {
					logevent['_' + key] = arg[key];
				}

			}
		}
		if (this.endpoints.log.isConnected()) {
			this.endpoints.log.send(logevent);
		} else {
			console.log(logevent);
		}

	};
}

module.exports.BaseStep = BaseStep;
