import test from 'ava';
import { Step } from '../src/step';
import { StepProviderMixin } from '../src/step-provider-mixin';

class AStep extends Step {
  static get name() {
    return 'a-step';
  }
}

class Provider extends StepProviderMixin(class {}) {}

test('provider', async t => {
  const provider = new Provider();

  provider.registerStep(AStep);

  const step = await provider.declareStep(
    {
      name: 's1',
      type: 'a-step'
    },
    {}
  );

  t.is(step.name, 's1');
  t.is(step.type, 'a-step');
});
