import {
  SendEndpoint,
  ReceiveEndpoint,
  SendEndpointDefault
} from 'kronos-endpoint';
import { Service } from 'kronos-service';
import { makeLogEvent } from 'loglevel-mixin';

const merge = require('merge-deep');

// Steps plain attributes without special handling
// may be extended by some properties like writable,...
const ATTRIBUTES = ['description'];

export class Step extends Service {
  static get name() {
    return 'kronos-step';
  }

  static get description() {
    return 'This step is the base class for step implementations';
  }

  constructor(config, owner) {
    super(config, owner);
  }

  get description() {
    return this.constructor.description;
  }

  /**
   * Creates the properties for a given object
   * @param {Object} manager The kronos service manager
   * @param {String} (mandatory) name The Name of the step
   * @param {Object} (optional) stepDefinition The step definition
   *
   */
  prepareProperties(manager, name, stepConfiguration) {
    let endpoints = {};

    // TODO there is no better way ?
    const type = stepConfiguration.type ? stepConfiguration.type : this.name;

    const props = {
      name: {
        value: name
      },
      type: {
        value: type
      },
      manager: {
        value: manager
      },
      /**
       * @return {Boolean} if step is in a running state
       */
      isRunning: {
        get: function() {
          return this.state === 'running' || this.state === 'starting';
        }
      }
    };

    ATTRIBUTES.forEach(a => {
      if (stepConfiguration[a] !== undefined) {
        props[a] = {
          value: stepConfiguration[a]
        };
      }
    });

    return props;
  }

  /**
   * Called to initialize step
   * Please note 'this' is not jet present
   */
  initialize(manager, name, stepConfiguration, props) {}

  /**
   * Called when step instance properties are present.
   *
   */
  finalize(manager, stepConfiguration) {}

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
   * This function mixes the endpoint definitions of a step.
   * So that extensions comming from the flow will be mixed into
   * the definition from the step (The definition from the prototype).
   * Only the 'endpoints' part will be extended
   *
   * @param def The step definition from the flow or step itslef.
   * @return definition The new extended step definition
   */
  inheritEndpoints(def) {
    const prototype = Object.getPrototypeOf(this);
    if (prototype && prototype.endpoints) {
      if (def && def.endpoints) {
        // before we can merge endpoints of type string needs to be converted
        for (const endpointName in def.endpoints) {
          const endpointDefinition = def.endpoints[endpointName];
          if (typeof endpointDefinition === 'string') {
            def.endpoints[endpointName] = {
              target: endpointDefinition
            };
          }
        }

        // need to mix the definition
        def.endpoints = merge({}, prototype.endpoints, def.endpoints);
      } else {
        if (!def) {
          def = {};
        }
        // just take the prototype definition
        def.endpoints = prototype.endpoints;
      }
    }
    return def;
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
   * Sends a 'stepStateChanged' event to the manager.
   * arguments are:
   *  step,oldState,newState
   * @param {String} oldState
   * @param {String} newState
   */
  stateChanged(oldState, newState) {
    this.trace(level => ({
      message: 'transitioned',
      old: oldState,
      new: newState
    }));
    this.manager.emit('stepStateChanged', this, oldState, newState);
  }

  /**
   * Deliver json representation
   * @param {Object} options
   *  with the following flags:
   *    includeRuntimeInfo - include runtime informtion like state
   *    includeName - name of the step
   *    includeDefaults - include all properties also the inherited and not overwittern ones
   * @return {Object) json representation
   */
  toJSONWithOptions(options = {}) {
    const json = super.toJSONWithOptions();

    ATTRIBUTES.forEach(a => {
      json[a] = this[a];
    });

    return json;
  }

  /**
   * @return {String} separator between step name and endpoint name
   **/
  get endpointParentSeparator() {
    return '/';
  }

  /**
   * @return {Step} newly created step
   */
  createInstance(stepDefinition, manager) {
    if (!manager) {
      throw new Error(
        `No Manager given in 'createInstance' for step '${stepDefinition.name}'`
      );
    }

    const props = this.prepareProperties(
      manager,
      stepDefinition.name,
      stepDefinition
    );
    this.initialize(manager, stepDefinition.name, stepDefinition, props);
    const newInstance = Object.create(this, props);

    // mix the endpoints from the prototype with the new definition
    stepDefinition = newInstance.inheritEndpoints(stepDefinition);

    newInstance.createEndpoints(stepDefinition);
    newInstance.createPredefinedEndpoints(stepDefinition);
    newInstance.finalize(stepDefinition);

    return newInstance;
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
