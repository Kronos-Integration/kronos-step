import {
  SendEndpoint,
  ReceiveEndpoint,
  SendEndpointDefault
} from 'kronos-endpoint';
import { Service } from 'kronos-service';
import { makeLogEvent } from 'loglevel-mixin';

export class Step extends Service {
  static get name() {
    return 'kronos-step';
  }

  /**
   * This method could be overwritten by a derived object to setup default endpoints.
   * This method may be overwritten by derived classes.
   * This will be called by the initialize method
   * @param {Object} stepConfiguration The default step configuration
   * @api protected
   */
  createPredefinedEndpoints(stepConfiguration) {
    if (this.endpoints.log) return;

    const logEndpoint = new SendEndpointDefault('log', this);
    if (this.manager.services && this.manager.services.logger) {
      logEndpoint.connected = this.manager.services.logger.endpoints.log;
    }
    this.addEndpoint(logEndpoint);
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
    const logevent = makeLogEvent(level, arg, {
      'step-type': this.type,
      'step-name': this.name
    });

    if (this.endpoints.log && this.endpoints.log.isConnected) {
      this.endpoints.log.receive(logevent);
    } else {
      console.log(logevent);
    }
  }
}
