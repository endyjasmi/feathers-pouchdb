// import errors from 'feathers-errors';
import makeDebug from 'debug';
import { select } from 'feathers-commons';

const debug = makeDebug('feathers-pouchdb');

class Service {

  constructor(options) {
    if (!options || !options.Model) {
      throw new Error('PouchDB instance needs to be provided');
    }
    this.Model = options.Model;
  }

  create(data, params) {
    const createPromise = Array.isArray(data) ?
      this._createMultiple(data) :
      this._createSingle(data);
    return createPromise.then(select(params, '_id'));
  }

  _createMultiple(data) {
    return this.Model.bulkDocs(data)
      .then(responses => {
        return responses.map((response, index) => {
          return Object.assign(data[index], {
            _id: response.id,
            _rev: response.rev
          });
        });
      });
  }

  _createSingle(data) {
    return this.Model.post(data)
      .then(response => {
        return Object.assign(data, {
          _id: response.id,
          _rev: response.rev
        });
      });
  }

}

export default function init (options) {
  debug('Initializing feathers-pouchdb plugin');
  return new Service(options);
}

init.Service = Service;
