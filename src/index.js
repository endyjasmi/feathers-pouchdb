import errors from 'feathers-errors';
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

  find(params) {
    params = params || {};
    params.query = params.query || { _id: { $gte: null }};

    if (params.query.$select &&
      Array.isArray(params.query.$select) &&
      params.query.$select.indexOf('_id') === -1) {
      params.query.$select.push('_id');
    }

    const mangoQuery = this._convertQuery(params.query);
    return this.Model.find(mangoQuery)
      .then(response => {
        return response.docs;
      })
      .then(select(params, '_id'));
  }

  _convertQuery(feathersQuery) {
    const mangoQuery = {};
    for (let queryField in feathersQuery) {
      switch (queryField) {
        case '$select':
          mangoQuery.fields = feathersQuery[queryField];
          break;

        case '$sort':
          mangoQuery.sort = this._convertSort(feathersQuery[queryField]);
          break;

        case '$skip':
          mangoQuery.skip = feathersQuery[queryField];
          break;

        case '$limit':
          mangoQuery.limit = feathersQuery[queryField];
          break;

        default:
          mangoQuery.selector = mangoQuery.selector || {};
          mangoQuery.selector[queryField] = feathersQuery[queryField];
          break;
      }
    }
    return mangoQuery;
  }

  _convertSort(feathersSort) {
    const mangoSort = [];
    for (let sortField in feathersSort) {
      if (feathersSort[sortField] < 0) {
        mangoSort.push({ [sortField]: 'desc' });
        continue;
      }
      if (feathersSort[sortField] > 0) {
        mangoSort.push({ [sortField]: 'asc'});
        continue;
      }
    }
    return mangoSort;
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
