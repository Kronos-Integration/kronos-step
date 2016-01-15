/* global describe, it, xit */
/* jslint node: true, esnext: true */

"use strict";

const chai = require('chai'),
  assert = chai.assert,
  expect = chai.expect,
  should = chai.should(),
  endpoint = require('../lib/endpoint'),
  Interceptor = require('kronos-interceptor').Interceptor;

/* simple owner with name */
function nameIt(name) {
  return {get name() {
      return name;
    }
  };
}

class MyInterceptor extends Interceptor {
  receive(request) {
    return super.receive(request + 1);
  }
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

        ep1.connected = ep2;

        const ic1 = new Interceptor(ep1);
        ep1.interceptors = [ic1];

        describe('connected chain', () => {
          it('ep1->ic1', () => assert.equal(ep1.connected, ic1));
          it('ic1->ep2', () => assert.equal(ic1.connected, ep2));
        });

        it('is firstInterceptor', () => assert.equal(ic1, ep1.firstInterceptor));
        it('is lastInterceptor', () => assert.equal(ic1, ep1.lastInterceptor));

        describe('passes though with interceptor', done => {
          ep1.receive(4711).then(response => {
            assert.equal(response, 4712);
            console.log(`AA response: ${response}`);
            done();
          }).catch(done);
        });

        const itcs = ep1.interceptors;
        it('is array', () => assert.isArray(itcs));
        it('one interceptor', () => assert.equal(itcs[0], ic1));

        describe('can be removed again', () => {
          const ep1 = new endpoint.SendEndpoint('ep1', nameIt('o1'));
          const ep2 = new endpoint.ReceiveEndpoint('ep2', nameIt('o1'));

          ep1.connected = ep2;
          const ic1 = new MyInterceptor(ep1);
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

    describe('interceptors receive', () => {
      const ep1 = new endpoint.SendEndpoint('ep1', nameIt('o1'));
      const ep2 = new endpoint.ReceiveEndpoint('ep2', nameIt('o1'));

      ep1.connected = ep2;
      ep2.receive = request => {
        return Promise.resolve(request);
      }

      describe('passes though', (done) => {
        ep1.receive("hallo").then(response => {
          assert.equal(response, "hallo");
          console.log(`response: ${response}`);
          done();
        });
      });

      const ic1 = new MyInterceptor(ep1);

      ep2.interceptors = [ic1];

      describe('connected chain', () => {
        it('ep1->ep2', () => assert.equal(ep1.connected, ep2));
        it('ic1->ep2*', () => assert.equal(ic1.connected.name, ep2.name));
      });

      describe('passes though with interceptor', (done) => {
        ep1.receive("hallo").then(response => {
          assert.equal(response, "hallo");
          console.log(`AA response: ${response}`);
          done();
        }).catch(done);
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
