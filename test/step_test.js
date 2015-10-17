/* global describe, it, xit */
/* jslint node: true, esnext: true */

"use strict";

const fs = require('fs'),
  chai = require('chai'),
  assert = chai.assert,
  expect = chai.expect,
  should = chai.should(),
  scopeReporter = require('scope-reporter'),
  events = require('events'),

  endpointImplementation = require('../lib/endpoint'),
  Step = require('../lib/step'),
  scopeDefinitions = require('../lib/scopeDefinitions');

var scopeReports = [];

const sr = scopeReporter.createReporter(scopeDefinitions, function (reporter) {
  scopeReports.push(reporter.toJSON());
});

var receivedRequests = [];

const manager = Object.create(new events.EventEmitter(), {});

class OutStep extends Step {
  _initialize() {
    let sequence = 0;
    let interval;

    this._stop = function () {
      clearInterval(interval);
      return Promise.resolve(this);
    };

    this._start = function () {
      setInterval(() => {
        sequence = sequence + 1;
        //console.log(`SEND: ${sequence}`);
        this.endpoints.out.send({
          info: {
            name: "request" + sequence
          },
          stream: sequence
        });
      }, 5);
      return Promise.resolve(this);
    };
  }
};

OutStep.configuration = {
  "name": "out-step",
  "endpoints": {
    "in": {
      "in": true,
      "passive": true
    },
    "out": {
      "out": true,
      "active": true
    }
  }
};

const aStep = new OutStep(manager, sr, "myStep", {
  "type": "out-step"
});

manager.steps = {
  //  "out-step": demoPassThrough
};


describe('steps', function () {
  describe('static', function () {
    describe('single step', function () {

      checkStatic(aStep, function () {
        describe('type', function () {
          it('present', function () {
            assert.equal(aStep.type, 'out-step');
          });
        });
        describe('name', function () {
          it('given name present', function () {
            assert.equal(aStep.name, 'myStep');
          });
          it('toString() is name', function () {
            assert.equal(aStep.toString(), 'myStep');
          });
          it('toJSON()', function () {
            assert.deepEqual(aStep.toJSON(), {
              type: "out-step",
              state: "stopped",
              endpoints: {
                "log": {}, // TODO
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
    });

    describe('livecycle', function () {
      describe('single step', function () {
        const aStep = new OutStep(manager, sr, "myname", {
          type: "in-step",
        }, "myStep");

        const inEp = endpointImplementation.createEndpoint("in", {
          "in": true,
          "passive": true
        });


        let request;

        inEp.setPassiveGenerator(function* () {
          while (true) {
            request = yield;
            console.log(`REQUEST: ${request.info.name}`);
          }
        });
        aStep.endpoints.out.connect(inEp);

        checkLivecycle(aStep, function (step, state) {

          if (state === 'running') {
            console.log("CHECK");
            //assert.isAbove(request.stream, 2);
          }
        });
      });
    });
  });

  function checkStatic(aStep, additionalAsserts) {
    describe('manager', function () {
      it('present', function () {
        assert.equal(aStep.manager, manager);
      });
    });

    describe('state', function () {
      it('stopped', function () {
        assert.equal(aStep.state, 'stopped');
      });
    });

    if (additionalAsserts) {
      additionalAsserts();
    }
  }

  function checkLivecycle(aStep, additionalAsserts) {
    it('can be stopped in stopped state', function (done) {
      aStep.stop().then(
        function (step) {
          try {
            assert.equal(aStep, step);
            assert.equal(aStep.state, 'stopped');
            done();
          } catch (e) {
            done(e);
          }
        }, done);
    });

    it('can be started', function (done) {
      aStep.start().then(function (step) {
        try {
          assert.equal(aStep, step);
          assert.equal(aStep.state, 'running');
          if (additionalAsserts) {
            additionalAsserts(aStep, 'running');
          }
          setTimeout(done, 50); // wait for some requests to pass through
        } catch (e) {
          done(e);
        }
      }, done);
      assert.equal(aStep.state, 'starting');
    });

    it('can be started again', function (done) {
      aStep.start().then(function (step) {
        try {
          assert.equal(aStep, step);
          assert.equal(aStep.state, 'running');
          if (additionalAsserts) {
            additionalAsserts(aStep, 'running');
          }
          done();
        } catch (e) {
          done(e);
        }
      }, done);
      assert.equal(aStep.state, 'running');
    });

    it('and then stopped', function (done) {
      aStep.stop().then(function (step) {
        try {
          assert.equal(aStep, step);
          assert.equal(aStep.state, 'stopped');
          if (additionalAsserts) {
            additionalAsserts(aStep, 'stopped');
          }
          done();
        } catch (e) {
          done(e);
        }
      }, done);
      assert.equal(aStep.state, 'stopping');
    });

    it('and then stopped again', function (done) {
      aStep.stop().then(function (step) {
        try {
          assert.equal(aStep, step);
          assert.equal(aStep.state, 'stopped');
          if (additionalAsserts) {
            additionalAsserts(aStep, 'stopped');
          }
          done();
        } catch (e) {
          done(e);
        }
      }, done);
      assert.equal(aStep.state, 'stopped');
    });


    it('can be started while starting', function (done) {
      aStep.start().then(function (step) {
        try {
          assert.equal(aStep, step);
          assert.equal(aStep.state, 'running');
          if (additionalAsserts) {
            additionalAsserts(aStep, 'running');
          }
          //done();
        } catch (e) {
          done(e);
        }
      }, done);

      aStep.start().then(function (step) {
        try {
          assert.equal(aStep, step);
          assert.equal(aStep.state, 'running');
          if (additionalAsserts) {
            additionalAsserts(aStep, 'running');
          }
          done();
        } catch (e) {
          done(e);
        }
      }, done);

      assert.equal(aStep.state, 'starting');
    });
  }
});
