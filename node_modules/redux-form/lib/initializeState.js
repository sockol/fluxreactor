'use strict';

exports.__esModule = true;
var makeEntry = function makeEntry(value) {
  return value === undefined ? {} : { initial: value, value: value };
};
/**
 * Sets the initial values into the state and returns a new copy of the state
 */
var initializeState = function initializeState(values) {
  return values ? Object.keys(values).reduce(function (accumulator, key) {
    var value = values[key];
    if (Array.isArray(value)) {
      accumulator[key] = value.map(function (item) {
        return typeof item === 'object' ? initializeState(item) : makeEntry(item);
      });
    } else if (value !== null && typeof value === 'object') {
      accumulator[key] = initializeState(value);
    } else {
      accumulator[key] = makeEntry(value);
    }
    return accumulator;
  }, {}) : values;
};

exports['default'] = initializeState;
module.exports = exports['default'];