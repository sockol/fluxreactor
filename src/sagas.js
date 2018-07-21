
import createSagaMiddleware from 'redux-saga';
import { fork, all } from 'redux-saga/effects';

class Sagas {

  constructor(){

    this.middleware = createSagaMiddleware();
  }
  getSagaMiddleware(){

    return this.middleware;
  }
  initSagas(sagas){
      
    const sagaMiddleware = this.getSagaMiddleware();

    for(let s in sagas)
      sagas[s] = fork(sagas[s]);

    sagaMiddleware.run(function * () {
      yield all([...sagas]);
    }); 
  }
}
export default new Sagas();