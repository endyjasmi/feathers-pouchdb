import _ from 'lodash';
import errors from 'feathers-errors';

export const PREDEFINED_FIELDS = ['$limit', '$skip', '$sort', '$select'];

export function create(database, data) {
  return database.bulkDocs(data)
    .then(responses => _.map(responses, (response, index) => {
      if (!response.ok) {
        throw new errors.BadRequest(response.message);
      }
      return _.merge(data[index], extractMeta(response));
    }));
}

export function find(database, params) {
  const query = convertQuery(params.query);
  return database.find(query)
    .then(response => response.docs);
}

export function update(database, params, data) {
  return find(database, params)
    .then(documents => {
      const operations = _.map(documents, document => {
        const newData = _.assign({}, data);
        return _.merge(newData, _.pick(document, ['_id', '_rev']));
      });
      return Promise.all([operations, database.bulkDocs(operations)]);
    })
    .then(result => {
      const operations = result[0];
      const responses = result[1];
      return _.map(responses, (response, index) => {
        if (!response.ok) {
          throw new errors.Conflict(response.message);
        }
        return _.merge(operations[index], extractMeta(response));
      });
    })
}

export function patch(database, params, data) {
  return find(database, params)
    .then(documents => {
      const operations = _.map(documents, document => {
        return _.merge(document, data, _.pick(document, ['_id', '_rev']));
      });
      return Promise.all([operations, database.bulkDocs(operations)]);
    })
    .then(result => {
      const operations = result[0];
      const responses = result[1];
      return _.map(responses, (response, index) => {
        if (!response.ok) {
          throw new errors.Conflict(response.message);
        }
        return _.merge(operations[index], extractMeta(response));
      });
    })
}

export function remove(database, params) {
  return find(database, params)
    .then(documents => {
      const operations = _.map(documents, document => {
        return _.merge(document, {
          _deleted: true
        });
      });
      return Promise.all([operations, database.bulkDocs(operations)]);
    })
    .then(result => {
      const operations = result[0];
      const responses = result[1];
      return _.map(responses, (response, index) => {
        if (!response.ok) {
          throw new errors.Conflict(response.message);
        }
        return _.merge(operations[index], extractMeta(response));
      });
    })
}

export function computeLimit(limit, paginate) {
  const lower = !_.isUndefined(limit) ? parseInt(limit) : paginate.default;
  const upper = _.isNumber(paginate.max) ? paginate.max : Number.MAX_VALUE;
  return Math.min(lower, upper);
}

export function convertQuery(feathersQuery) {
  const mangoQuery = {};
  for (let queryField in feathersQuery) {
    switch (queryField) {
      case '$select':
        // Currently fields is filtered right before the data being returned by the service.
        // In the future, maybe we can incorporate field filtering so that in cases like
        // PouchDb as CouchDB client, we can save some network bandwidth by transferring only data
        // that is needed across the wire.
        // mangoQuery.fields = feathersQuery[queryField];
        break;

      case '$sort':
        mangoQuery.sort = convertSort(feathersQuery[queryField]);
        break;

      case '$skip':
        mangoQuery.skip = parseInt(feathersQuery[queryField]);
        break;

      case '$limit':
        mangoQuery.limit = parseInt(feathersQuery[queryField]);
        break;

      default:
        mangoQuery.selector = mangoQuery.selector || {};
        mangoQuery.selector[queryField] = feathersQuery[queryField];
        break;
    }
  }
  return mangoQuery;
}

export function convertSort(feathersSort) {
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

export function extractMeta(pouchdbResponse) {
  return _.mapKeys(_.pick(pouchdbResponse, ['id', 'rev']), (value, key) => {
    return `_${key}`;
  });
}
