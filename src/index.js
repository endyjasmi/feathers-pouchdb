import errors from 'feathers-errors';
import makeDebug from 'debug';
import { select } from 'feathers-commons';

import { create, find, update, path, remove } from './utils';

const debug = makeDebug('feathers-pouchdb');

class Service {

  constructor(options) {
    if (!options || !options.Model) {
      throw new Error('PouchDB instance needs to be provided');
    }
    this.Model = options.Model;
  }

  create(data, params) {
    data = Array.isArray(data) ? data : [data];
    return create(this.Model, data).then(select(params, '_id'));
  }

  find(params) {
    return find(this.Model, params).then(select(params, '_id'));
  }

}

export default function init (options) {
  debug('Initializing feathers-pouchdb plugin');
  return new Service(options);
}

init.Service = Service;
