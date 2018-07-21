import API from './api';
import Action from './action';
 
import { call, put, takeEvery, fork } from 'redux-saga/effects';
import { push } from 'connected-react-router'; 

import axios, { post as axiosPost, put as axiosPut, get as axiosGet } from 'axios';

class Reflux {
  constructor(options = {}) {
    this.options = options;
    this.reload();
  }

  reload(){

    const options = this.options;
    this.exportReducers = this.exportReducers.bind(this); 
    
    this.deleteOldEntities = this.deleteOldEntities.bind(this);

    this.getEvent = this.getEvent.bind(this);
    this.exportSagas = this.exportSagas.bind(this);
    this.setState = this.setState.bind(this);
    this.getState = this.getState.bind(this);
    

    /*
      * Globals
      */
    this._dbug = options.debug || false; 
    this._entityName =
      options.entityName || this.constructor.name.toLowerCase();

    // optionally overload the api class
    this.API = new API();
    this.Action = new Action();

    let calls = options.calls || [];
    calls = this._cleanCalls(calls);
    // calls = this._verifyCalls(calls);

    this._state = options.state || this.getInitialState();
    this.settings = this._compile(calls);

    // print some debug info
    if (this._dbug >= 1) {
      console.log(
        `Initiated a CRUD class '${this._entityName}' with \n`
      );
      console.log('Routes: \n');
      Object.keys(this.settings).forEach(
        k =>
          this.settings[k].route &&
          console.log(
            `\t ${k}:{ route:${this.settings[k].route.url}, method:${
              this.settings[k].route.method
            } }\n`
          )
      );

      console.log('Events: \n');
      Object.keys(this.settings).forEach(k =>
        console.log(`\t ${k}.(start|success|error|destroy|set)`)
      );

      console.log('Sagas: \n');
      Object.keys(this.settings).forEach(
        k =>
          this.settings[k].saga &&
          console.log(`\t ${k}:${this.settings[k].saga.sagaName}`)
      );

      console.log('Actions: \n');
      Object.keys(this.settings).forEach(
        k =>
          this.settings[k].action &&
          console.log(`\t ${k}:${this.settings[k].action.actionName}`)
      );

      console.log('\n');
    }
  }
  
  deleteOldEntities(newState, t){

    const type = this._getType(t);
    
    // delete old like-entities
    Object.keys(newState).forEach(r => { 
      if(newState[r]._type === type)
        delete newState[r];
    });
    return newState;
  }

  //#region Helpers
  /*
 *****************************************************************************
 ********************************** Helpers **********************************
 *****************************************************************************
 */

