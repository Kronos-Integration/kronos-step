/* jslint node: true, esnext: true */

"use strict";

const endpoint = require('kronos-endpoint'),
	llm = require('loglevel-mixin'),
	stm = require('statetransition-mixin'),
	merge = require('merge-deep');


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
	prepareProperties(manager, name, stepConfiguration) {
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
	initialize(manager, name, stepConfiguration, props) {},

	/**
	 * Called when step instance properties are present.
	 *
	 */
	finalize(manager, stepConfiguration) {},

	/**
	 * This method could be overwritten by a derived object to setup default endpoints.
	 * This method may be overwritten by derived classes.
	 * This will be called by the initialize method
	 * @param {Object} stepConfiguration The default step configuration
	 * @api protected
	 */
	createPredefinedEndpoints(stepConfiguration) {
		if (this.endpoints.log) return;

		const logEndpoint = new endpoint.SendEndpointDefault("log", this);
		if (this.manager.services && this.manager.services.logger) {
			logEndpoint.connected = this.manager.services.logger.endpoints.log;
		}
		this.addEndpoint(logEndpoint);
	},

	/**
	 * This function mixes the endpoint definitions of a step.
	 * So that extensions comming from the flow will be mixed into
	 * the definition from the step (The definition from the prototype).
	 * Only the 'endpoints' part will be extended
	 *
	 * @param def The step definition from the flow or step itslef.
	 * @return definition The new extended step definition
	 */
	inheritEndpoints(def) {
		const prototype = Object.getPrototypeOf(this);
		if (prototype && prototype.endpoints) {
			if (def && def.endpoints) {
				// before we can merge endpoints of type string needs to be converted
				for (const endpointName in def.endpoints) {
					let endpointDefinition = def.endpoints[endpointName];
					if (typeof endpointDefinition === 'string') {
						def.endpoints[endpointName] = {
							"target": endpointDefinition
						};
					}
				}

				// need to mix the definition
				const newEndpointDef = merge({}, prototype.endpoints, def.endpoints);
				def.endpoints = newEndpointDef;
			} else {
				if (!def) {
					def = {};
				}
				// just take the prototype definition
				def.endpoints = prototype.endpoints;
			}
		}
		return def;
	},


	/**
	 * Creates the endpoint objects defined as a combination from
	 * implementation and definition
	 * @param {Object} def The step configuration
	 * @api protected
	 */
	createEndpoints(def) {
		if (def && def.endpoints) {
			Object.keys(def.endpoints).forEach(name =>
				this.createEndpoint(name, def.endpoints[name]));
		}
	},

	createEndpoint(name, def) {
		let ep;
		if (def.in) ep = new endpoint.ReceiveEndpoint(name, this);
		if (def.out) ep = new endpoint.SendEndpoint(name, this);

		this.addEndpoint(ep);

		if (def.interceptors) {
			ep.interceptors = def.interceptors.map(icDef => this.manager.createInterceptorInstanceFromConfig(icDef, ep));
		}
	},

	/**
	 * @param {Endpoint} ep
	 */
	addEndpoint(ep) {
		this.endpoints[ep.name] = ep;
	},

	/**
	 * removes a endpoint
	 * @param {string} name
	 */
	removeEndpoint(name) {
		delete this.endpoints[name];
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
			const ep = this.endpoints[endpointName];
			if (ep.isDefault) {
				if (options.includeDefaults) {
					json.endpoints[endpointName] = ep.toJSON();
				}
			} else {
				json.endpoints[endpointName] = ep.toJSON();
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
	 * @return {Step} newly created step
	 */
	createInstance(stepDefinition, manager) {
		if (!manager) {
			throw new Error(`No Manager given in 'createInstance' for step '${stepDefinition.name}'`);
		}

		const props = this.prepareProperties(manager, stepDefinition.name, stepDefinition);
		this.initialize(manager, stepDefinition.name, stepDefinition, props);
		const newInstance = Object.create(this, props);

		stm.defineStateTransitionProperties(newInstance, actions, "stopped");

		// get the default loglevel for this step
		let logLevel = llm.defaultLogLevels[stepDefinition.logLevel] || llm.defaultLogLevels.info;

		// create the properties to store the loglevel
		llm.defineLogLevelProperties(newInstance, llm.defaultLogLevels, logLevel);

		// mix the endpoints from the prototype with the new definition
		stepDefinition = newInstance.inheritEndpoints(stepDefinition);

		newInstance.createEndpoints(stepDefinition);
		newInstance.createPredefinedEndpoints(stepDefinition);
		newInstance.finalize(stepDefinition);

		return newInstance;
	},

	log(level, arg) {
		const logevent = llm.makeLogEvent(level, arg, {
			"step-type": this.type,
			"step-name": this.name
		});

		if (typeof arg === 'object') {
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
			}
		}
		if (this.endpoints.log && this.endpoints.log.isConnected) {
			this.endpoints.log.receive(logevent);
		} else {
			console.log(logevent);
		}
	}
};

// define the logger methods
llm.defineLoggerMethods(BaseStep, llm.defaultLogLevels);

stm.defineActionMethods(BaseStep, actions, true);

module.exports.BaseStep = BaseStep;
