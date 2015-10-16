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
  Steps = require('../lib/step'),
  scopeDefinitions = require('../lib/scopeDefinitions');

var scopeReports = [];

const sr = scopeReporter.createReporter(scopeDefinitions, function (reporter) {
  scopeReports.push(reporter.toJSON());
});

var receivedRequests = [];

const manager = Object.create(new events.EventEmitter(), {});
const demoPassThrough = new Steps(manager, sr, "myStep", {
  "type": "out-step",
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
});

manager.steps = {
  "out-step": demoPassThrough
};


// stepImplementations: {
// value: {
//   "out-step": {
//     name: "out-step",
//     endpoints: {
//       "out": endpointImplementation.createEndpoint("out", {
//         direction: "out(active,passive)",
//         mandatory: false
//       })
//     },
//     _stop() {
//       clearInterval(this._interval);
//       return Promise.resolve(this);
//     },
//
//     initialize(manager, sr, stepDefinition, endpoints, properties) {
//       properties._start = {
//         value: function () {
//           this._sequence = 0;
//           this._interval = setInterval(() => {
//             this._sequence = this._sequence + 1;
//             endpoints.out.send({
//               info: {
//                 name: "request" + this._sequence
//               },
//               stream: ""
//             });
//           }, 5);
//           return Promise.resolve(this);
//         }
//       };
//
//       return this;
//     }
//   },
//   "in-step": {
//     name: "in-step",
//     endpoints: {
//       "in": endpointImplementation.createEndpoint("in", {
//         direction: "in(active,passive)"
//       })
//     },
//
//     initialize(manager, sr, stepDefinition, endpoints, properties) {
//       properties._start = {
//         value: function () {
//           const step = this;
//           return new Promise(function (resolve, reject) {
//
//             endpoints.in.receive(function* () {
//               while (step.isRunning) {
//                 let request = yield;
//                 receivedRequests.push(request);
//               }
//               console.log(`*** end of while *** ${step.state}`);
//             });
//
//             setTimeout(function () {
//               resolve(this);
//             }, 20);
//           });
//         }
//       };
//
//       return this;
//     }
//   }
// }
// }
// });

