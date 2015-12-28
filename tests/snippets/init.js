/* global describe, it, xit */
/* jslint node: true, esnext: true */

"use strict";

const scopeReporter = require('scope-reporter'),
  events = require('events'),
  endpointImplementation = require('../../lib/endpoint'),
  testStep = require('kronos-test-step'),
  index = require('../../index'),
  scopeDefinitions = require('../../lib/scopeDefinitions');

const sr = scopeReporter.createReporter(scopeDefinitions);
const manager = Object.create(new events.EventEmitter(), {});

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
    Object.getPrototypeOf(this).finalize.call(this, manager, scopeReporter, stepDefinition);
    this.finalizeHasBeenCalled1 = true;
  }
};

//index.registerWithManager(manager);
const s = index.prepareStepForRegistration(manager, sr, outStep);

console.log(`${JSON.stringify(s)} ${s.property1} ${s.property2}`);
