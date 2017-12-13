/**
 * Provide steps.
 * Register and lookup step types
 */
export function StepProviderMixin(superclass) {
  return class StepProviderMixin extends superclass {
    constructor(...args) {
      super(...args);

      Object.defineProperty(this, 'registeredSteps', { value: new Map() });
    }

    registerStep(step) {
      this.registeredSteps.set(step.name, step);
    }

    declareStep(config, ...args) {
      const factory = this.registeredSteps.get(config.type);
      if (factory === undefined) {
        throw new Error(`Undefined step ${config.type}`);
      }

      return new factory(config, ...args);
    }
  };
}
