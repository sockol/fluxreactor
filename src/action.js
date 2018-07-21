function Action () {
    
  /*
   * actionGet: make an ajax GET call with passed in parameters
   * @in: options: {
   * params: {id:'UUID'}
   * query: {clientId:'UUID'}
   * }
   * extraData (optional): {any extra data you want to be returned after this event is processed}
   * @out: extraData (optional), action[entityName] set to ajax result
   */
  const get = (startEvent) => {
    return (options = {}, extraData = {}) => { 
      let r = {
        type: startEvent
      };
      if (options.params) Object.assign(r, { params: options.params });
      if (options.query) Object.assign(r, { query: options.query });
      Object.assign(r, extraData);
      return r;
    };
  } 

  /*
   * actionAdd: make an ajax call POST with passed in parameters
   * @in: options: {
   * body: {Object}
   * }
   * extraData (optional): {any extra data you want to be returned after this event is processed}
   * @out: extraData (optional), action[entityName] set to ajax result
   */
  const add = (startEvent) => {
    return (options = {}, extraData = {}) => { 
      let r = {
        type: startEvent
      };
      if (options.params) Object.assign(r, { params: options.params });
      if (options.body) Object.assign(r, { body: options.body });
      if (options.query) Object.assign(r, { query: options.query });
      Object.assign(r, extraData);
      return r;
    };
  } 

  /*
   * actionUpdate: make an ajax call UPDATE with passed in parameters
   * @in: options: {
   * params: {id:'UUID'}
   * query: {clientId:'UUID'}
   * body: {Object}
   * }
   * extraData (optional): {any extra data you want to be returned after this event is processed}
   * @out: extraData (optional), action[entityName] set to ajax result
   */
  const update = (startEvent) => {
    return (options = {}, extraData = {}) => { 
      let r = {
        type: startEvent
      };
      if (options.params) Object.assign(r, { params: options.params });
      if (options.body) Object.assign(r, { body: options.body });
      if (options.query) Object.assign(r, { query: options.query });
      Object.assign(r, extraData);
      return r;
    };
  } 

  /*
   * actionRemove: make an ajax call DELETE with passed in parameters
   * @in: options: {
   * params: {id:'UUID'}
   * query: {clientId:'UUID'}
   * }
   * extraData (optional): {any extra data you want to be returned after this event is processed}
   * @out: extraData (optional), action[entityName] set to ajax result
   */
  const remove = (startEvent) => {
    return (options = {}, extraData = {}) => { 
      let r = {
        type: startEvent
      };
      if (options.params) Object.assign(r, { params: options.params });
      if (options.query) Object.assign(r, { query: options.query });
      Object.assign(r, extraData);
      return r;
    };
  } 

  /*
   * actionDestroy: remove action[entityName] from state
   * @in: extraData (optional): {any extra data you want to be returned after this event is processed}
   * @out: extraData (optional), action[entityName] set to null
   */
  const destroy = (startEvent) => {
    return (options = {}, extraData = {}) => { 
      let r = {
        type: startEvent
      };
      Object.assign(r, extraData);
      return r;
    };
  } 

  /*
   * actionSet: set action[entityName] in state to options object
   * @in: options {anything}
   * @in: extraData (optional): {any extra data you want to be returned after this event is processed}
   * @out: extraData (optional), action[entityName] set to null
   */
  const set = (startEvent) => {
    return (options = {}) => { 
      let r = {
        type: startEvent,
        data: options
      };
      Object.assign(r, extraData);
      return r;
    };
  } 
  
  /*
   * actionInvoke: set action[entityName] will go into the reducer
   * @in: options {anything}
   * @in: extraData (optional): {any extra data you want to be returned after this event is processed}
   * @out: extraData (optional), action[entityName] set to null
   */
  const invoke = (startEvent) => {
    return (options = {}) => { 
      let r = {
        type: startEvent, 
        data: options,
      }; 
      return r;
    };
  }

  return {
    add,
    remove,
    update,
    get,
    set,
    invoke,
    destroy
  }
}

export default Action;