  _isUpload(body) {
    if (!body) return false;
    const isPrimitive = test => test !== Object(test);

    try {
      body = Array.isArray(body) ? body : [body];

      for (let i = 0; i < body.length; i++) {
        let item = body[i];

        if (isPrimitive(item)) return false;
        if (item.constructor.name !== 'File') return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  _getHash() {
    return (Math.random() * 10000000000000)
      .toFixed(0)
      .split('')
      .map(c => String.fromCharCode(97 + parseInt(c)).toUpperCase())
      .join('');
  }

  _capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  /*
 * _isFunction: check if input is a function
 * @in: f: type of anything
 * @out: true|false
 */
  _isFunction(f) {
    return f && {}.toString.call(f) === '[object Function]';
  }

  /*
 * _formatReducerInput: by default, get[One|Many]Saga functions will return all the data passed into them through the action AND api response
 * @in: action: {type:'',...}
 * @out: {...}
 */
  _formatReducerInput(action, options = {}, data = null) {
    let res = {};
    res = Object.assign(res, action, { type: null });
    res = Object.assign(res, options);
    res = data ? Object.assign(res, { data }) : res;

    return res;
  }

  _getRouteSettings(event, route) {
    //either get API settings from input, or to default settings
    let routeSettings = Object.assign({}, route, {
      credentials: 'include'
    });
    if (!route) return null;

    routeSettings =
      route.method === 'GET'
        ? routeSettings
        : Object.assign(routeSettings, {
            headers: { 'Content-Type': 'application/json' }
          });
    return routeSettings;
  }
  //#endregion

  //#region Error
  /*
 *****************************************************************************
 ********************************** Error checks **********************************
 *****************************************************************************
 */

  _verifyCalls(calls) {
    const m = {};

    calls.forEach(c => {
      if (c.event === false) return;
      // event check
      if (!(c.event in m)) m[c.event] = 1;
      else
        console.error(
          `ERROR: cannot have duplicate events in '${
            this._entityName
          }' with event '${c.event}'`
        );

      // route check
      if (c.route && (!c.route.method || !c.route.url))
        console.error(
          `ERROR: invalid route settings in '${this._entityName}' with reducer '${
            c.reducer
          }'. Needs to be route: { url: '', method: 'POST|DELETE|PUT|GET' }`
        );

      // reducer check
      if (!c.reducer.success || !c.reducer.error)
        console.error(
          `ERROR: invalid reducer settings in '${
            this._entityName
          }' with reducer '${
            c.reducer
          }'. Needs to be reducer: { success: [Function], error: [Function] } or reducer: [Function]`
        );
    });

    return calls;
  }

  // NOTE: this._entityName check not nessesary, bug somewhere
  _getType(t){
    
    const prefix = t && t !== this._entityName ? `/${t}` : '';  
    const type = `${this._entityName}${prefix}`; 
    return type;
  }

  _cleanCalls(calls) {
    const self = this;
    return calls.map(c => {
      if (c.event === false) return c;
 
      const type = this._getType(c._type); 

      const hash = self._getHash();
      const event = c.event ? c.event : hash;
      if (c.saga !== false && !c.saga) c.saga = `${event}Saga`;
      c.action = c.action ? c.action : event;

      c.route = c.route ? self._getRouteSettings(c.event, c.route) : null;

      const extendNewEntities = (newState, action) => {
        
        let response = action.data.body;
            response = Array.isArray(response) ? response : [response];

        // TODO: find a better spot for it. need a spot for errors
        // add metadata into global state [per entty type]
        newState[type] = action.data.meta;

        // insert new ones
        response
        .filter(r => !!r)
        .forEach(r => {  
          r._type = type; 
          r._params = action.params;
          r._query = action.query;
          newState[r.id] = r;
        }); 
        return newState;
      }

      const removeDeletedEntities = (newState, action) => {
        if(action.method !== 'DELETE')
          return newState;
        
        let response = action.data.body;
          response = Array.isArray(response) ? response : [response];
          
        response
        .filter(r => !!r)
        .forEach(r => {   
          delete newState[r.id]; 
        }); 
        return newState;
      }

      const defaultSuccessReducer = (state, action) => {
        let newState = _.cloneDeep(state || {});
            newState = extendNewEntities(newState, action); 
            newState = removeDeletedEntities(newState, action); 
 
        return Object.assign({}, newState);
      };
      const defaultErrorReducer = (state, action) => { 
        const response = action.data.errorMessage; 
        const newState = _.cloneDeep(state);   
        return Object.assign({}, newState, { [type]: { error: response || 'Error' } });  
      };

      // NOTE: not used
      const extendedReducer = reducer => (state, action) => {
        let newState = _.cloneDeep(state); 
            newState = extendNewEntities(newState, action);
           
        return (newState, action) => reducer(newState, action);
      }

      // no reducer provided by entity settings, use default
      if (!c.reducer) {
        c.reducer = {
          success: defaultSuccessReducer,
          error: defaultErrorReducer
        };

        // granualr (success|error) reducer provided by entity settings, use default if nessesary
      } else if (!self._isFunction(c.reducer)) {
        if (!c.reducer.success) c.reducer.success = defaultSuccessReducer;
        if (!c.reducer.error) c.reducer.error = defaultErrorReducer;

        // reducer was provided, use it on success only
      } else {
        c.reducer = {
          success: c.reducer ? c.reducer : defaultSuccessReducer,
          error: defaultErrorReducer
        };
      }
      return c;
    });
  }

  // #endregion

  // #region Compilation
  /*
 *****************************************************************************
 ******************************** Compilation ********************************
 *****************************************************************************
 */

  _compile(calls) {
    const self = this;
    const m = {};

    calls.forEach(c => {
      if (c.event && c.route) {
        const eventName = c.event;
        const events = self._compileEvent(eventName, c.event);

        m[eventName] = {
          events: events,
          _type: c._type,
          saga: self._compileSaga(eventName, c.saga, events),
          route: self._compileRoute(c.event, c.route),
          action: self._compileAction(c.event, c.route, events),
          reducer: self._compileReducer(c.event, c.reducer)
        };
      } else if (c.event) {
        const eventName = c.event;
        const events = self._compileEventFromList(eventName, ['invoke']);
        m[eventName] = {
          events: events,
          _type: c._type,
          action: self._compileActionInvoke(c.event, c.route, events),
          reducer: self._compileReducerInvoke(c.event, c.reducer)
        };
      } else {
        const hash = self._getHash();
        const eventName = `fakeEvent${hash}`;

        m[eventName] = {
          saga: this[c.saga]
        };
      }
    });

    return m;
  }

  /*
 * _compileEvents: generate events map
 * @in: customEvents: available events liost
 * @out: {eventKey: 'module/entity/event/code'}
 */
  _compileEvent(event) {
    const self = this;
    const additionalEvents = ['destroy', 'set'];
    const eventsCodes = ['success', 'error', 'start'];

    // attach events from reducers
    let events = [...additionalEvents, ...eventsCodes];

    return self._compileEventFromList(event, events);
  }

  _compileEventFromList(event, eventList) {
    const self = this;
    let m = {};

    eventList.forEach(e => {
      const code = e.toUpperCase();
      m[e] = `${self._entityName}/${event}/${code}`;
    });

    return m;
  }

  /*
 * _compileSagas: create instances of `_customSaga` and attach them to this class based on what sagas are passed in as input. If customSaga, attach the one defined in Child class
 * @in: sagasMap: map of saga/event pairs
 * @out: void
 */
  _compileSaga(apiMethodName, sagaName, events) {
    const self = this;

    //dont generate saga, it will come from child
    if (sagaName === false) return self[sagaName];

    // generate saga, unless specify otherwise in calls settings
    self[sagaName] = new self._generateCustomSaga(self, {
      events: events,
      apiMethod: apiMethodName,
      sagaName: sagaName
    });
    return self[sagaName];
  }

  _compileAction(event, route, events) {
    const { Action } = this;

    const startEvent = events.start;
    const setEvent = events.set;
    const destroyEvent = events.destroy;

    const method = this._generateCustomAction(startEvent, route.method);

    method.start = method;
    method.set = Action.set(setEvent);
    method.destroy = Action.destroy(destroyEvent);

    const actionName = `${event}`;
    this[actionName] = method;
    method.actionName = actionName;
    return method;
  }

  _compileActionInvoke(event, route, events) {
    const { Action } = this;
    const startEvent = events.invoke;

    const method = Action.invoke(startEvent);

    const actionName = `${event}`;
    this[actionName] = method;
    method.actionName = actionName;
    return method;
  }

  /*
 * _compileRoutes: create funcctions attached to API based on passed in routes/sagas, dont add if route already exists (default)
 * @in: sagas: map of saga/event pairs
 * routes: routes from config
 * @out: void
 */
  _compileRoute(methodName, routeSettings) {
    const { API } = this;

    let method = null;
    if (routeSettings) {
      method = this._generateCustomApiRoute(routeSettings);

      method.url = routeSettings.url;
      method.method = routeSettings.method;
      API[methodName] = method;
    }
    return method;
  }

  /*
 * _compileReducers: generate the reducer table, where `validTypes` events that result in SUCCESS codes return data
 * @out: function(action){} that returns `data` based on `action`
 */
  _compileReducer(event, reducer) {
    const self = this;
    const str = `${self._entityName}/${event}/`;
    const callable = (state, action) => {
      const table = {
        [str + 'SUCCESS']: reducer.success,
        [str + 'ERROR']: reducer.error,
        [str + 'START']: (state, action) => state,
        [str + 'SET']: (state, action) => __dirname.merge(state, action.target)
      };
      return action.type in table ? table[action.type](state, action) : state;
    };
    return callable;
  }
  _compileReducerInvoke(event, reducer) {
    const self = this;
    const str = `${self._entityName}/${event}/`;
    const callable = (state, action) => {
      const table = {
        [str + 'INVOKE']: reducer.success,
      };
      return action.type in table ? table[action.type](state, action) : state;
    };
    return callable;
  }

  // #endregion

  // #region Exports
  /*
 *****************************************************************************
 ********************************** Exports **********************************
 *****************************************************************************
 */

  /*
 * exportReducers: getter for reducers
 * @in: state: REACT state object
 * action: action object
 * @out: {reducer table} or `data` from reducer table
 */
  exportReducers(state = null, action) {
    const self = this;
    const eventValue = action.type;

    const eventValueList = eventValue.split('/');

    // skip redux prep
    if (
      eventValueList.length < 4 ||
      eventValueList[0] === '@@redux' ||
      eventValueList[0] === '@@INIT'
    )
      return state;

    const eventSections = {
      module: eventValueList[0],
      entity: eventValueList[1],
      event: eventValueList[2],
      type: eventValueList[3]
    };

    // set event
    const eventName = eventSections.event;
    if (eventName === 'setState') return Object.assign(state, action.target);

    const fn = self.settings[eventSections.event];
    if (!fn) return state;
    return fn.reducer(state, action);
  } 

  getInitialState() {
    return {};
  }
  getState() {
    return Object.assign({}, this._state);
  }

  getEvent(event, status = null) {
    const temp = this.settings[event] ? this.settings[event] : {};

    if (!status) return temp.events;

    const validStatusCodes = ['success', 'error', 'start'];
    if (!validStatusCodes.includes(status)) {
      this.dbug &&
        console.warn(
          `WARNING: in method 'getEvent' invalid status '${status}' for event '${event}'`
        );
      return null;
    }
    return temp.events[status];
  }

  /*
 * exportSagas: go through each function in this class, check if any of them are in the `sagasList`, return them
 * @out: [saga function poiners]
 */
  exportSagas() {
    return Object.values(this.settings)
      .filter(s => s.saga)
      .map(s => s.saga);
  }

  setState(state) {
    const startEvent = `${this._entityName}/setState/SUCCESS`;
    return {
      type: startEvent,
      target: state
    };
  }

  // #endregion

  // #region Generatos
  /*
 *****************************************************************************
 ********************************** Generators **********************************
 *****************************************************************************
 */

  _generateCustomAction(startEvent, method) {
    const { Action } = this;
    const r =
      method === 'GET'
        ? Action.get(startEvent)
        : method === 'POST'
          ? Action.add(startEvent)
          : method === 'DELETE'
            ? Action.remove(startEvent)
            : method === 'PUT'
              ? Action.update(startEvent)
              : () => null;
    return r;
  }

  _generateCustomApiRoute(settings) {
    const self = this;
    const { API } = self;

    async function fileMethod(url, files = []) {
      const formData = new FormData();
      const filesList = Array.isArray(files) ? files : [files];
      filesList.forEach(f => formData.append('files', f));
      const fn = settings.method === 'POST' ? axiosPost : axiosPut;
      const r = await fn(url, formData, {
        headers: {
          'content-type': 'multipart/form-data'
        }
      });
      return r.data;
    }

    async function helper(input) {
      let url = settings.url;
          url = API._parseParams(url, input.params);
          url = API._parseQuery(url, input.query);
     
      try {
        if (input.body && self._isUpload(input.body))
          return await fileMethod(url, input.body);
        if (settings.method !== 'GET')
          input.body = input.body ? JSON.stringify(input.body) : {};
          
        const response = await fetch(url, Object.assign(input, settings));
        const responsePayload = await response.json();
        
        if (response.status !== 200) { 
          const errorMessage = responsePayload && responsePayload.errorMessage ? responsePayload.errorMessage : response.statusText;
          throw errorMessage;
        } 
        return responsePayload;
      } catch (e) { 
        const errorMessage = `API call error on route: ${url}`;
        return {
          error: true,
          errorMessage: e.toString() || errorMessage, 
        };
      }
    }
    // NOTE attach settings for testing
    helper.settings = settings;
    return helper;
  }

  /*
 * _customSaga:
 * @in: options: map of saga/event pairs
 * @out: saga function
 */
  _generateCustomSaga(self, options = {}) {
    const { API } = self;

    const eventKey = options.apiMethod;

    const startEvent = options.events.start;
    const successEvent = options.events ? options.events.success : null;
    const errorEvent = options.events ? options.events.error : null;
    const sagaName = 'saga' + self._capitalize(eventKey);

    const wrapper = function*() {
      const caller = function*(action) {
        const apiMethod = API[eventKey];

        let data = apiMethod ? yield call(apiMethod, action) : action.data;

        if (data.error) {
          self._dbug &&
            console.error(
              `ERROR: CRUD class: ${
                self._entityName
              } api call '${sagaName}' failed, emitting event: ${errorEvent}\n`
            );
          const r = self._formatReducerInput(
            action,
            { type: errorEvent },
            data
          );
          return yield put(r);
        }

        self._dbug &&
          console.log(
            `CRUD class: ${
              self._entityName
            } api call '${sagaName}' succeeded, emitting event: ${successEvent}\n`
          );

        const r = self._formatReducerInput(
          action,
          { type: successEvent },
          data
        );
        
        if(action.historyPush) {  
          return yield put(push(action.historyPush)); 
        }
        if(action.redirectAndReload) 
          return location.href = action.redirectAndReload; 

        return yield put(r);
      };

      yield fork(takeEvery, startEvent, caller);
    };
    //Note attach event for testing
    wrapper.sagaName = sagaName;

    if (startEvent) wrapper.startEvent = startEvent;
    if (successEvent) wrapper.successEvent = successEvent;
    if (errorEvent) wrapper.errorEvent = errorEvent;
    return wrapper;
  }
  // #endregion
}

export default Reflux;
