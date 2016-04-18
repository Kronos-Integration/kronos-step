/* global describe, it, xit */
/* jslint node: true, esnext: true */

'use strict';

const chai = require('chai'),
  assert = chai.assert,
  expect = chai.expect,
  should = chai.should(),
  testStep = require('kronos-test-step'),
  index = require('../index'),
  ksm = require('kronos-service-manager'),
  endpoint = require('kronos-endpoint'),
  RequestTimeOutInterceptor = require('kronos-interceptor').TimeoutInterceptor,
  BaseStep = index.Step;

// defines a new step which will inherit from the base step implementation
const outStep = {
  name: 'out-step',
  description: 'test step only',
  endpoints: { in : { in : true,
      interceptors: [{
        type: 'timeout',
        timeout: 1000
      }]
    },
    out: {
      out: true
    }
  },
  initialize(manager, name, stepConfiguration, props) {
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
          this.endpoints.out.receive({
            info: {
              name: 'request' + sequence
            },
            stream: sequence
          });
        }, 5);

        return new Promise((resolve, reject) => setTimeout(() => resolve(this), 200));
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

// also a step implementation which will inherit from the Base Step
const stepWithoutInitialize = {
  extends: 'out-step',
  name: 'step-without-initialize',
  description: 'test step without initialize only',
  endpoints: { in : { in : true
    }
  }
};

// defines another step
const A_StepFactory = Object.assign({}, OutStepFactory, {
  name: 'myStep',
  type: 'out-step',
  description: 'my out-step description'
});


const mp = ksm.manager().then(manager =>
  Promise.all([
    manager.registerInterceptor(RequestTimeOutInterceptor),
    manager.registerStep(OutStepFactory),
    manager.registerStep(Object.assign({}, BaseStep, stepWithoutInitialize))
  ]).then(() =>
    Promise.resolve(manager)
  ));

let aStep;


describe('steps', () => {
  describe('static', () => {
    it('present', done => {
      mp.then(manager => {
        try {
          aStep = A_StepFactory.createInstance({
            name: 'myStep2',
            description: 'my out-step description'
          }, manager);

          assert.equal(aStep.type, 'myStep');
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  });
});


// describe('single step with initialize', () => {
//   mp.then(manager => {
//     testStep.checkStepStatic(manager, aStep, () => {
//       describe('type', () => {
//         it('present', () => assert.equal(aStep.type, 'myStep'));
//       });
//       describe('name', () => {
//         it('given name present', () => assert.equal(aStep.name, 'myStep2'));
//         it('toString() is name', () => assert.equal(aStep.toString(), 'myStep2'));
//       });
//       describe('description', () => {
//         it('present', () => assert.equal(aStep.description, 'my out-step description'));
//       });
//
//       describe('json', () => {
//         it('toJSON()', () => {
//           assert.deepEqual(aStep.toJSON(), {
//             "type": "myStep",
//             "description": "my out-step description",
//             "endpoints": {
//               "in": {
//                 "in": true
//               },
//               "out": {
//                 "out": true
//               }
//             }
//           });
//         });
//       });
//     });
//   });
// });


/*
  mp.then(() => {
    console.log(`manager: ${manager}`);


      describe('single step without initialize', () => {
        const A_StepFactory2 = Object.assign({}, BaseStep, stepWithoutInitialize, {
          name: "myStep",
          type: "step-without-initialize"
        });

        const aStep = A_StepFactory2.createInstance(manager, {
          "name": "myNewName",
          "description": "This step is the base class for step implementations"
        });

        testStep.checkStepStatic(manager, aStep, () => {
          describe('type', () => {
            it('present', () => assert.equal(aStep.type, 'myStep'));
          });
          describe('name', () => {
            it('given name present', () => assert.equal(aStep.name, 'myNewName'));
            it('toString() is name', () => assert.equal(aStep.toString(), 'myNewName'));
          });
          describe('json', () => {
            it('toJSON()', () => {
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
  });
  describe('livecycle', () => {
    describe('single step', () => {
      const aStep = OutStepFactory.createInstance(manager, {
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

      testStep.checkStepLivecycle(manager, aStep, (step, state, livecycle, done) => {
        assert.equal(step.initializeDone, true);

        if (state === 'running' && request) {
          //console.log(`CHECK: ${request.info.name}`);
          assert.match(request.info.name, /request\d+/);
        }
        done();
      });
    });

    describe('none startable step', () => {
      const NoneStartableStep = Object.assign({}, BaseStep, {
        type: "none-startable-step",
        _start() {
          return Promise.reject(new Error(`unable to start`));
        }
      });

      const aStep = NoneStartableStep.createInstance(manager, {});

      it('always fails to start', done => {
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
*/