describe('steps', function () {
  describe('static', function () {
    describe('single step', function () {

      const aStep = new Steps(manager, sr, "myStep", {
        "type": "out-step",
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
      });

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

    // LINK: The default step implementation does not support nested Steps.
    //
    //   describe('flow with several steps', function () {
    //     const aStep = steps.createStep(manager, sr, "myFlow", {
    //       steps: {
    //         "s1": {
    //           type: "in-step",
    //           endpoints: { in : "s2/out"
    //           }
    //         },
    //         "s2": {
    //           type: "out-step"
    //         }
    //       }
    //     });
    //     checkStatic(aStep, function () {
    //       describe('type', function () {
    //         it('present', function () {
    //           assert.equal(aStep.type, 'kronos-flow');
    //         });
    //       });
    //       describe('childSteps', function () {
    //         describe('s1', function () {
    //           const s1 = aStep.steps.get('s1');
    //           it('is present', function () {
    //             assert.equal(s1.type, "in-step");
    //           });
    //           it('has in endpoint', function () {
    //             assert.equal(s1.endpoints.in.target, "s2/out");
    //             //console.log(`connected: ${s1.endpoints.in._connectedEndpoint}`);
    //           });
    //           it('has log endpoint', function () {
    //             assert.equal(s1.endpoints.log.name, "log");
    //             assert.isTrue(s1.endpoints.log.isOut);
    //             assert.isFalse(s1.endpoints.log.isIn);
    //           });
    //         });
    //
    //         describe('s2', function () {
    //           const s2 = aStep.steps.get('s2');
    //           it('is present', function () {
    //             assert.equal(s2.type, "out-step");
    //           });
    //           it('has out endpoint', function () {
    //             const out = s2.endpoints.out;
    //             assert.equal(out.name, "out");
    //             //console.log(`${out.name} target: ${JSON.stringify(out.target)}`);
    //           });
    //           it('has log endpoint', function () {
    //             assert.equal(s2.endpoints.log.name, "log");
    //             assert.isTrue(s2.endpoints.log.isOut);
    //             assert.isFalse(s2.endpoints.log.isIn);
    //           });
    //         });
    //       });
    //       it('toJSON()', function () {
    //         assert.deepEqual(aStep.toJSON(), {
    //           name: "myFlow",
    //           state: "stopped",
    //           steps: {
    //             s1: {
    //               endpoints: { in : "s2/out"
    //               },
    //               type: "in-step",
    //               state: "stopped"
    //             },
    //             s2: {
    //               endpoints: {
    //                 "out": {
    //                   "direction": "out",
    //                   "mandatory": false
    //                 }
    //               },
    //               type: "out-step",
    //               state: "stopped"
    //             }
    //           },
    //           endpoints: {}
    //         });
    //       });
    //     });
    //   });
    // });

    describe('livecycle', function () {
      describe('single step', function () {
        const aStep = new Steps(manager, sr, "myname", {
          type: "in-step",
        }, "myStep");

        checkLivecycle(aStep);
      });

      // LINK: The default step implementation does not support nested Steps.
      //
      // describe('flow with several steps', function () {
      //   const aStep = steps.createStep(manager, sr, "myFlow", {
      //     steps: {
      //       "s1": {
      //         type: "in-step",
      //         endpoints: { in : "s2/out"
      //         }
      //       },
      //       "s2": {
      //         type: "out-step"
      //       }
      //     }
      //   });
      //
      //   let transitions = [];
      //   manager.on('stepStateChanged', function (step, oldState, newState) {
      //     transitions.push({
      //       step: step,
      //       oldState: oldState,
      //       newState: newState
      //     });
      //   });
      //
      //   checkLivecycle(aStep, function (step, state) {
      //     for (let sid in step.steps) {
      //       assert.equal(step.steps[sid].state, state);
      //     }
      //   });
      //
      //   describe('received some messages', function () {
      //     it('message 0', function () {
      //       assert(receivedRequests[0].info.name, 'request0');
      //     });
      //     it('message 1', function () {
      //       assert(receivedRequests[0].info.name, 'request1');
      //     });
      //     it('message 2', function () {
      //       assert(receivedRequests[0].info.name, 'request2');
      //     });
      //   });
      //
      //   it('it had reported state changes', function () {
      //     let t = transitions[0];
      //
      //     //console.log(`${JSON.stringify(t)}`);
      //     //assert.equal(t.step, aStep);
      //     assert.equal(t.oldState, 'stopped');
      //     assert.equal(t.newState, 'starting');
      //
      //     t = transitions[1];
      //     //console.log(`${JSON.stringify(t)}`);
      //     assert.equal(t.oldState, 'starting');
      //     assert.equal(t.newState, 'running');
      //
      //     //console.log(`${JSON.stringify(t)}`);
      //   });
      // });
    });

    // describe('definition errors', function () {
    //   it('it has a step-type error', function () {
    //     scopeReports = [];
    //     sr.clearScopes();
    //     const aStep = steps.createStep(manager, sr, "s1", {
    //       type: "unknown-type",
    //       endpoints: {
    //         out: "s2/in"
    //       }
    //     });
    //     assert.deepEqual(scopeReports[0], {
    //       "scopes": [{
    //         "name": "step",
    //         "properties": {
    //           "name": "s1"
    //         }
    //       }, {
    //         "name": "severity",
    //         "properties": {
    //           "severity": "error",
    //           "message": "Step implementation not found"
    //         }
    //       }]
    //     });
    //   });
    //
    //   it('it has a manadatory endpoint missing error', function () {
    //     scopeReports = [];
    //     sr.clearScopes();
    //     const aStep = steps.createStep(manager, sr, "myStep", {
    //       steps: {
    //         "s2": {
    //           type: "in-step"
    //         }
    //       }
    //     }, "myFlow");
    //
    //     assert.deepEqual(scopeReports[0], {
    //       "scopes": [{
    //         "name": "step",
    //         "properties": {
    //           "name": "myFlow"
    //         }
    //       }, {
    //         "name": "endpoint",
    //         "properties": {
    //           "name": "in"
    //         }
    //       }, {
    //         "name": "severity",
    //         "properties": {
    //           "severity": "error",
    //           "message": "Mandatory endpoint not defined"
    //         }
    //       }]
    //     });
    //   });
    //
    // });
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
      //assert.equal(aStep.state, 'failed');
    });

    it('can be started', function (done) {
      aStep.start().then(function (step) {
        try {
          assert.equal(aStep, step);
          assert.equal(aStep.state, 'running');
          if (additionalAsserts) {
            additionalAsserts(aStep, 'running');
          }
          setTimeout(done, 10); // wait for some requests to pass through
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
