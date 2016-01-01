/* global describe, it, xit */
/* jslint node: true, esnext: true */

"use strict";

const chai = require('chai'),
  assert = chai.assert,
  expect = chai.expect,
  should = chai.should(),
  scopeReporter = require('scope-reporter'),
  scopeDefinitions = require('../lib/scopeDefinitions'),
  testStep = require('kronos-test-step'),
  index = require('../index'),
  endpoint = require('../lib/endpoint'),
  BaseStep = index.Step;

// get a mock manager
const manager = testStep.managerMock;


// defines a new step which will inherit from the base step implementation
const outStep = {
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
  initialize(manager, scopeReporter, name, stepConfiguration, props) {
    let sequence = 0;
    let interval;

    props._stop = {
      value: function () {
        clearInterval(interval);
        return Promise.resolve(this);
      }
    };

    props._start = {
      value: function () {
        setInterval(() => {
          sequence = sequence + 1;
          this.endpoints.out.send({
            info: {
              name: "request" + sequence
            },
            stream: sequence
          });
        }, 5);

        return new Promise(
          (resolve, reject) => {
            setTimeout(() => resolve(this), 200);
          });
      }
    };

    // TODO never reached ?
    props.initializeDone = {
      value: true
    };
  }
};

// Create a factory which could be registered at the manager.
// In this case the outStep will inherit from the base step
const OutStepFactory = Object.assign({}, BaseStep, outStep);

// register the step at the manager
manager.registerStepImplementation(OutStepFactory);


// also a step implementation which will inherit from the Base Step
const stepWithoutInitialize = {
  "extends": "out-step",
  "name": "step-without-initialize",
  "description": "test step without initialize only",
  "endpoints": {
    "in": {
      "in": true
    }
  }
};


// register the step at the manager
manager.registerStepImplementation(Object.assign({}, BaseStep, stepWithoutInitialize));


// defines another step
const A_Step = {
  name: "myStep",
  type: "out-step",
  description: "my out-step description"
};
const A_StepFactory = Object.assign({}, OutStepFactory, A_Step);


const aStep = A_StepFactory.createInstance(manager, manager.scopeReporter, {
  "name": "myStep2",
  "description": "my out-step description"
});


describe('steps', function () {

  describe('static', function () {
    describe('single step with initialize', function () {
      testStep.checkStepStatic(manager, aStep, function () {
        describe('type', function () {
          it('present', function () {
            // name will become the type
            assert.equal(aStep.type, 'myStep');
          });
        });
        describe('name', function () {
          it('given name present', function () {
            assert.equal(aStep.name, 'myStep2');
          });
          it('toString() is name', function () {
            assert.equal(aStep.toString(), 'myStep2');
          });
        });
        describe('description', function () {
          it('present', function () {
            assert.equal(aStep.description, 'my out-step description');
          });
        });

        describe('json', function () {
          it('toJSON()', function () {
            assert.deepEqual(aStep.toJSON(), {
              "type": "myStep",
              "description": "my out-step description",
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
    });
    describe('single step without initialize', function () {
      const A_StepFactory2 = Object.assign({}, BaseStep, stepWithoutInitialize, {
        name: "myStep",
        type: "step-without-initialize"
      });

      const aStep = A_StepFactory2.createInstance(manager, manager.scopeReporter, {
        "name": "myNewName",
        "description": "This step is the base class for step implementations"
      });

      testStep.checkStepStatic(manager, aStep, function () {
        describe('type', function () {
          it('present', function () {
            // The name will become the type
            assert.equal(aStep.type, 'myStep');
          });
        });
        describe('name', function () {
          it('given name present', function () {
            assert.equal(aStep.name, 'myNewName');
          });
          it('toString() is name', function () {
            assert.equal(aStep.toString(), 'myNewName');
          });
        });
        describe('json', function () {
          it('toJSON()', function () {
            assert.deepEqual(aStep.toJSON(), {
              "type": "myStep",
              "description": "This step is the base class for step implementations",
              "endpoints": {
                "in": {
                  "in": true
                }
              }
            });
          });
        });
      });
    });
  });

  describe('livecycle', function () {
    describe('single step', function () {
      const aStep = OutStepFactory.createInstance(manager, manager.scopeReporter, {
        "endpoints": {
          "out": {
            "out": true
          }
        }
      });

      const inEp = new endpoint.ReceiveEndpoint("in");

      let request;
      inEp.receive = r => {
        request = r;
      };

      aStep.endpoints.out.connected = inEp;

      testStep.checkStepLivecycle(manager, aStep, function (step, state, livecycle, done) {
        assert.equal(step.initializeDone, true);

        if (state === 'running' && request) {
          //console.log(`CHECK: ${request.info.name}`);
          assert.match(request.info.name, /request\d+/);
        }
        done();
      });
    });

    describe('none startable step', function () {
      const NoneStartableStep = Object.assign({}, BaseStep, {
        type: "none-startable-step",
        _start() {
          return Promise.reject(new Error(`unable to start`));
        }
      });

      const aStep = NoneStartableStep.createInstance(manager, manager.scopeReporter, {});

      it('always fails to start', function (done) {
        try {
          aStep.start().then(resolve => {
            console.log(`*** ${aStep.state}`);
            done(new Error("should not be running"));
          }).catch(e => {
            assert.equal(aStep.state, 'failed');
            done();
          });
        } catch (e) {
          console.log(`error: ${e}`);
        }
      });
    });
  });
});
