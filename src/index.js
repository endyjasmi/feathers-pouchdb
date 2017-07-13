import _ from 'lodash';
import Proto from 'uberproto';
import crypto from 'crypto';
import errors from 'feathers-errors';
import makeDebug from 'debug';
import { select } from 'feathers-commons';

import { computeLimit, convertQuery, extractMetadata } from './utilities';

const debug = makeDebug('feathers-pouchdb');

class Service {
  constructor (options) {
    if (_.isUndefined(options) || _.isUndefined(options.Model)) {
      throw new Error('PouchDB datastore `Model` needs to be provided');
    }
    this.Model = options.Model;
    this.events = options.events || [];
    this.id = options.id || '_id';
    this.paginate = options.paginate || {};
    this.query = options.query || {
      [this.id]: { $gte: null }
    };
  }

  extend (object) {
    return Proto.extend(object, this);
  }

  _find (params) {
    params.query = _.isObject(params.query) && !_.isEmpty(params.query)
      ? params.query : this.query;

    if (_.isArray(params.query.$select) && _.indexOf(params.query.$select, this.id) < 0) {
      params.query.$select.push(this.id);
    }

    return this.Model.find(convertQuery(params.query))
      .then(response => response.docs);
  }

  find (params) {
    if (!_.isEmpty(this.paginate)) {
      params.paginate = params.paginate || this.paginate;
      if (params.paginate.default) {
        params.query.$limit = computeLimit(params.query.$limit, params.paginate);
        params.query.$skip = parseInt(params.query.$skip) || 0;
      }
    }
    return this._find(params)
      .then(records => {
        if (_.isUndefined(params.paginate)) {
          return records;
        }
        return {
          total: records.length,
          limit: params.query.$limit,
          skip: params.query.$skip,
          data: records
        };
      });
  }

  get (id, params) {
    params.query = _.isObject(params.query) && !_.isEmpty(params.query)
      ? _.pick(params.query, ['$select', '$index']) : {};

    params.query[this.id] = id;
    params.query.$limit = 1;

    return this._find(params)
      .then(records => {
        if (records.length < 1) {
          throw new errors.NotFound(`No record found for id '${id}'`);
        }
        return records[0];
      });
  }

  create (data, params) {
    data = _.cloneDeep(_.isArray(data) ? data : [data]);
    data = data.map(item => {
      const time = new Date().getTime().toString(16);
      const random = crypto.randomBytes(8).toString('hex');
      return _.assign({
        [this.id]: time + random
      }, item);
    });

    return this.Model.bulkDocs(data)
      .then(responses => _.map(responses, (response, index) => {
        if (!response.ok) {
          throw new errors.BadRequest(response.message);
        }
        return _.assign(data[index], extractMetadata(response));
      }))
      .then(records => {
        if (records.length === 1) {
          return records[0];
        }
        return records;
      })
      .then(select(params, this.id));
  }

  update (id, data, params) {
    params.query = _.isObject(params.query) && !_.isEmpty(params.query)
      ? params.query : this.query;

    const findParams = _.cloneDeep(params);
    findParams.query = _.omit(findParams.query, ['$select', '$sort', '$skip', '$limit']);

    if (id) {
      findParams.query = _.assign({
        [this.id]: id
      }, _.pick(findParams.query, ['$index']));
    }

    return this._find(findParams)
      .then(records => {
        const operations = _.map(records, record =>
          _.assign(_.clone(data), _.pick(record, ['_id', '_rev'])));
        return Promise.all([operations, this.Model.bulkDocs(operations)]);
      })
      .then(result => {
        const operations = result[0];
        const responses = result[1];
        return _.map(responses, (response, index) => {
          if (!response.ok) {
            throw new errors.Conflict(response.message);
          }
          return _.assign(operations[index], extractMetadata(response));
        });
      })
      .then(records => {
        if (records.length < 1) {
          throw new errors.NotFound(`No record found for id '${id}'`);
        }
        if (records.length === 1) {
          return records[0];
        }
        return records;
      })
      .then(select(params, this.id));
  }

  patch (id, data, params) {
    params.query = _.isObject(params.query) && !_.isEmpty(params.query)
      ? params.query : this.query;

    const findParams = _.cloneDeep(params);
    findParams.query = _.omit(findParams.query, ['$select', '$sort', '$skip', '$limit']);

    if (id) {
      findParams.query = _.assign({
        [this.id]: id
      }, _.pick(findParams.query, ['$index']));
    }

    return this._find(findParams)
      .then(records => {
        const operations = _.map(records, record =>
          _.assign(record, data, _.pick(record, ['_id', '_rev'])));
        return Promise.all([operations, this.Model.bulkDocs(operations)]);
      })
      .then(result => {
        const operations = result[0];
        const responses = result[1];
        return _.map(responses, (response, index) => {
          if (!response.ok) {
            throw new errors.Conflict(response.message);
          }
          return _.assign(operations[index], extractMetadata(response));
        });
      })
      .then(records => {
        if (records.length < 1) {
          throw new errors.NotFound(`No record found for id '${id}'`);
        }
        if (records.length === 1) {
          return records[0];
        }
        return records;
      })
      .then(select(params, this.id));
  }

  remove (id, params) {
    params.query = _.isObject(params.query) && !_.isEmpty(params.query)
      ? params.query : this.query;

    const findParams = _.cloneDeep(params);
    findParams.query = _.omit(findParams.query, ['$select', '$sort', '$skip', '$limit']);

    if (id) {
      findParams.query = _.assign({
        [this.id]: id
      }, _.pick(findParams.query, ['$index']));
    }

    return this._find(findParams)
      .then(records => {
        const operations = _.map(records, record =>
          _.assign(record, { _deleted: true }));
        return Promise.all([operations, this.Model.bulkDocs(operations)]);
      })
      .then(result => {
        const operations = result[0];
        const responses = result[1];
        return _.map(responses, (response, index) => {
          if (!response.ok) {
            throw new errors.Conflict(response.message);
          }
          return _.assign(operations[index], extractMetadata(response));
        });
      })
      .then(records => {
        if (records.length < 1) {
          throw new errors.NotFound(`No record found for id '${id}'`);
        }
        if (records.length === 1) {
          return records[0];
        }
        return records;
      })
      .then(select(params, this.id));
  }
}

export default function init (options) {
  debug('Initializing feathers-pouchdb plugin');
  return new Service(options);
}

init.Service = Service;
