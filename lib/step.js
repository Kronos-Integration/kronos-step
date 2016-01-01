/* jslint node: true, esnext: true */

"use strict";

const myScopeReporter = require('scope-reporter'),
	endpoint = require('./endpoint'),
	llm = require('loglevel-mixin'),
	stm = require('statetransition-mixin'),
	scopeDefinitions = require('./scopeDefinitions');


const actions = stm.prepareActions({
	start: {
		stopped: {
			target: "running",
			during: "starting",
			timeout: 5000
		}
	},
	stop: {
		running: {
			target: "stopped",
			during: "stopping",
			timeout: 5000
		},
		starting: {
			target: "stopped",
			during: "stopping",
			timeout: 5000
		}
	},
	remove: {
		stopped: {
			target: "removed"
		}
	}
});

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
	 * @param {Object} (optional) stepDefinition The step definition
	 *
	 */
	prepareProperties(manager, scopeReporter, name, stepConfiguration) {
		let endpoints = {};

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
			/**
			 * @return {Boolean} if step is in a running state
			 */
			isRunning: {
				get: function () {
					return this.state === 'running' || this.state === 'starting';
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
	initialize(manager, scopeReporter, name, stepConfiguration, props) {},

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
	createPredefinedEndpoints(scopeReporter, stepConfiguration) {
		//"description": "logging endpoint. All logging goes through this endpoint"

		if (this.endpoints.log) return;

		const logEndpoint = new endpoint.SendEndpoint("log", this);

		this.addEndpoint(logEndpoint);

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
	createEndpoints(scopeReporter, impl, def) {
		if (impl && impl.endpoints) {
			Object.keys(impl.endpoints).forEach(name => {
				this.createEndpoint(scopeReporter, name, impl.endpoints[name]);
			});
		}

		if (def && def.endpoints) {
			Object.keys(def.endpoints).forEach(name => {
				if (this.endpoints[name]) return;
				this.createEndpoint(scopeReporter, name, def.endpoints[name]);
			});
		}
	},

	createEndpoint(scopeReporter, name, def) {
		if (def.in) this.addEndpoint(new endpoint.ReceiveEndpoint(name, this));
		if (def.out) this.addEndpoint(new endpoint.SendEndpoint(name, this));
	},

	/**
	 * Sends a 'stepStateChanged' event to the manager.
	 * arguments are:
	 *  step,oldState,newState
	 * @param {String} oldState
	 * @param {String} newState
	 */
	stateChanged(oldState, newState) {
		this.trace(level => ({
			"message": "state changed",
			"oldState": oldState,
			"newState": newState
		}));
		this.manager.emit('stepStateChanged', this, oldState, newState);
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
			json.endpoints[endpointName] = this.endpoints[endpointName].toJSON();
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

	addEndpoint(ep) {
		this.endpoints[ep.name] = ep;
	},

	/**
	 * @return {Step} newly created step
	 */
	createInstance(manager, scopeReporter, stepDefinition) {
		const props = this.prepareProperties(manager, scopeReporter, stepDefinition.name, stepDefinition);
		this.initialize(manager, scopeReporter, stepDefinition.name, stepDefinition, props);
		const newInstance = Object.create(this, props);

		stm.defineStateTransitionProperties(newInstance, actions, "stopped");

		newInstance.createEndpoints(scopeReporter, stepDefinition);
		newInstance.createPredefinedEndpoints(scopeReporter, stepDefinition);
		newInstance.finalize(scopeReporter, stepDefinition);

		return newInstance;
	}
};

// define the logger methods
llm.defineLoggerMethods(BaseStep, llm.defaultLogLevels, createLogfunction());

stm.defineActionMethods(BaseStep, actions, true);

/**
 * Returns a logger function.
 */
function createLogfunction() {

	// Set an own function for preparing the stacktrace.
	// this is needed to get the some details later on
	/* MF disabled for now prevents mocha from functioning
		Error.prepareStackTrace = function (err, stackObj) {
			return stackObj[0];
		};
	*/


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
			"_step-name": this.name
		};

		if (typeof arg === 'string') {
			logevent.short_message = arg;
		} else if (typeof arg === 'object') {
			if (arg instanceof Error) {
				// The 'arg' is an Error Object
				const stack = arg.stack;

				if (stack.getLineNumber) {
					logevent.line = stack.getLineNumber();
				}
				if (stack.getFileName) {
					logevent._file_name = stack.getFileName();
				}
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
		if (this.endpoints.log.isConnected) {
			this.endpoints.log.send(logevent);
		} else {
			console.log(logevent);
		}
	};
}

module.exports.BaseStep = BaseStep;
