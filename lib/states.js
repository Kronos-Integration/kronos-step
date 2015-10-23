/* jslint node: true, esnext: true */

"use strict";

/*
 * Possible step states with their transitions
 */
const states = [{
  name: "running",
  description: "endpoints are able process requests",
  transitions: {
    stop: {
      during: "stopping",
      final: "stopped"
    }
  }
}, {
  name: "stopped",
  description: "endpoints do not process requests",
  transitions: {
    start: {
      during: "starting",
      final: "running"
    },
    remove: {
      final: "removed"
    }
  }
}, {
  name: "failed",
  description: "error occured"
}, {
  name: "removed",
  description: "final state before removing"
}];

/*
 * Transitions extracted from states above
 */
const transitions = {};

states.forEach(state => {
  for (const t in state.transitions) {
    let st = transitions[t];
    if (!st) {
      st = state.transitions[t];
      st.name = t;
      transitions[t] = st;
      st.current = {};
    }
    st.current[state.name] = {};
  }
});

//console.log(`${JSON.stringify(transitions,true,2)}`);

/**
 * Deliver a function to perfom a state transition.
 * States are traversed in the following way:
 * current -> during -> final
 * If the step is not in one of the transitions current
 * states and also not already in the transitions final
 * state a rejecting promise will be delvered from the
 * generated function. In the 'during' state a function
 * named '_' + <transitions name> (sample: '_start()')
 * will be called first.
 * It is expected that this function delivers a promise.
 * Special handling of consequent transitions:
 * While in a during state the former delivered primise will be
 * delivered again. This enshures that several consequent
 * transitions in a row will be fullfiled by the same promise.
 * @param {Object} transition object describing the state transition
 * @return {Function} function when executed will perfom the state
 *         transition on a given step
 * @api private
 */
exports.transitionFunction = function (transition) {
  return function () {
    if (transition.current[this.state]) {
      this.state = transition.during;

      return this._transitionPromise = this['_' + transition.name]().then(
        () => {
          this.state = transition.final;
          this._transitionPromise = undefined;
          return this;
        }, (reject) => {
          this.state = 'failed';
          this._transitionPromise = undefined;
          return reject;
        }
      );
    }
    if (this.state === transition.during) {
      return this._transitionPromise;
    }
    if (this.state === transition.final) {
      return Promise.resolve(this);
    }

    return this.rejectWrongState(transition.name);
  };
};

exports.transitions = transitions;
