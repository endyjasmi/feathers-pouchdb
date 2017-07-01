const errors = require('feathers-errors');

export function create(database, data) {
  return database.bulkDocs(data)
    .then(responses => responses.map((response, index) => {
      if (!response.ok) {
        throw new errors.BadRequest(response.message);
      }
      return Object.assign(data[index], {
        _id: response.id,
        _rev: response.rev
      });
    }));
}

export function find(database, feathersQuery) {
  const query = convertQuery(feathersQuery);
  return database.find(query)
    .then(response => response.docs);
}

export function update(database, feathersQuery, data) {
  return find(database, feathersQuery)
    .then(documents => {
      const operations = documents.map(document => Object.assign(data, {
        _id: document._id,
        _rev: document._rev
      }));
      return Promise.all([operations, database.bulkDocs(operations)]);
    })
    .then(result => {
      const operations = result[0];
      const responses = result[1];
      return responses.map((response, index) => {
        if (!response.ok) {
          throw new errors.Conflict(response.message);
        }
        return Object.assign(operations, {
          _id: response.id,
          _rev: response.rev
        });
      });
    });
}

export function patch(database, feathersQuery, data) {
  return find(database, feathersQuery)
    .then(documents => {
      const operations = documents.map(document => Object.assign(document, data, {
        _id: document._id,
        _rev: document._rev
      }));
      return Promise.all([operations, database.bulkDocs(operations)]);
    })
    .then(result => {
      const operations = result[0];
      const responses = result[1];
      return responses.map((response, index) => {
        if (!response.ok) {
          throw new errors.Conflict(response.message);
        }
        return Object.assign(operations[index], {
          _id: response.id,
          _rev: response.rev
        });
      });
    });
}

export function remove(database, feathersQuery) {
  return find(database, feathersQuery)
    .then(documents => {
      const operations = documents.map(document => Object.assign(document, {
        _deleted:true
      }));
      return Promise.all([operations, database.bulkDocs(operations)]);
    })
    .then(result => {
      const operations = result[0];
      const responses = result[1];
      return responses.map((response, index) => {
        if (!response.ok) {
          throw new errors.Conflict(response.message);
        }
        return Object.assign(operations, {
          _id: response.id,
          _rev: response.rev
        });
      });
    });
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
