/* global describe, it, xit */
/* jslint node: true, esnext: true */

"use strict";

const scopeReporter = require('scope-reporter'),
  events = require('events'),

  endpointImplementation = require('../../lib/endpoint'),
  Step = require('../../lib/step'),
  testStep = require('kronos-test-step'),
  index = require('../../index'),
  scopeDefinitions = require('../../lib/scopeDefinitions');

const sr = scopeReporter.createReporter(scopeDefinitions);

var stepImplementations = {};
const manager = Object.create(new events.EventEmitter(), {
  steps: {
    value: stepImplementations
  }
});

manager.registerStepImplementation = function (si) {
  stepImplementations[si.name] = si;
};

const outStep = {
  "name": "out-step",
  "description": "test step only",
  "endpoints": {
    "in": {
      "in": true,
      "passive": true
    },
    "out": {
      "out": true,
      "active": true
    }
  },

  property2: "property2",

  initialize(manager, scopeReporter, name, stepConfiguration, endpoints, props) {
    props.property1 = {
      value: "property1"
    };
  },

  finalize(manager, scopeReporter, stepDefinition) {
    Object.getPrototypeOf(this).finalize(manager, scopeReporter, stepDefinition);
    this.finalizeHasBeenCalled1 = true;
  }
};

const stepWithoutInitialize = {
  "extends": "out-step",
  "name": "step-without-initialize",
  "description": "test step without initialize only",
  "endpoints": {
    "in": {
      "in": true,
      "passive": true
    }
  },
  property3: "property3",

  finalize(manager, scopeReporter, stepDefinition) {
    Object.getPrototypeOf(this).finalize(manager, scopeReporter, stepDefinition);
    this.finalizeHasBeenCalled2 = true;
  }
};

//manager.registerStepImplementation(index.prepareStepForRegistration(manager, sr, Step));
manager.registerStepImplementation(index.prepareStepForRegistration(manager, sr, outStep));
manager.registerStepImplementation(index.prepareStepForRegistration(manager, sr, stepWithoutInitialize));

const aStep = manager.steps['out-step'];
