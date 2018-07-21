'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _expect = require('expect');

var _expect2 = _interopRequireDefault(_expect);

var _initializeState = require('../initializeState');

var _initializeState2 = _interopRequireDefault(_initializeState);

describe('initializeState', function () {
  it('should return empty if no values', function () {
    _expect2['default'](_initializeState2['default']({})).toEqual({});
  });

  it('should initialize simple values to state', function () {
    _expect2['default'](_initializeState2['default']({
      foo: 'bar',
      catLives: 9,
      alive: true
    })).toBeA('object').toEqual({
      foo: {
        initial: 'bar',
        value: 'bar'
      },
      catLives: {
        initial: 9,
        value: 9
      },
      alive: {
        initial: true,
        value: true
      }
    });
  });

  it('should initialize deep values to state', function () {
    _expect2['default'](_initializeState2['default']({
      foo: {
        bar: 'baz'
      },
      lives: {
        cat: 9
      },
      alive: true
    })).toBeA('object').toEqual({
      foo: {
        bar: {
          initial: 'baz',
          value: 'baz'
        }
      },
      lives: {
        cat: {
          initial: 9,
          value: 9
        }
      },
      alive: {
        initial: true,
        value: true
      }
    });
  });

  it('should initialize array values to state', function () {
    _expect2['default'](_initializeState2['default']({
      foo: ['bar', 'baz', undefined],
      alive: true
    })).toBeA('object').toEqual({
      foo: [{
        initial: 'bar',
        value: 'bar'
      }, {
        initial: 'baz',
        value: 'baz'
      }, {}],
      alive: {
        initial: true,
        value: true
      }
    });
  });

  it('should allow an array to be empty', function () {
    _expect2['default'](_initializeState2['default']({
      foo: []
    })).toBeA('object').toEqual({ foo: [] });
  });

  it('should initialize deep array values to state', function () {
    _expect2['default'](_initializeState2['default']({
      foo: {
        animals: ['cat', 'dog', 'rat']
      },
      bar: [{ deeper: 42 }]
    })).toBeA('object').toEqual({
      foo: {
        animals: [{
          initial: 'cat',
          value: 'cat'
        }, {
          initial: 'dog',
          value: 'dog'
        }, {
          initial: 'rat',
          value: 'rat'
        }]
      },
      bar: [{
        deeper: {
          initial: 42,
          value: 42
        }
      }]
    });
  });
});