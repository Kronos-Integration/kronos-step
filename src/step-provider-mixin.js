/**
 * Extends a class to fullfill step provider functionality
 * @param {Class} superclass class to extend
 * @return {Class} extended class
 */
export function StepProviderMixin(superclass) {
  /**
   * Extends a class to fullfill step provider functionality
   * Register and lookup step types
   * @param {Class} superclass class to extend
   * @return {Class} extended class
   */
  return class StepProviderMixin extends superclass {
    constructor(...args) {
      super(...args);

      Object.defineProperty(this, 'registeredSteps', { value: new Map() });
    }

    /**
     * Registers a Step class for later use in createStep
     * @param {Object} step step class
     * @return {undefined}
     */
    registerStep(step) {
      this.registeredSteps.set(step.name, step);
    }

    /**
     * Creates a step from its config
     * @param {Object} config
     * @param {string} config.type step type to create
     * @param {Object[]} args remaining
     * @return {Step} newly created step
     */
    createStep(config, ...args) {
      const factory = this.registeredSteps.get(config.type);
      if (factory === undefined) {
        throw new Error(`Undefined step ${config.type}`);
      }

      return new factory(config, ...args);
    }
  };
}
