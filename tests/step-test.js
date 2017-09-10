import test from 'ava';
import { Step } from '../src/step';
import { SendEndpoint, ReceiveEndpoint } from 'kronos-endpoint';

//  { TimeoutInterceptor } = require('kronos-interceptor');

const owner = {
  emit(name, arg1, arg2) {}, // dummy event emitter
  endpointIdentifier(e) {
    return `name:${e.name}`;
  }
};

class OutStep extends Step {
  static get name() {
    return 'out-step';
  }

  static get description() {
    return 'test step only';
  }

  constructor(...args) {
    super(...args);

    this.addEndpoint(new ReceiveEndpoint('out', this));
    this.sequence = 0;
  }

  _start() {
    setInterval(() => {
      this.sequence = this.sequence + 1;
      this.endpoints.out.receive(this.sequence);
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

test('step static', t => {
  const step = new OutStep(
    {
      name: 'myStep2',
      description: 'my out-step description'
    },
    owner
  );

  t.is(step.name, 'myStep2');
  t.is(step.type, 'out-step');
  t.is(step.description, 'my out-step description');
});

test('step start/stop', async t => {
  const step = new OutStep({}, owner);

  step.endpoints.out.receive = message => {};

  await step.start();
  t.is(step.state, 'running');

  await step.stop();

  t.is(step.state, 'stopped');

  t.true(step.sequence != 0);
});
