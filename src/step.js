import { Service } from 'kronos-service';
import { makeLogEvent } from 'loglevel-mixin';
import { StepProviderMixin } from './step-provider-mixin';

export { StepProviderMixin };

export class Step extends Service {
  static get name() {
    return 'kronos-step';
  }

  /**
   * Order in which the step should be started.
   * Higher numbers result in earlier startup
   * @return {number} 1.0
   */
  static get startupOrder() {
    return 1.0;
  }

  /**
   * Order in which the step should be started.
   * Higher numbers result in earlier startup
   * @return {number} delivered from the constructors startupOrder
   */
  get startupOrder() {
    return this.constructor.startupOrder;
  }

  /**
   * @return {String} separator between step name and endpoint name
   **/
  get endpointParentSeparator() {
    return '/';
  }

  log(level, arg) {
    this.endpoints.log.receive(
      makeLogEvent(level, arg, {
        'step-type': this.type,
        'step-name': this.name
      })
    );
  }
}
