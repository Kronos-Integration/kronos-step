import { SendEndpoint, ReceiveEndpoint } from 'kronos-endpoint';
import { Service } from 'kronos-service';
import { makeLogEvent } from 'loglevel-mixin';
import { mergeAttributes, createAttributes } from 'model-attributes';

export class Step extends Service {
  static get configurationAttributes() {
    return mergeAttributes(
      createAttributes({
        // TODO move into service
        description: {
          type: 'string',
          description: 'human readable description of the step'
        }
      }),
      Service.configurationAttributes
    );
  }

  static get name() {
    return 'kronos-step';
  }

  /**
   * Creates the endpoint objects defined as a combination from
   * implementation and definition
   * @param {Object} def The step configuration
   * @api protected
   */
  createEndpoints(def) {
    if (def && def.endpoints) {
      Object.keys(def.endpoints).forEach(name =>
        this.createEndpoint(name, def.endpoints[name])
      );
    }
  }

  /**
   * Deliver the endpoint options for a given endpoint definition.
   * @return {Object} suiable to pass as options to the endpoint factory
   */
  endpointOptions(name, def) {
    let options = {};

    if (def.opposite) {
      options.createOpposite = true;
    }

    return options;
  }

  createEndpoint(name, def) {
    let ep;

    if (def.in)
      ep = new ReceiveEndpoint(name, this, this.endpointOptions(name, def));
    if (def.out)
      ep = new SendEndpoint(name, this, this.endpointOptions(name, def));

    this.addEndpoint(ep);

    if (def.interceptors) {
      ep.interceptors = def.interceptors.map(icDef =>
        this.manager.createInterceptorInstanceFromConfig(icDef, ep)
      );
    }
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
