import test from 'ava';
import { Step } from '../src/step';

//  testStep = require('kronos-test-step'),
//  { manager } = require('kronos-service-manager'),
//  { TimeoutInterceptor } = require('kronos-interceptor');

class OutStep extends Step {
  static get name() {
    return 'out-step';
  }

  static get description() {
    return 'test step only';
  }

  constructor(...args) {
    super(...args);

    this.sequence = 0;
  }

  _start() {
    setInterval(() => {
      this.sequence = this.sequence + 1;
      this.endpoints.out.receive({
        info: {
          name: 'request' + this.sequence
        },
        stream: this.sequence
      });
    }, 5);

    return new Promise((resolve, reject) =>
      setTimeout(() => resolve(this), 200)
    );
  }

  _stop() {
    clearInterval(this.interval);
    return Promise.resolve(this);
  }
}

test('steps', async t => {
  const step = new OutStep({}, undefined);
  await step.start();
  t.is(step.state, 'running');

  await step.stop();

  t.is(step.state, 'stopped');
});

/*

const mp = manager().then(manager =>
  Promise.all([
    manager.registerInterceptor(TimeoutInterceptor),
    manager.registerStep(OutStep)
  ]).then(() => Promise.resolve(manager))
);

let aStep;

describe('steps', () => {
  describe('static', () => {
    it('present', done => {
      mp.then(manager => {
        try {
          aStep = new OutStep({
            name: 'myStep2',
            description: 'my out-step description'
          });

          assert.equal(aStep.type, 'myStep');
          done();
        } catch (e) {
          done(e);
        }
      });
    });
  });
});
*/
