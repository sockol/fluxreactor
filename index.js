import React from 'react';
import ReactDOM from 'react-dom';
import createSagaMiddleware from 'redux-saga';

import { Provider } from 'react-redux';
import { createBrowserHistory } from 'history';
import { applyMiddleware, compose, createStore } from 'redux';
import {
  connectRouter,
  routerMiddleware,
  ConnectedRouter
} from 'connected-react-router';
import { composeWithDevTools } from 'redux-devtools-extension';
import { AppContainer } from 'react-hot-loader';
import { fork, all } from 'redux-saga/effects';
import { Route, Switch, Redirect } from 'react-router';
import { combineReducers } from 'redux';
import reduceReducers from 'reduce-reducers';

import multireducer from 'multireducer';

import { NotAllowed } from 'core-containers';

import * as Entities from '~/modules/*/client/controller/entities/*.js';
import * as Controllers from '~/modules/*/client/controller/*.js';
import * as Routes from '~/modules/*/client/routes/*.js';

import Sagas from '~/modules/core/client/utils/sagas.js';

import '~/config/styles/_global.nocompile.scss';
import '~/config/styles/_typeface.nocompile.scss'; 

import 'react-dates/initialize'; 
import '~/config/styles/_datepicker.nocompile.scss'; 
 
import { Auth, User } from '~/modules/user/client/controller/entities/*.js';
import { Vendor } from '~/modules/vendor/client/controller/entities/*.js';
import { Enquiry, Message, Event } from '~/modules/booking/client/controller/entities/*.js';
import { Article, Image } from '~/modules/blog/client/controller/entities/*.js';
import { Category, Destination } from '~/modules/core/client/controller/entities/*.js';
  
/*
 combine and reduce on state
 */

class App {
  constructor(options = {}) {
    const { Router, Entities, Controller } = options;

    const sagaMiddleware = Sagas.middleware;
    this.sagaMiddleware = sagaMiddleware;

    const initialState = this.getState();
    const entities = this.getEntities();
    const sagas = this.getSagas(entities);
    const routes = this.getRoutes();

    const History = this.initHistory(History);
    const Middleware = this.initMiddleware(History, sagaMiddleware);
    const Store = this.initStore(History, initialState, Middleware);

    Sagas.initSagas(sagas);

    const Application = (
      <AppContainer>
        <Provider store={Store}>
          <ConnectedRouter history={History} key={Math.random()}>
            <Switch>
              {routes
                .sort((l, r) => (l.priority || 0) - (r.priority || 0))
                .map(r => {
                  if (!this.isAllowed(r.roles)) {
                    return (
                      <Route
                        exact={!!r.exact}
                        key={r.key || Math.random()}
                        path={r.path}
                        component={NotAllowed}
                      />
                    );
                  }

                  if (r.render) {
                    return (
                      <Route
                        exact={!!r.exact}
                        key={r.key || Math.random()}
                        path={r.path}
                        render={r.render}
                      />
                    );
                  }

                  if (r.component) {
                    return (
                      <Route
                        exact={!!r.exact}
                        key={r.key || Math.random()}
                        path={r.path}
                        component={r.component}
                      />
                    );
                  }
                })}
            </Switch>
          </ConnectedRouter>
        </Provider>
      </AppContainer>
    );

    this.init(Application);
  }

  getSagaMiddleware() {
    return this.sagaMiddleware;
  }

  getEntities() {
    const m = {};
    Object.keys(Entities).forEach(
      e => (m[this.getEntityName(e)] = Entities[e])
    );
    Object.keys(Controllers).forEach(
      e => (m[this.getEntityName(e)] = Controllers[e])
    );
    return m;
  }

  getEntityName(name) {
    let n = name.split('$');
    const entityName = n[n.length - 1];
    return n[0] + entityName;
  }

  getRoutes() {
    const routes = [];
    Object.values(Routes).forEach(r => r.forEach(rr => routes.push(rr)));
    return routes;
  }

  getSagas(entities) {
    const sagas = [];

    for (let Entity in entities) sagas.push(...entities[Entity].exportSagas());

    return sagas;
  }

  getState() {
    // reducers and initial state could be merged but then we won't be able to compose reducers, so keeping them split out
    return {
      data: {}, 
      auth: {},
      destinations: {},
      categories: {}
    };
  }

  initMiddleware(History, sagaMiddleware) {
    return [routerMiddleware(History), sagaMiddleware];
  }

  initHistory(History) {
    return createBrowserHistory(History || {});
  }

  // TODO: figure out how to handle errors?
  initStore(History, initialState, Middleware) {
    const entityList = [
      User, Vendor, Article, Image, Enquiry, Message, Event,  
    ];

    const RootReducer = combineReducers({
      data: reduceReducers(...entityList.map(e => e.exportReducers)), 
      auth: Auth.exportReducers,
      destinations: Destination.exportReducers,
      categories: Category.exportReducers,
    });

    const composeEnhancers = composeWithDevTools
      ? composeWithDevTools
      : compose;

    const Store = createStore(
      connectRouter(History)(RootReducer),
      initialState || {},
      composeEnhancers(applyMiddleware(...Middleware))
    );

    return Store;
  }

  init(Application) {
    return ReactDOM.render(Application, document.getElementById('root'));
  }

  isAllowed(roles = []) {
    return true;

    // roles=[] means its a guest route
    if (!roles.length) return true;

    if (!user) return roles.includes('guest');
 
    return roles.includes(window.user.role);
  }
}

const app = new App();

// function init(accept) {
//   accept(() => console.log('Accepted!'));
// }
// init(cb => {
//   if (module.hot) {
//     // module.hot.accept(cb);
//     // module.hot.decline(() => {
//     //   console.log('Not accepted');
//     //   window.location.reload();
//     // });
//   }
// }); 

export default app;
