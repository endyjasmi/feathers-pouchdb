import _ from 'lodash';
import errors from 'feathers-errors';

export function create(database, data) {
  return database.bulkDocs(data)
    .then(responses => _.map(responses, (response, index) => {
      if (!response.ok) {
        throw new errors.BadRequest(response.message);
      }
      return _.merge(data[index], _.pick(response, ['id', 'rev']));
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
        const newDocument = _.mapKeys(_.pick(response, ['id', 'rev']), (value, key) => {
          return `_${key}`;
        });
        return _.merge(operations[index], newDocument);
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
        const newDocument = _.mapKeys(_.pick(response, ['id', 'rev']), (value, key) => {
          return `_${key}`;
        });
        return _.merge(operations[index], newDocument);
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
        const newDocument = _.mapKeys(_.pick(response, ['id', 'rev']), (value, key) => {
          return `_${key}`;
        });
        return _.merge(operations[index], newDocument);
      });
    })
}

export function convertQuery(feathersQuery) {
  const mangoQuery = {};
  for (let queryField in feathersQuery) {
    switch (queryField) {
      case '$select':
        // mangoQuery.fields = feathersQuery[queryField];
        break;

      case '$sort':
        mangoQuery.sort = convertSort(feathersQuery[queryField]);
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
