import _ from 'lodash';
import Proto from 'uberproto';
import crypto from 'crypto';
import errors from 'feathers-errors';
import makeDebug from 'debug';
import { select } from 'feathers-commons';

import {
  PREDEFINED_FIELDS,
  computeLimit,
  create,
  find,
  update,
  patch,
  remove } from './utils';

const debug = makeDebug('feathers:pouchdb');
const createDebug = makeDebug('feathers:pouchdb:create');
const findDebug = makeDebug('feathers:pouchdb:find');
const getDebug = makeDebug('feathers:pouchdb:get');
const updateDebug = makeDebug('feathers:pouchdb:update');
const patchDebug = makeDebug('feathers:pouchdb:patch');
const removeDebug = makeDebug('feathers:pouchdb:remove');

class Service {
  constructor (options) {
    if (_.isUndefined(options) || _.isUndefined(options.Model)) {
      throw new Error('PouchDB datastore `Model` needs to be provided');
    }
    this.Model = options.Model;
    this.events = options.events || [];
    this.id = options.id || '_id';
    this.paginate = options.paginate || {};
  }

  extend (object) {
    return Proto.extend(object, this);
  }

  create (data, params) {
    data = Array.isArray(data) ? data : [_.assign({}, data)];

    data = data.map(item => {
      if (this.id === '_id' || _.isSet(item[this.id])) {
        return item;
      }
      const time = new Date().getTime();
      const random = crypto.randomBytes(8).toString('hex');
      return Object.assign({}, item, {
        [this.id]: time + random
      });
    });

    createDebug(data);
    return create(this.Model, data).then(documents => {
      if (documents.length === 1) {
        return documents[0];
      }
      return documents;
    }).then(select(params, this.id));
  }

  find (params) {
    params = params || {};
    params.query = _.isObject(params.query) ? params.query : {};
    if (_.isEmpty(_.omit(params.query, PREDEFINED_FIELDS))) {
      params.query.$and = [
        { [this.id]: { $gte: null } },
        { language: { $exists: false } },
        { views: { $exists: false } }
      ];
    }

    if (Array.isArray(params.query.$select) && params.query.$select.indexOf(this.id) === -1) {
      params.query.$select.push(this.id);
    }

    params.paginate = _.isObject(params.paginate) ? params.paginate : this.paginate;
    if (params.paginate.default) {
      params.query.$limit = computeLimit(params.query.$limit, params.paginate);
      params.query.$skip = parseInt(params.query.$skip) || 0;
    }

    findDebug(params);
    const findPromise = (params.query.$limit && params.query.$limit < 1)
      ? Promise.resolve([])
      : find(this.Model, params).then(select(params, this.id));

    return findPromise.then(result => {
      if (!params.paginate.default) {
        return result;
      }
      return {
        total: -1,
        limit: params.query.$limit,
        skip: params.query.$skip,
        data: result
      };
    });
  }

  get (id, params) {
    params = params || {};
    params.query = _.isObject(params.query) ? params.query : {};
    params.query.$limit = 1;

    if (id) params.query[this.id] = id;

    getDebug(params);
    return find(this.Model, params).then(documents => {
      if (documents.length < 1) {
        throw new errors.NotFound(`No record found for id '${id}'`);
      }
      return documents[0];
    }).then(select(params, this.id));
  }

  update (id, data, params) {
    params = params || {};
    params.query = _.isObject(params.query) ? params.query : {};

    if (id) params.query[this.id] = id;

    updateDebug(params, data);
    return update(this.Model, params, data).then(documents => {
      if (documents.length < 1) {
        throw new errors.NotFound(`No record found for id '${id}'`);
      }
      if (documents.length === 1) {
        return documents[0];
      }
      return documents;
    }).then(select(params, this.id));
  }

  patch (id, data, params) {
    params = params || {};
    params.query = _.isObject(params.query) ? params.query : {};

    if (id) params.query[this.id] = id;

    patchDebug(params, data);
    return patch(this.Model, params, data).then(documents => {
      if (documents.length < 1) {
        throw new errors.NotFound(`No record found for id '${id}'`);
      }
      if (documents.length === 1) {
        return documents[0];
      }
      return documents;
    }).then(select(params, this.id));
  }

  remove (id, params) {
    params = params || {};
    params.query = _.isObject(params.query) ? params.query : {};

    if (id) params.query[this.id] = id;

    removeDebug(params);
    return remove(this.Model, params).then(documents => {
      if (documents.length < 1) {
        throw new errors.NotFound(`No record found for id '${id}'`);
      }
      if (documents.length === 1) {
        return documents[0];
      }
      return documents;
    }).then(select(params, this.id));
  }
}

export default function init (options) {
  debug('Initializing feathers-pouchdb plugin');
  return new Service(options);
}

init.Service = Service;
