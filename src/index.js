import errors from 'feathers-errors';
import makeDebug from 'debug';
import { select } from 'feathers-commons';

import { convertQuery,
  createMultiple,
  createSingle } from './utils';

const debug = makeDebug('feathers-pouchdb');

class Service {

  constructor(options) {
    if (!options || !options.Model) {
      throw new Error('PouchDB instance needs to be provided');
    }
    this.Model = options.Model;
  }

  create(data, params) {
    const createPromise = Array.isArray(data) ? createMultiple(data) : createSingle(data);
    return createPromise.then(select(params, '_id'));
  }

  find(params) {
    params = params || {};
    params.query = params.query || { _id: { $gte: null }};

    if (params.query.$select &&
      Array.isArray(params.query.$select) &&
      params.query.$select.indexOf('_id') === -1) {
      params.query.$select.push('_id');
    }

    return this.Model.find(convertQuery(params.query))
      .then(response => {
        return response.docs;
      })
      .then(select(params, '_id'));
  }

  get(id, params) {
    params = params || {};
    params.query = params.query || {};
    params.query['_id'] = id;
    params.query.$limit = 1;

    return this.find(params)
      .then(result => {
        if (result.length < 1) {
          throw new errors.NotFound(`No record found for _id '${id}'`);
        }
        return result[0];
      });
  }

}

export default function init (options) {
  debug('Initializing feathers-pouchdb plugin');
  return new Service(options);
}

init.Service = Service;
