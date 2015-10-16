/* jslint node: true, esnext: true */

"use strict";

const logLevels = [{
  name: 'trace',
  priority: 100000
}, {
  name: 'debug',
  priority: 10000
}, {
  name: 'info',
  priority: 1000
}, {
  name: 'warn',
  priority: 100
}, {
  name: 'error',
  priority: 10
}, {
  name: 'fatal',
  priority: 1
}];


/**
 * Adds logging methods to an existing object.
 * For each loglevel an function will be created.
 * @param theFunction {function} The function to be added under the loglevel name.
 *        This function will only be called if the current loglevel is greater equal
 *        the log level of the called logging function
 */
exports.assignLoggerFunctions = function (object, theFunction) {
  logLevels.forEach(level => {
    object[level.name] = function (args) {
      if (this.logLevel >= level.priority)
        theFunction(args);
    };
  });
};
