/* global describe, it, xit */
/* jslint node: true, esnext: true */

'use strict';

const chai = require('chai'),
  assert = chai.assert,
  expect = chai.expect,
  should = chai.should(),
  testStep = require('kronos-test-step'),
  { Step } = require('../dist/module'),
  ksm = require('kronos-service-manager'),
  RequestTimeOutInterceptor = require('kronos-interceptor').TimeoutInterceptor;

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
const OutStepFactory = Object.assign({}, Step, outStep);

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
    manager.registerStep(Object.assign({}, Step, stepWithoutInitialize))
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
