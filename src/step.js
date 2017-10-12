import { Service } from 'kronos-service';
import { makeLogEvent } from 'loglevel-mixin';

export class Step extends Service {
  static get name() {
    return 'kronos-step';
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
