/* jslint node: true, esnext: true */
"use strict";

const Endpoint = require('./endpoint');
const STATUS = require('./const-step-status');
const LOG_LEVEL = require('./const-loglevel');


/**
 * This is a abstrct base class for all the steps.
 */
class Step {
	/**
	 * @param kronos The framework manager
	 * @param flow The flow this step was added to
	 * @param config The configration for this step
	 */
	constructor(kronos, flow, config) {

		if (!kronos) {
			throw 'No KRONOS given';
		}

		if (!flow) {
			throw 'No flow given';
		}

		if (!config) {
			throw 'No config given.';
		}

		if (!config.name) {
			throw 'No step name given.';
		}


		// The endpoins of this step
		this.endpoints = {};

		// The name of the Step
		this.name = config.name;

		// The status the step is in.
		// valid values are:
		// started  - The step is ready to receive requests
		// running  - Swithed to running after the first request has aarived
		// stopping - The step will handle current requests and then will stopp
		// stoped   - The step is stopped. Not able to handle any requests
		this.status = STATUS.stopped;

		// Install the endpoints of this step
		this._setupEndpoints();

		// the flow this step is in
		this.flow = flow;

		this.kronos = kronos;

		this.logLevelPriority = LOG_LEVEL.info.priority;
	}

	/**
	 * Adds a new endpoint to this step. If there was an enpoint with the same name
	 * before added, it will be overwritten.
	 * A step could only have endpoints with unique names.
	 * @param endpoint The endpoint to be added.
	 */
	addEndpoint(endpoint) {
		this.endpoints[endpoint.name] = endpoint;
		endpoint.step = this;
	}


	/**
	 * Starts this step
	 */
	start() {
		this.status = STATUS.running;
		this._start();
	}

	/**
	 * Starts the step.
	 * Mainly used be inbound adpater steps to start the http server or what ever
	 */
	_start() {
		// do nothing. Should be imlemented by the drived class
		// Mainly used be inbound adpater steps to start the http server or what ever
	}

	/**
	 * Stop this step
	 */
	stop() {
		this.status = STATUS.stopping;
		this._stop();
	}

	/**
	 * Returns the endpoint with the given name
	 */
	getEndpoint(name) {
		return this.endpoints[name];
	}

	/**
	 * Pushes messages to outgoing endpoints
	 */
	_push(endpointName, message) {
		if (this.endpoints[endpointName]) {
			// the endpoint exists. To push something to an endpoint it must be out active
			this.endpoints[endpointName].push(message);
		}
	}

	/**
	 * receives messages from incomming endpoints.
	 * @param endpointName The name of the enpoint which receives this message
	 * @param message The message
	 */
	_receive(endpointName, message) {
		try {
			this._doReceive(endpointName, message);
		} catch (err) {
			this._logMessage(LOG_LEVEL.error, message, err, endpointName);
		}
	}

	/**
	 * receives messages from incomming endpoints.
	 * @param endpointName The name of the enpoint which receives this message
	 * @param message The message
	 */
	_doReceive(endpointName, message) {
		// do nothing. Should be imlemented by the drived class
	}

	/**
	 * This method should be overwritten by the dreived class to setup the endpoints
	 * for this step.
	 */
	_setupEndpoints() {
		// do nothing. Should be imlemented by the drived class
	}

	/**
	 * This is an internal helper method to directly add an endpoint from a given definition.
	 * This is only usefull for the default endpoints.
	 */
	_addEndpointFromConfig(config) {
		this.addEndpoint(new Endpoint(config));
	}

	/**
	 * This log is special for logging errors caused by wrong messages send to a step
	 * @param level The log level for this log entry
	 * @param message The message responsibel for generating the error
	 * @param text The message text of this entry
	 * @param endpoint The name of the endpoint
	 */
	_logMessage(level, message, text, endpoint) {

		let hops;
		if (message) {
			hops = message.hops;
		}

		const logEntry = {
			"level": level,
			"type": "step",
			"name": this.name,
			"msg": `${text}`,
			"hops": hops
		};

		if (endpoint) {
			logEntry.endpoint = endpoint;
		}

		// until we have no logginh for kronos, just print it as it is
		if (level.priority <= this.logLevelPriority) {
			console.log(`${level.name} ${JSON.stringify(logEntry)}`);
		}
	}

	/**
	 * Logging for steps
	 * @param level The log level for this log entry
	 * @param msg The message text of this entry
	 */
	_log(level, msg) {
		const logEntry = {
			"level": level,
			"type": "step",
			"name": this.name,
			"msg": msg
		};

		// until we have no logginh for kronos, just print it as it is
		if (level.priority <= this.logLevelPriority) {
			console.log(`${level.name} ${JSON.stringify(logEntry)}`);
		}
	}
	info(data, formater) {
		this._log(LOG_LEVEL.info, data, formater);
	}
	error(data, formater) {
		this._log(LOG_LEVEL.error, data, formater);
	}
	warn(data, formater) {
		this._log(LOG_LEVEL.warn, data, formater);
	}
	debug(data, formater) {
		this._log(LOG_LEVEL.debug, data, formater);
	}
	trace(data, formater) {
		this._log(LOG_LEVEL.trace, data, formater);
	}
}

module.exports = Step;
