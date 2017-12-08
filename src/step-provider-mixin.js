import { defineRegistryProperties } from 'registry-mixin';

/**
 * Provide steps.
 */
export function StepProviderMixin(superclass) {
  return class extends superclass {
    /**
     * if config is an array entry 0 then entry 0 will be passed to super and all other entries
     * are handed over as initial config to the config services
     */
    constructor(...args) {
      super(...args);

      defineRegistryProperties(this, 'stepFactory', {
        pluralName: 'stepFactories',
        withCreateInstance: true,
        withEvents: true,
        factoryType: 'new'
      });
    }

    declareStep(config, owner) {
      return this.createStepFactoryInstanceFromConfig(config, owner);
    }
  };
}
