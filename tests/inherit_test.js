/* global describe, it, xit */
/* jslint node: true, esnext: true */

"use strict";

const chai = require('chai'),
  assert = chai.assert,
  expect = chai.expect,
  should = chai.should(),
  scopeReporter = require('scope-reporter'),
  events = require('events'),
  index = require('../index'),
  BaseStep = index.Step,
  testStep = require('kronos-test-step'),
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

manager.getStepInstance = function (configuration) {
  const stepImpl = stepImplementations[configuration.type];
  if (stepImpl) {
    return stepImpl.createInstance(this, this.scopeReporter, configuration);
  }
};

const OutStepDefinition = {
  "name": "out-step",
  "description": "test step only",
  "endpoints": {
    "in": {
      "in": true
    },
    "out": {
      "out": true
    }
  },

  property2: "property2",

  initialize(manager, scopeReporter, name, stepConfiguration, props) {
    props.property1 = {
      value: "property1"
    };
  },

  finalize(manager, scopeReporter, stepDefinition) {
    //Object.getPrototypeOf(this).finalize.call(this, manager, scopeReporter, stepDefinition);
    this.finalizeHasBeenCalled1 = true;
  }
};

const StepWithoutInitializeDefinition = {
  "extends": "out-step",
  "name": "step-without-initialize",
  "description": "test step without initialize only",
  "endpoints": {
    "in": {
      "in": true
    }
  },
  property3: "property3",

  finalize(scopeReporter, stepDefinition) {
    this.finalizeHasBeenCalled2 = true;
  }
};


const OutStepFactory = Object.assign({}, BaseStep, OutStepDefinition);
const StepWithoutInitializeFactory = Object.assign({}, OutStepFactory, StepWithoutInitializeDefinition);

manager.registerStepImplementation(OutStepFactory);
manager.registerStepImplementation(StepWithoutInitializeFactory);


describe('registration and inheritance', function () {
  describe('out-step', function () {
    const aStep = OutStepFactory.createInstance(manager, sr, {
      "description": "test step only"
    });

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
              "in": true
            },
            "out": {
              "out": true
            }
          }
        });
      });
    });

    describe('createStep', function () {
      it('compare', function () {

        const aStep = OutStepFactory.createInstance(manager, sr, {
          "name": "myStep"
        });

        assert.deepEqual(aStep.toJSON(), {
          "type": "out-step",
          "description": "test step only",
          "endpoints": {
            "in": {
              "in": true
            },
            "out": {
              "out": true
            }
          }
        });

      });
    });
  });

  describe('step-without-initialize', function () {
    const StepFactory = manager.steps['step-without-initialize'];
    const aStep = StepFactory.createInstance(manager, sr, {
      "name": "myStep"
    });

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
              "in": true
            }
          }
        });
      });
    });

    describe('get instance', function () {
      const instance = StepFactory.createInstance(manager, sr, {
        name: "inst1"
      });
      it('out-step finalized', function () {
        assert.equal(aStep.hasOwnProperty('finalizeHasBeenCalled1'), false);
        // as we have overwritten the function it must not be called
        //assert.equal(aStep.finalizeHasBeenCalled1, true);
      });

      it('step-without-initialize finalized', function () {
        assert.equal(aStep.finalizeHasBeenCalled2, true);
      });
    });

    describe('get instance and overwrite endpoint definition', function () {

      // the out and in endpoint directions are swaped
      const myNewStep = manager.getStepInstance({
        "type": "out-step",
        "name": "my inherit step",
        "endpoints": {
          "in": {
            "in": false,
            "out": true
          },
          "out": {
            "out": false,
            "in": true
          }
        }
      });

      it('inherit out-step swaped endpoints', function () {
        assert.equal(myNewStep.endpoints.in.isIn, false);
        assert.equal(myNewStep.endpoints.in.isOut, true);

        assert.equal(myNewStep.endpoints.out.isIn, true);
        assert.equal(myNewStep.endpoints.out.isOut, false);
      });

    });
  });
});
