/* jslint node: true, esnext: true */
"use strict";

const STATUS = require('./const-status');


/**
 * The flow runtime is the part of the flow which
 * has the already connected steps of the flow.
 * It is only for 'running' the flow. It contains
 * no code to create this flow from the config
 */
class FlowRuntime {

	/**
	 *
	 */
	constructor(config) {

		if (!config) {
			config = {};
		}

		// The name of this flow
		this.name = config.name;

		// Stores all the steps of this flow by its name
		this.steps = {};

		// This stores all the input steps of this flow.
		// An input step will also be in 'this.steps'.
		// These are needed to stop a flow. Because the flow has to be stopped from there inpu side
		this.inputSteps = [];

		this.status = STATUS.stopped;
	}

	/**
	 * initializes the connected steps
	 */
	initialize() {
		for (let stepName in this.steps) {
			this.steps[stepName].initialize();
		}
	}

	/**
	 * Stopps the flow.
	 * This method will send the stop regardless of the current status
	 */
	stop() {
		for (let i = 0; i < this.inputSteps.length; i++) {
			this.inputSteps.stop();
		}
	}

	/**
	 * Starts the flow.
	 * This method will send the stop regardless of the current status
	 */
	start() {
		for (let i = 0; i < this.inputSteps.length; i++) {
			this.inputSteps.start();
		}
	}
}

module.exports = FlowRuntime;
