/* global describe, it, xit */
/* jslint node: true, esnext: true */

"use strict";

const chai = require('chai'),
  assert = chai.assert,
  expect = chai.expect,
  should = chai.should(),
  scopeReporter = require('scope-reporter'),
  events = require('events'),

  endpointImplementation = require('../lib/endpoint'),
  Step = require('../lib/step'),
  testStep = require('kronos-test-step'),
  index = require('../index'),
  scopeDefinitions = require('../lib/scopeDefinitions');

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

describe('registration and inheritance', function () {
  describe('out-step', function () {
    const aStep = manager.steps['out-step'];
    describe('user defined attributes', function () {
      it('property1', function () {
        assert.equal(aStep.property1, 'property1');
      });
      it('property2', function () {
        assert.equal(aStep.property2, 'property2');
      });
    });

    describe('basic attributes', function () {
      it('present', function () {
        assert.deepEqual(aStep.toJSON(), {
          "type": "out-step",
          "description": "test step only",
          "endpoints": {
            "in": {
              "in": true,
              "passive": true
            },
            "out": {
              "active": true,
              "out": true
            }
          }
        });
      });
    });

    describe('createStep', function () {
      it('compare', function () {
        const aStep = index.createStep(manager, sr, {
          name: "myStep",
          type: "out-step"
        });

        assert.deepEqual(aStep.toJSON(), {
          "type": "out-step",
          "endpoints": {
            "in": {
              "in": true,
              "passive": true
            },
            "out": {
              "active": true,
              "out": true
            }
          }
        });

      });
    });
  });

  describe('step-without-initialize', function () {
    const aStep = manager.steps['step-without-initialize'];

    describe('user defined attributes', function () {
      it('property1', function () {
        assert.equal(aStep.property1, 'property1');
      });
      it('property2', function () {
        assert.equal(aStep.property2, 'property2');
      });
      it('property3', function () {
        assert.equal(aStep.property3, 'property3');
      });
    });

    describe('basic attributes', function () {
      it('present', function () {
        assert.deepEqual(aStep.toJSON(), {
          "type": "step-without-initialize",
          "description": "test step without initialize only",
          "endpoints": {
            "in": {
              "in": true,
              "passive": true
            }
          }
        });
      });
    });

    describe('get instance', function () {
      const instance = aStep.getInstance(manager, sr, {
        name: "inst1"
      });
      it('out-step finalized', function () {
        assert.equal(aStep.finalizeHasBeenCalled1, true);
      });

      xit('step-without-initialize finalized', function () {
        assert.equal(aStep.finalizeHasBeenCalled2, true);
      });
    });
  });
});
