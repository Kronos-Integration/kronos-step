/* global describe, it, xit */
/* jslint node: true, esnext: true */

"use strict";

const chai = require('chai'),
  assert = chai.assert,
  expect = chai.expect,
  should = chai.should(),
  kti = require('kronos-test-interceptor'),
  endpoint = require('../lib/endpoint'),
  Interceptor = require('kronos-interceptor').Interceptor;

/* simple owner with name */
function nameIt(name) {
  return {get name() {
      return name;
    }
  };
}

/*
 * send receive request and check if we whent though some interceptors
 */
function testReceive(name, ep, value, hops, cb) {
  describe(name, () => {
    it(`interceptors ${hops ? hops : 'none'} passed`, done => {
      ep.receive({
        value: value
      }).then(response => {
        const exp = {
          value: value
        }
        if (hops) {
          exp.hops = hops;
        }
        assert.deepEqual(response, exp);

        if (cb) {
          cb(done);
        } else {
          done();
        }
      }).catch(done);
    });
  });
}

describe('endpoint', () => {
  describe('connecting', () => {

    describe('initial', () => {
      const ep1 = new endpoint.SendEndpoint('ep1', nameIt('o1'));

      it('not isConnected', () => assert.isFalse(ep1.isConnected));
    });

    describe('interceptors send', () => {
      describe('initially', () => {
        const ep1 = new endpoint.SendEndpoint('ep1', nameIt('o1'));
        it('empty interceptors', () => assert.deepEqual(ep1.interceptors, []));
        it('no firstInterceptor', () => assert.isUndefined(ep1.firstInterceptor));
        it('no lastInterceptor', () => assert.isUndefined(ep1.lastInterceptor));
      });

      describe('set/get array', () => {
        const ep1 = new endpoint.SendEndpoint('ep1', nameIt('o1'));
        const ep2 = new endpoint.ReceiveEndpoint('ep2', nameIt('o1'));

        ep2.receive = kti.testResponseHandler;

        ep1.connected = ep2;

        describe('passes though', () => {
          it('without interceptor', done => {
            ep1.receive({
              value: 1
            }).then(response => {
              assert.equal(response.value, 1);
              done();
            }).catch(done);
          });
        });

        const ic1 = new kti.TestInterceptor(ep1, {
          name: 'ic1'
        });
        const ic2 = new kti.TestInterceptor(ep1, {
          name: 'ic2'
        });

        ep1.interceptors = [ic1, ic2];

        describe('connected chain', () => {
          it('ep1->ic1', () => assert.equal(ep1.connected, ic1));
          it('ic1->ic2', () => assert.equal(ic1.connected, ic2));
          it('ic1->ep2', () => assert.equal(ic2.connected, ep2));
        });

        it('is firstInterceptor', () => assert.equal(ic1, ep1.firstInterceptor));
        it('is lastInterceptor', () => assert.equal(ic2, ep1.lastInterceptor));


        testReceive('passes with interceptor', ep1, 2, ['ic1', 'ic2']);

        const itcs = ep1.interceptors;
        it('is array', () => assert.isArray(itcs));
        it('one interceptor', () => assert.equal(itcs[0], ic1));

        describe('can be removed again', () => {
          const ep1 = new endpoint.SendEndpoint('ep1', nameIt('o1'));
          const ep2 = new endpoint.ReceiveEndpoint('ep2', nameIt('o1'));

          ep1.connected = ep2;
          const ic1 = new kti.TestInterceptor(ep1, {
            name: 'ic1'
          });
          ep1.interceptors = [ic1];

          ep1.interceptors = [];
          it('empty interceptors', () => assert.deepEqual(ep1.interceptors, []));
          it('no firstInterceptor', () => assert.isUndefined(ep1.firstInterceptor));
          it('no lastInterceptor', () => assert.isUndefined(ep1.lastInterceptor));

          describe('connected chain', () => {
            it('ep1->ic1', () => assert.equal(ep1.connected, ep2));
          });
        });
      });
    });

    describe('interceptors on the receive side', () => {
      const se = new endpoint.SendEndpoint('se', nameIt('st'));
      const re = new endpoint.ReceiveEndpoint('re', nameIt('rt'));

      se.connected = re;
      re.receive = kti.testResponseHandler;

      testReceive('passes without', se, 3, undefined, done => {
        const ic1 = new kti.TestInterceptor(re, {
          name: 'ic1'
        });
        const ic2 = new kti.TestInterceptor(re, {
          name: 'ic2'
        });

        re.interceptors = [ic1, ic2];

        testReceive('receiving endpoint', se, 4, ["ic1", "ic2"], done => {
          const ic3 = new kti.TestInterceptor(re, {
            name: 'ic3'
          });

          // ep2.receive now at the internalEndpoint
          re.receive = kti.testResponseHandler;
          re.interceptors = [ic3];

          testReceive('receiving endpoint internal endpoint', se, 5, ["ic3"], done => {
            re.interceptors = undefined;
            testReceive('receiving endpoint removed interceptos', se, 6, undefined, done => {
              done();
            });
            done();
          });
          done();
        });
        done();
      });
    });

    describe('connecting', () => {
      const ep1 = new endpoint.SendEndpoint('ep1', nameIt('o1'));
      const ep2 = new endpoint.ReceiveEndpoint('ep2', nameIt('o2'));

      ep1.connected = ep2;
      it('isConnected', () => assert.isTrue(ep1.isConnected));
      it('has otherEnd', () => assert.equal(ep1.otherEnd, ep2));

      describe('with interceptor', () => {
        const in1 = new Interceptor(ep1);
        ep1.injectNext(in1);

        it('still isConnected', () => assert.isTrue(ep1.isConnected));
        it('interceptor also isConnected', () => assert.isTrue(in1.isConnected));
        it('has otherEnd', () => assert.equal(ep1.otherEnd, ep2));

        describe('remove', () => {
          ep1.removeNext();
          it('connected', () => assert.equal(ep1.connected, ep2));
        });
      });
    });
  });
});
